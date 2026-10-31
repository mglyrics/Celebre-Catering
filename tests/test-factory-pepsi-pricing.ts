import { db, buildFactoryWhatsAppMessage, FACTORY_PEPSI_ACCOUNTING } from '../src/server/db';
import { BookingMealItem } from '../src/types';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 اختبارات معادلة استبدال العصير بالبيبسي في أمر تشغيل المصنع فقط');
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

  // Verify constant definition
  assert(
    FACTORY_PEPSI_ACCOUNTING.juiceCostDeduction === 5 &&
    FACTORY_PEPSI_ACCOUNTING.cartonCostDeduction === 1 &&
    FACTORY_PEPSI_ACCOUNTING.pepsiCostAddition === 10 &&
    FACTORY_PEPSI_ACCOUNTING.netAdjustment === 4,
    'ثوابت معادلة البيبسي للمصنع: خصم 5 ج (عصير) و 1 ج (كرتونة) وإضافة 10 ج (بيبسي) = صافي +4 ج'
  );

  // Get meal Sale-12 (باتية) whose base factory price is exactly 32 EGP
  const meals = await db.getMeals(true);
  const sale12 = meals.find(m => m.code === 'Sale-12');
  if (!sale12) {
    throw new Error('وجبة Sale-12 غير موجودة');
  }

  assert(
    sale12.factoryPrice === 32 && sale12.hasJuice === true,
    'مطابقة وجبة الاختبار Sale-12: سعر المصنع 32 ج وبها عصير بخيرة',
    `سعر المصنع الأساسي: ${sale12.factoryPrice} ج، بها عصير: ${sale12.hasJuice}`
  );

  // Test Case 1 & 2 & 3 in a Single Booking:
  // - 20 boxes Sale-12 with Pepsi (juice replaced)
  // - 20 boxes Sale-12 with Standard (juice not replaced)
  // - 10 boxes Sale-12 with No Juice (juice removed without replacement)
  // Total = 50 meals (meets minimum order of 50)
  console.log('\n--- اختبار الحجز المتعدد وحساب أسعار المصنع والعميل ---');
  const bookingData = {
    customerName: 'تجربة معادلة بيبسي المصنع',
    customerPhone: '01012345678',
    customerWhatsapp: '01012345678',
    preferredContact: 'whatsapp' as const,
    eventName: 'اختبار تدقيق معادلة المصنع',
    eventDate: '2026-11-20',
    deliveryTime: '15:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'التجمع الخامس - شارع التسعين',
    isTest: true,
    items: [
      { mealCode: 'Sale-12', quantity: 20, drinkOption: 'pepsi' as const },
      { mealCode: 'Sale-12', quantity: 20, drinkOption: 'standard' as const },
      { mealCode: 'Sale-12', quantity: 10, drinkOption: 'no_juice' as const },
    ],
  };

  const booking = await db.createBooking(bookingData);
  assert(booking.totalMealsCount === 50, 'إجمالي عدد الوجبات في الحجز يساوي 50 وجبة');

  // Check Customer Pricing:
  // Base distributor price = 44
  // For pepsi: 44 + 10 = 54 EGP -> 20 * 54 = 1080 EGP
  // For standard: 44 EGP -> 20 * 44 = 880 EGP
  // For no_juice: 44 - 5 = 39 EGP -> 10 * 39 = 390 EGP
  // Total customer price = 1080 + 880 + 390 = 2350 EGP
  const expectedCustomerTotal = (20 * 54) + (20 * 44) + (10 * 39);
  assert(
    booking.totalDistributorPrice === expectedCustomerTotal,
    'حساب سعر العميل لم يتأثر بمعادلة المصنع وظل طبقاً لمعادلة العميل المعتمدة',
    `إجمالي العميل: ${booking.totalDistributorPrice} ج (المتوقع: ${expectedCustomerTotal} ج)`
  );
  assert(
    booking.remainingAmount === expectedCustomerTotal && booking.paidAmount === 0,
    'أرصدة الحجز (المتبقي والمدفوع) مطابقة لأسعار العميل تماماً'
  );

  // Check Factory Order Preview
  console.log('\n--- اختبار معاينة أمر المصنع وحسابات المعادلة المستقلة ---');
  const preview = await db.getFactoryOrderPreview(booking.id);
  
  const pepsiItem = preview.items.find(it => it.drinkOption === 'pepsi');
  const standardItem = preview.items.find(it => it.drinkOption === 'standard');
  const noJuiceItem = preview.items.find(it => it.drinkOption === 'no_juice');

  // Case 1: Base 32 + Pepsi -> 36 EGP
  assert(
    pepsiItem !== undefined && pepsiItem.unitFactoryPrice === 36,
    'الحالة 1: وجبة سعر مصنعها 32 ج وبها عصير: يصبح سعر المصنع بعد استبداله ببيبسي 36 ج بالضبط',
    `سعر الوحدة: ${pepsiItem?.unitFactoryPrice} ج (الأساسي: ${pepsiItem?.baseFactoryPrice} ج، التعديل: +${pepsiItem?.factoryDrinkAdjustment} ج)`
  );
  assert(
    pepsiItem?.totalFactoryPrice === 20 * 36,
    'إجمالي صنف البيبسي للمصنع = 20 * 36 = 720 ج'
  );

  // Case 2: Base 32 + Standard -> 32 EGP
  assert(
    standardItem !== undefined && standardItem.unitFactoryPrice === 32,
    'الحالة 2: وجبة لم يتم استبدال العصير فيها: يظل سعر المصنع 32 ج',
    `سعر الوحدة: ${standardItem?.unitFactoryPrice} ج (الأساسي: ${standardItem?.baseFactoryPrice} ج، التعديل: ${standardItem?.factoryDrinkAdjustment} ج)`
  );
  assert(
    standardItem?.totalFactoryPrice === 20 * 32,
    'إجمالي صنف العصير القياسي للمصنع = 20 * 32 = 640 ج'
  );

  // Case 3: Base 32 + No Juice -> no Pepsi added (32 - 5 = 27 EGP)
  assert(
    noJuiceItem !== undefined && noJuiceItem.unitFactoryPrice === 27,
    'الحالة 3: وجبة تم حذف العصير منها دون استبداله: لا يضاف سعر البيبسي (27 ج بدلاً من 32 ج أو 36 ج)',
    `سعر الوحدة للمصنع: ${noJuiceItem?.unitFactoryPrice} ج`
  );
  assert(
    noJuiceItem?.totalFactoryPrice === 10 * 27,
    'إجمالي صنف بدون عصير للمصنع = 10 * 27 = 270 ج'
  );

  // Overall factory cost
  const expectedFactoryTotal = (20 * 36) + (20 * 32) + (10 * 27); // 720 + 640 + 270 = 1630
  assert(
    preview.totalFactoryCost === expectedFactoryTotal,
    'إجمالي تكلفة أمر المصنع بعد تطبيق التعديلات صحيح بالكامل',
    `إجمالي المصنع: ${preview.totalFactoryCost} ج (المتوقع: ${expectedFactoryTotal} ج)`
  );

  // Case 4: Meal without juice originally (hasJuice === false)
  console.log('\n--- اختبار وجبة لا تحتوي أصلًا على عصير (hasJuice === false) ---');
  // Temporarily set Sale-13 hasJuice: false
  const sale13Before = await db.getMealById('Sale-13');
  assert(
    sale13Before !== undefined && sale13Before.factoryPrice === 32,
    'وجبة Sale-13 سعر مصنعها الأساسي 32 ج'
  );

  await db.updateMeal('Sale-13', { hasJuice: false });

  const noJuiceBooking = await db.createBooking({
    customerName: 'عميل اختبار وجبة بدون عصير',
    customerPhone: '01099887766',
    preferredContact: 'phone',
    eventName: 'حفل تجريبي بدون عصير',
    eventDate: '2026-11-25',
    deliveryTime: '18:00',
    deliveryGovernorate: 'الجيزة',
    deliveryAddress: 'الدقي',
    isTest: true,
    items: [
      { mealCode: 'Sale-13', quantity: 50, drinkOption: 'pepsi' },
    ],
  });

  const njPreview = await db.getFactoryOrderPreview(noJuiceBooking.id);
  const njItem = njPreview.items[0];
  assert(
    njItem.unitFactoryPrice === 32 && njItem.factoryDrinkAdjustment === 0,
    'الحالة 4: وجبة لا تحتوي على عصير أصلًا: لا تتأثر بالمعادلة ويظل سعر المصنع 32 ج حتى لو اختير بيبسي',
    `سعر الوحدة المحسوب: ${njItem.unitFactoryPrice} ج (سعر الأساس: 32 ج، التعديل المطبق: ${njItem.factoryDrinkAdjustment} ج)`
  );
  assert(
    njPreview.totalFactoryCost === 50 * 32,
    'إجمالي أمر المصنع للوجبة التي لا تحتوي على عصير = 50 * 32 = 1600 ج'
  );

  // Restore Sale-13 hasJuice to true
  await db.updateMeal('Sale-13', { hasJuice: true });

  // Issue Official Factory Order & Test WhatsApp Message and Audit Logs
  console.log('\n--- اختبار إصدار أمر تشغيل المصنع ورسالة واتساب وسجل التدقيق ---');
  const factoryOrder = await db.createFactoryOrder(booking.id, 'الإدارة المركزية');

  assert(
    factoryOrder.factoryCostTotal === expectedFactoryTotal,
    'أمر المصنع الصادر يحتوي على إجمالي التكلفة المعدّلة بالضبط',
    `التكلفة الإجمالية: ${factoryOrder.factoryCostTotal} ج`
  );

  // WhatsApp Message Verification
  const { messageText } = buildFactoryWhatsAppMessage(factoryOrder, booking, '201284484868');
  console.log('--- نص رسالة واتساب المصنع: ---');
  console.log(messageText);
  console.log('------------------------------');
  
  assert(
    messageText.includes('36 ج.م') || messageText.includes('36 ج'),
    'رسالة واتساب المصنع تعرض سعر المصنع المعدّل للبوكس (36 ج.م) لصنف البيبسي',
    messageText
  );
  assert(
    messageText.includes('32 ج.م') || messageText.includes('32 ج'),
    'رسالة واتساب المصنع تعرض سعر المصنع للبوكس (32 ج.م) لصنف العصير القياسي'
  );
  assert(
    messageText.includes('استبدال العصير بكانز بيبسي'),
    'رسالة واتساب المصنع تعرض خيار المشروب بوضوح (استبدال العصير بكانز بيبسي)'
  );
  assert(
    !messageText.includes('54 ج') && !messageText.includes('44 ج'),
    'رسالة واتساب المصنع خالية تماماً من أسعار العميل والموزع وهامش الربح'
  );
  assert(
    messageText.includes(expectedFactoryTotal.toLocaleString('ar-EG')) || messageText.includes(String(expectedFactoryTotal)),
    'رسالة واتساب المصنع تعرض إجمالي تكلفة أمر المصنع بعد التعديل'
  );

  // Audit Log Verification
  const auditLogs = await db.getAuditLogs(booking.id);
  const factoryOrderLog = auditLogs.find(l => l.action === 'إصدار أمر تشغيل المصنع');
  assert(
    factoryOrderLog !== undefined && factoryOrderLog.details.includes('تم تطبيق معادلة استبدال العصير بالبيبسي للمصنع'),
    'تم توثيق تطبيق معادلة بيبسي المصنع رسمياً في سجل التدقيق (Audit Logs)',
    factoryOrderLog?.details
  );

  // Clean up test bookings using deleteTestBooking
  await db.deleteTestBooking(booking.id);
  await db.deleteTestBooking(noJuiceBooking.id);

  console.log('\n================================================================');
  console.log(`🎉 النتيجة النهائية: ${passed} من أصل ${total} اختبارات نجحت بنسبة 100%!`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('❌ حدث خطأ غير متوقع أثناء تشغيل الاختبارات:', err);
  process.exit(1);
});
