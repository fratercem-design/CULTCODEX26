# Quick Start: Deploy to GitHub and Netlify/Vercel

## Step 1: Push to GitHub

### Create a new repository on GitHub
1. Go to https://github.com/new
2. Repository name: `cult-of-psyche-vault` (or your preferred name)
3. Make it **Private** (recommended for production apps)
4. **DO NOT** initialize with README (we already have one)
5. Click "Create repository"

### Push your code
```bash
cd kiroproj

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/cult-of-psyche-vault.git

# Push to GitHub
git push -u origin master
```

## Step 2: Set Up Production Database

### Option A: Neon (Recommended - Free tier available)
1. Go to https://neon.tech
2. Sign up / Log in
3. Click "Create Project"
4. Name: "cult-of-psyche"
5. Region: Choose closest to your users
6. Click "Create Project"
7. Copy the **Connection String** (starts with `postgresql://`)
8. **Important**: Use the "Pooled connection" string for better performance

### Option B: Supabase (Alternative - Free tier available)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy "Connection pooling" string
5. Replace `[YOUR-PASSWORD]` with your actual password

### Run Migrations on Production Database
```bash
# Set your production database URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Seed admin user
npx prisma db seed
```

## Step 3: Deploy to Vercel (Recommended)

Vercel is built by the Next.js team and has the best support for Next.js apps.

### Deploy via Vercel Dashboard
1. Go to https://vercel.com
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js settings
5. Click "Deploy"

### Add Environment Variables
In Vercel dashboard, go to Settings > Environment Variables and add:

```
DATABASE_URL=postgresql://your-neon-connection-string
JWT_SECRET=your-secure-random-string-min-32-chars
STRIPE_SECRET_KEY=sk_test_... (use test keys first)
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### Redeploy
After adding environment variables, click "Redeploy" in the Deployments tab.

## Step 4: Configure Stripe Webhooks

### Get Your Webhook URL
Your webhook endpoint will be:
```
https://your-project.vercel.app/api/stripe/webhook
```

### Add Webhook in Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
8. Redeploy in Vercel

## Step 5: Test Your Deployment

### Access Your Site
Visit: `https://your-project.vercel.app`

### Login as Admin
- Email: `admin@cultofpsyche.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately!

### Test Checklist
- [ ] Homepage loads
- [ ] Can sign up new user
- [ ] Can login
- [ ] Admin console accessible
- [ ] Vault content displays
- [ ] Grimoire entries load
- [ ] Journal works
- [ ] Rituals work
- [ ] Stripe checkout creates session (use test card: 4242 4242 4242 4242)

## Alternative: Deploy to Netlify

If you prefer Netlify:

### Deploy via Netlify Dashboard
1. Go to https://netlify.com
2. Click "Add new site" > "Import an existing project"
3. Choose GitHub
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables (same as Vercel)
7. Deploy

**Note**: Netlify requires the `@netlify/plugin-nextjs` plugin (already configured in `netlify.toml`)

## Troubleshooting

### Build Fails with "Cannot find module '@prisma/client'"
**Solution**: Ensure build command includes `npx prisma generate`:
```bash
npx prisma generate && npm run build
```

### Runtime Error: "DATABASE_URL is not defined"
**Solution**: Add DATABASE_URL to environment variables in hosting platform

### Stripe Webhook Fails
**Solution**: 
1. Verify webhook URL is correct
2. Check STRIPE_WEBHOOK_SECRET matches Stripe dashboard
3. Ensure webhook events are selected in Stripe

### Can't Login as Admin
**Solution**: 
1. Verify database migrations ran: `npx prisma migrate deploy`
2. Verify seed script ran: `npx prisma db seed`
3. Check database has admin user with email `admin@cultofpsyche.com`

## Next Steps

1. **Change Admin Password**: Login and update admin credentials
2. **Create Content**: Add vault items and grimoire entries
3. **Set Up Stripe Products**: Create your actual subscription products
4. **Test Payment Flow**: Use Stripe test cards to verify checkout
5. **Custom Domain**: Add your custom domain in Vercel/Netlify
6. **Monitor**: Set up error tracking (Sentry recommended)
7. **Backup**: Configure automated database backups

## Production Checklist

Before going live:
- [ ] Change admin password
- [ ] Use Stripe live keys (not test keys)
- [ ] Set up custom domain
- [ ] Enable HTTPS (automatic with Vercel/Netlify)
- [ ] Configure database backups
- [ ] Set up monitoring/alerts
- [ ] Test all features thoroughly
- [ ] Review security settings
- [ ] Set up error tracking
- [ ] Document admin procedures

## Support

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

For general documentation, see [README.md](./README.md)

---

**🎉 Congratulations! Your Cult of Psyche platform is now live!**
