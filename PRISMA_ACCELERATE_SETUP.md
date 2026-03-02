# Prisma Accelerate Setup Guide

## Why Prisma Accelerate?
Prisma Accelerate is specifically designed for serverless environments like Vercel. It provides:
- Connection pooling optimized for serverless
- Global caching
- No cold start connection issues
- Better reliability than pg adapter in serverless

## Setup Steps

### 1. Create Prisma Accelerate Account
1. Go to: https://console.prisma.io/
2. Sign in with GitHub (use your fratercem-design account)
3. Click "Enable Accelerate"

### 2. Add Your Neon Database
1. In Prisma Console, click "New Project" or "Add Database"
2. Enter your Neon connection string:
   ```
   postgresql://neondb_owner:npg_imtB3gecq2wS@ep-nameless-smoke-ahyluten-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
3. Click "Enable Accelerate"

### 3. Get Your Accelerate Connection String
After enabling, you'll get a connection string that looks like:
```
prisma://accelerate.prisma-data.net/?api_key=eyJhbGc...
```

**Copy this string - you'll need it for the next step.**

### 4. Update Vercel Environment Variables
1. Go to: https://vercel.com/fratercem-design/cultcodex-2666/settings/environment-variables
2. Find `DATABASE_URL` and click "Edit"
3. Replace the value with your Prisma Accelerate connection string (starts with `prisma://`)
4. Click "Save"
5. Redeploy the application

### 5. Update Local .env (Optional - for local development)
You can keep using the direct Neon connection locally, or use Accelerate for both:
- **Option A (Recommended)**: Keep direct connection for local dev
- **Option B**: Use Accelerate for both (add `DATABASE_URL` with Accelerate string to `.env`)

## Code Changes Needed

Once you have the Accelerate connection string, I'll update:
1. `prisma/schema.prisma` - Add `driverAdapters` preview feature
2. `lib/db/prisma.ts` - Simplify to use Accelerate (no pg adapter needed)

## Benefits
- ✅ No connection pooling issues
- ✅ No cold start problems
- ✅ Global caching for better performance
- ✅ Designed specifically for serverless
- ✅ Free tier available (up to 1M requests/month)

## Next Steps
1. Complete steps 1-3 above to get your Accelerate connection string
2. Share the connection string with me (it's safe - it's meant to be used in code)
3. I'll update the code and Vercel environment variables
