# Trendyol Entegrasyon Hataları ve Düzeltmeler

## 📋 Tespit Edilen Hatalar

### 1. ❌ Yanlış Base URL Yapısı
**Hata:**
```typescript
BASE_URL: 'https://stageapigw.trendyol.com/sapigw'
```

**Sorun:** `/sapigw` path'i Trendyol dokümantasyonunda yok. Bu yanlış URL 404 hatasına neden oluyordu.

**Düzeltme:**
```typescript
BASE_URL: 'https://stageapigw.trendyol.com'
```

---

### 2. ❌ Yanlış Endpoint Yapıları
**Hata:**
```typescript
CREATE_PRODUCT: '/suppliers/{supplierId}/v2/products'
GET_CATEGORIES: '/product-categories'
```

**Sorun:** 
- `suppliers` yerine `sellers` kullanılmalı
- `/integration/` prefix'i eksik
- API dokümantasyonuyla uyumsuz

**Düzeltme:**
```typescript
CREATE_PRODUCT: '/integration/product/sellers/{sellerId}/products'
GET_CATEGORIES: '/integration/product/product-categories'
UPDATE_PRICE_INVENTORY: '/integration/inventory/sellers/{sellerId}/products/price-and-inventory'
GET_ORDERS: '/integration/order/sellers/{sellerId}/orders'
```

---

### 3. ❌ Yanlış Parametre İsimleri
**Hata:**
```typescript
SUPPLIER_ID: '944254'
this.supplierId = ...
endpoint.replace('{supplierId}', ...)
```

**Sorun:** Trendyol API'sinde `supplierId` yerine `sellerId` kullanılıyor.

**Düzeltme:**
```typescript
SELLER_ID: '944254'
this.sellerId = ...
endpoint.replace('{sellerId}', ...)
```

---

### 4. ❌ Geçersiz KDV Oranı
**Hata:**
```typescript
vatRate: 18
```

**Sorun:** 10 Temmuz 2024'ten sonra Türkiye'de KDV oranları değişti. Trendyol artık sadece **0, 1, 10, 20** değerlerini kabul ediyor.

**Hata Mesajı:**
```
KDV alanına 10 temmuz öncesi 0, 1, 8, 18, 10 temmuz sonrası 0,1,10,20 değerlerinden birisini girebilirsiniz!
```

**Düzeltme:**
```typescript
vatRate: 20 // Sadece 0, 1, 10, 20 kullanılabilir
```

---

## ✅ Yapılan Tüm Değişiklikler

### config.ts
```diff
- BASE_URL: 'https://stageapigw.trendyol.com/sapigw'
+ BASE_URL: 'https://stageapigw.trendyol.com'

- SUPPLIER_ID: '944254'
+ SELLER_ID: '944254'

- CREATE_PRODUCT: '/suppliers/{supplierId}/v2/products'
+ CREATE_PRODUCT: '/integration/product/sellers/{sellerId}/products'

- UPDATE_PRODUCT: '/suppliers/{supplierId}/v2/products'
+ UPDATE_PRODUCT: '/integration/product/sellers/{sellerId}/products'

- GET_PRODUCT: '/suppliers/{supplierId}/products'
+ GET_PRODUCT: '/integration/product/sellers/{sellerId}/products'

- UPDATE_PRICE_INVENTORY: '/suppliers/{supplierId}/products/price-and-inventory'
+ UPDATE_PRICE_INVENTORY: '/integration/inventory/sellers/{sellerId}/products/price-and-inventory'

- GET_CATEGORIES: '/product-categories'
+ GET_CATEGORIES: '/integration/product/product-categories'

- GET_CATEGORY_ATTRIBUTES: '/product-categories/{categoryId}/attributes'
+ GET_CATEGORY_ATTRIBUTES: '/integration/product/product-categories/{categoryId}/attributes'

- GET_BRANDS: '/brands'
+ GET_BRANDS: '/integration/product/brands'

- GET_BRAND_BY_NAME: '/brands/by-name'
+ GET_BRAND_BY_NAME: '/integration/product/brands/by-name'

- GET_ORDERS: '/suppliers/{supplierId}/orders'
+ GET_ORDERS: '/integration/order/sellers/{sellerId}/orders'

- UPDATE_SHIPMENT: '/suppliers/{supplierId}/shipment-providers'
+ UPDATE_SHIPMENT: '/integration/product/sellers/{sellerId}/shipment-providers'
```

### client.ts
```diff
- private supplierId: string;
+ private sellerId: string;

- this.supplierId = TRENDYOL_CONFIG.SUPPLIER_ID;
+ this.sellerId = TRENDYOL_CONFIG.SELLER_ID;

- const url = `${this.baseUrl}${endpoint.replace('{supplierId}', this.supplierId)}`;
+ const url = `${this.baseUrl}${endpoint.replace('{sellerId}', this.sellerId)}`;
```

### service.ts
```diff
- vatRate: 18
+ vatRate: 20 // KDV oranı (%) - 10 Temmuz sonrası: 0, 1, 10, 20
```

---

## 🎯 Doğru API Endpoint Yapısı

Trendyol API'sinde endpoint'ler şu yapıda organize edilmiş:

### Ürün Endpoint'leri
```
Base: /integration/product
- /sellers/{sellerId}/products (POST, PUT, GET, DELETE)
- /product-categories (GET)
- /product-categories/{categoryId}/attributes (GET)
- /brands (GET)
- /brands/by-name (GET)
```

### Envanter Endpoint'leri
```
Base: /integration/inventory
- /sellers/{sellerId}/products/price-and-inventory (POST)
```

### Sipariş Endpoint'leri
```
Base: /integration/order
- /sellers/{sellerId}/orders (GET)
```

---

## 📊 Test Sonucu

### Önceki Hata
```json
{
  "success": false,
  "error": "Trendyol API Error: 400 - {...}",
  "message": "KDV alanına 10 temmuz öncesi 0, 1, 8, 18..."
}
```

### Beklenen Başarılı Sonuç
```json
{
  "success": true,
  "message": "Test ürün başarıyla Trendyol'a gönderildi!",
  "data": {
    "batchRequestId": "xxxxx",
    "items": [...]
  }
}
```

---

## 📚 Referans Dokümantasyon

1. **API Endpoint Listesi:**
   https://developers.trendyol.com/docs/marketplace/urun-entegrasyonu/api-endpointleri

2. **Ürün Aktarma (v2):**
   https://developers.trendyol.com/docs/marketplace/urun-entegrasyonu/urun-aktarma-v2

3. **Base URL'ler:**
   - Stage: `https://stageapigw.trendyol.com`
   - Production: `https://apigw.trendyol.com`

---

## ✅ Kontrol Listesi

- [x] Base URL düzeltildi (`/sapigw` kaldırıldı)
- [x] Tüm endpoint path'leri `/integration/` prefix'i ile güncellendi
- [x] `suppliers` → `sellers` değişikliği yapıldı
- [x] `supplierId` → `sellerId` değişikliği yapıldı
- [x] KDV oranı 18 → 20 güncellendi
- [x] Dokümantasyon güncellendi

---

## 🚀 Test Etme

Şimdi test edebilirsiniz:

1. **Web arayüzü:** http://localhost:3000/test-trendyol.html
2. **API endpoint:** POST http://localhost:3000/api/v1/trendyol/test-product

Artık ürün başarıyla Trendyol'a gönderilmelidir! 🎉

---

**Tarih:** 9 Kasım 2025
**Versiyon:** 1.0.1 (Düzeltilmiş)
