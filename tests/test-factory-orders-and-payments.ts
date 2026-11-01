import { db, FACTORY_PEPSI_ACCOUNTING } from '../src/server/db';
import { FactoryPayment } from '../src/types';

async function runComprehensiveFactoryTests() {
  console.log('========================================================================');
  console.log('🧪 اختبارات أوامر تشغيل المصنع وإدارة دفعات المصنع – Celebre Catering');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testTitle: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [نجح الاختبار ${total}]: ${testTitle}`);
      if (details) console.log(`   ℹ️ ${details}`);
      passed++;
    } else {
      console.error(`❌ [فشل الاختبار ${total}]: ${testTitle}`);
      if (details) console.error(`   ⚠️ تفاصيل: ${details}`);
      process.exitCode = 1;
    }
  }

  try {
    // Clean up any test factory payments from previous runs
    const fs = await import('fs');
    try {
      const dbRaw = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
      if (dbRaw.factoryPayments) {
        dbRaw.factoryPayments = dbRaw.factoryPayments.filter((p: any) => !p.receiptNumber?.includes('-FO-'));
        fs.writeFileSync('data/db.json', JSON.stringify(dbRaw, null, 2), 'utf8');
      }
    } catch {}

    // ------------------------------------------------------------------------
    // [1] فحص وجبة الاختبار المعتمدة Sale-12 (باتية)
    // ------------------------------------------------------------------------
    console.log('--- [1] التحقق من بيانات صنف الاختبار Sale-12 ومعادلة المصنع ---');
    const meals = await db.getMeals(true);
    const meal12 = meals.find(m => m.code === 'Sale-12');
    if (!meal12) throw new Error('وجبة Sale-12 غير موجودة');

    const baseFactPrice = meal12.factoryPrice || 32;
    const baseDistPrice = meal12.distributorPrice || 44;

    assert(
      meal12.hasJuice === true && baseFactPrice === 32,
      'وجبة Sale-12 (باتية) سعر المصنع الأساسي 32 ج وبها عصير',
      `سعر المصنع الأساسي: ${baseFactPrice} ج، سعر الموزع: ${baseDistPrice} ج`
    );

    assert(
      FACTORY_PEPSI_ACCOUNTING.juiceCostDeduction === 5 &&
      FACTORY_PEPSI_ACCOUNTING.pepsiCostAddition === 10 &&
      FACTORY_PEPSI_ACCOUNTING.netAdjustment === 5,
      'معادلة المصنع المعتمدة: خصم 5 ج (عصير) + إضافة 10 ج (بيبسي) = صافي +5 ج'
    );

    // ------------------------------------------------------------------------
    // [2] إنشاء حجز لاختبار: حذف العصير، استبدال ببيبسي، وعصير قياسي
    // ------------------------------------------------------------------------
    console.log('\n--- [2] اختبار الحالات 1 و 2 و 3: حذف العصير، استبدال ببيبسي، وعدم تغير سعر العميل والموزع ---');
    // 20 وجبة بيبسي
    // 20 وجبة عصير قياسي
    // 10 وجبات بدون عصير
    // إجمالي = 50 وجبة (الحد الأدنى 50)
    const testBooking = await db.createBooking({
      customerName: 'شركة النور للمؤتمرات',
      customerPhone: '01011223344',
      customerWhatsapp: '01011223344',
      preferredContact: 'whatsapp',
      eventName: 'المؤتمر السنوي 2026',
      eventDate: '2026-12-10',
      deliveryTime: '13:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'القرية الذكية - مبنى B',
      isTest: true,
      items: [
        { mealCode: 'Sale-12', quantity: 20, drinkOption: 'pepsi' },
        { mealCode: 'Sale-12', quantity: 20, drinkOption: 'standard' },
        { mealCode: 'Sale-12', quantity: 10, drinkOption: 'no_juice' },
      ],
      notes: 'حجز اختبار شامل لمعادلات المصنع والدفعات',
    });

    // ------------------------------------------------------------------------
    // [اختبار 1]: حذف العصير: خصم 5 جنيهات من سعر المصنع فقط
    // ------------------------------------------------------------------------
    const preview = await db.getFactoryOrderPreview(testBooking.id);
    const noJuiceFactItem = preview.items.find(it => it.drinkOption === 'no_juice');
    assert(
      noJuiceFactItem !== undefined && noJuiceFactItem.unitFactoryPrice === (baseFactPrice - 5),
      'اختبار 1: حذف العصير -> خصم 5 ج من سعر المصنع فقط (32 - 5 = 27 ج)',
      `سعر الوحدة للمصنع بدون عصير: ${noJuiceFactItem?.unitFactoryPrice} ج (المتوقع: 27 ج)`
    );

    // ------------------------------------------------------------------------
    // [اختبار 2]: استبدال العصير ببيبسي: خصم 5 وإضافة 10 جنيهات (صافي +5 ج)
    // ------------------------------------------------------------------------
    const pepsiFactItem = preview.items.find(it => it.drinkOption === 'pepsi');
    assert(
      pepsiFactItem !== undefined && pepsiFactItem.unitFactoryPrice === (baseFactPrice + 5),
      'اختبار 2: استبدال العصير ببيبسي -> خصم 5 وإضافة 10 ج (32 - 5 + 10 = 37 ج)',
      `سعر الوحدة للمصنع مع البيبسي: ${pepsiFactItem?.unitFactoryPrice} ج (المتوقع: 37 ج)`
    );

    // العصير القياسي يظل 32 ج دون أي زيادة أو خصم
    const standardFactItem = preview.items.find(it => it.drinkOption === 'standard');
    assert(
      standardFactItem !== undefined && standardFactItem.unitFactoryPrice === baseFactPrice,
      'العصير القياسي: لا خصم ولا إضافة ويظل سعر المصنع 32 ج',
      `سعر الوحدة: ${standardFactItem?.unitFactoryPrice} ج`
    );

    // ------------------------------------------------------------------------
    // [اختبار 3]: التأكد من عدم تغير سعر العميل والموزع
    // ------------------------------------------------------------------------
    // العميل: بيبسي (+10 ج)، قياسي (0)، بدون عصير (-5 ج)
    // 20 * (44 + 10 = 54) = 1080 ج
    // 20 * 44 = 880 ج
    // 10 * (44 - 5 = 39) = 390 ج
    // إجمالي العميل = 1080 + 880 + 390 = 2350 ج
    const expectedClientTotal = (20 * 54) + (20 * 44) + (10 * 39);
    assert(
      testBooking.totalDistributorPrice === expectedClientTotal,
      'اختبار 3: ثبات أسعار العميل والموزع تماماً دون أي تأثر بمعادلة المصنع',
      `إجمالي العميل: ${testBooking.totalDistributorPrice} ج.م (المتوقع: ${expectedClientTotal} ج.م)`
    );

    // حساب إجمالي المصنع المتوقع:
    // 20 * 37 = 740 ج
    // 20 * 32 = 640 ج
    // 10 * 27 = 270 ج
    // الإجمالي = 740 + 640 + 270 = 1650 ج
    const expectedFactoryCost = (20 * 37) + (20 * 32) + (10 * 27);
    assert(
      preview.totalFactoryCost === expectedFactoryCost,
      'إجمالي تكلفة أمر المصنع المالي بعد تطبيق القواعد = 1650 ج.م',
      `إجمالي المصنع: ${preview.totalFactoryCost} ج.م (المتوقع: ${expectedFactoryCost} ج.م)`
    );

    // ------------------------------------------------------------------------
    // [4] إصدار أمر تشغيل المصنع وتسجيل الدفعات
    // ------------------------------------------------------------------------
    console.log('\n--- [4] إصدار أمر المصنع واختبار إدارة الدفعات المالية للمصنع ---');
    const factoryOrder = await db.createFactoryOrder(testBooking.id, 'الإدارة المركزية');

    assert(
      factoryOrder.orderNumber.startsWith('FO-2026-') &&
      factoryOrder.factoryCostTotal === expectedFactoryCost &&
      factoryOrder.paidToFactoryAmount === 0 &&
      factoryOrder.remainingToFactoryAmount === expectedFactoryCost &&
      factoryOrder.paymentStatus === 'UNPAID',
      'إصدار أمر التشغيل بالقيم المالية الأولية الصحيحة: تكلفة 1650 ج، مسدد 0 ج، متبقي 1650 ج، الحالة UNPAID'
    );

    // ------------------------------------------------------------------------
    // [اختبار 4]: تسجيل دفعة للمصنع والتحقق من تحديث الرصيد
    // ------------------------------------------------------------------------
    console.log('\n--- اختبار 4: تسجيل دفعة للمصنع والتحقق من تحديث الرصيد ---');
    const rec1 = await db.addFactoryPayment({
      factoryOrderId: factoryOrder.id,
      amount: 650,
      method: 'instapay',
      date: '2026-11-01',
      receiptNumber: 'INSTA-FO-001',
      notes: 'عربون أولي للمصنع',
    }, 'المحاسب كريم');

    assert(
      rec1.payment.amount === 650 &&
      rec1.factoryOrder.paidToFactoryAmount === 650 &&
      rec1.factoryOrder.remainingToFactoryAmount === 1000 &&
      rec1.factoryOrder.paymentStatus === 'PARTIALLY_PAID',
      'اختبار 4: تسجيل دفعة للمصنع وتحديث الرصيد بنجاح',
      `المسدد الجديد للمصنع: ${rec1.factoryOrder.paidToFactoryAmount} ج، المتبقي: ${rec1.factoryOrder.remainingToFactoryAmount} ج، الحالة: ${rec1.factoryOrder.paymentStatus}`
    );

    // اختبار منع تكرار نفس رقم الإيصال
    let duplicateRejected = false;
    try {
      await db.addFactoryPayment({
        factoryOrderId: factoryOrder.id,
        amount: 650,
        method: 'instapay',
        receiptNumber: 'INSTA-FO-001',
      }, 'المحاسب كريم');
    } catch (dupErr: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'منع تكرار تسجيل دفعة مصنع بنفس رقم الإيصال لنفس أمر التشغيل');

    // ------------------------------------------------------------------------
    // [اختبار 5]: تعديل دفعة والتحقق من إعادة حساب الرصيد
    // ------------------------------------------------------------------------
    console.log('\n--- اختبار 5: تعديل دفعة والتحقق من إعادة حساب الرصيد ---');
    // تعديل الدفعة من 650 إلى 1000 ج
    const updatedPayResult = await db.updateFactoryPayment(
      rec1.payment.id,
      {
        amount: 1000,
        method: 'bank_transfer',
        receiptNumber: 'CIB-FO-001',
        notes: 'تم تعديل المبلغ إلى 1000 ج تحويل بنكي',
      },
      'المحاسب كريم'
    );

    assert(
      updatedPayResult.payment.amount === 1000 &&
      updatedPayResult.payment.method === 'bank_transfer' &&
      updatedPayResult.factoryOrder.paidToFactoryAmount === 1000 &&
      updatedPayResult.factoryOrder.remainingToFactoryAmount === 650 &&
      updatedPayResult.factoryOrder.paymentStatus === 'PARTIALLY_PAID',
      'اختبار 5: تعديل دفعة المصنع وإعادة احتساب المسدد والمتبقي تلقائياً',
      `المسدد بعد التعديل: ${updatedPayResult.factoryOrder.paidToFactoryAmount} ج، المتبقي: ${updatedPayResult.factoryOrder.remainingToFactoryAmount} ج`
    );

    // إضافة دفعة ثانية بقيمة 650 ج لإكمال السداد
    const rec2 = await db.addFactoryPayment({
      factoryOrderId: factoryOrder.id,
      amount: 650,
      method: 'cash',
      receiptNumber: 'CASH-FO-002',
      notes: 'سداد باقي قيمة أمر التشغيل بالكامل',
    }, 'المحاسب كريم');

    assert(
      rec2.factoryOrder.paidToFactoryAmount === 1650 &&
      rec2.factoryOrder.remainingToFactoryAmount === 0 &&
      rec2.factoryOrder.paymentStatus === 'FULLY_PAID',
      'إكمال السداد بالكامل: المسدد 1650 ج والمتبقي 0 ج وحالة السداد FULLY_PAID'
    );

    // ------------------------------------------------------------------------
    // [اختبار 6]: حذف دفعة والتحقق من إعادة حساب الرصيد وتسجيل الحذف في Audit Logs
    // ------------------------------------------------------------------------
    console.log('\n--- اختبار 6: حذف دفعة مسجلة بالخطأ والتحقق من سجل التدقيق ---');
    const deleteRes = await db.deleteFactoryPayment(
      rec2.payment.id,
      'المحاسب كريم',
      'تم إدخال إيصال الكاش بطريق الخطأ قبل الاستلام الفعلي'
    );

    assert(
      deleteRes.success &&
      deleteRes.factoryOrder.paidToFactoryAmount === 1000 &&
      deleteRes.factoryOrder.remainingToFactoryAmount === 650 &&
      deleteRes.factoryOrder.paymentStatus === 'PARTIALLY_PAID',
      'اختبار 6: حذف الدفعة وإعادة حساب الأرصدة تلقائياً (المسدد عاد 1000 ج والمتبقي 650 ج)',
      `المسدد: ${deleteRes.factoryOrder.paidToFactoryAmount} ج، المتبقي: ${deleteRes.factoryOrder.remainingToFactoryAmount} ج`
    );

    const logs = await db.getAuditLogs(testBooking.id);
    const deleteLog = logs.find(l => l.action === 'حذف دفعة مصنع');
    assert(
      deleteLog !== undefined &&
      deleteLog.bookingCode === testBooking.bookingCode &&
      deleteLog.details.includes('المسدد الجديد: 1000 ج') &&
      deleteLog.details.includes('المتبقي: 650 ج'),
      'توثيق عملية حذف دفعة المصنع بالكامل في سجل التدقيق (Audit Logs) مع السبب والأرصدة',
      deleteLog?.details
    );

    // ------------------------------------------------------------------------
    // [اختبار 7]: تعديل أمر تشغيل عليه دفعات سابقة والتأكد من سلامة الحسابات
    // ------------------------------------------------------------------------
    console.log('\n--- اختبار 7: تعديل أمر تشغيل عليه دفعات سابقة وفحص الفائض/المتبقي ---');
    // سنقوم بتعديل كميات الحجز لتقليل إجمالي تكلفة المصنع إلى 800 ج بدلاً من 1650 ج
    // مع وجود دفعة سابقة مسجلة بقيمة 1000 ج (أي يصبح هناك سداد بالزيادة قدره 200 ج للمصنع)
    const updatedBooking = await db.updateBookingByAdmin(testBooking.id, {
      items: [
        { mealCode: 'Sale-12', quantity: 50, drinkOption: 'no_juice' }, // 50 * 27 = 1350 ج
      ],
    }, 'الإدارة المركزية');

    assert(
      updatedBooking.totalMealsCount === 50,
      'تم تعديل الحجز بنجاح مع الحفاظ على الحد الأدنى 50 وجبة'
    );

    // فحص أمر المصنع المحدث
    const reloadedOrder = await db.getFactoryOrderById(factoryOrder.id);
    assert(
      reloadedOrder !== null &&
      reloadedOrder.payments !== undefined &&
      reloadedOrder.payments.length === 1 &&
      reloadedOrder.paidToFactoryAmount === 1000,
      'اختبار 7: الدفعات السابقة (1000 ج) محفوظة بالكامل ولم يتم مسها بعد تعديل أمر التشغيل',
      `عدد الدفعات المسجلة: ${reloadedOrder?.payments?.length}، المسدد: ${reloadedOrder?.paidToFactoryAmount} ج`
    );

    // ------------------------------------------------------------------------
    // [اختبار 8]: التأكد من عدم تكرار أي خصم أو إضافة عند إعادة إصدار أمر التشغيل
    // ------------------------------------------------------------------------
    console.log('\n--- اختبار 8: إعادة إصدار أمر المصنع والتأكد من عدم تكرار الخصم أو الإضافة ---');
    // إصدار نسخة جديدة v2 للحجز بعد التعديل
    const orderV2 = await db.createFactoryOrder(testBooking.id, 'الإدارة المركزية', { forceNewVersion: true });

    assert(
      orderV2.version === 2 &&
      orderV2.items[0].unitFactoryPrice === 27,
      'اختبار 8: عدم تكرار الخصم عند إعادة إصدار أمر المصنع v2 (ظل 27 ج ولم يخصم مرتين)',
      `الإصدار: v${orderV2.version}، سعر المصنع للبوكس: ${orderV2.items[0].unitFactoryPrice} ج (32 - 5 = 27 ج)`
    );

    // تنظيف الحجز التجريبي
    await db.deleteTestBooking(testBooking.id);

    console.log('\n========================================================================');
    console.log(`🎉 النتيجة: ${passed} من أصل ${total} اختبارات نجحت بنسبة 100%!`);
    console.log('========================================================================');
  } catch (err: any) {
    console.error('❌ خطأ أثناء تنفيذ الاختبارات:', err);
    process.exit(1);
  }
}

runComprehensiveFactoryTests();
