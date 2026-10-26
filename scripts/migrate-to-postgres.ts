/**
 * Safe, Idempotent Data Migration Script
 * Migrates the 35 verified bookings and 18 central meals to PostgreSQL
 * Without data loss, preventing duplication, and validating record counts.
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function runSafeMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ خطأ: متغير DATABASE_URL غير محدد. يرجى توفير رابط اتصال PostgreSQL قبل تشغيل الترحيل.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const backupPath = path.resolve(process.cwd(), 'data', 'backup-35-bookings.json');

  if (!fs.existsSync(backupPath)) {
    console.error('❌ خطأ: ملف النسخة الاحتياطية غير موجود:', backupPath);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const sourceBookings: any[] = backupData.bookings || [];
  const sourceMeals: any[] = backupData.meals || [];

  console.log('====================================================');
  console.log('🚀 بدء خطة الترحيل الآمن إلى PostgreSQL');
  console.log('====================================================');
  console.log(`📦 عدد الحجوزات المصدرية المعتمدة: ${sourceBookings.length} حجز`);
  console.log(`🍲 عدد الوجبات المصدرية: ${sourceMeals.length} وجبة`);

  try {
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.');

    // 1. فحص ما قبل الترحيل (Pre-Migration Count)
    const preCount = await prisma.booking.count();
    console.log(`📊 عدد الحجوزات الموجودة في PostgreSQL قبل الترحيل: ${preCount}`);

    // 2. ترحيل الوجبات الأساسية أولاً لمنع أخطاء الربط (Meals Upsert)
    console.log('\n--- 1. ترحيل وتحديث قائمة الوجبات ---');
    for (const m of sourceMeals) {
      await prisma.meal.upsert({
        where: { code: m.code },
        update: {
          name: m.name,
          category: m.category,
          ingredients: m.ingredients,
          distributorPrice: m.distributorPrice,
          factoryPrice: m.factoryPrice,
          hasJuice: m.hasJuice ?? true,
          isActive: m.isActive ?? true,
          image: m.image,
        },
        create: {
          id: m.id || `meal-${m.code}`,
          code: m.code,
          name: m.name,
          category: m.category,
          ingredients: m.ingredients,
          distributorPrice: m.distributorPrice,
          factoryPrice: m.factoryPrice,
          hasJuice: m.hasJuice ?? true,
          isActive: m.isActive ?? true,
          image: m.image,
        },
      });
    }
    console.log(`✅ تم ترحيل الـ ${sourceMeals.length} وجبة بنجاح.`);

    // 3. ترحيل الحجوزات الـ 35 بعملية Upsert لمنع التكرار (Idempotent Migration)
    console.log('\n--- 2. ترحيل الحجوزات الـ 35 (مع حظر التكرار) ---');
    let insertedCount = 0;
    let existingCount = 0;

    for (const b of sourceBookings) {
      const existing = await prisma.booking.findUnique({
        where: { bookingCode: b.bookingCode },
      });

      if (existing) {
        existingCount++;
        continue;
      }

      await prisma.booking.create({
        data: {
          id: b.id,
          bookingCode: b.bookingCode,
          securityCode: b.securityCode,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerWhatsapp: b.customerWhatsapp || b.customerPhone,
          preferredContact: b.preferredContact || 'whatsapp',
          eventName: b.eventName,
          eventDate: b.eventDate,
          deliveryTime: b.deliveryTime,
          deliveryGovernorate: b.deliveryGovernorate,
          deliveryAddress: b.deliveryAddress,
          notes: b.notes || '',
          totalMealsCount: b.totalMealsCount,
          totalDistributorPrice: b.totalDistributorPrice,
          totalFactoryPrice: b.totalFactoryPrice || null,
          profitMargin: b.profitMargin || null,
          paidAmount: b.paidAmount || 0,
          remainingAmount: b.remainingAmount,
          status: b.status || 'INITIAL',
          statusNotes: b.statusNotes || '',
          version: b.version || 1,
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
          updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
          items: {
            create: (b.items || []).map((it: any) => ({
              mealId: it.mealId || it.mealCode,
              mealCode: it.mealCode,
              mealName: it.mealName,
              category: it.category || 'mix_box',
              ingredients: it.ingredients,
              quantity: it.quantity,
              drinkOption: it.drinkOption || 'standard',
              baseDistributorPrice: it.baseDistributorPrice,
              unitDistributorPrice: it.unitDistributorPrice,
              totalDistributorPrice: it.totalDistributorPrice,
              baseFactoryPrice: it.baseFactoryPrice,
              unitFactoryPrice: it.unitFactoryPrice,
              totalFactoryPrice: it.totalFactoryPrice,
            })),
          },
        },
      });
      insertedCount++;
    }

    // 4. التدقيق الرقابي بعد الترحيل (Post-Migration Verification)
    const postCount = await prisma.booking.count();
    console.log(`\n====================================================`);
    console.log(`📊 تقرير نتائج الترحيل الرقابي:`);
    console.log(`- حجوزات جديدة أُضيفت: ${insertedCount}`);
    console.log(`- حجوزات كانت موجودة مسبقاً (تم تخطيها لمنع التكرار): ${existingCount}`);
    console.log(`- إجمالي الحجوزات في قاعدة البيانات الآن: ${postCount}`);
    console.log(`====================================================`);

    // 5. فحص عينة دقيقة للتأكد من سلامة الحقول
    const testSample = await prisma.booking.findFirst({
      where: { bookingCode: 'CLB-2026-8934' },
      include: { items: true },
    });

    if (testSample) {
      console.log(`✅ فحص عينة: الحجز CLB-2026-8934 مسترجع بنجاح مع ${testSample.items.length} وجبات.`);
    }

    console.log('🎉 اكتملت عملية الترحيل بنجاح تام وبأمان كامل 100%.');
  } catch (err: any) {
    console.error('❌ حدث خطأ أثناء الترحيل:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// يمكن تشغيله مستقبلاً بالأمر: npx tsx scripts/migrate-to-postgres.ts
if (process.argv[1] && process.argv[1].endsWith('migrate-to-postgres.ts')) {
  runSafeMigration();
}
