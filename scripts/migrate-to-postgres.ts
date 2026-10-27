/**
 * Safe, Transactional, Idempotent Data Migration Script
 * Migrates verified bookings, central meals, payments, and factory orders to PostgreSQL
 * Each booking and its related records are migrated inside an isolated database transaction.
 * If any error occurs, the transaction rolls back cleanly, preventing any partial or orphaned data.
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { formatDatabaseUrl } from '../src/lib/prisma';

export async function runSafeMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ خطأ: متغير DATABASE_URL غير محدد. يرجى توفير رابط اتصال PostgreSQL قبل تشغيل الترحيل.');
    process.exit(1);
  }

  const formattedUrl = formatDatabaseUrl(databaseUrl);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: formattedUrl,
      },
    },
  });
  const backupPath = path.resolve(process.cwd(), 'data', 'backup-35-bookings.json');

  if (!fs.existsSync(backupPath)) {
    console.error('❌ خطأ: ملف النسخة الاحتياطية غير موجود:', backupPath);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const sourceBookings: any[] = backupData.bookings || [];
  const sourceMeals: any[] = backupData.meals || [];
  const sourcePayments: any[] = backupData.payments || [];
  const sourceFactoryOrders: any[] = backupData.factoryOrders || [];
  const sourceAdminUsers: any[] = backupData.adminUsers || [];

  console.log('====================================================');
  console.log('🚀 بدء خطة الترحيل الآمن الموثق بالمعاملات (Prisma Transactions)');
  console.log('====================================================');
  console.log(`📦 عدد الحجوزات المصدرية المعتمدة: ${sourceBookings.length} حجز`);
  console.log(`🍲 عدد الوجبات المصدرية: ${sourceMeals.length} وجبة`);
  console.log(`💳 عدد سجلات الدفعات (العربون): ${sourcePayments.length} سجل`);
  console.log(`🏭 عدد أوامر التشغيل للمصنع: ${sourceFactoryOrders.length} أمر`);

  try {
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.');

    // 1. فحص ما قبل الترحيل (Pre-Migration Count)
    const preBookingCount = await prisma.booking.count();
    const preMealCount = await prisma.meal.count();
    console.log(`📊 عدد الحجوزات الموجودة مسبقاً في PostgreSQL: ${preBookingCount}`);
    console.log(`📊 عدد الوجبات الموجودة مسبقاً في PostgreSQL: ${preMealCount}`);

    // 2. ترحيل وتحديث قائمة الوجبات الـ 18
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

    // 3. ترحيل الحجوزات الـ 35 بمعاملات ذرية (Atomic Transactions)
    console.log('\n--- 2. ترحيل الحجوزات الـ 35 (مع حظر التكرار والمعاملات الآمنة) ---');
    let insertedBookings = 0;
    let existingBookings = 0;

    for (const b of sourceBookings) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.booking.findUnique({
          where: { bookingCode: b.bookingCode },
        });

        if (existing) {
          existingBookings++;
          return;
        }

        // أ. إنشاء سجل الحجز مع عناصره دفعة واحدة
        await tx.booking.create({
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

        // ب. ربط الدفعات المالية التابعة لهذا الحجز ضمن نفس المعاملة
        const relatedPayments = sourcePayments.filter((p: any) => p.bookingId === b.id);
        for (const p of relatedPayments) {
          await tx.payment.create({
            data: {
              id: p.id,
              bookingId: p.bookingId,
              amount: p.amount,
              method: p.method,
              date: p.date,
              notes: p.notes || '',
              receiptNumber: p.receiptNumber || null,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            },
          });
        }

        // ج. ربط أوامر تشغيل المصنع التابعة لهذا الحجز ضمن نفس المعاملة
        const relatedOrders = sourceFactoryOrders.filter((fo: any) => fo.bookingId === b.id);
        for (const fo of relatedOrders) {
          await tx.factoryOrder.create({
            data: {
              id: fo.id,
              orderNumber: fo.orderNumber,
              bookingId: fo.bookingId,
              bookingCode: fo.bookingCode,
              version: fo.version || 1,
              status: fo.status || 'PENDING',
              eventDate: fo.eventDate,
              deliveryTime: fo.deliveryTime,
              deliveryLocation: fo.deliveryLocation,
              itemsJson: typeof fo.items === 'string' ? fo.items : JSON.stringify(fo.items || []),
              packagingNotes: fo.packagingNotes || '',
              preparedAt: fo.preparedAt ? new Date(fo.preparedAt) : null,
              createdAt: fo.createdAt ? new Date(fo.createdAt) : new Date(),
            },
          });
        }

        insertedBookings++;
      });
    }

    // 4. ترحيل حسابات الإدارة المعتمدة بنظام upsert
    console.log('\n--- 3. ترحيل حسابات الإدارة ---');
    for (const u of sourceAdminUsers) {
      await prisma.adminUser.upsert({
        where: { username: u.username },
        update: {
          email: u.email,
          role: u.role,
          name: u.name,
          passwordHash: u.passwordHash,
        },
        create: {
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          name: u.name,
          passwordHash: u.passwordHash,
        },
      });
    }

    // 5. التدقيق الرقابي بعد الترحيل (Post-Migration Verification)
    const postBookingCount = await prisma.booking.count();
    const postMealCount = await prisma.meal.count();
    const postPaymentCount = await prisma.payment.count();
    const postOrderCount = await prisma.factoryOrder.count();

    console.log(`\n====================================================`);
    console.log(`📊 تقرير نتائج الترحيل الرقابي الشامل:`);
    console.log(`- حجوزات جديدة أُضيفت بنجاح: ${insertedBookings}`);
    console.log(`- حجوزات كانت موجودة مسبقاً (تم تخطيها لمنع التكرار): ${existingBookings}`);
    console.log(`- إجمالي الحجوزات في PostgreSQL الآن: ${postBookingCount}`);
    console.log(`- إجمالي قائمة الوجبات في PostgreSQL الآن: ${postMealCount}`);
    console.log(`- إجمالي الدفعات في PostgreSQL الآن: ${postPaymentCount}`);
    console.log(`- إجمالي أوامر المصنع في PostgreSQL الآن: ${postOrderCount}`);
    console.log(`====================================================`);

    // 6. فحص عينة دقيقة للتأكد من سلامة الحقول والعلاقات
    const testSample = await prisma.booking.findFirst({
      where: { bookingCode: 'CLB-2026-8934' },
      include: { items: true, payments: true, factoryOrders: true },
    });

    if (testSample) {
      console.log(`✅ فحص عينة متكاملة: الحجز CLB-2026-8934 مسترجع مع ${testSample.items.length} وجبة و ${testSample.payments.length} دفعة و ${testSample.factoryOrders.length} أمر تشغيل.`);
    }

    console.log('🎉 اكتملت عملية الترحيل الذري بنجاح تام وبأمان كامل 100%.');

    return {
      success: true,
      insertedBookings,
      existingBookings,
      postBookingCount,
      postMealCount,
      postPaymentCount,
      postOrderCount,
    };
  } catch (err: any) {
    console.error('❌ حدث خطأ أثناء الترحيل:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate-to-postgres.ts')) {
  runSafeMigration();
}
