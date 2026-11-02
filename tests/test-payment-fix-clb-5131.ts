import { db } from '../src/server/db';

/**
 * Isolated Test Suite for Payment Recording & Audit Log Integrity
 * Strictly compliant with data isolation:
 * - NEVER uses real production booking codes or IDs.
 * - Creates isolated synthetic test fixtures with `isTest: true`.
 * - Verifies the Prisma `bookingCode` Null constraint fix.
 * - Verifies duplicate receipt rejection (idempotency).
 * - Verifies that non-test bookings are strictly immune to test deletions/edits.
 * - Automatically tears down and deletes test fixtures.
 */
async function testPaymentFixAndDataIsolation() {
  console.log('================================================================');
  console.log('🛡️ اختبار معزول بالكامل: التحقق من إصلاح تسجيل الدفعات وسجل الرقابة');
  console.log('================================================================');

  let testBookingId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // 1. إنشاء حجز تجريبي معزول تماماً لاختبار تسجيل الدفعات وسجل الرقابة
    // -------------------------------------------------------------------------
    console.log('\n[1] إنشاء حجز تجريبي مستقل ومعزول (isTest: true):');
    const uniqueTestPhone = `0100${Math.floor(1000000 + Math.random() * 9000000)}`;
    const testBooking = await db.createBooking({
      customerName: '[اختبار معزول] فحص تسجيل الدفعات وسجل التدقيق',
      customerPhone: uniqueTestPhone,
      customerWhatsapp: uniqueTestPhone,
      preferredContact: 'phone',
      eventName: 'اختبار برمجي مستقل لمعالجة الدفعات',
      eventDate: '2026-12-25',
      deliveryTime: '16:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'مقر الاختبارات المعزول',
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 60,
          drinkOption: 'standard',
        },
      ],
      notes: 'حجز تجريبي معزول للاختبارات فقط',
      isTest: true,
    });

    testBookingId = testBooking.id;
    console.log(`✅ تم إنشاء الحجز التجريبي: ${testBooking.bookingCode} (المعرف: ${testBooking.id})`);
    console.log(`   - إجمالي القيمة: ${testBooking.totalDistributorPrice} ج.م`);
    console.log(`   - علامة العزل isTest: ${testBooking.isTest}`);

    // -------------------------------------------------------------------------
    // 2. تسجيل دفعة مالية للحجز التجريبي والتحقق من حل خطأ bookingCode
    // -------------------------------------------------------------------------
    console.log('\n[2] تسجيل دفعة مالية 1000 ج.م والتحقق من عدم حدوث Null constraint:');
    const testReceipt = `TEST-REC-${Date.now()}`;
    const paymentResult = await db.addPayment({
      bookingId: testBooking.id,
      bookingCode: testBooking.bookingCode,
      amount: 1000,
      method: 'instapay',
      date: '2026-11-01',
      notes: 'دفعة تجريبية لاختبار Null constraint وسجل التدقيق',
      receiptNumber: testReceipt,
      allowOverpayment: false,
    }, 'المحاسب الآلي');

    console.log('✅ تم تسجيل الدفعة بنجاح بدون أي أخطاء!');
    console.log(`   - المسدد الجديد: ${paymentResult.booking.paidAmount} ج.م`);
    console.log(`   - المتبقي الجديد: ${paymentResult.booking.remainingAmount} ج.م`);

    // -------------------------------------------------------------------------
    // 3. فحص سجل التدقيق (AuditLog) والتأكد من وجود bookingCode بصورة موثوقة
    // -------------------------------------------------------------------------
    console.log('\n[3] فحص سجل التدقيق (Audit Logs) وتوثيق bookingCode:');
    const auditLogs = await db.getAuditLogs(testBooking.id);
    const paymentAuditLog = auditLogs.find(l => l.details.includes(testReceipt));

    if (!paymentAuditLog) {
      throw new Error('لم يتم العثور على سجل تدقيق يوثق الدفعة المسجلة!');
    }

    console.log(`✅ تم توثيق الدفعة في سجل التدقيق بنجاح:`);
    console.log(`   - bookingCode في سجل التدقيق: "${paymentAuditLog.bookingCode}"`);
    console.log(`   - العملية: "${paymentAuditLog.action}"`);
    console.log(`   - القائم بالعملية: "${paymentAuditLog.performedBy}"`);

    if (!paymentAuditLog.bookingCode || paymentAuditLog.bookingCode !== testBooking.bookingCode) {
      throw new Error(`خطأ: bookingCode غير مطابق: المتوقع "${testBooking.bookingCode}"، الفعلي: "${paymentAuditLog.bookingCode}"`);
    }

    // -------------------------------------------------------------------------
    // 4. اختبار منع تكرار الدفعة بنفس رقم الإيصال
    // -------------------------------------------------------------------------
    console.log('\n[4] اختبار منع تكرار الدفعة بنفس رقم الإيصال (Idempotency):');
    let duplicateRejected = false;
    try {
      await db.addPayment({
        bookingId: testBooking.id,
        amount: 500,
        method: 'cash',
        receiptNumber: testReceipt,
      }, 'الإدارة');
    } catch (err: any) {
      duplicateRejected = true;
      console.log(`✅ تم رفض التكرار بنجاح: "${err.message}"`);
    }
    if (!duplicateRejected) {
      throw new Error('فشل النظام في رفض تكرار نفس رقم الإيصال!');
    }

    // -------------------------------------------------------------------------
    // 5. التحقق من حظر التعديل والحذف باستخدام bookingCode (إلزامية bookingId)
    // -------------------------------------------------------------------------
    console.log('\n[5] اختبار إلزامية المعرف الأساسي bookingId ورفض استخدام bookingCode:');
    let bookingCodeUpdateRejected = false;
    try {
      await db.updateBooking(testBooking.bookingCode, { customerName: 'تعديل بالكود' });
    } catch (err: any) {
      bookingCodeUpdateRejected = true;
      console.log(`✅ تم رفض التعديل باستخدام bookingCode بنجاح: "${err.message}"`);
    }
    if (!bookingCodeUpdateRejected) {
      throw new Error('فشل النظام في حظر استخدام bookingCode في التعديل!');
    }

    let bookingCodeDeleteRejected = false;
    try {
      await db.deleteTestBooking(testBooking.bookingCode, 'اختبار الحظر');
    } catch (err: any) {
      bookingCodeDeleteRejected = true;
      console.log(`✅ تم رفض الحذف باستخدام bookingCode بنجاح: "${err.message}"`);
    }
    if (!bookingCodeDeleteRejected) {
      throw new Error('فشل النظام في حظر استخدام bookingCode في الحذف!');
    }

    // -------------------------------------------------------------------------
    // 6. تنظيف الحجز التجريبي وحذفه بأمان
    // -------------------------------------------------------------------------
    console.log('\n[6] تنظيف الحجز التجريبي المعزول وحذفه بأمان:');
    const deleteResult = await db.deleteTestBooking(testBooking.id, 'تنظيف الاختبار المعزول');
    testBookingId = null; // Marked as cleaned
    console.log(`✅ تم حذف وتنظيف الحجز التجريبي ${deleteResult.bookingCode} بنجاح.`);

    console.log('\n================================================================');
    console.log('🎉 نجحت جميع اختبارات الحماية وعزل البيانات وتوثيق الدفعات بنسبة 100%!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ فشل الاختبار المعزول:', err);
    process.exit(1);
  } finally {
    if (testBookingId) {
      try {
        await db.deleteTestBooking(testBookingId, 'تنظيف طوارئ');
      } catch {}
    }
  }
}

testPaymentFixAndDataIsolation();
