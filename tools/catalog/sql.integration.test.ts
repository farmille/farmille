import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import * as v from "valibot";
import { expect, it } from "vitest";
import { type CatalogSource } from "./source.ts";
import { planCatalog } from "./plan.ts";
import { applySql } from "./sql.ts";
import { SnapshotSchema, snapshotQuery } from "./snapshot.ts";

const databaseUrl = process.env.CATALOG_TEST_DATABASE_URL;
it.skipIf(!databaseUrl)(
  "実DBで本文と保存を保持し、再実行・削除維持・競合時のロールバック・修正待ちの原稿の保護を確認する",
  () => {
    if (!databaseUrl) throw new Error("CATALOG_TEST_DATABASE_URL が必要です。");
    const address = new URL(databaseUrl);
    if (address.hostname !== "127.0.0.1" || address.port !== "54322")
      throw new Error("専用のローカルDBだけで実行できます。");
    const execute = (sql: string) =>
      execFileSync("psql", [databaseUrl, "-XAt", "-v", "ON_ERROR_STOP=1"], {
        input: sql,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 20_000_000,
      });
    const snapshot = () => v.parse(SnapshotSchema, JSON.parse(execute(snapshotQuery)));
    const id = randomUUID();
    const productId = "PRD-999999";
    const originalVersion = randomUUID();
    const mapping = new Map([[productId, id]]);
    const createdRuns = new Set<string>();
    const apply = (plan: ReturnType<typeof planCatalog>) => {
      createdRuns.add(plan.runId);
      return execute(applySql(plan, source));
    };
    if (
      execute(
        `select count(*) from public.catalog_source_products where source_product_id='${productId}'`,
      ).trim() !== "0"
    )
      throw new Error("検証用の出典IDが使用中です。");
    const source: CatalogSource = {
      製品: [
        {
          product_id: productId,
          表示製品名: `取り込み検証 ${id}`,
          情報掲載責任会社: `検証会社 ${id}`,
          掲載判定: "掲載可",
          非表示フラグ: false,
          正式名称: null,
          読み: null,
          別名: null,
          容器形状: "2 ボトル",
        },
      ],
      タグマスター: [],
      表示値: [
        {
          value_id: "VALUE-1",
          product_id: productId,
          field_code: "main_ingredient",
          tag_id: null,
          確定表示値: "既存の成分",
          表示順: 0,
          状態: "現行レビュー反映値",
          "判断理由・詳細": null,
        },
      ],
      出典: [{ source_id: "SRC-1", URL: "https://example.com/trial", 資料名: "試験資料" }],
      根拠原文: [],
      資材ページのリンク: [
        {
          product_id: productId,
          区分: "概要（製品説明・パンフレット・画像）",
          資料名: "試験資料",
          URL: "https://example.com/trial",
          資料種別: "資料",
          source_id: "SRC-1",
        },
      ],
    };
    const makePlan = () => {
      const state = snapshot();
      const unresolved = planCatalog(source, state, mapping, []);
      return planCatalog(
        source,
        state,
        mapping,
        unresolved.conflicts
          .filter((row) => !row.key.startsWith("material/"))
          .map((row) => ({ ...row, action: "keep_current" })),
      );
    };
    try {
      execute(`insert into public.materials(id,name,manufacturer_name,description,main_components,mechanism,usage_text) values('${id}','取り込み検証 ${id}','検証会社 ${id}','メーカーの説明','既存の成分','メーカーの作用機作','既存の施用方法');
      insert into public.saved_materials(user_id,material_id) select user_id,'${id}' from public.profiles limit 1;
      insert into public.material_images(material_id,url,image_type,sort_order) values('${id}','https://example.com/original.png','package',0);`);
      execute(`select public.set_material_editor_grant('${id}','33333333-3333-4333-8333-333333333333','IMPORT-TEST','33333333-3333-4333-8333-333333333333');
        insert into public.material_page_versions(id,material_id,seller_id,grant_id,base_revision,status,description,main_components,mechanism,content_contract)
          select '${originalVersion}','${id}',seller_id,id,0,'published','メーカーの説明','既存の成分','メーカーの作用機作',2 from public.material_editor_grants where material_id='${id}' and revoked_at is null;
        insert into public.material_page_usages(version_id,method,detail,sort_order) values('${originalVersion}','drench','メーカーの施用方法',0);
        insert into public.material_page_certifications(version_id,title,sort_order) values('${originalVersion}','メーカーの認証',0);
        insert into public.material_page_related_companies(version_id,sort_order,company_name) values('${originalVersion}',0,'メーカーの関係会社');
        insert into public.material_page_links(version_id,group_name,title,url,sort_order) values('${originalVersion}','technical','メーカーの資料','https://example.com/maker.pdf',0);
        insert into public.material_evidences(material_id,evidence_type,title,external_url,sort_order) values('${id}','leaflet','旧資料','https://example.com/legacy.pdf',0);
        select public.create_review_with_crops(p_material_id=>'${id}',p_author_user_id=>'22222222-2222-4222-8222-222222222222',p_rating=>4::smallint,p_body=>'保持する感想口コミ',p_crop_ids=>array[(select id from public.crops order by id limit 1)],p_pesticide_ack=>true);
        update public.materials set published_page_version_id='${originalVersion}',content_revision=1,manufacturer_verified_at=now(),manufacturer_verified_by_seller_id='33333333-3333-4333-8333-333333333333',manufacturer_verification_method='submitted_update' where id='${id}';`);
      const initialState = snapshot();
      const initial = planCatalog(source, initialState, mapping, []);
      const ready = planCatalog(
        source,
        initialState,
        mapping,
        initial.conflicts.map((row) => ({
          ...row,
          action: row.key.startsWith("material/") ? "take_source" : "keep_current",
        })),
      );
      apply(ready);
      apply(ready);
      expect(
        execute(
          `select description||'/'||mechanism from public.material_page_versions where id=(select published_page_version_id from public.materials where id='${id}')`,
        ).trim(),
      ).toBe("メーカーの説明/メーカーの作用機作");
      expect(
        execute(`select count(*) from public.saved_materials where material_id='${id}'`).trim(),
      ).toBe("1");
      expect(
        execute(`select count(*) from public.material_images where material_id='${id}'`).trim(),
      ).toBe("1");
      expect(execute(`select count(*) from public.reviews where material_id='${id}'`).trim()).toBe(
        "1",
      );
      expect(
        execute(
          `select count(*) from public.material_editor_grants where material_id='${id}' and revoked_at is null`,
        ).trim(),
      ).toBe("1");
      expect(
        execute(
          `select manufacturer_verified_at is not null from public.materials where id='${id}'`,
        ).trim(),
      ).toBe("t");
      expect(
        execute(
          `select detail from public.material_page_usages where version_id=(select published_page_version_id from public.materials where id='${id}')`,
        ).trim(),
      ).toBe("メーカーの施用方法");
      expect(
        execute(
          `select company_name from public.material_page_related_companies where version_id=(select published_page_version_id from public.materials where id='${id}')`,
        ).trim(),
      ).toBe("メーカーの関係会社");
      expect(makePlan().materials[0].changed).toEqual([]);
      execute(
        `delete from public.material_page_links where version_id=(select published_page_version_id from public.materials where id='${id}');`,
      );
      const afterDeletion = makePlan();
      expect(afterDeletion.conflicts).toEqual([]);
      expect(afterDeletion.materials[0].fields.links).toEqual([]);
      apply(afterDeletion);
      expect(
        execute(
          `select count(*) from public.material_page_versions where material_id='${id}'`,
        ).trim(),
      ).toBe("2");
      source.資材ページのリンク[0].資料名 = "改訂された試験資料";
      const conflict = makePlan();
      expect(conflict.conflicts).toHaveLength(1);
      const live = snapshot();
      const allConflicts = planCatalog(source, live, mapping, []).conflicts;
      const resolved = planCatalog(
        source,
        live,
        mapping,
        allConflicts.map((row) => ({ ...row, action: "keep_current" })),
      );
      apply(resolved);
      expect(makePlan().conflicts).toEqual([]);
      expect(makePlan().materials[0].fields.links).toEqual([]);
      const stale = makePlan();
      const runs = execute("select count(*) from public.catalog_import_runs");
      execute(
        `update public.material_page_usages set detail='計画後の更新' where version_id=(select published_page_version_id from public.materials where id='${id}');`,
      );
      expect(() => apply(stale)).toThrow();
      expect(execute("select count(*) from public.catalog_import_runs")).toBe(runs);
      expect(execute(`select description from public.materials where id='${id}'`).trim()).toBe(
        "メーカーの説明",
      );
      execute(`insert into public.material_page_versions(material_id,seller_id,grant_id,base_revision,status)
        select '${id}',g.seller_id,g.id,m.content_revision,'returned'
          from public.material_editor_grants g join public.materials m on m.id=g.material_id
          where g.material_id='${id}' and g.revoked_at is null;`);
      source.製品[0].表示製品名 = `改訂された取り込み検証 ${id}`;
      expect(makePlan().conflicts.map((row) => [row.key, row.reason])).toEqual([
        [`material/${id}/name`, "メーカー原稿（returned）があるため変更できません。"],
      ]);
      execute(`update public.materials set content_revision=content_revision+1 where id='${id}';`);
      expect(makePlan().conflicts).toEqual([]);
    } finally {
      execute(`begin;
      update public.materials set published_page_version_id=null where id='${id}';
      delete from public.material_page_versions where material_id='${id}';
      delete from public.material_editor_grants where material_id='${id}';
      delete from public.catalog_source_evidence where source_product_id='${productId}';
      delete from public.catalog_source_products where source_product_id='${productId}' and material_id='${id}';
      delete from public.catalog_import_baselines where material_id='${id}';
      delete from public.catalog_import_runs where id in(${[...createdRuns].map((runId) => `'${runId}'`).join(",") || "null"});
      delete from public.materials where id='${id}';
      delete from public.manufacturers where name='検証会社 ${id}';
      commit;`);
    }
  },
  30000,
);
