# Task 14.1: Comprehensive Input Validation Implementation

## Overview

Implemented comprehensive input validation across all API endpoints using Zod schemas with markdown sanitization to prevent XSS attacks. All endpoints now have proper validation for request bodies, query parameters, and file uploads.

## Implementation Summary

### 1. Validation Utilities (`lib/validation.ts`)

Created a centralized validation module with reusable Zod schemas:

#### Email Validation
- RFC 5322 compliant email format
- Max 255 characters
- Automatic lowercase and trim

#### Password Validation
- **Signup**: Strong password requirements
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Login**: Relaxed validation (any non-empty string)

#### Slug Validation
- URL-friendly format: lowercase letters, numbers, hyphens only
- Must start and end with alphanumeric character
- Max 100 characters
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

#### Markdown Content Sanitization
- Uses `isomorphic-dompurify` to sanitize HTML in markdown
- Allows safe markdown-related HTML tags
- Removes dangerous tags and attributes
- Prevents XSS attacks while preserving formatting
- Allowed tags: p, br, strong, em, u, s, code, pre, h1-h6, ul, ol, li, blockquote, a, img, table elements
- Allowed attributes: href, src, alt, title, class

#### File Upload Validation
- **Max file size**: 50MB
- **Allowed MIME types**:
  - Images: jpeg, png, gif, webp, svg+xml
  - Documents: pdf
  - Video: mp4, webm
  - Audio: mpeg, wav
- Validates both size and type before processing

#### Other Validations
- Title: 1-255 characters, trimmed
- Description: 0-1000 characters, optional, trimmed
- Tags: Array of 1-50 character strings, max 20 tags
- Dates: ISO 8601 format validation
- Entitlements: Enum validation (vault_access, grimoire_access, admin)
- Pagination: page (positive int), limit (1-100)

### 2. Updated Endpoints

#### Authentication Endpoints
- **POST /api/auth/signup**
  - Email format validation
  - Strong password requirements
  - Returns formatted validation errors

- **POST /api/auth/login**
  - Email format validation
  - Password presence check
  - Returns formatted validation errors

#### Vault Endpoints
- **POST /api/admin/vault**
  - Title, slug, content validation
  - Markdown sanitization
  - Entitlement type validation
  - Tags array validation

- **PATCH /api/admin/vault/[id]**
  - Optional field validation
  - Slug uniqueness check
  - Markdown sanitization
  - Tags array validation

- **POST /api/admin/vault/assets**
  - File size validation (50MB max)
  - MIME type validation
  - Content item ID validation

#### Grimoire Endpoints
- **POST /api/admin/grimoire**
  - Title, slug, content validation
  - Markdown sanitization
  - Slug format validation

- **PATCH /api/admin/grimoire/[id]**
  - Optional title/content validation
  - Markdown sanitization
  - At least one field required

#### Journal Endpoints
- **POST /api/journal**
  - Title and content validation
  - Markdown sanitization

- **PATCH /api/journal/[id]**
  - Optional title/content validation
  - Markdown sanitization
  - At least one field required

#### Rituals Endpoints
- **POST /api/rituals**
  - Title, description, scheduledAt validation
  - ISO 8601 date format
  - Optional description

- **PATCH /api/rituals/[id]**
  - Optional field validation
  - Date format validation
  - At least one field required

#### Admin User Management
- **POST /api/admin/users/[id]/entitlements**
  - Entitlement type enum validation
  - User existence check

### 3. Helper Functions

#### `validateRequestBody<T>(request, schema)`
- Parses JSON request body
- Validates against Zod schema
- Returns success/error result
- Handles invalid JSON gracefully

#### `validateQueryParams<T>(searchParams, schema)`
- Validates URL query parameters
- Returns success/error result

#### `formatValidationErrors(error)`
- Formats Zod validation errors for API responses
- Returns structured error object with field-level errors
- Format: `{ message: string, errors: [{ field: string, message: string }] }`

#### `sanitizeMarkdown(content)`
- Sanitizes markdown content using DOMPurify
- Removes XSS vectors
- Preserves safe HTML/markdown formatting

### 4. Validation Schemas

Created endpoint-specific schemas:
- `signupSchema` - Email + strong password
- `loginSchema` - Email + password
- `createContentItemSchema` - Vault content creation
- `updateContentItemSchema` - Vault content updates
- `createGrimoireEntrySchema` - Grimoire entry creation
- `updateGrimoireEntrySchema` - Grimoire entry updates
- `createJournalEntrySchema` - Journal entry creation
- `updateJournalEntrySchema` - Journal entry updates
- `createRitualInstanceSchema` - Ritual creation
- `updateRitualInstanceSchema` - Ritual updates
- `grantEntitlementSchema` - Entitlement grants

## Security Improvements

### XSS Prevention
- All markdown content is sanitized using DOMPurify
- Dangerous HTML tags and attributes are removed
- Safe markdown formatting is preserved
- Prevents script injection attacks

### Input Validation
- All user inputs are validated before processing
- Type checking ensures correct data types
- Length limits prevent buffer overflow attacks
- Format validation prevents injection attacks

### Password Security
- Strong password requirements enforce complexity
- Minimum 8 characters with mixed case, numbers, and special characters
- Prevents weak passwords that are easily cracked

### File Upload Security
- File size limits prevent DoS attacks
- MIME type validation prevents malicious file uploads
- Only safe file types are allowed

### Slug Validation
- URL-friendly format prevents path traversal
- Lowercase-only prevents case sensitivity issues
- Alphanumeric + hyphens only prevents injection

## Error Handling

All validation errors return:
- **Status**: 400 Bad Request
- **Body**: 
  ```json
  {
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
  ```

## Testing

Created `test-validation.mjs` script to verify:
- Email format validation
- Password strength requirements
- Invalid input rejection
- Valid input acceptance

Run tests with:
```bash
node test-validation.mjs
```

## Dependencies Added

- `isomorphic-dompurify` - For markdown sanitization (XSS prevention)

## Files Modified

### Created
- `lib/validation.ts` - Comprehensive validation utilities

### Updated
- `app/api/auth/signup/route.ts` - Added strong password validation
- `app/api/auth/login/route.ts` - Added email validation
- `app/api/admin/vault/route.ts` - Added content validation
- `app/api/admin/vault/[id]/route.ts` - Added update validation
- `app/api/admin/vault/assets/route.ts` - Added file upload validation
- `app/api/admin/grimoire/route.ts` - Added grimoire validation
- `app/api/admin/grimoire/[id]/route.ts` - Added update validation
- `app/api/journal/route.ts` - Added journal validation
- `app/api/journal/[id]/route.ts` - Added update validation
- `app/api/rituals/route.ts` - Added ritual validation
- `app/api/rituals/[id]/route.ts` - Added update validation
- `app/api/admin/users/[id]/entitlements/route.ts` - Added entitlement validation

## Requirements Satisfied

✅ **Requirement 11.2**: Validate and sanitize all user inputs to prevent injection attacks
- Email format validation (RFC 5322)
- Password strength validation
- Slug format validation
- Markdown content sanitization (XSS prevention)
- File upload validation (size and type)
- Query parameter validation
- Entitlement type validation

## Next Steps

The following endpoints may need validation review (if they exist):
- Vault search/filter endpoints
- Grimoire search endpoints
- Admin audit log filters
- Stripe webhook validation (already has signature verification)

## Notes

- All validation is performed server-side for security
- Client-side validation should mirror these rules for UX
- Validation errors provide clear, actionable feedback
- Markdown sanitization is transparent to users
- File upload limits can be adjusted via `MAX_FILE_SIZE` constant
- Allowed MIME types can be extended via `ALLOWED_MIME_TYPES` array
