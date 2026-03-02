# How to Check Vercel Function Logs

The deployment is succeeding but login is returning a 500 error. We need to see the actual error message from Vercel.

## Steps to Check Logs

### Option 1: Real-Time Logs (Easiest)
1. Go to: https://vercel.com/fratercem-design/cultcodex-2666
2. Click on the latest deployment (should show "Ready")
3. Click the "Functions" tab
4. Click on `/api/auth/login` in the list
5. You'll see a "Logs" section
6. Try to login at https://cultcodex-2666.vercel.app/login
7. Watch the logs appear in real-time
8. Copy the error message and paste it here

### Option 2: Runtime Logs
1. Go to: https://vercel.com/fratercem-design/cultcodex-2666
2. Click "Logs" tab at the top
3. Filter by "Errors" or "All"
4. Try to login
5. Look for red error messages
6. Copy the error and paste it here

## What to Look For

The error will likely be one of these:
- `PrismaClient` initialization error
- Database connection error
- Missing environment variable
- Module not found error

## Common Issues

### If you see "PrismaClient is unable to run in this browser environment"
- The runtime is set to Edge instead of Node.js
- We need to add `export const runtime = 'nodejs';` to more files

### If you see "Can't reach database server"
- DATABASE_URL is wrong or not set
- Double-check the env var in Vercel settings

### If you see "Module not found: @prisma/adapter-pg"
- Dependencies didn't install correctly
- We may need to add it to dependencies instead of devDependencies

## Next Steps

Once you paste the error message here, I can fix it immediately.
