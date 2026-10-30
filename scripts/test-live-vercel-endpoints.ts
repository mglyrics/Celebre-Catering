import https from 'https';

function request(method: string, urlPath: string, data?: any, headers: Record<string, string> = {}): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: any }> {
  return new Promise((resolve) => {
    const bodyStr = data ? JSON.stringify(data) : undefined;
    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (bodyStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }
    const req = https.request('https://www.celebre-eg.com' + urlPath, {
      method,
      headers: reqHeaders,
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, headers: res.headers, body: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode || 0, headers: res.headers, body: responseData });
        }
      });
    });
    req.on('error', err => resolve({ status: 0, headers: {}, body: { error: err.message } }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function testAdminLive() {
  console.log('====================================================');
  console.log('  LIVE VERCEL ENDPOINTS AUDIT: https://www.celebre-eg.com');
  console.log('====================================================\n');

  console.log('--- 1. Testing Admin Login on Live Vercel ---');
  const loginRes = await request('POST', '/api/admin/auth/login', {
    username: 'admin',
    password: process.env.ADMIN_PASSWORD || 'Celebre@2026'
  });
  console.log('Login Status:', loginRes.status);
  
  const token = loginRes.body?.token;
  const cookie = loginRes.headers['set-cookie'];
  const cookieStr = Array.isArray(cookie) ? cookie.join('; ') : (cookie || '');
  console.log('Logged in user:', loginRes.body?.user?.username);

  const authHeaders: Record<string, string> = {
    'Authorization': 'Bearer ' + token,
    'Cookie': cookieStr
  };

  const bookingCode = 'CLB-2026-6887';

  console.log(`\n--- 2. Testing Admin Edit on Live Vercel for Booking ${bookingCode} ---`);
  // Attempt to edit to 30 meals with status CONFIRMED (must be rejected)
  const editFailRes = await request('PUT', `/api/admin/bookings/${bookingCode}`, {
    status: 'CONFIRMED',
    items: [
      {
        mealCode: 'Sale-12',
        quantity: 30,
        drinkOption: 'standard'
      }
    ]
  }, authHeaders);
  console.log('Edit < 50 Meals Status (Expected 400):', editFailRes.status);
  console.log('Edit < 50 Meals Response:', editFailRes.body?.error || editFailRes.body);

  console.log(`\n--- 3. Testing Valid Admin Edit with Recalculation ---`);
  // 30 of Sale-01 with no_juice (50-5=45) + 30 of Sale-12 with pepsi (44+10=54) -> Total: 2970
  const editSuccessRes = await request('PUT', `/api/admin/bookings/${bookingCode}`, {
    customerName: 'فحص تجريبي Vercel معدل',
    items: [
      {
        mealCode: 'Sale-01',
        quantity: 30,
        drinkOption: 'no_juice'
      },
      {
        mealCode: 'Sale-12',
        quantity: 30,
        drinkOption: 'pepsi'
      }
    ]
  }, authHeaders);
  console.log('Valid Edit Status (Expected 200):', editSuccessRes.status);
  console.log('Valid Edit Total Meals:', editSuccessRes.body?.booking?.totalMealsCount);
  console.log('Valid Edit Total Distributor Price:', editSuccessRes.body?.booking?.totalDistributorPrice);

  console.log(`\n--- 4. Testing Factory WhatsApp Preparation on Live Vercel ---`);
  const waRes = await request('POST', `/api/admin/bookings/${bookingCode}/factory-order/whatsapp`, {
    factoryPhone: '201284484868'
  }, authHeaders);
  console.log('WhatsApp Gen Status (Expected 200):', waRes.status);
  console.log('WhatsApp Link:', waRes.body?.whatsappUrl ? waRes.body.whatsappUrl.substring(0, 55) + '...' : 'none');
  console.log('Order Status (Expected READY_TO_SEND):', waRes.body?.factoryOrder?.status);

  const foId = waRes.body?.factoryOrder?.id;
  console.log(`\n--- 5. Testing Manual Confirmation for Order ${foId} on Live Vercel ---`);
  if (foId) {
    const confirmRes = await request('POST', `/api/admin/factory-orders/${foId}/confirm-sent`, {}, authHeaders);
    console.log('Confirm Status (Expected 200):', confirmRes.status);
    console.log('Order Status After Confirmation (Expected MANUALLY_CONFIRMED):', confirmRes.body?.factoryOrder?.status);
  }

  console.log(`\n--- 6. Updating Meal 12 ingredients to include "باتية" on Live Vercel ---`);
  const updateMealRes = await request('PUT', '/api/admin/meals/Sale-12', {
    name: 'باتية',
    ingredients: 'قطعة جاتوة مغلفة + باتية + عصير بخيرة + شوكة ومنديل'
  }, authHeaders);
  console.log('Update Meal 12 Status (Expected 200):', updateMealRes.status);

  console.log(`\n--- 7. Checking Meal 12 on Live Vercel (/api/meals) ---`);
  const mealsRes = await request('GET', '/api/meals');
  const meal12 = mealsRes.body?.find?.((m: any) => m.code === 'Sale-12');
  console.log('Sale-12 on Live Vercel:');
  console.log('  Name:', meal12?.name);
  console.log('  Ingredients:', meal12?.ingredients);
  console.log('  Distributor Price:', meal12?.distributorPrice);
}

testAdminLive().catch(console.error);
