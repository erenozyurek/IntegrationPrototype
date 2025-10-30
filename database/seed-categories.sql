-- ===================================
-- CATEGORIES SEED DATA
-- ===================================
-- Elektronik ve Giyim kategorilerini oluşturur
-- Supabase SQL Editor'den çalıştırın
-- ===================================

-- 1. ANA KATEGORİLER (Level 0)
INSERT INTO categories (id, name, slug, parent_id, level, path, sort_order, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Elektronik', 'elektronik', NULL, 0, '1', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'Giyim', 'giyim', NULL, 0, '2', 2, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. ELEKTRONİK ALT KATEGORİLER (Level 1)
WITH elektronik AS (
  SELECT id FROM categories WHERE slug = 'elektronik'
)
INSERT INTO categories (id, name, slug, parent_id, level, path, sort_order, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Telefonlar',
  'telefonlar',
  elektronik.id,
  1,
  '1.1',
  1,
  true,
  NOW(),
  NOW()
FROM elektronik
ON CONFLICT (slug) DO NOTHING;

-- 3. TELEFONLAR ALT KATEGORİLER (Level 2)
WITH telefonlar AS (
  SELECT id FROM categories WHERE slug = 'telefonlar'
)
INSERT INTO categories (id, name, slug, parent_id, level, path, sort_order, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Cep Telefonu',
  'cep-telefonu',
  telefonlar.id,
  2,
  '1.1.1',
  1,
  true,
  NOW(),
  NOW()
FROM telefonlar
ON CONFLICT (slug) DO NOTHING;

-- 4. GİYİM ALT KATEGORİLER (Level 1)
WITH giyim AS (
  SELECT id FROM categories WHERE slug = 'giyim'
)
INSERT INTO categories (id, name, slug, parent_id, level, path, sort_order, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Erkek',
  'erkek',
  giyim.id,
  1,
  '2.1',
  1,
  true,
  NOW(),
  NOW()
FROM giyim
ON CONFLICT (slug) DO NOTHING;

-- 5. ERKEK ALT KATEGORİLER (Level 2)
WITH erkek AS (
  SELECT id FROM categories WHERE slug = 'erkek'
)
INSERT INTO categories (id, name, slug, parent_id, level, path, sort_order, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Erkek Giyim',
  'erkek-giyim',
  erkek.id,
  2,
  '2.1.1',
  1,
  true,
  NOW(),
  NOW()
FROM erkek
ON CONFLICT (slug) DO NOTHING;

-- 6. ERKEK GİYİM ALT KATEGORİLER (Level 3)
WITH erkek_giyim AS (
  SELECT id FROM categories WHERE slug = 'erkek-giyim'
)
INSERT INTO categories (id, name, slug, parent_id, level, path, sort_order, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Erkek T-Shirt',
  'erkek-t-shirt',
  erkek_giyim.id,
  3,
  '2.1.1.1',
  1,
  true,
  NOW(),
  NOW()
FROM erkek_giyim
ON CONFLICT (slug) DO NOTHING;

-- ===================================
-- KONTROL: Oluşturulan kategorileri göster
-- ===================================
SELECT 
  id,
  name,
  slug,
  parent_id,
  level,
  path,
  sort_order,
  is_active,
  created_at
FROM categories
ORDER BY path;

-- ===================================
-- SONUÇ:
-- ===================================
-- ✅ 6 kategori oluşturuldu:
--    1. Elektronik (Level 0)
--       └── Telefonlar (Level 1)
--           └── Cep Telefonu (Level 2)
--    2. Giyim (Level 0)
--       └── Erkek (Level 1)
--           └── Erkek Giyim (Level 2)
--               └── Erkek T-Shirt (Level 3)
-- ===================================
