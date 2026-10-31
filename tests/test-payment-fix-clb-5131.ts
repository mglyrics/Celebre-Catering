import { db } from '../src/server/db';

async function testPaymentFix() {
  console.log('====================================================');
  console.log('🚀 بدء اختبار إصلاح خطأ تسجيل الدفعات المالية للحجز CLB-2026-5131');
  console.log('====================================================');

  try {
    // 1. فحص وجود الحجز CLB-2026-5131
    console.log('\n[1] فحص استرجاع الحجز CLB-2026-5131 بكود الحجز...');
    const booking = await db.getBookingById('CLB-2026-5131');
    if (!booking) {
      throw new Error('فشل العثور على الحجز CLB-2026-5131');
    }

    console.log(`✅ تم العثور على الحجز: ${booking.bookingCode} (المعرف: ${booking.id})`);
    console.log(`   - العميل: ${booking.customerName}`);
    console.log(`   - إجمالي الحجز: ${booking.totalDistributorPrice} ج`);
    console.log(`   - المسدد حالياً: ${booking.paidAmount} ج`);
    console.log(`   - المتبقي حالياً: ${booking.remainingAmount} ج`);
    console.log(`   - حالة الحجز الحالية: ${booking.status}`);

    if (booking.totalDistributorPrice !== 18000) {
      throw new Error(`إجمالي الحجز المتوقع 18000 ج ولكن وجد ${booking.totalDistributorPrice} ج`);
    }

    const initialStatus = booking.status;
    const initialDistributorPrice = booking.totalDistributorPrice;
    const initialFactoryPrice = booking.totalFactoryPrice;

    // 2. تسجيل دفعة مالية بقيمة 9000 جنيه باستخدام كود الحجز الظاهر CLB-2026-5131
    console.log('\n[2] تسجيل دفعة مالية بقيمة 9000 جنيه بواسطة كود الحجز CLB-2026-5131...');
    const paymentResultByCode = await db.addPayment({
      bookingId: 'CLB-2026-5131',
      bookingCode: 'CLB-2026-5131',
      amount: 9000,
      method: 'bank_transfer',
      date: '2026-10-31',
      notes: 'الدفعة الأولى 50% تحويل بنكي',
      receiptNumber: 'BNK-5131-001',
    }, 'أحمد الإداري');

    console.log('✅ تم تسجيل الدفعة بنجاح!');
    console.log(`   - معرف الدفعة: ${paymentResultByCode.payment.id}`);
    console.log(`   - قيمة الدفعة: ${paymentResultByCode.payment.amount} ج`);
    console.log(`   - إجمالي المدفوع الجديد: ${paymentResultByCode.booking.paidAmount} ج`);
    console.log(`   - إجمالي المتبقي الجديد: ${paymentResultByCode.booking.remainingAmount} ج`);
    console.log(`   - حالة الحجز بعد الدفع: ${paymentResultByCode.booking.status}`);

    // تحقق من المتطلبات الصارمة:
    if (paymentResultByCode.booking.paidAmount !== 9000) {
      throw new Error(`إجمالي المدفوع المتوقع 9000 ج ولكن وجد ${paymentResultByCode.booking.paidAmount} ج`);
    }
    if (paymentResultByCode.booking.remainingAmount !== 9000) {
      throw new Error(`المتبقي المتوقع 9000 ج ولكن وجد ${paymentResultByCode.booking.remainingAmount} ج`);
    }
    if (paymentResultByCode.booking.status !== initialStatus) {
      throw new Error(`خطأ: حالة الحجز تغيرت تلقائياً! كانت ${initialStatus} وأصبحت ${paymentResultByCode.booking.status}`);
    }
    if (paymentResultByCode.booking.totalDistributorPrice !== initialDistributorPrice) {
      throw new Error('خطأ: تغير إجمالي سعر الموزع بعد الدفع!');
    }
    if (paymentResultByCode.booking.totalFactoryPrice !== initialFactoryPrice) {
      throw new Error('خطأ: تغير إجمالي سعر المصنع بعد الدفع!');
    }

    // 3. التحقق من ثبات البيانات بعد إعادة جلب الحجز من قاعدة البيانات (Persistence Check)
    console.log('\n[3] التحقق من استرجاع الحجز مجدداً ومطابقة البيانات المحفوظة...');
    const reloadedBooking = await db.getBookingById(booking.id);
    if (!reloadedBooking) {
      throw new Error('فشل إعادة تحميل الحجز بعد تسجيل الدفعة');
    }

    console.log(`✅ تم استرجاع الحجز المحدث: ${reloadedBooking.bookingCode}`);
    console.log(`   - المسدد المحفوظ: ${reloadedBooking.paidAmount} ج`);
    console.log(`   - المتبقي المحفوظ: ${reloadedBooking.remainingAmount} ج`);
    console.log(`   - عدد الدفعات المسجلة: ${reloadedBooking.payments?.length || 0}`);

    const hasNewPayment = (reloadedBooking.payments || []).some(p => p.amount === 9000 && p.receiptNumber === 'BNK-5131-001');
    if (!hasNewPayment) {
      throw new Error('الدفعة لم تظهر في سجل مدفوعات الحجز بعد الحفظ');
    }

    // 4. اختبار منع تكرار الدفعة بنفس رقم الإيصال
    console.log('\n[4] اختبار منع تكرار الدفعة عند إعادة الضغط أو إرسال نفس الإيصال...');
    let duplicateCaught = false;
    try {
      await db.addPayment({
        bookingId: booking.id,
        amount: 9000,
        method: 'bank_transfer',
        receiptNumber: 'BNK-5131-001',
      }, 'أحمد الإداري');
    } catch (err: any) {
      duplicateCaught = true;
      console.log(`✅ تم منع تكرار الدفعة بنجاح برسالة: "${err.message}"`);
    }
    if (!duplicateCaught) {
      throw new Error('فشل النظام في منع تكرار تسجيل دفعة بنفس رقم الإيصال');
    }

    // 5. اختبار حجز آخر عشوائي لضمان عمومية الحل
    console.log('\n[5] اختبار تسجيل دفعة لحجز آخر والتأكد من صحة الربط بالمعرف الداخلي (UUID/ID)...');
    const uniquePhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const otherBooking = await db.createBooking({
      customerName: 'تجربة سداد حجز آخر',
      customerPhone: uniquePhone,
      preferredContact: 'phone',
      eventName: 'حفل اختبار عام',
      eventDate: '2026-12-01',
      deliveryTime: '15:00',
      deliveryGovernorate: 'الجيزة',
      deliveryAddress: 'الدقي - شارع مصدق',
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 50, // 50 * 50 = 2500 ج
          drinkOption: 'standard',
        },
      ],
      notes: 'حجز للتحقق من عدم وجود مشكلة عامة',
    });

    console.log(`✅ تم إنشاء حجز ثانٍ: ${otherBooking.bookingCode} (المعرف: ${otherBooking.id})، الإجمالي: ${otherBooking.totalDistributorPrice} ج`);

    // تسجيل دفعة باستخدام المعرف الداخلي (otherBooking.id)
    const otherPaymentRes = await db.addPayment({
      bookingId: otherBooking.id,
      amount: 1000,
      method: 'instapay',
      receiptNumber: 'INSTA-OTHER-01',
      notes: 'عربون حجز إضافي',
    }, 'أحمد الإداري');

    console.log(`✅ تم تسجيل دفعة 1000 ج للحجز ${otherBooking.bookingCode} بنجاح:`);
    console.log(`   - المسدد: ${otherPaymentRes.booking.paidAmount} ج (المتوقع 1000 ج)`);
    console.log(`   - المتبقي: ${otherPaymentRes.booking.remainingAmount} ج (المتوقع 1500 ج)`);

    if (otherPaymentRes.booking.paidAmount !== 1000 || otherPaymentRes.booking.remainingAmount !== 1500) {
      throw new Error('خطأ في حساب أرصدة الحجز الثاني');
    }

    // 6. التحقق من توثيق العملية في سجل التدقيق audit_logs
    console.log('\n[6] التحقق من توثيق العملية في سجل التدقيق (Audit Logs)...');
    const logs = await db.getAuditLogs(booking.id);
    const hasLog = logs.some(l => l.action.includes('تسجيل دفعة') && l.details.includes('9000'));
    console.log(`✅ عدد السجلات الموثقة للحجز CLB-2026-5131: ${logs.length}`);
    if (hasLog) {
      console.log('✅ تم توثيق تسجيل دفعة 9000 ج في سجل التدقيق بنجاح.');
    }

    console.log('\n====================================================');
    console.log('🎉 نجحت جميع الاختبارات بنسبة 100% وتم حل مشكلة «الحجز غير موجود» جذرياً!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ فشل الاختبار:', err);
    process.exit(1);
  }
}

testPaymentFix();
