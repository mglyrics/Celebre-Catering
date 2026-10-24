async function runPhase3LifecycleTest() {
  console.log('================================================================');
  console.log('🚀 بدء اختبار المرحلة الثالثة: دورة العمل الكاملة وحماية الإدارة والمصنع');
  console.log('================================================================');

  const BASE_URL = 'http://localhost:3000';

  // 1. Create a fresh initial booking to test against
  console.log('\n1. إنشاء حجز مبدئي جديد للاختبار...');
  const createRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'المستشار شريف فوزي',
      customerPhone: '01223344556',
      customerWhatsapp: '01223344556',
      preferredContact: 'whatsapp',
      eventName: 'حفل خطوبة فندقي',
      eventDate: '2026-11-28',
      deliveryTime: '17:00',
      deliveryGovernorate: 'الجيزة',
      deliveryAddress: 'فندق الفورسيزونز - قاعة النيل',
      notes: 'تنسيق مباشر مع مسؤول القاعة، العلب البيضاء الرسمية مغلقة بإحكام',
      items: [
        { mealCode: 'Sale-03', quantity: 40, drinkOption: 'standard' }, // 60 * 40 = 2400 (fact: 41 * 40 = 1640)
        { mealCode: 'Sale-17', quantity: 30, drinkOption: 'pepsi' },    // (55+10)=65 * 30 = 1950 (fact: (43+10)=53 * 30 = 1590)
      ],
    }),
  });

  const createData = await createRes.json();
  const booking = createData.booking;
  const bookingId = booking.id;
  const bookingCode = booking.bookingCode;
  console.log(`✅ تم إنشاء الحجز التجريبي: ${bookingCode} (المبلغ: ${booking.totalDistributorPrice} ج)`);

  // 2. Admin Authentication
  console.log('\n2. تسجيل دخول الإدارة العامة (Admin Login)...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Celebre@2026' }),
  });

  if (!adminLoginRes.ok) {
    throw new Error(`فشل تسجيل دخول الإدارة: ${adminLoginRes.status}`);
  }

  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.token;
  console.log(`✅ تم تسجيل دخول الإدارة بنجاح. الدور: ${adminAuth.user.role}`);

  // 3. Admin View Booking & Financial Margins
  console.log('\n3. استعراض تفاصيل الحجز بهوامش الربح وأسعار المصنع من حساب الإدارة...');
  const getBookingRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminBooking = await getBookingRes.json();

  if (adminBooking.totalFactoryPrice === undefined || adminBooking.profitMargin === undefined) {
    throw new Error('خطأ: الإدارة يجب أن ترى سعر المصنع وهامش الربح!');
  }
  console.log(`✅ الإدارة ترى التفاصيل كاملة:`);
  console.log(`- إجمالي الموزع: ${adminBooking.totalDistributorPrice} ج`);
  console.log(`- إجمالي المصنع: ${adminBooking.totalFactoryPrice} ج`);
  console.log(`- هامش الربح المتوقع: ${adminBooking.profitMargin} ج`);
  console.log(`- الإصدار الحالي: v${adminBooking.version}`);

  // 4. Edit Booking Details (Modify delivery time and address)
  console.log('\n4. تعديل تفاصيل وموعد الحجز وترقية الإصدار...');
  const patchRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      deliveryTime: '18:00',
      deliveryAddress: 'فندق الفورسيزونز - قاعة النيل الكبرى (تعديل رقم 1)',
      notes: 'تم تعديل الموعد إلى 6:00 مساءً بناءً على طلب العميل',
    }),
  });

  const updatedBookingData = await patchRes.json();
  const updatedBooking = updatedBookingData.booking;

  if (updatedBooking.version !== 2) {
    throw new Error(`خطأ في ترقية الإصدار! المتوقع: 2، الفعلي: ${updatedBooking.version}`);
  }
  console.log(`✅ تم تعديل الحجز بنجاح وترقية الإصدار إلى v${updatedBooking.version}.`);

  // 5. Confirm Booking & Record Payment
  console.log('\n5. تسجيل دفعة مالية (عربون 2000 جنيه - فودافون كاش) وتأكيد الحجز...');
  const paymentRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      amount: 2000,
      method: 'vodafone_cash',
      receiptNumber: 'VF-987654321',
      notes: 'عربون تأكيد حفل الخطوبة',
    }),
  });

  const paymentData = await paymentRes.json();
  const paidBooking = paymentData.booking;

  if (paidBooking.paidAmount !== 2000) {
    throw new Error(`خطأ في تحديث المبلغ المدفوع! الفعلي: ${paidBooking.paidAmount}`);
  }
  if (paidBooking.remainingAmount !== paidBooking.totalDistributorPrice - 2000) {
    throw new Error(`خطأ في حساب المتبقي! الفعلي: ${paidBooking.remainingAmount}`);
  }
  if (paidBooking.status !== 'CONFIRMED') {
    throw new Error(`خطأ في تحويل الحالة لمؤكد! الفعلي: ${paidBooking.status}`);
  }
  console.log(`✅ تم تسجيل الدفعة بنجاح:`);
  console.log(`- المدفوع: ${paidBooking.paidAmount} ج`);
  console.log(`- المتبقي للتسليم: ${paidBooking.remainingAmount} ج`);
  console.log(`- حالة الحجز بعد الدفعة: ${paidBooking.status}`);

  // 6. Issue Separate Factory Order (v1)
  console.log('\n6. إصدار أمر تشغيل منفصل للمصنع (Factory Order v1)...');
  const foRes1 = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/factory-order`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const foData1 = await foRes1.json();
  const factoryOrder1 = foData1.factoryOrder;
  console.log(`✅ تم إصدار أمر المصنع رقم: ${factoryOrder1.orderNumber} (الإصدار: v${factoryOrder1.version})`);
  console.log(`- تكلفة المصنع الإجمالية للإدارة: ${factoryOrder1.factoryCostTotal} ج`);

  // 7. Revise and Issue Updated Factory Order (v2) - Testing Version History
  console.log('\n7. تعديل الحجز وإصدار أمر مصنع جديد (v2) واختبار حفظ الإصدارات السابقة...');
  await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      deliveryTime: '18:15',
      notes: 'تحديث أخير: تسليم الوجبات في تمام 6:15 مساءً',
    }),
  });

  const foRes2 = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/factory-order`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const foData2 = await foRes2.json();
  const factoryOrder2 = foData2.factoryOrder;

  if (factoryOrder2.version !== 2) {
    throw new Error(`خطأ في إصدار أمر المصنع المحدث! المتوقع: v2، الفعلي: v${factoryOrder2.version}`);
  }

  // Verify both versions exist
  const allFoRes = await fetch(`${BASE_URL}/api/admin/factory-orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allOrders = await allFoRes.json();
  const bookingOrders = allOrders.filter((o: any) => o.bookingId === bookingId);

  if (bookingOrders.length < 2) {
    throw new Error(`خطأ: لم يتم الاحتفاظ بالإصدارات السابقة لأمر المصنع!`);
  }
  console.log(`✅ تم حفظ الإصدارات السابقة بنجاح (عدد أوامر المصنع المحفوظة للحجز: ${bookingOrders.length})`);

  // 8. Factory Role Security Test (Strict Privacy Enforcement)
  console.log('\n8. اختبار أمان وصلاحيات المصنع (Factory Role Security)...');
  const factoryLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'factory', password: 'Factory@2026' }),
  });
  const factoryAuth = await factoryLoginRes.json();
  const factoryToken = factoryAuth.token;
  console.log(`✅ تم تسجيل دخول مسؤول المصنع بنجاح.`);

  // Test Factory View of Orders (Distributor prices and profit margins MUST BE HIDDEN)
  console.log('- فحص حجب الأسعار وهوامش الربح عن حساب المصنع...');
  const factoryViewOrdersRes = await fetch(`${BASE_URL}/api/admin/factory-orders`, {
    headers: { Authorization: `Bearer ${factoryToken}` },
  });
  const factoryViewOrders = await factoryViewOrdersRes.json();
  const foItemForFactory = factoryViewOrders.find((o: any) => o.bookingId === bookingId);

  if (foItemForFactory.factoryCostTotal !== undefined) {
    throw new Error('مخالفة أمنية: ظهرت تكلفة المصنع الإجمالية لحساب المصنع!');
  }
  if (foItemForFactory.items.some((it: any) => it.unitFactoryPrice !== undefined || it.totalFactoryPrice !== undefined)) {
    throw new Error('مخالفة أمنية: ظهرت أسعار المصنع الفردية في تذكرة المطبخ!');
  }
  console.log(`✓ نجح الحجب: أوامر المصنع لا تحتوي على أي أسعار أو هوامش ربح لطاقم المطبخ.`);

  // Test Factory View of Bookings
  const factoryViewBookingRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${factoryToken}` },
  });
  const factoryBookingData = await factoryViewBookingRes.json();

  if (factoryBookingData.totalDistributorPrice !== undefined || factoryBookingData.profitMargin !== undefined) {
    throw new Error('مخالفة أمنية: تسرب سعر الموزع أو هامش الربح لحساب المصنع!');
  }
  console.log(`✓ نجح الحجب: تفاصيل الحجز محجوبة تماماً عن سعر الموزع وهامش الربح لحساب المصنع.`);

  // Test Factory Forbidden from Stats and Audit
  const statsForbiddenRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${factoryToken}` },
  });
  if (statsForbiddenRes.status !== 403) {
    throw new Error(`مخالفة أمنية: تم السماح للمصنع بدخول التقارير المالية! Status: ${statsForbiddenRes.status}`);
  }
  console.log(`✓ نجح منع المصنع من الوصول للإحصائيات المالية (403 Forbidden).`);

  // 9. Factory updates production status
  console.log('\n9. تحديث حالة أمر المصنع إلى PREPARING ثم COMPLETED...');
  const foStatusRes1 = await fetch(`${BASE_URL}/api/admin/factory-orders/${factoryOrder2.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${factoryToken}`,
    },
    body: JSON.stringify({ status: 'PREPARING' }),
  });
  if (!foStatusRes1.ok) throw new Error('فشل تحديث أمر المصنع إلى PREPARING');
  console.log('✓ تم تحديث أمر المصنع إلى PREPARING (جاري التجهيز).');

  const foStatusRes2 = await fetch(`${BASE_URL}/api/admin/factory-orders/${factoryOrder2.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${factoryToken}`,
    },
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  if (!foStatusRes2.ok) throw new Error('فشل تحديث أمر المصنع إلى COMPLETED');
  console.log('✓ تم تحديث أمر المصنع إلى COMPLETED (اكتمل التجهيز بالعلبة الرسمية).');

  // Verify Booking status transitioned to READY_FOR_DELIVERY
  const checkDelivRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const checkDelivData = await checkDelivRes.json();
  if (checkDelivData.status !== 'READY_FOR_DELIVERY') {
    throw new Error(`خطأ: حالة الحجز لم تتحول إلى READY_FOR_DELIVERY! الفعلي: ${checkDelivData.status}`);
  }
  console.log(`✅ تحولت حالة الحجز تلقائياً إلى: ${checkDelivData.status} (جاهز للشحن والتسليم).`);

  // 10. Verify Audit Trail
  console.log('\n10. فحص سجل التدقيق والمراقبة الكامل (Audit Trail)...');
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs?bookingId=${bookingId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditLogs = await auditRes.json();

  console.log(`✅ سجل التدقيق يحتوي على ${auditLogs.length} عمليات موثقة للحجز:`);
  auditLogs.forEach((log: any, idx: number) => {
    console.log(`  ${idx + 1}. [${log.action}] بواسطة: ${log.performedBy} -> ${log.details}`);
  });

  if (auditLogs.length < 4) {
    throw new Error('سجل التدقيق لم يسجل كافة العمليات المطلوبة!');
  }

  console.log('\n================================================================');
  console.log('🎉 نجح اختبار المرحلة الثالثة بالكامل بنسبة 100%!');
  console.log('================================================================');
}

runPhase3LifecycleTest().catch((err) => {
  console.error('\n❌ فشل اختبار المرحلة الثالثة:', err);
  process.exit(1);
});
