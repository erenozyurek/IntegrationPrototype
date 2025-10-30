-- ===================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================
-- Supabase'de tablolara erişim izinleri
-- ===================================

-- 1. CATEGORIES - Public okuma, authenticated yazma
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON categories;

-- Yeni politikalar oluştur
CREATE POLICY "Enable read access for all users" ON categories
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON categories
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON categories
FOR UPDATE
USING (auth.role() = 'authenticated');

-- 2. PRODUCTS - Authenticated kullanıcılar için tam erişim
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;

CREATE POLICY "Enable all access for authenticated users" ON products
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 3. PRODUCT_VARIANTS - Authenticated kullanıcılar için tam erişim
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_variants;

CREATE POLICY "Enable all access for authenticated users" ON product_variants
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. ATTRIBUTE_DEFINITIONS - Public okuma, authenticated yazma
ALTER TABLE attribute_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON attribute_definitions;
DROP POLICY IF EXISTS "Enable write for authenticated users" ON attribute_definitions;

CREATE POLICY "Enable read access for all users" ON attribute_definitions
FOR SELECT
USING (true);

CREATE POLICY "Enable write for authenticated users" ON attribute_definitions
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. VARIANT_ATTRIBUTES - Authenticated kullanıcılar için tam erişim
ALTER TABLE variant_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON variant_attributes;

CREATE POLICY "Enable all access for authenticated users" ON variant_attributes
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 6. MARKETPLACE_CATEGORY_MAPPINGS - Authenticated kullanıcılar için tam erişim
ALTER TABLE marketplace_category_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON marketplace_category_mappings;

CREATE POLICY "Enable all access for authenticated users" ON marketplace_category_mappings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 7. MARKETPLACE_ATTRIBUTE_MAPPINGS - Authenticated kullanıcılar için tam erişim
ALTER TABLE marketplace_attribute_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON marketplace_attribute_mappings;

CREATE POLICY "Enable all access for authenticated users" ON marketplace_attribute_mappings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 8. PRODUCT_IMAGES - Authenticated kullanıcılar için tam erişim
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_images;

CREATE POLICY "Enable all access for authenticated users" ON product_images
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 9. PRODUCT_CHANGE_HISTORY - Authenticated kullanıcılar için tam erişim
ALTER TABLE product_change_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_change_history;

CREATE POLICY "Enable all access for authenticated users" ON product_change_history
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ===================================
-- KONTROL: RLS durumunu göster
-- ===================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===================================
-- SONUÇ:
-- ===================================
-- ✅ Tüm tablolar için RLS aktif
-- ✅ Categories ve attribute_definitions: Herkes okuyabilir
-- ✅ Diğer tablolar: Sadece authenticated kullanıcılar erişebilir
-- ===================================
