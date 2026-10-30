import { getPostActions, type PostTarget } from "@/server/queries/post-actions";
import { PostActions } from "./PostActions";

type PostActionsLoaderProps = {
  target: PostTarget;
  id: string;
  currentPath: string;
  helpfulCount: number;
  own?: boolean;
};

/** 公開カードの保存状態と閲覧数をサーバーで取得する。 */
export async function PostActionsLoader(props: PostActionsLoaderProps) {
  const state = await getPostActions(props.target, props.id);

  return <PostActions {...props} {...state} />;
}
