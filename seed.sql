-- Seed script for Cult of Psyche database
-- This creates the admin user and sample data

-- Create admin user (password hash for 'admin123')
INSERT INTO "User" (id, email, "passwordHash", "createdAt", "updatedAt")
VALUES (
  'admin_' || substr(md5(random()::text), 1, 20),
  'admin@cultofpsyche.com',
  '$2a$10$YourHashedPasswordHere',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Note: You'll need to generate the actual bcrypt hash for 'admin123'
-- For now, let's use a placeholder that you can update

-- Create tags
INSERT INTO "Tag" (id, name)
VALUES 
  ('tag_meditation', 'meditation'),
  ('tag_ritual', 'ritual'),
  ('tag_philosophy', 'philosophy')
ON CONFLICT (name) DO NOTHING;

-- Grant admin entitlements (you'll need to replace 'ADMIN_USER_ID' with actual admin user ID)
-- INSERT INTO "Entitlement" (id, "userId", "entitlementType", "grantedAt")
-- SELECT 
--   'ent_admin_' || substr(md5(random()::text), 1, 20),
--   (SELECT id FROM "User" WHERE email = 'admin@cultofpsyche.com'),
--   'admin',
--   NOW()
-- WHERE EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@cultofpsyche.com');
