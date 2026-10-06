import Link from "next/link";
import { Suspense } from "react";

import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込み、同じ詳細度のルールを上書きする。
import "./_mock/home-search.css";
import { SkeletonList } from "@/components/SkeletonList";
import { getSessionUser } from "@/server/auth";
import { getCatalogSearch, listSearchSuggestions } from "@/server/queries/catalog-search";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { HomeHero } from "./_components/HomeHero";
import { buildHeroSearchOptions } from "./_components/home-hero-options";
import { HomeInvitations } from "./_components/HomeInvitations";
import { HomeLetter } from "./_components/HomeLetter";
import { HomeMaterialCard } from "./_components/HomeMaterialCard";
import { HomeMaterialMarquee } from "./_components/HomeMaterialMarquee";
import { HomeVoices } from "./_components/HomeVoices";

// 見本 S.home。外枠（ヘッダー・お知らせ・フッター）は MockPageShell、スタイルは mock.css（.fm 配下）と home-search.css。
export default function HomePage() {
  return (
    <MockPageShell showHeaderSearch={false}>
      <Suspense fallback={<HomeHero />}>
        <HomeHeroWithOptions />
      </Suspense>
      <section aria-labelledby="home-materials-heading">
        <div className="sec-h" style={{ marginTop: 26 }}>
          <h2 id="home-materials-heading">掲載資材一覧</h2>
          <Link className="link-more" href="/search">
            すべて見る <span aria-hidden="true">→</span>
          </Link>
        </div>
        <Suspense
          fallback={<SkeletonList variant="materialScroll" label="掲載資材を読み込んでいます" />}
        >
          <HomeMaterials />
        </Suspense>
      </section>

      <Suspense
        fallback={<SkeletonList variant="materialReports" label="生産者の声を読み込んでいます" />}
      >
        <HomeVoices />
      </Suspense>

      <HomeLetter />

      <Suspense fallback={null}>
        <HomeAccountInvitations />
      </Suspense>
    </MockPageShell>
  );
}

async function HomeHeroWithOptions() {
  const [catalog, search] = await Promise.all([getCatalogSearch(), listSearchSuggestions()]);
  if (!search.ok) throw new Error("検索候補を取得できませんでした。");
  return <HomeHero searchOptions={buildHeroSearchOptions(catalog, search.data)} />;
}

async function HomeMaterials() {
  const [materials, catalog] = await Promise.all([listHomeMaterials(), getCatalogSearch()]);
  if (materials.length === 0) {
    return (
      <div className="card pad">
        <p className="muted" style={{ fontSize: 12.5 }}>
          表示できる資材がまだありません。
        </p>
      </div>
    );
  }
  return (
    <>
      <HomeMaterialMarquee>
        {materials.map((material) => {
          const counts = catalog.counts.find((row) => row.material_id === material.id);
          return (
            <HomeMaterialCard
              key={material.id}
              href={`/materials/${material.id}`}
              name={material.name}
              maker={material.manufacturer_name}
              rating={material.review_count > 0 ? material.avg_rating : null}
              reviewCount={material.review_count}
              reportCount={counts?.report_count ?? null}
              savedCount={counts?.saved_count ?? null}
              categories={material.categories}
              imageSrc={material.primaryImage?.url}
            />
          );
        })}
      </HomeMaterialMarquee>
      <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
        ※ 表示順はランダムです（広告・優先枠ではありません）。
      </div>
    </>
  );
}

async function HomeAccountInvitations() {
  const session = await getSessionUser();
  return <HomeInvitations showSignup={session === null} />;
}
