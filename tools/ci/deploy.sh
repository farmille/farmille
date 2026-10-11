#!/usr/bin/env bash
set -euo pipefail
umask 077

sha=${1:?Missing commit SHA}
target=${2:?Missing deployment target}
[[ "$sha" =~ ^[a-f0-9]{40}$ && ( "$target" == production || "$target" == preview ) ]] || exit 1
: "${VERCEL_TOKEN:?}" "${VERCEL_ORG_ID:?}" "${VERCEL_PROJECT_ID:?}" "${GITHUB_REPOSITORY:?}"
task_dir=$(mktemp -d)
trap 'rm -rf "$task_dir"' EXIT
repo_id=$(gh api "repos/$GITHUB_REPOSITORY" --jq .id)
[[ "$repo_id" =~ ^[0-9]+$ ]] || exit 1
if [[ $# -eq 3 ]]; then
  cp "$3" "$task_dir/env.json"
else
  echo '{}' > "$task_dir/env.json"
fi
jq -e 'type == "object" and all(.[]; type == "string")' "$task_dir/env.json" >/dev/null
jq -n --arg project "$VERCEL_PROJECT_ID" --arg repo "$repo_id" --arg sha "$sha" \
  --arg target "$target" --slurpfile env "$task_dir/env.json" '
  {name: "farmille", project: $project, gitSource: {type: "github", repoId: $repo, ref: $sha},
   env: $env[0], build: {env: $env[0]}} +
  (if $target == "production" then {target: "production"} else {} end)' > "$task_dir/request.json"
curl --fail --silent --show-error --connect-timeout 10 --max-time 30 -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H 'Content-Type: application/json' --data-binary "@$task_dir/request.json" \
  "https://api.vercel.com/v13/deployments?teamId=$VERCEL_ORG_ID" > "$task_dir/deployment.json"
id=$(jq -er '.id | select(test("^dpl_[a-zA-Z0-9]+$"))' "$task_dir/deployment.json")
for attempt in {1..120}; do
  if [[ "$attempt" -gt 1 ]]; then
    sleep 5
    curl --fail --silent --show-error --connect-timeout 10 --max-time 30 -H "Authorization: Bearer $VERCEL_TOKEN" \
      "https://api.vercel.com/v13/deployments/$id?teamId=$VERCEL_ORG_ID" > "$task_dir/deployment.json"
  fi
  state=$(jq -er .readyState "$task_dir/deployment.json")
  case "$state" in
    READY)
      jq -er '.url | select(test("^[a-zA-Z0-9.-]+\\.vercel\\.app$")) | "https://" + .' "$task_dir/deployment.json"
      exit 0
      ;;
    ERROR|BLOCKED|CANCELED)
      jq -r '[.readyState, .readyStateReason, .errorCode, .errorMessage] | map(select(. != null)) | join(": ")' "$task_dir/deployment.json" >&2
      exit 1
      ;;
    QUEUED|INITIALIZING|BUILDING) ;;
    *) echo "Unexpected deployment state: $state" >&2; exit 1 ;;
  esac
done
echo "Deployment $id exceeded the polling limit" >&2
exit 1
