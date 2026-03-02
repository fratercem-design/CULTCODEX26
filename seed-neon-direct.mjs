// Direct seed script for Neon database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_OsarJeUL9pD5@ep-soft-field-akoff4nc-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({});

async function main() {
  console.log('Starting database seed...');
  console.log('Connecting to Neon database...');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to database');

    // Create admin user
    const adminEmail = 'admin@cultofpsyche.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: { entitlements: true },
    });

    if (!admin) {
      console.log('Creating admin user...');
      
      // Hash the password
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // Create admin user with admin entitlement
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          entitlements: {
            create: [
              { entitlementType: 'admin' },
              { entitlementType: 'vault_access' },
              { entitlementType: 'grimoire_access' },
            ],
          },
        },
        include: {
          entitlements: true,
        },
      });

      console.log('✓ Admin user created successfully:');
      console.log(`  Email: ${admin.email}`);
      console.log(`  Password: ${adminPassword}`);
      console.log(`  Entitlements: ${admin.entitlements.map(e => e.entitlementType).join(', ')}`);
    } else {
      console.log('✓ Admin user already exists');
    }

    // Create tags
    console.log('Creating tags...');
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { name: 'meditation' },
        update: {},
        create: { name: 'meditation' },
      }),
      prisma.tag.upsert({
        where: { name: 'ritual' },
        update: {},
        create: { name: 'ritual' },
      }),
      prisma.tag.upsert({
        where: { name: 'philosophy' },
        update: {},
        create: { name: 'philosophy' },
      }),
    ]);
    console.log('✓ Tags created successfully');

    // Create sample content items
    console.log('Creating sample content...');
    
    const existingFree = await prisma.contentItem.findUnique({
      where: { slug: 'introduction-to-mindfulness' }
    });

    if (!existingFree) {
      const freeContent = await prisma.contentItem.create({
        data: {
          title: 'Introduction to Mindfulness',
          slug: 'introduction-to-mindfulness',
          content: `# Introduction to Mindfulness

Mindfulness is the practice of being present in the moment, fully aware of your thoughts, feelings, and surroundings without judgment.

## Benefits of Mindfulness

- Reduced stress and anxiety
- Improved focus and concentration
- Better emotional regulation
- Enhanced self-awareness

## Getting Started

Begin with just 5 minutes a day of focused breathing. Sit comfortably, close your eyes, and pay attention to your breath as it flows in and out.`,
          requiredEntitlement: null,
          authorId: admin.id,
          tags: {
            create: [
              { tagId: tags[0].id },
            ],
          },
        },
      });
      console.log(`  ✓ ${freeContent.title} (free)`);
    } else {
      console.log('  ✓ Free content already exists');
    }

    const existingPremium = await prisma.contentItem.findUnique({
      where: { slug: 'advanced-ritual-practices' }
    });

    if (!existingPremium) {
      const premiumContent = await prisma.contentItem.create({
        data: {
          title: 'Advanced Ritual Practices',
          slug: 'advanced-ritual-practices',
          content: `# Advanced Ritual Practices

This premium content explores advanced techniques for creating and performing personal rituals.

## Sacred Space Creation

Learn how to establish a dedicated space for your practice, including:

- Altar setup and maintenance
- Energy cleansing techniques
- Symbolic object placement
- Seasonal adjustments

## Ritual Structure

A well-designed ritual follows a clear structure:

1. **Opening** - Set intention and create sacred space
2. **Invocation** - Call upon desired energies or archetypes
3. **Working** - Perform the main ritual action
4. **Offering** - Give thanks and make offerings
5. **Closing** - Release energies and close the space

## Integration

After completing a ritual, take time to journal about your experience and notice any shifts in your awareness or daily life.`,
          requiredEntitlement: 'vault_access',
          authorId: admin.id,
          tags: {
            create: [
              { tagId: tags[1].id },
              { tagId: tags[2].id },
            ],
          },
        },
      });
      console.log(`  ✓ ${premiumContent.title} (requires vault_access)`);
    } else {
      console.log('  ✓ Premium content already exists');
    }

    console.log('\n✓ Seed completed successfully!');
  } catch (error) {
    console.error('✗ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
