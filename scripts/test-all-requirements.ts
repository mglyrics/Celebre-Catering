import dotenv from 'dotenv';
dotenv.config();

import { db, buildFactoryWhatsAppMessage } from '../src/server/db';
import { CELEBRE_CONFIG } from '../src/data/defaultMeals';

async function runTests() {
  console.log('====================================================');
  console.log('  CÉLÈBRE CATERING - SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // TEST 1: MEAL 12 NAME VERIFICATION
  // ----------------------------------------------------
  console.log('[TEST 1] Checking Meal 12 (Sale-12) name & properties...');
  const allMeals = await db.getMeals(true);
  const meal12 = allMeals.find(m => m.code === 'Sale-12');
  if (!meal12) {
    console.error('❌ Failed: Sale-12 not found');
    failed++;
  } else {
    const isNameCorrect = meal12.name === 'باتية';
    const isPriceIntact = meal12.distributorPrice === 44 && meal12.factoryPrice === 32;
    const hasIngredients = Boolean(meal12.ingredients && meal12.ingredients.includes('بانية بالذبدة'));
    
    if (isNameCorrect && isPriceIntact && hasIngredients) {
      console.log(`✅ Passed: Meal 12 name is exactly "${meal12.name}", distributorPrice: ${meal12.distributorPrice} EGP, factoryPrice: ${meal12.factoryPrice} EGP, ingredients intact.`);
      passed++;
    } else {
      console.error(`❌ Failed: Meal 12 verification mismatch. Name: "${meal12.name}", Price: ${meal12.distributorPrice}/${meal12.factoryPrice}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 2: MINIMUM 50 MEALS - 49 MEALS REJECTION
  // ----------------------------------------------------
  console.log('\n[TEST 2] Testing 49 meals order rejection...');
  try {
    await db.createBooking({
      customerName: 'فحص تجريبي 49 وجبة',
      customerPhone: '01011112222',
      preferredContact: 'phone',
      eventName: 'اختبار المنع',
      eventDate: '2026-05-10',
      deliveryTime: '14:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'التجمع الخامس',
      isTest: true,
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 49,
          drinkOption: 'standard',
        }
      ]
    });
    console.error('❌ Failed: 49 meals order was accepted, should have been rejected!');
    failed++;
  } catch (err: any) {
    if (err.message && err.message.includes('الحد الأدنى للطلب 50 وجبة')) {
      console.log(`✅ Passed: 49 meals order rejected with clear notice: "${err.message}"`);
      passed++;
    } else {
      console.error(`❌ Failed: Unexpected error for 49 meals:`, err.message);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 3: EXACTLY 50 MEALS ACCEPTANCE
  // ----------------------------------------------------
  console.log('\n[TEST 3] Testing exactly 50 meals acceptance...');
  let booking50Id = '';
  try {
    const booking50 = await db.createBooking({
      customerName: 'فحص تجريبي 50 وجبة مفردة',
      customerPhone: '01022223333',
      preferredContact: 'phone',
      eventName: 'حفل افتتاح تجريبي',
      eventDate: '2026-06-01',
      deliveryTime: '15:00',
      deliveryGovernorate: 'الجيزة',
      deliveryAddress: 'الشيخ زايد',
      isTest: true,
      items: [
        {
          mealCode: 'Sale-12',
          quantity: 50,
          drinkOption: 'standard',
        }
      ]
    });
    booking50Id = booking50.id;
    console.log(`✅ Passed: Exactly 50 meals accepted. Booking Code: ${booking50.bookingCode}, Total Meals: ${booking50.totalMealsCount}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ Failed: Exactly 50 meals rejected:`, err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 4: 50 MEALS DISTRIBUTED ACROSS MULTIPLE ITEMS
  // ----------------------------------------------------
  console.log('\n[TEST 4] Testing 50 meals distributed across multiple items (25 + 25)...');
  let multiBookingId = '';
  try {
    const multiBooking = await db.createBooking({
      customerName: 'فحص تجريبي أصناف متعددة',
      customerPhone: '01033334444',
      preferredContact: 'whatsapp',
      eventName: 'مؤتمر سنوي تجريبي',
      eventDate: '2026-06-15',
      deliveryTime: '12:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'مدينة نصر',
      isTest: true,
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 25,
          drinkOption: 'standard',
        },
        {
          mealCode: 'Sale-12',
          quantity: 25,
          drinkOption: 'standard',
        }
      ]
    });
    multiBookingId = multiBooking.id;
    console.log(`✅ Passed: Distributed 50 meals accepted. Code: ${multiBooking.bookingCode}, Total meals: ${multiBooking.totalMealsCount}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ Failed: Distributed 50 meals rejected:`, err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 5: ADMIN EDIT TO < 50 MEALS PREVENTED
  // ----------------------------------------------------
  console.log('\n[TEST 5] Testing Admin edit to < 50 meals prevention on confirmation...');
  if (booking50Id) {
    try {
      await db.updateBookingByAdmin(booking50Id, {
        status: 'CONFIRMED',
        items: [
          {
            mealCode: 'Sale-12',
            quantity: 30, // Less than 50
            drinkOption: 'standard',
          }
        ]
      }, 'admin_tester');
      console.error('❌ Failed: Admin was able to confirm booking with 30 meals!');
      failed++;
    } catch (err: any) {
      if (err.message && err.message.includes('50 وجبة')) {
        console.log(`✅ Passed: Admin edit to 30 meals was blocked with message: "${err.message}"`);
        passed++;
      } else {
        console.error('❌ Failed: Unexpected error when editing to < 50:', err.message);
        failed++;
      }
    }
  }

  // ----------------------------------------------------
  // TEST 6: ADMIN EDIT & DATABASE RECALCULATION & AUDIT LOG
  // ----------------------------------------------------
  console.log('\n[TEST 6] Testing Admin edit, DB recalculation, and audit log...');
  if (multiBookingId) {
    try {
      // Modify items: 30 of Sale-01 with no_juice (-5 LE -> 45 LE each)
      //              30 of Sale-12 with pepsi (+10 LE -> 54 LE each)
      // Total meals: 60 meals (valid >= 50)
      // Expected total distributor: 30 * 45 + 30 * 54 = 1350 + 1620 = 2970 EGP
      const updated = await db.updateBookingByAdmin(multiBookingId, {
        customerName: 'فحص تجريبي معدل بالكامل',
        deliveryAddress: 'المعادي - برج النيل',
        items: [
          {
            mealCode: 'Sale-01',
            quantity: 30,
            drinkOption: 'no_juice',
          },
          {
            mealCode: 'Sale-12',
            quantity: 30,
            drinkOption: 'pepsi',
          }
        ],
        notes: 'ملاحظة تجريبية خاصة بعد التعديل'
      }, 'مدير_النظام_المعتمد');

      const item1 = updated.items.find(i => i.mealCode === 'Sale-01');
      const item2 = updated.items.find(i => i.mealCode === 'Sale-12');
      
      const isItem1PriceCorrect = item1?.unitDistributorPrice === 45; // 50 - 5
      const isItem2PriceCorrect = item2?.unitDistributorPrice === 54; // 44 + 10
      const isTotalCorrect = updated.totalDistributorPrice === 2970;
      const isItem2NameCorrect = item2?.mealName === 'باتية';

      // Check audit logs
      const logs = await db.getAuditLogs();
      const bookingAudit = logs.find(l => l.bookingId === multiBookingId && l.performedBy === 'مدير_النظام_المعتمد');

      if (isItem1PriceCorrect && isItem2PriceCorrect && isTotalCorrect && isItem2NameCorrect && bookingAudit) {
        console.log(`✅ Passed: Recalculated correctly in DB. Total: ${updated.totalDistributorPrice} EGP, Total meals: ${updated.totalMealsCount}`);
        console.log(`   - Item 1 (Sale-01, no_juice): unit price = ${item1?.unitDistributorPrice} EGP (50 - 5)`);
        console.log(`   - Item 2 (Sale-12 "باتية", pepsi): unit price = ${item2?.unitDistributorPrice} EGP (44 + 10)`);
        console.log(`   - Audit log recorded by: "${bookingAudit.performedBy}", action: "${bookingAudit.action}"`);
        passed++;
      } else {
        console.error('❌ Failed: Price calculation or audit mismatch.', {
          total: updated.totalDistributorPrice,
          item1Price: item1?.unitDistributorPrice,
          item2Price: item2?.unitDistributorPrice,
          hasAudit: Boolean(bookingAudit)
        });
        failed++;
      }
    } catch (err: any) {
      console.error('❌ Failed to update booking by admin:', err.message);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 7: FACTORY WHATSAPP MESSAGE (STRICT PRIVACY)
  // ----------------------------------------------------
  console.log('\n[TEST 7] Testing Factory WhatsApp message generation & strict privacy...');
  let testFo: any = null;
  if (multiBookingId) {
    try {
      const b = await db.getBookingById(multiBookingId);
      testFo = await db.createFactoryOrder(multiBookingId, 'مدير_النظام', { forceNewVersion: true });
      const waData = buildFactoryWhatsAppMessage(testFo, b!, '201000000000');
      const msg = waData.messageText;

      const hasTitle = msg.includes('CÉLÈBRE CATERING');
      const hasSale12Name = msg.includes('باتية');
      const hasFactoryCost = msg.includes('سعر المصنع') || msg.includes('إجمالي تكلفة المصنع');
      
      // Strict privacy check: NO distributor prices or retail margins shown
      const leaksDistributorPrice = msg.includes('سعر الموزع') || msg.includes('2970') || msg.includes('54 ج') || msg.includes('هامش ربح الموزع:');

      if (hasTitle && hasSale12Name && hasFactoryCost && !leaksDistributorPrice && waData.whatsappUrl.startsWith('https://wa.me/')) {
        console.log('✅ Passed: Factory WhatsApp message strictly adheres to kitchen confidential format.');
        console.log('   - Meal 12 name in WhatsApp ticket: "باتية"');
        console.log('   - WhatsApp link:', waData.whatsappUrl.substring(0, 45) + '...');
        console.log('   - Leaks distributor prices:', leaksDistributorPrice ? 'YES (BUG)' : 'NO (SAFE)');
        passed++;
      } else {
        console.error('❌ Failed: WhatsApp message privacy or content verification failed.');
        console.log('Message sample:\n', msg);
        failed++;
      }
    } catch (err: any) {
      console.error('❌ Failed to build factory WhatsApp message:', err.message);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 8: FACTORY DISPATCH STATUS STATE MACHINE
  // ----------------------------------------------------
  console.log('\n[TEST 8] Testing Factory order dispatch state machine...');
  if (testFo) {
    try {
      const isInitialReadyToSend = testFo.status === 'READY_TO_SEND';
      console.log(`   - Initial order created with status: "${testFo.status}" (Version: v${testFo.version})`);

      // Confirm manually
      const confirmedFo = await db.confirmFactoryOrderSent(testFo.id, 'مدير_المطبخ');
      const isNowManuallyConfirmed = confirmedFo.status === 'MANUALLY_CONFIRMED';
      console.log(`   - After manual confirmation: "${confirmedFo.status}"`);

      if (isInitialReadyToSend && isNowManuallyConfirmed) {
        console.log('✅ Passed: Factory dispatch state machine transitions strictly on manual admin confirmation.');
        passed++;
      } else {
        console.error('❌ Failed: Incorrect status transition:', {
          initial: testFo.status,
          confirmed: confirmedFo.status
        });
        failed++;
      }
    } catch (err: any) {
      console.error('❌ Failed factory order state machine test:', err.message);
      failed++;
    }
  }

  // ----------------------------------------------------
  // CLEANUP TEST DATA
  // ----------------------------------------------------
  console.log('\n[CLEANUP] Cleaning up test bookings...');
  if (booking50Id) {
    await db.updateBooking(booking50Id, { status: 'CANCELLED', notes: 'تم إلغاء الحجز التجريبي بعد انتهاء الفحص' }, 'فحص_آلي');
  }
  if (multiBookingId) {
    await db.updateBooking(multiBookingId, { status: 'CANCELLED', notes: 'تم إلغاء الحجز التجريبي بعد انتهاء الفحص' }, 'فحص_آلي');
  }
  console.log('✅ Cancelled test bookings safely without touching real client records.');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
