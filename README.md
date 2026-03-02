# 🔮 Cult of Psyche - Vault + Grimoire Platform

A membership platform featuring a gated Vault, versioned Grimoire, private Journal, and Ritual tracking. Includes an Admin Console with CRUD tools and role-based access control.

**Live Platform:** https://cultcodex-2666.vercel.app

> ⚠️ **Important:** This repository uses **JWT authentication** and **Prisma ORM**. If you're looking for a codebase using NextAuth or Drizzle ORM, that's a different repository (PSYCHEP2).

## 🚀 Features

### Core Platform
- **Authentication & Authorization**: JWT-based sessions with role-based access control (RBAC)
- **Monetization**: Stripe Checkout integration for subscriptions and one-time purchases
- **Content Gating**: Entitlement-based access control for premium content
- **Admin Console**: Complete user and content management interface

### Content Modules
- **Vault**: Gated content library with markdown support and asset delivery
- **Grimoire**: Versioned knowledge base with revision history
- **Journal**: Private journaling with markdown export
- **Rituals**: Calendar-based ritual tracking with ICS export

### Security & Compliance
- Input validation and sanitization (XSS prevention)
- Rate limiting on authentication endpoints
- Audit logging for all admin actions
- Secure file upload with type and size validation

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with jose library (NOT NextAuth)
- **Payments**: Stripe Checkout & Webhooks
- **Styling**: Tailwind CSS + Custom Occult Neon Theme
- **Validation**: Zod schemas
- **Security**: Input validation and XSS prevention

### PSYCHEP2 vs kiroproj (This Repo)

⚠️ **If you're looking at documentation mentioning NextAuth or Drizzle ORM, that's a different codebase.**

| Feature | PSYCHEP2 (Other Repo) | kiroproj (This Repo) |
|---------|----------------------|---------------------|
| Auth | NextAuth | JWT (custom) |
| ORM | Drizzle | Prisma |
| Migrations | Drizzle migrations | Prisma migrate |
| Session | NextAuth session | JWT cookies |
| Data Layer | Drizzle queries | Prisma Client |

**Do NOT mix these stacks.** If merging features from PSYCHEP2:
1. Copy UI components only
2. Rewrite data calls using Prisma
3. Rewrite auth checks using JWT middleware
4. Test thoroughly after each feature

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Stripe account (for payments)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cult-of-psyche-vault.git
cd cult-of-psyche-vault
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cultofpsyche"

# Authentication
JWT_SECRET="your-secure-random-string-min-32-characters"

# Stripe (use test keys for development)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_LIFETIME_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (creates admin user)
npx prisma db seed
```

### 5. Start the development server

```bash
npm run dev
```

Visit http://localhost:3000

## 👤 Default Admin Credentials

After seeding the database:

- **Email**: admin@cultofpsyche.com
- **Password**: admin123

⚠️ **Change these credentials immediately in production!**

## 📁 Project Structure

```
kiroproj/
├── app/                      # Next.js App Router
│   ├── (protected)/         # Protected routes (auth required)
│   │   ├── journal/         # Journal pages
│   │   └── rituals/         # Rituals pages
│   ├── admin/               # Admin console
│   │   ├── audit/           # Audit log viewer
│   │   ├── grimoire/        # Grimoire management
│   │   ├── users/           # User management
│   │   └── vault/           # Vault management
│   ├── api/                 # API routes
│   │   ├── admin/           # Admin endpoints
│   │   ├── auth/            # Authentication
│   │   ├── billing/         # Stripe checkout
│   │   ├── grimoire/        # Grimoire API
│   │   ├── journal/         # Journal API
│   │   ├── rituals/         # Rituals API
│   │   ├── stripe/          # Stripe webhooks
│   │   └── vault/           # Vault API
│   ├── grimoire/            # Grimoire pages
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── vault/               # Vault pages
├── lib/                     # Shared utilities
│   ├── auth/                # Authentication utilities
│   ├── db/                  # Database client
│   ├── services/            # External services
│   └── validation.ts        # Input validation
├── prisma/                  # Database schema & migrations
│   ├── migrations/          # Migration files
│   ├── schema.prisma        # Prisma schema
│   └── seed.ts              # Database seeder
└── uploads/                 # Uploaded assets (gitignored)
```

## 🔐 Authentication Flow

1. User signs up with email/password
2. Password is hashed with bcrypt (10 salt rounds)
3. JWT token created and stored in httpOnly cookie
4. Token expires after 7 days
5. Rate limiting: 5 requests per 15 minutes per IP

## 💳 Stripe Integration

### Checkout Flow
1. User clicks subscription/purchase button
2. API creates Stripe Checkout session
3. User redirected to Stripe payment page
4. After payment, Stripe sends webhook
5. Webhook grants entitlements to user

### Webhook Events
- `checkout.session.completed`: Grant entitlements
- `customer.subscription.deleted`: Revoke entitlements

### Testing Webhooks Locally

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Use test card: 4242 4242 4242 4242
```

## 🧪 Testing

Run test scripts to verify functionality:

```bash
# Authentication
node test-auth-complete.mjs

# Vault CRUD
node test-vault-admin-crud.mjs

# Grimoire
node test-grimoire-api.mjs

# Journal
node test-journal-api.mjs

# Rituals
node test-ritual-crud.mjs

# Admin Console
node test-admin-console-ui.mjs

# Validation
node test-validation.mjs
```

## 📦 Database Schema

### Core Models
- **User**: User accounts with email/password
- **Entitlement**: User access permissions (vault_access, grimoire_access, admin)
- **StripeEvent**: Webhook idempotency tracking

### Content Models
- **ContentItem**: Vault content with markdown
- **ContentAsset**: Uploaded files for vault items
- **GrimoireEntry**: Knowledge base entries
- **GrimoireRevision**: Version history for grimoire
- **JournalEntry**: Private user journals
- **RitualInstance**: Scheduled rituals

### Admin Models
- **AuditLog**: Admin action tracking
- **Tag**: Content categorization

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Run database migrations on production database
```

### Quick Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Add environment variables in Netlify dashboard
# Run database migrations on production database
```

## 🔒 Security Features

- **Input Validation**: Zod schemas for all API endpoints
- **XSS Prevention**: DOMPurify sanitization for markdown
- **Password Security**: bcrypt hashing with 10 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: SameSite cookies
- **SQL Injection Prevention**: Prisma parameterized queries
- **File Upload Security**: Type and size validation
- **Audit Logging**: All admin actions tracked

## 📚 API Documentation

### Complete Documentation

- **`PLATFORM_AUDIT_REPORT.md`** - Complete platform audit and feature status
- **`USER_GUIDE.md`** - Comprehensive user and admin guide
- **`DELIVERY_SUMMARY.md`** - Feature completeness matrix
- **`THEME_SHOWCASE.md`** - Occult neon theme documentation
- **`DEPLOYMENT.md`** - General deployment guide
- **`VERCEL_DEPLOYMENT_GUIDE.md`** - Vercel-specific instructions
- **`PRISMA_7_FIX.md`** - Prisma 7 serverless configuration
- **`WEBHOOK_SETUP.md`** - Stripe webhook setup

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout and clear session

### Vault
- `GET /api/vault` - List vault content (with search/filters)
- `GET /api/vault/[slug]` - Get vault item (entitlement gated)
- `POST /api/admin/vault` - Create vault item (admin only)
- `PATCH /api/admin/vault/[id]` - Update vault item (admin only)
- `DELETE /api/admin/vault/[id]` - Delete vault item (admin only)

### Grimoire
- `GET /api/grimoire` - List grimoire entries (requires grimoire_access)
- `GET /api/grimoire/[slug]` - Get grimoire entry
- `GET /api/grimoire/[slug]/revisions` - Get revision history
- `POST /api/admin/grimoire` - Create grimoire entry (admin only)
- `PATCH /api/admin/grimoire/[id]` - Update grimoire entry (admin only)

### Journal
- `GET /api/journal` - List user's journal entries
- `POST /api/journal` - Create journal entry
- `PATCH /api/journal/[id]` - Update journal entry
- `DELETE /api/journal/[id]` - Delete journal entry
- `GET /api/journal/export` - Export all entries as markdown

### Rituals
- `GET /api/rituals` - List user's rituals
- `POST /api/rituals` - Create ritual
- `PATCH /api/rituals/[id]` - Update ritual
- `DELETE /api/rituals/[id]` - Delete ritual
- `GET /api/rituals/export` - Export as ICS calendar file

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `POST /api/admin/users/[id]/entitlements` - Grant entitlement
- `DELETE /api/admin/users/[id]/entitlements/[type]` - Revoke entitlement
- `GET /api/admin/audit` - View audit logs (with pagination)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
npx prisma generate

# View database in browser
npx prisma studio
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 📧 Support

For issues or questions, please contact the project maintainer.

## 🎯 Roadmap

### Phase 1: MVP (Complete ✅)
- [x] Authentication & Authorization
- [x] Stripe Integration
- [x] Vault Content System
- [x] Grimoire Knowledge Base
- [x] Journal & Rituals
- [x] Admin Console
- [x] Input Validation & Security

### Phase 2: Enhancements (Future)
- [ ] Email notifications
- [ ] Social features (comments, likes)
- [ ] Advanced search
- [ ] Content recommendations
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Advanced admin permissions

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)

---

**Made with ❤️ for the Cult of Psyche community**
