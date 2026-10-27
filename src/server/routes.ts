import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import { AdminUser } from '../types';
import {
  handleMetaWebhookVerification,
  handleMetaWebhookEvent,
  getMetaDiagnosticStatus,
  buildBookingWhatsAppMessage,
  notifyBookingViaMeta,
  META_CONFIG,
} from './metaService';
import { generateMenuPdfHtml } from './menuPdfGenerator';
import { logServerError } from './safeLogger';
import { getPrismaClient, getSafeConnectionMetadata, formatDatabaseUrl, SUPABASE_ROOT_CA } from '../lib/prisma';
import { runSafeMigration } from '../../scripts/migrate-to-postgres';
import { ensureSchemaReady, checkTablesStatus, REQUIRED_TABLES } from './schemaInit';
import pg from 'pg';

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

// API Root Status
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Celebre Catering API',
    status: 'healthy',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (Live real-time active database ping with dual-engine diagnostics)
apiRouter.get('/health', async (_req, res) => {
  let isDbLive = false;
  let tablesReady = false;
  let latencyMs: number | undefined = undefined;
  let dbDiagnostic = 'resilient_storage';
  let dbDiagnosticReason: string | undefined = undefined;
  let existingTablesList: string[] = [];
  let schemaInitDetails: any = undefined;

  let pgEngineCheck: {
    tested: boolean;
    connected: boolean;
    phase: string;
    code?: string;
    message?: string;
    latencyMs?: number;
  } = { tested: false, connected: false, phase: 'idle' };

  if (process.env.DATABASE_URL) {
    const rawUrl = process.env.DATABASE_URL;
    const formattedUrl = formatDatabaseUrl(rawUrl);

    // 1. Independent node-postgres ping (Direct TLS/SSL handshake & credentials check)
    pgEngineCheck.tested = true;
    const pgStart = Date.now();
    const pgUrl = new URL(formattedUrl);
    pgUrl.searchParams.delete('sslmode'); // Prevents pg-connection-string from overwriting explicit ssl.ca configuration

    const pgClient = new pg.Client({
      connectionString: pgUrl.toString(),
      connectionTimeoutMillis: 7000,
      ssl: {
        rejectUnauthorized: true,
        ca: SUPABASE_ROOT_CA,
        servername: pgUrl.hostname,
      },
    });

    try {
      pgEngineCheck.phase = 'connecting';
      await pgClient.connect();
      pgEngineCheck.phase = 'query';
      await pgClient.query('SELECT 1');
      pgEngineCheck.phase = 'ready';
      pgEngineCheck.connected = true;
      pgEngineCheck.latencyMs = Date.now() - pgStart;
    } catch (pgErr: any) {
      pgEngineCheck.code = pgErr?.code || pgErr?.name || 'ERR_CONNECT';
      const cleanPgMsg = String(pgErr?.message || '')
        .replace(/postgresql:\/\/[^@]+@/, 'postgresql://***:***@')
        .replace(/postgres:[^@]+@/, 'postgres:***@');
      pgEngineCheck.message = cleanPgMsg.slice(0, 160);
    } finally {
      try {
        await pgClient.end();
      } catch {}
    }

    // 2. Prisma ORM check
    const start = Date.now();
    try {
      const client = getPrismaClient();
      if (client) {
        await client.$queryRaw`SELECT 1`;
        isDbLive = true;
        latencyMs = Date.now() - start;

        // Check and safely ensure all required tables exist non-destructively
        const schemaInitResult = await ensureSchemaReady(client);
        tablesReady = schemaInitResult.success;
        existingTablesList = schemaInitResult.tablesFound;
        schemaInitDetails = {
          created: schemaInitResult.created,
          errors: schemaInitResult.errors,
        };
        dbDiagnostic = 'postgresql';
      }
    } catch (err: any) {
      logServerError(err, 'HealthCheck.DB');
      dbDiagnostic = 'postgresql_error';

      // Parse multi-line error cleanly without being fooled by initial newlines or wrapper headers
      const rawLines = String(err?.message || '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('Invalid `'));
      
      const firstRealLine = rawLines[0] || String(err?.name || 'PrismaConnectionError');
      const cleanMsg = firstRealLine
        .replace(/postgresql:\/\/[^@]+@/, 'postgresql://***:***@')
        .replace(/postgres:[^@]+@/, 'postgres:***@');

      dbDiagnosticReason = cleanMsg.slice(0, 180);
    }
  }

  res.json({
    status: 'ok',
    database: dbDiagnostic,
    connected: isDbLive,
    tablesReady,
    latencyMs,
    tables: {
      ready: tablesReady,
      count: existingTablesList.length,
      required: REQUIRED_TABLES.length,
      existing: existingTablesList,
      created: schemaInitDetails?.created || [],
      errors: schemaInitDetails?.errors || [],
    },
    diagnostic: dbDiagnosticReason || (isDbLive ? 'ready' : (process.env.DATABASE_URL ? 'connection_failed' : 'no_database_url')),
    pgTest: pgEngineCheck.tested ? pgEngineCheck : undefined,
    connection: getSafeConnectionMetadata(),
    timestamp: new Date().toISOString(),
  });
});

// Public app configuration & contact info
apiRouter.get('/config', (req, res) => {
  res.json({
    ...CELEBRE_CONFIG,
    currentYear: 2026,
    version: '2.1.0',
    meta: {
      supabaseReady: true,
      databaseType: db.isPostgres() ? 'PostgreSQL' : 'Resilient File/Memory DB',
      customDomain: 'https://celebre-eg.com',
      metaWebhookEndpoint: '/api/webhooks/meta',
      messengerLink: 'https://m.me/celebre.catering',
      whatsappNumber: CELEBRE_CONFIG.whatsappNumber,
    }
  });
});

// Official Central Menu PDF / HTML Generator Endpoint
apiRouter.get('/menu/pdf', async (req, res) => {
  try {
    const { download, print } = req.query;
    const meals = await db.getMeals(false);
    const html = generateMenuPdfHtml(meals, print === 'true');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (download === 'true') {
      res.setHeader('Content-Disposition', 'attachment; filename="Celebre-Catering-Official-Menu.html"');
    }
    res.send(html);
  } catch (err: any) {
    console.error('Error rendering menu PDF HTML:', err);
    res.status(500).json({ error: 'تعذر توليد قائمة المنيو الرسمية' });
  }
});

// Meta Webhook Verification (GET /api/webhooks/meta) - Standard Meta Graph API handshake
apiRouter.get('/webhooks/meta', (req, res) => {
  handleMetaWebhookVerification(req, res);
});

// Meta Webhook Event Ingestion (POST /api/webhooks/meta) - Messenger & WhatsApp Cloud
apiRouter.post('/webhooks/meta', (req, res) => {
  handleMetaWebhookEvent(req, res);
});

// Transparent Meta Integration Diagnostic Status
apiRouter.get('/meta/status', (req, res) => {
  res.json(getMetaDiagnosticStatus());
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
    } = req.body || {};

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      res.status(400).json({ success: false, error: 'يرجى إدخال اسم العميل بشكل صحيح' });
      return;
    }

    if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length < 10) {
      res.status(400).json({ success: false, error: 'يرجى إدخال رقم هاتف صحيح (11 رقم)' });
      return;
    }

    if (!eventName || !eventDate || !deliveryTime || !deliveryGovernorate || !deliveryAddress) {
      res.status(400).json({ success: false, error: 'يرجى استكمال جميع بيانات المناسبة ومكان وموعد التسليم' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'يجب اختيار وجبة واحدة على الأقل لإتمام الحجز' });
      return;
    }

    // STEP 1: Persist safely in PostgreSQL / database FIRST (100% authoritative)
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

    // STEP 2: Build formatted WhatsApp message and direct link
    let whatsappUrl = '';
    let messageText = '';
    try {
      const wa = buildBookingWhatsAppMessage(booking);
      whatsappUrl = wa.directUrl;
      messageText = wa.messageText;
    } catch (waErr: any) {
      console.warn('[WhatsApp Build Warning]:', waErr?.message || waErr);
    }
    const messengerUrl = 'https://m.me/celebre.catering';

    // STEP 3: Safe, non-blocking Meta automated notification attempt
    let metaDispatchResult: {
      attempted: boolean;
      delivered: boolean;
      channel: 'DIRECT_LINK_FALLBACK' | 'META_GRAPH_API';
      note: string;
    } = {
      attempted: false,
      delivered: false,
      channel: 'DIRECT_LINK_FALLBACK',
      note: 'الحجز مسجل في قاعدة البيانات ومحمي من أي انقطاع خارجي.',
    };

    try {
      metaDispatchResult = await notifyBookingViaMeta(booking);
    } catch (metaErr: any) {
      console.warn('[Meta Dispatch Non-blocking Warning]:', metaErr?.message || metaErr);
    }

    // Return sanitized booking info (stripping factory price and profit margin)
    const { totalFactoryPrice, profitMargin, ...clientBooking } = booking;
    res.status(201).json({
      success: true,
      booking: clientBooking,
      whatsappUrl,
      whatsappMessage: messageText,
      messengerUrl,
      metaStatus: metaDispatchResult,
      persistenceConfirmed: true,
    });
  } catch (err: any) {
    const sanitized = logServerError(err, 'POST /api/bookings');
    res.status(500).json({ 
      success: false, 
      error: sanitized.errorMessage || 'حدث خطأ في الخادم أثناء حفظ بيانات الحجز. يرجى المحاولة مرة أخرى.',
      code: sanitized.errorCode,
    });
  }
});

// Public tracking endpoint (by booking code and optional security PIN or phone)
apiRouter.get('/bookings/track', async (req, res) => {
  try {
    const { code, verify } = req.query;
    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ error: 'يرجى تقديم رقم الحجز' });
      return;
    }

    const booking = await db.trackBooking(String(code), typeof verify === 'string' ? verify : undefined);
    if (!booking) {
      res.status(404).json({ error: 'لم يتم العثور على حجز يطابق هذا الرقم، يرجى التأكد من كتابة رقم الحجز أو رمز التحقق بشكل صحيح.' });
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

    if (req.user?.role === 'factory') {
      // Redact financial costs for kitchen staff - only show checklist and quantities
      const sanitized = orders.map(fo => {
        const { factoryCostTotal, ...safeOrder } = fo;
        return {
          ...safeOrder,
          items: safeOrder.items.map(it => {
            const { unitFactoryPrice, totalFactoryPrice, ...kitchenItem } = it;
            return kitchenItem;
          }),
        };
      });
      res.json(sanitized);
      return;
    }

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

// Trigger safe, idempotent migration to PostgreSQL (super_admin only)
apiRouter.post('/admin/system/migrate', requireAuth, requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await runSafeMigration();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'فشل تنفيذ الترحيل' });
  }
});
