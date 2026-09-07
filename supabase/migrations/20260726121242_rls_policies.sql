-- =============================================================================
-- v2 スキーマ 6/8: RLS（第二防御）・テーブル権限・カラム単位権限・Storage
-- 正: docs/rebuild/01-domain-model.md §5「RLS 設計」・§4「認証設計」
-- =============================================================================
-- 方針
--   * public スキーマの全テーブルで ROW LEVEL SECURITY を有効化する（動的に
--     全テーブルを走査するので、テーブルの取りこぼしが起きない）
--   * 権限判定は JWT の app_metadata 直読み（app スキーマの関数）。判定のために
--     profiles / seller_accounts を JOIN しない
--   * admin は account_type='admin'。書き込み系はさらに aal='aal2' を要求する
--   * カラム単位の制御は2種類を使い分ける
--       - 読ませない（seller_accounts.contact_*）→ カラム権限（GRANT SELECT (…)）
--       - 書かせない（materials 分類・検索層、seller_accounts 管理カラム）
--         → 旧値と新値を比較するトリガー
--   * service_role（src/server）は BYPASSRLS かつトリガーの対象外。第一防御は
--     Next.js 側で同じ判定を行う
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 全テーブルで RLS を有効化する
-- -----------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select c.oid::regclass as tbl
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format('alter table %s enable row level security', r.tbl);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. テーブル権限（RLS の手前の第0段。既定の広い権限を落としてから付け直す）
--    ※ 今後 migration でテーブルを追加した場合は Supabase の default
--       privileges で anon/authenticated に ALL が付くため、同様の絞り込みを
--       その migration でも行う
-- -----------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on all tables in schema public to anon, authenticated;

-- seller_accounts の contact_* は内部カラム。テーブル権限の段で読めなくする
-- （公開ビュー public_sellers は security_invoker=true なのでこの制限が効く）。
revoke select on public.seller_accounts from anon, authenticated;
grant select (
  id, official_name, seller_type, login_id, location, region_scope,
  website_url, logo_url, profile_text, status, approved_at,
  created_at, updated_at
) on public.seller_accounts to anon, authenticated;

-- anon の書き込みは出品者申請と閲覧ログのみ
grant insert on public.seller_accounts to anon;
grant insert on public.view_events to anon;

-- authenticated は RLS で行を絞る前提で CRUD を許可する
grant insert, update, delete on all tables in schema public to authenticated;

-- Phase 2 の Q&A は v1 では書き込ませない（ポリシーも作らない）
revoke insert, update, delete on public.questions, public.answers from authenticated;

-- view_events は追記専用
revoke update, delete on public.view_events from authenticated;

-- -----------------------------------------------------------------------------
-- 3. カラム単位の書き込み禁止トリガー（汎用）
--    trigger 引数に「admin / service_role 以外は変更できないカラム」を渡す。
--    SECURITY DEFINER 関数（集計トリガー等）からの更新は current_user が
--    postgres になるため素通りする。
-- -----------------------------------------------------------------------------

create or replace function app.enforce_protected_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  protected_columns text[] := tg_argv[0]::text[];
  changed text[] := '{}';
  col text;
  old_row jsonb := to_jsonb(old);
  new_row jsonb := to_jsonb(new);
begin
  -- migration・service_role（src/server）・SECURITY DEFINER 経由は対象外
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if app.is_admin() then
    return new;
  end if;

  foreach col in array protected_columns loop
    if old_row -> col is distinct from new_row -> col then
      changed := changed || col;
    end if;
  end loop;

  if array_length(changed, 1) > 0 then
    raise exception
      '% のカラム % は運営（admin）のみ変更できます', tg_table_name, array_to_string(changed, ', ')
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function app.enforce_protected_columns() is
  'UPDATE のカラム単位権限。tg_argv[0] に admin 専用カラムの text[] を渡す（01 §5）。';

-- materials: 分類・検索層と集計カラムは Farmille（admin）のみ変更可。
-- 出品者の UPDATE は一次情報層カラムに限られる。
create trigger enforce_material_column_scope
  before update on public.materials
  for each row
  execute function app.enforce_protected_columns(
    '{id,name,manufacturer_name,product_type,jbsa_class,sales_status,seller_id,review_count,avg_rating,control_plot_ratio,created_at}'
  );

-- seller_accounts: 出品者本人が変更できるのは自己紹介・連絡先系のみ。
-- 審査結果（status・approved_at）とログイン系は admin のみ。
create trigger enforce_seller_account_column_scope
  before update on public.seller_accounts
  for each row
  execute function app.enforce_protected_columns(
    '{id,auth_user_id,official_name,seller_type,login_id,status,approved_at,invite_code,created_at}'
  );

-- -----------------------------------------------------------------------------
-- 4. 所有判定のヘルパー（業務テーブルの親子関係を辿るもの。権限ロール判定では
--    ないので JOIN 禁止の対象外）
-- -----------------------------------------------------------------------------

create or replace function app.owns_material(p_material_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.is_seller()
     and exists (
       select 1
       from public.materials m
       where m.id = p_material_id
         and m.seller_id = app.seller_id()
     );
$$;

comment on function app.owns_material(uuid) is 'claim 済み自社資材かどうか（出品者のみ true）。';

create or replace function app.owns_article(p_article_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.is_seller()
     and exists (
       select 1
       from public.articles a
       where a.id = p_article_id
         and a.seller_id = app.seller_id()
     );
$$;

-- -----------------------------------------------------------------------------
-- 5. ポリシー: アカウント
-- -----------------------------------------------------------------------------

-- profiles: 実テーブルは本人（と admin）のみ。公開情報は public_profiles ビュー。
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or app.is_admin());

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid() and app.is_general());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy profiles_delete_self on public.profiles
  for delete to authenticated
  using (user_id = auth.uid());

-- profile_crops: 主な作目は公開プロフィールで表示するため読み取りは全員。
create policy profile_crops_select_all on public.profile_crops
  for select to anon, authenticated
  using (true);

create policy profile_crops_insert_self on public.profile_crops
  for insert to authenticated
  with check (user_id = auth.uid());

create policy profile_crops_update_self on public.profile_crops
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy profile_crops_delete_self on public.profile_crops
  for delete to authenticated
  using (user_id = auth.uid());

-- seller_accounts: approved は全員が読める（contact_* はカラム権限で不可視）。
create policy seller_accounts_select_approved on public.seller_accounts
  for select to anon, authenticated
  using (status = 'approved');

create policy seller_accounts_select_self on public.seller_accounts
  for select to authenticated
  using (auth_user_id = auth.uid() or app.is_admin());

create policy seller_accounts_insert_apply on public.seller_accounts
  for insert to anon, authenticated
  with check (status = 'applied' and auth_user_id is null and approved_at is null);

create policy seller_accounts_update_self on public.seller_accounts
  for update to authenticated
  using (auth_user_id = auth.uid() and status = 'approved')
  with check (auth_user_id = auth.uid() and status = 'approved');

create policy seller_accounts_update_admin on public.seller_accounts
  for update to authenticated
  using (app.is_admin_writer())
  with check (app.is_admin_writer());

create policy seller_accounts_delete_admin on public.seller_accounts
  for delete to authenticated
  using (app.is_admin_writer());

-- -----------------------------------------------------------------------------
-- 6. ポリシー: 分類マスタ（Farmille 所有）
-- -----------------------------------------------------------------------------

create policy crop_groups_select_all on public.crop_groups
  for select to anon, authenticated using (true);
create policy crop_groups_insert_admin on public.crop_groups
  for insert to authenticated with check (app.is_admin_writer());
create policy crop_groups_update_admin on public.crop_groups
  for update to authenticated using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy crop_groups_delete_admin on public.crop_groups
  for delete to authenticated using (app.is_admin_writer());

create policy crops_select_all on public.crops
  for select to anon, authenticated using (true);
create policy crops_insert_admin on public.crops
  for insert to authenticated with check (app.is_admin_writer());
create policy crops_update_admin on public.crops
  for update to authenticated using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy crops_delete_admin on public.crops
  for delete to authenticated using (app.is_admin_writer());

create policy tags_select_all on public.tags
  for select to anon, authenticated using (true);
create policy tags_insert_admin on public.tags
  for insert to authenticated with check (app.is_admin_writer());
create policy tags_update_admin on public.tags
  for update to authenticated using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy tags_delete_admin on public.tags
  for delete to authenticated using (app.is_admin_writer());

-- -----------------------------------------------------------------------------
-- 7. ポリシー: 資材
-- -----------------------------------------------------------------------------

create policy materials_select_all on public.materials
  for select to anon, authenticated using (true);

create policy materials_insert_admin on public.materials
  for insert to authenticated with check (app.is_admin_writer());

create policy materials_update_admin on public.materials
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());

-- claim 済み出品者の UPDATE。変更可能カラムは
-- enforce_material_column_scope トリガーで一次情報層に限定される。
create policy materials_update_seller on public.materials
  for update to authenticated
  using (app.is_seller() and seller_id = app.seller_id())
  with check (app.is_seller() and seller_id = app.seller_id());

create policy materials_delete_admin on public.materials
  for delete to authenticated using (app.is_admin_writer());

-- 分類・検索層（タグ紐づけ）は Farmille のみ
create policy material_tags_select_all on public.material_tags
  for select to anon, authenticated using (true);
create policy material_tags_insert_admin on public.material_tags
  for insert to authenticated with check (app.is_admin_writer());
create policy material_tags_update_admin on public.material_tags
  for update to authenticated using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy material_tags_delete_admin on public.material_tags
  for delete to authenticated using (app.is_admin_writer());

-- 一次情報層（画像・エビデンス・出典）は自社資材のみ出品者が編集可
create policy material_images_select_all on public.material_images
  for select to anon, authenticated using (true);
create policy material_images_insert_owner on public.material_images
  for insert to authenticated
  with check (app.is_admin_writer() or app.owns_material(material_id));
create policy material_images_update_owner on public.material_images
  for update to authenticated
  using (app.is_admin_writer() or app.owns_material(material_id))
  with check (app.is_admin_writer() or app.owns_material(material_id));
create policy material_images_delete_owner on public.material_images
  for delete to authenticated
  using (app.is_admin_writer() or app.owns_material(material_id));

create policy material_evidences_select_all on public.material_evidences
  for select to anon, authenticated using (true);
create policy material_evidences_insert_owner on public.material_evidences
  for insert to authenticated
  with check (app.is_admin_writer() or app.owns_material(material_id));
create policy material_evidences_update_owner on public.material_evidences
  for update to authenticated
  using (app.is_admin_writer() or app.owns_material(material_id))
  with check (app.is_admin_writer() or app.owns_material(material_id));
create policy material_evidences_delete_owner on public.material_evidences
  for delete to authenticated
  using (app.is_admin_writer() or app.owns_material(material_id));

create policy material_sources_select_all on public.material_sources
  for select to anon, authenticated using (true);
create policy material_sources_insert_owner on public.material_sources
  for insert to authenticated
  with check (app.is_admin_writer() or app.owns_material(material_id));
create policy material_sources_update_owner on public.material_sources
  for update to authenticated
  using (app.is_admin_writer() or app.owns_material(material_id))
  with check (app.is_admin_writer() or app.owns_material(material_id));
create policy material_sources_delete_owner on public.material_sources
  for delete to authenticated
  using (app.is_admin_writer() or app.owns_material(material_id));

-- 分類変更申請は起票した出品者と admin のみ
create policy material_edit_requests_select_own on public.material_edit_requests
  for select to authenticated
  using (app.is_admin() or (app.is_seller() and seller_id = app.seller_id()));
create policy material_edit_requests_insert_seller on public.material_edit_requests
  for insert to authenticated
  with check (app.is_seller() and seller_id = app.seller_id() and status = 'open');
create policy material_edit_requests_update_admin on public.material_edit_requests
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy material_edit_requests_delete_admin on public.material_edit_requests
  for delete to authenticated using (app.is_admin_writer());

-- -----------------------------------------------------------------------------
-- 8. ポリシー: レビュー
-- -----------------------------------------------------------------------------

create policy reviews_select_published on public.reviews
  for select to anon, authenticated
  using (status = 'published');

create policy reviews_select_own on public.reviews
  for select to authenticated
  using (author_user_id = auth.uid() or app.is_admin());

create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (app.is_general() and author_user_id = auth.uid() and status = 'published');

-- hidden（通報対応で非公開化）にされたレビューは本人には編集させない
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (author_user_id = auth.uid() and status = 'published')
  with check (author_user_id = auth.uid() and status = 'published');

create policy reviews_update_admin on public.reviews
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());

create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (author_user_id = auth.uid());

create policy reviews_delete_admin on public.reviews
  for delete to authenticated
  using (app.is_admin_writer());

-- review_photos: 親 reviews の RLS がそのまま可視性を決める
create policy review_photos_select_visible on public.review_photos
  for select to anon, authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id));

create policy review_photos_insert_own on public.review_photos
  for insert to authenticated
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid() and r.status = 'published'
    )
  );

create policy review_photos_update_own on public.review_photos
  for update to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid() and r.status = 'published'
    )
  )
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid() and r.status = 'published'
    )
  );

create policy review_photos_delete_own on public.review_photos
  for delete to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 9. ポリシー: 使用レポート（編集局ワークフロー）
-- -----------------------------------------------------------------------------

create policy usage_reports_select_published on public.usage_reports
  for select to anon, authenticated
  using (status = 'published');

create policy usage_reports_select_own on public.usage_reports
  for select to authenticated
  using (author_user_id = auth.uid() or app.is_admin());

create policy usage_reports_insert_own on public.usage_reports
  for insert to authenticated
  with check (
    app.is_general()
    and author_user_id = auth.uid()
    and status in ('draft', 'pending')
  );

-- 本人は draft のみ編集でき、提出（draft → pending）まで行える
create policy usage_reports_update_own_draft on public.usage_reports
  for update to authenticated
  using (author_user_id = auth.uid() and status = 'draft')
  with check (author_user_id = auth.uid() and status in ('draft', 'pending'));

create policy usage_reports_update_admin on public.usage_reports
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());

create policy usage_reports_delete_own_draft on public.usage_reports
  for delete to authenticated
  using (author_user_id = auth.uid() and status = 'draft');

create policy usage_reports_delete_admin on public.usage_reports
  for delete to authenticated
  using (app.is_admin_writer());

-- 子テーブル3種は親の可視性・編集可否に従う
create policy usage_report_applications_select_visible on public.usage_report_applications
  for select to anon, authenticated
  using (exists (select 1 from public.usage_reports ur where ur.id = usage_report_id));
create policy usage_report_applications_write_own on public.usage_report_applications
  for all to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.usage_reports ur
      where ur.id = usage_report_id and ur.author_user_id = auth.uid() and ur.status = 'draft'
    )
  )
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.usage_reports ur
      where ur.id = usage_report_id and ur.author_user_id = auth.uid() and ur.status = 'draft'
    )
  );

create policy usage_report_media_select_visible on public.usage_report_media
  for select to anon, authenticated
  using (exists (select 1 from public.usage_reports ur where ur.id = usage_report_id));
create policy usage_report_media_write_own on public.usage_report_media
  for all to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.usage_reports ur
      where ur.id = usage_report_id and ur.author_user_id = auth.uid() and ur.status = 'draft'
    )
  )
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.usage_reports ur
      where ur.id = usage_report_id and ur.author_user_id = auth.uid() and ur.status = 'draft'
    )
  );

create policy usage_report_metrics_select_visible on public.usage_report_metrics
  for select to anon, authenticated
  using (exists (select 1 from public.usage_reports ur where ur.id = usage_report_id));
create policy usage_report_metrics_write_own on public.usage_report_metrics
  for all to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.usage_reports ur
      where ur.id = usage_report_id and ur.author_user_id = auth.uid() and ur.status = 'draft'
    )
  )
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.usage_reports ur
      where ur.id = usage_report_id and ur.author_user_id = auth.uid() and ur.status = 'draft'
    )
  );

-- -----------------------------------------------------------------------------
-- 10. ポリシー: コレクション・リアクション・閲覧ログ
-- -----------------------------------------------------------------------------

create policy saved_materials_all_self on public.saved_materials
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy helpful_votes_all_self on public.helpful_votes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 閲覧ログは誰でも追記でき、生ログは admin のみ読める（集計はビュー経由）
create policy view_events_insert_any on public.view_events
  for insert to anon, authenticated
  with check (viewer_user_id is null or viewer_user_id = auth.uid());

create policy view_events_select_admin on public.view_events
  for select to authenticated
  using (app.is_admin());

-- -----------------------------------------------------------------------------
-- 11. ポリシー: 記事
-- -----------------------------------------------------------------------------

create policy articles_select_published on public.articles
  for select to anon, authenticated
  using (status = 'published');

create policy articles_select_own on public.articles
  for select to authenticated
  using ((app.is_seller() and seller_id = app.seller_id()) or app.is_admin());

create policy articles_insert_seller on public.articles
  for insert to authenticated
  with check (app.is_seller() and seller_id = app.seller_id());

create policy articles_update_seller on public.articles
  for update to authenticated
  using (app.is_seller() and seller_id = app.seller_id())
  with check (app.is_seller() and seller_id = app.seller_id());

create policy articles_update_admin on public.articles
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());

create policy articles_delete_seller on public.articles
  for delete to authenticated
  using (app.is_seller() and seller_id = app.seller_id());

create policy articles_delete_admin on public.articles
  for delete to authenticated
  using (app.is_admin_writer());

create policy article_materials_select_visible on public.article_materials
  for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));

create policy article_materials_write_owner on public.article_materials
  for all to authenticated
  using (app.is_admin_writer() or app.owns_article(article_id))
  with check (app.is_admin_writer() or app.owns_article(article_id));

-- -----------------------------------------------------------------------------
-- 12. ポリシー: 通報
-- -----------------------------------------------------------------------------

create policy content_reports_select_own on public.content_reports
  for select to authenticated
  using (reporter_user_id = auth.uid() or app.is_admin());

create policy content_reports_insert_self on public.content_reports
  for insert to authenticated
  with check (reporter_user_id = auth.uid() and status = 'open');

create policy content_reports_update_admin on public.content_reports
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());

create policy content_reports_delete_admin on public.content_reports
  for delete to authenticated
  using (app.is_admin_writer());

-- -----------------------------------------------------------------------------
-- 13. ポリシー: Phase 2 の Q&A（SELECT のみ。書き込みポリシーは作らない＝deny）
-- -----------------------------------------------------------------------------

create policy questions_select_all on public.questions
  for select to anon, authenticated using (true);

create policy answers_select_all on public.answers
  for select to anon, authenticated using (true);

-- -----------------------------------------------------------------------------
-- 14. Storage バケットとパス強制 RLS
--     パス規約は {所有者id}/…（第1階層で所有者を判定する）
--       avatars / review-photos / report-media … 一般ユーザー本人（auth.uid）
--       material-images / article-images      … 出品者（seller_id）＋ admin
--     公開読み取りは全バケット可（D6）
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('material-images', 'material-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('review-photos', 'review-photos', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('report-media', 'report-media', true, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('article-images', 'article-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy farmille_storage_public_read on storage.objects
  for select to anon, authenticated
  using (
    bucket_id in ('avatars', 'material-images', 'review-photos', 'report-media', 'article-images')
  );

create policy farmille_storage_general_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.is_general()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy farmille_storage_general_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.is_general()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.is_general()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy farmille_storage_general_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.is_general()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy farmille_storage_seller_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('material-images', 'article-images')
    and (
      (app.is_seller() and (storage.foldername(name))[1] = app.seller_id()::text)
      or app.is_admin_writer()
    )
  );

create policy farmille_storage_seller_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('material-images', 'article-images')
    and (
      (app.is_seller() and (storage.foldername(name))[1] = app.seller_id()::text)
      or app.is_admin_writer()
    )
  )
  with check (
    bucket_id in ('material-images', 'article-images')
    and (
      (app.is_seller() and (storage.foldername(name))[1] = app.seller_id()::text)
      or app.is_admin_writer()
    )
  );

create policy farmille_storage_seller_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('material-images', 'article-images')
    and (
      (app.is_seller() and (storage.foldername(name))[1] = app.seller_id()::text)
      or app.is_admin_writer()
    )
  );
