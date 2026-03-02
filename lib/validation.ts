/**
 * Comprehensive input validation utilities using Zod
 * Provides reusable schemas for all API endpoints
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { EntitlementType } from '@prisma/client';

// ============================================================================
// Email Validation
// ============================================================================

/**
 * RFC 5322 compliant email validation
 * Validates email format with proper domain structure
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Password strength validation
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Relaxed password schema for login (no complexity requirements)
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required');

// ============================================================================
// Slug Validation
// ============================================================================

/**
 * URL-friendly slug validation
 * Format: lowercase letters, numbers, and hyphens only
 * Must start and end with alphanumeric character
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only')
  .trim();

// ============================================================================
// Markdown Content Validation and Sanitization
// ============================================================================

/**
 * Sanitize markdown content to prevent XSS attacks
 * Removes dangerous HTML tags and attributes while preserving safe markdown
 */
export function sanitizeMarkdown(content: string): string {
  // Configure DOMPurify to allow safe markdown-related HTML
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
  
  return clean;
}

/**
 * Markdown content schema with sanitization
 */
export const markdownSchema = z
  .string()
  .min(1, 'Content is required')
  .max(1000000, 'Content must be less than 1MB')
  .transform(sanitizeMarkdown);

/**
 * Optional markdown content schema
 */
export const optionalMarkdownSchema = z
  .string()
  .max(1000000, 'Content must be less than 1MB')
  .transform(sanitizeMarkdown)
  .optional()
  .nullable();

// ============================================================================
// Text Field Validation
// ============================================================================

/**
 * Generic title validation
 */
export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(255, 'Title must be less than 255 characters')
  .trim();

/**
 * Generic description validation
 */
export const descriptionSchema = z
  .string()
  .max(1000, 'Description must be less than 1000 characters')
  .trim()
  .optional()
  .nullable();

/**
 * Tag name validation
 */
export const tagNameSchema = z
  .string()
  .min(1, 'Tag name is required')
  .max(50, 'Tag name must be less than 50 characters')
  .trim();

/**
 * Array of tag names
 */
export const tagsArraySchema = z
  .array(tagNameSchema)
  .max(20, 'Maximum 20 tags allowed')
  .optional()
  .default([]);

// ============================================================================
// File Upload Validation
// ============================================================================

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
] as const;

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, 'File is required'),
  contentItemId: z.string().uuid('Invalid content item ID'),
}).refine(
  (data) => data.file.size <= MAX_FILE_SIZE,
  { message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`, path: ['file'] }
).refine(
  (data) => ALLOWED_MIME_TYPES.includes(data.file.type as any),
  { message: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, path: ['file'] }
);

// ============================================================================
// Entitlement Validation
// ============================================================================

/**
 * Entitlement type validation
 */
export const entitlementTypeSchema = z.nativeEnum(EntitlementType, {
  message: `Invalid entitlement type. Must be one of: ${Object.values(EntitlementType).join(', ')}`,
});

/**
 * Optional entitlement type
 */
export const optionalEntitlementSchema = entitlementTypeSchema.optional().nullable();

// ============================================================================
// Date/Time Validation
// ============================================================================

/**
 * ISO 8601 date string validation
 */
export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format. Must be ISO 8601 format' })
  .or(z.date())
  .transform((val) => new Date(val));

// ============================================================================
// Pagination Validation
// ============================================================================

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z
  .string()
  .max(255, 'Search query must be less than 255 characters')
  .trim()
  .optional();

// ============================================================================
// API Endpoint Schemas
// ============================================================================

/**
 * Auth - Signup
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Auth - Login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

/**
 * Vault - Create ContentItem
 */
export const createContentItemSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  content: markdownSchema,
  requiredEntitlement: optionalEntitlementSchema,
  tags: tagsArraySchema,
});

/**
 * Vault - Update ContentItem
 */
export const updateContentItemSchema = z.object({
  title: titleSchema.optional(),
  slug: slugSchema.optional(),
  content: markdownSchema.optional(),
  requiredEntitlement: optionalEntitlementSchema,
  tags: tagsArraySchema,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Grimoire - Create Entry
 */
export const createGrimoireEntrySchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  content: markdownSchema,
});

/**
 * Grimoire - Update Entry
 */
export const updateGrimoireEntrySchema = z.object({
  title: titleSchema.optional(),
  content: markdownSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Journal - Create Entry
 */
export const createJournalEntrySchema = z.object({
  title: titleSchema,
  content: markdownSchema,
});

/**
 * Journal - Update Entry
 */
export const updateJournalEntrySchema = z.object({
  title: titleSchema.optional(),
  content: markdownSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Rituals - Create Instance
 */
export const createRitualInstanceSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  scheduledAt: dateSchema,
});

/**
 * Rituals - Update Instance
 */
export const updateRitualInstanceSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  scheduledAt: dateSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Admin - Grant Entitlement
 */
export const grantEntitlementSchema = z.object({
  entitlementType: entitlementTypeSchema,
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate request body with a Zod schema
 * Returns parsed data or throws validation error
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    // Invalid JSON
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate query parameters with a Zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  return { success: true, data: result.data };
}

/**
 * Format Zod validation errors for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  message: string;
  errors: Array<{ field: string; message: string }>;
} {
  return {
    message: 'Validation failed',
    errors: error.issues.map((err: z.ZodIssue) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
