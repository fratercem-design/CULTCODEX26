#!/usr/bin/env node

/**
 * Direct database check using pg library
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 51214,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

async function checkDatabase() {
  console.log('🧪 Checking database for grimoire entries\n');

  try {
    // Check GrimoireEntry table
    console.log('=== Grimoire Entries ===');
    const entriesResult = await pool.query(`
      SELECT 
        id,
        title,
        slug,
        "currentRevisionId",
        "createdAt",
        "updatedAt"
      FROM "GrimoireEntry"
      WHERE slug IN ('art-of-divination', 'ritual-preparation')
      ORDER BY "createdAt"
    `);

    entriesResult.rows.forEach(row => {
      console.log(`\nEntry: ${row.title}`);
      console.log(`  - ID: ${row.id}`);
      console.log(`  - Slug: ${row.slug}`);
      console.log(`  - Current Revision ID: ${row.currentRevisionId}`);
      console.log(`  - Created: ${row.createdAt}`);
    });

    // Check GrimoireRevision table
    console.log('\n\n=== Grimoire Revisions ===');
    const revisionsResult = await pool.query(`
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
      ORDER BY gr."createdAt"
    `);

    revisionsResult.rows.forEach(row => {
      console.log(`\nRevision for: ${row.entry_title}`);
      console.log(`  - Revision ID: ${row.id}`);
      console.log(`  - Entry ID: ${row.grimoireEntryId}`);
      console.log(`  - Revision Number: ${row.revisionNumber}`);
      console.log(`  - Author ID: ${row.authorId}`);
      console.log(`  - Created: ${row.createdAt}`);
    });

    // Verify currentRevisionId matches
    console.log('\n\n=== Verify currentRevisionId matches revision id ===');
    const matchResult = await pool.query(`
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
      ORDER BY ge."createdAt"
    `);

    matchResult.rows.forEach(row => {
      console.log(`\n${row.title} (${row.slug}):`);
      console.log(`  - Current Revision ID: ${row.currentRevisionId}`);
      console.log(`  - Actual Revision ID: ${row.revision_id}`);
      console.log(`  - Revision Number: ${row.revisionNumber}`);
      console.log(`  - Status: ${row.status}`);
    });

    // Check audit logs
    console.log('\n\n=== Audit Logs for Grimoire Creation ===');
    const auditResult = await pool.query(`
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
      LIMIT 5
    `);

    auditResult.rows.forEach(row => {
      console.log(`\nAudit Log:`);
      console.log(`  - ID: ${row.id}`);
      console.log(`  - Action: ${row.actionType}`);
      console.log(`  - Resource Type: ${row.resourceType}`);
      console.log(`  - Resource ID: ${row.resourceId}`);
      console.log(`  - Metadata:`, JSON.stringify(row.metadata, null, 4));
      console.log(`  - Created: ${row.createdAt}`);
    });

    console.log('\n\n✅ Database verification complete!');

    // Summary
    console.log('\n=== Summary ===');
    console.log(`✓ ${entriesResult.rows.length} grimoire entries found`);
    console.log(`✓ ${revisionsResult.rows.length} revisions found`);
    console.log(`✓ ${matchResult.rows.length} entries with matching currentRevisionId`);
    console.log(`✓ ${auditResult.rows.length} audit log entries found`);

    if (matchResult.rows.every(row => row.status === '✓ MATCH')) {
      console.log('\n✅ All currentRevisionId values correctly point to their revisions!');
    } else {
      console.log('\n❌ Some currentRevisionId values do not match!');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabase();
