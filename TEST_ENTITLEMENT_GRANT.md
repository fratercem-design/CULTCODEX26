# Manual Testing Guide: Entitlement Grant Endpoint

## Prerequisites
1. Dev server running: `npm run dev`
2. Admin credentials: `admin@cultofpsyche.com` / `admin123`
3. Wait 60+ seconds after any previous login attempts (rate limiting)

## Step 1: Login as Admin

```bash
# Login and save the session cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cultofpsyche.com","password":"admin123"}' \
  -c cookies.txt -v
```

Expected: 200 OK with session cookie saved to cookies.txt

## Step 2: Create a Test User

```bash
# Create a test user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test-grant@example.com","password":"testpass123"}'
```

Expected: 200 OK with user object containing `id` field
**Save the user ID for next steps**

## Step 3: Check User's Initial State

```bash
# Replace USER_ID with the actual user ID from step 2
curl http://localhost:3000/api/admin/users/USER_ID \
  -b cookies.txt
```

Expected: 200 OK with user details showing 0 entitlements

## Step 4: Grant vault_access Entitlement

```bash
# Replace USER_ID with the actual user ID
curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"vault_access","reason":"Test grant"}'
```

Expected: 201 Created with response:
```json
{
  "message": "Entitlement granted successfully",
  "entitlements": [
    {
      "type": "vault_access",
      "grantedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Step 5: Verify Entitlement Was Granted

```bash
# Check user details again
curl http://localhost:3000/api/admin/users/USER_ID \
  -b cookies.txt
```

Expected: 200 OK with user showing 1 entitlement (vault_access)

## Step 6: Test Idempotency (Grant Same Entitlement Again)

```bash
# Grant the same entitlement again
curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"vault_access","reason":"Duplicate attempt"}'
```

Expected: 200 OK (not 201) with response:
```json
{
  "message": "Entitlement already exists",
  "entitlements": [
    {
      "type": "vault_access",
      "grantedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Step 7: Grant Another Entitlement

```bash
# Grant grimoire_access
curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"grimoire_access","reason":"Adding grimoire access"}'
```

Expected: 201 Created with both entitlements in response

## Step 8: Test Validation (Invalid Type)

```bash
# Try to grant invalid entitlement type
curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"invalid_type","reason":"Should fail"}'
```

Expected: 400 Bad Request with validation error

## Step 9: Test Non-Existent User

```bash
# Try to grant entitlement to non-existent user
curl -X POST http://localhost:3000/api/admin/users/non-existent-id/entitlements \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"vault_access","reason":"Should fail"}'
```

Expected: 404 Not Found

## Step 10: Verify Audit Log

Check the database directly:

```sql
SELECT * FROM "AuditLog" 
WHERE "actionType" = 'entitlement.grant' 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

Expected: Audit log entries for each successful grant with:
- adminId (admin user ID)
- actionType: "entitlement.grant"
- resourceType: "Entitlement"
- resourceId: (entitlement ID)
- metadata: { targetUserId, entitlementType, reason, grantedAt }

## Automated Test Script

Alternatively, run the automated test script:

```bash
# Wait 60+ seconds after any login attempts, then:
node test-entitlement-grant-manual.mjs
```

## Success Criteria

✅ Admin can grant entitlements to users
✅ Idempotency works (duplicate grants return 200, not 201)
✅ Multiple entitlements can be granted to same user
✅ Input validation rejects invalid entitlement types
✅ Returns 404 for non-existent users
✅ Audit logs are created for each grant
✅ Transaction ensures consistency (entitlement + audit log together)
