/**
 * Seed test grimoire data
 * This creates sample grimoire entries for testing the read experience
 */

import { prisma } from './lib/db/prisma';

async function main() {
  console.log('🌱 Seeding grimoire test data...\n');

  // Get admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@cultofpsyche.com' },
  });

  if (!admin) {
    console.error('❌ Admin user not found. Run seed script first.');
    process.exit(1);
  }

  // Create first grimoire entry with initial revision
  const entry1 = await prisma.grimoireEntry.create({
    data: {
      title: 'The Path of Self-Discovery',
      slug: 'path-of-self-discovery',
      revisions: {
        create: {
          content: `# The Path of Self-Discovery

Self-discovery is a lifelong journey of understanding who you are, what you value, and what gives your life meaning.

## Understanding Yourself

The first step in self-discovery is honest self-reflection. This involves:

- Examining your beliefs and values
- Recognizing your patterns and habits
- Understanding your emotional responses
- Identifying your strengths and weaknesses

## Practices for Self-Discovery

### Journaling
Write regularly about your thoughts, feelings, and experiences. This creates a record of your inner life and helps you notice patterns over time.

### Meditation
Quiet contemplation allows you to observe your mind without judgment, revealing deeper truths about yourself.

### Shadow Work
Explore the parts of yourself you've hidden or denied. Integration of the shadow leads to wholeness.

## The Journey Continues

Self-discovery is not a destination but an ongoing process. Each layer you uncover reveals new depths to explore.`,
          revisionNumber: 1,
          authorId: admin.id,
        },
      },
    },
    include: {
      revisions: true,
    },
  });

  // Update to set currentRevisionId
  await prisma.grimoireEntry.update({
    where: { id: entry1.id },
    data: { currentRevisionId: entry1.revisions[0].id },
  });

  console.log(`✅ Created: "${entry1.title}"`);
  console.log(`   Slug: ${entry1.slug}`);
  console.log(`   Revision: ${entry1.revisions[0].revisionNumber}\n`);

  // Create second grimoire entry with multiple revisions
  const entry2 = await prisma.grimoireEntry.create({
    data: {
      title: 'Ritual Design Principles',
      slug: 'ritual-design-principles',
      revisions: {
        create: [
          {
            content: `# Ritual Design Principles

A well-designed ritual serves as a container for transformation and meaning-making.

## Core Elements

Every effective ritual includes:

1. **Intention** - Clear purpose
2. **Structure** - Beginning, middle, end
3. **Symbolism** - Meaningful objects and actions
4. **Presence** - Full attention and awareness`,
            revisionNumber: 1,
            authorId: admin.id,
          },
          {
            content: `# Ritual Design Principles

A well-designed ritual serves as a container for transformation and meaning-making.

## Core Elements

Every effective ritual includes:

1. **Intention** - Clear purpose and desired outcome
2. **Structure** - Beginning, middle, and end phases
3. **Symbolism** - Meaningful objects, actions, and words
4. **Presence** - Full attention and embodied awareness
5. **Integration** - Time for reflection and grounding

## Design Process

### 1. Define Your Intention
What do you want to accomplish? What transformation are you seeking?

### 2. Choose Your Symbols
Select objects, colors, scents, and sounds that resonate with your intention.

### 3. Create the Structure
Plan the opening, working, and closing phases of your ritual.

### 4. Practice and Refine
Perform the ritual and notice what works. Adjust as needed.`,
            revisionNumber: 2,
            authorId: admin.id,
          },
        ],
      },
    },
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
      },
    },
  });

  // Update to set currentRevisionId to the latest revision
  await prisma.grimoireEntry.update({
    where: { id: entry2.id },
    data: { currentRevisionId: entry2.revisions[0].id },
  });

  console.log(`✅ Created: "${entry2.title}"`);
  console.log(`   Slug: ${entry2.slug}`);
  console.log(`   Revisions: ${entry2.revisions.length}\n`);

  // Create third entry
  const entry3 = await prisma.grimoireEntry.create({
    data: {
      title: 'Working with Archetypes',
      slug: 'working-with-archetypes',
      revisions: {
        create: {
          content: `# Working with Archetypes

Archetypes are universal patterns of behavior and symbolism that exist in the collective unconscious.

## Common Archetypes

- **The Hero** - Courage and transformation
- **The Sage** - Wisdom and understanding
- **The Magician** - Transformation and power
- **The Lover** - Connection and passion
- **The Shadow** - Hidden aspects of self

## Engaging with Archetypes

You can work with archetypes through:

- Meditation and visualization
- Ritual invocation
- Creative expression
- Dream work
- Active imagination

## Integration

As you work with archetypes, notice how they manifest in your life and relationships. This awareness brings greater understanding of your patterns and potentials.`,
          revisionNumber: 1,
          authorId: admin.id,
        },
      },
    },
    include: {
      revisions: true,
    },
  });

  await prisma.grimoireEntry.update({
    where: { id: entry3.id },
    data: { currentRevisionId: entry3.revisions[0].id },
  });

  console.log(`✅ Created: "${entry3.title}"`);
  console.log(`   Slug: ${entry3.slug}`);
  console.log(`   Revision: ${entry3.revisions[0].revisionNumber}\n`);

  console.log('✨ Grimoire test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding grimoire data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
