## 🔑 Supabase Service Role Key Ekleme

### Adımlar:

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. **Project**: aspedyrbcxrcsrylyqpt seçin
3. **Settings** → **API** git
4. **Project API keys** bölümünde:
   - `anon` `public` - Zaten var ✅
   - `service_role` `secret` - **Bu key'i kopyala** 🔐

5. `.env.local` dosyasını aç
6. Şu satırı bul:
   ```
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```
7. `YOUR_SERVICE_ROLE_KEY_HERE` kısmını kopyaladığın key ile değiştir

### Örnek:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcGVkeXJiY3hyY3NyeWx5cXB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0NjM0MSwiZXhwIjoyMDc3MjIyMzQxfQ...
```

### ⚠️ ÖNEMLİ:
- Bu key **asla** frontend'de kullanılmamalı
- `.env.local` dosyası `.gitignore`'da olmalı (zaten var ✅)
- Sadece server-side API route'larında kullan

### Test:
```bash
# Terminal'de dev server'ı yeniden başlat
npm run dev

# Tarayıcıda test et
http://localhost:3000/test-image-upload.html
```
