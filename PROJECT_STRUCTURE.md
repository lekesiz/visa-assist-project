# Visa Assist Project - Complete Folder Structure

## 📁 Project Root Structure

```
visa-assist-project/
├── .github/                      # GitHub specific files
│   ├── workflows/                # CI/CD workflows
│   │   ├── ci.yml               # Continuous Integration
│   │   ├── deploy.yml           # Deployment workflow
│   │   └── test.yml             # Test automation
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   └── pull_request_template.md # PR template
│
├── .husky/                      # Git hooks
│   ├── pre-commit              # Pre-commit hooks
│   └── pre-push                # Pre-push hooks
│
├── .vscode/                     # VS Code settings
│   ├── settings.json           # Workspace settings
│   ├── extensions.json         # Recommended extensions
│   └── launch.json             # Debug configurations
│
├── app/                         # Next.js 14 App Router
│   ├── (auth)/                 # Auth route group
│   │   ├── login/              # Login page
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── register/           # Registration page
│   │   │   └── page.tsx
│   │   ├── forgot-password/    # Password reset
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Auth layout
│   │
│   ├── (dashboard)/            # Protected routes group
│   │   ├── dashboard/          # Main dashboard
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── applications/       # Visa applications
│   │   │   ├── page.tsx        # Applications list
│   │   │   ├── [id]/           # Application details
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   └── new/            # New application
│   │   │       └── page.tsx
│   │   ├── documents/          # Document management
│   │   │   ├── page.tsx
│   │   │   └── upload/
│   │   │       └── page.tsx
│   │   ├── profile/            # User profile
│   │   │   ├── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── admin/              # Admin panel
│   │   │   ├── users/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── layout.tsx          # Dashboard layout
│   │
│   ├── (public)/               # Public routes
│   │   ├── page.tsx            # Landing page
│   │   ├── about/              # About page
│   │   ├── pricing/            # Pricing page
│   │   ├── contact/            # Contact page
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   └── layout.tsx          # Public layout
│   │
│   ├── api/                    # API Routes
│   │   ├── auth/               # Auth endpoints
│   │   │   ├── [...supabase]/  # Supabase auth handler
│   │   │   └── route.ts
│   │   ├── applications/       # Application CRUD
│   │   │   ├── route.ts        # List/Create
│   │   │   └── [id]/
│   │   │       └── route.ts    # Read/Update/Delete
│   │   ├── documents/          # Document handling
│   │   │   ├── upload/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── ai/                 # AI endpoints
│   │   │   ├── analyze/        # Document analysis
│   │   │   │   └── route.ts
│   │   │   ├── suggest/        # AI suggestions
│   │   │   │   └── route.ts
│   │   │   └── translate/      # Translation service
│   │   │       └── route.ts
│   │   ├── webhooks/           # External webhooks
│   │   │   ├── stripe/         # Payment webhooks
│   │   │   └── supabase/       # Database webhooks
│   │   └── cron/               # Scheduled tasks
│   │       └── route.ts
│   │
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles
│   ├── error.tsx               # Error boundary
│   ├── not-found.tsx           # 404 page
│   └── robots.txt              # SEO robots file
│
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   ├── button.test.tsx
│   │   │   └── index.ts
│   │   ├── card/
│   │   ├── dialog/
│   │   ├── form/
│   │   │   ├── input/
│   │   │   ├── select/
│   │   │   ├── textarea/
│   │   │   └── file-upload/
│   │   ├── table/
│   │   ├── tabs/
│   │   ├── toast/
│   │   └── skeleton/
│   │
│   ├── features/               # Feature-specific components
│   │   ├── applications/       # Application components
│   │   │   ├── application-list.tsx
│   │   │   ├── application-form.tsx
│   │   │   ├── application-status.tsx
│   │   │   └── application-timeline.tsx
│   │   ├── documents/          # Document components
│   │   │   ├── document-upload.tsx
│   │   │   ├── document-viewer.tsx
│   │   │   └── document-list.tsx
│   │   ├── ai/                 # AI feature components
│   │   │   ├── ai-assistant.tsx
│   │   │   ├── ai-suggestions.tsx
│   │   │   └── document-analyzer.tsx
│   │   ├── auth/               # Auth components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── auth-provider.tsx
│   │   └── dashboard/          # Dashboard components
│   │       ├── stats-cards.tsx
│   │       ├── recent-activity.tsx
│   │       └── quick-actions.tsx
│   │
│   └── layouts/                # Layout components
│       ├── header/
│       │   ├── header.tsx
│       │   ├── nav-menu.tsx
│       │   └── user-menu.tsx
│       ├── sidebar/
│       │   ├── sidebar.tsx
│       │   └── sidebar-nav.tsx
│       └── footer/
│           └── footer.tsx
│
├── lib/                        # Libraries and utilities
│   ├── supabase/              # Supabase configuration
│   │   ├── client.ts          # Client-side client
│   │   ├── server.ts          # Server-side client
│   │   ├── middleware.ts      # Auth middleware
│   │   └── types.ts           # Database types
│   │
│   ├── ai/                    # AI integrations
│   │   ├── openai.ts          # OpenAI setup
│   │   ├── anthropic.ts       # Claude integration
│   │   ├── gemini.ts          # Gemini integration
│   │   └── prompts/           # AI prompts
│   │       ├── document-analysis.ts
│   │       └── visa-suggestions.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── cn.ts              # Class name utility
│   │   ├── format.ts          # Formatting helpers
│   │   ├── validation.ts      # Validation schemas
│   │   └── constants.ts       # App constants
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-auth.ts        # Auth hook
│   │   ├── use-supabase.ts    # Supabase hook
│   │   ├── use-toast.ts       # Toast notifications
│   │   └── use-debounce.ts    # Debounce hook
│   │
│   ├── services/              # Business logic services
│   │   ├── application.service.ts
│   │   ├── document.service.ts
│   │   ├── ai.service.ts
│   │   └── notification.service.ts
│   │
│   └── emails/                # Email templates
│       ├── welcome.tsx         # Welcome email
│       ├── application-update.tsx
│       └── templates/          # Email template components
│
├── public/                     # Static assets
│   ├── images/                # Images
│   │   ├── logo.svg
│   │   ├── hero/
│   │   └── icons/
│   ├── fonts/                 # Custom fonts
│   └── documents/             # Static documents
│       └── visa-guides/       # Visa guide PDFs
│
├── supabase/                  # Supabase configuration
│   ├── migrations/            # Database migrations
│   │   └── 001_initial_schema.sql
│   ├── functions/             # Edge functions
│   │   ├── process-document/
│   │   └── send-notification/
│   ├── seed.sql               # Seed data
│   └── config.toml            # Local config
│
├── types/                     # TypeScript types
│   ├── database.types.ts      # Supabase generated types
│   ├── api.types.ts           # API types
│   ├── ui.types.ts            # UI component types
│   └── global.d.ts            # Global type declarations
│
├── config/                    # Configuration files
│   ├── site.ts                # Site metadata
│   ├── navigation.ts          # Navigation config
│   └── features.ts            # Feature flags
│
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   │   ├── auth/
│   │   ├── applications/
│   │   └── fixtures/
│   └── setup/                 # Test setup files
│       ├── jest.setup.ts
│       └── test-utils.tsx
│
├── docker/                    # Docker configuration
│   ├── Dockerfile             # Production Dockerfile
│   ├── Dockerfile.dev         # Development Dockerfile
│   ├── docker-compose.yml     # Docker Compose
│   └── docker-compose.dev.yml # Dev Docker Compose
│
├── scripts/                   # Utility scripts
│   ├── setup.sh              # Project setup
│   ├── generate-types.ts     # Type generation
│   └── seed-db.ts            # Database seeding
│
├── docs/                      # Documentation
│   ├── API.md                # API documentation
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── CONTRIBUTING.md       # Contribution guide
│   └── architecture/         # Architecture diagrams
│
├── .env.example              # Environment variables example
├── .env.local                # Local environment (gitignored)
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .gitignore                # Git ignore file
├── docker-compose.yml        # Docker compose
├── jest.config.js            # Jest configuration
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
├── pnpm-lock.yaml           # Lock file (or yarn.lock)
├── README.md                # Project documentation
├── tailwind.config.ts       # Tailwind CSS config
└── tsconfig.json            # TypeScript config
```

## 📝 Folder Explanations

### `/app` - Next.js App Router
- **Route Groups**: `(auth)`, `(dashboard)`, `(public)` for organizing routes
- **Dynamic Routes**: `[id]` for dynamic segments
- **API Routes**: RESTful endpoints under `/api`
- **Loading/Error States**: Dedicated loading.tsx and error.tsx files

### `/components` - Component Library
- **ui/**: Atomic, reusable UI components
- **features/**: Complex, feature-specific components
- **layouts/**: Page layout components

### `/lib` - Core Libraries
- **supabase/**: Database client configuration
- **ai/**: AI service integrations (OpenAI, Claude, Gemini)
- **utils/**: Helper functions and utilities
- **hooks/**: Custom React hooks
- **services/**: Business logic layer

### `/supabase` - Database Configuration
- **migrations/**: SQL migration files
- **functions/**: Edge Functions for serverless logic
- **seed.sql**: Initial data for development

### `/types` - TypeScript Definitions
- Centralized type definitions
- Auto-generated Supabase types
- Global type declarations

### `/tests` - Testing Infrastructure
- Unit, integration, and e2e tests
- Test utilities and fixtures
- Jest and testing library setup

### `/docker` - Containerization
- Multi-stage Dockerfiles
- Development and production configurations
- Docker Compose for local development

### `/scripts` - Automation Scripts
- Setup and initialization scripts
- Type generation from Supabase
- Database seeding utilities

## 🚀 Getting Started

1. Clone the repository
2. Run `pnpm install` (or `npm install`)
3. Copy `.env.example` to `.env.local`
4. Set up Supabase project
5. Run `pnpm dev` to start development

## 📦 Key Dependencies

- **Next.js 14+**: React framework with App Router
- **Supabase**: Backend as a Service
- **Tailwind CSS**: Utility-first CSS
- **TypeScript**: Type safety
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **AI SDKs**: OpenAI, Anthropic, Google AI
- **Testing**: Jest, React Testing Library, Playwright

## 🔐 Security Considerations

- Environment variables for sensitive data
- Supabase Row Level Security (RLS)
- API route protection
- Input validation with Zod
- CORS configuration
- Rate limiting on AI endpoints

## 🎯 Development Workflow

1. Feature branches from `develop`
2. PR reviews required
3. CI/CD via GitHub Actions
4. Automated testing on PR
5. Deployment to Vercel/Railway