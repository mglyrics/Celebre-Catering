import { db } from '../src/server/db';
import * as fs from 'fs';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('🧪 اختبار آلي شامل: التحقق من تغيير كافة الحالات وحذف الحجوزات والأرشفة');
  console.log('========================================================================\n');

  // 0. التحقق الأولي من حماية الحجز الحقيقي CLB-2026-5131
  const initialDb = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  const realBookingBefore = initialDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');
  console.log('[0] فحص سلامة الحجز الحقيقي CLB-2026-5131 قبل الاختبار:');
  console.log(`   - الاسم: ${realBookingBefore?.customerName}`);
  console.log(`   - كود الحجز: ${realBookingBefore?.bookingCode}`);
  console.log(`   - إجمالي العميل: ${realBookingBefore?.totalDistributorPrice} ج.م`);
  console.log(`   - الحالة: ${realBookingBefore?.status}\n`);

  // 1. اختبار تغيير حجز مبدئي إلى ملغي بواسطة المعرف الأصيل
  console.log('[1] اختبار تغيير حجز مبدئي إلى ملغي:');
  const b1 = await db.createBooking({
    customerName: '[اختبار حالات] عميل حجز 101',
    customerPhone: '01011112233',
    customerWhatsapp: '01011112233',
    preferredContact: 'whatsapp',
    eventName: 'اختبار تبديل الحالة إلى ملغي',
    eventDate: '2026-11-20',
    deliveryTime: '15:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مقر الاختبارات',
    items: [{ mealCode: 'Sale-01', quantity: 50, drinkOption: 'standard' }],
    isTest: true,
  });
  console.log(`   - تم إنشاء الحجز: ${b1.bookingCode} (المعرف: ${b1.id})، الحالة: ${b1.status}`);

  const b1Cancelled = await db.updateBookingStatus(b1.id, 'CANCELLED', 'مدير النظام', 'إلغاء لغرض الفحص الآلي');
  console.log(`   - الحالة الجديدة: ${b1Cancelled.status} (الملاحظات: ${b1Cancelled.statusNotes})`);
  if (b1Cancelled.status !== 'CANCELLED') throw new Error('فشل الانتقال إلى CANCELLED');

  // 2. اختبار تغيير الحالة بتمرير كود الحجز الظاهر CLB- (حل المشكلة الجذرية)
  console.log('\n[2] اختبار تغيير الحالة بتمرير كود الحجز الظاهر CLB-xxxx (حل المشكلة الجذرية):');
  const b2 = await db.createBooking({
    customerName: '[اختبار حالات] عميل حجز 102',
    customerPhone: '01011112244',
    customerWhatsapp: '01011112244',
    preferredContact: 'whatsapp',
    eventName: 'اختبار الكود الظاهر',
    eventDate: '2026-11-20',
    deliveryTime: '15:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مقر الاختبارات',
    items: [{ mealCode: 'Sale-01', quantity: 50, drinkOption: 'standard' }],
    isTest: true,
  });
  console.log(`   - تم إنشاء الحجز: ${b2.bookingCode} (المعرف: ${b2.id})`);
  
  // نمرر bookingCode بدلاً من UUID
  const b2Confirmed = await db.updateBookingStatus(b2.bookingCode, 'CONFIRMED', 'مدير النظام', 'تأكيد عبر كود الحجز الظاهر');
  console.log(`   - نجح التحديث عبر كود الحجز! الحالة الجديدة: ${b2Confirmed.status}`);
  if (b2Confirmed.status !== 'CONFIRMED') throw new Error('فشل التحديث عبر كود الحجز');

  // 3. اختبار دورة الانتقال عبر جميع الحالات: CONFIRMED -> IN_PRODUCTION -> READY_FOR_DELIVERY -> DELIVERED
  console.log('\n[3] اختبار الانتقال عبر جميع الحالات التشغيلية:');
  const b2InProd = await db.updateBookingStatus(b2.id, 'IN_PRODUCTION', 'مدير الإنتاج', 'بدء تجهيز الوجبات بالمطبخ');
  console.log(`   - الحالة: ${b2InProd.status}`);
  const b2Ready = await db.updateBookingStatus(b2.id, 'READY_FOR_DELIVERY', 'مراقب الجودة', 'تم التغليف وجاهز للتسليم');
  console.log(`   - الحالة: ${b2Ready.status}`);
  const b2Delivered = await db.updateBookingStatus(b2.id, 'DELIVERED', 'مندوب التوصيل', 'تم التسليم بنجاح في الموقع');
  console.log(`   - الحالة: ${b2Delivered.status}`);
  if (b2Delivered.status !== 'DELIVERED') throw new Error('فشل دورة الحالات التشغيلية');

  // 4. اختبار إلغاء حجز مرتبط بأمر مصنع ومزامنة حالة أمر المصنع
  console.log('\n[4] اختبار إلغاء حجز مرتبط بأمر مصنع:');
  const b3 = await db.createBooking({
    customerName: '[اختبار مصنع] عميل حجز 103',
    customerPhone: '01011112255',
    customerWhatsapp: '01011112255',
    preferredContact: 'whatsapp',
    eventName: 'اختبار إلغاء أمر المصنع',
    eventDate: '2026-11-20',
    deliveryTime: '15:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مقر الاختبارات',
    items: [{ mealCode: 'Sale-01', quantity: 50, drinkOption: 'standard' }],
    isTest: true,
  });
  await db.updateBookingStatus(b3.id, 'CONFIRMED', 'الإدارة');
  const fo = await db.createFactoryOrder(b3.id, 'الإدارة');
  console.log(`   - تم إصدار أمر المصنع: ${fo.orderNumber} (الحالة: ${fo.status})`);

  const b3Cancelled = await db.updateBookingStatus(b3.id, 'CANCELLED', 'الإدارة', 'إلغاء الحجز ومزامنة أمر المصنع');
  const refreshedOrders = await db.getFactoryOrders();
  const linkedFo = refreshedOrders.find(o => o.orderNumber === fo.orderNumber);
  console.log(`   - حالة الحجز بعد الإلغاء: ${b3Cancelled.status}`);
  console.log(`   - حالة أمر المصنع بعد إلغاء الحجز: ${linkedFo?.status} (تم تعليقه وإيقافه)`);
  if (linkedFo?.status !== 'CANCELLED') throw new Error('لم يتم تعليق أمر المصنع عند إلغاء الحجز');

  // 5. اختبار حذف حجز مبدئي
  console.log('\n[5] اختبار حذف حجز مبدئي:');
  const delRes1 = await db.deleteBookingsPermanently([b1.id], 'اختبار حذف مبدئي');
  console.log(`   - نتيجة الحذف: تم حذف ${delRes1.deletedCount} حجز (الأكواد: ${delRes1.deletedCodes.join(', ')})`);
  if (delRes1.deletedCount !== 1) throw new Error('فشل حذف الحجز المبدئي');

  // 6. اختبار حذف حجز مؤكد ومسلم
  console.log('\n[6] اختبار حذف حجز تم تسليمه (DELIVERED):');
  const delRes2 = await db.deleteBookingsPermanently([b2.id], 'اختبار حذف حجز مسلم');
  console.log(`   - نتيجة الحذف: تم حذف ${delRes2.deletedCount} حجز (الأكواد: ${delRes2.deletedCodes.join(', ')})`);
  if (delRes2.deletedCount !== 1) throw new Error('فشل حذف الحجز المسلم');

  // 7. اختبار حذف حجز له دفعات مالية وأمر مصنع مع ضمان الأرشفة
  console.log('\n[7] اختبار حذف حجز له دفعات مالية وأمر مصنع مع حفظ سجل المراجعة:');
  const b4 = await db.createBooking({
    customerName: '[اختبار أرشفة] عميل حجز 104',
    customerPhone: '01011112266',
    customerWhatsapp: '01011112266',
    preferredContact: 'whatsapp',
    eventName: 'اختبار حذف وأرشفة مالية',
    eventDate: '2026-11-20',
    deliveryTime: '15:00',
    deliveryGovernorate: 'القاهرة',
    deliveryAddress: 'مقر الاختبارات',
    items: [{ mealCode: 'Sale-01', quantity: 50, drinkOption: 'standard' }],
    isTest: true,
  });
  await db.updateBookingStatus(b4.id, 'CONFIRMED', 'الإدارة');
  await db.addPayment({
    bookingId: b4.id,
    amount: 1000,
    method: 'instapay',
    receiptNumber: 'REC-ARCHIVE-TEST-001',
    notes: 'عربون اختباري للأرشفة',
  }, 'المحاسب');
  await db.createFactoryOrder(b4.id, 'الإدارة');

  const b4Fresh = await db.resolveBookingAnyIdentifier(b4.id);
  console.log(`   - الحجز قبل الحذف: إجمالي: ${b4Fresh?.totalDistributorPrice} ج، المسدد: ${b4Fresh?.paidAmount} ج، الدفعات: ${b4Fresh?.payments?.length}`);

  const delRes4 = await db.deleteBookingsPermanently([b4.id], 'محاسب الحسابات (طلب إلغاء وأرشفة نهائية)');
  console.log(`   - نتيجة الحذف: تم حذف ${delRes4.deletedCount} حجز (الأكواد: ${delRes4.deletedCodes.join(', ')})`);

  // التحقق من وجود سجل الأرشفة في Audit Log
  const finalAuditLogs = await db.getAuditLogs();
  const archiveLog = finalAuditLogs.find(a => a.bookingCode === b4.bookingCode && a.action === 'حذف حجز نهائياً وأرشفته');
  console.log(`   - سجل الأرشفة المحفوظ:`);
  console.log(`     * الإجراء: ${archiveLog?.action}`);
  console.log(`     * المنفذ: ${archiveLog?.performedBy}`);
  console.log(`     * التفاصيل المؤرشفة: ${archiveLog?.details}`);
  if (!archiveLog) throw new Error('فشل توثيق وأرشفة سجل الحجز المالي في سجل التدقيق');

  // تنظيف الحجز b3 المتبقي
  await db.deleteBookingsPermanently([b3.id], 'تنظيف الاختبار');

  // 8. اختبار محاولة حذف الحجز الحقيقي المحمي CLB-2026-5131
  console.log('\n[8] اختبار محاولة حذف الحجز الحقيقي CLB-2026-5131:');
  const tryDeleteReal = await db.deleteBookingsPermanently([realBookingBefore.id], 'محاولة اختراق');
  console.log(`   - النتيجة: تم تخطي الحذف ومنعه: ${tryDeleteReal.skipped[0]?.reason}`);
  if (tryDeleteReal.deletedCount !== 0) throw new Error('تم حذف الحجز الحقيقي بشكل كارثي!');

  // 9. التحقق النهائي من سلامة الحجز الحقيقي في التخزين
  const finalDb = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  const realBookingAfter = finalDb.bookings.find((b: any) => b.bookingCode === 'CLB-2026-5131');
  console.log('\n[9] التحقق النهائي من ثبات الحجز الحقيقي CLB-2026-5131:');
  console.log(`   - كود الحجز: ${realBookingAfter.bookingCode}`);
  console.log(`   - اسم العميل: ${realBookingAfter.customerName}`);
  console.log(`   - إجمالي العميل: ${realBookingAfter.totalDistributorPrice} ج.م (محفوظ 18,000 ج)`);
  console.log(`   - الحالة: ${realBookingAfter.status} (محفوظ CONFIRMED)`);

  if (realBookingAfter.totalDistributorPrice !== 18000 || realBookingAfter.status !== 'CONFIRMED') {
    throw new Error('حدث تغيير غير مصرح به على بيانات الحجز الحقيقي!');
  }

  console.log('\n========================================================================');
  console.log('🎉 نجحت جميع اختبارات تغيير الحالات والحذف والأرشفة بنسبة 100%!');
  console.log('========================================================================');
}

runTestSuite().catch(err => {
  console.error('❌ خطأ في الاختبار:', err);
  process.exit(1);
});
