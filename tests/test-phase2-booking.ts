async function runPhase2Test() {
  console.log('====================================================');
  console.log('🚀 بدء اختبار المرحلة الثانية: الحجز المبدئي متعدد الأصناف');
  console.log('====================================================');

  const bookingPayload = {
    customerName: '[اختبار معزول] حجز تجريبي مرحلة 2',
    customerPhone: '01000000002',
    customerWhatsapp: '01000000002',
    preferredContact: 'whatsapp',
    eventName: 'حفل تجريبي مرحلة 2',
    eventDate: '2026-12-20',
    deliveryTime: '18:30',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مدينة نصر - قاعة تجريبية',
    notes: 'حجز تجريبي مستقل لاختبار المرحلة الثانية',
    isTest: true,
    items: [
      {
        mealCode: 'Sale-01',
        quantity: 50,
        drinkOption: 'standard', // 50 * 50 = 2500
      },
      {
        mealCode: 'Sale-05',
        quantity: 20,
        drinkOption: 'no_juice', // (80 - 5) = 75 * 20 = 1500
      },
      {
        mealCode: 'Sale-14',
        quantity: 30,
        drinkOption: 'pepsi', // (48 + 10) = 58 * 30 = 1740
      },
    ],
  };

  const expectedMealsCount = 50 + 20 + 30; // 100
  const expectedTotalDistributor = 2500 + 1500 + 1740; // 5740

  console.log(`\n1. إرسال الطلب إلى POST /api/bookings...`);
  const postRes = await fetch('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload),
  });

  if (!postRes.ok) {
    const errorData = await postRes.text();
    throw new Error(`فشل إنشاء الحجز: ${postRes.status} ${errorData}`);
  }

  const postData = await postRes.json();
  const booking = postData.booking;

  console.log('✅ تم استلام استجابة الخادم بنجاح:');
  console.log(`- رقم الحجز المولد: ${booking.bookingCode}`);
  console.log(`- رمز التحقق السري: ${booking.securityCode}`);
  console.log(`- الحالة المبدئية: ${booking.status}`);
  console.log(`- إجمالي عدد الوجبات: ${booking.totalMealsCount}`);
  console.log(`- إجمالي سعر الموزع المحسوب بالخادم: ${booking.totalDistributorPrice} ج`);

  // Assertions
  console.log('\n2. التحقق من صحة الحسابات والأمان:');
  
  // Test meals count
  if (booking.totalMealsCount !== expectedMealsCount) {
    throw new Error(`خطأ في حساب عدد الوجبات! المتوقع: ${expectedMealsCount}، الفعلي: ${booking.totalMealsCount}`);
  }
  console.log(`✓ عدد الوجبات صحيح تماماً (${expectedMealsCount} وجبة).`);

  // Test server-authoritative distributor price
  if (booking.totalDistributorPrice !== expectedTotalDistributor) {
    throw new Error(`خطأ في حساب سعر الموزع على الخادم! المتوقع: ${expectedTotalDistributor}، الفعلي: ${booking.totalDistributorPrice}`);
  }
  console.log(`✓ إجمالي سعر الموزع مطابق بدقة للحسابات على الخادم (${expectedTotalDistributor} جنيه مصري).`);

  // Test status is strictly INITIAL or PENDING_CONFIRMATION
  if (booking.status !== 'INITIAL') {
    throw new Error(`الحالة غير صحيحة! يجب أن تكون INITIAL ولكنها: ${booking.status}`);
  }
  console.log(`✓ حالة الحجز هي INITIAL (حجز مبدئي مسجل بدون تأكيد تلقائي).`);

  // Test NO payment was collected
  if (booking.paidAmount !== 0) {
    throw new Error(`مخالفة: تم تسجيل مبالغ مدفوعة بينما يجب أن يكون 0! المدفوع: ${booking.paidAmount}`);
  }
  console.log(`✓ المبالغ المدفوعة = 0 جنيه (لا يتم تحصيل أي أموال على الموقع).`);

  if (booking.remainingAmount !== expectedTotalDistributor) {
    throw new Error(`المبلغ المتبقي غير مطابق لإجمالي الحجز!`);
  }
  console.log(`✓ المبلغ المتبقي = ${booking.remainingAmount} جنيه (كامل القيمة مستحقة للتسليم).`);

  // Test that NO factory order was created
  if (booking.factoryOrders && booking.factoryOrders.length > 0) {
    throw new Error(`مخالفة: تم إنشاء أمر مصنع في مرحلة الحجز المبدئي!`);
  }
  console.log(`✓ لم يتم إنشاء أي طلب مصنع في هذه المرحلة (أمر المصنع يصدر حصرياً من الإدارة لاحقاً).`);

  // Test retrieval via tracking endpoint
  console.log('\n3. اختبار استعلام ومتابعة الحجز عبر GET /api/bookings/track...');
  const trackRes = await fetch(
    `http://localhost:3000/api/bookings/track?code=${booking.bookingCode}&verify=${booking.securityCode}`
  );
  if (!trackRes.ok) {
    throw new Error(`فشل الاستعلام عن الحجز عبر كود التتبع: ${trackRes.status}`);
  }
  const trackData = await trackRes.json();
  const trackedBooking = trackData.booking;

  if (trackedBooking.bookingCode !== booking.bookingCode) {
    throw new Error('كود الحجز المسترجع غير مطابق!');
  }
  console.log(`✓ تم استرجاع الحجز بنجاح عبر كود التتبع ورمز التحقق.`);

  // Test security: public track endpoint MUST NOT leak factory price or profit margin
  if (trackedBooking.totalFactoryPrice !== undefined || trackedBooking.profitMargin !== undefined) {
    throw new Error('مخالفة أمنية: تسرب سعر المصنع أو هامش الربح للواجهة العامة!');
  }
  console.log(`✓ أمان البيانات: سعر المصنع وهامش الربح محجوبان تماماً عن الواجهة العامة والعميل.`);

  // Clean up created test booking using db.deleteTestBooking
  const { db } = await import('../src/server/db');
  await db.deleteTestBooking(booking.id, 'تنظيف حجز اختبار المرحلة 2');
  console.log(`✓ تم تنظيف وحذف الحجز التجريبي ${booking.bookingCode} بأمان.`);

  console.log('\n====================================================');
  console.log('🎉 نجح اختبار المرحلة الثانية بالكامل بنسبة 100%!');
  console.log('====================================================');
}

runPhase2Test().catch((err) => {
  console.error('\n❌ فشل الاختبار:', err);
  process.exit(1);
});
