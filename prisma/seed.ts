import { prisma } from '../lib/db/prisma';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminEmail = 'admin@cultofpsyche.com';
  const adminPassword = 'admin123'; // Change this in production!
  
  // Check if admin already exists
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { entitlements: true },
  });

  if (!admin) {
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

    console.log('Admin user created successfully:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Entitlements: ${admin.entitlements.map(e => e.entitlementType).join(', ')}`);
  } else {
    console.log('Admin user already exists');
  }
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

  console.log('\nTags created successfully');

  // Create sample content items
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
      requiredEntitlement: null, // Free content
      authorId: admin.id,
      tags: {
        create: [
          { tagId: tags[0].id }, // meditation
        ],
      },
    },
  });

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
      requiredEntitlement: 'vault_access', // Requires vault access
      authorId: admin.id,
      tags: {
        create: [
          { tagId: tags[1].id }, // ritual
          { tagId: tags[2].id }, // philosophy
        ],
      },
    },
  });

  console.log('\nSample content items created:');
  console.log(`  - ${freeContent.title} (free)`);
  console.log(`  - ${premiumContent.title} (requires vault_access)`);
  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
