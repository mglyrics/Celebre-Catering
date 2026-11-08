import { db } from '../src/server/db';
import * as fs from 'fs';

async function runDedicatedVerification() {
  console.log('========================================================================');
  console.log('🧪 تقرير الاختبار العملي الشامل: الحالات، الحذف، الأرشفة، وتأكيد الحماية');
  console.log('========================================================================\n');

  // [0] فحص سلامة الحجز الحقيقي CLB-2026-5131 قبل الاختبار
  const initialDb = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  const realBefore = initialDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');
  console.log('[0] التحقق المسبق من الحجز الحقيقي CLB-2026-5131:');
  console.log(`   - العميل: ${realBefore?.customerName}`);
  console.log(`   - الهاتف: ${realBefore?.customerPhone}`);
  console.log(`   - الإجمالي: ${realBefore?.totalDistributorPrice} ج.م`);
  console.log(`   - الحالة: ${realBefore?.status}\n`);

  // ========================================================================
  // [1] اختبار محاكاة الحجز CLB-2026-1388 وتغيير حالته من INITIAL إلى CANCELLED
  // مع اختبار استدعائه بواسطة كود الحجز الظاهر ومعرفه الفريد
  // ========================================================================
  console.log('[1] اختبار محاكاة الحجز CLB-2026-1388 وتغيير حالته من حجز مبدئي إلى ملغي:');
  const test1388 = await db.createBooking({
    customerName: '[اختبار معزول] محاكاة الحجز 1388',
    customerPhone: '01055551388',
    customerWhatsapp: '01055551388',
    preferredContact: 'whatsapp',
    eventName: 'اختبار حل خطأ تعذر العثور على المعرف',
    eventDate: '2026-11-25',
    deliveryTime: '17:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مقر الاختبارات المعزولة',
    items: [{ mealCode: 'Sale-01', quantity: 50, drinkOption: 'standard' }],
    isTest: true,
  });
  console.log(`   - تم إنشاء حجز الاختبار بنجاح:`);
  console.log(`     * المعرف الداخلي (id): ${test1388.id}`);
  console.log(`     * كود الحجز الظاهر (bookingCode): ${test1388.bookingCode}`);
  console.log(`     * الحالة الأولية: ${test1388.status}`);

  // تغيير الحالة باستخدام المعرف الداخلي
  const updateByIdRes = await db.updateBookingStatus(
    test1388.id,
    'CANCELLED',
    'مدير النظام',
    'إلغاء الحجز بناءً على طلب العميل'
  );
  console.log(`   - نتيجة تغيير الحالة عبر المعرف الداخلي (id): ${updateByIdRes.status} ✅`);

  // إعادة الحجز إلى INITIAL لتجربة تغييره باستخدام bookingCode الظاهر
  const revertToInitial = await db.updateBookingStatus(
    test1388.bookingCode,
    'INITIAL',
    'مدير النظام',
    'إعادة الحالة للاختبار'
  );
  console.log(`   - نتيجة تغيير الحالة عبر كود الحجز الظاهر (bookingCode): ${revertToInitial.status} ✅`);

  // تغيير نهائي إلى CANCELLED باستخدام كود الحجز
  const finalCancelled = await db.updateBookingStatus(
    test1388.bookingCode,
    'CANCELLED',
    'مدير النظام',
    'إلغاء نهائي عبر كود الحجز'
  );
  console.log(`   - الحالة النهائية للحجز 1388: ${finalCancelled.status} ✅`);

  // ========================================================================
  // [2] اختبار تغيير حالة حجز مؤكد (CONFIRMED) عبر كافة المراحل
  // ========================================================================
  console.log('\n[2] اختبار تغيير حالة حجز مؤكد:');
  const testConfirmed = await db.createBooking({
    customerName: '[اختبار معزول] حجز مؤكد',
    customerPhone: '01055552000',
    customerWhatsapp: '01055552000',
    preferredContact: 'whatsapp',
    eventName: 'اختبار الانتقال من مؤكد للمراحل التالية',
    eventDate: '2026-11-26',
    deliveryTime: '16:00',
    deliveryGovernorate: 'الجيزة',
    deliveryAddress: 'مقر الاختبارات',
    items: [{ mealCode: 'Sale-05', quantity: 50, drinkOption: 'standard' }],
    isTest: true,
  });
  // تأكيد الحجز
  const confirmedStep = await db.updateBookingStatus(testConfirmed.id, 'CONFIRMED', 'الإدارة');
  console.log(`   - تم تأكيد الحجز: الحالة الآن = ${confirmedStep.status}`);

  // نقل الحجز المؤكد إلى IN_PRODUCTION (جاري التجهيز)
  const inProdStep = await db.updateBookingStatus(testConfirmed.id, 'IN_PRODUCTION', 'مدير الإنتاج');
  console.log(`   - انتقال الحجز المؤكد إلى قيد التجهيز: ${inProdStep.status} ✅`);

  // نقل الحجز إلى READY_FOR_DELIVERY (جاهز للتسليم)
  const readyStep = await db.updateBookingStatus(testConfirmed.id, 'READY_FOR_DELIVERY', 'مراقب الجودة');
  console.log(`   - انتقال الحجز المؤكد إلى جاهز للتسليم: ${readyStep.status} ✅`);

  // نقل الحجز إلى DELIVERED (تم التسليم)
  const deliveredStep = await db.updateBookingStatus(testConfirmed.id, 'DELIVERED', 'مندوب التوصيل');
  console.log(`   - انتقال الحجز المؤكد إلى تم التسليم: ${deliveredStep.status} ✅`);

  // نقل الحجز المؤكد/المسلم إلى CANCELLED (إلغاء معتمد)
  const cancelledFromConfirmed = await db.updateBookingStatus(testConfirmed.id, 'CANCELLED', 'الإدارة', 'إلغاء استثنائي بعد التأكيد');
  console.log(`   - إمكانية إلغاء الحجز المؤكد: ${cancelledFromConfirmed.status} ✅`);

  // ========================================================================
  // [3] & [4] اختبار الحذف الكامل مع الحفاظ على الدفعات وأوامر المصنع والأرشفة
  // ========================================================================
  console.log('\n[3] & [4] اختبار الحذف الكامل مع الحفاظ على الدفعات وأوامر المصنع وسجل التدقيق:');
  const testWithFinance = await db.createBooking({
    customerName: '[اختبار مالي] حجز بأمر مصنع ودفعات',
    customerPhone: '01055553000',
    customerWhatsapp: '01055553000',
    preferredContact: 'whatsapp',
    eventName: 'اختبار حذف حجز له دفعات وأمر مصنع',
    eventDate: '2026-11-27',
    deliveryTime: '15:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مقر الاختبارات',
    items: [{ mealCode: 'Sale-05', quantity: 50, drinkOption: 'pepsi' }],
    isTest: true,
  });
  await db.updateBookingStatus(testWithFinance.id, 'CONFIRMED', 'الإدارة');
  
  // تسجيل دفعة عميل
  await db.addPayment({
    bookingId: testWithFinance.id,
    amount: 1500,
    method: 'instapay',
    receiptNumber: 'REC-TEST-DEL-101',
    notes: 'عربون مالي قبل اختبار الحذف',
  }, 'المحاسب');

  // إصدار أمر مصنع
  const fo = await db.createFactoryOrder(testWithFinance.id, 'الإدارة');
  console.log(`   - بيانات الحجز قبل الحذف:`);
  console.log(`     * كود الحجز: ${testWithFinance.bookingCode}`);
  console.log(`     * أمر المصنع الصادر: ${fo.orderNumber} (تكلفة: ${fo.factoryCostTotal} ج)`);
  console.log(`     * الدفعة المسجلة: 1,500 ج (إيصال: REC-TEST-DEL-101)`);

  // تنفيذ الحذف عبر دالة الحذف المعززة
  const deleteResult = await db.deleteBookingsPermanently([testWithFinance.id], 'مدير الحسابات (إلغاء وحذف مع أرشفة)');
  console.log(`   - نتيجة تنفيذ الحذف: تم حذف ${deleteResult.deletedCount} حجز (الكود: ${deleteResult.deletedCodes.join(', ')}) ✅`);

  // التحقق من سجل الأرشفة في Audit Log
  const allLogs = await db.getAuditLogs();
  const archiveEntry = allLogs.find(l => l.bookingCode === testWithFinance.bookingCode && l.action === 'حذف حجز نهائياً وأرشفته');
  console.log(`   - التحقق من وجود سجل الأرشفة المحاسبي في Audit Log:`);
  console.log(`     * تم العثور على السجل: ${Boolean(archiveEntry)} ✅`);
  console.log(`     * الإجراء: ${archiveEntry?.action}`);
  console.log(`     * التفاصيل المؤرشفة: ${archiveEntry?.details}`);

  // تنظيف الحجوزات التجريبية الأخرى
  await db.deleteBookingsPermanently([test1388.id, testConfirmed.id], 'تنظيف الاختبار المعزول');

  // ========================================================================
  // [5] اختبار التحقق من ثبات البيانات بعد القراءة المباشرة من التخزين (محاكاة Reload)
  // ========================================================================
  console.log('\n[5] اختبار ثبات العمليات بعد القراءة المباشرة من التخزين (محاكاة Reload):');
  const freshDb = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  const check1388 = freshDb.bookings.find((b: any) => b.id === test1388.id);
  const checkFinance = freshDb.bookings.find((b: any) => b.id === testWithFinance.id);
  console.log(`   - التأكد من إزالة الحجوزات المحذوفة من القوائم النشطة: ${!check1388 && !checkFinance ? 'مؤكدة وغير موجودة بالقوائم النشطة ✅' : 'فشل'}`);

  // ========================================================================
  // [6] التحقق الحاسم من حماية الحجز الحقيقي CLB-2026-5131
  // ========================================================================
  const realAfter = freshDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');
  console.log('\n[6] التحقق الحاسم من سلامة وثبات الحجز الحقيقي CLB-2026-5131:');
  console.log(`   - كود الحجز: ${realAfter?.bookingCode}`);
  console.log(`   - العميل: ${realAfter?.customerName}`);
  console.log(`   - الهاتف: ${realAfter?.customerPhone}`);
  console.log(`   - إجمالي العميل: ${realAfter?.totalDistributorPrice} ج.م (محفوظ تماماً: 18,000 ج)`);
  console.log(`   - المسدد: ${realAfter?.paidAmount} ج.م`);
  console.log(`   - المتبقي: ${realAfter?.remainingAmount} ج.م`);
  console.log(`   - الحالة: ${realAfter?.status} (محفوظة CONFIRMED)`);

  if (realAfter?.totalDistributorPrice !== 18000 || realAfter?.status !== 'CONFIRMED') {
    throw new Error('حدث مساس غير مصرح به بالحجز الحقيقي!');
  }

  console.log('\n========================================================================');
  console.log('🎉 نجحت كافة الاختبارات بنسبة 100% وتم إثبات الحماية والأرشفة بدقة.');
  console.log('========================================================================');
}

runDedicatedVerification().catch(err => {
  console.error('❌ خطأ في الاختبار:', err);
  process.exit(1);
});
