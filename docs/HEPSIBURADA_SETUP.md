# Hepsiburada API Entegrasyonu - Kurulum Rehberi

## 🔐 Resmi Test Ortamı Bilgileri

Hepsiburada'dan alınan resmi test ortamı bilgileri:

### Test Portal Erişimi
- **Portal URL**: https://merchant-sit.hepsiburada.com
- **Test Portal Username**: sedanurtoksoz1@gmail.com
- **Test Portal Password**: Hb12345!

### API Credentials (Development)
- **Merchant ID**: 3f95e71f-c39e-4266-9eb4-c154807e87f7
- **Username**: 3f95e71f-c39e-4266-9eb4-c154807e87f7 (Merchant ID ile aynı)
- **Password (Secret Key)**: d8rCXfXqWJW2
- **User-Agent**: aserai_dev

### Önemli Not
Hepsiburada'da **Username = Merchant ID** kullanılıyor. Bu standart yapıdır.

## 🔐 Kimlik Doğrulama (Authentication) Kurulumu

Hepsiburada API'si **Basic Authentication** kullanır.

### Adım 1: Environment Variables Zaten Yapılandırıldı ✅

`.env.local` dosyası Hepsiburada'dan gelen resmi bilgilerle yapılandırılmıştır:

```env
# Hepsiburada API Configuration (Resmi Test Ortamı Bilgileri)
HEPSIBURADA_MERCHANT_ID=3f95e71f-c39e-4266-9eb4-c154807e87f7
HEPSIBURADA_USERNAME=3f95e71f-c39e-4266-9eb4-c154807e87f7
HEPSIBURADA_PASSWORD=d8rCXfXqWJW2
```

Bu bilgiler **resmi test ortamı** için geçerlidir.

### ⚠️ Önemli Notlar

1. **Username = Merchant ID**
   - Hepsiburada'da username olarak Merchant ID kullanılır
   - Bu standart yapıdır, değiştirmeyin

2. **Test Ortamı**
   - Bu bilgiler Hepsiburada'nın resmi TEST ortamı içindir
   - Production'a geçerken yeni credentials alacaksınız

3. **User-Agent Header**
   - API isteklerinde `User-Agent: aserai_dev` header'ı gönderilir
   - Bu zorunludur ve config'de tanımlıdır

4. **Güvenlik**
   - `.env.local` dosyası `.gitignore` dosyasında olmalıdır (zaten ekli)
   - Bu dosyayı asla GitHub'a yüklemeyin

### Adım 2: Development Sunucusunu Yeniden Başlatın

Environment variables değiştiğinde sunucuyu yeniden başlatmanız gerekir:

```bash
# Mevcut sunucuyu durdurun (Ctrl+C)
# Sonra tekrar başlatın:
npm run dev
```

### Adım 3: Test Edin

1. Tarayıcınızda şu adrese gidin: `http://localhost:3000/hepsiburada-test`
2. "API'ye Gönder" butonuna tıklayın
3. Sağ tarafta API yanıtını görün

## 🐛 Sık Karşılaşılan Hatalar

### 401 Unauthorized Hatası

**Sorun:** Kimlik doğrulama başarısız

**Çözüm:**
1. `.env.local` dosyasının doğru yapılandırıldığından emin olun (zaten yapılandırılmış)
2. Development sunucusunu yeniden başlattığınızdan emin olun
3. Credentials'ları değiştirmediyseniz çalışması gerekir
4. Terminal'de console.log çıktılarını kontrol edin

### 400 Bad Request Hatası

**Sorun:** Gönderilen veri formatı hatalı

**Çözüm:**
1. JSON verisinin geçerli olduğundan emin olun
2. Zorunlu alanların (Barcode, merchantSku, vb.) dolu olduğunu kontrol edin
3. Fiyat ve stok formatlarının doğru olduğunu kontrol edin
4. Görsel URL'lerinin erişilebilir olduğunu doğrulayın

### Credentials Eksik Hatası

**Sorun:** Environment variables tanımlı değil

**Çözüm:**
1. `.env.local` dosyasının proje kök dizininde olduğundan emin olun
2. Dosyadaki variable isimlerinin doğru yazıldığından emin olun
3. Development sunucusunu yeniden başlatın

## 📚 API Dokümantasyonu

Hepsiburada'nın resmi dokümanları:

### Entegrasyon Modelleri
1. **Katalog Ürün Entegrasyonu**: Ürün bilgilerini Hepsiburada'ya aktarma
2. **Listeleme Entegrasyonu**: Ürünleri satışa açma (bu projede kullanılıyor)
3. **Sipariş Entegrasyonu**: Sipariş yönetimi
4. **Sipariş Webhook Entegrasyonu**: Gerçek zamanlı sipariş bildirimleri

### Linkler
- **Developer Portal**: https://developers.hepsiburada.com/
- **Test Portal**: https://merchant-sit.hepsiburada.com
- **External Listing API Endpoint**: `https://listing-external.hepsiburada.com/listings/merchantid/{merchantId}`
- **Sıkça Sorulan Sorular**: Hepsiburada Developer Portal'da mevcut

## 🔍 Debug Modu

API Route'taki console.log'lar terminal'de görülebilir. İstek gönderdiğinizde terminal çıktısını kontrol edin:

```bash
🚀 Using credentials: { merchantId: 'xxx...', username: 'xxx...', ... }
📊 Hepsiburada API Status: 200
```

## 💡 İpuçları

1. Test ortamı credentials'ları zaten yapılandırılmış durumda
2. İlk kurulumda basit bir ürün verisi ile test edin
3. 401 hatası alıyorsanız, sunucuyu yeniden başlatın
4. API başarılı yanıt verse bile Hepsiburada test panelinde (merchant-sit.hepsiburada.com) ürünü kontrol edin
5. Hata aldığınızda sayfayı yenilemeden JSON'ı düzeltip tekrar gönderebilirsiniz

## 🚀 Production'a Geçiş

Production ortamına geçerken:
1. Hepsiburada'dan production credentials'larını alın
2. `.env.local` dosyasını güncelleyin (veya `.env.production` oluşturun)
3. API URL'lerini production URL'leri ile değiştirin
4. Test portal yerine gerçek satıcı panelini kullanın
