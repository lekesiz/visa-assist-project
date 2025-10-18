// Production Environment Configuration
// This file contains production-specific settings for deployment

const productionConfig = {
  // Environment identification
  environment: 'production',
  deploymentType: 'production',
  
  // Domain and URL configuration
  domains: {
    primary: 'visaassist.ai',
    www: 'www.visaassist.ai',
    api: 'https://visaassist.ai/api',
    cdn: 'https://cdn.visaassist.ai',
  },

  // Database configuration
  database: {
    provider: 'supabase',
    environment: 'production',
    pooling: {
      min: 5,
      max: 50,
    },
    ssl: true,
    connectionTimeout: 30000,
    backup: {
      enabled: true,
      schedule: 'daily',
      retention: '30 days',
      crossRegion: true,
    },
    monitoring: {
      slowQueries: true,
      threshold: 1000, // 1 second
    },
  },

  // Performance settings
  performance: {
    // Optimized timeouts
    timeouts: {
      api: 15000,      // 15 seconds
      ai: 60000,       // 60 seconds for AI processing
      upload: 30000,   // 30 seconds for file uploads
      payment: 20000,  // 20 seconds for payments
    },
    
    // Cache settings
    cache: {
      enabled: true,
      duration: 3600,  // 1 hour
      strategy: 'stale-while-revalidate',
      cdn: {
        enabled: true,
        provider: 'vercel',
        maxAge: 86400, // 24 hours
      },
    },
    
    // Rate limiting (strict)
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,                  // Requests per window
      skipSuccessfulRequests: false,
      trustProxy: true,
    },
    
    // Bundle optimization
    bundle: {
      compression: 'gzip',
      minification: true,
      treeshaking: true,
      splitChunks: true,
    },
  },

  // Feature flags
  features: {
    aiRecommendations: true,
    paymentProcessing: true,
    emailNotifications: true,
    calendarIntegration: true,
    documentAnalysis: true,
    jobSearch: true,
    eSignature: true,
    
    // Production-specific features
    debugMode: false,
    verboseLogging: false,
    testMode: false,
    mockPayments: false,
    analytics: true,
    performanceMonitoring: true,
  },

  // External services configuration
  services: {
    // AI providers (production keys)
    ai: {
      openai: {
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000,
        temperature: 0.3, // More deterministic for production
        timeout: 60000,
      },
      anthropic: {
        model: 'claude-3-opus-20240229',
        maxTokens: 4000,
        timeout: 60000,
      },
      fallback: {
        enabled: true,
        provider: 'openai', // Fallback to OpenAI if Anthropic fails
      },
    },
    
    // Payment providers (live mode)
    payments: {
      stripe: {
        mode: 'live',
        webhook: {
          tolerance: 300, // 5 minutes
          retries: 3,
        },
        fraud: {
          enabled: true,
          riskLevel: 'elevated',
        },
      },
      paypal: {
        mode: 'live',
        webhook: {
          tolerance: 300,
          retries: 3,
        },
      },
    },
    
    // Email service
    email: {
      provider: 'sendgrid',
      templates: 'production',
      testMode: false,
      deliverability: {
        tracking: true,
        bounceHandling: true,
      },
      recipients: {
        admin: 'admin@visaassist.ai',
        support: 'support@visaassist.ai',
        billing: 'billing@visaassist.ai',
      },
    },
    
    // File storage
    storage: {
      provider: 'aws-s3',
      bucket: 'visa-assist-documents-prod',
      region: 'eu-central-1',
      encryption: true,
      versioning: true,
      crossRegionReplication: true,
      lifecycle: {
        archiveAfter: '90 days',
        deleteAfter: '7 years', // Legal compliance
      },
      cdn: {
        enabled: true,
        provider: 'cloudfront',
        caching: '24 hours',
      },
    },
  },

  // Security settings
  security: {
    // Strict CORS
    cors: {
      origin: [
        'https://visaassist.ai',
        'https://www.visaassist.ai',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    
    // Session configuration
    session: {
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: 24 * 60 * 60, // 24 hours
      secure: true,
      sameSite: 'strict',
      httpOnly: true,
    },
    
    // Content Security Policy
    csp: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        'https://www.googletagmanager.com',
        'https://js.stripe.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      'connect-src': [
        "'self'",
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://api.stripe.com',
        'https://www.google-analytics.com',
      ],
    },
    
    // Rate limiting
    rateLimiting: {
      enabled: true,
      strict: true,
      bypassIPs: [], // Admin IPs if needed
    },
    
    // Security headers
    headers: {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // Monitoring and logging
  monitoring: {
    // Analytics
    analytics: {
      enabled: true,
      provider: 'google-analytics',
      id: process.env.NEXT_PUBLIC_GA_ID,
      debug: false,
      trackingConsent: true,
    },
    
    // Error tracking
    errorTracking: {
      enabled: true,
      provider: 'sentry',
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      sampleRate: 0.1, // 10% of errors
      tracesSampleRate: 0.1, // 10% of transactions
      profilesSampleRate: 0.1, // 10% of profiles
    },
    
    // Logging
    logging: {
      level: 'info',
      format: 'json',
      destination: 'external', // Send to external service
      pii: {
        enabled: false, // Don't log PII in production
        scrubbing: true,
      },
    },
    
    // Performance monitoring
    performance: {
      enabled: true,
      webVitals: true,
      customMetrics: true,
      alerting: {
        enabled: true,
        thresholds: {
          lcp: 2500,    // Largest Contentful Paint
          fid: 100,     // First Input Delay
          cls: 0.1,     // Cumulative Layout Shift
        },
      },
    },
    
    // Uptime monitoring
    uptime: {
      enabled: true,
      endpoints: [
        '/api/health',
        '/dashboard',
        '/',
      ],
      interval: '1 minute',
      locations: ['us-east-1', 'eu-central-1', 'ap-southeast-1'],
    },
  },

  // Testing configuration
  testing: {
    // E2E testing (production safe)
    e2e: {
      enabled: false, // Don't run against production
    },
    
    // Load testing
    load: {
      enabled: false, // Run separately, not in deployment
    },
    
    // Smoke testing
    smoke: {
      enabled: true,
      endpoints: [
        '/api/health',
        '/',
      ],
      timeout: 10000,
    },
  },

  // Deployment settings
  deployment: {
    // Build configuration
    build: {
      optimization: 'maximum',
      sourceMaps: false, // Don't expose source maps
      bundleAnalysis: false,
      minification: true,
    },
    
    // Rollback configuration
    rollback: {
      enabled: true,
      automatic: true,
      healthCheck: '/api/health',
      timeout: 300000, // 5 minutes
    },
    
    // Blue-green deployment
    blueGreen: {
      enabled: true,
      healthCheck: '/api/health',
      warmupTime: 30000, // 30 seconds
    },
    
    // Canary deployment
    canary: {
      enabled: true,
      percentage: 10, // Start with 10% traffic
      duration: 600000, // 10 minutes
      healthCheck: '/api/health',
      rollbackOnFailure: true,
    },
  },

  // Backup and disaster recovery
  backup: {
    // Database backups
    database: {
      enabled: true,
      schedule: 'daily',
      retention: '30 days',
      crossRegion: true,
      encryption: true,
      testing: {
        enabled: true,
        schedule: 'weekly',
      },
    },
    
    // File backups
    files: {
      enabled: true,
      schedule: 'daily',
      retention: '90 days',
      crossRegion: true,
    },
    
    // Configuration backups
    config: {
      enabled: true,
      schedule: 'daily',
      retention: '30 days',
    },
  },

  // Scaling configuration
  scaling: {
    // Auto-scaling
    auto: {
      enabled: true,
      minInstances: 2,
      maxInstances: 20,
      targetCPU: 70,
      targetMemory: 80,
    },
    
    // Load balancing
    loadBalancer: {
      enabled: true,
      healthCheck: '/api/health',
      stickySessions: false,
    },
  },

  // Compliance and legal
  compliance: {
    // GDPR compliance
    gdpr: {
      enabled: true,
      dataRetention: '2 years',
      rightToDelete: true,
      consentManagement: true,
    },
    
    // Data encryption
    encryption: {
      atRest: true,
      inTransit: true,
      keyRotation: '90 days',
    },
    
    // Audit logging
    audit: {
      enabled: true,
      retention: '7 years',
      immutable: true,
    },
  },

  // Notifications
  notifications: {
    // Deployment notifications
    deployment: {
      enabled: true,
      channels: ['slack', 'email', 'pagerduty'],
      recipients: {
        slack: process.env.SLACK_PROD_WEBHOOK,
        email: 'ops-team@visaassist.ai',
        pagerduty: process.env.PAGERDUTY_INTEGRATION_KEY,
      },
    },
    
    // Alert notifications
    alerts: {
      enabled: true,
      severity: {
        critical: ['pagerduty', 'slack', 'email'],
        warning: ['slack', 'email'],
        info: ['slack'],
      },
      thresholds: {
        errorRate: 1,      // 1% error rate
        responseTime: 2000, // 2 seconds
        availability: 99.9, // 99.9% uptime
      },
    },
  },
};

module.exports = productionConfig;