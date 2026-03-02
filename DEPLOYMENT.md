# Deployment Guide: Cult of Psyche Vault + Grimoire

## Prerequisites

- GitHub account
- Netlify account (or Vercel account as alternative)
- PostgreSQL database (Neon, Supabase, or Railway recommended)
- Stripe account with API keys

## Step 1: Prepare for Deployment

### 1.1 Update .gitignore

Ensure sensitive files are excluded:
```
.env
.env.local
.env*.local
/uploads
/node_modules
/.next
```

### 1.2 Create Production Environment Variables

You'll need these environment variables in production:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET="your-secure-random-string-min-32-chars"

# Stripe (Production Keys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_LIFETIME_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.netlify.app"
```

## Step 2: Deploy to GitHub

### 2.1 Create GitHub Repository

```bash
# Navigate to project directory
cd kiroproj

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Cult of Psyche Vault + Grimoire MVP"

# Create repository on GitHub (via web interface)
# Then add remote and push:
git remote add origin https://github.com/YOUR_USERNAME/cult-of-psyche-vault.git
git branch -M main
git push -u origin main
```

### 2.2 Verify Repository

- Check that all files are pushed
- Verify .env is NOT in the repository
- Confirm .gitignore is working

## Step 3: Set Up PostgreSQL Database

### Option A: Neon (Recommended)

1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Enable connection pooling
5. Use pooled connection string for DATABASE_URL

### Option B: Supabase

1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string (use "Connection pooling" mode)
5. Replace password placeholder with your password

### Option C: Railway

1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Copy DATABASE_URL from variables

### 3.1 Run Database Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Seed admin user
npx prisma db seed
```

## Step 4: Deploy to Netlify

### 4.1 Connect Repository

1. Go to https://netlify.com
2. Click "Add new site" > "Import an existing project"
3. Choose GitHub and authorize
4. Select your repository

### 4.2 Configure Build Settings

**Build command:**
```bash
npm run build
```

**Publish directory:**
```
.next
```

**Note:** Netlify doesn't natively support Next.js App Router with server-side features. You have two options:

#### Option 1: Use Vercel (Recommended for Next.js)

Vercel is built by the Next.js team and has native support:

1. Go to https://vercel.com
2. Import your GitHub repository
3. Vercel auto-detects Next.js settings
4. Add environment variables (see below)
5. Deploy

#### Option 2: Use Netlify with Adapter

Install Next.js Netlify adapter:
```bash
npm install @netlify/plugin-nextjs
```

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 4.3 Add Environment Variables

In Netlify/Vercel dashboard, add these environment variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-random-string
STRIPE_SECRET_KEY=sk_live_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

### 4.4 Deploy

Click "Deploy site" and wait for build to complete.

## Step 5: Configure Stripe Webhooks

### 5.1 Get Webhook URL

Your webhook endpoint will be:
```
https://your-domain.netlify.app/api/stripe/webhook
```

### 5.2 Create Webhook in Stripe Dashboard

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### 5.3 Test Webhook

Use Stripe CLI to test:
```bash
stripe listen --forward-to https://your-domain.netlify.app/api/stripe/webhook
```

## Step 6: Post-Deployment Checklist

### 6.1 Verify Functionality

- [ ] Homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] Admin console accessible (admin@cultofpsyche.com / admin123)
- [ ] Vault content displays
- [ ] Grimoire entries load
- [ ] Journal CRUD works
- [ ] Rituals CRUD works
- [ ] Stripe checkout creates sessions
- [ ] Webhooks process correctly

### 6.2 Security Checks

- [ ] .env file not in repository
- [ ] HTTPS enabled
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Database uses SSL connection
- [ ] Stripe uses live keys (not test keys)
- [ ] Rate limiting active on auth endpoints

### 6.3 Performance Optimization

- [ ] Enable caching headers
- [ ] Optimize images
- [ ] Enable compression
- [ ] Monitor database query performance

## Step 7: Domain Configuration (Optional)

### 7.1 Add Custom Domain

In Netlify/Vercel:
1. Go to Domain settings
2. Add custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

### 7.2 Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` to your custom domain:
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**
- Solution: Ensure `prisma generate` runs during build
- Add to build command: `npx prisma generate && npm run build`

**Error: "DATABASE_URL is not defined"**
- Solution: Add DATABASE_URL to environment variables in hosting platform

### Runtime Errors

**Error: "JWT_SECRET is not defined"**
- Solution: Add JWT_SECRET to environment variables

**Error: "Prisma Client not initialized"**
- Solution: Ensure migrations ran: `npx prisma migrate deploy`

### Stripe Webhook Issues

**Error: "Webhook signature verification failed"**
- Solution: Ensure STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Check that webhook URL is correct

## Monitoring and Maintenance

### Database Backups

- Neon: Automatic backups included
- Supabase: Automatic backups included
- Railway: Configure backup schedule

### Log Monitoring

- Check Netlify/Vercel function logs
- Monitor database connection pool
- Track Stripe webhook delivery

### Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Deploy
git push origin main
```

## Support

For issues:
1. Check deployment logs in Netlify/Vercel
2. Review database connection
3. Verify environment variables
4. Test Stripe webhook delivery

## Production Recommendations

1. **Use Vercel instead of Netlify** - Better Next.js support
2. **Enable database connection pooling** - Better performance
3. **Set up monitoring** - Use Sentry or similar
4. **Configure CDN** - For static assets
5. **Enable rate limiting** - Protect against abuse
6. **Set up automated backups** - Database and uploads
7. **Use environment-specific Stripe keys** - Test vs Production
8. **Implement logging** - Track errors and usage
9. **Add health check endpoint** - Monitor uptime
10. **Document admin procedures** - User management, content moderation

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Create content in Vault and Grimoire
3. Set up Stripe products and pricing
4. Configure email notifications (future enhancement)
5. Add analytics tracking
6. Set up monitoring and alerts
7. Create user documentation
8. Plan marketing and launch strategy
