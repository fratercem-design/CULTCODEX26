# How to Find Your REAL Production URL

## The Confusion

You have multiple Vercel URLs:
- ❌ `cultcodex-26.vercel.app` - 500 error on login
- ✅ `cultcodex-2666.vercel.app` - Login works!
- ❌ `cultcodex-2668.vercel.app` - Older build
- ❌ `cultwiki26-xxx.vercel.app` - Wrong project

## Solution: Set a Production Domain

Instead of guessing which numbered URL is correct, let's set ONE permanent domain.

### Option 1: Use the Working URL as Your Standard

**Use this URL from now on**: `https://cultcodex-2666.vercel.app`

This one has:
- ✅ Working login
- ✅ Working vault API
- ✅ Latest fixes deployed

**Bookmark it and use ONLY this URL.**

### Option 2: Add a Custom Domain (Recommended)

This stops the confusion forever:

1. Go to Vercel dashboard
2. Click your project (CULTCODEX26)
3. Go to "Settings" → "Domains"
4. Add a domain like:
   - `cultofpsyche.vercel.app` (free Vercel subdomain)
   - Or your own domain if you have one

Then you'll have ONE permanent URL that never changes.

---

## Quick Test: Which URL Works?

Run this test on each URL you find:

```bash
# Test login
curl -X POST https://[YOUR-URL]/api/user-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cultofpsyche.com","password":"CultAdmin2026!"}'
```

If you get `"message": "Login successful"` → That's your working URL!

---

## Recommended Action NOW

1. **Use `cultcodex-2666.vercel.app`** - this one works
2. **Login with**:
   - Email: `admin@cultofpsyche.com`
   - Password: `CultAdmin2026!`
3. **Test vault management** at `/admin/vault`

If vault management still shows an error, wait 5 more minutes for the latest deployment to finish, then refresh.

---

## Why This Happened

Vercel creates a new preview URL for every git push. You've been jumping between:
- Old deployments (before fixes)
- New deployments (with fixes)
- Different branches or commits

The solution is to pick ONE URL that works and stick with it.
