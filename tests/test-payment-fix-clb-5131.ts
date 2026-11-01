import { db } from '../src/server/db';

async function testPaymentFix() {
  console.log('================================================================');
  console.log('🚀 اختبار التحقق الشامل لإصلاح Null constraint violation on bookingCode');
  console.log('================================================================');

  try {
    // 1. فحص وجود الحجز المستهدف CLB-2026-5131
    console.log('\n[1] فحص استرجاع الحجز CLB-2026-5131 والتأكد من أرصدته الأولية...');
    const booking = await db.getBookingById('CLB-2026-5131');
    if (!booking) {
      throw new Error('فشل العثور على الحجز CLB-2026-5131 في قاعدة البيانات');
    }

    console.log(`✅ تم العثور على الحجز: ${booking.bookingCode} (المعرف: ${booking.id})`);
    console.log(`   - اسم العميل: ${booking.customerName}`);
    console.log(`   - إجمالي الحجز: ${booking.totalDistributorPrice} ج.م`);
    console.log(`   - المسدد السابق: ${booking.paidAmount} ج.م`);
    console.log(`   - المتبقي السابق: ${booking.remainingAmount} ج.م`);

    if (booking.totalDistributorPrice !== 18000) {
      throw new Error(`إجمالي الحجز يجب أن يكون 18000 ج.م، القيمة الحالية: ${booking.totalDistributorPrice}`);
    }

    const priorPaid = booking.paidAmount || 0;
    const priorRemaining = booking.remainingAmount || 18000;

    // 2. تسجيل دفعة مالية بقيمة 9000 ج.م عبر instapay ورقم إيصال 511593844624
    console.log('\n[2] تسجيل الدفعة المالية المطلوبة:');
    console.log('   - المبلغ: 9000 ج.م');
    console.log('   - طريقة الدفع: instapay');
    console.log('   - رقم الإيصال / المرجع: 511593844624');
    console.log('   - المنفذ: الإدارة');

    const paymentResult = await db.addPayment({
      bookingId: 'CLB-2026-5131',
      bookingCode: 'CLB-2026-5131',
      amount: 9000,
      method: 'instapay',
      date: '2026-11-01',
      notes: 'الدفعة الأولى 50% سداد إنستاباي',
      receiptNumber: '511593844624',
      allowOverpayment: true,
    }, 'الإدارة');

    console.log('✅ تم تسجيل الدفعة بنجاح تام وبدون أي أخطاء!');
    console.log(`   - معرف الدفعة: ${paymentResult.payment.id}`);
    console.log(`   - قيمة الدفعة: ${paymentResult.payment.amount} ج.م`);
    console.log(`   - طريقة الدفع: ${paymentResult.payment.method}`);
    console.log(`   - رقم الإيصال: ${paymentResult.payment.receiptNumber}`);
    console.log(`   - المسدد الجديد للحجز: ${paymentResult.booking.paidAmount} ج.م`);
    console.log(`   - المتبقي الجديد للحجز: ${paymentResult.booking.remainingAmount} ج.م`);

    // التحقق من الحسابات الدقيقة
    const expectedPaid = priorPaid + 9000;
    const expectedRemaining = Math.max(0, priorRemaining - 9000);

    if (paymentResult.booking.paidAmount !== expectedPaid) {
      throw new Error(`قيمة المسدد غير مطابقة: المتوقع ${expectedPaid} ج.م، الفعلي: ${paymentResult.booking.paidAmount}`);
    }
    if (paymentResult.booking.remainingAmount !== expectedRemaining) {
      throw new Error(`قيمة المتبقي غير مطابقة: المتوقع ${expectedRemaining} ج.م، الفعلي: ${paymentResult.booking.remainingAmount}`);
    }

    // 3. التحقق من ثبات البيانات بعد إعادة جلب الحجز من قاعدة البيانات
    console.log('\n[3] إعادة تحميل الحجز للتأكد من ثبات البيانات (Persistence)...');
    const reloadedBooking = await db.getBookingById('CLB-2026-5131');
    if (!reloadedBooking) {
      throw new Error('فشل استرجاع الحجز بعد إعادة التحميل');
    }

    console.log(`✅ تم استرجاع الحجز بعد التحميل:`);
    console.log(`   - المسدد المحفوظ: ${reloadedBooking.paidAmount} ج.م`);
    console.log(`   - المتبقي المحفوظ: ${reloadedBooking.remainingAmount} ج.م`);

    const savedPayment = (reloadedBooking.payments || []).find(p => p.receiptNumber === '511593844624');
    if (!savedPayment) {
      throw new Error('الدفعة لم تظهر في مصفوفة مدفوعات الحجز المحفوظة');
    }
    console.log(`✅ تم التحقق من وجود الدفعة في سجل مدفوعات الحجز: معرف ${savedPayment.id} بمبلغ ${savedPayment.amount} ج.م`);

    // 4. التحقق من سجل التدقيق audit_logs ووجود bookingCode إلزامي
    console.log('\n[4] فحص سجل التدقيق (Audit Logs) للحجز CLB-2026-5131...');
    const auditLogs = await db.getAuditLogs('CLB-2026-5131');
    console.log(`✅ إجمالي سجلات التدقيق للحجز: ${auditLogs.length}`);

    const paymentAuditLog = auditLogs.find(l => 
      l.details.includes('511593844624') || 
      (l.action.includes('تسجيل دفعة') && l.details.includes('9000'))
    );

    if (!paymentAuditLog) {
      throw new Error('لم يتم العثور على سجل تدقيق يوثق هذه الدفعة!');
    }

    console.log('✅ تم العثور على سجل التدقيق بنجاح:');
    console.log(`   - bookingCode في سجل التدقيق: "${paymentAuditLog.bookingCode}"`);
    console.log(`   - العملية: "${paymentAuditLog.action}"`);
    console.log(`   - القائم بالعملية: "${paymentAuditLog.performedBy}"`);
    console.log(`   - التفاصيل: "${paymentAuditLog.details}"`);

    if (!paymentAuditLog.bookingCode || paymentAuditLog.bookingCode !== 'CLB-2026-5131') {
      throw new Error(`خطأ في bookingCode داخل سجل التدقيق: المتوقع "CLB-2026-5131"، الفعلي: "${paymentAuditLog.bookingCode}"`);
    }

    // 5. التحقق من منع تكرار الدفعة بنفس رقم الإيصال
    console.log('\n[5] اختبار منع التكرار: محاولة تسجيل دفعة جديدة بنفس رقم الإيصال 511593844624...');
    let duplicateRejected = false;
    try {
      await db.addPayment({
        bookingId: 'CLB-2026-5131',
        amount: 9000,
        method: 'instapay',
        receiptNumber: '511593844624',
      }, 'الإدارة');
    } catch (err: any) {
      duplicateRejected = true;
      console.log(`✅ تم رفض التكرار بنجاح. رسالة الخطأ المتوقعة: "${err.message}"`);
    }

    if (!duplicateRejected) {
      throw new Error('فشل النظام في منع تكرار تسجيل الدفعة بنفس رقم الإيصال!');
    }

    // 6. التحقق من حجز ثانٍ مستقل للتأكد من عمومية الحل
    console.log('\n[6] اختبار حجز ثانٍ مستقل للتحقق من عمومية الربط بـ UUID / ID والرمز...');
    const randomPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const secondBooking = await db.createBooking({
      customerName: 'حجز اختبار للتحقق العام',
      customerPhone: randomPhone,
      preferredContact: 'phone',
      eventName: 'فعالية تجريبية مستقلة',
      eventDate: '2026-12-15',
      deliveryTime: '13:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'مدينة نصر - عباس العقاد',
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 50,
          drinkOption: 'standard',
        },
      ],
      notes: 'حجز للتحقق من تعميم حل bookingCode على جميع الحجوزات',
    });

    console.log(`✅ تم إنشاء حجز تجريبي ثانٍ: ${secondBooking.bookingCode} (المعرف: ${secondBooking.id})، الإجمالي: ${secondBooking.totalDistributorPrice} ج.م`);

    const secondPayment = await db.addPayment({
      bookingId: secondBooking.id,
      amount: 1250,
      method: 'cash',
      receiptNumber: `CASH-REC-${Date.now()}`,
      notes: 'عربون نقدي 50%',
    }, 'المحاسب');

    console.log(`✅ تم تسجيل دفعة 1250 ج.م للحجز الثاني ${secondBooking.bookingCode} بنجاح!`);
    console.log(`   - المسدد: ${secondPayment.booking.paidAmount} ج.م (المتوقع: 1250)`);
    console.log(`   - المتبقي: ${secondPayment.booking.remainingAmount} ج.م (المتوقع: ${secondBooking.totalDistributorPrice - 1250})`);

    const secondLogs = await db.getAuditLogs(secondBooking.id);
    const secondPaymentLog = secondLogs.find(l => l.action.includes('تسجيل دفعة'));
    if (!secondPaymentLog || secondPaymentLog.bookingCode !== secondBooking.bookingCode) {
      throw new Error(`خطأ في توثيق سجل التدقيق للحجز الثاني: bookingCode = "${secondPaymentLog?.bookingCode}"`);
    }
    console.log(`✅ توثيق التدقيق للحجز الثاني صحيح ومطابق: bookingCode = "${secondPaymentLog.bookingCode}"`);

    console.log('\n================================================================');
    console.log('🎉 نجحت جميع اختبارات التحقق بنسبة 100% وتم حل خطأ bookingCode جذرياً!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ فشل الاختبار:', err);
    process.exit(1);
  }
}

testPaymentFix();
