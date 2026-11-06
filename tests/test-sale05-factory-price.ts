import { db } from '../src/server/db';
import * as fs from 'fs';

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 اختبار التحقق من تعديل سعر المصنع للصنف Sale-05 والحسابات المعتمدة');
  console.log('========================================================================\n');

  // 1. فحص قراءة السعر الأساسي للصنف Sale-05 من قاعدة البيانات
  const meals = await db.getMeals(true);
  const sale05 = meals.find(m => m.code === 'Sale-05');
  if (!sale05) {
    throw new Error('الصنف Sale-05 غير موجود!');
  }

  console.log('[1] فحص قراءة السعر من قاعدة البيانات:');
  console.log(`   - كود الصنف: ${sale05.code}`);
  console.log(`   - الاسم: ${sale05.name}`);
  console.log(`   - سعر المصنع الأساسي: ${sale05.factoryPrice} جنيه (المتوقع: 56)`);
  console.log(`   - سعر الموزع الأساسي: ${sale05.distributorPrice} جنيه (المتوقع: 80)`);

  if (sale05.factoryPrice !== 56) {
    throw new Error(`سعر المصنع الأساسي غير مطابق! المقروء: ${sale05.factoryPrice}، المتوقع: 56`);
  }
  if (sale05.distributorPrice !== 80) {
    throw new Error(`سعر الموزع تم تغييره بالخطأ! المقروء: ${sale05.distributorPrice}`);
  }

  // 2. محاكاة إنشاء طلبية 200 وجبة Sale-05 باستبدال العصير ببيبسي
  console.log('\n[2] محاكاة إنشاء حجز تجريبي: 200 وجبة Sale-05 ببيبسي:');
  const testBooking = await db.createBooking({
    customerName: '[اختبار برمجي] فحص سعر المصنع Sale-05',
    customerPhone: '01011112222',
    customerWhatsapp: '01011112222',
    preferredContact: 'whatsapp',
    eventName: 'اختبار دقة حساب المصنع',
    eventDate: '2026-11-25',
    deliveryTime: '16:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'معمل الاختبارات',
    items: [
      {
        mealCode: 'Sale-05',
        quantity: 200,
        drinkOption: 'pepsi',
        orientalSweetOption: 'none',
      }
    ],
    isTest: true,
  });

  const item = testBooking.items[0];
  console.log('   - تفاصيل البند المسجل في الحجز:');
  console.log(`     * سعر المصنع الأساسي المسجل: ${item.baseFactoryPrice} جنيه`);
  console.log(`     * تعديل المشروب للمصنع: ${item.factoryDrinkAdjustment} جنيه (المعادلة: -5 عصير -1 عبوة +10 كانز = +4)`);
  console.log(`     * سعر الوحدة النهائي للمصنع: ${item.unitFactoryPrice} جنيه`);
  console.log(`     * إجمالي المصنع (200 وجبة): ${item.totalFactoryPrice} جنيه`);
  console.log(`     * سعر الوحدة للموزع / العميل: ${item.unitDistributorPrice} جنيه`);
  console.log(`     * إجمالي العميل (200 وجبة): ${item.totalDistributorPrice} جنيه`);
  console.log(`     * إجمالي تكلفة المصنع للحجز: ${testBooking.totalFactoryPrice} جنيه`);
  console.log(`     * هامش ربح الموزع: ${testBooking.profitMargin} جنيه`);

  if (item.unitFactoryPrice !== 60) {
    throw new Error(`سعر الوحدة للمصنع غير مطابق! المحسوب: ${item.unitFactoryPrice}، المتوقع: 60`);
  }
  if (item.totalFactoryPrice !== 12000) {
    throw new Error(`إجمالي تكلفة المصنع غير مطابق! المحسوب: ${item.totalFactoryPrice}، المتوقع: 12000`);
  }
  if (item.unitDistributorPrice !== 90) {
    throw new Error(`سعر العميل غير مطابق! المحسوب: ${item.unitDistributorPrice}، المتوقع: 90`);
  }
  if (item.totalDistributorPrice !== 18000) {
    throw new Error(`إجمالي العميل غير مطابق! المحسوب: ${item.totalDistributorPrice}، المتوقع: 18000`);
  }
  if (testBooking.profitMargin !== 6000) {
    throw new Error(`هامش الربح غير مطابق! المحسوب: ${testBooking.profitMargin}، المتوقع: 6000`);
  }

  // 3. اختبار أمر تشغيل المصنع (Factory Order Preview)
  console.log('\n[3] اختبار معاينة أمر تشغيل المصنع:');
  const preview = await db.getFactoryOrderPreview(testBooking.id);
  console.log(`   - تكلفة أمر المصنع الإجمالية: ${preview.totalFactoryCost} جنيه`);
  console.log(`   - تعليمات الصنف: ${preview.items[0].specialInstructions}`);
  console.log(`   - سعر الوحدة في أمر المصنع: ${preview.items[0].unitFactoryPrice} جنيه`);

  if (preview.totalFactoryCost !== 12000) {
    throw new Error(`تكلفة أمر المصنع الإجمالية غير مطابقة! المحسوب: ${preview.totalFactoryCost}، المتوقع: 12000`);
  }

  // 4. اختبار حالة حذف العصير (no_juice): 56 - 5 - 1 = 50 جنيه
  console.log('\n[4] اختبار معادلة حذف العصير (no_juice):');
  const noJuiceBooking = await db.createBooking({
    customerName: '[اختبار برمجي] فحص حذف العصير',
    customerPhone: '01011113333',
    customerWhatsapp: '01011113333',
    preferredContact: 'whatsapp',
    eventName: 'اختبار حذف العصير',
    eventDate: '2026-11-25',
    deliveryTime: '16:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'معمل الاختبارات',
    items: [
      {
        mealCode: 'Sale-05',
        quantity: 50,
        drinkOption: 'no_juice',
        orientalSweetOption: 'none',
      }
    ],
    isTest: true,
  });

  const noJuiceItem = noJuiceBooking.items[0];
  console.log(`   - سعر المصنع الأساسي: ${noJuiceItem.baseFactoryPrice} جنيه`);
  console.log(`   - تعديل المصنع لحذف العصير: ${noJuiceItem.factoryDrinkAdjustment} جنيه (المتوقع: -6)`);
  console.log(`   - سعر الوحدة للمصنع بدون عصير: ${noJuiceItem.unitFactoryPrice} جنيه (المتوقع: 50)`);
  console.log(`   - سعر العميل بدون عصير: ${noJuiceItem.unitDistributorPrice} جنيه (المتوقع: 75)`);

  if (noJuiceItem.unitFactoryPrice !== 50) {
    throw new Error(`سعر المصنع بدون عصير غير مطابق! المحسوب: ${noJuiceItem.unitFactoryPrice}، المتوقع: 50`);
  }

  // 5. تنظيف الحجوزات التجريبية
  await db.deleteBookingsPermanently([testBooking.id, noJuiceBooking.id], 'تنظيف الاختبار الآلي');
  console.log('\n[5] تم تنظيف السجلات التجريبية بأمان.');

  // 6. التحقق من بقاء الحجز الحقيقي CLB-2026-5131 دون أي مساس
  const dbJson = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  const realBooking = dbJson.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');
  console.log('\n[6] فحص سلامة الحجز الحقيقي CLB-2026-5131:');
  console.log(`   - كود الحجز: ${realBooking.bookingCode}`);
  console.log(`   - اسم العميل: ${realBooking.customerName}`);
  console.log(`   - إجمالي العميل: ${realBooking.totalDistributorPrice} جنيه (محفوظ كما هو)`);
  console.log(`   - إجمالي المصنع المحفوظ سابقاً: ${realBooking.totalFactoryPrice} جنيه (Snapshot لم يتغير)`);
  console.log(`   - حالة الحجز: ${realBooking.status}`);

  if (realBooking.totalDistributorPrice !== 18000 || realBooking.paidAmount !== 0) {
    throw new Error('تم المساس بالحجز الحقيقي بشكل غير مسموح!');
  }

  console.log('\n========================================================================');
  console.log('🎉 نجح الاختبار بنسبة 100%! الحسابات مطابقة تماماً للمواصفات المعتمدة.');
  console.log('========================================================================');
}

runTest().catch(err => {
  console.error('❌ فشل الاختبار:', err);
  process.exit(1);
});
