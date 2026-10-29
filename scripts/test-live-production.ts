import https from 'https';

const BASE_URL = 'https://www.celebre-eg.com';

function request(urlPath: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: any; rawBody: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Celebre-Security-Audit/1.0)',
      ...options.headers
    };
    if (bodyStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    const req = https.request(url, {
      method: options.method || 'GET',
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: parsed,
          rawBody: data
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function runLiveAudit() {
  console.log('=== [1] HEALTH CHECK ON PRODUCTION ===');
  const healthRes = await request('/api/health');
  console.log('Health Status:', healthRes.status);
  console.log('Health Body:', JSON.stringify(healthRes.body, null, 2));

  console.log('\n=== [2] CHECK CUSTOMER HOMEPAGE FOR HIDDEN ADMIN LINKS ===');
  const homeRes = await request('/');
  const homeHtml = homeRes.rawBody || '';
  const hasAdminPortalText = homeHtml.includes('بوابة الإدارة') || homeHtml.includes('دخول الإدارة');
  const hasLockIconLink = homeHtml.includes('href="#admin"') || homeHtml.includes('href="/admin"');
  const mentionsPassword = homeHtml.includes('Celebre@2026');
  console.log('Customer HTML size:', homeHtml.length);
  console.log('Contains admin text ("بوابة الإدارة"):', hasAdminPortalText);
  console.log('Contains admin href link:', hasLockIconLink);
  console.log('Exposes admin credentials in HTML:', mentionsPassword);

  console.log('\n=== [3] ADMIN LOGIN TEST ===');
  const loginRes = await request('/api/admin/auth/login', {
    method: 'POST',
    body: {
      username: 'admin',
      password: 'Celebre@2026'
    }
  });
  console.log('Login Status:', loginRes.status);
  console.log('Login Success:', loginRes.body?.success);
  console.log('Login User:', loginRes.body?.user);
  console.log('Set-Cookie Header:', loginRes.headers['set-cookie']);
  const token = loginRes.body?.token;

  if (!token) {
    console.error('Cannot proceed without token!');
    return;
  }

  console.log('\n=== [4] AUTH/ME VERIFICATION WITH TOKEN ===');
  const meRes = await request('/api/admin/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Auth/Me Status:', meRes.status);
  console.log('Auth/Me Body:', JSON.stringify(meRes.body));

  console.log('\n=== [5] PASSWORD CHANGE VALIDATION CHECKS ===');
  const mismatchRes = await request('/api/admin/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      currentPassword: 'Celebre@2026',
      newPassword: 'NewPassword@2026',
      confirmPassword: 'MismatchPassword@2026'
    }
  });
  console.log('Mismatch confirmation test status:', mismatchRes.status);
  console.log('Mismatch confirmation response:', mismatchRes.body);

  const shortPassRes = await request('/api/admin/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      currentPassword: 'Celebre@2026',
      newPassword: 'short',
      confirmPassword: 'short'
    }
  });
  console.log('Short new password test status:', shortPassRes.status);
  console.log('Short new password response:', shortPassRes.body);

  const samePassRes = await request('/api/admin/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      currentPassword: 'Celebre@2026',
      newPassword: 'Celebre@2026',
      confirmPassword: 'Celebre@2026'
    }
  });
  console.log('Same current/new password test status:', samePassRes.status);
  console.log('Same current/new password response:', samePassRes.body);

  const wrongOldPassRes = await request('/api/admin/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      currentPassword: 'WrongOldPassword123!',
      newPassword: 'NewValidPassword@2026',
      confirmPassword: 'NewValidPassword@2026'
    }
  });
  console.log('Wrong current password test status:', wrongOldPassRes.status);
  console.log('Wrong current password response:', wrongOldPassRes.body);

  console.log('\n=== [6] CREATE TEST BOOKING (isTest: true) ===');
  const testBookingRes = await request('/api/bookings', {
    method: 'POST',
    body: {
      customerName: 'فحص أمني تجريبي - نظام سيليبري',
      customerPhone: '01000000001',
      customerWhatsapp: '01000000001',
      preferredContact: 'whatsapp',
      eventName: 'تجربة حجز تدقيق أمني',
      eventDate: '2026-11-15',
      deliveryTime: '14:00',
      deliveryGovernorate: 'القاهرة',
      deliveryAddress: 'المعادي - شارع النصر التجريبي',
      notes: 'حجز فحص برمجي أمني لاختبار دورة المصنع والحذف الآمن',
      isTest: true,
      items: [
        { mealCode: 'Sale-01', quantity: 10, drinkOption: 'standard' },
        { mealCode: 'Sale-02', quantity: 5, drinkOption: 'pepsi' }
      ]
    }
  });
  console.log('Create Test Booking Status:', testBookingRes.status);
  const createdBooking = testBookingRes.body?.booking || testBookingRes.body;
  console.log('Created Booking Code:', createdBooking?.bookingCode);
  console.log('Created Booking ID:', createdBooking?.id);
  console.log('isTest Flag:', createdBooking?.isTest);
  console.log('Total Meals Count:', createdBooking?.totalMealsCount);
  console.log('Total Distributor Price:', createdBooking?.totalDistributorPrice);

  const testBookingId = createdBooking?.id;

  if (testBookingId) {
    console.log('\n=== [7] FACTORY ORDER PREVIEW (MASKING DISTRIBUTOR PRICES) ===');
    const previewRes = await request(`/api/admin/bookings/${testBookingId}/factory-preview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Factory Preview Status:', previewRes.status);
    console.log('Factory Preview Data:', JSON.stringify(previewRes.body, null, 2));

    console.log('\n=== [8] CREATE FACTORY ORDER FROM TEST BOOKING ===');
    const factoryOrderRes = await request(`/api/admin/bookings/${testBookingId}/factory-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        notes: 'ملاحظات تشغيل تجريبية للمصنع'
      }
    });
    console.log('Factory Order Status:', factoryOrderRes.status);
    console.log('Factory Order Body:', JSON.stringify(factoryOrderRes.body, null, 2));

    console.log('\n=== [9] TEST DUPLICATE FACTORY ORDER PREVENTION ===');
    const duplicateRes = await request(`/api/admin/bookings/${testBookingId}/factory-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        notes: 'محاولة إعادة إنشاء مكررة'
      }
    });
    console.log('Duplicate Order Status (Expected 409):', duplicateRes.status);
    console.log('Duplicate Order Body:', duplicateRes.body);

    console.log('\n=== [10] TEST EDITING TEST BOOKING ===');
    const editRes = await request(`/api/admin/bookings/${testBookingId}/test-edit`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        customerName: 'فحص أمني تجريبي (تم التعديل)',
        notes: 'تم تعديل الملاحظات بنجاح في الحجز التجريبي'
      }
    });
    console.log('Edit Test Booking Status:', editRes.status);
    console.log('Edit Test Booking Body:', editRes.body);

    console.log('\n=== [11] TEST BLOCKING DELETION ON REAL BOOKINGS (CLB-2026-3236) ===');
    // First find a real historical booking from getBookings
    const bookingsRes = await request('/api/admin/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const allBookings = Array.isArray(bookingsRes.body) ? bookingsRes.body : [];
    const realBooking = allBookings.find((b: any) => !b.isTest && b.bookingCode !== createdBooking.bookingCode);
    console.log('Found Real Customer Booking:', realBooking ? `${realBooking.bookingCode} (id: ${realBooking.id})` : 'none');

    if (realBooking) {
      const illegalDeleteRes = await request(`/api/admin/bookings/${realBooking.id}/test-delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Attempt to delete REAL booking Status (Expected 403):', illegalDeleteRes.status);
      console.log('Illegal Delete Response:', illegalDeleteRes.body);

      const illegalEditRes = await request(`/api/admin/bookings/${realBooking.id}/test-edit`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { customerName: 'محاولة تعديل غير مسموحة' }
      });
      console.log('Attempt to edit REAL booking Status (Expected 403):', illegalEditRes.status);
      console.log('Illegal Edit Response:', illegalEditRes.body);
    }

    console.log('\n=== [12] TEST DELETING TEST BOOKING (SAFE ISOLATION) ===');
    const deleteTestRes = await request(`/api/admin/bookings/${testBookingId}/test-delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete Test Booking Status (Expected 200):', deleteTestRes.status);
    console.log('Delete Test Booking Body:', deleteTestRes.body);
  }

  console.log('\n=== [13] TEST LOGOUT AND SERVER-SIDE SESSION REVOCATION ===');
  const logoutRes = await request('/api/admin/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Logout Status:', logoutRes.status);
  console.log('Logout Body:', logoutRes.body);
  console.log('Logout Cleared Cookies:', logoutRes.headers['set-cookie']);

  console.log('\n=== [14] VERIFY TOKEN IS REJECTED AFTER LOGOUT ===');
  const meAfterLogout = await request('/api/admin/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Me status after logout (Expected 401):', meAfterLogout.status);
  console.log('Me body after logout:', meAfterLogout.body);
}

runLiveAudit().catch(err => {
  console.error('Audit run error:', err);
});
