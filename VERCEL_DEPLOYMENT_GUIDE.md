# Vercel Deployment Guide - Step by Step

## ✅ Prerequisites Completed
- [x] Code pushed to GitHub: https://github.com/fratercem-design/CULTCODEX26

## 🚀 Step-by-Step Deployment

### Step 1: Set Up Production Database (Do This First!)

You need a PostgreSQL database before deploying. Choose one:

#### Option A: Neon (Recommended - Free Tier)
1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub to sign in)
3. Click "Create a project"
4. Project name: `cultcodex26`
5. Region: Choose closest to your users (e.g., US East)
6. Click "Create project"
7. **IMPORTANT**: Copy the connection string that appears
   - It looks like: `postgresql://username:password@host.neon.tech/dbname?sslmode=require`
   - **Use the "Pooled connection" string** (better for serverless)
8. Save this connection string - you'll need it for Vercel

#### Option B: Supabase (Alternative - Free Tier)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy "Connection pooling" string (not "Connection string")
5. Replace `[YOUR-PASSWORD]` with your actual password

### Step 2: Run Database Migrations

Open your terminal and run these commands:

```bash
cd kiroproj

# Set your production database URL (use the one from Neon/Supabase)
$env:DATABASE_URL="postgresql://your-connection-string-here"

# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Seed the admin user
npx prisma db seed
```

**Expected output:**
- Migrations applied successfully
- Admin user created: admin@cultofpsyche.com / admin123

### Step 3: Generate JWT Secret

You need a secure random string for JWT tokens:

```bash
# Generate a random 32-character string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your `JWT_SECRET`

### Step 4: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign Up/Login**: Use GitHub to sign in
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Find and select `fratercem-design/CULTCODEX26`
   - Click "Import"

4. **Configure Project**:
   - Vercel will auto-detect Next.js
   - Framework Preset: **Next.js** (should be auto-selected)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `.next` (auto-filled)

5. **DO NOT CLICK DEPLOY YET!**
   - First, we need to add environment variables

### Step 5: Add Environment Variables in Vercel

Click "Environment Variables" section and add these:

#### Required Variables:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Your Neon/Supabase connection string |
| `JWT_SECRET` | `your-64-char-hex-string` | From Step 3 |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Get from Stripe Dashboard (use test key first) |
| `STRIPE_MONTHLY_PRICE_ID` | `price_...` | Your Stripe monthly price ID |
| `STRIPE_LIFETIME_PRICE_ID` | `price_...` | Your Stripe lifetime price ID |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Leave blank for now, we'll add after deployment |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now | We'll add after deployment |

**Where to get Stripe keys:**
1. Go to https://dashboard.stripe.com
2. Click "Developers" → "API keys"
3. Copy "Secret key" (starts with `sk_test_`)
4. For price IDs, go to "Products" → Create products → Copy price IDs

**Important**: Use **test keys** first, not live keys!

### Step 6: Deploy!

1. After adding all environment variables, click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see a success screen with your URL

### Step 7: Get Your Vercel URL

After deployment succeeds:
1. Copy your Vercel URL (e.g., `https://cultcodex26.vercel.app`)
2. Go to Settings → Environment Variables
3. Add/Update these variables:
   - `NEXT_PUBLIC_APP_URL` = `https://your-project.vercel.app`
4. Click "Redeploy" in the Deployments tab

### Step 8: Configure Stripe Webhook

Now that your site is live, set up the webhook:

1. **Get your webhook URL**: `https://your-project.vercel.app/api/stripe/webhook`

2. **Add webhook in Stripe**:
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-project.vercel.app/api/stripe/webhook`
   - Description: "CULTCODEX26 Production"
   - Events to send:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.deleted`
   - Click "Add endpoint"

3. **Get webhook secret**:
   - Click on your new webhook
   - Click "Reveal" under "Signing secret"
   - Copy the secret (starts with `whsec_`)

4. **Add to Vercel**:
   - Go back to Vercel → Settings → Environment Variables
   - Add `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Click "Redeploy"

### Step 9: Test Your Deployment

Visit your Vercel URL: `https://your-project.vercel.app`

**Test checklist:**
- [ ] Homepage loads
- [ ] Can access /login page
- [ ] Can access /signup page
- [ ] Can login as admin (admin@cultofpsyche.com / admin123)
- [ ] Admin console loads (/admin)
- [ ] Vault page loads (/vault)
- [ ] Grimoire page loads (/grimoire)

### Step 10: Test Stripe Integration

1. **Create a test product** (if you haven't):
   - Go to Stripe Dashboard → Products
   - Create a product with monthly/lifetime pricing
   - Copy the price IDs

2. **Test checkout**:
   - Login to your site
   - Try to access gated content
   - Click upgrade/purchase button
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date, any CVC

3. **Verify webhook**:
   - After test purchase, check Stripe Dashboard → Webhooks
   - Should show successful delivery
   - Check your admin console - user should have entitlement

## 🎉 Deployment Complete!

Your site is now live at: `https://your-project.vercel.app`

## 🔒 Security Checklist

Before going live with real users:

- [ ] Change admin password (login and update)
- [ ] Switch to Stripe live keys (not test keys)
- [ ] Update webhook to use live mode
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure database backups
- [ ] Test all features thoroughly

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**
```bash
# Solution: Vercel should run prisma generate automatically
# If not, check that package.json has correct build script
```

**Error: "DATABASE_URL is not defined"**
- Check environment variables in Vercel
- Make sure DATABASE_URL is set correctly
- Redeploy after adding

### Runtime Errors

**Error: "PrismaClient is unable to connect"**
- Verify DATABASE_URL is correct
- Check database is accessible from internet
- Ensure SSL mode is enabled: `?sslmode=require`

**Error: "JWT_SECRET is not defined"**
- Add JWT_SECRET to Vercel environment variables
- Redeploy

**Can't login as admin**
- Verify you ran `npx prisma db seed` on production database
- Check database has admin user:
  ```bash
  npx prisma studio
  # Check Users table for admin@cultofpsyche.com
  ```

### Stripe Issues

**Webhook fails**
- Verify webhook URL is correct
- Check STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Look at Stripe Dashboard → Webhooks → Event logs

**Checkout doesn't work**
- Verify STRIPE_SECRET_KEY is set
- Check price IDs are correct
- Ensure using test mode keys for testing

## 📊 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution
- Check error rates

### Stripe Dashboard
- Monitor webhook deliveries
- Check payment events
- View customer subscriptions

### Database
- Monitor connection pool usage
- Check query performance
- Set up automated backups

## 🚀 Next Steps

1. **Custom Domain** (Optional):
   - Go to Vercel → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed
   - Update `NEXT_PUBLIC_APP_URL` environment variable

2. **Production Stripe**:
   - Switch to live Stripe keys
   - Create production webhook
   - Test with real payment methods

3. **Content**:
   - Login as admin
   - Create vault content
   - Add grimoire entries
   - Test entitlement gating

4. **Monitoring**:
   - Set up Sentry: https://sentry.io
   - Enable Vercel Analytics
   - Configure uptime monitoring

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs
3. Check Stripe webhook logs
4. Verify all environment variables are set
5. Test database connection

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Site loads without errors
- ✅ Can signup/login
- ✅ Admin console accessible
- ✅ Content displays correctly
- ✅ Stripe checkout works
- ✅ Webhooks process successfully
- ✅ Entitlements grant/revoke correctly

---

**Congratulations! Your Cult of Psyche platform is now live! 🎉**
