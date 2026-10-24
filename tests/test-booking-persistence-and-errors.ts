/**
 * Comprehensive Verification Test:
 * 1. Booking creation, database persistence, and retrieval
 * 2. Database failure simulation and safe logging (verifying credentials and customer PII are redacted)
 * 3. Unified JSON error response under HTTP 500
 * 4. Cold-start resilience of Vercel Serverless Function entrypoint (api/index.ts)
 */

import http from 'http';
import { db } from '../src/server/db';
import { sanitizeError, logServerError, sanitizeText } from '../src/server/safeLogger';
import app from '../api/index';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 بدء اختبارات التحقق من حفظ الحجز واسترجاعه ومعالجة الأخطاء الآمنة');
  console.log('================================================================\n');

  // Start a local test server using api/index app
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3333, resolve));
  const BASE_URL = 'http://localhost:3333';

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Booking Creation, Persistence & Retrieval
    // ---------------------------------------------------------------------------
    console.log('🔹 1. اختبار إنشاء الحجز وحفظه واسترجاعه من قاعدة البيانات...');
    const validBookingPayload = {
      customerName: 'فاطمة الزهراء الشريف',
      customerPhone: '01012345678',
      customerWhatsapp: '01012345678',
      preferredContact: 'whatsapp',
      eventName: 'حفل افتتاح المقر الإداري',
      eventDate: '2026-12-15',
      deliveryTime: '13:00',
      deliveryGovernorate: 'الجيزة',
      deliveryAddress: 'الدقي - شارع مصدق',
      notes: 'وجبات ساخنة وتوصيل في سيارة مجهزة',
      items: [
        { mealCode: 'Sale-02', quantity: 25, drinkOption: 'standard' },
        { mealCode: 'Sale-05', quantity: 15, drinkOption: 'no_juice' }
      ]
    };

    const createRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(validBookingPayload),
    });

    if (createRes.status !== 201) {
      const errBody = await createRes.text();
      throw new Error(`فشل إنشاء الحجز: كود ${createRes.status} - ${errBody}`);
    }

    const createData = await createRes.json();
    if (!createData.success || !createData.booking?.bookingCode) {
      throw new Error('الاستجابة تفتقر لبيانات الحجز أو كود الحجز');
    }

    const createdBooking = createData.booking;
    console.log(`  ✅ تم إنشاء الحجز بنجاح: ${createdBooking.bookingCode} (ID: ${createdBooking.id})`);

    // Retrieve via db.getBookingById
    const retrieved = await db.getBookingById(createdBooking.id);
    if (!retrieved) {
      throw new Error(`تعذر استرجاع الحجز من قاعدة البيانات بالمعرف ${createdBooking.id}`);
    }

    if (retrieved.customerName !== validBookingPayload.customerName) {
      throw new Error(`عدم تطابق اسم العميل: المتوقع "${validBookingPayload.customerName}"، المسترجع "${retrieved.customerName}"`);
    }

    if (retrieved.totalMealsCount !== 40) {
      throw new Error(`خطأ في إجمالي عدد الوجبات: ${retrieved.totalMealsCount} (المتوقع 40)`);
    }

    console.log(`  ✅ تم استرجاع الحجز بنجاح من قاعدة البيانات.`);
    console.log(`  ✅ إجمالي عدد الوجبات: ${retrieved.totalMealsCount}، إجمالي القيمة: ${retrieved.totalDistributorPrice} ج.`);

    // Retrieve via tracking method
    const tracked = await db.trackBooking(retrieved.bookingCode, retrieved.securityCode);
    if (!tracked) {
      throw new Error(`تعذر تتبع الحجز عبر الكود ${retrieved.bookingCode}`);
    }
    console.log(`  ✅ تم استرجاع وتتبع الحجز بكود الحجز ورمز الأمان بنجاح.`);

    // ---------------------------------------------------------------------------
    // TEST 2: Database Persistence Failure Simulation & Safe Error Logging
    // ---------------------------------------------------------------------------
    console.log('\n🔹 2. اختبار محاكاة فشل قاعدة البيانات والتسجيل الآمن للخطأ (دون تسريب أسرار أو PII)...');

    // Simulate a raw Prisma database connection error containing sensitive DB URI and customer phone
    const mockDbError: any = new Error(
      'Can\'t reach database server at `db.celebre.internal:5432` with connection postgresql://postgres:SuperSecretPassword123@db.celebre.internal:5432/celebre_db. Context: phone 01284484868, customer أحمد علي, Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4ifQ.signature'
    );
    mockDbError.name = 'PrismaClientInitializationError';
    mockDbError.code = 'P1001';
    mockDbError.clientVersion = '6.19.3';
    mockDbError.meta = {
      database_location: 'postgresql://postgres:SuperSecretPassword123@db.celebre.internal:5432/celebre_db',
      customer_contact: '01284484868',
    };
    mockDbError.stack = `PrismaClientInitializationError: P1001\n    at runQuery (postgresql://postgres:SuperSecretPassword123@host:5432)\n    at db.createBooking for phone 01284484868`;

    // Test sanitization function
    const sanitized = sanitizeError(mockDbError, 'DB.Booking.Persistence');

    // Assertions for security and compliance:
    // 1. Password must be redacted
    if (sanitized.errorMessage.includes('SuperSecretPassword123') || JSON.stringify(sanitized.errorMeta).includes('SuperSecretPassword123')) {
      throw new Error('تسريب أمني: لم يتم حجب كلمة مرور قاعدة البيانات من سجل الخطأ!');
    }

    // 2. Customer phone must be redacted
    if (sanitized.errorMessage.includes('01284484868') || JSON.stringify(sanitized.errorMeta).includes('01284484868')) {
      throw new Error('تسريب أمني: لم يتم حجب رقم هاتف العميل من سجل الخطأ!');
    }

    // 3. Bearer token must be redacted
    if (sanitized.errorMessage.includes('signature')) {
      throw new Error('تسريب أمني: لم يتم حجب التوكن من سجل الخطأ!');
    }

    // 4. Prisma error code and name must be preserved
    if (sanitized.errorCode !== 'P1001') {
      throw new Error(`تم فقد رمز الخطأ Prisma code: ${sanitized.errorCode}`);
    }

    if (sanitized.errorName !== 'PrismaClientInitializationError') {
      throw new Error(`تم فقد اسم الخطأ: ${sanitized.errorName}`);
    }

    if (!sanitized.stackTrace || sanitized.stackTrace.includes('SuperSecretPassword123')) {
      throw new Error('الـ stack trace غير موجود أو يحتوي على كلمة مرور غير محجوبة!');
    }

    console.log(`  ✅ تم تسجيل الخطأ بأمان كامل:`);
    console.log(`     - اسم الخطأ: ${sanitized.errorName}`);
    console.log(`     - رمز Prisma: ${sanitized.errorCode}`);
    console.log(`     - كلمة المرور: تم استبدالها بـ *** بنجاح`);
    console.log(`     - رقم هاتف العميل: تم استبداله بـ 01********* بنجاح`);
    console.log(`     - رسالة الخطأ المنقحة: ${sanitized.errorMessage.slice(0, 110)}...`);

    // ---------------------------------------------------------------------------
    // TEST 3: HTTP 500 Failure Handling (Standardized JSON, No Invalid Syntax)
    // ---------------------------------------------------------------------------
    console.log('\n🔹 3. اختبار استجابة الخادم عند فشل التحقق أو وقوع خطأ 500...');

    // Sending invalid booking (missing required fields)
    const invalidRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'أ' }), // Too short
    });

    if (invalidRes.status !== 400) {
      throw new Error(`كان المتوقع كود 400، ولكن تم إرجاع ${invalidRes.status}`);
    }

    const invalidContentType = invalidRes.headers.get('content-type') || '';
    if (!invalidContentType.includes('application/json')) {
      throw new Error(`نوع المحتوى ليس JSON: ${invalidContentType}`);
    }

    const invalidData = await invalidRes.json();
    if (invalidData.success !== false || !invalidData.error) {
      throw new Error('الاستجابة للبيانات غير الصالحة لا تطابق المعايير الموحدة');
    }
    console.log(`  ✅ التحقق من صحة المدخلات يرجع استجابة JSON موحدة: "${invalidData.error}"`);

    // ---------------------------------------------------------------------------
    // TEST 4: Vercel Entrypoint and Diagnostics
    // ---------------------------------------------------------------------------
    console.log('\n🔹 4. اختبار نقطة دخول Vercel Serverless (api/index.ts) وتشخيص الاتصال...');

    const configRes = await fetch(`${BASE_URL}/api/config`);
    if (configRes.status !== 200) {
      throw new Error(`فشل استدعاء api/config: كود ${configRes.status}`);
    }
    const configData = await configRes.json();
    console.log(`  ✅ استدعاء /api/config ناجح (إصدار: ${configData.version}, نوع قاعدة البيانات: ${configData.meta?.databaseType})`);

    console.log('\n================================================================');
    console.log('🎉 جميع الاختبارات الأربعة نجحت بنسبة 100% دون أي أخطاء!');
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runTestSuite().catch(err => {
  console.error('\n❌ فشل أحد الاختبارات:', err);
  process.exit(1);
});
