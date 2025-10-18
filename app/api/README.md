# API Endpoints Documentation

## 🔐 Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## 📄 Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List user documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/verify` - Verify document

## 📋 Applications
- `POST /api/applications` - Create application
- `GET /api/applications` - List user applications
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application
- `POST /api/applications/:id/submit` - Submit application

## 🤖 AI Services
- `POST /api/ai/analyze-document` - Analyze document with AI
- `POST /api/ai/recommend-visa` - Get visa recommendations
- `POST /api/ai/chat` - Chat with AI assistant

## 💼 Jobs
- `GET /api/jobs/search` - Search job listings
- `POST /api/jobs/apply` - Apply to job
- `GET /api/jobs/applications` - List job applications

## 💰 Payments
- `POST /api/payments/create-session` - Create payment session
- `POST /api/payments/webhook` - Stripe webhook
- `GET /api/payments/history` - Payment history

---

**Note**: All endpoints require authentication except auth endpoints.