-- Verify GrimoireEntry creation with currentRevisionId
-- Run this with: psql -h localhost -p 51214 -U postgres -d postgres -f test-grimoire-db-check.sql

\echo '=== Grimoire Entries ==='
SELECT 
  id,
  title,
  slug,
  "currentRevisionId",
  "createdAt",
  "updatedAt"
FROM "GrimoireEntry"
WHERE slug IN ('art-of-divination', 'ritual-preparation')
ORDER BY "createdAt";

\echo ''
\echo '=== Grimoire Revisions ==='
SELECT 
  gr.id,
  gr."grimoireEntryId",
  gr."revisionNumber",
  gr."authorId",
  ge.title as entry_title,
  gr."createdAt"
FROM "GrimoireRevision" gr
JOIN "GrimoireEntry" ge ON gr."grimoireEntryId" = ge.id
WHERE ge.slug IN ('art-of-divination', 'ritual-preparation')
ORDER BY gr."createdAt";

\echo ''
\echo '=== Verify currentRevisionId matches revision id ==='
SELECT 
  ge.title,
  ge.slug,
  ge."currentRevisionId",
  gr.id as revision_id,
  gr."revisionNumber",
  CASE 
    WHEN ge."currentRevisionId" = gr.id THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status
FROM "GrimoireEntry" ge
JOIN "GrimoireRevision" gr ON ge."currentRevisionId" = gr.id
WHERE ge.slug IN ('art-of-divination', 'ritual-preparation')
ORDER BY ge."createdAt";

\echo ''
\echo '=== Audit Logs for Grimoire Creation ==='
SELECT 
  al.id,
  al."actionType",
  al."resourceType",
  al."resourceId",
  al.metadata,
  al."createdAt"
FROM "AuditLog" al
WHERE al."resourceType" = 'GrimoireEntry'
  AND al."actionType" = 'create'
ORDER BY al."createdAt" DESC
LIMIT 5;
