import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import { AdminUser } from '../types';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'celebre-catering-jwt-super-secret-key-2026';

// Middleware for authentication
interface AuthenticatedRequest extends Request {
  user?: AdminUser;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'غير مصرح: يلزم تسجيل الدخول' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'جلسة الدخول منتهية أو غير صالحة' });
    return;
  }
}

function requireRole(allowedRoles: ('super_admin' | 'admin' | 'factory')[]) {
  return (req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
      return;
    }
    next();
  };
}

// -----------------------------------------------------------------------------
// PUBLIC ROUTES
// -----------------------------------------------------------------------------

// Public app configuration & contact info
apiRouter.get('/config', (req, res) => {
  res.json({
    ...CELEBRE_CONFIG,
    currentYear: 2026,
    version: '2.0.0',
    meta: {
      supabaseReady: true,
      databaseType: db.isPostgres() ? 'PostgreSQL' : 'Resilient File/Memory DB',
      customDomain: 'https://celebre-eg.com',
    }
  });
});

// Public meals list (Strictly excludes factoryPrice)
apiRouter.get('/meals', async (req, res) => {
  try {
    const meals = await db.getMeals(false);
    // Sort Sale-01 through Sale-18 numerically
    const sorted = [...meals].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ في جلب قائمة الوجبات' });
  }
});

// Public booking submission with server-authoritative calculation
apiRouter.post('/bookings', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerWhatsapp,
      preferredContact,
      eventName,
      eventDate,
      deliveryTime,
      deliveryGovernorate,
      deliveryAddress,
      notes,
      items,
    } = req.body;

    // Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      res.status(400).json({ error: 'يرجى إدخال اسم العميل بشكل صحيح' });
      return;
    }

    if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length < 10) {
      res.status(400).json({ error: 'يرجى إدخال رقم هاتف صحيح (11 رقم)' });
      return;
    }

    if (!eventName || !eventDate || !deliveryTime || !deliveryGovernorate || !deliveryAddress) {
      res.status(400).json({ error: 'يرجى استكمال جميع بيانات المناسبة ومكان وموعد التسليم' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'يجب اختيار وجبة واحدة على الأقل لإتمام الحجز' });
      return;
    }

    const booking = await db.createBooking({
      customerName,
      customerPhone,
      customerWhatsapp,
      preferredContact: preferredContact === 'phone' ? 'phone' : 'whatsapp',
      eventName,
      eventDate,
      deliveryTime,
      deliveryGovernorate,
      deliveryAddress,
      notes,
      items,
    });

    // Generate WhatsApp direct text with full order summary
    const itemsSummary = booking.items.map(it => 
      `• ${it.mealCode} (${it.quantity} وجبة) - ${it.drinkOption === 'no_juice' ? 'بدون عصير (-5ج)' : it.drinkOption === 'pepsi' ? 'بيبسي (+10ج)' : 'عصير بخيرة'}: ${it.totalDistributorPrice} ج`
    ).join('%0A');

    const whatsappMessage = `*طلب حجز جديد - Celebre Catering*%0A%0A` +
      `*رقم الحجز:* ${booking.bookingCode}%0A` +
      `*اسم العميل:* ${booking.customerName}%0A` +
      `*رقم الموبايل:* ${booking.customerPhone}%0A` +
      `*المناسبة:* ${booking.eventName}%0A` +
      `*تاريخ التسليم:* ${booking.eventDate}%0A` +
      `*وقت التسليم:* ${booking.deliveryTime}%0A` +
      `*العنوان:* ${booking.deliveryGovernorate} - ${booking.deliveryAddress}%0A%0A` +
      `*تفاصيل الوجبات:*%0A${itemsSummary}%0A%0A` +
      `*إجمالي عدد الوجبات:* ${booking.totalMealsCount}%0A` +
      `*إجمالي المبلغ:* ${booking.totalDistributorPrice} جنيه مصري%0A` +
      `*ملاحظات:* ${booking.notes || 'لا يوجد'}%0A%0A` +
      `متابعة الحجز على الرابط: https://celebre-eg.com/track?code=${booking.bookingCode}`;

    const whatsappUrl = `https://wa.me/${CELEBRE_CONFIG.whatsappNumber}?text=${whatsappMessage}`;

    // Return sanitized booking info
    const { totalFactoryPrice, profitMargin, ...clientBooking } = booking;
    res.status(201).json({
      success: true,
      booking: clientBooking,
      whatsappUrl,
      whatsappMessage: decodeURIComponent(whatsappMessage),
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    res.status(400).json({ error: err.message || 'حدث خطأ أثناء حفظ الحجز' });
  }
});

// Public tracking endpoint (by booking code and security code or phone)
apiRouter.get('/bookings/track', async (req, res) => {
  try {
    const { code, verify } = req.query;
    if (!code || !verify) {
      res.status(400).json({ error: 'يرجى تقديم رقم الحجز ورمز التحقق (أو آخر 4 أرقام من الموبايل)' });
      return;
    }

    const booking = await db.trackBooking(String(code), String(verify));
    if (!booking) {
      res.status(404).json({ error: 'لم يتم العثور على حجز يطابق هذه البيانات. يرجى التأكد من رقم الحجز ورمز التحقق.' });
      return;
    }

    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء الاستعلام عن الحجز' });
  }
});

// -----------------------------------------------------------------------------
// ADMIN & FACTORY AUTHENTICATION
// -----------------------------------------------------------------------------

apiRouter.post('/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
      return;
    }

    const user = await db.verifyAdmin(username, password);
    if (!user) {
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء تسجيل الدخول' });
  }
});

apiRouter.get('/admin/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// -----------------------------------------------------------------------------
// PROTECTED ADMIN APIS
// -----------------------------------------------------------------------------

// Admin meals list (includes secret factory prices)
apiRouter.get('/admin/meals', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // If role is factory, hide profit / distributor prices or show required data
    const isSuperOrAdmin = req.user?.role === 'super_admin' || req.user?.role === 'admin';
    const meals = await db.getMeals(isSuperOrAdmin);
    const sorted = [...meals].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update meal in central menu
apiRouter.put('/admin/meals/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { distributorPrice, factoryPrice, ingredients, name, isActive } = req.body;

    const updated = await db.updateMeal(id, {
      distributorPrice: distributorPrice !== undefined ? Number(distributorPrice) : undefined,
      factoryPrice: factoryPrice !== undefined ? Number(factoryPrice) : undefined,
      ingredients,
      name,
      isActive,
    }, req.user?.name || 'الإدارة');

    if (!updated) {
      res.status(404).json({ error: 'الوجبة غير موجودة' });
      return;
    }

    res.json({ success: true, meal: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List bookings with filters
apiRouter.get('/admin/bookings', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, search } = req.query;
    const bookings = await db.getBookings({
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
    });

    // If role is factory, strip out financial profit margins and distributor prices!
    if (req.user?.role === 'factory') {
      const sanitized = bookings.map(b => {
        const { totalDistributorPrice, profitMargin, paidAmount, remainingAmount, items, ...rest } = b;
        return {
          ...rest,
          items: items.map(it => {
            const { baseDistributorPrice, unitDistributorPrice, totalDistributorPrice: tdp, ...kitchenItem } = it;
            return kitchenItem;
          }),
        };
      });
      res.json(sanitized);
      return;
    }

    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single booking
apiRouter.get('/admin/bookings/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const booking = await db.getBookingById(id);
    if (!booking) {
      res.status(404).json({ error: 'الحجز غير موجود' });
      return;
    }

    if (req.user?.role === 'factory') {
      const { totalDistributorPrice, profitMargin, paidAmount, remainingAmount, items, ...rest } = booking;
      res.json({
        ...rest,
        items: items.map(it => {
          const { baseDistributorPrice, unitDistributorPrice, totalDistributorPrice: tdp, ...kitchenItem } = it;
          return kitchenItem;
        }),
      });
      return;
    }

    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking details / status
apiRouter.patch('/admin/bookings/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await db.updateBooking(id, updates, req.user?.name || 'الإدارة');
    if (!updated) {
      res.status(404).json({ error: 'الحجز غير موجود' });
      return;
    }

    res.json({ success: true, booking: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record payment
apiRouter.post('/admin/bookings/:id/payments', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, method, notes, receiptNumber } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح' });
      return;
    }

    const payment = await db.addPayment({
      bookingId: id,
      amount: Number(amount),
      method: method || 'cash',
      notes,
      receiptNumber,
    }, req.user?.name || 'الإدارة');

    const updatedBooking = await db.getBookingById(id);
    res.json({ success: true, payment, booking: updatedBooking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Factory Order
apiRouter.post('/admin/bookings/:id/factory-order', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const factoryOrder = await db.createFactoryOrder(id, req.user?.name || 'الإدارة');
    res.json({ success: true, factoryOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Factory Orders
apiRouter.get('/admin/factory-orders', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await db.getFactoryOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Factory Order Status
apiRouter.patch('/admin/factory-orders/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await db.updateFactoryOrderStatus(id, status, req.user?.name || 'المصنع');
    if (!updated) {
      res.status(404).json({ error: 'أمر المصنع غير موجود' });
      return;
    }

    res.json({ success: true, factoryOrder: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Overall stats & financial analytics (super_admin / admin only)
apiRouter.get('/admin/stats', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit logs
apiRouter.get('/admin/audit-logs', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { bookingId } = req.query;
    const logs = await db.getAuditLogs(bookingId ? String(bookingId) : undefined);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
