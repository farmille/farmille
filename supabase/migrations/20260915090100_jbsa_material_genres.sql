-- JBSA自主基準（2025年9月8日）表1の8分類。既存のIDと資材との関係を保持する。
-- https://www.japanbsa.com/standards/japanbsa-standards_20250908.pdf
insert into public.ingredient_categories (name, sort_order) values
  ('海藻、海藻抽出物', 1),
  ('アミノ酸、ペプチド、タンパク質加水分解物', 2),
  ('腐植酸、腐植物質、フミン酸、フルボ酸', 3),
  ('微生物', 4),
  ('微量ミネラル、ビタミン', 5),
  ('キチン、キトサン、多糖類', 6),
  ('動植物抽出物、微生物抽出物', 7),
  ('その他（素性・由来が分かるように明記）', 8)
on conflict (name) do update set sort_order = excluded.sort_order;
