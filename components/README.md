# Component Library

## 📁 Klasör Yapısı

```
components/
├── ui/              # Temel UI componentleri (Button, Input, Card, etc.)
├── features/        # Özellik bazlı componentler (FileUploader, JobCard, etc.)
└── layouts/         # Layout componentleri (Header, Sidebar, Footer)
```

## 🎨 Component Geliştirme Kuralları

### Naming Convention
- Component dosyaları: PascalCase (örn: `FileUploader.tsx`)
- Story dosyaları: `ComponentName.stories.tsx`
- Test dosyaları: `ComponentName.test.tsx`

### Component Template
```tsx
import { FC } from 'react'
import { cn } from '@/lib/utils/cn'

interface ComponentNameProps {
  className?: string
  // other props
}

export const ComponentName: FC<ComponentNameProps> = ({ 
  className,
  ...props 
}) => {
  return (
    <div className={cn('base-classes', className)}>
      {/* component content */}
    </div>
  )
}
```

## 🚧 Geliştirme Durumu

### UI Components
- [ ] Button
- [ ] Input
- [ ] Card
- [ ] Modal
- [ ] Toast
- [ ] Dropdown
- [ ] Table
- [ ] Tabs

### Feature Components  
- [ ] FileUploader
- [ ] DocumentViewer
- [ ] ApplicationCard
- [ ] ProgressTracker
- [ ] JobCard
- [ ] ChatInterface

### Layout Components
- [ ] Header
- [ ] Sidebar
- [ ] MobileNav
- [ ] Footer
- [ ] PageContainer

## 👤 Sorumlu: Visual Studio Developer

Bu klasör VS Developer tarafından yönetilmektedir. Component değişiklikleri için lütfen koordinasyon sağlayın.