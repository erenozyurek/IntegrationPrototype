# Trendyol Entegrasyon Dokümantasyonu

## 📋 İçindekiler
- [Genel Bakış](#genel-bakış)
- [Kurulum](#kurulum)
- [API Kullanımı](#api-kullanımı)
- [Test Etme](#test-etme)
- [Önemli Notlar](#önemli-notlar)

## 🎯 Genel Bakış

Bu entegrasyon, Trendyol Seller API'si kullanarak ürün yönetimi sağlar. Aşağıdaki özellikleri destekler:

- ✅ Ürün oluşturma
- ✅ Ürün güncelleme
- ✅ Fiyat ve stok güncelleme
- ✅ Ürün listeleme
- ✅ Kategori ve marka sorgulama

## 📦 Entegrasyon Bilgileri

```
Satıcı ID: 169212
API Key: sz5Wh3Gt1QFBlX6KtYsw
API Secret: RZBj83IErQyH3MERPxDa
Integration Reference: 9a5de9b9-d42a-4b3b-bf4e-78a8cd5fab42
```

## 🚀 Kurulum

### 1. Dosya Yapısı

```
lib/integrations/trendyol/
  ├── config.ts          # API ayarları ve sabitler
  ├── client.ts          # HTTP client ve authentication
  ├── types.ts           # TypeScript type definitions
  └── service.ts         # İş mantığı ve helper fonksiyonlar

app/api/v1/trendyol/
  ├── test-product/      # Test ürünü endpoint'i
  └── products/          # Ürün listeleme endpoint'i
```

### 2. Bağımlılıklar

Tüm gerekli bağımlılıklar mevcut Next.js projesinde zaten yüklü.

## 📚 API Kullanımı

### Test Ürünü Oluşturma

**Endpoint:** `POST /api/v1/trendyol/test-product`

```bash
curl -X POST http://localhost:3000/api/v1/trendyol/test-product \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Test ürün başarıyla Trendyol'a gönderildi!",
  "data": {
    "batchRequestId": "123456789",
    "items": [...]
  }
}
```

### Ürünleri Listeleme

**Endpoint:** `GET /api/v1/trendyol/products`

```bash
curl http://localhost:3000/api/v1/trendyol/products?page=0&size=10
```

**Query Parameters:**
- `page`: Sayfa numarası (default: 0)
- `size`: Sayfa başına ürün sayısı (default: 50)
- `approved`: Onaylanmış ürünler (true/false)

## 🧪 Test Etme

### 1. Web Arayüzü ile Test

Tarayıcınızda şu URL'yi açın:
```
http://localhost:3000/test-trendyol.html
```

Bu sayfada:
- ✅ Test ürünü Trendyol'a gönderebilirsiniz
- ✅ Trendyol'daki ürünlerinizi listeleyebilirsiniz
- ✅ API yanıtlarını görebilirsiniz

### 2. Script ile Test

Terminal'de:
```bash
npx tsx scripts/test-trendyol.ts
```

### 3. Postman ile Test

**Test Ürün Oluştur:**
```
POST http://localhost:3000/api/v1/trendyol/test-product
```

**Ürünleri Listele:**
```
GET http://localhost:3000/api/v1/trendyol/products?page=0&size=10
```

## 📝 Kod Örnekleri

### TypeScript'te Kullanım

```typescript
import { trendyolClient } from '@/lib/integrations/trendyol/client';
import { createTestProduct } from '@/lib/integrations/trendyol/service';

// Test ürünü oluştur
const result = await createTestProduct();
console.log(result);

// Ürünleri listele
const products = await trendyolClient.getProducts({
  page: 0,
  size: 50,
  approved: true
});

// Fiyat ve stok güncelle
await trendyolClient.updatePriceAndInventory([
  {
    barcode: '8691234567890',
    quantity: 100,
    salePrice: 149.99,
    listPrice: 199.99
  }
]);
```

### Kendi Ürününüzü Göndermek

```typescript
import { trendyolClient } from '@/lib/integrations/trendyol/client';

const myProduct = {
  items: [{
    barcode: 'YOUR_BARCODE',
    title: 'Ürün Adı',
    productMainId: 'YOUR_PRODUCT_ID',
    brandId: 1791, // Trendyol'da kayıtlı brand ID
    categoryId: 411, // Trendyol kategori ID
    quantity: 10,
    stockCode: 'YOUR_SKU',
    description: 'Ürün açıklaması',
    currencyType: 'TRY',
    listPrice: 199.99,
    salePrice: 149.99,
    vatRate: 20,
    cargoCompanyId: 10,
    images: [
      { url: 'https://example.com/image.jpg' }
    ],
    attributes: [
      {
        attributeId: 338,
        attributeName: 'Renk',
        attributeValueId: 4319,
        attributeValue: 'Siyah'
      }
    ]
  }]
};

const response = await trendyolClient.createProduct(myProduct);
```

## ⚠️ Önemli Notlar

### 1. Ürün Oluşturma Gereksinimleri

- ✅ **Barkod**: Benzersiz olmalı (8-13 karakter)
- ✅ **Kategori ID**: Trendyol'da geçerli bir kategori ID'si
- ✅ **Brand ID**: Trendyol'da kayıtlı bir marka ID'si
- ✅ **Attributes**: Kategori için gerekli özellikler
- ✅ **Images**: En az 1, en fazla 8 resim URL'i
- ✅ **Price**: listPrice >= salePrice

### 2. Kategori ve Marka Bilgileri

Ürün oluşturmadan önce:

```typescript
// Marka ID'sini öğren
const brand = await searchBrand('Marka Adı');

// Kategori özelliklerini öğren
const attrs = await getCategoryAttributes(categoryId);
```

### 3. Rate Limiting

Trendyol API'si rate limiting uygular:
- Dakikada maksimum 100 istek
- Aşırı istek durumunda 429 hatası alırsınız

### 4. Batch Request ID

Ürün oluşturma işlemi asenkron çalışır:
- API size bir `batchRequestId` döner
- Bu ID ile işlemin durumunu sorgulayabilirsiniz
- Ürün onayı 1-24 saat sürebilir

### 5. Test Ortamı

⚠️ **ÖNEMLİ**: Bu entegrasyon **production** Trendyol hesabına bağlıdır!

Test için:
- Gerçek barkod kullanın (sahte barkod kabul edilmez)
- Test ürünlerini daha sonra silebilir veya pasif yapabilirsiniz
- İlk testlerde düşük stok miktarı kullanın

## 🔍 Hata Ayıklama

### Console Logları

Tüm API istekleri console'a loglanır:
```
🔄 Trendyol API Request: POST https://api.trendyol.com/...
✅ Trendyol API Success: {...}
❌ Trendyol API Error: {...}
```

### Yaygın Hatalar

**401 Unauthorized:**
- API Key/Secret kontrol edin
- Token formatını kontrol edin

**400 Bad Request:**
- Ürün verilerini kontrol edin
- Gerekli alanların dolu olduğundan emin olun
- Kategori ID ve Brand ID'nin geçerli olduğunu doğrulayın

**422 Unprocessable Entity:**
- Barkod zaten kullanımda olabilir
- Kategori gereksinimleri karşılanmamış olabilir

## 📖 Kaynaklar

- [Trendyol Seller API Dokümantasyonu](https://developers.trendyol.com/)
- [Trendyol Entegrasyon Rehberi](https://seller.trendyol.com/)

## 🆘 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. API yanıtını inceleyin
3. Trendyol dokümantasyonunu kontrol edin
4. Test sayfasını kullanarak debug edin

---

**Son Güncelleme:** 1 Kasım 2025
**Versiyon:** 1.0.0
