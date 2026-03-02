# Vercel Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] Code pushed to GitHub: https://github.com/fratercem-design/CULTCODEX26
- [x] Neon PostgreSQL database created
- [x] Database migrations applied (tables created)
- [x] JWT_SECRET generated: `b436609219b343854497c83d0ba2ae681ad1e252cd0db384e8b0c527692047cb`
- [x] Seed API endpoint created at `/api/admin/seed`

## 📋 Vercel Deployment Steps

### Step 1: Import Project to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Select repository: `fratercem-design/CULTCODEX26`
5. Click "Import"

### Step 2: Configure Build Settings
Vercel should auto-detect Next.js. Verify:
- Framework Preset: **Next.js**
- Root Directory: `./` (default)
- Build Command: `npm run build` (auto-filled)
- Output Directory: `.next` (auto-filled)

### Step 3: Add Environment Variables

**CRITICAL**: Add these environment variables before deploying:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_OsarJeUL9pD5@ep-soft-field-akoff4nc-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require` | ✅ Already added |
| `JWT_SECRET` | `b436609219b343854497c83d0ba2ae681ad1e252cd0db384e8b0c527692047cb` | ✅ Already generated |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_MONTHLY_PRICE_ID` | `price_...` | Stripe Dashboard → Products (create product) |
| `STRIPE_LIFETIME_PRICE_ID` | `price_...` | Stripe Dashboard → Products (create product) |
| `STRIPE_WEBHOOK_SECRET` | Leave blank for now | Will add after deployment |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now | Will add after deployment |
| `SEED_SECRET` | `your-secure-seed-secret` | Create a random string for seed endpoint security |

**To get Stripe keys:**
1. Go to https://dashboard.stripe.com
2. Click "Developers" → "API keys"
3. Copy "Secret key" (starts with `sk_test_`)
4. For price IDs: Go to "Products" → Create products → Copy price IDs

### Step 4: Deploy
1. After adding all environment variables, click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Copy your Vercel URL (e.g., `https://cultcodex26.vercel.app`)

### Step 5: Update Environment Variables with Vercel URL
1. Go to Vercel → Settings → Environment Variables
2. Add/Update:
   - `NEXT_PUBLIC_APP_URL` = `https://your-vercel-url.vercel.app`
3. Go to Deployments tab → Click "Redeploy"

## 🌱 Post-Deployment: Seed Database

After deployment succeeds, seed the database:

### Option 1: Using curl (Command Line)
```bash
curl -X POST https://your-vercel-url.vercel.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-secure-seed-secret"}'
```

### Option 2: Using Postman or Insomnia
- Method: POST
- URL: `https://your-vercel-url.vercel.app/api/admin/seed`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "secret": "your-secure-seed-secret"
}
```

### Option 3: Using Browser Console
Open your deployed site, open browser console (F12), and run:
```javascript
fetch('/api/admin/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'your-secure-seed-secret' })
})
.then(r => r.json())
.then(console.log);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "admin": {
    "email": "admin@cultofpsyche.com",
    "password": "admin123",
    "entitlements": ["admin", "vault_access", "grimoire_access"]
  }
}
```

## 🔐 Admin Login Credentials

After seeding:
- **Email**: `admin@cultofpsyche.com`
- **Password**: `admin123`
- **Login URL**: `https://your-vercel-url.vercel.app/login`

**IMPORTANT**: Change the admin password immediately after first login!

## 🎯 Test Your Deployment

Visit your Vercel URL and test:
- [ ] Homepage loads
- [ ] Can access /login page
- [ ] Can access /signup page
- [ ] Can login as admin
- [ ] Admin console loads (/admin)
- [ ] Vault page loads (/vault)
- [ ] Grimoire page loads (/grimoire)

## 🔗 Configure Stripe Webhook (After Testing)

1. **Get webhook URL**: `https://your-vercel-url.vercel.app/api/stripe/webhook`

2. **Add webhook in Stripe**:
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
   - Events to send:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.deleted`
   - Click "Add endpoint"

3. **Get webhook secret**:
   - Click on your new webhook
   - Click "Reveal" under "Signing secret"
   - Copy the secret (starts with `whsec_`)

4. **Add to Vercel**:
   - Go to Vercel → Settings → Environment Variables
   - Add `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Redeploy

## 🧹 Security: Remove Seed Endpoint (After Use)

After successfully seeding the database, you should remove the seed endpoint:

1. Delete the file: `app/api/admin/seed/route.ts`
2. Commit and push:
```bash
git rm app/api/admin/seed/route.ts
git commit -m "Remove seed endpoint after database initialization"
git push origin main
```
3. Vercel will auto-deploy the update

## 🎉 Deployment Complete!

Your Cult of Psyche platform is now live!

**Next Steps:**
1. Login as admin and change password
2. Create your first vault content
3. Add grimoire entries
4. Test Stripe checkout with test card: `4242 4242 4242 4242`
5. Set up custom domain (optional)
6. Switch to Stripe live keys when ready for production

## 📞 Troubleshooting

### Build Fails
- Check Vercel deployment logs
- Verify all environment variables are set
- Ensure DATABASE_URL is correct

### Can't Login
- Verify you ran the seed endpoint successfully
- Check Vercel function logs for errors
- Verify JWT_SECRET is set

### Stripe Issues
- Verify STRIPE_SECRET_KEY is set
- Check price IDs are correct
- Ensure using test mode keys for testing

---

**Repository**: https://github.com/fratercem-design/CULTCODEX26
**Deployment Guide**: See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions
