# EXACT Steps to Update Vercel Environment Variable

## The Problem
Your Vercel deployment is still using the old Neon connection string. It needs the new Prisma Accelerate URL.

## The Solution (3 clicks)

### Step 1: Go to Vercel Settings
Click this link: https://vercel.com/fratercem-design/cultcodex-2666/settings/environment-variables

### Step 2: Find DATABASE_URL
Scroll down and find the row that says `DATABASE_URL`

### Step 3: Edit It
1. Click the three dots (...) on the right side of the DATABASE_URL row
2. Click "Edit"
3. You'll see a text box with the current value (starts with `postgresql://`)
4. **DELETE everything in that box**
5. **PASTE this instead:**
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza191S2dQRzhObmtwVkZYWk0wenk5NzMiLCJhcGlfa2V5IjoiMDFLSlFNQVFRQTlWQzNLSlRSN1dXWVZYS1EiLCJ0ZW5hbnRfaWQiOiIyZmIwMWUyNjdjYWRjNjQ0ZWQ0ZDE4YzBiYTQzOWNlZjFlYjE5MDM1NWM1Y2RlNTYwODQ5OTQ5OWEzM2VmYTA4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNWZkZDEyMjgtNzc1MC00YjA1LWFlMTQtNjlmZDUzYzRjOGE0In0.kPEkbdl3S78ReHSUN2SMDVO6tjt-HOYcabX4P8kP15c
   ```
6. Click "Save"

### Step 4: Wait
Vercel will automatically redeploy (1-2 minutes)

### Step 5: Test
Go to: https://cultcodex-2666.vercel.app/login
Login with: admin@cultofpsyche.com / admin123

## That's It
No other changes needed. The code is already deployed and ready.

## Screenshot Guide
If you can't find it, look for:
- A page with tabs: "General", "Domains", "Environment Variables", etc.
- Click "Environment Variables" tab
- Look for a table with rows
- Find the row with "DATABASE_URL" in the first column
- Click the three dots (...) in that row
