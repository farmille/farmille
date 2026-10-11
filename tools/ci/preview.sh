#!/usr/bin/env bash
set -euo pipefail
umask 077

parent=sajxnypkbybuzsqdguaa
shared=chgrudbattvmcjxhaskh
[[ "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]] || { echo 'Invalid PR number' >&2; exit 1; }
name="farmille-preview-pr-$PR_NUMBER"
repo="$GITHUB_REPOSITORY"
alias="farmille-preview-pr-$PR_NUMBER-farmille.vercel.app"
sb() { supabase "$@"; }
pr() { gh api "repos/$repo/pulls/$PR_NUMBER"; }
require_open() {
  pr | jq -e --arg repo "$repo" '.state == "open" and .head.repo.full_name == $repo and .base.ref == "main"' >/dev/null
}
branch() {
  curl --fail --silent --show-error -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/$parent/branches" |
    jq -c --arg name "$name" '[.[] | select(.name == $name)] | if length <= 1 then .[0] else error("Duplicate branch") end'
}
assert_owned() {
  jq -e --arg name "$name" --arg parent "$parent" --arg shared "$shared" '
    .name == $name and .parent_project_ref == $parent and .is_default == false
    and .project_ref != $parent and .project_ref != $shared
    and (.project_ref | test("^[a-z]{20}$"))' <<< "$1" >/dev/null
}
remove_branch() {
  local item
  item=$(branch) || { echo 'Cannot read branch list' >&2; return 1; }
  if [[ "$item" != null ]]; then
    assert_owned "$item" || return 1
    curl --fail --silent --show-error -X DELETE -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      "https://api.supabase.com/v1/branches/$(jq -r .id <<< "$item")" > /dev/null
    [[ "$(branch)" == null ]]
  fi
}

case "${1:?Missing action}" in
  prepare)
    require_open
    [[ "$DB_MODE" == auto || "$DB_MODE" == shared || "$DB_MODE" == branch ]] || exit 1
    sha=$(pr | jq -er '.head.sha | select(test("^[a-f0-9]{40}$"))')
    migrations=$(gh api --paginate "repos/$repo/pulls/$PR_NUMBER/files" |
      jq -s 'add | any(.[]; (.filename | startswith("supabase/migrations/")) or ((.previous_filename // "") | startswith("supabase/migrations/")))')
    if [[ "$DB_MODE" == auto ]]; then
      DB_MODE=shared
      if [[ "$migrations" == true ]]; then DB_MODE=branch; fi
    elif [[ "$DB_MODE" == shared && "$migrations" == true ]]; then
      echo 'Migration changes require branch mode.' >&2
      exit 1
    fi
    echo "database=$DB_MODE" >> "$GITHUB_OUTPUT"
    [[ "$(pr | jq -r .head.sha)" == "$sha" ]] || exit 1
    echo "sha=$sha" >> "$GITHUB_OUTPUT"
    ;;
  cleanup)
    [[ "$(pr | jq -r .state)" == closed ]] || exit 1
    remove_branch
    ;;
  deploy)
    require_open
    [[ "$(pr | jq -r .head.sha)" == "$PR_SHA" ]] || exit 1
    : "${SUPABASE_ACCESS_TOKEN:?}" "${VERCEL_TOKEN:?}" "${VERCEL_ORG_ID:?}" "${VERCEL_PROJECT_ID:?}"
    task_dir=$(mktemp -d)
    created=false
    finished=false
    cleanup() {
      result=$?
      if [[ "$created" == true && "$finished" == false ]]; then remove_branch || result=1; fi
      rm -rf "$task_dir"
      exit "$result"
    }
    trap cleanup EXIT
    mkdir -p "$task_dir/supabase"
    cp trusted/supabase/config.toml "$task_dir/supabase/config.toml"
    # PR内の設定・hook・スクリプトはrunnerで実行しない。専用DBへSQLだけ渡す。
    [[ ! -L source/supabase && -d source/supabase/migrations && ! -L source/supabase/migrations ]] || exit 1
    [[ -z "$(find source/supabase/migrations -type l -print -quit)" ]] || exit 1
    cp -R source/supabase/migrations "$task_dir/supabase/migrations"
    cp trusted/supabase/seed.sql "$task_dir/supabase/seed.sql"
    ref="$shared"
    if [[ "$DB_MODE" == branch ]]; then
      item=$(branch)
      if [[ "$item" == null ]]; then
        created=true
        sb branches create "$name" --project-ref "$parent" --output json > "$task_dir/created.json"
      fi
      # Supabase の初期化処理が終了してから、新規DBだけ全migrationで初期化する。
      for attempt in {1..90}; do
        item=$(branch)
        assert_owned "$item"
        health=$(jq -r .preview_project_status <<< "$item")
        ref=$(jq -r .project_ref <<< "$item")
        curl --fail --silent --show-error -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
          "https://api.supabase.com/v1/projects/$ref/actions?limit=100" > "$task_dir/actions.json"
        idle=false
        if jq -e --arg id "$(jq -r .id <<< "$item")" '
          [.[] | select(.branch_id == $id)] |
          length > 0 and any(.[].run_steps[]; .name == "migrate") and
          all(.[].run_steps[]; .status == "EXITED" or .status == "DEAD")' "$task_dir/actions.json" >/dev/null; then idle=true; fi
        if [[ "$health" == ACTIVE_HEALTHY && "$idle" == true ]]; then break; fi
        sleep 10
      done
      [[ "$health" == ACTIVE_HEALTHY && "$idle" == true ]] || exit 1
      ref=$(jq -r .project_ref <<< "$item")
      if [[ "$created" == true ]]; then
        sb db reset --linked --project-ref "$ref" --workdir "$task_dir" --yes
      else
        sb db push --project-ref "$ref" --workdir "$task_dir" --skip-vault --yes
      fi
      jq -n --arg url "https://$alias" '{site_url: $url, uri_allow_list: ($url + "/**")}' > "$task_dir/auth.json"
      curl --fail --silent --show-error -X PATCH -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        -H 'Content-Type: application/json' --data-binary "@$task_dir/auth.json" \
        "https://api.supabase.com/v1/projects/$ref/config/auth" > /dev/null
    elif [[ "$DB_MODE" != shared ]]; then
      exit 1
    fi
    printf '%s\n' "$task_dir"/supabase/migrations/*.sql | jq -Rsc '
      split("\n")[:-1] | map(split("/")[-1] |
        if test("^[0-9]+_.+\\.sql$") then capture("^(?<version>[0-9]+)_").version
        else error("Invalid migration filename") end) | sort |
      if length > 0 and length == (unique | length) then . else error("Invalid migration versions") end
    ' > "$task_dir/expected-versions.json"
    jq -n '{query: "select array(select version from supabase_migrations.schema_migrations order by version) as versions, (select count(*) from public.materials) as materials", read_only: true}' > "$task_dir/check-query.json"
    curl --fail --silent --show-error --connect-timeout 10 --max-time 60 -X POST \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H 'Content-Type: application/json' \
      --data-binary "@$task_dir/check-query.json" \
      "https://api.supabase.com/v1/projects/$ref/database/query" > "$task_dir/history.json"
    jq -e --slurpfile expected "$task_dir/expected-versions.json" '
      length == 1 and .[0].versions == $expected[0] and (.[0].materials | type) == "number"
    ' "$task_dir/history.json" >/dev/null
    curl --fail --silent --show-error -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      "https://api.supabase.com/v1/projects/$ref/api-keys" > "$task_dir/keys.json"
    anon=$(jq -er '.[] | select(.name == "anon") | .api_key' "$task_dir/keys.json")
    secret=$(jq -er '.[] | select(.name == "service_role") | .api_key' "$task_dir/keys.json")
    echo "::add-mask::$anon"
    echo "::add-mask::$secret"
    require_open
    [[ "$(pr | jq -r .head.sha)" == "$PR_SHA" ]] || exit 1
    # 管理tokenはVercelのビルド環境に渡さず、対象DBのアプリ用キーだけを指定する。
    jq -n --arg site "https://$alias" --arg url "https://$ref.supabase.co" --arg anon "$anon" --arg secret "$secret" \
      '{NEXT_PUBLIC_SITE_URL: $site, NEXT_PUBLIC_SUPABASE_URL: $url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: $anon, SUPABASE_SECRET_KEY: $secret}' > "$task_dir/env.json"
    bash trusted/tools/ci/deploy.sh "$PR_SHA" preview "$task_dir/env.json" > "$task_dir/deployment.txt"
    deployment=$(cat "$task_dir/deployment.txt")
    [[ "$deployment" =~ ^https://[a-zA-Z0-9.-]+\.vercel\.app$ ]] || exit 1
    jq -n --arg alias "$alias" '{alias: $alias}' > "$task_dir/alias-request.json"
    curl --fail --silent --show-error --connect-timeout 10 --max-time 30 -X POST \
      -H "Authorization: Bearer $VERCEL_TOKEN" -H 'Content-Type: application/json' \
      --data-binary "@$task_dir/alias-request.json" \
      "https://api.vercel.com/v2/deployments/${deployment#https://}/aliases?teamId=$VERCEL_ORG_ID" > "$task_dir/alias.json"
    jq -e --arg alias "$alias" '.alias == $alias and .error == null' "$task_dir/alias.json" >/dev/null
    finished=true
    {
      echo "### PR #$PR_NUMBER Preview"
      echo "Commit: $PR_SHA"
      echo "Database: $DB_MODE ($ref)"
      echo "https://$alias"
    } >> "$GITHUB_STEP_SUMMARY"
    ;;
  *) exit 1 ;;
esac
