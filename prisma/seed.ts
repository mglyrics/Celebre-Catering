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

  // Seed default admin users
  console.log('[Seed] Seeding default admin & factory users...');
  const bcrypt = await import('bcryptjs');
  const defaultAdminPass = process.env.ADMIN_PASSWORD || 'Celebre@2026';
  const adminHash = bcrypt.hashSync(defaultAdminPass, 10);
  const factoryHash = bcrypt.hashSync('Factory@2026', 10);

  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminHash },
    create: {
      username: 'admin',
      email: 'management@celebre-eg.com',
      name: 'إدارة سيليبري',
      role: 'super_admin',
      passwordHash: adminHash,
    },
  });

  await prisma.adminUser.upsert({
    where: { username: 'factory' },
    update: { passwordHash: factoryHash },
    create: {
      username: 'factory',
      email: 'factory@celebre-eg.com',
      name: 'مسؤول تشغيل المصنع',
      role: 'factory',
      passwordHash: factoryHash,
    },
  });
  console.log('[Seed] Successfully seeded admin & factory users.');
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
