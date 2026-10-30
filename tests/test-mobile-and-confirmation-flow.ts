import { db } from '../src/server/db.js';

async function runMobileAndConfirmationTest() {
  console.log('================================================================');
  console.log('📱 اختبار شامل: لوحة إدارة الموبايل، تأكيد الحجوزات، وأمر تشغيل المصنع');
  console.log('================================================================');

  const BASE_URL = 'http://localhost:3000';

  // Step 1: Admin Authentication
  console.log('\n[1] تسجيل دخول الإدارة للحصول على التوكن...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Celebre@2026' }),
  });

  if (!loginRes.ok) {
    throw new Error(`فشل تسجيل الدخول: ${loginRes.status}`);
  }
  const { token, user } = await loginRes.json();
  console.log(`✅ تم تسجيل دخول الإدارة بنجاح للمستخدم: ${user.name} (${user.role})`);

  // Step 2: Test that creating a booking with < 50 meals is strictly rejected by the server
  console.log('\n[2] التحقق من رفض الخادم لإنشاء حجز بعدد وجبات 40 (أقل من الحد الأدنى 50)...');
  let creationRejected = false;
  try {
    await db.createBooking({
      customerName: 'تجربة فحص الحد الأدنى',
      customerPhone: '01009988776',
      customerWhatsapp: '01009988776',
      preferredContact: 'whatsapp',
      eventName: 'ورشة عمل تدريبية',
      eventDate: '2026-12-05',
      deliveryTime: '13:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'المعادي - برج النيل 4',
      notes: 'ملاحظات تجريبية للفحص',
      items: [
        { mealCode: 'Sale-01', quantity: 20, drinkOption: 'standard' },
        { mealCode: 'Sale-02', quantity: 20, drinkOption: 'pepsi' },
      ],
    });
  } catch (err: any) {
    if (err.message && err.message.includes('50')) {
      creationRejected = true;
      console.log(`✅ نجح فحص الحد الأدنى عند الإنشاء: تم الرفض برسالة: "${err.message}"`);
    } else {
      throw err;
    }
  }
  if (!creationRejected) {
    throw new Error('❌ خطأ: كان يجب رفض إنشاء حجز أقل من 50 وجبة');
  }

  // Step 3: Create a valid booking with exactly 50 meals
  console.log('\n[3] إنشاء حجز تجريبي بعدد 50 وجبة مستوفٍ للشروط...');
  const validBooking = await db.createBooking({
    customerName: 'تجربة فحص الاعتماد والتأكيد',
    customerPhone: '01009988776',
    customerWhatsapp: '01009988776',
    preferredContact: 'whatsapp',
    eventName: 'مؤتمر سنوي للشركة',
    eventDate: '2026-12-05',
    deliveryTime: '13:30',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'التجمع الخامس - شارع التسعين - مبنى B2',
    notes: 'تأكيد التسليم والتغليف الفاخر',
    items: [
      { mealCode: 'Sale-01', quantity: 25, drinkOption: 'standard' },
      { mealCode: 'Sale-12', quantity: 25, drinkOption: 'pepsi' }, // باتية
    ],
  });
  console.log(`✅ تم إنشاء الحجز التجريبي: ${validBooking.bookingCode} بإجمالي وجبات: ${validBooking.totalMealsCount}`);

  // Step 4: Edit booking to fulfill minimum 50 (e.g., 30 + 25 = 55 meals) without changing status
  console.log('\n[4] تعديل الحجز لرفع الوجبات إلى 55 وجبة دون تغيير حالة INITIAL...');
  const updateRes = await fetch(`${BASE_URL}/api/admin/bookings/${validBooking.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerName: 'تجربة فحص الاعتماد والتأكيد',
      customerPhone: '01009988776',
      customerWhatsapp: '01009988776',
      preferredContact: 'whatsapp',
      eventName: 'مؤتمر سنوي للشركة',
      eventDate: '2026-12-05',
      deliveryTime: '13:30',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'التجمع الخامس - شارع التسعين - مبنى B2',
      status: 'INITIAL',
      notes: 'تأكيد التسليم والتغليف الفاخر',
      items: [
        { mealCode: 'Sale-01', quantity: 30, drinkOption: 'standard' },
        { mealCode: 'Sale-12', quantity: 25, drinkOption: 'pepsi' }, // باتية
      ],
    }),
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok) throw new Error(`فشل تعديل الحجز: ${updateData.error}`);
  console.log(`✅ تم تعديل الحجز بنجاح: إجمالي الوجبات أصبح ${updateData.booking.totalMealsCount} وجبة، الحالة ما زالت: ${updateData.booking.status}`);

  // Step 5: Explicitly Confirm the booking via POST /api/admin/bookings/:id/confirm
  console.log('\n[5] تنفيذ التأكيد الصريح للحجز بواسطة الإداري...');
  const confirmRes = await fetch(`${BASE_URL}/api/admin/bookings/${validBooking.id}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const confirmData = await confirmRes.json();
  if (!confirmRes.ok) throw new Error(`فشل تأكيد الحجز: ${confirmData.error}`);
  if (confirmData.booking.status !== 'CONFIRMED') {
    throw new Error(`❌ خطأ: حالة الحجز بعد التأكيد هي ${confirmData.booking.status} وليست CONFIRMED`);
  }
  console.log(`✅ تم تأكيد الحجز بنجاح: كود ${confirmData.booking.bookingCode} أصبحت حالته: ${confirmData.booking.status}`);

  // Step 6: Generate Factory Work Order via POST /api/admin/bookings/:id/factory-order/whatsapp
  console.log('\n[6] توليد أمر تشغيل المصنع ورسالة واتساب المخصصة للمصنع...');
  const factoryOrderRes = await fetch(`${BASE_URL}/api/admin/bookings/${validBooking.id}/factory-order/whatsapp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kitchenInstructions: 'تغليف خاص ومحكم، التسليم قبل الموعد بـ 30 دقيقة',
    }),
  });
  const factoryOrderData = await factoryOrderRes.json();
  if (!factoryOrderRes.ok) throw new Error(`فشل إنشاء أمر تشغيل المصنع: ${factoryOrderData.error}`);

  const factoryOrder = factoryOrderData.factoryOrder;
  const whatsappMsg = factoryOrderData.messageText;
  console.log(`✅ تم إنشاء أمر تشغيل المصنع: ${factoryOrder.orderNumber}`);
  console.log(`   إجمالي أمر المصنع بأسعار المصنع: ${factoryOrder.factoryCostTotal} ج`);

  // Step 7: Strictly verify confidentiality and presence of the 10 required items
  console.log('\n[7] التحقق الأمني من سرية الأسعار ومحتويات رسالة واتساب المصنع...');
  
  // 1. Booking code
  if (!whatsappMsg.includes(validBooking.bookingCode)) throw new Error('رسالة الواتساب لا تحتوي على كود الحجز');
  // 2. Customer name & phone
  if (!whatsappMsg.includes('تجربة فحص الاعتماد والتأكيد')) throw new Error('رسالة الواتساب لا تحتوي على اسم العميل');
  if (!whatsappMsg.includes('01009988776')) throw new Error('رسالة الواتساب لا تحتوي على هاتف العميل');
  // 3. Delivery date & time
  if (!whatsappMsg.includes('2026-12-05')) throw new Error('رسالة الواتساب لا تحتوي على تاريخ التسليم');
  if (!whatsappMsg.includes('13:30')) throw new Error('رسالة الواتساب لا تحتوي على وقت التسليم');
  // 4. Delivery address
  if (!whatsappMsg.includes('التجمع الخامس')) throw new Error('رسالة الواتساب لا تحتوي على عنوان التسليم');
  // 5. Meals names & codes
  if (!whatsappMsg.includes('Sale-01') || !whatsappMsg.includes('Sale-12') || !whatsappMsg.includes('باتية')) {
    throw new Error('رسالة الواتساب لا تحتوي على أكواد وأسماء الوجبات المعتمدة بدقة (باتية)');
  }
  // 6. Quantities
  if (!whatsappMsg.includes('30') || !whatsappMsg.includes('25')) throw new Error('رسالة الواتساب لا تحتوي على الكميات المطلوبة');
  // 7. Kitchen notes
  if (!whatsappMsg.includes('تغليف خاص ومحكم')) throw new Error('رسالة الواتساب لا تحتوي على تعليمات المطبخ');
  // 8. Factory total
  const hasCost = whatsappMsg.includes(String(factoryOrder.factoryCostTotal)) ||
                  whatsappMsg.includes(factoryOrder.factoryCostTotal?.toLocaleString('ar-EG'));
  if (!hasCost) throw new Error('رسالة الواتساب لا تحتوي على إجمالي المصنع');

  // STRICT CONFIDENTIALITY CHECK:
  // Must NOT contain distributor price of the booking (distributor total was calculated for 30*Sale-01 + 25*Sale-12)
  const distributorTotalStr = `${updateData.booking.totalDistributorPrice} ج`;
  if (whatsappMsg.includes(distributorTotalStr)) {
    throw new Error('❌ خرق أمني: ظهر إجمالي سعر الموزع في رسالة المصنع!');
  }
  if (whatsappMsg.toLowerCase().includes('profit') || whatsappMsg.includes('هامش الربح') || whatsappMsg.includes('سعر الموزع')) {
    throw new Error('❌ خرق أمني: ظهرت عبارات أرباح أو أسعار موزع في رسالة المصنع!');
  }
  console.log('🔒 فحص السرية نجح 100%: لا يوجد أي ذكر لأسعار الموزع أو هامش الربح في رسالة المصنع.');

  // Step 8: Manual Confirmation of Factory WhatsApp Dispatch
  console.log('\n[8] تأكيد إرسال أمر التشغيل للمصنع يدويًا لتسجيل وقت الإرسال واسم الإداري...');
  const confirmSentRes = await fetch(`${BASE_URL}/api/admin/factory-orders/${factoryOrder.id}/confirm-sent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      manualNotes: 'تم الإرسال عبر واتساب إلى مدير تشغيل المصنع الشيف كمال',
    }),
  });
  const confirmSentData = await confirmSentRes.json();
  if (!confirmSentRes.ok) throw new Error(`فشل تأكيد الإرسال يدويًا: ${confirmSentData.error}`);
  console.log(`✅ تم تأكيد الإرسال للمصنع يدويًا: حالة الطلب ${confirmSentData.factoryOrder.status}، تم الإرسال بواسطة: ${confirmSentData.factoryOrder.sentBy}`);

  // Step 9: Audit Logs Verification
  console.log('\n[9] التحقق من تسجيل العمليات في سجل التدقيق audit_logs...');
  const logsRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const logsData = await logsRes.json();
  const recentLogs: any[] = Array.isArray(logsData) ? logsData : (logsData.logs || []);
  const confirmLog = recentLogs.find((l: any) => l.action?.includes('تأكيد واعتماد') && l.details?.includes(validBooking.bookingCode));
  const factoryLog = recentLogs.find((l: any) => l.action?.includes('تأكيد إرسال أمر التشغيل') && l.details?.includes(factoryOrder.orderNumber));
  
  if (confirmLog) {
    console.log(`✅ تم توثيق تأكيد الحجز في سجل التدقيق: ${confirmLog.adminUsername} - ${confirmLog.details}`);
  } else {
    console.warn('⚠️ لم يتم العثور على سجل تأكيد الحجز في أحدث السجلات');
  }

  if (factoryLog) {
    console.log(`✅ تم توثيق إرسال المصنع في سجل التدقيق: ${factoryLog.adminUsername} - ${factoryLog.details}`);
  } else {
    console.warn('⚠️ لم يتم العثور على سجل إرسال أمر المصنع في أحدث السجلات');
  }

  // Cleanup test booking
  console.log('\n[10] تنظيف الحجز التجريبي...');
  await db.updateBooking(validBooking.id, { status: 'CANCELLED', notes: 'تم إلغاء الحجز التجريبي بعد نجاح الاختبارات' });
  console.log('✅ تم وسم الحجز التجريبي كملغي حفاظًا على سلامة البيانات.');

  console.log('\n🎉 اكتملت جميع الاختبارات بنجاح تام وبدون أي أخطاء!');
}

runMobileAndConfirmationTest().catch((err) => {
  console.error('\n❌ فشل الاختبار:', err);
  process.exit(1);
});
