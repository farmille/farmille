-- =============================================================================
-- ローカル専用シード（T-24 検証用）
-- migration には入れない。supabase db reset 時にだけ適用される。
-- published の記事・使用レポートと、notFound 確認用の draft レポートを入れる。
-- =============================================================================

begin;

-- 固定 UUID（画面確認・スクリーンショット用）
-- user / seller / material / report / article
-- 22222222-... 一般ユーザー（しおさい農園）
-- 33333333-... メーカー出品者
-- 44444444-... JA 出品者（seller_type=ja でも /sellers/[id] へリンクできることを確認）
-- 11111111-... 検証用資材
-- 55555555-... published 使用レポート
-- 66666666-... published 記事（メーカー）
-- 88888888-... published 記事（JA）
-- 77777777-... draft 使用レポート（公開側は notFound）

-- auth.users（profiles / seller の FK 用。ローカル専用パスワード）
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'shiosai@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"account_type":"general"}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'demo-maker@sellers.farmille.internal',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"account_type":"seller","seller_id":"33333333-3333-4333-8333-333333333333"}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'demo-ja@sellers.farmille.internal',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"account_type":"seller","seller_id":"44444444-4444-4444-8444-444444444444"}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    jsonb_build_object(
      'sub', '22222222-2222-4222-8222-222222222222',
      'email', 'shiosai@example.com',
      'email_verified', true
    ),
    'email',
    '22222222-2222-4222-8222-222222222222',
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    jsonb_build_object(
      'sub', '33333333-3333-4333-8333-333333333333',
      'email', 'demo-maker@sellers.farmille.internal',
      'email_verified', true
    ),
    'email',
    '33333333-3333-4333-8333-333333333333',
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '44444444-4444-4444-8444-444444444444',
    jsonb_build_object(
      'sub', '44444444-4444-4444-8444-444444444444',
      'email', 'demo-ja@sellers.farmille.internal',
      'email_verified', true
    ),
    'email',
    '44444444-4444-4444-8444-444444444444',
    now(),
    now(),
    now()
  );

insert into public.profiles (
  user_id,
  handle,
  prefecture_code,
  prefecture_public,
  standpoint,
  bio
) values (
  '22222222-2222-4222-8222-222222222222',
  'しおさい農園',
  12,
  true,
  'farmer',
  '千葉でミニトマトを育てています。'
);

insert into public.seller_accounts (
  id,
  auth_user_id,
  official_name,
  seller_type,
  login_id,
  contact_email,
  contact_name,
  location,
  region_scope,
  website_url,
  profile_text,
  status,
  approved_at
) values
  (
    '33333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    'デモ株式会社',
    'maker',
    'demo-maker',
    'contact@demo-maker.example',
    '山田太郎',
    '東京都',
    '全国',
    'https://example.com/demo-maker',
    '高温対策資材のメーカーです。',
    'approved',
    now()
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '44444444-4444-4444-8444-444444444444',
    'デモ農業協同組合',
    'ja',
    'demo-ja',
    'contact@demo-ja.example',
    '佐藤花子',
    '千葉県',
    '千葉県',
    'https://example.com/demo-ja',
    '地域の栽培支援を行っています。',
    'approved',
    now()
  );

insert into public.materials (
  id,
  name,
  manufacturer_name,
  product_type,
  sales_status,
  description,
  general_use,
  ingredients,
  mechanism,
  usage_text,
  seller_id
) values (
  '11111111-1111-4111-8111-111111111111',
  'アクティビオ検証',
  'デモ株式会社',
  'バイオスティミュラント',
  '公式ページ掲載',
  '高温期の樹勢維持を支援する検証用資材。',
  '施設園芸の高温対策',
  '海藻抽出物・アミノ酸',
  '非生物的ストレス下での代謝維持を支援',
  '1,000倍希釈で葉面散布または灌水施用。',
  '33333333-3333-4333-8333-333333333333'
);

insert into public.usage_reports (
  id,
  material_id,
  author_user_id,
  title,
  status,
  crop_id,
  purpose_tags,
  purpose_note,
  prefecture_code,
  field_name,
  variety,
  planting_date,
  cultivation_type,
  cultivation_tags,
  growth_stage,
  climate_note,
  observed_change,
  negative_note,
  summary,
  pesticide_ack,
  published_at
) values
  (
    '55555555-5555-4555-8555-555555555555',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'アクティビオ検証 使用レポート',
    'published',
    (select id from public.crops where name = 'ミニトマト'),
    array['耐暑性改善', 'しおれ軽減'],
    '灌水量を大きく変えずに、暑い時期の樹勢を維持したかった。',
    12,
    'しおさい農園 第2ハウス',
    'アイコ',
    '2026-03-05',
    '施設栽培（ハウス・ガラス室）',
    array['土耕', 'マルチ'],
    '収穫期（第4〜6花房を収穫中）',
    '晴天が続き、日中のハウス内温度が35℃を超える日が増えていました。特に晴れた日の午後は葉が萎れる株が多く、翌朝には戻るものの、徐々に樹勢が弱くなっているように感じていました。',
    '1回目の使用後は、見た目で分かるほどの変化はありませんでした。

2回目の使用から数日後、使用した株では午後の葉の萎れが使用前よりやや軽くなったように感じました。特に上部の葉が比較的立っており、夕方まで樹勢を維持している株が増えたように見えました。

3回目の使用後も同じ傾向が見られましたが、すべての株に明確な変化があったわけではありません。',
    '使用による葉焼けや変色、生育不良などの悪影響は見られませんでした。',
    '収穫量が増えるような劇的な変化は確認できませんでしたが、暑い時間帯の葉の萎れや樹勢低下を抑える補助としては、一定の可能性を感じました。

通常の灌水作業に追加できるため、使用時の負担も大きくありませんでした。

次回は定植後の早い時期から使用し、使用区と対照区を分けて、収穫量や裂果数なども比較しながらもう一度試したいと思います。',
    true,
    '2026-08-02T03:00:00+09:00'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '下書きの使用レポート（非公開）',
    'draft',
    (select id from public.crops where name = 'ミニトマト'),
    array['高温対策'],
    '下書き確認用',
    12,
    null,
    null,
    null,
    null,
    '{}',
    null,
    null,
    '下書き本文',
    null,
    '下書きまとめ',
    true,
    null
  );

insert into public.usage_report_applications (
  usage_report_id,
  applied_on,
  method,
  detail,
  sort_order
) values
  (
    '55555555-5555-4555-8555-555555555555',
    '2026-06-28',
    '葉・茎・果実に散布',
    '希釈倍率：1,000倍
散布量：100L/10a
散布した範囲：ハウス1棟のうち約100株（約1a）
対照区：あり（隣接する同数の株・他のBS資材なし・条件は同一）',
    1
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '2026-07-08',
    '葉・茎・果実に散布',
    '2回目',
    2
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '2026-07-18',
    '葉・茎・果実に散布',
    '3回目（計3回）',
    3
  );

insert into public.usage_report_media (
  usage_report_id,
  media_type,
  url,
  caption,
  placement,
  sort_order
) values
  (
    '55555555-5555-4555-8555-555555555555',
    'photo',
    'https://placehold.co/800x450/e8f5e9/2e7d32?text=cover',
    '使用区の株全体（2回目の使用から約1週間後・午後3時ごろ）',
    'cover',
    1
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'photo',
    'https://placehold.co/600x800/e8f5e9/2e7d32?text=treated',
    '使用区の株全体',
    'treated',
    2
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'photo',
    'https://placehold.co/600x800/eeeeee/666666?text=control',
    '対照区（同じ日・同じ距離と角度）',
    'untreated',
    3
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'photo',
    'https://placehold.co/800x450/fff3e0/ef6c00?text=harvest',
    '3回目の使用後に、使用区から収穫したミニトマト',
    'summary',
    4
  );

insert into public.usage_report_metrics (
  usage_report_id,
  metric_name,
  treated_value,
  untreated_value,
  unit,
  sort_order
) values
  (
    '55555555-5555-4555-8555-555555555555',
    '可販果率',
    82,
    74,
    '%',
    1
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '1株あたり収量',
    2.1,
    1.9,
    'kg',
    2
  );

insert into public.articles (
  id,
  seller_id,
  title,
  body,
  hero_image_url,
  status,
  published_at
) values
  (
    '66666666-6666-4666-8666-666666666666',
    '33333333-3333-4333-8333-333333333333',
    '高温期のアクティビオ検証活用ガイド',
    E'気温が35℃を超える日が続く高温期は、トマトの樹勢低下や萎れが起きやすくなります。この記事では、高温期におけるアクティビオ検証の効果的な使い方を、現場での実例とあわせて紹介します。\n\nポイントは「散布のタイミング」です。日中の高温時を避け、早朝または夕方の気温が下がる時間帯に、1,000倍希釈で灌水と合わせて施用してください。\n\nまた、高温期は7〜10日間隔での定期的な使用をおすすめします。生育ステージに合わせた使い方の詳細は、公式カタログも参照してください。',
    'https://placehold.co/960x540/e3f2fd/1565c0?text=article-hero',
    'published',
    '2026-06-18T10:00:00+09:00'
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    '44444444-4444-4444-8444-444444444444',
    'いちご栽培における高温対策の実証結果',
    E'JAとしての実証ほ場での観察結果をまとめました。\n\n高温期の樹勢維持には、資材単体だけでなく、遮光と灌水の見直しが重要です。アクティビオ検証は補助的な手段として位置づけています。',
    'https://placehold.co/960x540/fce4ec/c2185b?text=ja-article',
    'published',
    '2026-05-20T09:00:00+09:00'
  );

insert into public.article_materials (article_id, material_id) values
  ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111'),
  ('88888888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111');

insert into public.helpful_votes (user_id, target_type, target_id) values
  (
    '22222222-2222-4222-8222-222222222222',
    'usage_report',
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'article',
    '66666666-6666-4666-8666-666666666666'
  );

insert into public.view_events (target_type, target_id, viewer_user_id) values
  ('usage_report', '55555555-5555-4555-8555-555555555555', null),
  ('usage_report', '55555555-5555-4555-8555-555555555555', null),
  ('usage_report', '55555555-5555-4555-8555-555555555555', null),
  ('article', '66666666-6666-4666-8666-666666666666', null),
  ('article', '66666666-6666-4666-8666-666666666666', null),
  ('article', '88888888-8888-4888-8888-888888888888', null);

commit;
