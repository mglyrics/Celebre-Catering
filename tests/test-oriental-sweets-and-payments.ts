import { db } from '../src/server/db';
import fs from 'fs';
import path from 'path';

/**
 * Rigorous Automated Test Suite:
 * - Tests oriental sweet options pricing & item persistence
 * - Tests booking details retrieval with items & sweet options
 * - Tests payment recording without any column missing errors
 * - Tests balance recalculation (paidAmount, remainingAmount)
 * - Tests duplicate receipt prevention
 * - Tests audit log recording
 * - Verifies that real booking CLB-2026-5131 is 100% untouched
 */
async function runOrientalSweetsAndPaymentsTest() {
  console.log('========================================================================');
  console.log('🧪 اختبار آلي شامل: التحقق من توافق أعمدة القطعة الشرقي وتكامل الدفعات وسجل التدقيق');
  console.log('========================================================================\n');

  let testBookingId: string | null = null;
  const uniqueSuffix = Date.now().toString().slice(-4);
  const testPhone = `0108888${uniqueSuffix}`;

  try {
    // -------------------------------------------------------------------------
    // 0. التحقق من سلامة الحجز الحقيقي CLB-2026-5131 قبل الاختبار
    // -------------------------------------------------------------------------
    console.log('[0] التحقق المسبق من ثبات وحماية الحجز الحقيقي CLB-2026-5131:');
    const dbPath = path.resolve('data/db.json');
    const initialRawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const initialRealBooking = initialRawDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');

    if (!initialRealBooking) {
      throw new Error('❌ خطأ: الحجز الحقيقي CLB-2026-5131 غير موجود!');
    }
    if (initialRealBooking.customerName !== 'أحمد عصام الدين حسين' || initialRealBooking.customerPhone !== '01158855911') {
      throw new Error('❌ خطأ: بيانات الحجز الحقيقي لا تطابق السجل الأصلي الموثق!');
    }
    console.log(`✅ الحجز الحقيقي سليم ومحمي (كود: ${initialRealBooking.bookingCode}، العميل: ${initialRealBooking.customerName}، الإجمالي: ${initialRealBooking.totalDistributorPrice} ج).\n`);

    // -------------------------------------------------------------------------
    // 1. إنشاء حجز تجريبي يحتوي على خيارات القطعة الشرقي المختلفة
    // -------------------------------------------------------------------------
    console.log('[1] إنشاء حجز تجريبي يتضمن وجبات بخيارات القطعة الشرقي (إضافة مع العصير، استبدال العصير):');
    const createdBooking = await db.createBooking({
      customerName: `[فحص الشرقي والدفعات] عميل اختبار ${uniqueSuffix}`,
      customerPhone: testPhone,
      customerWhatsapp: testPhone,
      preferredContact: 'whatsapp',
      eventName: 'اختبار برمجي للقطعة الشرقي ومسار الدفعات',
      eventDate: '2026-11-20',
      deliveryTime: '17:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'قاعة الاختبارات التخصصية',
      notes: 'حجز تجريبي مستقل للتحقق من توافق المخطط وقاعدة البيانات',
      items: [
        {
          mealCode: 'Sale-01', // baseDistributorPrice: 50
          quantity: 30,
          drinkOption: 'standard',
          orientalSweetOption: 'add_with_juice', // +20 ج على الموزع
        },
        {
          mealCode: 'Sale-02', // baseDistributorPrice: 55
          quantity: 20,
          drinkOption: 'standard',
          orientalSweetOption: 'replace_juice', // +15 ج على الموزع
        },
      ],
      isTest: true,
    });

    testBookingId = createdBooking.id;
    console.log(`✅ تم إنشاء الحجز التجريبي بنجاح:`);
    console.log(`   - كود الحجز: ${createdBooking.bookingCode}`);
    console.log(`   - المعرف الأساسي: ${createdBooking.id}`);
    console.log(`   - إجمالي عدد الوجبات: ${createdBooking.totalMealsCount} وجبة`);
    console.log(`   - إجمالي السعر: ${createdBooking.totalDistributorPrice} ج.م`);

    // التحقق من صحة معادلات التسعير للقطعة الشرقي:
    // الصنف 1: 30 وجبة * (50 + 20) = 2100 ج
    // الصنف 2: 20 وجبة * (55 + 15) = 1400 ج
    // الإجمالي المتوقع: 3500 ج
    const expectedTotal = (30 * 70) + (20 * 70);
    if (createdBooking.totalDistributorPrice !== expectedTotal) {
      throw new Error(`❌ خطأ في احتساب سعر القطعة الشرقي: المتوقع ${expectedTotal} ج، الفعلي: ${createdBooking.totalDistributorPrice} ج`);
    }
    console.log(`✅ معادلات تسعير القطعة الشرقي مطبقة بدقة متناهية (3500 ج.م).\n`);

    // -------------------------------------------------------------------------
    // 2. قراءة الحجز وتفاصيل عناصره وبيانات القطعة الشرقي
    // -------------------------------------------------------------------------
    console.log('[2] قراءة الحجز وتفاصيل أصنافه والتحقق من قراءة حقل orientalSweetOption:');
    const fetchedBooking = await db.getBookingById(createdBooking.id);
    if (!fetchedBooking) {
      throw new Error('❌ تعذر استرجاع الحجز عبر getBookingById!');
    }

    const item1 = fetchedBooking.items.find(it => it.mealCode === 'Sale-01');
    const item2 = fetchedBooking.items.find(it => it.mealCode === 'Sale-02');

    if (!item1 || item1.orientalSweetOption !== 'add_with_juice') {
      throw new Error(`❌ خطأ في قراءة خيار القطعة الشرقي للصنف 1: ${item1?.orientalSweetOption}`);
    }
    if (!item2 || item2.orientalSweetOption !== 'replace_juice') {
      throw new Error(`❌ خطأ في قراءة خيار القطعة الشرقي للصنف 2: ${item2?.orientalSweetOption}`);
    }
    console.log(`✅ تم استرجاع تفاصيل الحجز وقراءة orientalSweetOption بنجاح تام دون أي أخطاء أعمدة.\n`);

    // -------------------------------------------------------------------------
    // 3. تسجيل دفعة مالية أولى (عربون 1500 ج)
    // -------------------------------------------------------------------------
    console.log('[3] تسجيل دفعة مالية أولى (عربون 1500 ج):');
    const receipt1 = `REC-TEST-SWEET-${uniqueSuffix}`;
    const pay1 = await db.addPayment({
      bookingId: createdBooking.id,
      bookingCode: createdBooking.bookingCode,
      amount: 1500,
      method: 'instapay',
      date: '2026-11-05',
      receiptNumber: receipt1,
      notes: 'عربون حجز لاختبار التوافق',
    }, 'المحاسب الآلي');

    console.log(`✅ تم تسجيل الدفعة بنجاح داخل Transaction:`);
    console.log(`   - معرّف الدفعة: ${pay1.payment.id}`);
    console.log(`   - معرّف الحجز المرتبط: ${pay1.payment.bookingId}`);
    console.log(`   - المسدد الجديد: ${pay1.booking.paidAmount} ج.م`);
    console.log(`   - المتبقي الجديد: ${pay1.booking.remainingAmount} ج.م (المتوقع: 2000 ج)`);

    if (pay1.booking.paidAmount !== 1500 || pay1.booking.remainingAmount !== 2000) {
      throw new Error('❌ خطأ في حسابات المسدد والمتبقي بعد الدفعة الأولى!');
    }

    // -------------------------------------------------------------------------
    // 4. اختبار ظهور الدفعة بعد إعادة الاستعلام
    // -------------------------------------------------------------------------
    console.log('\n[4] التحقق من ظهور الدفعة عند إعادة قراءة الحجز من التخزين:');
    const reloadedBooking = await db.getBookingById(createdBooking.id);
    if (!reloadedBooking) {
      throw new Error('❌ فشل إعادة قراءة الحجز!');
    }

    const recordedPayment = reloadedBooking.payments?.find(p => p.receiptNumber === receipt1);
    if (!recordedPayment) {
      throw new Error('❌ لم تظهر الدفعة المسجلة في قائمة دفعات الحجز بعد إعادة القراءة!');
    }
    console.log(`✅ ظهرت الدفعة بنجاح برقم إيصال "${recordedPayment.receiptNumber}" ومبلغ ${recordedPayment.amount} ج.`);

    // -------------------------------------------------------------------------
    // 5. تعديل الحجز ثم تسجيل دفعة ثانية
    // -------------------------------------------------------------------------
    console.log('\n[5] تعديل ملاحظات الحجز ثم تسجيل دفعة ثانية:');
    const updatedBooking = await db.updateBooking(createdBooking.id, {
      notes: 'تم تحديث الملاحظات قبل تسديد الدفعة الثانية',
    }, 'المشرف');

    if (!updatedBooking || updatedBooking.notes !== 'تم تحديث الملاحظات قبل تسديد الدفعة الثانية') {
      throw new Error('❌ فشل تعديل الحجز بالمعرف الأساسي!');
    }
    console.log(`✅ تم تحديث الحجز بالمعرف الأساسي بنجاح (الإصدار v${updatedBooking.version}).`);

    const receipt2 = `REC-TEST-SWEET-2-${uniqueSuffix}`;
    const pay2 = await db.addPayment({
      bookingId: createdBooking.id,
      amount: 1000,
      method: 'bank_transfer',
      receiptNumber: receipt2,
      notes: 'دفعة ثانية بعد تعديل الحجز',
    }, 'المحاسب الآلي');

    console.log(`✅ تم تسجيل الدفعة الثانية بنجاح:`);
    console.log(`   - إجمالي المسدد التراكمي: ${pay2.booking.paidAmount} ج.م (المتوقع: 2500 ج)`);
    console.log(`   - المتبقي التراكمي: ${pay2.booking.remainingAmount} ج.م (المتوقع: 1000 ج)`);

    if (pay2.booking.paidAmount !== 2500 || pay2.booking.remainingAmount !== 1000) {
      throw new Error('❌ خطأ في الحساب التراكمي للمسدد والمتبقي بعد الدفعة الثانية!');
    }

    // -------------------------------------------------------------------------
    // 6. اختبار منع تكرار الدفعة بنفس رقم الإيصال
    // -------------------------------------------------------------------------
    console.log('\n[6] اختبار منع تكرار الدفعة بنفس رقم الإيصال (Idempotency):');
    let duplicatePrevented = false;
    try {
      await db.addPayment({
        bookingId: createdBooking.id,
        amount: 500,
        method: 'cash',
        receiptNumber: receipt1, // تكرار الإيصال الأول
        allowOverpayment: true,
      }, 'نظام الرقابة');
    } catch (dupErr: any) {
      duplicatePrevented = true;
      console.log(`✅ تم رفض تكرار الدفعة بنجاح: "${dupErr.message}"`);
    }

    if (!duplicatePrevented) {
      throw new Error('❌ خطأ: سمح النظام بتكرار نفس رقم الإيصال!');
    }

    // -------------------------------------------------------------------------
    // 7. التحقق من توثيق العملية في سجل التدقيق (AuditLog)
    // -------------------------------------------------------------------------
    console.log('\n[7] فحص سجل التدقيق (Audit Log):');
    const logs = await db.getAuditLogs(createdBooking.id);
    const payLog = logs.find(l => l.details.includes(receipt1));
    if (!payLog) {
      throw new Error('❌ لم يتم العثور على سجل تدقيق يوثق الدفعة!');
    }
    console.log(`✅ تم توثيق الدفعة في سجل التدقيق بنجاح: "${payLog.action}" بواسطة "${payLog.performedBy}"`);

    // -------------------------------------------------------------------------
    // 8. تنظيف الحجز التجريبي وحذفه بأمان
    // -------------------------------------------------------------------------
    console.log('\n[8] تنظيف الحجز التجريبي بأمان:');
    const delRes = await db.deleteTestBooking(createdBooking.id, 'تنظيف الاختبار الشامل');
    testBookingId = null;
    console.log(`✅ تم حذف سجل الاختبار التجريبي (${delRes.bookingCode}) بنجاح.`);

    // -------------------------------------------------------------------------
    // 9. التحقق النهائي من عدم المساس بالحجز الحقيقي CLB-2026-5131
    // -------------------------------------------------------------------------
    console.log('\n[9] التحقق النهائي من ثبات وحماية الحجز الحقيقي CLB-2026-5131:');
    const finalRawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const finalRealBooking = finalRawDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');

    if (!finalRealBooking) {
      throw new Error('❌ خطأ حرج: الحجز الحقيقي CLB-2026-5131 فُقد!');
    }
    if (
      finalRealBooking.customerName !== initialRealBooking.customerName ||
      finalRealBooking.customerPhone !== initialRealBooking.customerPhone ||
      finalRealBooking.totalDistributorPrice !== initialRealBooking.totalDistributorPrice ||
      finalRealBooking.paidAmount !== initialRealBooking.paidAmount
    ) {
      throw new Error('❌ خطأ حرج: تم التعديل على الحجز الحقيقي أثناء الاختبار!');
    }

    console.log(`✅ الحجز الحقيقي CLB-2026-5131 سليم ومحمي 100% بكامل بياناته وقيمه المالية دون تغيير.`);
    console.log('\n========================================================================');
    console.log('🎉 نجحت جميع الاختبارات المطلوبة بنسبة 100%!');
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

runOrientalSweetsAndPaymentsTest();
