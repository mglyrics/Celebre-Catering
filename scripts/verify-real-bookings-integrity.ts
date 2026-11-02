import { db } from '../src/server/db';
import fs from 'fs';
import path from 'path';

/**
 * Read-Only Production Database Integrity Verification Script
 * This script strictly inspects and asserts data integrity without performing any mutations.
 */
async function verifyProductionDataIntegrity() {
  console.log('================================================================');
  console.log('🔍 فحص سلامة الحجوزات الفعلية وقاعدة البيانات (وضع القراءة فقط)');
  console.log('================================================================');

  try {
    // 1. Verify CLB-2026-5131 authentic customer booking
    console.log('\n[1] فحص سلامة الحجز المعتمد CLB-2026-5131 (أحمد عصام الدين حسين):');
    const b5131 = await db.getBookingById('CLB-2026-5131');
    if (!b5131) {
      throw new Error('الحجز الفعلي CLB-2026-5131 غير موجود في قاعدة البيانات!');
    }

    console.log(`   - كود الحجز: ${b5131.bookingCode}`);
    console.log(`   - اسم العميل: ${b5131.customerName}`);
    console.log(`   - هاتف العميل: ${b5131.customerPhone}`);
    console.log(`   - المناسبة: ${b5131.eventName}`);
    console.log(`   - التاريخ والوقت: ${b5131.eventDate} الساعة ${b5131.deliveryTime}`);
    console.log(`   - مكان التسليم: ${b5131.deliveryAddress}`);
    console.log(`   - الصنف والكمية: ${b5131.items[0]?.mealCode} - ${b5131.items[0]?.quantity} وجبة (${b5131.items[0]?.drinkOption})`);
    console.log(`   - الإجمالي: ${b5131.totalDistributorPrice} ج.م`);
    console.log(`   - المسدد: ${b5131.paidAmount} ج.م، المتبقي: ${b5131.remainingAmount} ج.م`);
    console.log(`   - علامة العزل: isTest = ${b5131.isTest}`);

    // Assertions against WhatsApp documented booking
    if (b5131.customerName !== 'أحمد عصام الدين حسين') {
      throw new Error(`فساد في اسم العميل: المتوقع "أحمد عصام الدين حسين"، الفعلي: "${b5131.customerName}"`);
    }
    if (b5131.customerPhone !== '01158855911') {
      throw new Error(`فساد في هاتف العميل: المتوقع "01158855911"، الفعلي: "${b5131.customerPhone}"`);
    }
    if (b5131.totalDistributorPrice !== 18000) {
      throw new Error(`فساد في إجمالي القيمة: المتوقع 18000 ج.م، الفعلي: ${b5131.totalDistributorPrice}`);
    }
    if (b5131.items[0]?.mealCode !== 'Sale-05' || b5131.items[0]?.quantity !== 200 || b5131.items[0]?.drinkOption !== 'pepsi') {
      throw new Error('فساد في تفاصيل الوجبات للحجز CLB-2026-5131');
    }
    if (b5131.isTest !== false) {
      throw new Error('الحجز الفعلي يجب أن يحمل علامة isTest: false');
    }
    console.log('✅ الحجز CLB-2026-5131 مطابق بنسبة 100% لبيانات رسالة WhatsApp الموثقة.');

    // 2. Audit all other bookings in the system
    console.log('\n[2] مراجعة شمولية لكافة الحجوزات في قاعدة البيانات:');
    const allBookings = await db.getBookings();
    console.log(`   - إجمالي عدد الحجوزات المسجلة: ${allBookings.length}`);

    let realCustomerCount = 0;
    let testCount = 0;
    const realCustomerNames = new Set<string>();

    allBookings.forEach(b => {
      if (b.isTest) {
        testCount++;
      } else {
        realCustomerCount++;
        realCustomerNames.add(b.customerName);
      }
    });

    console.log(`   - عدد الحجوزات الفعلية للعملاء: ${realCustomerCount}`);
    console.log(`   - عدد الحجوزات المصنفة كاختبارات (isTest: true): ${testCount}`);
    console.log(`   - العملاء الفعليون المعتمدون:`, Array.from(realCustomerNames));

    // Ensure no real customer bookings have test names
    const corruptedRealBookings = allBookings.filter(b => !b.isTest && /تجرب|فحص|تست|اختبار معزول/i.test(b.customerName));
    if (corruptedRealBookings.length > 0) {
      throw new Error(`يوجد ${corruptedRealBookings.length} حجز يحمل اسم اختبار ولكنه مصنف كحجز حقيقي!`);
    }

    console.log('✅ جميع الحجوزات الفعلية مفصولة ومعزولة 100% عن أي سجلات تجريبية.');
    console.log('\n================================================================');
    console.log('🎉 تمت مطابقة وفحص سلامة قاعدة البيانات والحجوزات الفعلية بنجاح!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ فشل فحص سلامة البيانات:', err);
    process.exit(1);
  }
}

verifyProductionDataIntegrity();
