import { MaterialPageSkeleton } from "../_components/MaterialPageSkeleton";

// 感想口コミの投稿画面や一覧に詳細画面の骨格を出さないよう、詳細画面だけの route group に置く
export default function MaterialLoading() {
  return <MaterialPageSkeleton />;
}
