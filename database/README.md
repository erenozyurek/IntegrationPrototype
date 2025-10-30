# Database Seed Scripts

Bu klasör, Supabase veritabanına kategori ve özellik verilerini yüklemek için SQL scriptlerini içerir.

## 📁 Dosyalar

1. **seed-categories.sql** - Kategori ağacını oluşturur
2. **seed-attributes.sql** - Ürün özellik tanımlarını oluşturur

## 🚀 Kullanım Adımları

### 1️⃣ Supabase Dashboard'a Git
- Projenize giriş yapın: https://supabase.com/dashboard
- Sol menüden **SQL Editor**'ü seçin

### 2️⃣ Kategorileri Yükle
1. **New Query** butonuna tıklayın
2. `seed-categories.sql` dosyasının içeriğini kopyalayıp yapıştırın
3. **Run** (F5) butonuna basın
4. ✅ "Success. 6 rows returned" mesajını görmelisiniz

### 3️⃣ Özellik Tanımlarını Yükle
1. Yeni bir **New Query** oluşturun
2. `seed-attributes.sql` dosyasının içeriğini kopyalayıp yapıştırın
3. **Run** (F5) butonuna basın
4. ✅ "Success. 12 rows returned" mesajını görmelisiniz

### 4️⃣ Kontrol Et
Kategorileri görmek için:
```sql
SELECT * FROM categories ORDER BY path;
```

Özellikleri görmek için:
```sql
SELECT * FROM attribute_definitions ORDER BY sort_order;
```

## 📊 Oluşturulan Yapı

### Kategori Ağacı
```
Elektronik (elektronik)
└── Telefonlar (telefonlar)
    └── Cep Telefonu (cep-telefonu)

Giyim (giyim)
└── Erkek (erkek)
    └── Erkek Giyim (erkek-giyim)
        └── Erkek T-Shirt (erkek-t-shirt)
```

### Cep Telefonu Özellikleri (8 adet)
- ✅ Ön Kamera Çözünürlüğü (text, zorunlu)
- ✅ Garanti Tipi (select, zorunlu)
- ✅ Dahili Hafıza (select, zorunlu, varyant-belirleyici)
- ✅ RAM Kapasitesi (select, zorunlu, varyant-belirleyici)
- ✅ Pil Gücü (text, zorunlu)
- ✅ Mobil Bağlantı Hızı (select, zorunlu)
- ⚪ Kulaklık Girişi (select, opsiyonel)
- ⚪ Yüz Tanıma (select, opsiyonel)

### T-Shirt Özellikleri (4 adet)
- ✅ Beden (select, zorunlu, varyant-belirleyici)
- ✅ Renk (text, zorunlu, varyant-belirleyici)
- ✅ Kumaş Tipi (select, zorunlu)
- ⚪ Desen (select, opsiyonel)

## 🔄 Yeniden Yükleme

Eğer kategorileri veya özellikleri yeniden yüklemek isterseniz:

```sql
-- Tüm kategorileri sil (ÖNCE BUNU ÇALIŞTİRIN)
TRUNCATE TABLE categories CASCADE;

-- Tüm özellik tanımlarını sil
TRUNCATE TABLE attribute_definitions CASCADE;
```

⚠️ **DİKKAT:** CASCADE ile silme işlemi, bağlı tüm ürünleri ve varyantları da siler!

## 📝 Notlar

- Scriptler `ON CONFLICT (slug) DO NOTHING` kullanır, yani aynı slug'a sahip kategori varsa tekrar eklemez
- Her kategori otomatik UUID ile oluşturulur
- `path` alanı hiyerarşik sıralama için kullanılır (örn: "1.1.1")
- `is_variant_defining: true` olan özellikler farklı varyantlar oluşturur (örn: 128GB vs 256GB)
