import { AuthScreen } from "@/components/auth/AuthScreen";
import { Skeleton, SkeletonRegion } from "@/components/Skeleton";
import { css } from "../../../styled-system/css";

export default function LoginLoading() {
  return (
    <AuthScreen lead="登録済みのメールアドレスでログインします。" loading title="ログイン">
      <SkeletonRegion label="ログイン画面を読み込んでいます">
        <div className={css({ display: "grid", gap: "3" })}>
          <Skeleton variant="short" />
          <Skeleton variant="control" />
          <Skeleton variant="short" />
          <Skeleton variant="control" />
          <Skeleton variant="control" />
        </div>
      </SkeletonRegion>
    </AuthScreen>
  );
}
