import { db } from '../src/server/db';

async function testPaymentFixAndBookingIntegrity() {
  console.log('================================================================');
  console.log('🛡️ اختبار حماية بيانات الحجوزات الفعلية والتحقق من إصلاح تسجيل الدفعات');
  console.log('================================================================');

  try {
    // -------------------------------------------------------------------------
    // 1. التحقق الصارم من سلامة وأصالة بيانات الحجز الفعلي CLB-2026-5131
    // -------------------------------------------------------------------------
    console.log('\n[1] فحص سلامة الحجز الفعلي المعتمد للعميل (أحمد عصام الدين حسين):');
    const realBooking = await db.getBookingById('CLB-2026-5131');
    if (!realBooking) {
      throw new Error('فشل العثور على الحجز الفعلي CLB-2026-5131 في قاعدة البيانات!');
    }

    console.log(`✅ تم التحقق من الحجز: ${realBooking.bookingCode} (المعرف: ${realBooking.id})`);
    console.log(`   - اسم العميل: ${realBooking.customerName}`);
    console.log(`   - هاتف العميل: ${realBooking.customerPhone}`);
    console.log(`   - المناسبة: ${realBooking.eventName} (${realBooking.eventDate} الساعة ${realBooking.deliveryTime})`);
    console.log(`   - مكان التسليم: ${realBooking.deliveryAddress}`);
    console.log(`   - الصنف: ${realBooking.items[0]?.mealCode} - كمية: ${realBooking.items[0]?.quantity} وجبة (${realBooking.items[0]?.drinkOption})`);
    console.log(`   - إجمالي الحجز: ${realBooking.totalDistributorPrice} ج.م`);
    console.log(`   - تكلفة المصنع: ${realBooking.totalFactoryPrice} ج.م`);
    console.log(`   - المسدد: ${realBooking.paidAmount} ج.م، المتبقي: ${realBooking.remainingAmount} ج.م`);
    console.log(`   - الحالة: ${realBooking.status} (isTest: ${realBooking.isTest})`);

    // تأكيدات صارمة لبيانات الحجز الموثقة بـ WhatsApp
    if (realBooking.customerName !== 'أحمد عصام الدين حسين') {
      throw new Error(`فساد في اسم العميل للحجز CLB-2026-5131: المتوقع "أحمد عصام الدين حسين"، الفعلي: "${realBooking.customerName}"`);
    }
    if (realBooking.customerPhone !== '01158855911') {
      throw new Error(`فساد في هاتف العميل للحجز CLB-2026-5131: المتوقع "01158855911"، الفعلي: "${realBooking.customerPhone}"`);
    }
    if (realBooking.totalDistributorPrice !== 18000) {
      throw new Error(`فساد في إجمالي الحجز: المتوقع 18000 ج.م، الفعلي: ${realBooking.totalDistributorPrice}`);
    }
    if (realBooking.items[0]?.mealCode !== 'Sale-05' || realBooking.items[0]?.quantity !== 200 || realBooking.items[0]?.drinkOption !== 'pepsi') {
      throw new Error('فساد في بنود الوجبات للحجز CLB-2026-5131!');
    }
    if (realBooking.isTest !== false) {
      throw new Error('الحجز الفعلي يجب أن يكون isTest: false');
    }

    console.log('✅ تم إثبات سلامة وتطابق بيانات الحجز الفعلي بنسبة 100% مع رسالة WhatsApp.');

    // -------------------------------------------------------------------------
    // 2. التحقق من مناعة الحجز الفعلي ضد الحذف العرضي أو التعديل التجريبي
    // -------------------------------------------------------------------------
    console.log('\n[2] اختبار مناعة الحجز الفعلي ضد الحذف أو التعديل التجريبي:');
    let deletionPrevented = false;
    try {
      await db.deleteTestBooking(realBooking.id, 'اختبار الحماية');
    } catch (err: any) {
      deletionPrevented = true;
      console.log(`✅ تم منع حذف الحجز الفعلي بنجاح: "${err.message}"`);
    }
    if (!deletionPrevented) {
      throw new Error('خطر أمني: النظام سمح بحذف حجز عميل فعلي!');
    }

    let testUpdatePrevented = false;
    try {
      await db.updateTestBooking(realBooking.id, { customerName: 'بيانات وهمية' }, 'اختبار الحماية');
    } catch (err: any) {
      testUpdatePrevented = true;
      console.log(`✅ تم منع التعديل التجريبي على الحجز الفعلي بنجاح: "${err.message}"`);
    }
    if (!testUpdatePrevented) {
      throw new Error('خطر أمني: النظام سمح بتعديل حجز عميل فعلي عبر مسار تجريبي!');
    }

    // -------------------------------------------------------------------------
    // 3. إنشاء حجز تجريبي مستقل ومفصول تماماً لاختبار تسجيل الدفعات وسجل الرقابة
    // -------------------------------------------------------------------------
    console.log('\n[3] إنشاء حجز تجريبي مستقل ومفصول (isTest: true) لاختبار الدفعات:');
    const uniqueTestPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testBooking = await db.createBooking({
      customerName: 'حجز تجريبي لفحص الدفعات والرقابة',
      customerPhone: uniqueTestPhone,
      preferredContact: 'phone',
      eventName: 'اختبار برمجي مستقل',
      eventDate: '2026-12-20',
      deliveryTime: '15:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'مقر الاختبارات - التجمع',
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 50,
          drinkOption: 'standard',
        },
      ],
      notes: 'حجز تجريبي مستقل لاختبار الدفعات وعزل البيانات',
      isTest: true,
    });

    console.log(`✅ تم إنشاء الحجز التجريبي: ${testBooking.bookingCode} (المعرف: ${testBooking.id})`);
    console.log(`   - الإجمالي: ${testBooking.totalDistributorPrice} ج.م`);
    console.log(`   - isTest: ${testBooking.isTest}`);

    // -------------------------------------------------------------------------
    // 4. تسجيل دفعة مالية للحجز التجريبي والتحقق من حل خطأ bookingCode
    // -------------------------------------------------------------------------
    console.log('\n[4] تسجيل دفعة مالية 1000 ج.م للحجز التجريبي:');
    const testReceipt = `TEST-REC-${Date.now()}`;
    const paymentResult = await db.addPayment({
      bookingId: testBooking.id,
      bookingCode: testBooking.bookingCode,
      amount: 1000,
      method: 'instapay',
      date: '2026-11-01',
      notes: 'دفعة تجريبية لاختبار Null constraint',
      receiptNumber: testReceipt,
      allowOverpayment: false,
    }, 'المحاسب الآلي');

    console.log('✅ تم تسجيل الدفعة بنجاح بدون أي أخطاء!');
    console.log(`   - المسدد الجديد: ${paymentResult.booking.paidAmount} ج.م`);
    console.log(`   - المتبقي الجديد: ${paymentResult.booking.remainingAmount} ج.م`);

    // -------------------------------------------------------------------------
    // 5. فحص سجل التدقيق (AuditLog) للحجز التجريبي والتأكد من bookingCode
    // -------------------------------------------------------------------------
    console.log('\n[5] فحص سجل التدقيق (Audit Logs) وتوثيق bookingCode:');
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
    // 6. اختبار منع تكرار الدفعة بنفس رقم الإيصال
    // -------------------------------------------------------------------------
    console.log('\n[6] اختبار منع تكرار الدفعة بنفس رقم الإيصال:');
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
    // 7. تنظيف الحجز التجريبي وحذفه بأمان
    // -------------------------------------------------------------------------
    console.log('\n[7] تنظيف الحجز التجريبي وحذفه بأمان:');
    const deleteResult = await db.deleteTestBooking(testBooking.id, 'تنظيف الاختبار');
    console.log(`✅ تم حذف الحجز التجريبي ${deleteResult.bookingCode} بنجاح.`);

    // -------------------------------------------------------------------------
    // 8. التحقق الختامي: التأكد من أن الحجز الفعلي CLB-2026-5131 لم يتأثر مطلقاً
    // -------------------------------------------------------------------------
    console.log('\n[8] التحقق الختامي من عدم تأثر الحجز الفعلي بعد جميع الاختبارات:');
    const finalRealBooking = await db.getBookingById('CLB-2026-5131');
    if (!finalRealBooking) {
      throw new Error('فقدان الحجز الفعلي بعد الاختبارات!');
    }

    if (finalRealBooking.customerName !== 'أحمد عصام الدين حسين' ||
        finalRealBooking.customerPhone !== '01158855911' ||
        finalRealBooking.totalDistributorPrice !== 18000 ||
        finalRealBooking.items[0]?.mealCode !== 'Sale-05') {
      throw new Error('حدث تغيير في بيانات الحجز الفعلي أثناء تنفيذ الاختبارات!');
    }

    console.log('✅ الحجز الفعلي CLB-2026-5131 محمي بنسبة 100% وظل ثابتاً تماماً دون أدنى تغيير!');
    console.log('\n================================================================');
    console.log('🎉 نجحت جميع اختبارات الحماية وعزل البيانات وتوثيق الدفعات بنسبة 100%!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ فشل الاختبار:', err);
    process.exit(1);
  }
}

testPaymentFixAndBookingIntegrity();
