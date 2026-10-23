import { PrismaClient } from '@prisma/client';
import { INITIAL_MEALS } from '../src/data/defaultMeals';

const prisma = new PrismaClient();

export async function seedMeals() {
  console.log('[Seed] Seeding 18 official Celebre meals...');

  for (const meal of INITIAL_MEALS) {
    await prisma.meal.upsert({
      where: { code: meal.code },
      update: {
        name: meal.name,
        category: meal.category,
        ingredients: meal.ingredients,
        distributorPrice: meal.distributorPrice,
        factoryPrice: meal.factoryPrice ?? 0,
        hasJuice: meal.hasJuice,
        isActive: meal.isActive,
        image: meal.image,
      },
      create: {
        code: meal.code,
        name: meal.name,
        category: meal.category,
        ingredients: meal.ingredients,
        distributorPrice: meal.distributorPrice,
        factoryPrice: meal.factoryPrice ?? 0,
        hasJuice: meal.hasJuice,
        isActive: meal.isActive,
        image: meal.image,
        version: 1,
      },
    });
  }

  const count = await prisma.meal.count();
  console.log(`[Seed] Successfully seeded ${count} meals in PostgreSQL via Prisma!`);
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedMeals()
    .catch((e) => {
      console.error('[Seed] Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
