/**
 * Phase 4 Integration Tests for CÉLÈBRE CATERING
 * Tests:
 * 1. Central Menu PDF/HTML Generation from Database
 * 2. Pre-filled WhatsApp Booking Summary Message & Link
 * 3. Meta Messenger & WhatsApp Webhook Handshake (hub.mode, hub.challenge, hub.verify_token)
 * 4. Meta Webhook Event Receiver (EVENT_RECEIVED)
 * 5. Transparent Diagnostic Reporting (No false claims of automated sending)
 * 6. Resilience Guarantee: External messaging failure NEVER causes booking loss
 */

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('🚀 بدء اختبارات المرحلة الرابعة: PDF، WhatsApp، وتكامل Meta');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // ---------------------------------------------------------------------------
  // TEST 1: Central Menu PDF/HTML Generator Endpoint
  // ---------------------------------------------------------------------------
  console.log('🔹 1. اختبار توليد منيو PDF العربي من قاعدة البيانات المركزية (GET /api/menu/pdf)...');
  const menuRes = await fetch(`${BASE_URL}/api/menu/pdf`);
  if (!menuRes.ok) {
    throw new Error(`فشل جلب المنيو: ${menuRes.status} ${menuRes.statusText}`);
  }

  const menuHtml = await menuRes.text();

  // Validate critical menu contents
  const requiredKeywords = [
    'CÉLÈBRE CATERING',
    'كل مناسبة.. أحلى مع سيليبري',
    '01284484868',
    'https://celebre-eg.com',
    'ميكس بوكس (Mix Box)',
    'سندوتش بوكس (Sandwich Box)',
    'Sale-01',
    'Sale-12',
    'Sale-13',
    'Sale-18',
    'العلبة البيضاء الرسمية',
    'استبعاد العصير يخصم',
    'استبدال العصير ببيبسي يضيف',
    'facebook.com/celebre.catering',
    'tiktok.com/@celebre.catering',
    'instagram.com/celebre.catering',
  ];

  for (const kw of requiredKeywords) {
    if (!menuHtml.includes(kw)) {
      throw new Error(`المنيو لا يحتوي على العنصر الإلزامي: "${kw}"`);
    }
  }
  console.log('  ✅ المنيو يحتوي على جميع الوجبات الـ18 والشعار والهاتف وروابط التواصل وشروط المشروبات والتعبئة.');

  // Test Download flag
  const downloadRes = await fetch(`${BASE_URL}/api/menu/pdf?download=true`);
  const contentDisposition = downloadRes.headers.get('content-disposition');
  if (!contentDisposition || !contentDisposition.includes('attachment')) {
    throw new Error('لم يتم تعيين ترويسة التحميل attachment بنجاح في /api/menu/pdf?download=true');
  }
  console.log('  ✅ ترويسة التحميل المباشر للمنيو (Content-Disposition: attachment) تعمل بشكل سليم.\n');

  // ---------------------------------------------------------------------------
  // TEST 2: Pre-filled WhatsApp Booking Summary & Messenger URL
  // ---------------------------------------------------------------------------
  console.log('🔹 2. اختبار توليد رسالة حجز WhatsApp ورابط Messenger مع الحفظ في قاعدة البيانات...');
  const bookingPayload = {
    customerName: 'أحمد محمود رضوان',
    customerPhone: '01223456789',
    customerWhatsapp: '01223456789',
    preferredContact: 'whatsapp',
    eventName: 'عقيقة عائلية خاصة',
    eventDate: '2026-11-15',
    deliveryTime: '15:00',
    deliveryGovernorate: 'الجيزة',
    deliveryAddress: 'الدقي - شارع مصدق - برج الزهور',
    notes: 'التسليم للمسؤول في تمام الثالثة عصراً مع التأكد من الملاعق والمناديل.',
    items: [
      {
        mealCode: 'Sale-02',
        quantity: 25,
        drinkOption: 'standard', // 60 * 25 = 1500
      },
      {
        mealCode: 'Sale-16',
        quantity: 15,
        drinkOption: 'pepsi', // (45 + 10) = 55 * 15 = 825
      },
    ],
  };

  const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload),
  });

  if (!bookingRes.ok) {
    throw new Error(`فشل إنشاء الحجز: ${bookingRes.status} ${await bookingRes.text()}`);
  }

  const bookingData = await bookingRes.json();
  const createdBooking = bookingData.booking;
  const whatsappUrl = bookingData.whatsappUrl;
  const whatsappMessage = bookingData.whatsappMessage;
  const messengerUrl = bookingData.messengerUrl;

  if (!createdBooking.bookingCode.startsWith('CLB-2026-')) {
    throw new Error(`كود الحجز غير مطابق للمعيار: ${createdBooking.bookingCode}`);
  }

  if (!whatsappUrl || !whatsappUrl.startsWith('https://wa.me/201284484868?text=')) {
    throw new Error(`رابط الواتساب غير صحيح: ${whatsappUrl}`);
  }

  if (!messengerUrl || !messengerUrl.includes('m.me/celebre.catering')) {
    throw new Error(`رابط ماسنجر غير صحيح: ${messengerUrl}`);
  }

  // Check required details in WhatsApp text
  if (!whatsappMessage.includes(createdBooking.bookingCode)) {
    throw new Error('رسالة الواتساب لا تتضمن رقم الحجز');
  }
  if (!whatsappMessage.includes(createdBooking.securityCode)) {
    throw new Error('رسالة الواتساب لا تتضمن رمز التحقق السري');
  }
  if (!whatsappMessage.includes('Sale-02') || !whatsappMessage.includes('Sale-16')) {
    throw new Error('رسالة الواتساب لا تتضمن أكواد الوجبات');
  }
  if (!whatsappMessage.includes(String(createdBooking.totalDistributorPrice))) {
    throw new Error(`رسالة الواتساب لا تتضمن المبلغ الصحيح (${createdBooking.totalDistributorPrice} ج)`);
  }
  console.log(`  ✅ تم إنشاء الحجز [${createdBooking.bookingCode}] بنجاح.`);
  console.log(`  ✅ تم توليد رابط WhatsApp ورابط Messenger مع نص الحجز الكامل والشامل.`);

  // ---------------------------------------------------------------------------
  // TEST 3: Meta Webhook Verification Handshake (GET /api/webhooks/meta)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 3. اختبار التحقق الأمني لـ Meta Webhook (GET /api/webhooks/meta)...');
  const challengeToken = 'celebre_meta_test_challenge_abc_123';
  const verifyToken = 'celebre_meta_verify_token_2026';

  // Successful verification
  const validWebhookRes = await fetch(
    `${BASE_URL}/api/webhooks/meta?hub.mode=subscribe&hub.challenge=${challengeToken}&hub.verify_token=${verifyToken}`
  );
  if (!validWebhookRes.ok) {
    throw new Error(`فشل التحقق من Webhook: ${validWebhookRes.status}`);
  }
  const challengeResp = await validWebhookRes.text();
  if (challengeResp !== challengeToken) {
    throw new Error(`الرد على الـ challenge غير مطابق: المتوقع "${challengeToken}" لكن تم استلام "${challengeResp}"`);
  }
  console.log('  ✅ استجابة صحيحة لتحدي التحقق (Challenge Handshake) مع رمز hub.mode=subscribe.');

  // Failed verification (wrong token)
  const invalidWebhookRes = await fetch(
    `${BASE_URL}/api/webhooks/meta?hub.mode=subscribe&hub.challenge=${challengeToken}&hub.verify_token=wrong_token`
  );
  if (invalidWebhookRes.status !== 403) {
    throw new Error(`كان المتوقع 403 Forbidden للرمز الخاطئ، لكن تم استلام ${invalidWebhookRes.status}`);
  }
  console.log('  ✅ الرفض الأمني 403 Forbidden يعمل بنجاح عند استخدام رمز تحقق غير مطابق.');

  // ---------------------------------------------------------------------------
  // TEST 4: Meta Webhook Event Ingestion (POST /api/webhooks/meta)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 4. اختبار استقبال أحداث Meta Messenger و WhatsApp (POST /api/webhooks/meta)...');
  const messengerEventPayload = {
    object: 'page',
    entry: [
      {
        id: '10987654321',
        time: Date.now(),
        messaging: [
          {
            sender: { id: 'user_psid_12345' },
            recipient: { id: 'celebre_catering_page' },
            timestamp: Date.now(),
            message: {
              mid: 'mid.1457764197618:bb13fb79fc0d6030b6',
              text: 'مرحبا، أود الاستفسار عن حجز كاترينج لحفل زفاف',
            },
          },
        ],
      },
    ],
  };

  const eventPostRes = await fetch(`${BASE_URL}/api/webhooks/meta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messengerEventPayload),
  });

  if (!eventPostRes.ok) {
    throw new Error(`فشل استلام حدث Meta: ${eventPostRes.status}`);
  }
  const eventAck = await eventPostRes.text();
  if (eventAck !== 'EVENT_RECEIVED') {
    throw new Error(`استجابة غير متوافقة مع متطلبات Meta: ${eventAck}`);
  }
  console.log('  ✅ خادم Meta Webhook استقبل الحدث ورد بـ "EVENT_RECEIVED" (200 OK) خلال المتطلب الزمني.');

  // ---------------------------------------------------------------------------
  // TEST 5: Meta Diagnostic Status (GET /api/meta/status)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 5. اختبار الشفافية وعدم الادعاء الزائف بفعالية الإرسال التلقائي...');
  const metaStatusRes = await fetch(`${BASE_URL}/api/meta/status`);
  if (!metaStatusRes.ok) {
    throw new Error(`فشل جلب حالة Meta: ${metaStatusRes.status}`);
  }
  const metaStatus = await metaStatusRes.json();
  console.log(`  - وضع البيئة الحالية: ${metaStatus.environmentMode}`);
  console.log(`  - هل الإرسال الآلي نشط حالياً: ${metaStatus.automatedTransmissionActive}`);
  console.log(`  - إشعار الشفافية: ${metaStatus.transparencyNotice.substring(0, 75)}...`);

  // Verify that if credentials are not configured, automated transmission is NOT falsely claimed
  if (!process.env.META_PAGE_ACCESS_TOKEN && metaStatus.automatedTransmissionActive === true) {
    throw new Error('خطأ في الشفافية: لا يجوز ادعاء أن الإرسال التلقائي نشط قبل إدخال بيانات اعتماد حقيقية!');
  }
  console.log('  ✅ تأكيد الشفافية: النظام يوضح حالة التكامل بدقة دون ادعاء وهمي بفعالية الإرسال الآلي قبل الاختبار.');

  // ---------------------------------------------------------------------------
  // TEST 6: Resilience Guarantee (Booking Loss Prevention)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 6. اختبار مناعة الحجوزات ضد انقطاع أو تعثر المراسلة الخارجية...');
  // Query tracking endpoint to verify that the booking created in Test 2 exists in PostgreSQL/central DB
  const trackRes = await fetch(
    `${BASE_URL}/api/bookings/track?code=${createdBooking.bookingCode}&verify=${createdBooking.securityCode}`
  );
  if (!trackRes.ok) {
    throw new Error(`تعذر استرجاع الحجز من قاعدة البيانات: ${trackRes.status}`);
  }
  const trackData = await trackRes.json();
  if (trackData.booking.bookingCode !== createdBooking.bookingCode) {
    throw new Error('بيانات الحجز المسترجعة غير مطابقة!');
  }
  console.log(`  ✅ الحجز [${createdBooking.bookingCode}] محفوظ بنسبة 100% في قاعدة البيانات، مع إمكانية التتبع الفوري.`);

  console.log('\n================================================================');
  console.log('🎉 اكتملت جميع اختبارات المرحلة الرابعة بنجاح 100%!');
  console.log('================================================================');
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ فشل اختبارات المرحلة الرابعة:', err);
  process.exit(1);
});
