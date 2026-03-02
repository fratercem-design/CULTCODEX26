# Manual Testing Guide: Entitlement Revoke Endpoint

## Prerequisites
- Server running on `http://localhost:3000`
- Admin user credentials
- A test user (non-admin)

## Step-by-Step Testing

### 1. Login as Admin (Browser)
1. Open browser and navigate to `http://localhost:3000/login`
2. Login with admin credentials:
   - Email: `admin@cultofpsyche.com`
   - Password: `admin123`
3. Open browser DevTools (F12)
4. Go to Application > Cookies
5. Copy the `session` cookie value

### 2. Get Test User ID
Open a new terminal and run:
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

Find a non-admin user in the response and copy their `id`.

### 3. Grant an Entitlement (Setup)
```bash
curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE" \
  -d '{
    "type": "vault_access",
    "reason": "Testing revoke endpoint"
  }'
```

**Expected Response (201):**
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

### 4. Revoke the Entitlement (Main Test)
```bash
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID/entitlements/vault_access \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

**Expected Response (200):**
```json
{
  "message": "Entitlement revoked successfully",
  "entitlements": []
}
```

### 5. Try to Revoke Again (Should Fail)
```bash
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID/entitlements/vault_access \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

**Expected Response (404):**
```json
{
  "error": "Not found",
  "message": "Entitlement not found"
}
```

### 6. Test Invalid Entitlement Type
```bash
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID/entitlements/invalid_type \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

**Expected Response (400):**
```json
{
  "error": "Validation error",
  "message": "Invalid entitlement type. Must be one of: vault_access, grimoire_access, admin"
}
```

### 7. Test Non-Existent User
```bash
curl -X DELETE http://localhost:3000/api/admin/users/clxxxxxxxxxxxxxxxxxx/entitlements/vault_access \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

**Expected Response (404):**
```json
{
  "error": "Not found",
  "message": "User not found"
}
```

### 8. Test Without Authentication
```bash
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID/entitlements/vault_access
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 9. Test Multiple Entitlements
```bash
# Grant two entitlements
curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE" \
  -d '{"type": "vault_access"}'

curl -X POST http://localhost:3000/api/admin/users/USER_ID/entitlements \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE" \
  -d '{"type": "grimoire_access"}'

# Revoke one
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID/entitlements/vault_access \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

**Expected Response (200):**
```json
{
  "message": "Entitlement revoked successfully",
  "entitlements": [
    {
      "type": "grimoire_access",
      "grantedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

### 10. Verify Audit Log
```bash
curl -X GET http://localhost:3000/api/admin/audit \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"
```

Look for entries with:
- `actionType`: `"entitlement.revoke"`
- `resourceType`: `"Entitlement"`
- `metadata.targetUserId`: The test user ID
- `metadata.entitlementType`: The revoked entitlement type

## Quick Test Script

Save this as `quick-test-revoke.sh`:

```bash
#!/bin/bash

# Update these values
SESSION_COOKIE="YOUR_SESSION_COOKIE"
USER_ID="YOUR_USER_ID"
BASE_URL="http://localhost:3000"

echo "=== Testing Entitlement Revoke Endpoint ==="
echo ""

echo "1. Granting vault_access..."
curl -s -X POST "$BASE_URL/api/admin/users/$USER_ID/entitlements" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=$SESSION_COOKIE" \
  -d '{"type": "vault_access"}' | jq
echo ""

echo "2. Revoking vault_access..."
curl -s -X DELETE "$BASE_URL/api/admin/users/$USER_ID/entitlements/vault_access" \
  -H "Cookie: session=$SESSION_COOKIE" | jq
echo ""

echo "3. Trying to revoke again (should fail)..."
curl -s -X DELETE "$BASE_URL/api/admin/users/$USER_ID/entitlements/vault_access" \
  -H "Cookie: session=$SESSION_COOKIE" | jq
echo ""

echo "4. Testing invalid type (should fail)..."
curl -s -X DELETE "$BASE_URL/api/admin/users/$USER_ID/entitlements/invalid" \
  -H "Cookie: session=$SESSION_COOKIE" | jq
echo ""

echo "=== Test Complete ==="
```

Make executable and run:
```bash
chmod +x quick-test-revoke.sh
./quick-test-revoke.sh
```

## Verification Checklist

- [ ] Endpoint returns 200 on successful revocation
- [ ] Remaining entitlements are returned in response
- [ ] Returns 404 when entitlement doesn't exist
- [ ] Returns 404 when user doesn't exist
- [ ] Returns 400 for invalid entitlement type
- [ ] Returns 401/403 without admin authentication
- [ ] Audit log entry is created with correct metadata
- [ ] Multiple entitlements are handled correctly
- [ ] Transaction ensures atomicity (all or nothing)

## Troubleshooting

### Rate Limiting
If you get 429 errors, wait 15 minutes before trying again. The auth endpoints have rate limiting enabled.

### Session Expired
If you get 401 errors, your session cookie may have expired. Login again and get a fresh cookie.

### CORS Issues
If testing from a different origin, ensure CORS is configured properly or use the same origin.

### Database Connection
If you get 500 errors, check that the database is running and the connection string is correct.
