import fs from 'fs';
import path from 'path';
import { db, buildFactoryWhatsAppMessage } from '../src/server/db';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 اختبار تعديل أمر تشغيل المصنع بالدفعات (العربون والدفعات)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [نجح]: ${testName}`);
      if (detail) console.log(`   ℹ️ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [فشل]: ${testName}`);
      if (detail) console.error(`   ⚠️ التفاصيل: ${detail}`);
      process.exitCode = 1;
    }
  }

  // Snapshot baseline real booking CLB-2026-5131 and FO-2026-109 before tests
  const dbPath = path.resolve(process.cwd(), 'data/db.json');
  const beforeRaw = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : null;
  const baselineBooking = await db.getBookingById('CLB-2026-5131');
  const baselineFO = await db.getFactoryOrderById('FO-2026-109');

  assert(baselineBooking !== null, 'وجود الحجز الحقيقي المرجعي CLB-2026-5131 قبل الاختبار');
  assert(baselineFO !== null, 'وجود أمر المصنع الحقيقي FO-2026-109 قبل الاختبار');

  const testBooking = await db.createBooking({
    customerName: 'عميل اختبار تعديل أمر المصنع بالدفعات',
    customerPhone: '01099881122',
    customerWhatsapp: '01099881122',
    preferredContact: 'whatsapp',
    eventName: 'اختبار آمن معزول - عربون المصنع',
    eventDate: '2026-12-20',
    deliveryTime: '14:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'المعادي - شارع 9',
    isTest: true,
    items: [
      { mealCode: 'Sale-05', quantity: 60, drinkOption: 'standard', orientalSweetOption: 'none' },
    ],
  });

  try {
    assert(Boolean(testBooking.id), '1. إنشاء حجز اختباري معزول بنجاح', `Code: ${testBooking.bookingCode}`);

    // Record Customer Deposit (4000 EGP)
    const custPaymentRes = await db.addPayment(
      {
        bookingId: testBooking.id,
        amount: 4000,
        method: 'instapay',
        date: '2026-11-25',
        receiptNumber: 'CUST-DEP-TEST-01',
        notes: 'عربون العميل المتفق عليه',
      },
      'اختبار النظام'
    );
    assert(custPaymentRes.booking.paidAmount === 4000, '2. تسجيل عربون العميل 4,000 ج.م على الحجز الاختباري');

    // Issue Factory Order v1
    const foV1 = await db.createFactoryOrder(testBooking.id, 'اختبار النظام');
    const v1ExpectedCost = (foV1.items[0]?.unitFactoryPrice || 56) * 60;
    assert(
      foV1.version === 1 && foV1.factoryCostTotal === v1ExpectedCost && foV1.paidToFactoryAmount === 0,
      '3. إصدار أمر تشغيل المصنع v1 بتكلفة محسوبة ودون دفعات مسبقة',
      `Order: ${foV1.orderNumber}, Cost: ${foV1.factoryCostTotal} ج`
    );

    // Edit Factory Order WITH Factory Deposit + Extra Item + Logistics update (v2)
    const foV2 = await db.updateFactoryOrder(
      foV1.id,
      {
        eventDate: '2026-12-22',
        deliveryTime: '16:30',
        deliveryLocation: 'القاهرة - التجمع الخامس (تم التعديل)',
        packagingNotes: 'تغليف خاص للحفل',
        items: [
          { mealCode: 'Sale-05', quantity: 100, drinkOption: 'pepsi', orientalSweetOption: 'none' }, // 60 * 100 = 6000
          { mealCode: 'Sale-12', quantity: 50, drinkOption: 'standard', orientalSweetOption: 'none' }, // 32 * 50 = 1600
        ],
        paymentChanges: {
          add: [
            {
              amount: 3800,
              method: 'instapay',
              paymentType: 'DEPOSIT',
              date: '2026-11-25',
              receiptNumber: 'FACT-DEP-001',
              notes: 'عربون تشغيل 50% للمصنع',
            },
            {
              amount: 500,
              method: 'cash',
              paymentType: 'INSTALLMENT',
              date: '2026-11-25',
              receiptNumber: 'FACT-ERR-002',
              notes: 'دفعة إضافية ستعدل لاحقاً',
            },
          ],
        },
      },
      'مدير التشغيل'
    );

    const expectedCostV2 = 100 * 60 + 50 * 32; // 6000 + 1600 = 7600
    assert(foV2.version === 2, '4. ترقية إصدار أمر المصنع إلى v2 بعد التعديل');
    assert(
      foV2.eventDate === '2026-12-22' && foV2.deliveryTime === '16:30' && foV2.deliveryLocation.includes('التجمع الخامس'),
      '5. تحديث موعد ومكان التسليم داخل أمر المصنع بنجاح'
    );
    assert(
      foV2.items.length === 2 && foV2.factoryCostTotal === expectedCostV2,
      '6. تعديل الأصناف وإضافة وجبة جديدة وإعادة حساب التكلفة الإجمالية للمصنع',
      `Cost V2: ${foV2.factoryCostTotal} ج (المتوقع: ${expectedCostV2} ج)`
    );
    assert(
      foV2.paidToFactoryAmount === 4300 && foV2.remainingToFactoryAmount === 3300 && foV2.paymentStatus === 'PARTIALLY_PAID',
      '7. تسجيل عربون المصنع (DEPOSIT) + الدفعة الإضافية وحساب المتبقي تلقائياً',
      `Paid: ${foV2.paidToFactoryAmount}, Remaining: ${foV2.remainingToFactoryAmount}, Status: ${foV2.paymentStatus}`
    );

    const depositPayment = (foV2.payments || []).find(p => p.receiptNumber === 'FACT-DEP-001');
    const secondPayment = (foV2.payments || []).find(p => p.receiptNumber === 'FACT-ERR-002');
    assert(
      depositPayment?.paymentType === 'DEPOSIT' && secondPayment?.paymentType === 'INSTALLMENT',
      '8. حفظ تصنيف الدفعة (عربون تشغيل DEPOSIT / دفعة مالية INSTALLMENT)'
    );

    // Verify persistence on re-read
    const reloadedV2 = await db.getFactoryOrderById(foV1.id);
    assert(
      reloadedV2 !== null && reloadedV2.paidToFactoryAmount === 4300 && (reloadedV2.payments?.length || 0) === 2,
      '9. استمرارية بيانات أمر المصنع والدفعات عند إعادة القراءة من قاعدة التخزين'
    );

    // Check WhatsApp message includes factory payments & deposit, and omits boilerplate & customer prices
    const { messageText } = buildFactoryWhatsAppMessage(reloadedV2!, custPaymentRes.booking, '201284484868');
    assert(
      messageText.includes('المدفوع للمصنع (العربون / الدفعات)') &&
        messageText.includes('عربون تشغيل') &&
        messageText.includes('المتبقي للمصنع'),
      '10. رسالة واتساب المصنع تعرض إجمالي المدفوع (العربون) والمتبقي وتفاصيل الدفعات'
    );
    assert(
      !messageText.includes('تعليمات التعبئة والتغليف') && !messageText.includes('تنبيه تشغيلي'),
      '11. خلو رسالة واتساب المصنع من التعليمات والتنبيه التشغيلي المحذوفين سابقاً'
    );
    assert(
      !messageText.includes('عربون العميل') && !messageText.includes('4,000'),
      '12. عدم تسريب عربون أو مدفوعات العميل داخل رسالة واتساب المصنع'
    );

    // Edit Factory Order v3: modify deposit amount, delete second payment, test OVERPAID
    const foV3 = await db.updateFactoryOrder(
      foV1.id,
      {
        items: [{ mealCode: 'Sale-12', quantity: 50, drinkOption: 'standard', orientalSweetOption: 'none' }], // 1600 EGP
        paymentChanges: {
          update: [
            {
              id: depositPayment!.id,
              amount: 2000,
              method: 'bank_transfer',
              paymentType: 'DEPOSIT',
              notes: 'تعديل عربون المصنع لـ 2000 ج عبر تحويل بنكي',
            },
          ],
          deleteIds: [secondPayment!.id],
        },
      },
      'مدير التشغيل'
    );

    assert(
      foV3.version === 3 &&
        foV3.factoryCostTotal === 1600 &&
        foV3.paidToFactoryAmount === 2000 &&
        foV3.remainingToFactoryAmount === -400 &&
        foV3.paymentStatus === 'OVERPAID' &&
        (foV3.payments?.length || 0) === 1,
      '13. تعديل وحذف دفعة ضمن أمر المصنع ومعالجة حالة OVERPAID (-400 دائن) بدقة',
      `Cost: ${foV3.factoryCostTotal}, Paid: ${foV3.paidToFactoryAmount}, Remaining: ${foV3.remainingToFactoryAmount}, Status: ${foV3.paymentStatus}`
    );

    // Security IDOR test: rejecting foreign paymentId
    let idorRejected = false;
    if (baselineFO && (baselineFO.payments?.length || 0) > 0) {
      try {
        await db.updateFactoryOrder(foV1.id, {
          paymentChanges: { deleteIds: [baselineFO.payments![0].id] },
        });
      } catch {
        idorRejected = true;
      }
      assert(idorRejected, '14. رفض محاولة تعديل أو حذف دفعة تابعة لأمر مصنع آخر (حماية IDOR)');
    } else {
      let fakeIdRejected = false;
      try {
        await db.updateFactoryOrder(foV1.id, {
          paymentChanges: { deleteIds: ['fpay-non-existent-foreign'] },
        });
      } catch {
        fakeIdRejected = true;
      }
      assert(fakeIdRejected, '14. رفض محاولة حذف معرّف دفعة غير تابع لأمر المصنع');
    }

    // Verify Audit Logs created
    const logs = await db.getAuditLogs(testBooking.id);
    assert(
      logs.some(l => l.action.includes('تعديل أمر تشغيل المصنع والدفعات')),
      '15. توثيق تعديل أمر المصنع والدفعات في سجل التدقيق Audit Logs'
    );
  } finally {
    // Cleanup isolated test booking + factory order + payments
    await db.deleteBookingsPermanently([testBooking.id], 'تنظيف الاختبار التلقائي');
  }

  // Verify real baseline CLB-2026-5131 and FO-2026-109 remained 100% untouched
  const afterBooking = await db.getBookingById('CLB-2026-5131');
  const afterFO = await db.getFactoryOrderById('FO-2026-109');
  const afterRaw = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : null;

  assert(
    JSON.stringify(baselineBooking) === JSON.stringify(afterBooking),
    '16. الحجز الحقيقي CLB-2026-5131 لم يُمس نهائياً وظل مطابقاً 100%'
  );
  assert(
    JSON.stringify(baselineFO) === JSON.stringify(afterFO),
    '17. أمر المصنع الحقيقي FO-2026-109 لم يُمس نهائياً وظل مطابقاً 100%'
  );
  assert(
    (beforeRaw?.bookings?.length || 0) === (afterRaw?.bookings?.length || 0) &&
      (beforeRaw?.factoryOrders?.length || 0) === (afterRaw?.factoryOrders?.length || 0),
    '18. عدم ترك أي سجلات اختبارية عالقة بعد التنظيف'
  );

  console.log('\n================================================================');
  console.log(`🎉 النتيجة النهائية: ${passed} من أصل ${total} اختبارات نجحت!`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('❌ خطأ غير متوقع في الاختبار:', err);
  process.exit(1);
});
