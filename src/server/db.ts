import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { Meal, Booking, PaymentRecord, FactoryOrder, AuditLog, AdminUser, DrinkModification } from '../types';
import { INITIAL_MEALS, CELEBRE_CONFIG } from '../data/defaultMeals';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface DatabaseSchema {
  meals: Meal[];
  bookings: Booking[];
  payments: PaymentRecord[];
  factoryOrders: FactoryOrder[];
  auditLogs: AuditLog[];
  adminUsers: (AdminUser & { passwordHash: string })[];
  factoryOrderCounter: number;
}

import { prisma } from '../lib/prisma';

let isPrismaConnected = false;
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  prisma.$connect()
    .then(() => {
      isPrismaConnected = true;
      console.log('[DB] Connected to PostgreSQL via Prisma ORM.');
    })
    .catch((err) => {
      console.warn('[DB] Prisma connection deferred or fallback active:', err.message);
    });
}

// Ensure local storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const seededMeals: Meal[] = INITIAL_MEALS.map((m, idx) => ({
    ...m,
    id: `meal-${idx + 1}`,
    version: 1,
    updatedAt: new Date().toISOString(),
  }));

  // Initial admin hash for setup (safe default if env set, otherwise requires setup wizard)
  const defaultPassword = process.env.ADMIN_PASSWORD || 'Celebre@2026';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(defaultPassword, salt);

  return {
    meals: seededMeals,
    bookings: [],
    payments: [],
    factoryOrders: [],
    auditLogs: [],
    adminUsers: [
      {
        id: 'admin-1',
        username: 'admin',
        email: 'management@celebre-eg.com',
        role: 'super_admin',
        name: 'إدارة سيليبري',
        passwordHash,
      },
      {
        id: 'factory-1',
        username: 'factory',
        email: 'factory@celebre-eg.com',
        role: 'factory',
        name: 'مسؤول تشغيل المصنع',
        passwordHash: bcrypt.hashSync('Factory@2026', 10),
      }
    ],
    factoryOrderCounter: 100,
  };
}

function loadLocalDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    
    // Ensure all 18 meals exist if db was initialized with fewer
    if (!parsed.meals || parsed.meals.length < 18) {
      const initial = getInitialData();
      parsed.meals = initial.meals;
      saveLocalDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('[DB] Error loading local DB file, creating fresh initial data:', err);
    const initial = getInitialData();
    saveLocalDB(initial);
    return initial;
  }
}

function saveLocalDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving local DB file:', err);
  }
}

// In-memory reference that synchronizes with disk
let memoryDB: DatabaseSchema = loadLocalDB();

// Unique Booking Code Generator (e.g. CLB-2026-7842)
export function generateBookingCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CLB-2026-${randomDigits}`;
}

export function generateSecurityCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Database API
export const db = {
  isPostgres(): boolean {
    return isPrismaConnected || !!databaseUrl;
  },

  async getMeals(includeSecret = false): Promise<Meal[]> {
    if (databaseUrl) {
      try {
        const dbMeals = await prisma.meal.findMany({
          orderBy: { code: 'asc' },
        });

        if (dbMeals && dbMeals.length > 0) {
          return dbMeals.map((m: any) => {
            const meal: Meal = {
              id: m.id,
              code: m.code,
              name: m.name,
              category: m.category as 'mix_box' | 'sandwich_box',
              ingredients: m.ingredients,
              distributorPrice: m.distributorPrice,
              factoryPrice: includeSecret ? m.factoryPrice : undefined,
              hasJuice: m.hasJuice,
              isActive: m.isActive,
              image: m.image || undefined,
              version: m.version,
              updatedAt: m.updatedAt.toISOString(),
            };
            return meal;
          });
        }
      } catch (err) {
        // Fallback to local storage if PostgreSQL table not yet initialized
      }
    }

    memoryDB = loadLocalDB();
    return memoryDB.meals.map(m => {
      if (includeSecret) {
        return m;
      }
      // Strip factoryPrice from public output!
      const { factoryPrice, ...publicMeal } = m;
      return publicMeal as Meal;
    });
  },

  async getMealById(id: string): Promise<Meal | undefined> {
    memoryDB = loadLocalDB();
    return memoryDB.meals.find(m => m.id === id || m.code === id);
  },

  async updateMeal(id: string, updates: Partial<Meal>, performedBy = 'الإدارة'): Promise<Meal | null> {
    memoryDB = loadLocalDB();
    const idx = memoryDB.meals.findIndex(m => m.id === id || m.code === id);
    if (idx === -1) return null;

    const current = memoryDB.meals[idx];
    const updated: Meal = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    memoryDB.meals[idx] = updated;

    this.addAuditLog({
      bookingId: '',
      action: 'تحديث وجبة في المنيو',
      performedBy,
      details: `تم تحديث الوجبة ${updated.code} (${updated.name}). موزع: ${updated.distributorPrice} ج، مصنع: ${updated.factoryPrice} ج.`,
    });

    saveLocalDB(memoryDB);
    return updated;
  },

  async createBooking(data: {
    customerName: string;
    customerPhone: string;
    customerWhatsapp?: string;
    preferredContact: 'whatsapp' | 'phone';
    eventName: string;
    eventDate: string;
    deliveryTime: string;
    deliveryGovernorate: string;
    deliveryAddress: string;
    notes?: string;
    items: {
      mealCode: string;
      quantity: number;
      drinkOption: DrinkModification;
    }[];
  }): Promise<Booking> {
    memoryDB = loadLocalDB();

    // Calculate server-authoritative prices
    let totalMealsCount = 0;
    let totalDistributorPrice = 0;
    let totalFactoryPrice = 0;

    const validatedItems = data.items.map(item => {
      const meal = memoryDB.meals.find(m => m.code === item.mealCode);
      if (!meal) {
        throw new Error(`الوجبة ${item.mealCode} غير موجودة في المنيو الرسمي`);
      }

      const quantity = Math.max(1, Math.floor(item.quantity));
      totalMealsCount += quantity;

      // Base prices
      const baseDistributorPrice = meal.distributorPrice;
      const baseFactoryPrice = meal.factoryPrice || 0;

      // Drink adjustment
      let drinkDelta = 0;
      if (meal.hasJuice) {
        if (item.drinkOption === 'no_juice') {
          drinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount; // -5
        } else if (item.drinkOption === 'pepsi') {
          drinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra; // +10
        }
      }

      const unitDistributorPrice = Math.max(0, baseDistributorPrice + drinkDelta);
      const unitFactoryPrice = Math.max(0, baseFactoryPrice + drinkDelta);

      const itemTotalDistributor = unitDistributorPrice * quantity;
      const itemTotalFactory = unitFactoryPrice * quantity;

      totalDistributorPrice += itemTotalDistributor;
      totalFactoryPrice += itemTotalFactory;

      return {
        mealId: meal.id,
        mealCode: meal.code,
        mealName: meal.name,
        ingredients: meal.ingredients,
        category: meal.category,
        quantity,
        drinkOption: item.drinkOption,
        baseDistributorPrice,
        unitDistributorPrice,
        totalDistributorPrice: itemTotalDistributor,
        baseFactoryPrice,
        unitFactoryPrice,
        totalFactoryPrice: itemTotalFactory,
      };
    });

    const bookingCode = generateBookingCode();
    const securityCode = generateSecurityCode();
    const now = new Date().toISOString();

    const newBooking: Booking = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingCode,
      securityCode,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerWhatsapp: data.customerWhatsapp?.trim() || data.customerPhone.trim(),
      preferredContact: data.preferredContact,
      eventName: data.eventName.trim(),
      eventDate: data.eventDate,
      deliveryTime: data.deliveryTime,
      deliveryGovernorate: data.deliveryGovernorate,
      deliveryAddress: data.deliveryAddress.trim(),
      notes: data.notes?.trim() || '',
      items: validatedItems,
      totalMealsCount,
      totalDistributorPrice,
      totalFactoryPrice,
      profitMargin: totalDistributorPrice - totalFactoryPrice,
      paidAmount: 0,
      remainingAmount: totalDistributorPrice,
      status: 'INITIAL',
      statusNotes: 'حجز مبدئي جديد مسجل عبر الموقع',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    memoryDB.bookings.unshift(newBooking);

    if (databaseUrl) {
      try {
        await prisma.booking.create({
          data: {
            id: newBooking.id,
            bookingCode: newBooking.bookingCode,
            securityCode: newBooking.securityCode,
            customerName: newBooking.customerName,
            customerPhone: newBooking.customerPhone,
            customerWhatsapp: newBooking.customerWhatsapp,
            preferredContact: newBooking.preferredContact,
            eventName: newBooking.eventName,
            eventDate: newBooking.eventDate,
            deliveryTime: newBooking.deliveryTime,
            deliveryGovernorate: newBooking.deliveryGovernorate,
            deliveryAddress: newBooking.deliveryAddress,
            notes: newBooking.notes,
            totalMealsCount: newBooking.totalMealsCount,
            totalDistributorPrice: newBooking.totalDistributorPrice,
            totalFactoryPrice: newBooking.totalFactoryPrice,
            profitMargin: newBooking.profitMargin,
            paidAmount: 0,
            remainingAmount: newBooking.remainingAmount,
            status: 'INITIAL',
            statusNotes: newBooking.statusNotes,
            version: 1,
            items: {
              create: validatedItems.map(it => ({
                mealId: it.mealId,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: it.drinkOption,
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
                baseFactoryPrice: it.baseFactoryPrice,
                unitFactoryPrice: it.unitFactoryPrice,
                totalFactoryPrice: it.totalFactoryPrice,
              })),
            },
          },
        });
      } catch (err: any) {
        // Fallback to local storage if PostgreSQL connection or table is pending
        console.warn('[DB] Prisma booking create skipped/fallback:', err.message);
      }
    }

    this.addAuditLog({
      bookingId: newBooking.id,
      action: 'إنشاء حجز مبدئي',
      performedBy: 'العميل (الموقع الإلكتروني)',
      details: `تم إنشاء الحجز رقم ${bookingCode} بإجمالي ${totalMealsCount} وجبة وقيمة ${totalDistributorPrice} جنيه.`,
    });

    saveLocalDB(memoryDB);
    return newBooking;
  },

  async getBookings(filters?: { status?: string; search?: string }): Promise<Booking[]> {
    memoryDB = loadLocalDB();
    let results = [...memoryDB.bookings];

    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter(b => b.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(b => 
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.eventName.toLowerCase().includes(q)
      );
    }

    // Attach payments & factory orders
    return results.map(b => ({
      ...b,
      payments: memoryDB.payments.filter(p => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter(fo => fo.bookingId === b.id),
      auditLogs: memoryDB.auditLogs.filter(al => al.bookingId === b.id),
    }));
  },

  async getBookingById(id: string): Promise<Booking | null> {
    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find(item => item.id === id || item.bookingCode === id);
    if (!b) return null;

    return {
      ...b,
      payments: memoryDB.payments.filter(p => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter(fo => fo.bookingId === b.id),
      auditLogs: memoryDB.auditLogs.filter(al => al.bookingId === b.id),
    };
  },

  async trackBooking(bookingCode: string, verificationCode: string): Promise<Booking | null> {
    memoryDB = loadLocalDB();
    const cleanCode = bookingCode.trim().toUpperCase();
    const cleanVerify = verificationCode.trim();

    const b = memoryDB.bookings.find(item => 
      item.bookingCode.toUpperCase() === cleanCode && 
      (item.securityCode === cleanVerify || item.customerPhone.endsWith(cleanVerify) || item.customerPhone === cleanVerify)
    );

    if (!b) return null;

    // Sanitize for client: remove secret factory price & margins!
    const { totalFactoryPrice, profitMargin, items, ...publicBooking } = b;
    const publicItems = items.map(item => {
      const { baseFactoryPrice, unitFactoryPrice, totalFactoryPrice: itemFactPrice, ...publicItem } = item;
      return publicItem;
    });

    return {
      ...publicBooking,
      items: publicItems as any,
      payments: memoryDB.payments.filter(p => p.bookingId === b.id).map(p => ({
        id: p.id,
        bookingId: p.bookingId,
        amount: p.amount,
        method: p.method,
        date: p.date,
        createdAt: p.createdAt,
      })),
      factoryOrders: [], // hide factory internals from customer
      auditLogs: [],
    } as Booking;
  },

  async updateBooking(id: string, updates: Partial<Booking>, performedBy = 'الإدارة'): Promise<Booking | null> {
    memoryDB = loadLocalDB();
    const idx = memoryDB.bookings.findIndex(b => b.id === id || b.bookingCode === id);
    if (idx === -1) return null;

    const current = memoryDB.bookings[idx];
    const prevStatus = current.status;

    // Recalculate totals if items changed
    let totalMealsCount = updates.totalMealsCount !== undefined ? updates.totalMealsCount : current.totalMealsCount;
    let totalDistributor = updates.totalDistributorPrice !== undefined ? updates.totalDistributorPrice : current.totalDistributorPrice;
    let totalFactory = updates.totalFactoryPrice !== undefined ? updates.totalFactoryPrice : (current.totalFactoryPrice || 0);

    if (updates.items && Array.isArray(updates.items)) {
      totalMealsCount = 0;
      totalDistributor = 0;
      totalFactory = 0;
      updates.items.forEach(it => {
        totalMealsCount += it.quantity;
        totalDistributor += it.totalDistributorPrice;
        totalFactory += (it.totalFactoryPrice || 0);
      });
    }

    const profitMargin = totalDistributor - totalFactory;
    const paidAmount = updates.paidAmount !== undefined ? updates.paidAmount : current.paidAmount;
    const remainingAmount = Math.max(0, totalDistributor - paidAmount);

    const updated: Booking = {
      ...current,
      ...updates,
      totalMealsCount,
      totalDistributorPrice: totalDistributor,
      totalFactoryPrice: totalFactory,
      profitMargin,
      paidAmount,
      remainingAmount,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    memoryDB.bookings[idx] = updated;

    let auditDetail = `تم تحديث الحجز (الإصدار v${updated.version})`;
    if (updates.status && updates.status !== prevStatus) {
      auditDetail += `. تغيير الحالة من ${prevStatus} إلى ${updates.status}`;
    }

    this.addAuditLog({
      bookingId: updated.id,
      action: 'تعديل الحجز',
      performedBy,
      details: auditDetail,
    });

    saveLocalDB(memoryDB);
    return updated;
  },

  async addPayment(data: {
    bookingId: string;
    amount: number;
    method: PaymentRecord['method'];
    notes?: string;
    receiptNumber?: string;
  }, performedBy = 'الإدارة'): Promise<PaymentRecord> {
    memoryDB = loadLocalDB();
    const booking = memoryDB.bookings.find(b => b.id === data.bookingId);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      bookingId: data.bookingId,
      amount: data.amount,
      method: data.method,
      date: new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      receiptNumber: data.receiptNumber || '',
      createdAt: new Date().toISOString(),
    };

    memoryDB.payments.unshift(payment);

    // Update booking paid & remaining
    booking.paidAmount += data.amount;
    booking.remainingAmount = Math.max(0, booking.totalDistributorPrice - booking.paidAmount);
    booking.version += 1;
    booking.updatedAt = new Date().toISOString();

    // If initial and paid deposit, transition to CONFIRMED
    if (booking.status === 'INITIAL' || booking.status === 'PENDING_CONFIRMATION') {
      booking.status = 'CONFIRMED';
      booking.statusNotes = `تم تأكيد الحجز بعد استلام دفعة بقيمة ${data.amount} جنيه`;
    }

    this.addAuditLog({
      bookingId: booking.id,
      action: 'تسجيل دفعة مالية',
      performedBy,
      details: `تم تحصيل مبلغ ${data.amount} ج (${data.method}). المتبقي: ${booking.remainingAmount} ج.`,
    });

    saveLocalDB(memoryDB);
    return payment;
  },

  async createFactoryOrder(bookingId: string, performedBy = 'الإدارة'): Promise<FactoryOrder> {
    memoryDB = loadLocalDB();
    const booking = memoryDB.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('الحجز غير موجود لإصدار أمر المصنع');
    }

    // Check existing factory orders for this booking to handle versioning
    const existingOrders = memoryDB.factoryOrders.filter(fo => fo.bookingId === bookingId);
    const version = existingOrders.length + 1;

    memoryDB.factoryOrderCounter += 1;
    const orderNumber = `FO-2026-${memoryDB.factoryOrderCounter}`;

    const factoryOrder: FactoryOrder = {
      id: `fo-${Date.now()}`,
      orderNumber,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      version,
      status: 'PENDING',
      eventDate: booking.eventDate,
      deliveryTime: booking.deliveryTime,
      deliveryLocation: `${booking.deliveryGovernorate} - ${booking.deliveryAddress}`,
      factoryCostTotal: booking.totalFactoryPrice || 0,
      // Strictly separate kitchen information:
      // quantities, meal codes, ingredients list, drink option, packaging notes, factory unit cost
      // STRICTLY NO distributor prices or profit margins!
      items: booking.items.map(item => ({
        mealCode: item.mealCode,
        mealName: item.mealName,
        quantity: item.quantity,
        drinkOption: item.drinkOption,
        ingredients: item.ingredients,
        unitFactoryPrice: item.unitFactoryPrice,
        totalFactoryPrice: item.totalFactoryPrice,
        specialInstructions: item.drinkOption === 'no_juice' 
          ? 'بدون عصير' 
          : item.drinkOption === 'pepsi' 
          ? 'استبدال العصير بكانز بيبسي' 
          : 'عصير بخيرة القياسي',
      })),
      packagingNotes: `العلبة البيضاء الرسمية المعتمدة لـ Celebre Catering. وضع شوكة ومنديل معطر مع كل وجبة. فحص الجودة وتاريخ التعبئة. ${booking.notes || ''}`.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryDB.factoryOrders.unshift(factoryOrder);

    // Update booking status to IN_PRODUCTION if confirmed
    if (booking.status === 'CONFIRMED' || booking.status === 'PENDING_CONFIRMATION') {
      booking.status = 'IN_PRODUCTION';
      booking.statusNotes = `تم إصدار أمر تشغيل المصنع رقم ${orderNumber} (الإصدار v${version})`;
      booking.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      bookingId: booking.id,
      action: 'إصدار أمر تشغيل المصنع',
      performedBy,
      details: `تم إصدار أمر المصنع رقم ${orderNumber} (الإصدار ${version}) بإجمالي ${booking.totalMealsCount} وجبة بدون إظهار هوامش الربح.`,
    });

    saveLocalDB(memoryDB);
    return factoryOrder;
  },

  async getFactoryOrders(): Promise<FactoryOrder[]> {
    memoryDB = loadLocalDB();
    return memoryDB.factoryOrders;
  },

  async updateFactoryOrderStatus(orderId: string, status: FactoryOrder['status'], performedBy = 'المصنع'): Promise<FactoryOrder | null> {
    memoryDB = loadLocalDB();
    const fo = memoryDB.factoryOrders.find(item => item.id === orderId || item.orderNumber === orderId);
    if (!fo) return null;

    fo.status = status;
    fo.updatedAt = new Date().toISOString();

    const booking = memoryDB.bookings.find(b => b.id === fo.bookingId);
    if (booking) {
      if (status === 'COMPLETED') {
        booking.status = 'READY_FOR_DELIVERY';
        booking.statusNotes = 'تم الانتهاء من تجهيز وتغليف كافة الوجبات في المصنع، الوجبات جاهزة للشحن والتسليم.';
      } else if (status === 'PREPARING') {
        booking.status = 'IN_PRODUCTION';
        booking.statusNotes = 'جاري التجهيز والتعبئة في المصنع حالياً.';
      }
      booking.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      bookingId: fo.bookingId,
      action: 'تحديث حالة أمر المصنع',
      performedBy,
      details: `تم تحديث حالة أمر المصنع ${fo.orderNumber} إلى ${status}`,
    });

    saveLocalDB(memoryDB);
    return fo;
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    memoryDB.auditLogs.unshift(newLog);
    return newLog;
  },

  async getAuditLogs(bookingId?: string): Promise<AuditLog[]> {
    memoryDB = loadLocalDB();
    if (bookingId) {
      return memoryDB.auditLogs.filter(l => l.bookingId === bookingId);
    }
    return memoryDB.auditLogs.slice(0, 50);
  },

  async getStats() {
    memoryDB = loadLocalDB();
    const totalBookings = memoryDB.bookings.length;
    let totalMeals = 0;
    let totalRevenue = 0;
    let totalFactoryCost = 0;
    let totalCollected = 0;

    memoryDB.bookings.forEach(b => {
      if (b.status !== 'CANCELLED') {
        totalMeals += b.totalMealsCount;
        totalRevenue += b.totalDistributorPrice;
        totalFactoryCost += (b.totalFactoryPrice || 0);
        totalCollected += b.paidAmount;
      }
    });

    const totalProfit = totalRevenue - totalFactoryCost;
    const totalOutstanding = Math.max(0, totalRevenue - totalCollected);

    return {
      totalBookings,
      totalMeals,
      totalRevenue,
      totalFactoryCost,
      totalProfit,
      totalCollected,
      totalOutstanding,
      activeMealsCount: memoryDB.meals.filter(m => m.isActive).length,
      factoryOrdersCount: memoryDB.factoryOrders.length,
    };
  },

  async verifyAdmin(username: string, password: string): Promise<AdminUser | null> {
    memoryDB = loadLocalDB();
    const user = memoryDB.adminUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) return null;

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },
};
