import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as bcrypt from 'bcryptjs';

// This is a one-time seed endpoint - should be removed after use or protected heavily
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const { secret } = await request.json();
    
    // Use a strong secret - you can set this as an environment variable
    const SEED_SECRET = process.env.SEED_SECRET || 'change-this-secret-key';
    
    if (secret !== SEED_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting database seed...');
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);

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

      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
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

    // Create sample content items
    console.log('Creating sample content...');
    
    const existingFree = await prisma.contentItem.findUnique({
      where: { slug: 'introduction-to-mindfulness' }
    });

    if (!existingFree) {
      await prisma.contentItem.create({
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
    }

    const existingPremium = await prisma.contentItem.findUnique({
      where: { slug: 'advanced-ritual-practices' }
    });

    if (!existingPremium) {
      await prisma.contentItem.create({
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
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      admin: {
        email: adminEmail,
        password: adminPassword,
        entitlements: admin.entitlements.map(e => e.entitlementType),
      },
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: error.message },
      { status: 500 }
    );
  }
}
