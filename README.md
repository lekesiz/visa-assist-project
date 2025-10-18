# Visa Assist Project 🛂

An AI-powered visa application assistance platform built with Next.js 14, Supabase, and multiple AI providers.

## 🚀 Features

- **AI-Powered Document Analysis**: Automatically analyze and validate visa documents
- **Multi-Language Support**: Support for multiple languages with AI translation
- **Smart Application Tracking**: Track visa application status with timeline visualization
- **Document Management**: Secure upload and storage of visa documents
- **AI Assistant**: Get real-time help and suggestions for visa applications
- **Admin Dashboard**: Manage users, applications, and analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form, Zod validation
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel/Railway, Docker

## 📋 Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Supabase account
- API keys for AI services (OpenAI, Anthropic, Google AI)
- Docker (optional, for containerized development)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/visa-assist-project.git
   cd visa-assist-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys and configuration

4. **Set up Supabase**
   ```bash
   # Initialize Supabase
   supabase init

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run migrations
   supabase db push

   # Generate types
   pnpm generate:types

   # Seed database (optional)
   pnpm db:seed
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed folder structure and explanations.

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Open E2E test UI
pnpm test:e2e:ui
```

## 🐳 Docker Development

```bash
# Build and run with Docker Compose
docker-compose up

# Run in development mode
docker-compose -f docker-compose.dev.yml up
```

## 📝 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking
- `pnpm generate:types` - Generate TypeScript types from Supabase
- `pnpm analyze` - Analyze bundle size

## 🚀 Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` and follow the prompts
3. Set environment variables in Vercel dashboard

### Railway

1. Install Railway CLI
2. Run `railway login`
3. Run `railway up`

### Docker

```bash
# Build production image
docker build -t visa-assist:latest -f docker/Dockerfile .

# Run production container
docker run -p 3000:3000 visa-assist:latest
```

## 🔒 Security

- All sensitive data stored in environment variables
- Supabase Row Level Security (RLS) enabled
- API routes protected with authentication middleware
- Input validation with Zod schemas
- Rate limiting on AI endpoints
- CORS properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase team for the backend infrastructure
- Vercel for hosting and deployment
- All contributors and supporters

## 📞 Support

- Create an issue for bug reports
- Join our Discord server (coming soon)
- Email: support@visa-assist.com

---

Built with ❤️ by the Visa Assist Team