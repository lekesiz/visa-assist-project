# Takım Koordinasyon ve Paralel Geliştirme Kılavuzu

## 🚀 Takım Üyeleri

1. **Claude (AI Lead)** - Temel mimari, backend, veritabanı
2. **Visual Studio Developer** - Frontend, UI/UX, component geliştirme
3. **NETZ Ekibi** - Gemini ve OpenAI destekli paralel geliştirme

## 📋 Görev Dağılımı

### Claude'un Çalışma Alanları
- `/lib/` - Backend servisleri ve utilities
- `/app/api/` - API endpoint'leri
- `/supabase/` - Veritabanı migration'ları
- `/types/` - TypeScript tip tanımlamaları

### VS Developer Çalışma Alanları
- `/components/` - UI componentleri
- `/app/(dashboard)/` - Dashboard sayfaları
- `/app/(public)/` - Public sayfalar
- `/public/` - Static dosyalar

### Ortak Çalışma Alanları
- `/app/` - Route yapısı (koordineli çalışma)
- `package.json` - Bağımlılıklar (merge dikkatli)
- `.env.example` - Environment değişkenleri

## 🔄 Git Workflow

### Branch Stratejisi
```
main
├── develop
    ├── feature/backend-api (Claude)
    ├── feature/ui-components (VS Developer)
    └── feature/ai-integration (NETZ Team)
```

### Commit Mesaj Formatı
```
[ALAN] Kısa açıklama

Örnek:
[BACKEND] Add document upload API endpoint
[UI] Create file uploader component
[DB] Add job_applications table
```

## 📊 Güncel Durum İzleme

### ✅ Tamamlanan Modüller
- [x] Proje yapısı
- [x] Auth sayfaları (login/register)
- [x] Landing page
- [x] Veritabanı şeması
- [x] Supabase client setup

### 🚧 Devam Eden Çalışmalar
- [ ] GitHub repository setup (@Claude)
- [ ] Dashboard layout (@VS Developer)
- [ ] Component library (@VS Developer)

### 📝 Bekleyen Görevler
- [ ] Belge yükleme modülü
- [ ] AI entegrasyonları
- [ ] Payment integration
- [ ] Email servisi
- [ ] Deployment setup

## 🔐 Çakışma Önleme Kuralları

1. **Dosya Kilitleme**: Çalışmaya başlamadan önce TEAM_STATUS.json güncelle
2. **Frequent Commits**: Sık sık commit at, büyük değişiklikleri biriktirme
3. **Pull Before Push**: Her push öncesi pull yap
4. **Test First**: Kod push'lamadan önce test et

## 📡 İletişim

### Senkronizasyon Noktaları
- Her modül tamamlandığında bildirim
- API değişikliklerinde anında haber
- Type tanımlamalarında koordinasyon

### Dosya İzleme Sistemi
```json
// TEAM_STATUS.json
{
  "working_on": {
    "claude": ["api/documents", "lib/ai"],
    "vs_dev": ["components/FileUploader", "dashboard/layout"],
    "last_updated": "2024-01-18T10:30:00Z"
  }
}
```

## 🎯 Öncelikli Hedefler

1. **Faz 1 (Bu Hafta)**
   - GitHub repo kurulumu
   - Dashboard temel yapısı
   - Belge yükleme API'si
   - File uploader component

2. **Faz 2 (Gelecek Hafta)**
   - AI entegrasyonları
   - Denklik süreci modülü
   - Job matching algoritması

## 💡 Best Practices

1. **Component Naming**: PascalCase kullan (FileUploader, JobCard)
2. **API Routes**: kebab-case kullan (/api/upload-document)
3. **Database**: snake_case kullan (user_profiles, job_applications)
4. **TypeScript**: Interface'leri `/types` klasöründe sakla
5. **Imports**: Absolute imports kullan (@/components/...)

## 🔧 Hızlı Komutlar

```bash
# VS Developer için UI geliştirme
npm run dev         # Development server
npm run storybook   # Component preview

# Claude için backend geliştirme
npm run db:migrate  # Run migrations
npm run test:api    # Test API endpoints

# Herkes için
npm run lint        # Kod kalite kontrolü
npm run type-check  # TypeScript kontrolü
```

---

**Not**: Bu belge canlı bir dokümandır. Her takım üyesi güncellemeler yapabilir.