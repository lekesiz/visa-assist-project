// Performance Configuration for Visa Assist AI
// This file contains performance optimization settings and monitoring configurations

const performanceConfig = {
  // Bundle Analysis Configuration
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
    options: {
      analyzerMode: 'static',
      openAnalyzer: false,
      generateStatsFile: true,
      statsOptions: {
        source: false,
        modules: false,
      },
      reportTitle: 'Visa Assist AI Bundle Analysis',
    },
  },

  // Core Web Vitals Thresholds
  coreWebVitals: {
    // Largest Contentful Paint (LCP) - should be <= 2.5s
    lcp: {
      good: 2500,
      needsImprovement: 4000,
    },
    // First Input Delay (FID) - should be <= 100ms
    fid: {
      good: 100,
      needsImprovement: 300,
    },
    // Cumulative Layout Shift (CLS) - should be <= 0.1
    cls: {
      good: 0.1,
      needsImprovement: 0.25,
    },
    // First Contentful Paint (FCP) - should be <= 1.8s
    fcp: {
      good: 1800,
      needsImprovement: 3000,
    },
    // Time to Interactive (TTI) - should be <= 3.8s
    tti: {
      good: 3800,
      needsImprovement: 7300,
    },
  },

  // Performance Budget Configuration
  performanceBudget: {
    // Maximum bundle sizes (in KB)
    maxBundleSize: {
      total: 1000, // Total JS bundle size
      vendor: 500, // Third-party libraries
      app: 300,    // Application code
      css: 100,    // Stylesheets
    },
    
    // Maximum asset sizes (in KB)
    maxAssetSize: {
      image: 500,  // Individual images
      font: 100,   // Font files
      video: 5000, // Video files
    },
    
    // Maximum request counts
    maxRequests: {
      total: 100,     // Total HTTP requests
      js: 10,         // JavaScript files
      css: 5,         // CSS files
      images: 50,     // Image files
      fonts: 5,       // Font files
    },
  },

  // Image Optimization Settings
  imageOptimization: {
    quality: 85,
    formats: ['image/avif', 'image/webp'],
    sizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Caching Strategy
  caching: {
    // Static assets cache duration (in seconds)
    staticAssets: 31536000, // 1 year
    
    // API responses cache duration
    apiResponses: {
      default: 300,        // 5 minutes
      publicData: 3600,    // 1 hour
      userData: 60,        // 1 minute
      fileUploads: 86400,  // 1 day
    },
    
    // Browser cache headers
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },

  // Code Splitting Configuration
  codeSplitting: {
    // Chunk splitting strategy
    chunks: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        priority: 10,
        reuseExistingChunk: true,
      },
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        priority: 30,
        reuseExistingChunk: true,
      },
      ui: {
        test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
        priority: 20,
        reuseExistingChunk: true,
      },
      utils: {
        test: /[\\/]lib[\\/]/,
        priority: 5,
        reuseExistingChunk: true,
      },
    },
    
    // Dynamic import thresholds
    minSize: 20000,     // Minimum chunk size (20KB)
    maxSize: 244000,    // Maximum chunk size (244KB)
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
  },

  // Runtime Performance Monitoring
  monitoring: {
    // Performance observer configuration
    observer: {
      entryTypes: ['navigation', 'paint', 'measure', 'resource'],
      buffered: true,
    },
    
    // Analytics configuration
    analytics: {
      enabled: process.env.NODE_ENV === 'production',
      trackingId: process.env.NEXT_PUBLIC_GA_ID,
      reportWebVitals: true,
      
      // Custom metrics to track
      customMetrics: [
        'api-response-time',
        'document-upload-time',
        'ai-processing-time',
        'payment-completion-time',
      ],
    },
    
    // Error tracking
    errorTracking: {
      enabled: process.env.NODE_ENV === 'production',
      dsn: process.env.SENTRY_DSN,
      
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      profilesSampleRate: 0.1, // 10% of transactions
    },
  },

  // Build Performance Optimization
  build: {
    // Parallel processing
    parallel: true,
    
    // Memory usage optimization
    memoryLimit: 4096, // 4GB
    
    // Minification settings
    minify: {
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
    
    // Tree shaking
    treeShaking: true,
    sideEffects: false,
    
    // Source maps (only for production debugging)
    sourceMaps: process.env.NODE_ENV === 'development',
  },

  // Network Optimization
  network: {
    // HTTP/2 Server Push resources
    serverPush: [
      '/fonts/inter-var.woff2',
      '/icons/favicon.ico',
    ],
    
    // Preload critical resources
    preload: [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    ],
    
    // Prefetch non-critical resources
    prefetch: [
      '/api/health',
      '/dashboard',
    ],
    
    // DNS prefetch for external domains
    dnsPrefetch: [
      'https://fonts.googleapis.com',
      'https://api.openai.com',
      'https://api.anthropic.com',
    ],
  },

  // Security Performance Impact
  security: {
    // Content Security Policy
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'", 'https://api.openai.com', 'https://api.anthropic.com'],
    },
    
    // Security headers performance impact
    headers: {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'origin-when-cross-origin',
    },
  },

  // Development Performance
  development: {
    // Fast refresh configuration
    fastRefresh: true,
    
    // Hot module replacement
    hmr: true,
    
    // Source map configuration
    devtool: 'eval-cheap-module-source-map',
    
    // Development server optimization
    devServer: {
      compress: true,
      hot: true,
      liveReload: true,
    },
  },
};

module.exports = performanceConfig;