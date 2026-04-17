-- product_types
INSERT INTO product_types (name, is_active) VALUES
  ('BS資材',    true),
  ('農薬',      false),
  ('肥料',      false),
  ('土壌改良材', false);

-- product_benefits（JBSA ver.1.0 25項目）
INSERT INTO product_benefits (category, name, sort_order, version) VALUES
  ('栄養利用', '養分吸収の改善',       1, 'ver.1.0'),
  ('栄養利用', '水分吸収の改善',       2, 'ver.1.0'),
  ('栄養利用', '酸素の供給効率の改善', 3, 'ver.1.0'),
  ('栄養利用', 'CO2の供給効率の改善',  4, 'ver.1.0'),
  ('栄養利用', '養分の利用効率の改善', 5, 'ver.1.0'),
  ('ストレス耐性', '耐暑性改善',                     6,  'ver.1.0'),
  ('ストレス耐性', '耐寒性改善',                     7,  'ver.1.0'),
  ('ストレス耐性', '耐乾燥性改善',                   8,  'ver.1.0'),
  ('ストレス耐性', '湿害からの回復改善',             9,  'ver.1.0'),
  ('ストレス耐性', '低照度下での生育改善',           10, 'ver.1.0'),
  ('ストレス耐性', '塩害耐性改善',                   11, 'ver.1.0'),
  ('ストレス耐性', '遮光効果',                       12, 'ver.1.0'),
  ('ストレス耐性', '耐霜性改善',                     13, 'ver.1.0'),
  ('ストレス耐性', '環境ストレス耐性を高める',       14, 'ver.1.0'),
  ('収量品質', '収量改善',                           15, 'ver.1.0'),
  ('収量品質', '秀品率の改善',                       16, 'ver.1.0'),
  ('収量品質', '有用成分（栄養成分・機能性成分）の改善', 17, 'ver.1.0'),
  ('収量品質', '糖度増加',                           18, 'ver.1.0'),
  ('因果関係', '光合成改善',             19, 'ver.1.0'),
  ('因果関係', '細胞壁の強化',           20, 'ver.1.0'),
  ('因果関係', '樹勢改善',               21, 'ver.1.0'),
  ('因果関係', '成り疲れ改善',           22, 'ver.1.0'),
  ('因果関係', '外部損傷の修復',         23, 'ver.1.0'),
  ('因果関係', 'しおれ軽減',             24, 'ver.1.0'),
  ('因果関係', '根圏の有用微生物の活性化', 25, 'ver.1.0');

-- review_points（10項目）
INSERT INTO review_points (name, is_active) VALUES
  ('他の資材と併用しやすい',     true),
  ('効果が安定している',         true),
  ('費用対効果が良い',           true),
  ('使いやすい',                 true),
  ('効果を感じた',               true),
  ('環境に配慮できる',           true),
  ('使用時期の自由度がある',     true),
  ('土の状態の改善が期待できる', true),
  ('サポートが良い',             true),
  ('続けて使いたい',             true);

-- product_composition_types（8分類）
INSERT INTO product_composition_types (name, is_active) VALUES
  ('海藻、海藻抽出物',                       true),
  ('アミノ酸、ペプチド、タンパク質加水分解物', true),
  ('腐植酸、腐植物質、フミン酸、フルボ酸',   true),
  ('微生物',                                 true),
  ('微量ミネラル、ビタミン',                 true),
  ('キチン、キトサン、多糖類',               true),
  ('動植物抽出物、微生物抽出物',             true),
  ('その他',                                 true);

-- product_application_methods（5件）
INSERT INTO product_application_methods (name, is_active) VALUES
  ('葉面散布',             true),
  ('灌水散布',             true),
  ('土壌処理（土壌混和）', true),
  ('種子処理',             true),
  ('養液栽培添加',         true);

-- product_application_windows（6件）
INSERT INTO product_application_windows (name, is_active) VALUES
  ('定植時・播種時', true),
  ('生育初期',       true),
  ('生育中期',       true),
  ('開花期',         true),
  ('収穫前',         true),
  ('生育全期間',     true);

-- periods（36レコード）
INSERT INTO periods (month, period) VALUES
  (1,'early'),(1,'mid'),(1,'late'),
  (2,'early'),(2,'mid'),(2,'late'),
  (3,'early'),(3,'mid'),(3,'late'),
  (4,'early'),(4,'mid'),(4,'late'),
  (5,'early'),(5,'mid'),(5,'late'),
  (6,'early'),(6,'mid'),(6,'late'),
  (7,'early'),(7,'mid'),(7,'late'),
  (8,'early'),(8,'mid'),(8,'late'),
  (9,'early'),(9,'mid'),(9,'late'),
  (10,'early'),(10,'mid'),(10,'late'),
  (11,'early'),(11,'mid'),(11,'late'),
  (12,'early'),(12,'mid'),(12,'late');