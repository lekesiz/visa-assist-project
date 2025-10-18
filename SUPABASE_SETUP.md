# Supabase Setup Guide

## 1. Supabase Hesabı Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. "New Project" butonuna tıklayın

## 2. Proje Ayarları

### Proje Bilgileri:
- **Project name**: visa-assist
- **Database Password**: Güçlü bir şifre belirleyin (kaydedin!)
- **Region**: Europe (Frankfurt) - EU veri koruması için
- **Pricing Plan**: Free tier (başlangıç için yeterli)

## 3. API Anahtarları

Proje oluştuktan sonra:
1. Sol menüden "Settings" > "API" tıklayın
2. Şu değerleri kopyalayın:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` → SUPABASE_SERVICE_ROLE_KEY

## 4. .env.local Dosyasını Güncelleyin

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 5. Veritabanı Migration

### Option A: Supabase Dashboard (Kolay)
1. Sol menüden "SQL Editor" tıklayın
2. "New Query" butonuna tıklayın
3. `/supabase/migrations/001_initial_schema.sql` içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. "Run" butonuna tıklayın

### Option B: Supabase CLI (Gelişmiş)
```bash
# Supabase CLI kurulumu
npm install -g supabase

# Login
supabase login

# Projeyi bağla
supabase link --project-ref your-project-ref

# Migration'ı çalıştır
supabase db push
```

## 6. Storage Bucket Oluşturma

1. Sol menüden "Storage" tıklayın
2. "New Bucket" butonuna tıklayın
3. Bucket adı: `documents`
4. Public bucket: ❌ (Güvenlik için private)
5. "Create Bucket" tıklayın

### Storage Policies
SQL Editor'de şu komutları çalıştırın:

```sql
-- Users can upload their own documents
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 7. Authentication Ayarları

1. Sol menüden "Authentication" > "Providers" tıklayın
2. Email provider'ı aktif edin
3. "Save" tıklayın

### Email Templates (Opsiyonel)
"Authentication" > "Email Templates" kısmından:
- Confirm signup
- Reset password
- Magic link

template'lerini özelleştirebilirsiniz.

## 8. Test Etme

```bash
# Development server'ı yeniden başlatın
npm run dev
```

1. http://localhost:3000 adresine gidin
2. "Hemen Başla" butonuna tıklayın
3. Register sayfasında yeni hesap oluşturun
4. Email onayı yapın
5. Login olun ve dashboard'a erişin

## 9. Veritabanı Yönetimi

### Supabase Dashboard'dan:
- **Table Editor**: Verileri görsel olarak yönetin
- **SQL Editor**: Kompleks sorgular çalıştırın
- **Database**: Şema yapısını inceleyin
- **Logs**: Hataları ve sorguları takip edin

## 10. Güvenlik Kontrol Listesi

- [ ] RLS (Row Level Security) aktif mi?
- [ ] API anahtarları .env.local'de mi?
- [ ] .env.local dosyası .gitignore'da mı?
- [ ] Storage bucket private mi?
- [ ] Email doğrulama aktif mi?

## Sorun Giderme

### "Invalid API Key" Hatası
- API anahtarlarını doğru kopyaladığınızdan emin olun
- .env.local dosyasını kaydettiğinizden emin olun
- Development server'ı yeniden başlatın

### "Permission Denied" Hatası
- RLS politikalarını kontrol edin
- User authentication durumunu kontrol edin

### Migration Hatası
- PostgreSQL extension'ların yüklü olduğundan emin olun
- Tablo isimlerinin unique olduğundan emin olun

---

**Not**: Production'a geçerken:
1. Güçlü şifreler kullanın
2. Rate limiting aktif edin
3. Backup stratejisi oluşturun
4. Monitoring kurun