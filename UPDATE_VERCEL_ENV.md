# Update Vercel Environment Variable

## Step 1: Go to Vercel Environment Variables
Visit: https://vercel.com/fratercem-design/cultcodex-2666/settings/environment-variables

## Step 2: Update DATABASE_URL
1. Find the `DATABASE_URL` variable
2. Click "Edit" (pencil icon)
3. Replace the current value with your Prisma Accelerate URL:
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza191S2dQRzhObmtwVkZYWk0wenk5NzMiLCJhcGlfa2V5IjoiMDFLSlFNQVFRQTlWQzNLSlRSN1dXWVZYS1EiLCJ0ZW5hbnRfaWQiOiIyZmIwMWUyNjdjYWRjNjQ0ZWQ0ZDE4YzBiYTQzOWNlZjFlYjE5MDM1NWM1Y2RlNTYwODQ5OTQ5OWEzM2VmYTA4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNWZkZDEyMjgtNzc1MC00YjA1LWFlMTQtNjlmZDUzYzRjOGE0In0.kPEkbdl3S78ReHSUN2SMDVO6tjt-HOYcabX4P8kP15c
   ```
4. Click "Save"

## Step 3: Redeploy
Vercel will automatically redeploy with the new environment variable.

## Step 4: Test Login
Once deployment completes (about 1-2 minutes), test login at:
https://cultcodex-2666.vercel.app/login

Credentials:
- Email: admin@cultofpsyche.com
- Password: admin123

## Why This Will Work
- Prisma Accelerate is specifically designed for serverless
- No connection pooling issues
- No cold start problems
- The database is already seeded and ready
- The code is already deployed and waiting for the env var update

## If It Still Fails
Check the Vercel function logs:
1. Go to: https://vercel.com/fratercem-design/cultcodex-2666
2. Click on the latest deployment
3. Click "Functions" tab
4. Click on the `/api/auth/login` function
5. Check the logs for detailed error messages
