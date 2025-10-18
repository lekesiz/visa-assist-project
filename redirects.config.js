// Redirects and Rewrites Configuration
// This file contains comprehensive URL management for the Visa Assist AI application

const redirectsConfig = {
  // Permanent redirects (301) - These affect SEO and should be used for permanent moves
  permanentRedirects: [
    // Legacy URL redirects
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
    {
      source: '/signin',
      destination: '/login',
      permanent: true,
    },
    {
      source: '/signup',
      destination: '/register',
      permanent: true,
    },
    {
      source: '/sign-in',
      destination: '/login',
      permanent: true,
    },
    {
      source: '/sign-up',
      destination: '/register',
      permanent: true,
    },
    
    // Old authentication URLs
    {
      source: '/auth/signin',
      destination: '/login',
      permanent: true,
    },
    {
      source: '/auth/signup',
      destination: '/register',
      permanent: true,
    },
    {
      source: '/auth/login',
      destination: '/login',
      permanent: true,
    },
    {
      source: '/auth/register',
      destination: '/register',
      permanent: true,
    },
    
    // Dashboard redirects
    {
      source: '/app',
      destination: '/dashboard',
      permanent: true,
    },
    {
      source: '/panel',
      destination: '/dashboard',
      permanent: true,
    },
    {
      source: '/profile',
      destination: '/dashboard/profile',
      permanent: true,
    },
    {
      source: '/settings',
      destination: '/dashboard/profile',
      permanent: true,
    },
    
    // Application management
    {
      source: '/applications',
      destination: '/dashboard/applications',
      permanent: true,
    },
    {
      source: '/visas',
      destination: '/dashboard/applications',
      permanent: true,
    },
    {
      source: '/my-applications',
      destination: '/dashboard/applications',
      permanent: true,
    },
    
    // Document management
    {
      source: '/documents',
      destination: '/dashboard/documents',
      permanent: true,
    },
    {
      source: '/files',
      destination: '/dashboard/documents',
      permanent: true,
    },
    {
      source: '/uploads',
      destination: '/dashboard/documents',
      permanent: true,
    },
    
    // Payment redirects
    {
      source: '/payments',
      destination: '/dashboard/payments',
      permanent: true,
    },
    {
      source: '/billing',
      destination: '/dashboard/payments',
      permanent: true,
    },
    {
      source: '/invoices',
      destination: '/dashboard/payments',
      permanent: true,
    },
    
    // Appointment redirects
    {
      source: '/appointments',
      destination: '/dashboard/appointments',
      permanent: true,
    },
    {
      source: '/schedule',
      destination: '/dashboard/appointments',
      permanent: true,
    },
    {
      source: '/booking',
      destination: '/dashboard/appointments',
      permanent: true,
    },
    
    // WWW to non-WWW redirect (SEO best practice)
    {
      source: '/(.*)',
      has: [
        {
          type: 'host',
          value: 'www.visaassist.ai',
        },
      ],
      destination: 'https://visaassist.ai/$1',
      permanent: true,
    },
  ],

  // Temporary redirects (302) - These can be changed and don't affect SEO permanently
  temporaryRedirects: [
    // Feature under maintenance
    {
      source: '/docs',
      destination: '/faq',
      permanent: false,
    },
    {
      source: '/help',
      destination: '/contact',
      permanent: false,
    },
    {
      source: '/support',
      destination: '/contact',
      permanent: false,
    },
    
    // Beta features (can be changed later)
    {
      source: '/beta',
      destination: '/dashboard',
      permanent: false,
    },
    {
      source: '/preview',
      destination: '/dashboard',
      permanent: false,
    },
  ],

  // Rewrites - These don't change the URL but serve different content
  rewrites: [
    // API route rewrites for better organization
    {
      source: '/sitemap.xml',
      destination: '/api/sitemap',
    },
    {
      source: '/robots.txt',
      destination: '/api/robots',
    },
    {
      source: '/favicon.ico',
      destination: '/api/favicon',
    },
    {
      source: '/manifest.json',
      destination: '/api/manifest',
    },
    
    // Health check endpoints
    {
      source: '/health',
      destination: '/api/health',
    },
    {
      source: '/status',
      destination: '/api/health',
    },
    {
      source: '/ping',
      destination: '/api/health',
    },
    
    // Webhook endpoints (cleaner URLs)
    {
      source: '/webhooks/stripe',
      destination: '/api/payments/webhooks/stripe',
    },
    {
      source: '/webhooks/paypal',
      destination: '/api/payments/webhooks/paypal',
    },
    {
      source: '/webhooks/sendgrid',
      destination: '/api/email/webhooks/sendgrid',
    },
    
    // OAuth callbacks
    {
      source: '/oauth/google',
      destination: '/api/auth/callback/google',
    },
    {
      source: '/oauth/microsoft',
      destination: '/api/auth/callback/microsoft',
    },
    
    // File serving rewrites
    {
      source: '/files/:path*',
      destination: '/api/files/:path*',
    },
    {
      source: '/documents/:path*',
      destination: '/api/documents/:path*',
    },
    
    // API versioning
    {
      source: '/v1/:path*',
      destination: '/api/:path*',
    },
    {
      source: '/api/v1/:path*',
      destination: '/api/:path*',
    },
    
    // Admin panel rewrites (if needed)
    {
      source: '/admin/:path*',
      destination: '/dashboard/admin/:path*',
    },
  ],

  // Internationalization redirects (if multi-language support is added)
  i18nRedirects: [
    // Redirect old language URLs to new format
    {
      source: '/en/:path*',
      destination: '/:path*',
      permanent: true,
      locale: false,
    },
    {
      source: '/english/:path*',
      destination: '/:path*',
      permanent: true,
      locale: false,
    },
    
    // Language-specific redirects
    {
      source: '/de/anmelden',
      destination: '/de/login',
      permanent: true,
    },
    {
      source: '/tr/giris',
      destination: '/tr/login',
      permanent: true,
    },
  ],

  // Conditional redirects based on user agent, headers, etc.
  conditionalRedirects: [
    // Mobile app deep linking
    {
      source: '/app/:path*',
      has: [
        {
          type: 'header',
          key: 'user-agent',
          value: '.*Mobile.*',
        },
      ],
      destination: '/mobile/:path*',
      permanent: false,
    },
    
    // Legacy browser redirects
    {
      source: '/:path*',
      has: [
        {
          type: 'header',
          key: 'user-agent',
          value: '.*MSIE.*',
        },
      ],
      destination: '/browser-not-supported',
      permanent: false,
    },
    
    // Maintenance mode redirects
    {
      source: '/:path*',
      has: [
        {
          type: 'header',
          key: 'x-maintenance-mode',
          value: 'true',
        },
      ],
      destination: '/maintenance',
      permanent: false,
    },
  ],

  // External redirects (to other domains)
  externalRedirects: [
    // Old domain redirects (if migrating from another domain)
    {
      source: '/blog/:path*',
      destination: 'https://blog.visaassist.ai/:path*',
      permanent: true,
    },
    {
      source: '/docs/:path*',
      destination: 'https://docs.visaassist.ai/:path*',
      permanent: false,
    },
  ],

  // Catch-all and fallback redirects
  fallbackRedirects: [
    // Catch common typos
    {
      source: '/dashbord',
      destination: '/dashboard',
      permanent: false,
    },
    {
      source: '/aplications',
      destination: '/dashboard/applications',
      permanent: false,
    },
    {
      source: '/aplication',
      destination: '/dashboard/applications',
      permanent: false,
    },
    
    // Catch old API routes
    {
      source: '/api/v0/:path*',
      destination: '/api/:path*',
      permanent: true,
    },
    
    // Redirect 404 paths to homepage or search
    {
      source: '/404',
      destination: '/',
      permanent: false,
    },
  ],

  // Security redirects
  securityRedirects: [
    // Block access to sensitive files
    {
      source: '/.env',
      destination: '/404',
      permanent: false,
    },
    {
      source: '/.env.local',
      destination: '/404',
      permanent: false,
    },
    {
      source: '/config/:path*',
      destination: '/404',
      permanent: false,
    },
    
    // Redirect common attack vectors
    {
      source: '/wp-admin/:path*',
      destination: '/404',
      permanent: false,
    },
    {
      source: '/wp-login.php',
      destination: '/404',
      permanent: false,
    },
    {
      source: '/admin.php',
      destination: '/404',
      permanent: false,
    },
  ],
};

// Helper function to generate Vercel-compatible redirects
function generateVercelRedirects() {
  const vercelRedirects = [];
  
  // Add permanent redirects
  redirectsConfig.permanentRedirects.forEach(redirect => {
    vercelRedirects.push({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
      ...(redirect.has && { has: redirect.has }),
      ...(redirect.locale !== undefined && { locale: redirect.locale }),
    });
  });
  
  // Add temporary redirects
  redirectsConfig.temporaryRedirects.forEach(redirect => {
    vercelRedirects.push({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
      ...(redirect.has && { has: redirect.has }),
    });
  });
  
  // Add conditional redirects
  redirectsConfig.conditionalRedirects.forEach(redirect => {
    vercelRedirects.push({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
      has: redirect.has,
    });
  });
  
  // Add external redirects
  redirectsConfig.externalRedirects.forEach(redirect => {
    vercelRedirects.push({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
    });
  });
  
  // Add fallback redirects
  redirectsConfig.fallbackRedirects.forEach(redirect => {
    vercelRedirects.push({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
    });
  });
  
  // Add security redirects
  redirectsConfig.securityRedirects.forEach(redirect => {
    vercelRedirects.push({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
    });
  });
  
  return vercelRedirects;
}

// Helper function to generate Vercel-compatible rewrites
function generateVercelRewrites() {
  return redirectsConfig.rewrites.map(rewrite => ({
    source: rewrite.source,
    destination: rewrite.destination,
    ...(rewrite.has && { has: rewrite.has }),
  }));
}

module.exports = {
  redirectsConfig,
  generateVercelRedirects,
  generateVercelRewrites,
};