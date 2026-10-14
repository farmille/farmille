import { css, cx } from "../../../../styled-system/css";
import {
  AppBar,
  ArtMini,
  ArticleCard,
  Badge,
  Button,
  EmptyState,
  MaterialCard,
  ReportCard,
  ReviewCard,
  SectionHeading,
  StarRating,
  StatCard,
  TagChip,
} from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { FabBar } from "@/components/FabBar";
import { Input, Select, Textarea } from "@/components/form";
import { UiKitInteractiveDemos } from "./Interactive";

const page = css({
  minH: "100vh",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
  maxW: "375px",
  mx: "auto",
  pb: "10",
});

const section = css({
  mt: "8",
  px: "4",
});

const sectionTitle = css({
  textStyle: "title",
  mb: "1",
});

const sectionLead = css({
  textStyle: "supporting",
  color: "text.muted",
  mb: "3",
});

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
});

const row = css({
  display: "flex",
  gap: "2.5",
  overflowX: "auto",
  pb: "1",
});

const phoneChrome = css({
  position: "relative",
  bg: "surface.panel",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  overflow: "hidden",
  minH: "200px",
});

const label = css({
  fontSize: "2xs",
  color: "text.subtle",
  mb: "1.5",
  fontWeight: "semibold",
});

export function UiCatalog() {
  return (
    <main className={page}>
      <div className={css({ px: "4", pt: "6", pb: "2" })}>
        <h1 className={css({ fontSize: "3xl" })}>UI Kit</h1>
        <p className={css({ textStyle: "supporting", color: "text.muted", mt: "2" })}>
          T-21 共通コンポーネント。375px 幅でモックと並べて比較する。用語は
          D8（感想口コミ／実証詳細レポート）。
        </p>
      </div>

      <section className={section}>
        <h2 className={sectionTitle}>AppBar</h2>
        <p className={sectionLead}>home 型／戻る型（共有あり）。</p>
        <div className={stack}>
          <div className={phoneChrome}>
            <AppBar chrome="public" variant="home" />
          </div>
          <div className={phoneChrome}>
            <AppBar chrome="public" title="Skeepon" shareHref="#" backHref="/" />
          </div>
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>BottomNav</h2>
        <p className={sectionLead}>5枠・中央は丸型＋。現在地ハイライト。</p>
        <div className={phoneChrome}>
          <BottomNav active="home" placement="container" />
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>FabBar</h2>
        <p className={sectionLead}>実証詳細レポート＋感想口コミの固定バー。</p>
        <div className={cx(phoneChrome, css({ position: "relative", h: "88px" }))}>
          <FabBar />
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>MaterialCard</h2>
        <p className={sectionLead}>横スクロール用と一覧用。</p>
        <p className={label}>scroll</p>
        <div className={row}>
          <MaterialCard
            variant="scroll"
            name="Skeepon"
            maker="〇〇株式会社"
            official
            rating={4.2}
            reviewCount={32}
          />
          <MaterialCard
            variant="scroll"
            name="ボンバルディア"
            maker="△△バイオ"
            official
            rating={4}
            reviewCount={18}
          />
          <MaterialCard
            variant="scroll"
            name="グロウエイド"
            maker="□□アグリ"
            rating={4.6}
            reviewCount={11}
          />
        </div>
        <p className={cx(label, css({ mt: "3" }))}>list</p>
        <MaterialCard
          variant="list"
          name="Skeepon"
          maker="〇〇株式会社"
          official
          rating={4.2}
          reviewCount={32}
          articleCount={5}
          description="高温期の草勢維持に定評。施設園芸を中心に導入実績多数。"
        />
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>ReviewCard</h2>
        <p className={sectionLead}>閲覧数なし。作物チップ・参考になった。</p>
        <div className={stack}>
          <ReviewCard
            handle="やまちゃん農園"
            crop="ミニトマト"
            rating={4}
            helpfulCount={12}
            body="高温期でも草勢が保てました。散布もしやすい。"
            materialName="Skeepon"
          />
          <ReviewCard
            handle="のはら農園"
            crop="いちご"
            rating={5}
            helpfulCount={9}
            body="定植後の初期生育が明らかに良くなりました。"
            photoCount={2}
          />
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>ReportCard</h2>
        <p className={sectionLead}>実証詳細レポート。scroll / grid / list。</p>
        <p className={label}>scroll</p>
        <div className={row}>
          <ReportCard
            layout="scroll"
            title="Skeepon 実証詳細レポート"
            author="しおさい農園"
            crop="ミニトマト"
            helpfulCount={24}
            viewCount={210}
          />
          <ReportCard
            layout="scroll"
            title="ボンバルディア 実証詳細レポート"
            author="いちご屋A"
            crop="いちご"
            helpfulCount={15}
            viewCount={142}
          />
        </div>
        <p className={cx(label, css({ mt: "3" }))}>list</p>
        <ReportCard
          layout="list"
          title="Skeepon 実証詳細レポート"
          author="たなか農園"
          crop="ミニトマト"
          helpfulCount={8}
          viewCount={96}
        />
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>ArticleCard / ArtMini</h2>
        <p className={sectionLead}>組織記事カードと簡易行。</p>
        <div className={stack}>
          <ArticleCard
            title="施設トマトにおける高温対策の実践"
            organization="〇〇株式会社"
            typeLabel="メーカー"
            helpfulCount={18}
            viewCount={320}
          />
          <ArtMini
            title="露地栽培での導入事例まとめ"
            organization="〇〇バイオ株式会社"
            typeLabel="メーカー"
          />
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>TagChip / FilterPills / StarRating</h2>
        <p className={sectionLead}>分類色・フィルタ・星入力。</p>
        <div className={css({ mb: "3" })}>
          <p className={label}>分類色（静的）</p>
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5" })}>
            <TagChip category="crop" label="ミニトマト" />
            <TagChip category="concern" label="高温対策" />
            <TagChip category="effect" label="草勢維持" />
            <TagChip category="cond" label="施設園芸" />
            <TagChip category="genre" label="バイオスティミュラント" />
            <TagChip appearance="plain" label="微生物資材" />
          </div>
        </div>
        <UiKitInteractiveDemos />
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>StatCard / SectionHeading / Badge</h2>
        <SectionHeading title="これまでの投稿" href="#" linkLabel="すべて見る" />
        <div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2.5" })}>
          <StatCard value={12} label="感想口コミ" />
          <StatCard value={3} label="実証詳細レポート" />
          <StatCard value={48} label="参考になった" />
        </div>
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            gap: "2",
            mt: "3",
            alignItems: "center",
          })}
        >
          <Badge variant="official">公式</Badge>
          <Badge variant="type">メーカー</Badge>
          <Badge variant="published">公開</Badge>
          <Badge variant="optional">任意</Badge>
          <Badge variant="required">必須</Badge>
        </div>
        <div className={css({ mt: "2" })}>
          <StarRating value={4} />
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>Button / Input / Textarea / Select</h2>
        <p className={sectionLead}>フォーム基本要素。</p>
        <div className={stack}>
          <Button variant="primary">投稿する</Button>
          <Button variant="ghost">キャンセル</Button>
          <Button variant="danger">削除する</Button>
          <Button variant="primary" size="sm">
            感想口コミをすべて見る（32件）
          </Button>
          <Input hideLabel label="キーワード" placeholder="作物・悩み・資材名を入力" />
          <Textarea hideLabel label="本文" placeholder="本文を入力" />
          <Select
            hideLabel
            label="作物"
            options={[
              { value: "tomato", label: "ミニトマト" },
              { value: "strawberry", label: "いちご" },
            ]}
            placeholder="選択してください"
          />
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>EmptyState</h2>
        <div
          className={css({
            bg: "surface.card",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "card",
          })}
        >
          <EmptyState
            title="まだ投稿がありません"
            description="感想口コミや実証詳細レポートを書くと、ここに表示されます。"
          />
        </div>
      </section>

      <section className={css({ mt: "8", px: "0" })}>
        <h2 className={css({ textStyle: "title", mb: "3", px: "4" })}>Chrome 組み合わせ</h2>
        <div className={phoneChrome}>
          <AppBar chrome="public" variant="home" />
          <div className={css({ p: "4", pb: "24" })}>
            <SectionHeading title="注目のBS資材" href="/search" linkLabel="探す" />
            <div className={row}>
              <MaterialCard
                variant="scroll"
                name="Skeepon"
                maker="〇〇株式会社"
                official
                rating={4.2}
                reviewCount={32}
              />
            </div>
          </div>
          <BottomNav active="home" placement="container" />
        </div>
      </section>
    </main>
  );
}
