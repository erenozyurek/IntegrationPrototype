-- ============================================
-- SUPABASE STORAGE POLICIES
-- product-images bucket için
-- ============================================

-- 1. PUBLIC READ ACCESS
-- Herkes resimleri görebilir
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. AUTHENTICATED UPLOAD
-- Giriş yapmış kullanıcılar resim yükleyebilir
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 3. AUTHENTICATED UPDATE
-- Giriş yapmış kullanıcılar resimleri güncelleyebilir
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 4. AUTHENTICATED DELETE
-- Giriş yapmış kullanıcılar resimleri silebilir
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- BUCKET AYARLARI (Bucket zaten oluşturulmuşsa gerek yok)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true);

-- ============================================
-- KONTROL SORGUSU
-- Policies'in doğru eklendiğini kontrol edin
-- ============================================
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
