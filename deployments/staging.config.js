// Staging Environment Configuration
// This file contains staging-specific settings for deployment

const stagingConfig = {
  // Environment identification
  environment: 'staging',
  deploymentType: 'preview',
  
  // Domain and URL configuration
  domains: {
    primary: 'staging.visaassist.ai',
    fallback: 'visa-assist-staging.vercel.app',
    api: 'https://staging.visaassist.ai/api',
  },

  // Database configuration
  database: {
    provider: 'supabase',
    environment: 'staging',
    pooling: {
      min: 2,
      max: 10,
    },
    ssl: true,
    backup: {
      enabled: true,
      schedule: 'daily',
      retention: '7 days',
    },
  },

  // Performance settings
  performance: {
    // More lenient timeouts for testing
    timeouts: {
      api: 30000,      // 30 seconds
      ai: 90000,       // 90 seconds for AI processing
      upload: 60000,   // 60 seconds for file uploads
      payment: 30000,  // 30 seconds for payments
    },
    
    // Cache settings
    cache: {
      enabled: true,
      duration: 300,   // 5 minutes (shorter for testing)
      strategy: 'stale-while-revalidate',
    },
    
    // Rate limiting (more lenient)
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,                 // Higher limit for testing
      skipSuccessfulRequests: true,
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
    
    // Staging-specific features
    debugMode: true,
    verboseLogging: true,
    testMode: true,
    mockPayments: false, // Use real payment sandbox
  },

  // External services configuration
  services: {
    // AI providers (test/staging keys)
    ai: {
      openai: {
        model: 'gpt-3.5-turbo', // Use cheaper model for staging
        maxTokens: 2000,
        temperature: 0.7,
      },
      anthropic: {
        model: 'claude-3-haiku-20240307', // Use faster model for staging
        maxTokens: 2000,
      },
    },
    
    // Payment providers (sandbox/test mode)
    payments: {
      stripe: {
        mode: 'test',
        webhook: {
          tolerance: 600, // 10 minutes (more lenient)
        },
      },
      paypal: {
        mode: 'sandbox',
        webhook: {
          tolerance: 600,
        },
      },
    },
    
    // Email service
    email: {
      provider: 'sendgrid',
      templates: 'staging',
      testMode: true,
      recipients: {
        // Override recipients for testing
        admin: 'staging-admin@visaassist.ai',
        support: 'staging-support@visaassist.ai',
      },
    },
    
    // File storage
    storage: {
      provider: 'aws-s3',
      bucket: 'visa-assist-documents-staging',
      region: 'eu-central-1',
      encryption: true,
      versioning: true,
      lifecycle: {
        expiration: '30 days', // Shorter retention for staging
      },
    },
  },

  // Security settings
  security: {
    // More lenient CORS for testing
    cors: {
      origin: [
        'https://staging.visaassist.ai',
        'https://visa-assist-staging.vercel.app',
        'http://localhost:3000', // Allow local development
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    
    // Session configuration
    session: {
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: true,
      sameSite: 'lax',
    },
    
    // Rate limiting
    rateLimiting: {
      enabled: true,
      strict: false, // Less strict for testing
    },
  },

  // Monitoring and logging
  monitoring: {
    // Analytics
    analytics: {
      enabled: true,
      provider: 'google-analytics',
      id: process.env.NEXT_PUBLIC_GA_STAGING_ID,
      debug: true,
    },
    
    // Error tracking
    errorTracking: {
      enabled: true,
      provider: 'sentry',
      dsn: process.env.SENTRY_STAGING_DSN,
      environment: 'staging',
      sampleRate: 1.0, // Track all errors in staging
      tracesSampleRate: 1.0, // Track all transactions
    },
    
    // Logging
    logging: {
      level: 'debug',
      format: 'pretty',
      destination: 'console',
      includeStack: true,
    },
    
    // Performance monitoring
    performance: {
      enabled: true,
      webVitals: true,
      customMetrics: true,
    },
  },

  // Testing configuration
  testing: {
    // E2E testing
    e2e: {
      enabled: true,
      baseUrl: 'https://staging.visaassist.ai',
      parallel: true,
      retries: 2,
    },
    
    // Load testing
    load: {
      enabled: false, // Usually disabled for staging
      concurrent: 10,
      duration: '5m',
    },
    
    // Smoke testing
    smoke: {
      enabled: true,
      endpoints: [
        '/api/health',
        '/api/auth/session',
        '/dashboard',
      ],
    },
  },

  // Deployment settings
  deployment: {
    // Build configuration
    build: {
      optimization: 'standard',
      sourceMaps: true,
      bundleAnalysis: true,
    },
    
    // Rollback configuration
    rollback: {
      enabled: true,
      automatic: false,
      healthCheck: '/api/health',
    },
    
    // Blue-green deployment
    blueGreen: {
      enabled: false, // Not needed for staging
    },
    
    // Canary deployment
    canary: {
      enabled: false, // Not needed for staging
    },
  },

  // Cleanup and maintenance
  maintenance: {
    // Automatic cleanup
    cleanup: {
      tempFiles: {
        enabled: true,
        schedule: '0 2 * * *', // Daily at 2 AM
        maxAge: '1 day',
      },
      
      logs: {
        enabled: true,
        retention: '7 days',
      },
      
      uploads: {
        enabled: true,
        orphanedFiles: '24 hours',
      },
    },
    
    // Health checks
    healthChecks: {
      enabled: true,
      interval: '5 minutes',
      timeout: '30 seconds',
      retries: 3,
    },
  },

  // Notifications
  notifications: {
    // Deployment notifications
    deployment: {
      enabled: true,
      channels: ['slack', 'email'],
      recipients: {
        slack: process.env.SLACK_STAGING_WEBHOOK,
        email: 'dev-team@visaassist.ai',
      },
    },
    
    // Alert notifications
    alerts: {
      enabled: true,
      thresholds: {
        errorRate: 5,    // 5% error rate
        responseTime: 5000, // 5 seconds
        availability: 95,   // 95% uptime
      },
    },
  },
};

module.exports = stagingConfig;