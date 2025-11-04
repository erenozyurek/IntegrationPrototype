/**
 * Trendyol Test Script
 * Bu dosyayı çalıştırarak Trendyol entegrasyonunu test edebilirsiniz
 * 
 * Kullanım:
 * npx tsx scripts/test-trendyol.ts
 */

import { createTestProduct, getProducts, searchBrand, getCategoryAttributes } from '../lib/integrations/trendyol/service';

async function main() {
  console.log('🚀 Trendyol Entegrasyon Test Başlıyor...\n');

  // 1. Marka Arama Testi
  console.log('=== 1. MARKA ARAMA TESTİ ===');
  const brand = await searchBrand('Generic');
  console.log('\n');

  // 2. Kategori Özellikleri Testi
  console.log('=== 2. KATEGORİ ÖZELLİKLERİ TESTİ ===');
  const categoryAttrs = await getCategoryAttributes(411); // T-shirt kategorisi
  console.log('\n');

  // 3. Test Ürün Oluşturma
  console.log('=== 3. TEST ÜRÜN OLUŞTURMA ===');
  const result = await createTestProduct();
  
  if (result.success) {
    console.log('✅ Test ürün başarıyla oluşturuldu!');
    console.log('Batch Request ID:', result.data);
  } else {
    console.error('❌ Test ürün oluşturulamadı:', result.error);
  }
  console.log('\n');

  // 4. Ürünleri Listeleme
  console.log('=== 4. ÜRÜN LİSTELEME TESTİ ===');
  const products = await getProducts({ page: 0, size: 10 });
  console.log('\n');

  console.log('🏁 Test tamamlandı!');
}

// Run the test
main().catch(console.error);
