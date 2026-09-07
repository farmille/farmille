-- 取得不能を確認済みの外部画像URLを無効データとして除去する。
-- 画像がない資材は、画面側で共通のプレースホルダーを表示する。

delete from public.material_images
where url in (
  'https://multisite-assets.icl-growingsolutions.com/wp-content/uploads/sites/41/2023/06/01130543/ICL-Bioz-Japan_Onyx-Permanent.png',
  'https://d2bu5vyg1irlw4.cloudfront.net/img/items/20180418_77.png',
  'https://d2bu5vyg1irlw4.cloudfront.net/img/items/20180418_80.png'
);
