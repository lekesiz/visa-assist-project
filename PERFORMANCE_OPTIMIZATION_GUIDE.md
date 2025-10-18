# Performance Optimization Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Bundle Analysis & Code Splitting](#bundle-analysis--code-splitting)
4. [Image Optimization](#image-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Lazy Loading](#lazy-loading)
7. [Performance Monitoring](#performance-monitoring)
8. [Performance Audit Tools](#performance-audit-tools)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive performance optimization strategies for the Visa Assist application. The implementation includes:

- **Bundle Analysis**: Analyze and optimize JavaScript bundle sizes
- **Code Splitting**: Advanced strategies for splitting code into optimized chunks
- **Image Optimization**: Comprehensive image loading and optimization pipeline
- **Caching**: Multi-layer caching strategies including memory, HTTP, and service worker caching
- **Lazy Loading**: Advanced lazy loading for components, images, and assets
- **Performance Monitoring**: Real-time performance tracking and analytics
- **Audit Tools**: Automated performance auditing and CI integration

## Quick Start

### 1. Enable Performance Monitoring

Add to your `app/layout.tsx`:

```tsx
import { initPerformanceMonitoring } from '@/lib/performance/monitoring'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initPerformanceMonitoring()
    }
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### 2. Run Performance Audit

```bash
# Analyze bundle size
npm run analyze

# Run comprehensive performance audit
node scripts/performance-audit.js

# Run CI performance check
node scripts/performance-ci.js http://localhost:3000
```

### 3. Implement Lazy Loading

```tsx
import { createLazyComponent } from '@/lib/performance/lazy-loading'

const LazyDashboard = createLazyComponent(
  () => import('./Dashboard'),
  { 
    fallback: <DashboardSkeleton />,
    chunkName: 'dashboard'
  }
)
```

## Bundle Analysis & Code Splitting

### Bundle Analysis

The bundle analyzer provides detailed insights into your application's bundle composition:

```bash
# Generate bundle analysis report
node scripts/bundle-analyzer.js
```

This creates:
- `performance-reports/bundle-analysis.json` - Detailed analysis data
- `performance-reports/bundle-analysis.html` - Interactive HTML report

### Advanced Code Splitting

#### 1. Route-Based Splitting

```tsx
import { createRouteComponent } from '@/lib/performance/code-splitting'

// Automatically split by route
const ApplicationsPage = createRouteComponent(
  () => import('./pages/applications'),
  'applications'
)

const AppointmentsPage = createRouteComponent(
  () => import('./pages/appointments'), 
  'appointments'
)
```

#### 2. Feature-Based Splitting

```tsx
import { createFeatureComponent } from '@/lib/performance/code-splitting'

// Split by feature
const PaymentProcessor = createFeatureComponent(
  () => import('./features/payment'),
  'payment'
)

const DocumentUploader = createFeatureComponent(
  () => import('./features/document-upload'),
  'document-upload'
)
```

#### 3. Conditional Loading

```tsx
import { ConditionalLoader } from '@/lib/performance/code-splitting'

// Load on user interaction
const ChatWidget = await ConditionalLoader.loadOnInteraction(
  'chat-widget',
  () => import('./ChatWidget'),
  chatButtonElement
)

// Load when element becomes visible
const Analytics = await ConditionalLoader.loadOnVisible(
  'analytics',
  () => import('./Analytics'),
  analyticsContainerElement
)
```

### Vendor Chunk Optimization

The webpack configuration automatically splits vendors into optimized chunks:

- **Framework**: React, React DOM, Next.js
- **UI**: Radix UI components, Lucide icons
- **Forms**: React Hook Form, Zod validation
- **Data**: TanStack Query, Supabase
- **Utils**: Date-fns, utility libraries
- **Charts**: Recharts visualization
- **AI**: OpenAI, AI libraries

## Image Optimization

### Responsive Image Loading

```tsx
import { LazyImage } from '@/lib/performance/image-optimization'

function ProfileImage({ src, alt }) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      width={200}
      height={200}
      quality={80}
      format="webp"
      placeholder="/images/placeholder-avatar.jpg"
      priority={false} // Set to true for above-the-fold images
      onLoad={() => console.log('Image loaded')}
      onError={(error) => console.error('Image failed:', error)}
    />
  )
}
```

### Progressive Enhancement

```tsx
import { useProgressiveEnhancement } from '@/lib/performance/image-optimization'

function GalleryImage({ src }) {
  const { content, isEnhanced } = useProgressiveEnhancement(
    '/images/low-quality-placeholder.jpg', // Base content
    () => fetch(src).then(r => r.url), // Enhanced loader
    { timeout: 3000 }
  )

  return (
    <img 
      src={content}
      className={`transition-opacity ${isEnhanced ? 'opacity-100' : 'opacity-70'}`}
    />
  )
}
```

### Image Preloading

```tsx
import { ImagePreloader } from '@/lib/performance/image-optimization'

// Preload critical images
ImagePreloader.preloadMultiple([
  '/images/hero-banner.jpg',
  '/images/company-logo.png',
  '/images/featured-service.jpg'
], { priority: 'high', batchSize: 2 })

// Preload on user interaction
onMouseEnter={() => {
  ImagePreloader.preload('/images/service-details.jpg', { priority: 'low' })
}}
```

## Caching Strategies

### Memory Cache

```tsx
import { cacheManager } from '@/lib/performance/caching-strategies'

const userCache = cacheManager.getMemoryCache('users', {
  maxSize: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
})

// Store and retrieve user data
userCache.set('user-123', userData)
const user = userCache.get('user-123')
```

### HTTP Cache with Stale-While-Revalidate

```tsx
import { apiCache } from '@/lib/performance/caching-strategies'

// Cache API responses with background revalidation
const fetchUser = async (userId: string) => {
  return apiCache.get(
    `user-${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    {
      ttl: 1000 * 60 * 5, // 5 minutes
      staleWhileRevalidate: 1000 * 60 * 30 // 30 minutes
    }
  )
}
```

### Browser Storage Cache

```tsx
import { userDataCache, sessionCache } from '@/lib/performance/caching-strategies'

// Persistent storage
userDataCache.set('preferences', userPreferences, 1000 * 60 * 60 * 24) // 24 hours

// Session storage
sessionCache.set('form-data', formData, 1000 * 60 * 30) // 30 minutes
```

### IndexedDB for Large Data

```tsx
import { documentsCache } from '@/lib/performance/caching-strategies'

// Store large files in IndexedDB
await documentsCache.set('document-123', documentBlob, 1000 * 60 * 60 * 24) // 24 hours
const document = await documentsCache.get('document-123')
```

### Service Worker Setup

The service worker automatically handles:
- Static asset caching
- API response caching with stale-while-revalidate
- Image caching
- Offline fallbacks

To register the service worker:

```tsx
import { ServiceWorkerCache } from '@/lib/performance/caching-strategies'

useEffect(() => {
  ServiceWorkerCache.install()
}, [])
```

## Lazy Loading

### Component Lazy Loading

```tsx
import { createLazyComponent, Skeleton } from '@/lib/performance/lazy-loading'

const LazyChart = createLazyComponent(
  () => import('./Chart'),
  {
    fallback: <Skeleton height="400px" />,
    errorBoundary: ErrorBoundary,
    chunkName: 'charts'
  }
)

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <LazyChart data={chartData} />
    </div>
  )
}
```

### Image Lazy Loading

```tsx
import { LazyImage } from '@/lib/performance/lazy-loading'

function ImageGallery({ images }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image, index) => (
        <LazyImage
          key={image.id}
          src={image.url}
          alt={image.alt}
          width={300}
          height={200}
          className="rounded-lg"
          priority={index < 3} // Prioritize first 3 images
        />
      ))}
    </div>
  )
}
```

### Virtualized Lists for Large Datasets

```tsx
import { VirtualizedList } from '@/lib/performance/lazy-loading'

function LargeList({ items }) {
  return (
    <VirtualizedList
      items={items}
      itemHeight={60}
      containerHeight={400}
      overscan={5}
      renderItem={(item, index) => (
        <div className="p-4 border-b">
          {item.title}
        </div>
      )}
    />
  )
}
```

### HOC for Lazy Loading

```tsx
import { withLazyLoading } from '@/lib/performance/lazy-loading'

const LazyExpensiveComponent = withLazyLoading(ExpensiveComponent, {
  fallback: <Skeleton height="200px" />,
  rootMargin: '100px',
  threshold: 0.1
})
```

## Performance Monitoring

### Core Web Vitals Tracking

The monitoring system automatically tracks:
- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

### Custom Performance Tracking

```tsx
import { CustomMetrics, usePerformanceTracking } from '@/lib/performance/monitoring'

function ExpensiveComponent() {
  // Automatically track component render time
  usePerformanceTracking('ExpensiveComponent')

  useEffect(() => {
    // Custom performance marks
    CustomMetrics.mark('data-fetch-start')
    
    fetchData().then(() => {
      CustomMetrics.mark('data-fetch-end')
      const duration = CustomMetrics.measure(
        'data-fetch-duration',
        'data-fetch-start',
        'data-fetch-end'
      )
      console.log(`Data fetch took: ${duration}ms`)
    })
  }, [])

  return <div>Component content</div>
}
```

### Performance Metrics Reporting

Metrics are automatically sent to Google Analytics:

```tsx
// Metrics reported include:
// - web_vitals: Core Web Vitals scores
// - navigation_timing: Navigation performance
// - element_timing: Element render times
// - layout_shift: Layout shift events
// - slow_resource: Slow-loading resources
// - user_interaction: User interaction tracking
```

### Error Tracking

Automatic error tracking for:
- JavaScript errors
- Unhandled promise rejections
- Resource loading failures

## Performance Audit Tools

### Comprehensive Audit

```bash
# Run full performance audit
node scripts/performance-audit.js

# Audit specific URLs
node scripts/performance-audit.js http://localhost:3000 http://localhost:3000/dashboard
```

The audit generates:
- Performance scores for each URL
- Bundle size analysis
- Performance issue detection
- Optimization recommendations
- HTML and JSON reports

### Performance Issues Detected

- Large images (>500KB)
- Unused dependencies
- Console statements in production
- Missing key props in lists
- Large inline styles

### Bundle Analysis

```bash
# Analyze bundle with webpack-bundle-analyzer
npm run analyze

# Generate bundle report
node scripts/bundle-analyzer.js
```

## CI/CD Integration

### Performance CI Checks

```bash
# Run performance check in CI
node scripts/performance-ci.js http://localhost:3000 \
  --performance-threshold=90 \
  --bundle-size-threshold=1048576
```

### GitHub Actions Integration

```yaml
name: Performance Check
on: [pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        
      - name: Wait for app
        run: sleep 10
      
      - name: Run performance check
        run: node scripts/performance-ci.js http://localhost:3000
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: performance-reports/
```

### Performance Thresholds

Default thresholds (configurable):
- Performance Score: ≥90
- First Contentful Paint: ≤2000ms
- Largest Contentful Paint: ≤2500ms
- Cumulative Layout Shift: ≤0.1
- Time to Interactive: ≤5000ms
- Bundle Size: ≤1MB

## Best Practices

### 1. Bundle Optimization

- Use dynamic imports for route-based code splitting
- Implement feature-based splitting for large components
- Configure vendor chunk splitting appropriately
- Remove unused dependencies regularly
- Use tree shaking to eliminate dead code

### 2. Image Optimization

- Use next/image for automatic optimization
- Implement responsive images with srcSet
- Use modern formats (WebP, AVIF) with fallbacks
- Preload critical images
- Lazy load below-the-fold images

### 3. Caching Strategy

- Implement multi-layer caching (memory, HTTP, browser storage)
- Use stale-while-revalidate for API responses
- Configure appropriate cache TTLs
- Implement cache warming for critical data
- Use service workers for offline support

### 4. Lazy Loading

- Lazy load non-critical components
- Use intersection observer for visibility-based loading
- Implement virtualization for large lists
- Preload components on user interaction
- Provide appropriate loading states

### 5. Performance Monitoring

- Track Core Web Vitals continuously
- Monitor custom performance metrics
- Set up automated performance budgets
- Implement error tracking
- Use RUM (Real User Monitoring) data

### 6. Development Workflow

- Run performance audits regularly
- Set up performance CI checks
- Monitor bundle size changes
- Use performance budgets
- Profile and optimize critical paths

## Troubleshooting

### Common Performance Issues

#### 1. Large Bundle Size

**Symptoms:**
- Build generates large JavaScript files
- Slow initial page load
- Poor performance scores

**Solutions:**
```bash
# Analyze bundle composition
npm run analyze

# Check for duplicate dependencies
npm ls --depth=0

# Review and remove unused dependencies
npm uninstall unused-package
```

#### 2. Slow Image Loading

**Symptoms:**
- Images take long to load
- Poor LCP scores
- Layout shifts during image loading

**Solutions:**
```tsx
// Use optimized lazy loading
import { LazyImage } from '@/lib/performance/image-optimization'

// Preload critical images
ImagePreloader.preload('/critical-image.jpg', { priority: 'high' })

// Use proper sizing and formats
<LazyImage 
  src="/image.jpg"
  width={800}
  height={600}
  format="webp"
  priority={true} // For above-the-fold images
/>
```

#### 3. Poor Cache Performance

**Symptoms:**
- API requests not being cached
- Slow repeat visits
- High server load

**Solutions:**
```tsx
// Implement proper caching
import { apiCache } from '@/lib/performance/caching-strategies'

const fetchData = (id) => apiCache.get(
  `data-${id}`,
  () => fetch(`/api/data/${id}`).then(r => r.json()),
  { ttl: 300000, staleWhileRevalidate: 900000 }
)
```

#### 4. Layout Shifts (CLS Issues)

**Symptoms:**
- High Cumulative Layout Shift scores
- Content jumping during load

**Solutions:**
```tsx
// Reserve space for dynamic content
<div style={{ minHeight: '200px' }}>
  {loading ? <Skeleton height="200px" /> : <Content />}
</div>

// Use proper image dimensions
<LazyImage width={800} height={600} src="/image.jpg" />
```

#### 5. JavaScript Blocking

**Symptoms:**
- High Total Blocking Time
- Slow Time to Interactive

**Solutions:**
```tsx
// Use code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Defer non-critical JavaScript
useEffect(() => {
  import('./non-critical-module').then(module => {
    // Initialize non-critical functionality
  })
}, [])
```

### Debugging Performance

#### 1. Chrome DevTools

- Use Performance tab to profile runtime performance
- Analyze Network tab for resource loading
- Check Coverage tab for unused code
- Use Lighthouse for comprehensive audits

#### 2. Performance Monitoring

```tsx
// Check current metrics
import { getPerformanceMetrics } from '@/lib/performance/monitoring'

const metrics = getPerformanceMetrics()
console.log('Current performance metrics:', metrics)
```

#### 3. Bundle Analysis

```bash
# Generate detailed bundle report
node scripts/bundle-analyzer.js

# Check specific chunk sizes
ls -la .next/static/chunks/
```

### Performance Budget Guidelines

| Metric | Budget | Threshold |
|--------|--------|-----------|
| Performance Score | >90 | 85 |
| Bundle Size | <1MB | 1.5MB |
| FCP | <2s | 3s |
| LCP | <2.5s | 4s |
| CLS | <0.1 | 0.25 |
| TTI | <5s | 7s |

---

## Additional Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Next.js Performance Best Practices](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools Performance Guide](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance)
- [Webpack Bundle Optimization](https://webpack.js.org/guides/code-splitting/)

For questions or issues, please refer to the project documentation or create an issue in the repository.