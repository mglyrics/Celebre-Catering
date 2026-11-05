import { db } from '../src/server/db';
import fs from 'fs';
import path from 'path';

/**
 * Isolated Automated Test Suite: Foreign Key Resolution & Payment Integrity Test
 * 
 * Verifies:
 * 1. Automatic resolution of authoritative internal `booking.id` when `bookingCode` is provided.
 * 2. Proper Prisma relation connection (`booking: { connect: { id: authoritativeBookingId } }`).
 * 3. Prevention of foreign key constraint violations (`payments_bookingId_fkey`).
 * 4. Accurate atomic balance calculations (paidAmount, remainingAmount).
 * 5. Duplicate receipt rejection (Idempotency).
 * 6. Mandatory `bookingId` enforcement for updates/status changes.
 * 7. Absolute protection of real production booking CLB-2026-5131.
 */
async function runPaymentFKResolutionTests() {
  console.log('========================================================================');
  console.log('🛡️ اختبار آلي شامل: التحقق من معالجة المفتاح الأجنبي وتكامل الدفعات وحماية البيانات');
  console.log('========================================================================');

  let testBookingId: string | null = null;
  const uniqueSuffix = Date.now().toString().slice(-4);
  const testPhone = `0109999${uniqueSuffix}`;

  try {
    // -------------------------------------------------------------------------
    // الخطوة 0: فحص وتأكيد سلامة الحجز الحقيقي CLB-2026-5131 قبل أي إجراء
    // -------------------------------------------------------------------------
    console.log('\n[0] فحص سلامة الحجز الحقيقي CLB-2026-5131 قبل الاختبار:');
    const dbPath = path.resolve('data/db.json');
    const initialRawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const initialRealBooking = initialRawDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');

    if (!initialRealBooking) {
      throw new Error('❌ خطأ حرج: لم يتم العثور على الحجز الحقيقي CLB-2026-5131 في قاعدة البيانات!');
    }

    if (initialRealBooking.customerName !== 'أحمد عصام الدين حسين' || initialRealBooking.customerPhone !== '01158855911') {
      throw new Error(`❌ خطأ حرج: بيانات الحجز الحقيقي غير متطابقة! الاسم: ${initialRealBooking.customerName}`);
    }

    console.log(`✅ الحجز الحقيقي CLB-2026-5131 سليم ومحمي تماماً:`);
    console.log(`   - الاسم: ${initialRealBooking.customerName}`);
    console.log(`   - الهاتف: ${initialRealBooking.customerPhone}`);
    console.log(`   - المعرف الداخلي: ${initialRealBooking.id}`);
    console.log(`   - الإجمالي: ${initialRealBooking.totalDistributorPrice} ج.م`);
    console.log(`   - المسدد: ${initialRealBooking.paidAmount} ج.م`);

    // -------------------------------------------------------------------------
    // الخطوة 1: إنشاء حجز تجريبي مستقل تماماً (isTest: true)
    // -------------------------------------------------------------------------
    console.log('\n[1] إنشاء حجز تجريبي مستقل للاختبار:');
    const createdTestBooking = await db.createBooking({
      customerName: `[فحص المفتاح الأجنبي] عميل اختبار ${uniqueSuffix}`,
      customerPhone: testPhone,
      customerWhatsapp: testPhone,
      preferredContact: 'whatsapp',
      eventName: 'اختبار برمجي لمعالجة Foreign Key',
      eventDate: '2026-12-30',
      deliveryTime: '15:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'مقر الاختبارات المعزولة',
      notes: 'حجز تجريبي لاختبار Foreign Key والدفعات',
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 50,
          drinkOption: 'standard',
          orientalSweetOption: 'none',
        },
      ],
      isTest: true,
    });

    testBookingId = createdTestBooking.id;
    console.log(`✅ تم إنشاء الحجز التجريبي بنجاح:`);
    console.log(`   - كود الحجز الظاهر: ${createdTestBooking.bookingCode}`);
    console.log(`   - المعرف الداخلي (id): ${createdTestBooking.id}`);
    console.log(`   - إجمالي الحساب: ${createdTestBooking.totalDistributorPrice} ج.م`);
    console.log(`   - المسدد الابتدائي: ${createdTestBooking.paidAmount} ج.م`);
    console.log(`   - المتبقي الابتدائي: ${createdTestBooking.remainingAmount} ج.م`);

    // -------------------------------------------------------------------------
    // الخطوة 2: اختبار تسجيل دفعة بتمرير كود الحجز الظاهر فقط (CLB-...) كمعرف
    // محاكاة الحالة التي سببت خطأ Foreign key constraint سابقاً
    // -------------------------------------------------------------------------
    console.log('\n[2] اختبار تسجيل دفعة بتمرير كود الحجز الظاهر فقط (محاكاة الطلب الوارد):');
    const receipt1 = `REC-TEST-A-${uniqueSuffix}`;
    const payment1Result = await db.addPayment({
      bookingId: createdTestBooking.bookingCode, // نمرر كود الحجز وليس الـ id
      amount: 1500,
      method: 'instapay',
      date: '2026-11-05',
      receiptNumber: receipt1,
      notes: 'دفعة اختبار حل مشكلة المفتاح الأجنبي',
    }, 'المحاسب الآلي');

    console.log(`✅ نجح تسجيل الدفعة دون أي خطأ في المفتاح الأجنبي!`);
    console.log(`   - معرف الدفعة: ${payment1Result.payment.id}`);
    console.log(`   - معرف الحجز الفعلي المرتبط بالدفعة (bookingId): ${payment1Result.payment.bookingId}`);
    console.log(`   - المسدد الجديد: ${payment1Result.booking.paidAmount} ج.م`);
    console.log(`   - المتبقي الجديد: ${payment1Result.booking.remainingAmount} ج.م`);

    if (payment1Result.payment.bookingId !== createdTestBooking.id) {
      throw new Error(`❌ فشل: لم يتم ربط الدفعة بالمعرف الداخلي الصحيح! المتوقع: ${createdTestBooking.id}، الفعلي: ${payment1Result.payment.bookingId}`);
    }

    if (payment1Result.booking.paidAmount !== 1500) {
      throw new Error(`❌ خطأ في الحساب المالي: المتوقع 1500 ج، الفعلي: ${payment1Result.booking.paidAmount}`);
    }

    // -------------------------------------------------------------------------
    // الخطوة 3: اختبار تسجيل دفعة ثانية بتمرير المعرف الداخلي id
    // -------------------------------------------------------------------------
    console.log('\n[3] اختبار تسجيل دفعة ثانية بتمرير المعرف الداخلي (bookingId):');
    const receipt2 = `REC-TEST-B-${uniqueSuffix}`;
    const payment2Result = await db.addPayment({
      bookingId: createdTestBooking.id, // نمرر المعرف الداخلي مباشرة
      bookingCode: createdTestBooking.bookingCode,
      amount: 1000,
      method: 'bank_transfer',
      date: '2026-11-05',
      receiptNumber: receipt2,
      notes: 'دفعة ثانية لتأكيد التراكم المالي',
    }, 'إدارة الحسابات');

    console.log(`✅ نجح تسجيل الدفعة الثانية:`);
    console.log(`   - إجمالي المسدد التراكمي: ${payment2Result.booking.paidAmount} ج.م (المتوقع 2500 ج)`);
    console.log(`   - المتبقي التراكمي: ${payment2Result.booking.remainingAmount} ج.م`);

    if (payment2Result.booking.paidAmount !== 2500) {
      throw new Error(`❌ خطأ في الحساب التراكمي: المتوقع 2500 ج، الفعلي: ${payment2Result.booking.paidAmount}`);
    }

    // -------------------------------------------------------------------------
    // الخطوة 4: اختبار رفض تكرار الدفعة بنفس رقم الإيصال (Idempotency)
    // -------------------------------------------------------------------------
    console.log('\n[4] اختبار منع تكرار الدفعة بنفس رقم الإيصال / المرجع:');
    let duplicateCaught = false;
    try {
      await db.addPayment({
        bookingId: createdTestBooking.id,
        amount: 500,
        method: 'cash',
        receiptNumber: receipt1, // تكرار الإيصال الأول
        allowOverpayment: true,
      }, 'نظام التدقيق');
    } catch (dupErr: any) {
      duplicateCaught = true;
      console.log(`✅ تم رفض التكرار بنجاح مع رسالة واضحة: "${dupErr.message}"`);
      if (!dupErr.message.includes(receipt1)) {
        throw new Error(`رسالة الخطأ لم تذكر رقم الإيصال المكرر: ${dupErr.message}`);
      }
    }

    if (!duplicateCaught) {
      throw new Error('❌ خطأ: سمح النظام بتسجيل دفعة مكررة بنفس رقم الإيصال!');
    }

    // -------------------------------------------------------------------------
    // الخطوة 5: اختبار إلزامية المعرف الأساسي bookingId في تعديل الحجز وحالته
    // -------------------------------------------------------------------------
    console.log('\n[5] اختبار رفض استخدام كود الحجز الظاهر في عمليات التعديل:');
    let updateByCodeCaught = false;
    try {
      await db.updateBooking(createdTestBooking.bookingCode, { customerName: 'اسم معدل بالكود' });
    } catch (updErr: any) {
      updateByCodeCaught = true;
      console.log(`✅ تم رفض التعديل بالكود بنجاح: "${updErr.message}"`);
    }

    if (!updateByCodeCaught) {
      throw new Error('❌ خطأ: سمح النظام بتعديل الحجز باستخدام كود الحجز بدلاً من المعرف الأساسي!');
    }

    // -------------------------------------------------------------------------
    // الخطوة 6: تنظيف وحذف الحجز التجريبي بأمان
    // -------------------------------------------------------------------------
    console.log('\n[6] تنظيف الحجز التجريبي وحذفه بأمان:');
    const deleteRes = await db.deleteTestBooking(createdTestBooking.id, 'تنظيف بعد انتهاء اختبار Foreign Key');
    testBookingId = null;
    console.log(`✅ تم حذف سجل الاختبار التجريبي (${deleteRes.bookingCode}) بأمان.`);

    // -------------------------------------------------------------------------
    // الخطوة 7: التحقق النهائي من عدم المساس بالحجز الحقيقي CLB-2026-5131
    // -------------------------------------------------------------------------
    console.log('\n[7] التحقق النهائي من ثبات وحماية الحجز الحقيقي CLB-2026-5131:');
    const finalRawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const finalRealBooking = finalRawDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');

    if (!finalRealBooking) {
      throw new Error('❌ خطأ حرج: فُقد الحجز الحقيقي CLB-2026-5131!');
    }

    if (
      finalRealBooking.customerName !== initialRealBooking.customerName ||
      finalRealBooking.customerPhone !== initialRealBooking.customerPhone ||
      finalRealBooking.totalDistributorPrice !== initialRealBooking.totalDistributorPrice ||
      finalRealBooking.paidAmount !== initialRealBooking.paidAmount
    ) {
      throw new Error('❌ خطأ حرج: تم تعديل قيم الحجز الحقيقي أثناء الاختبار!');
    }

    console.log('✅ تم تأكيد بقاء الحجز الحقيقي CLB-2026-5131 بكامل بياناته الأصلية دون أي مساس.');
    console.log('========================================================================');
    console.log('🎉 نجحت جميع اختبارات حل مشكلة Foreign Key وحماية البيانات بنسبة 100%!');
    console.log('========================================================================');
  } catch (err: any) {
    console.error('\n❌ فشل الاختبار:', err);
    process.exit(1);
  } finally {
    if (testBookingId) {
      try {
        await db.deleteTestBooking(testBookingId, 'تنظيف طوارئ');
      } catch {}
    }
  }
}

runPaymentFKResolutionTests();
