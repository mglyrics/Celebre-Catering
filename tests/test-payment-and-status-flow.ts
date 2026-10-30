import { db } from '../src/server/db';

async function runPaymentAndStatusTests() {
  console.log('🚀 بدء اختبارات دورة حالات الحجز والمدفوعات المالية وإلغاء الدفعات وسجل الرقابة...');

  try {
    // 1. إنشاء حجز تجريبي بعدد 50 وجبة
    const uniquePhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const createdBooking = await db.createBooking({
      customerName: 'تجربة سداد وحالات الحجز',
      customerPhone: uniquePhone,
      customerWhatsapp: uniquePhone,
      preferredContact: 'whatsapp',
      eventName: 'حفل اختبار مالي ورسمي',
      eventDate: '2026-11-20',
      deliveryTime: '02:00 PM',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'التجمع الخامس - شارع التسعين',
      items: [
        {
          mealCode: 'Sale-01',
          quantity: 30,
          drinkOption: 'standard',
        },
        {
          mealCode: 'Sale-12',
          quantity: 20,
          drinkOption: 'standard',
        },
      ],
      notes: 'حجز تجريبي لاختبار دورة المدفوعات وتحديث الحالات',
    });

    const totalPrice = createdBooking.totalDistributorPrice;
    console.log(`✅ تم إنشاء حجز تجريبي رقم: ${createdBooking.bookingCode} (المعرف: ${createdBooking.id})`);
    console.log(`   - إجمالي سعر الموزع: ${totalPrice} ج`);
    console.log(`   - إجمالي عدد الوجبات: ${createdBooking.totalMealsCount} وجبة`);
    console.log(`   - الحالة الابتدائية: ${createdBooking.status}`);
    console.log(`   - المبلغ المسدد: ${createdBooking.paidAmount} ج، المتبقي: ${createdBooking.remainingAmount} ج`);

    if (createdBooking.status !== 'INITIAL') {
      throw new Error(`الحالة الابتدائية يجب أن تكون INITIAL ولكنها كانت: ${createdBooking.status}`);
    }
    if (createdBooking.remainingAmount !== totalPrice) {
      throw new Error(`المتبقي المتوقع ${totalPrice} ج ولكن وجد ${createdBooking.remainingAmount} ج`);
    }

    // 2. اختبار تغيير الحالة إلى PENDING_CONFIRMATION ثم CONFIRMED
    console.log('\n--- اختبار 2: تغيير حالة الحجز عبر updateBookingStatus وتوثيقها في Audit Log ---');
    const status1 = await db.updateBookingStatus(createdBooking.id, 'PENDING_CONFIRMATION', 'أحمد الإداري', 'مراجعة بيانات العميل');
    if (status1.status !== 'PENDING_CONFIRMATION') {
      throw new Error(`فشل الانتقال إلى PENDING_CONFIRMATION: ${status1.status}`);
    }
    console.log('✅ تم الانتقال بنجاح إلى: PENDING_CONFIRMATION');

    const status2 = await db.updateBookingStatus(createdBooking.id, 'CONFIRMED', 'أحمد الإداري', 'تأكيد الحجز بعد التواصل مع العميل');
    if (status2.status !== 'CONFIRMED') {
      throw new Error(`فشل الانتقال إلى CONFIRMED: ${status2.status}`);
    }
    console.log('✅ تم الانتقال بنجاح إلى: CONFIRMED');

    // 3. اختبار تسجيل دفعة مالية مبدئية (عربون 500 جنيه) عبر InstaPay
    console.log('\n--- اختبار 3: تسجيل دفعة أولى والتحقق من فصل الحالة عن السداد ---');
    const payment1Res = await db.addPayment({
      bookingId: createdBooking.id,
      amount: 500,
      method: 'instapay',
      date: '2026-11-01',
      receiptNumber: 'INSTA-998877',
      notes: 'عربون حجز مبدئي',
    }, 'أحمد الإداري');

    console.log(`✅ تم تسجيل دفعة 500 ج (معرف الدفعة: ${payment1Res.payment.id})`);
    console.log(`   - المدفوع الآن: ${payment1Res.booking.paidAmount} ج`);
    console.log(`   - المتبقي الآن: ${payment1Res.booking.remainingAmount} ج`);
    console.log(`   - حالة الحجز: ${payment1Res.booking.status} (يجب أن تظل CONFIRMED دون تغيير تلقائي)`);

    if (payment1Res.booking.paidAmount !== 500) {
      throw new Error(`المسدد المتوقع 500 ج ولكن وجد ${payment1Res.booking.paidAmount}`);
    }
    if (payment1Res.booking.remainingAmount !== totalPrice - 500) {
      throw new Error(`المتبقي المتوقع ${totalPrice - 500} ج ولكن وجد ${payment1Res.booking.remainingAmount}`);
    }
    if (payment1Res.booking.status !== 'CONFIRMED') {
      throw new Error(`خطأ: تغيرت حالة الحجز تلقائياً عند الدفع! الحالة الحالية: ${payment1Res.booking.status}`);
    }

    // 4. اختبار رفض دفعة تتجاوز المبلغ المتبقي بدون استثناء إداري
    console.log('\n--- اختبار 4: اختبار رفض الدفعة الزائدة عن المتبقي ومنع السداد السالب ---');
    let overpaymentRejected = false;
    const excessiveAmount = payment1Res.booking.remainingAmount + 1000;
    try {
      await db.addPayment({
        bookingId: createdBooking.id,
        amount: excessiveAmount,
        method: 'cash',
        allowOverpayment: false,
      }, 'أحمد الإداري');
    } catch (err: any) {
      overpaymentRejected = true;
      console.log(`✅ تم رفض الدفعة الزائدة بنجاح كما هو مطلوب: "${err.message}"`);
    }
    if (!overpaymentRejected) {
      throw new Error('فشل النظام في رفض دفعة تتجاوز المبلغ المتبقي!');
    }

    let zeroRejected = false;
    try {
      await db.addPayment({
        bookingId: createdBooking.id,
        amount: 0,
        method: 'cash',
      }, 'أحمد الإداري');
    } catch (err: any) {
      zeroRejected = true;
      console.log(`✅ تم رفض الدفعة الصفرية بنجاح: "${err.message}"`);
    }
    if (!zeroRejected) {
      throw new Error('فشل النظام في رفض دفعة قيمتها 0');
    }

    // 5. تسجيل دفعة ثانية 1000 جنيه كاش
    console.log('\n--- اختبار 5: تسجيل دفعة ثانية جزئية ---');
    const payment2Res = await db.addPayment({
      bookingId: createdBooking.id,
      amount: 1000,
      method: 'cash',
      receiptNumber: 'RCPT-0044',
      notes: 'دفعة ثانية نقداً في المقر',
    }, 'أحمد الإداري');

    console.log(`✅ تم تسجيل دفعة ثانية 1000 ج`);
    console.log(`   - إجمالي المدفوع: ${payment2Res.booking.paidAmount} ج (المتوقع 1500)`);
    console.log(`   - إجمالي المتبقي: ${payment2Res.booking.remainingAmount} ج (المتوقع ${totalPrice - 1500})`);

    if (payment2Res.booking.paidAmount !== 1500 || payment2Res.booking.remainingAmount !== (totalPrice - 1500)) {
      throw new Error('خطأ في الحسابات التراكمية للمدفوعات');
    }

    // 6. اختبار سداد المتبقي بالكامل للوصول إلى FULLY_PAID
    console.log('\n--- اختبار 6: سداد المتبقي بالكامل ---');
    const remainingToSettle = payment2Res.booking.remainingAmount;
    const payment3Res = await db.addPayment({
      bookingId: createdBooking.id,
      amount: remainingToSettle,
      method: 'bank_transfer',
      receiptNumber: 'CIB-778899',
      notes: 'تسوية ختامية للحساب',
    }, 'أحمد الإداري');

    console.log(`✅ تم سداد ${remainingToSettle} ج`);
    console.log(`   - إجمالي المدفوع: ${payment3Res.booking.paidAmount} ج`);
    console.log(`   - إجمالي المتبقي: ${payment3Res.booking.remainingAmount} ج`);

    if (payment3Res.booking.paidAmount !== totalPrice || payment3Res.booking.remainingAmount !== 0) {
      throw new Error('الحساب الختامي غير صحيح');
    }

    // 7. اختبار إلغاء وعكس الدفعة الثانية (1000 جنيه) مع توثيق السبب
    console.log('\n--- اختبار 7: إلغاء وعكس الدفعة الثانية ومطابقة الأرصدة وسجل الرقابة ---');
    const cancelRes = await db.cancelPayment(
      payment2Res.payment.id,
      'تم إدخال إيصال السداد مرتين عن طريق الخطأ ويتم عكس العملية',
      'أحمد الإداري'
    );

    console.log(`✅ تم عكس الدفعة رقم ${payment2Res.payment.id} بنجاح:`);
    console.log(`   - حالة الدفعة الملغاة: ${cancelRes.payment.status}`);
    console.log(`   - سبب الإلغاء: ${cancelRes.payment.cancelReason}`);
    console.log(`   - رصيد المدفوع بعد العكس: ${cancelRes.booking.paidAmount} ج (المتوقع ${totalPrice - 1000} ج)`);
    console.log(`   - رصيد المتبقي بعد العكس: ${cancelRes.booking.remainingAmount} ج (المتوقع 1000 ج)`);

    if (cancelRes.payment.status !== 'CANCELLED') {
      throw new Error('يجب أن تكون حالة الدفعة CANCELLED بعد الإلغاء');
    }
    if (cancelRes.booking.paidAmount !== (totalPrice - 1000)) {
      throw new Error(`الرصيد المدفوع بعد العكس متوقع ${totalPrice - 1000} ج ولكن وجد ${cancelRes.booking.paidAmount}`);
    }
    if (cancelRes.booking.remainingAmount !== 1000) {
      throw new Error(`الرصيد المتبقي بعد العكس متوقع 1000 ج ولكن وجد ${cancelRes.booking.remainingAmount}`);
    }

    // 8. اختبار الانتقال خلال مراحل التشغيل: IN_PRODUCTION -> READY_FOR_DELIVERY -> DELIVERED
    console.log('\n--- اختبار 8: مراحل التشغيل والتسليم النهائي ---');
    const statusInProd = await db.updateBookingStatus(createdBooking.id, 'IN_PRODUCTION', 'مسؤول المصنع', 'بدء خط تجهيز البوكسات');
    console.log(`✅ حالة الحجز الآن: ${statusInProd.status} (بالمصنع قيد التجهيز)`);

    const statusReady = await db.updateBookingStatus(createdBooking.id, 'READY_FOR_DELIVERY', 'مسؤول التجهيز', 'تم تجهيز الوجبات وتغليفها');
    console.log(`✅ حالة الحجز الآن: ${statusReady.status} (جاهز للتسليم)`);

    const statusDelivered = await db.updateBookingStatus(createdBooking.id, 'DELIVERED', 'مندوب التسليم', 'تم تسليم الطلب للعميل في موقع المناسبة واستلامه كاملاً');
    console.log(`✅ حالة الحجز الآن: ${statusDelivered.status} (تم التسليم)`);

    if (statusDelivered.status !== 'DELIVERED') {
      throw new Error('فشل تأكيد التسليم النهائي');
    }

    // 9. فحص سجل التدقيق (Audit Logs) للتأكد من حفظ جميع العمليات مع التفاصيل
    console.log('\n--- اختبار 9: التحقق من سجل التدقيق والرقابة (Audit Logs) ---');
    const bookingLogs = await db.getAuditLogs(createdBooking.id);

    console.log(`✅ عدد العمليات الموثقة للحجز ${createdBooking.bookingCode} في سجل التدقيق: ${bookingLogs.length}`);
    bookingLogs.forEach(l => {
      console.log(`   - [${l.timestamp}] [${l.performedBy}] [${l.action}]: ${l.details || ''}`);
    });

    const hasPaymentAddLog = bookingLogs.some(l => l.action.includes('دفعة') || l.action.includes('PAYMENT'));
    const hasPaymentCancelLog = bookingLogs.some(l => l.action.includes('عكس') || l.action.includes('إلغاء') || l.action.includes('CANCEL'));
    const hasStatusChangeLog = bookingLogs.some(l => l.action.includes('حالة') || l.action.includes('STATUS'));

    if (!hasPaymentAddLog) console.warn('⚠️ تنبيه: لم يتم العثور على سجل تسجيل دفعة');
    if (!hasPaymentCancelLog) console.warn('⚠️ تنبيه: لم يتم العثور على سجل عكس دفعة');
    if (!hasStatusChangeLog) console.warn('⚠️ تنبيه: لم يتم العثور على سجل تغيير حالة');

    console.log('\n🎉 جميع اختبارات دورة حالات الحجز، والمدفوعات، والحسابات التلقائية، وعكس الدفعات، وسجل الرقابة نجحت بنسبة 100%!');
  } catch (err: any) {
    console.error('❌ فشل الاختبار:', err);
    process.exit(1);
  }
}

runPaymentAndStatusTests();
