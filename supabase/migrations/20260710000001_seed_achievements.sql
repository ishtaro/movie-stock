-- アチーブメント初期ラインナップ（SPEC.md F-07 の叩き台。最終確定は未決-1）
-- 名称・条件は【仮】。追加・変更はこのテーブルの行の追加・更新のみで行う

insert into public.achievements (id, name, description, category, kind, threshold, param, sort) values
  -- 本数
  ('count-1',    'はじめの一歩',     '最初の1本を記録する',            'count',  'total_count',        1,   null, 10),
  ('count-10',   '映画好き',         '10本の映画を記録する',           'count',  'total_count',        10,  null, 20),
  ('count-50',   'シネフィル',       '50本の映画を記録する',           'count',  'total_count',        50,  null, 30),
  ('count-100',  '生ける映画館',     '100本の映画を記録する',          'count',  'total_count',        100, null, 40),
  -- ジャンル
  ('genre-5',    'ジャンルの沼',     '同じジャンルで5本記録する',      'genre',  'genre_single_count', 5,   null, 50),
  ('genre-10',   'ジャンルの主',     '同じジャンルで10本記録する',     'genre',  'genre_single_count', 10,  null, 60),
  ('variety-5',  '五色の観客',       '5つのジャンルを記録する',        'genre',  'genre_variety',      5,   null, 70),
  ('variety-10', '雑食シネマ',       '10のジャンルを記録する',         'genre',  'genre_variety',      10,  null, 80),
  -- 鑑賞方法
  ('theater-1',  'スクリーンデビュー', '映画館で1本観る',              'method', 'method_count',       1,   '{"method": "theater"}', 90),
  ('theater-10', 'スクリーンの住人',  '映画館で10本観る',              'method', 'method_count',       10,  '{"method": "theater"}', 100),
  ('stream-10',  '配信マラソン',     '配信で10本観る',                 'method', 'method_count',       10,  '{"method": "streaming"}', 110),
  -- 時期
  ('month-5',    '熱狂の一ヶ月',     '同じ月に5本記録する',            'period', 'month_count',        5,   null, 120),
  ('span-50',    '時をかける観客',   '公開年が50年離れた作品を記録する', 'period', 'release_span',       50,  null, 130);
