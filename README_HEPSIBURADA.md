# Hepsiburada API Test Entegrasyonu

## 🎯 Özet

Bu proje, Hepsiburada'nın **resmi test ortamı** ile çalışacak şekilde yapılandırılmıştır. Tüm credentials Hepsiburada tarafından sağlanmış ve sisteme entegre edilmiştir.

## ✅ Yapılandırma Durumu

### Credentials (Zaten Yapılandırılmış ✅)

```
Merchant ID: 3f95e71f-c39e-4266-9eb4-c154807e87f7
Username: 3f95e71f-c39e-4266-9eb4-c154807e87f7 (Merchant ID ile aynı)
Password: d8rCXfXqWJW2
User-Agent: aserai_dev
```

### Test Portal Bilgileri

```
URL: https://merchant-sit.hepsiburada.com
Email: sedanurtoksoz1@gmail.com
Password: Hb12345!
```

## 🚀 Hızlı Başlangıç

### 1. Sunucuyu Başlatın

```bash
npm run dev
```

### 2. Test Arayüzüne Erişin

Tarayıcınızda şu adrese gidin:

```
http://localhost:3000/hepsiburada-test
```

### 3. Test Edin

1. Sol tarafta hazır gelen JSON verisini kullanın veya düzenleyin
2. "🚀 API'ye Gönder" butonuna tıklayın
3. Sağ tarafta API yanıtını görün
4. Hata alırsanız, JSON'ı düzeltip tekrar gönderin (sayfa yenilemeden)

### 4. Test Panelinde Kontrol Edin

Ürün başarıyla gönderildiyse, Test Portal'de kontrol edebilirsiniz:
- URL: https://merchant-sit.hepsiburada.com
- Login: sedanurtoksoz1@gmail.com / Hb12345!

## 📁 Proje Yapısı

```
├── app/
│   ├── api/v1/hepsiburada/test-listing/
│   │   └── route.ts                         # API endpoint (Backend)
│   └── hepsiburada-test/
│       └── page.tsx                         # Test sayfası
├── components/hepsiburada/
│   └── HepsiburadaApiTester.tsx            # Test arayüzü component
├── lib/integrations/hepsiburada/
│   ├── config.ts                            # API yapılandırması
│   └── types.ts                             # TypeScript tipleri
├── docs/
│   └── HEPSIBURADA_SETUP.md                # Detaylı kurulum rehberi
├── .env.local                               # Environment variables (Yapılandırılmış ✅)
└── README_HEPSIBURADA.md                    # Bu dosya
```

## 🔧 Nasıl Çalışır?

### İstek Akışı

```
Frontend (React Component)
    ↓ JSON Payload
Next.js API Route (/api/v1/hepsiburada/test-listing)
    ↓ Basic Auth Header
Hepsiburada External Listing API
    ↓ Response
Next.js API Route
    ↓ Formatted Response
Frontend (Response Viewer)
```

### Authentication

- **Method**: Basic Authentication
- **Format**: `Authorization: Basic base64(username:password)`
- **Username**: Merchant ID (3f95e71f-c39e-4266-9eb4-c154807e87f7)
- **Password**: Secret Key (d8rCXfXqWJW2)
- **Header**: User-Agent: aserai_dev

## 📊 API Endpoint

### POST /api/v1/hepsiburada/test-listing

**Request Body:**
```json
{
  "products": [
    {
      "categoryId": 18021982,
      "merchant": "6fc6d90d-ee1d-4372-b3a6-264b1275e9ff",
      "attributes": {
        "merchantSku": "SAMPLE-SKU-INT-0",
        "Barcode": "1234567891234",
        "UrunAdi": "Test Ürün",
        "price": "130,50",
        "stock": "13",
        ...
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Ürün başarıyla Hepsiburada API'sine gönderildi!",
  "apiResponse": { ... },
  "timestamp": "2025-12-04T...",
  "statusCode": 200
}
```

## 🐛 Sorun Giderme

### 401 Unauthorized Hatası

**Neden**: Credentials yanlış veya sunucu yeniden başlatılmamış

**Çözüm**:
1. `.env.local` dosyasını kontrol edin (zaten doğru olmalı)
2. Development sunucusunu yeniden başlatın: `npm run dev`
3. Terminal'de credential log'larını kontrol edin

### 400 Bad Request Hatası

**Neden**: JSON verisi hatalı veya zorunlu alanlar eksik

**Çözüm**:
1. JSON formatının geçerli olduğundan emin olun
2. Zorunlu alanları kontrol edin (Barcode, merchantSku, UrunAdi, price, stock)
3. Fiyat formatı: "130,50" (virgül ile)
4. Stok formatı: "13" (string)

### API Başarılı Ama Ürün Görünmüyor

**Neden**: Hepsiburada bazen eksik alanlar olsa bile başarılı yanıt döner

**Çözüm**:
1. Tüm zorunlu alanların dolu olduğundan emin olun
2. Görsel URL'lerinin erişilebilir olduğunu kontrol edin
3. Test Portal'de ürünü kontrol edin
4. API yanıtındaki detayları inceleyin

## 🔗 Önemli Linkler

- **Test Arayüzü**: http://localhost:3000/hepsiburada-test
- **Test Portal**: https://merchant-sit.hepsiburada.com
- **Developer Portal**: https://developers.hepsiburada.com/
- **Detaylı Kurulum Rehberi**: [docs/HEPSIBURADA_SETUP.md](./docs/HEPSIBURADA_SETUP.md)

## 📚 Hepsiburada Entegrasyon Modelleri

1. **Katalog Ürün Entegrasyonu**: Ürün bilgilerini aktarma
2. **Listeleme Entegrasyonu**: Ürünleri satışa açma (✅ Bu projede kullanılıyor)
3. **Sipariş Entegrasyonu**: Sipariş yönetimi
4. **Sipariş Webhook Entegrasyonu**: Gerçek zamanlı bildirimler

## 🎨 Arayüz Özellikleri

✅ İki sütunlu responsive tasarım
✅ Sol: JSON editör (düzenlenebilir)
✅ Sağ: API yanıt görüntüleyici
✅ Real-time hata gösterimi
✅ 401 hatası için özel uyarı
✅ Hata düzeltme ipuçları
✅ Sayfa yenilemeden test
✅ Loading animasyonları
✅ Tailwind CSS styling

## 🚀 Production'a Geçiş

Production ortamına geçerken:

1. Hepsiburada'dan **production credentials** alın
2. `.env.production` dosyası oluşturun
3. API URL'lerini production URL'leri ile değiştirin
4. Config dosyasındaki `BASE_URL` ve `LISTING_BASE_URL` değerlerini güncelleyin
5. Test Portal yerine gerçek Satıcı Paneli'ni kullanın

## ⚡ Performans İpuçları

- API istekleri Next.js API Route üzerinden gidiyor (CORS yok)
- Credentials backend'de tutuluyor (güvenli)
- Response'lar cache'lenmiyor (her istek gerçek zamanlı)
- JSON parsing frontend'de yapılıyor

## 🔐 Güvenlik

- Credentials `.env.local` dosyasında (`.gitignore`'da)
- Basic Auth backend'de oluşturuluyor
- Frontend'de hassas bilgi yok
- API Route server-side çalışıyor

## 📝 Notlar

- Bu proje **test ortamı** içindir
- Hepsiburada resmi test credentials kullanılıyor
- Username = Merchant ID (Hepsiburada standart yapısı)
- User-Agent header'ı zorunlu (aserai_dev)

---

**Son Güncelleme**: 4 Aralık 2025
**Test Ortamı**: ✅ Aktif
**Production**: ❌ Henüz yapılandırılmadı
