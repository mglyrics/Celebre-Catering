import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { Meal, Booking, BookingStatus, PaymentRecord, FactoryOrder, FactoryPayment, FactoryPaymentStatus, AuditLog, AdminUser, DrinkModification } from '../types';
import { INITIAL_MEALS, CELEBRE_CONFIG } from '../data/defaultMeals';

/**
 * Independent Factory Accounting Configuration for Drink Modifications:
 * 1. Juice Removal (no_juice): Deduct 5 EGP from factory base price.
 * 2. Juice Replacement with Pepsi (pepsi):
 *    - Deduct 5 EGP (juice cost) from factory base price.
 *    - Add 10 EGP (pepsi can cost) to factory base price.
 *    Net factory formula: Factory Base Price - 5 + 10 = Factory Base Price + 5 EGP net.
 * Strictly applies ONLY to Factory Orders / WhatsApp tickets when meal originally has juice.
 * Customer and distributor prices remain strictly untouched.
 */
export const FACTORY_PEPSI_ACCOUNTING = {
  juiceCostDeduction: 5,
  pepsiCostAddition: 10,
  netAdjustment: 5, // -5 (juice) + 10 (can) = +5 EGP net
};

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT
);

const DATA_DIR = IS_SERVERLESS 
  ? path.resolve('/tmp', 'celebre-data')
  : path.resolve(process.cwd(), 'data');

const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface DatabaseSchema {
  meals: Meal[];
  bookings: Booking[];
  payments: PaymentRecord[];
  factoryOrders: FactoryOrder[];
  factoryPayments: FactoryPayment[];
  auditLogs: AuditLog[];
  adminUsers: (AdminUser & { passwordHash: string })[];
  factoryOrderCounter: number;
}

import { prisma, getPrismaClient } from '../lib/prisma';
import { logServerError, sanitizeError, SanitizedErrorInfo } from './safeLogger';

let isPrismaConnected = false;
const databaseUrl = process.env.DATABASE_URL;

// Lazy connection check helper (never blocks module evaluation during cold-start)
export async function ensurePrismaConnected(): Promise<boolean> {
  if (isPrismaConnected || !databaseUrl) return isPrismaConnected;
  try {
    await prisma.$connect();
    isPrismaConnected = true;
    console.log('[DB] Connected to PostgreSQL via Prisma ORM.');
  } catch (err: any) {
    logServerError(err, 'DB.Prisma.EnsureConnect');
    console.warn('[DB] Prisma connection deferred or fallback active:', err?.message || err);
  }
  return isPrismaConnected;
}

// Safely ensure storage directory exists (never crash if filesystem is read-only)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err: any) {
  console.warn('[DB] Non-writable filesystem detected, fallback storage will use RAM:', err?.message);
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
    factoryPayments: [],
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
    const seedFile = path.resolve(process.cwd(), 'data', 'db.json');
    if (!fs.existsSync(DB_FILE)) {
      let initial: DatabaseSchema;
      if (fs.existsSync(seedFile)) {
        try {
          initial = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
          if (!initial.factoryPayments) initial.factoryPayments = [];
        } catch {
          initial = getInitialData();
        }
      } else {
        initial = getInitialData();
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      } catch (writeErr) {
        // Safe to ignore on ephemeral / read-only filesystem
      }
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.factoryPayments) parsed.factoryPayments = [];
    
    // Ensure all 18 meals exist if db was initialized with fewer
    if (!parsed.meals || parsed.meals.length < 18) {
      const initial = getInitialData();
      parsed.meals = initial.meals;
      try {
        saveLocalDB(parsed);
      } catch {}
    }
    return parsed;
  } catch (err) {
    const initial = getInitialData();
    return initial;
  }
}

function saveLocalDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    // Graceful fallback: state is preserved in memoryDB without throwing uncaught errors
  }
}

// In-memory reference that synchronizes with disk when writable
let memoryDB: DatabaseSchema = loadLocalDB();

// Unique Booking Code Generator (e.g. CLB-2026-7842)
export function generateBookingCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CLB-2026-${randomDigits}`;
}

export function generateSecurityCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function normalizeBookingCode(str: string): string {
  return (str || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '').replace(/^20/, '');
}

export function isBookingCodeMatch(storedCode: string, queryCode: string): boolean {
  if (!storedCode || !queryCode) return false;
  const sClean = storedCode.trim().toUpperCase();
  const qClean = queryCode.trim().toUpperCase();
  if (sClean === qClean) return true;

  const sNorm = normalizeBookingCode(storedCode);
  const qNorm = normalizeBookingCode(queryCode);
  if (sNorm === qNorm) return true;

  // Match if user entered the last digits or suffix (e.g. 8934 matching CLB-2026-8934)
  if (qNorm.length >= 4 && sNorm.endsWith(qNorm)) return true;

  return false;
}

export function isVerificationMatch(storedPin: string, storedPhone: string, queryVerify?: string): boolean {
  if (!queryVerify || !queryVerify.trim()) {
    // Optional verification: if not provided, allow public tracking access
    return true;
  }
  const cleanVerify = queryVerify.trim();
  if (storedPin && storedPin.trim() === cleanVerify) return true;

  const qDigits = cleanVerify.replace(/\D/g, '');
  const sPhoneDigits = normalizePhone(storedPhone);
  const qPhoneDigits = normalizePhone(cleanVerify);

  if (sPhoneDigits && qPhoneDigits && (sPhoneDigits === qPhoneDigits || sPhoneDigits.endsWith(qPhoneDigits) || qPhoneDigits.endsWith(sPhoneDigits))) {
    return true;
  }
  if (qDigits.length >= 4 && sPhoneDigits.endsWith(qDigits)) {
    return true;
  }
  return false;
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

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.meal.updateMany({
            where: {
              OR: [{ id }, { code: id }],
            },
            data: {
              name: updates.name !== undefined ? updates.name : undefined,
              distributorPrice: updates.distributorPrice !== undefined ? updates.distributorPrice : undefined,
              factoryPrice: updates.factoryPrice !== undefined ? updates.factoryPrice : undefined,
              ingredients: updates.ingredients !== undefined ? updates.ingredients : undefined,
              hasJuice: updates.hasJuice !== undefined ? updates.hasJuice : undefined,
              isActive: updates.isActive !== undefined ? updates.isActive : undefined,
              version: { increment: 1 },
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.updateMeal.prisma');
      }
    }

    this.addAuditLog({
      bookingId: '',
      bookingCode: updated.code || 'MENU_UPDATE',
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
    isTest?: boolean;
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

      // Customer / Distributor drink adjustment (must remain unchanged!)
      let distributorDrinkDelta = 0;
      // Independent Factory drink adjustment
      let factoryDrinkDelta = 0;

      if (meal.hasJuice) {
        if (item.drinkOption === 'no_juice') {
          distributorDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount; // -5
          factoryDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount; // -5
        } else if (item.drinkOption === 'pepsi') {
          distributorDrinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra; // +10 for customer
          // Independent Factory Pepsi Formula: -5 (juice) -1 (carton) +10 (can) = +4 EGP
          factoryDrinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment; // +4 EGP
        }
      }

      const unitDistributorPrice = Math.max(0, baseDistributorPrice + distributorDrinkDelta);
      const unitFactoryPrice = Math.max(0, baseFactoryPrice + factoryDrinkDelta);

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
        factoryDrinkAdjustment: factoryDrinkDelta,
        unitFactoryPrice,
        totalFactoryPrice: itemTotalFactory,
      };
    });

    // Enforce Minimum Order: 50 meals
    if (totalMealsCount < 50) {
      throw new Error(`الحد الأدنى للطلب 50 وجبة. إجمالي عدد الوجبات المحددة (${totalMealsCount} وجبة) أقل من الحد الأدنى.`);
    }

    // Ensure unique booking code without collision
    let bookingCode = generateBookingCode();
    let collisionAttempts = 0;
    while (memoryDB.bookings.some(b => b.bookingCode === bookingCode) && collisionAttempts < 10) {
      bookingCode = generateBookingCode();
      collisionAttempts++;
    }

    const securityCode = generateSecurityCode();
    const now = new Date().toISOString();
    const isTest = data.isTest ?? Boolean(
      data.customerName.includes('تجريب') ||
      (data.notes && data.notes.includes('تجريب')) ||
      data.eventName.includes('تجريب')
    );

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
      isTest,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    memoryDB.bookings.unshift(newBooking);
    saveLocalDB(memoryDB);

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.create({
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
              isTest,
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
        }
      } catch (err: any) {
        const sanitized = logServerError(err, 'db.createBooking.prisma');
        if (process.env.STRICT_DB === 'true') {
          // In strict DB testing mode, throw sanitized error for verification
          const strictError: any = new Error(sanitized.errorMessage);
          strictError.code = sanitized.errorCode;
          throw strictError;
        }
      }
    }

    this.addAuditLog({
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      action: 'إنشاء حجز مبدئي',
      performedBy: 'العميل (الموقع الإلكتروني)',
      details: `تم إنشاء الحجز رقم ${bookingCode} بإجمالي ${totalMealsCount} وجبة وقيمة ${totalDistributorPrice} جنيه.`,
    });

    saveLocalDB(memoryDB);
    return newBooking;
  },

  async getBookings(filters?: { status?: string; search?: string }): Promise<Booking[]> {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const whereClause: any = {};
          if (filters?.status && filters.status !== 'ALL') {
            whereClause.status = filters.status;
          }
          if (filters?.search) {
            const q = filters.search.trim();
            whereClause.OR = [
              { bookingCode: { contains: q, mode: 'insensitive' } },
              { customerName: { contains: q, mode: 'insensitive' } },
              { customerPhone: { contains: q } },
              { eventName: { contains: q, mode: 'insensitive' } },
            ];
          }

          const dbBookings = await client.booking.findMany({
            where: whereClause,
            include: {
              items: true,
              payments: true,
              factoryOrders: true,
              auditLogs: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          if (dbBookings && dbBookings.length > 0) {
            return dbBookings.map(b => ({
              id: b.id,
              bookingCode: b.bookingCode,
              securityCode: b.securityCode,
              customerName: b.customerName,
              customerPhone: b.customerPhone,
              customerWhatsapp: b.customerWhatsapp || b.customerPhone,
              preferredContact: (b.preferredContact || 'whatsapp') as any,
              eventName: b.eventName,
              eventDate: b.eventDate,
              deliveryTime: b.deliveryTime,
              deliveryGovernorate: b.deliveryGovernorate,
              deliveryAddress: b.deliveryAddress,
              notes: b.notes || '',
              totalMealsCount: b.totalMealsCount,
              totalDistributorPrice: b.totalDistributorPrice,
              totalFactoryPrice: b.totalFactoryPrice || 0,
              profitMargin: b.profitMargin || (b.totalDistributorPrice - (b.totalFactoryPrice || 0)),
              paidAmount: b.paidAmount,
              remainingAmount: b.remainingAmount,
              status: (b.status || 'INITIAL') as any,
              statusNotes: b.statusNotes || '',
              isTest: b.isTest ?? (b.bookingCode === 'CLB-2026-1699' || b.customerName.includes('تجريب')),
              version: b.version,
              createdAt: b.createdAt.toISOString(),
              updatedAt: b.updatedAt.toISOString(),
              items: b.items.map(it => ({
                mealId: it.mealId || it.mealCode,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category as any,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: (it.drinkOption || 'standard') as any,
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
                baseFactoryPrice: it.baseFactoryPrice || 0,
                unitFactoryPrice: it.unitFactoryPrice || 0,
                totalFactoryPrice: it.totalFactoryPrice || 0,
              })),
              payments: b.payments.map(p => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method as any,
                date: p.date,
                notes: p.notes || '',
                receiptNumber: p.receiptNumber || '',
                status: (p.notes && p.notes.includes('[ملغاة')) ? 'CANCELLED' : 'VALID',
                createdAt: p.createdAt.toISOString(),
              })),
              factoryOrders: b.factoryOrders.map(fo => {
                let parsedItems = [];
                try {
                  parsedItems = JSON.parse(fo.itemsJson);
                } catch {}
                return {
                  id: fo.id,
                  orderNumber: fo.orderNumber,
                  bookingId: fo.bookingId,
                  bookingCode: fo.bookingCode,
                  version: fo.version,
                  status: fo.status as any,
                  eventDate: fo.eventDate,
                  deliveryTime: fo.deliveryTime,
                  deliveryLocation: fo.deliveryLocation,
                  factoryCostTotal: 0,
                  items: parsedItems,
                  packagingNotes: fo.packagingNotes || '',
                  createdAt: fo.createdAt.toISOString(),
                  updatedAt: fo.updatedAt.toISOString(),
                };
              }),
              auditLogs: b.auditLogs.map(al => ({
                id: al.id,
                bookingId: al.bookingId || '',
                bookingCode: al.bookingCode || b.bookingCode || '',
                action: al.action,
                performedBy: al.performedBy,
                details: al.details,
                timestamp: al.timestamp.toISOString(),
              })),
            }));
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.getBookings.prisma');
      }
    }

    // Fallback to local memoryDB
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

    return results.map(b => ({
      ...b,
      isTest: b.isTest ?? (b.bookingCode === 'CLB-2026-1699' || b.customerName.includes('تجريب')),
      payments: memoryDB.payments.filter(p => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter(fo => fo.bookingId === b.id),
      auditLogs: memoryDB.auditLogs.filter(al => al.bookingId === b.id),
    }));
  },

  async getBookingById(id: string): Promise<Booking | null> {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const b = await client.booking.findFirst({
            where: {
              OR: [
                { id },
                { bookingCode: id },
              ],
            },
            include: {
              items: true,
              payments: true,
              factoryOrders: true,
              auditLogs: true,
            },
          });
          if (b) {
            return {
              id: b.id,
              bookingCode: b.bookingCode,
              securityCode: b.securityCode,
              customerName: b.customerName,
              customerPhone: b.customerPhone,
              customerWhatsapp: b.customerWhatsapp || b.customerPhone,
              preferredContact: (b.preferredContact || 'whatsapp') as any,
              eventName: b.eventName,
              eventDate: b.eventDate,
              deliveryTime: b.deliveryTime,
              deliveryGovernorate: b.deliveryGovernorate,
              deliveryAddress: b.deliveryAddress,
              notes: b.notes || '',
              totalMealsCount: b.totalMealsCount,
              totalDistributorPrice: b.totalDistributorPrice,
              totalFactoryPrice: b.totalFactoryPrice || 0,
              profitMargin: b.profitMargin || (b.totalDistributorPrice - (b.totalFactoryPrice || 0)),
              paidAmount: b.paidAmount,
              remainingAmount: b.remainingAmount,
              status: (b.status || 'INITIAL') as any,
              statusNotes: b.statusNotes || '',
              isTest: b.isTest ?? (b.bookingCode === 'CLB-2026-1699' || b.customerName.includes('تجريب')),
              version: b.version,
              createdAt: b.createdAt.toISOString(),
              updatedAt: b.updatedAt.toISOString(),
              items: b.items.map(it => ({
                mealId: it.mealId || it.mealCode,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category as any,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: (it.drinkOption || 'standard') as any,
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
                baseFactoryPrice: it.baseFactoryPrice || 0,
                unitFactoryPrice: it.unitFactoryPrice || 0,
                totalFactoryPrice: it.totalFactoryPrice || 0,
              })),
              payments: b.payments.map(p => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method as any,
                date: p.date,
                notes: p.notes || '',
                receiptNumber: p.receiptNumber || '',
                status: (p.notes && p.notes.includes('[ملغاة')) ? 'CANCELLED' : 'VALID',
                createdAt: p.createdAt.toISOString(),
              })),
              factoryOrders: b.factoryOrders.map(fo => {
                let parsedItems = [];
                try {
                  parsedItems = JSON.parse(fo.itemsJson);
                } catch {}
                return {
                  id: fo.id,
                  orderNumber: fo.orderNumber,
                  bookingId: fo.bookingId,
                  bookingCode: fo.bookingCode,
                  version: fo.version,
                  status: fo.status as any,
                  eventDate: fo.eventDate,
                  deliveryTime: fo.deliveryTime,
                  deliveryLocation: fo.deliveryLocation,
                  factoryCostTotal: 0,
                  items: parsedItems,
                  packagingNotes: fo.packagingNotes || '',
                  createdAt: fo.createdAt.toISOString(),
                  updatedAt: fo.updatedAt.toISOString(),
                };
              }),
              auditLogs: b.auditLogs.map(al => ({
                id: al.id,
                bookingId: al.bookingId || '',
                bookingCode: al.bookingCode || b.bookingCode || '',
                action: al.action,
                performedBy: al.performedBy,
                details: al.details,
                timestamp: al.timestamp.toISOString(),
              })),
            };
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.getBookingById.prisma');
      }
    }

    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find(item => item.id === id || item.bookingCode === id);
    if (!b) return null;

    return {
      ...b,
      isTest: b.isTest ?? (b.bookingCode === 'CLB-2026-1699' || b.customerName.includes('تجريب')),
      payments: memoryDB.payments.filter(p => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter(fo => fo.bookingId === b.id),
      auditLogs: memoryDB.auditLogs.filter(al => al.bookingId === b.id),
    };
  },

  async trackBooking(bookingCode: string, verificationCode?: string): Promise<Booking | null> {
    if (!bookingCode || typeof bookingCode !== 'string' || !bookingCode.trim()) {
      return null;
    }

    const cleanCode = bookingCode.trim();
    const cleanVerify = (verificationCode || '').trim();

    // 1. Check PostgreSQL via Prisma ORM if databaseUrl is present
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbBookings = await client.booking.findMany({
            where: {
              OR: [
                { bookingCode: { equals: cleanCode, mode: 'insensitive' } },
                { bookingCode: { contains: cleanCode, mode: 'insensitive' } },
                { id: cleanCode },
              ],
            },
            include: {
              items: true,
              payments: true,
            },
            take: 10,
          });

          const matched = dbBookings.find(b => isBookingCodeMatch(b.bookingCode, cleanCode));
          if (matched && isVerificationMatch(matched.securityCode, matched.customerPhone, cleanVerify)) {
            const hasVerify = Boolean(cleanVerify);
            return {
              id: matched.id,
              bookingCode: matched.bookingCode,
              securityCode: hasVerify ? matched.securityCode : '****',
              customerName: matched.customerName,
              customerPhone: hasVerify ? matched.customerPhone : matched.customerPhone.replace(/(\d{3})\d+(\d{3})/, '$1*****$2'),
              customerWhatsapp: matched.customerWhatsapp || matched.customerPhone,
              preferredContact: (matched.preferredContact || 'whatsapp') as any,
              eventName: matched.eventName,
              eventDate: matched.eventDate,
              deliveryTime: matched.deliveryTime,
              deliveryGovernorate: matched.deliveryGovernorate,
              deliveryAddress: matched.deliveryAddress,
              notes: matched.notes || '',
              totalMealsCount: matched.totalMealsCount,
              totalDistributorPrice: matched.totalDistributorPrice,
              paidAmount: matched.paidAmount,
              remainingAmount: matched.remainingAmount,
              status: (matched.status || 'INITIAL') as any,
              statusNotes: matched.statusNotes || '',
              version: matched.version,
              createdAt: matched.createdAt.toISOString(),
              updatedAt: matched.updatedAt.toISOString(),
              items: matched.items.map(it => ({
                mealId: it.mealId || it.mealCode,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category as any,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: (it.drinkOption || 'standard') as any,
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
              })),
              payments: matched.payments.map(p => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method as any,
                date: p.date,
                createdAt: p.createdAt.toISOString(),
              })),
              factoryOrders: [],
              auditLogs: [],
            };
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.trackBooking.prisma');
      }
    }

    // 2. Check local database (memoryDB loaded from data/db.json)
    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find(item => 
      isBookingCodeMatch(item.bookingCode, cleanCode) &&
      isVerificationMatch(item.securityCode, item.customerPhone, cleanVerify)
    );

    if (!b) return null;

    const hasVerify = Boolean(cleanVerify);
    const { totalFactoryPrice, profitMargin, items, ...publicBooking } = b;
    const publicItems = items.map(item => {
      const { baseFactoryPrice, unitFactoryPrice, totalFactoryPrice: itemFactPrice, ...publicItem } = item;
      return publicItem;
    });

    return {
      ...publicBooking,
      securityCode: hasVerify ? b.securityCode : '****',
      customerPhone: hasVerify ? b.customerPhone : b.customerPhone.replace(/(\d{3})\d+(\d{3})/, '$1*****$2'),
      items: publicItems as any,
      payments: memoryDB.payments.filter(p => p.bookingId === b.id).map(p => ({
        id: p.id,
        bookingId: p.bookingId,
        amount: p.amount,
        method: p.method,
        date: p.date,
        createdAt: p.createdAt,
      })),
      factoryOrders: [],
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
      bookingCode: updated.bookingCode,
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
    date?: string;
    notes?: string;
    receiptNumber?: string;
    allowOverpayment?: boolean;
    bookingCode?: string;
  }, performedBy = 'الإدارة'): Promise<{ payment: PaymentRecord; booking: Booking }> {
    const numAmount = Number(data.amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      throw new Error('قيمة الدفعة يجب أن تكون أكبر من الصفر');
    }

    const cleanId = (data.bookingId || data.bookingCode || '').trim();
    if (!cleanId) {
      throw new Error('يرجى تحديد معرّف الحجز أو كود الحجز لتسجيل الدفعة');
    }

    // 1. Authoritative lookup: Search in PostgreSQL first, then memoryDB
    const booking = await this.getBookingById(cleanId);
    if (!booking) {
      throw new Error(`الحجز غير موجود (المعرّف المطلوب: "${cleanId}"). يرجى التأكد من صحة رقم أو كود الحجز.`);
    }

    // 2. Calculate active valid payments
    const validPayments = (booking.payments || []).filter(p => p.status !== 'CANCELLED');
    const currentPaid = validPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const currentRemaining = Math.max(0, booking.totalDistributorPrice - currentPaid);

    // 3. Validation: prevent overpayment without administrative override
    if (numAmount > currentRemaining && !data.allowOverpayment) {
      throw new Error(`قيمة الدفعة (${numAmount.toLocaleString('ar-EG')} ج) تتجاوز المبلغ المتبقي على العميل (${currentRemaining.toLocaleString('ar-EG')} ج). إذا كانت دفعة تسوية خاصة أو زيادة مقصودة، يرجى تفعيل خيار "سماح بمبلغ تسوية زائد".`);
    }

    // 4. Duplicate prevention (idempotency check by receipt number if provided)
    const cleanReceipt = (data.receiptNumber || '').trim();
    if (cleanReceipt) {
      const duplicateReceipt = validPayments.find(p => p.receiptNumber && p.receiptNumber.trim() === cleanReceipt);
      if (duplicateReceipt) {
        throw new Error(`يوجد بالفعل دفعة مسجلة بنفس رقم الإيصال / المرجع (${cleanReceipt}) بقيمة ${duplicateReceipt.amount} ج لهذا الحجز.`);
      }
    }

    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const paymentDate = data.date || new Date().toISOString().split('T')[0];
    const paymentNotes = (data.notes || '').trim();
    const newPaidAmount = currentPaid + numAmount;
    const newRemainingAmount = Math.max(0, booking.totalDistributorPrice - newPaidAmount);
    const now = new Date().toISOString();
    const auditLogId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const auditDetails = `تم تسجيل دفعة بقيمة ${numAmount} ج.م بطريقة (${data.method}) للحجز ${booking.bookingCode}. المسدد الجديد: ${newPaidAmount} ج، المتبقي: ${newRemainingAmount} ج. مرجع: ${cleanReceipt || 'لا يوجد'}.`;

    const payment: PaymentRecord = {
      id: paymentId,
      bookingId: booking.id, // Primary key of Booking
      amount: numAmount,
      method: data.method,
      date: paymentDate,
      notes: paymentNotes,
      receiptNumber: cleanReceipt,
      recordedBy: performedBy,
      status: 'VALID',
      createdAt: now,
    };

    const authoritativeBookingCode = (booking.bookingCode || '').trim();
    if (!authoritativeBookingCode) {
      throw new Error(`تعذر العثور على كود الحجز المعتمد (bookingCode) للحجز ${booking.id} لتوثيق سجل التدقيق`);
    }

    // 5. Execute atomic transaction in PostgreSQL if databaseUrl is configured
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            // A. Create Payment row - explicitly bound to booking.id primary key
            await tx.payment.create({
              data: {
                id: payment.id,
                bookingId: booking.id, // Foreign key referencing bookings(id)
                amount: payment.amount,
                method: payment.method,
                date: payment.date,
                notes: `[سجلت بواسطة: ${performedBy}] ${payment.notes}`.trim(),
                receiptNumber: payment.receiptNumber || null,
              },
            });

            // B. Update Booking row - only financial balances (status and prices stay strictly intact)
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                version: { increment: 1 },
                updatedAt: new Date(),
              },
            });

            // C. Create AuditLog row with authoritative bookingCode
            await tx.auditLog.create({
              data: {
                id: auditLogId,
                bookingId: booking.id,
                bookingCode: authoritativeBookingCode,
                action: 'تسجيل دفعة مالية',
                performedBy,
                details: auditDetails,
              },
            });
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.addPayment.prisma');
        throw new Error(`فشل حفظ الدفعة في قاعدة البيانات: ${err?.message || 'خطأ في الاتصال بقاعدة البيانات'}`);
      }
    }

    // 6. Update local memoryDB cache (for fallback / local development)
    memoryDB = loadLocalDB();
    memoryDB.payments.unshift(payment);

    const memBookingIdx = memoryDB.bookings.findIndex(b => b.id === booking.id);
    if (memBookingIdx !== -1) {
      memoryDB.bookings[memBookingIdx].paidAmount = newPaidAmount;
      memoryDB.bookings[memBookingIdx].remainingAmount = newRemainingAmount;
      memoryDB.bookings[memBookingIdx].version += 1;
      memoryDB.bookings[memBookingIdx].updatedAt = now;
    } else {
      throw new Error(`تعذر العثور على سجل الحجز بالمعرف الفريد ${booking.id} في قاعدة البيانات لتحديث الرصيد`);
    }

    memoryDB.auditLogs.unshift({
      id: auditLogId,
      bookingId: booking.id,
      bookingCode: authoritativeBookingCode,
      action: 'تسجيل دفعة مالية',
      performedBy,
      details: auditDetails,
      timestamp: now,
    });

    saveLocalDB(memoryDB);

    // 7. Return latest booking state
    const refreshedBooking = await this.getBookingById(booking.id);
    return {
      payment,
      booking: refreshedBooking || {
        ...booking,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        version: booking.version + 1,
      },
    };
  },

  async cancelPayment(
    paymentId: string,
    reason: string,
    performedBy = 'الإدارة'
  ): Promise<{ success: boolean; payment: PaymentRecord; booking: Booking }> {
    if (!reason || !reason.trim()) {
      throw new Error('يرجى تحديد سبب إلغاء أو عكس الدفعة المالية لتوثيقها في سجل التدقيق');
    }

    const cleanPaymentId = (paymentId || '').trim();
    if (!cleanPaymentId) {
      throw new Error('معرف الدفعة المالية مطلوب');
    }

    let payment: PaymentRecord | null = null;

    // 1. Check PostgreSQL first
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbPayment = await client.payment.findUnique({
            where: { id: cleanPaymentId },
          });
          if (dbPayment) {
            payment = {
              id: dbPayment.id,
              bookingId: dbPayment.bookingId,
              amount: dbPayment.amount,
              method: dbPayment.method as any,
              date: dbPayment.date,
              notes: dbPayment.notes || '',
              receiptNumber: dbPayment.receiptNumber || '',
              status: (dbPayment.notes && dbPayment.notes.includes('[ملغاة')) ? 'CANCELLED' : 'VALID',
              createdAt: dbPayment.createdAt.toISOString(),
            };
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.cancelPayment.findPayment.prisma');
      }
    }

    // 2. Check memoryDB if not found in PostgreSQL
    if (!payment) {
      memoryDB = loadLocalDB();
      const p = memoryDB.payments.find(item => item.id === cleanPaymentId);
      if (p) payment = p;
    }

    if (!payment) {
      throw new Error(`الدفعة المالية غير موجودة (المعرّف: ${cleanPaymentId})`);
    }

    if (payment.status === 'CANCELLED' || (payment.notes && payment.notes.includes('[ملغاة'))) {
      throw new Error('هذه الدفعة ملغاة بالفعل مسبقاً');
    }

    const booking = await this.getBookingById(payment.bookingId);
    if (!booking) {
      throw new Error(`الحجز المرتبط بهذه الدفعة غير موجود (معرّف الحجز: ${payment.bookingId})`);
    }

    const now = new Date().toISOString();
    const updatedNotes = `${payment.notes || ''} [ملغاة بواسطة ${performedBy} في ${new Date().toLocaleString('ar-EG')} - سبب: ${reason.trim()}]`.trim();
    const auditLogId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Recalculate balances excluding this cancelled payment
    const remainingPayments = (booking.payments || []).filter(p => p.id !== payment!.id && p.status !== 'CANCELLED');
    const newPaidAmount = remainingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const newRemainingAmount = Math.max(0, booking.totalDistributorPrice - newPaidAmount);
    const cancelDetails = `تم إلغاء الدفعة بقيمة ${payment.amount} ج.م للحجز ${booking.bookingCode}. السبب: ${reason.trim()}. الرصيد المسدد الجديد: ${newPaidAmount} ج، والمتبقي: ${newRemainingAmount} ج.`;

    // 3. Atomic transaction in PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment!.id },
              data: { notes: updatedNotes },
            });

            await tx.booking.update({
              where: { id: booking.id },
              data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                version: { increment: 1 },
                updatedAt: new Date(),
              },
            });

            await tx.auditLog.create({
              data: {
                id: auditLogId,
                bookingId: booking.id,
                bookingCode: booking.bookingCode,
                action: 'إلغاء وعكس دفعة مالية',
                performedBy,
                details: cancelDetails,
              },
            });
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.cancelPayment.prisma');
        throw new Error(`فشل إلغاء وعكس الدفعة في قاعدة البيانات: ${err?.message || 'خطأ في الاتصال بقاعدة البيانات'}`);
      }
    }

    // 4. Update memoryDB
    memoryDB = loadLocalDB();
    const memPayment = memoryDB.payments.find(p => p.id === payment!.id);
    if (memPayment) {
      memPayment.status = 'CANCELLED';
      memPayment.cancelledBy = performedBy;
      memPayment.cancelledAt = now;
      memPayment.cancelReason = reason.trim();
      memPayment.notes = updatedNotes;
    }
    const memBooking = memoryDB.bookings.find(b => b.id === booking.id || b.bookingCode === booking.bookingCode);
    if (memBooking) {
      memBooking.paidAmount = newPaidAmount;
      memBooking.remainingAmount = newRemainingAmount;
      memBooking.version += 1;
      memBooking.updatedAt = now;
    }
    memoryDB.auditLogs.unshift({
      id: auditLogId,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: 'إلغاء وعكس دفعة مالية',
      performedBy,
      details: cancelDetails,
      timestamp: now,
    });
    saveLocalDB(memoryDB);

    const freshBooking = await this.getBookingById(booking.id);
    return {
      success: true,
      payment: {
        ...payment,
        status: 'CANCELLED',
        cancelledBy: performedBy,
        cancelledAt: now,
        cancelReason: reason.trim(),
        notes: updatedNotes,
      },
      booking: freshBooking || {
        ...booking,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
      },
    };
  },

  async updateBookingStatus(
    id: string,
    newStatus: BookingStatus,
    performedBy = 'الإدارة',
    statusNotes?: string
  ): Promise<Booking> {
    const allowedStatuses: BookingStatus[] = [
      'INITIAL',
      'PENDING_CONFIRMATION',
      'CONFIRMED',
      'IN_PRODUCTION',
      'READY_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`حالة الحجز غير صالحة: ${newStatus}`);
    }

    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    if (newStatus === 'CONFIRMED' && booking.totalMealsCount < 50) {
      throw new Error(`الحد الأدنى للطلب 50 وجبة. لا يمكن تأكيد حجز يقل إجمالي وجباته عن 50 وجبة (العدد الحالي: ${booking.totalMealsCount} وجبة).`);
    }

    const prevStatus = booking.status;
    const newVersion = booking.version + 1;
    const now = new Date().toISOString();
    const noteText = statusNotes && statusNotes.trim()
      ? statusNotes.trim()
      : `تم تغيير الحالة من (${prevStatus}) إلى (${newStatus}) بواسطة (${performedBy}) في ${new Date().toLocaleString('ar-EG')}.`;

    const updatedBooking: Booking = {
      ...booking,
      status: newStatus,
      statusNotes: noteText,
      version: newVersion,
      updatedAt: now,
    };

    // Update memoryDB
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id);
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    } else {
      throw new Error(`تعذر العثور على سجل الحجز بالمعرف الفريد ${booking.id} لتحديث الحالة`);
    }

    // Update PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              status: newStatus,
              statusNotes: noteText,
              version: newVersion,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.updateBookingStatus.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: 'تغيير حالة الحجز',
      performedBy,
      details: `قام الإداري (${performedBy}) بتغيير حالة الحجز ${booking.bookingCode} من (${prevStatus}) إلى (${newStatus}). ملاحظات: ${noteText}.`,
    });

    return updatedBooking;
  },

  async getFactoryOrderPreview(bookingId: string) {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('الحجز غير موجود لحساب معاينة أمر المصنع');
    }

    const meals = await this.getMeals(true);
    const mealsMap = new Map(meals.map(m => [m.code, m]));

    let totalFactoryCost = 0;
    const previewItems = booking.items.map(item => {
      const meal = mealsMap.get(item.mealCode);
      const baseFactPrice = meal?.factoryPrice ?? item.baseFactoryPrice ?? 0;
      const hasJuice = meal ? meal.hasJuice : true;

      // Independent Factory Pricing Formula:
      // 1. Remove juice (no_juice): -5 EGP from factory base price
      // 2. Replace juice with Pepsi (pepsi): -5 (juice) + 10 (pepsi) = +5 EGP net to factory base price
      let factoryDrinkDelta = 0;
      let drinkLabel = 'عصير بخيرة القياسي';
      let specialInstructions = 'عصير بخيرة القياسي';

      if (hasJuice) {
        if (item.drinkOption === 'pepsi') {
          factoryDrinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment; // +5 EGP
          drinkLabel = 'استبدال العصير بكانز بيبسي';
          specialInstructions = 'استبدال العصير بكانز بيبسي';
        } else if (item.drinkOption === 'no_juice') {
          factoryDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount; // -5 EGP
          drinkLabel = 'بدون عصير';
          specialInstructions = 'بدون عصير';
        } else {
          drinkLabel = 'عصير بخيرة القياسي';
          specialInstructions = 'عصير بخيرة القياسي';
        }
      } else {
        drinkLabel = 'بدون عصير (أصلية)';
        specialInstructions = 'وجبة أصلية بدون عصير';
      }

      const unitFactPrice = Math.max(0, baseFactPrice + factoryDrinkDelta);
      const totalFactItemPrice = unitFactPrice * item.quantity;
      totalFactoryCost += totalFactItemPrice;

      return {
        mealCode: item.mealCode,
        mealName: meal?.name || item.mealName,
        quantity: item.quantity,
        drinkOption: item.drinkOption,
        drinkLabel,
        ingredients: meal?.ingredients || item.ingredients,
        baseFactoryPrice: baseFactPrice,
        factoryDrinkAdjustment: factoryDrinkDelta,
        unitFactoryPrice: unitFactPrice,
        totalFactoryPrice: totalFactItemPrice,
        specialInstructions,
      };
    });

    const existingOrders = (booking.factoryOrders || []).concat(
      memoryDB.factoryOrders.filter(fo => fo.bookingId === booking.id)
    );
    const uniqueExisting = Array.from(new Map(existingOrders.map(o => [o.orderNumber, o])).values());

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      eventName: booking.eventName,
      eventDate: booking.eventDate,
      deliveryTime: booking.deliveryTime,
      deliveryLocation: `${booking.deliveryGovernorate} - ${booking.deliveryAddress}`,
      totalMealsCount: booking.totalMealsCount,
      totalFactoryCost,
      items: previewItems,
      existingOrdersCount: uniqueExisting.length,
      existingOrders: uniqueExisting,
      packagingNotes: `العلبة البيضاء الرسمية المعتمدة لـ Celebre Catering. وضع شوكة ومنديل معطر مع كل وجبة. فحص الجودة وتاريخ التعبئة. ${booking.notes || ''}`.trim(),
    };
  },

  async createFactoryOrder(bookingId: string, performedBy = 'الإدارة', options?: { forceNewVersion?: boolean }): Promise<FactoryOrder> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('الحجز غير موجود لإصدار أمر المصنع');
    }

    // Minimum 50 meals validation before issuing factory order
    if (booking.totalMealsCount < 50) {
      throw new Error(`لا يمكن إصدار أمر تشغيل للمصنع لحجز يقل إجمالي وجباته عن 50 وجبة (العدد الحالي: ${booking.totalMealsCount} وجبة). يرجى مراجعة وتعديل كميات الحجز إلى 50 وجبة فأكثر أولاً.`);
    }

    memoryDB = loadLocalDB();
    const existingOrders = (booking.factoryOrders || []).concat(
      memoryDB.factoryOrders.filter(fo => fo.bookingId === bookingId)
    );
    const uniqueExisting = Array.from(new Map(existingOrders.map(o => [o.orderNumber, o])).values());

    if (uniqueExisting.length > 0 && !options?.forceNewVersion) {
      const latest = uniqueExisting[uniqueExisting.length - 1];
      throw new Error(`يوجد بالفعل أمر مصنع صادر لهذا الحجز (${latest.orderNumber} - الإصدار v${latest.version}). إذا تم تعديل الحجز وتريد إصدار نسخة عمل جديدة للمصنع، يرجى تأكيد خيار "إصدار نسخة عمل جديدة".`);
    }

    const version = uniqueExisting.length + 1;
    memoryDB.factoryOrderCounter += 1;
    const orderNumber = `FO-2026-${String(memoryDB.factoryOrderCounter).padStart(3, '0')}`;

    const preview = await this.getFactoryOrderPreview(bookingId);

    const factoryOrder: FactoryOrder = {
      id: `fo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      version,
      status: 'READY_TO_SEND',
      eventDate: booking.eventDate,
      deliveryTime: booking.deliveryTime,
      deliveryLocation: preview.deliveryLocation,
      factoryCostTotal: preview.totalFactoryCost,
      paidToFactoryAmount: 0,
      remainingToFactoryAmount: preview.totalFactoryCost,
      paymentStatus: 'UNPAID',
      payments: [],
      items: preview.items,
      packagingNotes: preview.packagingNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryDB.factoryOrders.unshift(factoryOrder);

    // Save to PostgreSQL if databaseUrl is present
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.factoryOrder.create({
            data: {
              id: factoryOrder.id,
              orderNumber: factoryOrder.orderNumber,
              bookingId: factoryOrder.bookingId,
              bookingCode: factoryOrder.bookingCode,
              version: factoryOrder.version,
              status: factoryOrder.status,
              eventDate: factoryOrder.eventDate,
              deliveryTime: factoryOrder.deliveryTime,
              deliveryLocation: factoryOrder.deliveryLocation,
              itemsJson: JSON.stringify(factoryOrder.items),
              packagingNotes: factoryOrder.packagingNotes,
              factoryCostTotal: factoryOrder.factoryCostTotal,
              paidAmount: 0,
              remainingAmount: factoryOrder.remainingToFactoryAmount,
              paymentStatus: 'UNPAID',
            },
          });

          // Transition booking status in PostgreSQL to IN_PRODUCTION
          await client.booking.update({
            where: { id: booking.id },
            data: {
              status: 'IN_PRODUCTION',
              statusNotes: `تم تحويل الحجز للمصنع وإصدار أمر التشغيل ${orderNumber} (الإصدار v${version})`,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.createFactoryOrder.prisma');
      }
    }

    // Update memory booking
    const memBooking = memoryDB.bookings.find(b => b.id === booking.id);
    if (memBooking) {
      memBooking.status = 'IN_PRODUCTION';
      memBooking.statusNotes = `تم إصدار أمر تشغيل المصنع رقم ${orderNumber} (الإصدار v${version})`;
      memBooking.updatedAt = new Date().toISOString();
    }

    const pepsiAdjustedItems = preview.items.filter(
      it => it.drinkOption === 'pepsi' && (it.factoryDrinkAdjustment ?? 0) === FACTORY_PEPSI_ACCOUNTING.netAdjustment
    );
    const pepsiQty = pepsiAdjustedItems.reduce((acc, it) => acc + it.quantity, 0);
    const pepsiAuditNote = pepsiQty > 0
      ? ` [تم تطبيق معادلة استبدال العصير بالبيبسي للمصنع: -5 ج عصير +10 ج كانز = +5 ج على ${pepsiQty} وجبة]`
      : '';

    this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: 'إصدار أمر تشغيل المصنع',
      performedBy,
      details: `تم إصدار أمر تشغيل المصنع ${orderNumber} (الإصدار v${version}) بإجمالي ${booking.totalMealsCount} وجبة وتكلفة مصنع ${preview.totalFactoryCost} ج (خالٍ تماماً من هوامش ربح الموزع).${pepsiAuditNote}`,
    });

    saveLocalDB(memoryDB);
    return factoryOrder;
  },

  async getFactoryOrders(): Promise<FactoryOrder[]> {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbOrders = await client.factoryOrder.findMany({
            include: {
              payments: {
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (dbOrders && dbOrders.length > 0) {
            return dbOrders.map(fo => {
              let parsedItems = [];
              try {
                parsedItems = JSON.parse(fo.itemsJson);
              } catch {}
              const itemsTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.totalFactoryPrice || 0), 0);
              const costTotal = (fo.factoryCostTotal && fo.factoryCostTotal > 0) ? fo.factoryCostTotal : itemsTotal;

              const paymentsList: FactoryPayment[] = (fo.payments || []).map((p: any) => ({
                id: p.id,
                factoryOrderId: p.factoryOrderId,
                factoryOrderNumber: p.factoryOrderNumber,
                bookingId: p.bookingId,
                bookingCode: p.bookingCode,
                amount: p.amount,
                method: p.method,
                date: p.date,
                notes: p.notes || undefined,
                receiptNumber: p.receiptNumber || undefined,
                recordedBy: p.recordedBy,
                status: p.status as any,
                cancelledBy: p.cancelledBy || undefined,
                cancelledAt: p.cancelledAt ? p.cancelledAt.toISOString() : undefined,
                cancelReason: p.cancelReason || undefined,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
              }));

              const validPayments = paymentsList.filter(p => p.status === 'VALID');
              const paidAmount = validPayments.reduce((sum, p) => sum + p.amount, 0);
              const remainingAmount = costTotal - paidAmount;

              let paymentStatus: FactoryPaymentStatus = 'UNPAID';
              if (paidAmount <= 0) {
                paymentStatus = 'UNPAID';
              } else if (paidAmount < costTotal) {
                paymentStatus = 'PARTIALLY_PAID';
              } else if (paidAmount === costTotal) {
                paymentStatus = 'FULLY_PAID';
              } else {
                paymentStatus = 'OVERPAID';
              }

              return {
                id: fo.id,
                orderNumber: fo.orderNumber,
                bookingId: fo.bookingId,
                bookingCode: fo.bookingCode,
                version: fo.version,
                status: fo.status as any,
                eventDate: fo.eventDate,
                deliveryTime: fo.deliveryTime,
                deliveryLocation: fo.deliveryLocation,
                factoryCostTotal: costTotal,
                paidToFactoryAmount: paidAmount,
                remainingToFactoryAmount: remainingAmount,
                paymentStatus,
                payments: paymentsList,
                items: parsedItems,
                packagingNotes: fo.packagingNotes || '',
                createdAt: fo.createdAt.toISOString(),
                updatedAt: fo.updatedAt.toISOString(),
              };
            });
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.getFactoryOrders.prisma');
      }
    }

    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];

    return memoryDB.factoryOrders.map(fo => {
      const parsedItems = fo.items || [];
      const itemsTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.totalFactoryPrice || 0), 0);
      const costTotal = (fo.factoryCostTotal && fo.factoryCostTotal > 0) ? fo.factoryCostTotal : itemsTotal;

      const paymentsList = memoryDB.factoryPayments.filter(
        p => p.factoryOrderId === fo.id || p.factoryOrderNumber === fo.orderNumber
      );
      const validPayments = paymentsList.filter(p => p.status === 'VALID');
      const paidAmount = validPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = costTotal - paidAmount;

      let paymentStatus: FactoryPaymentStatus = 'UNPAID';
      if (paidAmount <= 0) {
        paymentStatus = 'UNPAID';
      } else if (paidAmount < costTotal) {
        paymentStatus = 'PARTIALLY_PAID';
      } else if (paidAmount === costTotal) {
        paymentStatus = 'FULLY_PAID';
      } else {
        paymentStatus = 'OVERPAID';
      }

      return {
        ...fo,
        factoryCostTotal: costTotal,
        paidToFactoryAmount: paidAmount,
        remainingToFactoryAmount: remainingAmount,
        paymentStatus,
        payments: paymentsList,
      };
    });
  },

  async getFactoryOrderById(idOrNumber: string): Promise<FactoryOrder | null> {
    const orders = await this.getFactoryOrders();
    const clean = (idOrNumber || '').trim();
    return orders.find(o => o.id === clean || o.orderNumber === clean) || null;
  },

  async getFactoryPayments(factoryOrderId?: string): Promise<FactoryPayment[]> {
    if (factoryOrderId) {
      const order = await this.getFactoryOrderById(factoryOrderId);
      return order?.payments || [];
    }

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const list = await client.factoryPayment.findMany({
            orderBy: { createdAt: 'desc' },
          });
          return list.map((p: any) => ({
            id: p.id,
            factoryOrderId: p.factoryOrderId,
            factoryOrderNumber: p.factoryOrderNumber,
            bookingId: p.bookingId,
            bookingCode: p.bookingCode,
            amount: p.amount,
            method: p.method,
            date: p.date,
            notes: p.notes || undefined,
            receiptNumber: p.receiptNumber || undefined,
            recordedBy: p.recordedBy,
            status: p.status as any,
            cancelledBy: p.cancelledBy || undefined,
            cancelledAt: p.cancelledAt ? p.cancelledAt.toISOString() : undefined,
            cancelReason: p.cancelReason || undefined,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
          }));
        }
      } catch (err: any) {
        logServerError(err, 'db.getFactoryPayments.prisma');
      }
    }

    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    return [...memoryDB.factoryPayments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addFactoryPayment(data: {
    factoryOrderId: string;
    amount: number;
    method: FactoryPayment['method'];
    date?: string;
    notes?: string;
    receiptNumber?: string;
  }, performedBy = 'الإدارة'): Promise<{ payment: FactoryPayment; factoryOrder: FactoryOrder }> {
    const cleanOrderId = (data.factoryOrderId || '').trim();
    const order = await this.getFactoryOrderById(cleanOrderId);
    if (!order) {
      throw new Error('أمر تشغيل المصنع غير موجود لتسجيل الدفعة');
    }

    const numAmount = Number(data.amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      throw new Error('قيمة دفعة المصنع يجب أن تكون رقماً موجباً أكبر من الصفر');
    }

    const cleanReceipt = data.receiptNumber?.trim();
    if (cleanReceipt) {
      const existingDuplicate = (order.payments || []).find(
        p => p.status === 'VALID' && p.receiptNumber && p.receiptNumber.trim().toLowerCase() === cleanReceipt.toLowerCase()
      );
      if (existingDuplicate) {
        throw new Error(`يوجد بالفعل دفعة مسجلة لنفس أمر المصنع بنفس رقم الإيصال / المرجع (${cleanReceipt}) بقيمة ${existingDuplicate.amount} ج.`);
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const paymentId = `fpay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newPayment: FactoryPayment = {
      id: paymentId,
      factoryOrderId: order.id,
      factoryOrderNumber: order.orderNumber,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      amount: numAmount,
      method: data.method || 'cash',
      date: data.date?.trim() || nowIso.split('T')[0],
      notes: data.notes?.trim() || undefined,
      receiptNumber: cleanReceipt || undefined,
      recordedBy: performedBy,
      status: 'VALID',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Recalculate balances
    const priorValidPayments = (order.payments || []).filter(p => p.status === 'VALID');
    const newPaid = priorValidPayments.reduce((acc, p) => acc + p.amount, 0) + numAmount;
    const costTotal = order.factoryCostTotal || 0;
    const newRemaining = costTotal - newPaid;

    let newStatus: FactoryPaymentStatus = 'UNPAID';
    if (newPaid <= 0) {
      newStatus = 'UNPAID';
    } else if (newPaid < costTotal) {
      newStatus = 'PARTIALLY_PAID';
    } else if (newPaid === costTotal) {
      newStatus = 'FULLY_PAID';
    } else {
      newStatus = 'OVERPAID';
    }

    const auditDetail = `تم تسجيل دفعة مالية للمصنع بقيمة ${numAmount} ج.م بطريقة (${newPayment.method}) لأمر التشغيل ${order.orderNumber} (حجز: ${order.bookingCode}) بواسطة (${performedBy}). المسدد للمصنع: ${newPaid} ج، المتبقي: ${newRemaining} ج.${cleanReceipt ? ` مرجع: ${cleanReceipt}.` : ''}${newStatus === 'OVERPAID' ? ` [تنبيه: سداد بالزيادة قدره ${newPaid - costTotal} ج]` : ''}`;

    // Execute in PostgreSQL transaction if configured
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.factoryPayment.create({
              data: {
                id: newPayment.id,
                factoryOrderId: order.id,
                factoryOrderNumber: order.orderNumber,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                amount: newPayment.amount,
                method: newPayment.method,
                date: newPayment.date,
                notes: newPayment.notes,
                receiptNumber: newPayment.receiptNumber,
                recordedBy: newPayment.recordedBy,
                status: newPayment.status,
              },
            });

            await tx.factoryOrder.update({
              where: { id: order.id },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                paymentStatus: newStatus,
                updatedAt: now,
              },
            });

            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                action: 'تسجيل دفعة مصنع',
                performedBy,
                details: auditDetail,
              },
            });
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.addFactoryPayment.prisma');
      }
    }

    // Save in memoryDB
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    memoryDB.factoryPayments.unshift(newPayment);

    const memOrderIdx = memoryDB.factoryOrders.findIndex(o => o.id === order.id || o.orderNumber === order.orderNumber);
    if (memOrderIdx !== -1) {
      memoryDB.factoryOrders[memOrderIdx].paidToFactoryAmount = newPaid;
      memoryDB.factoryOrders[memOrderIdx].remainingToFactoryAmount = newRemaining;
      memoryDB.factoryOrders[memOrderIdx].paymentStatus = newStatus;
      memoryDB.factoryOrders[memOrderIdx].updatedAt = nowIso;
    }

    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      action: 'تسجيل دفعة مصنع',
      performedBy,
      details: auditDetail,
      timestamp: nowIso,
    });

    saveLocalDB(memoryDB);

    const updatedOrder = (await this.getFactoryOrderById(order.id)) || {
      ...order,
      paidToFactoryAmount: newPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newStatus,
      payments: [newPayment, ...(order.payments || [])],
    };

    return { payment: newPayment, factoryOrder: updatedOrder };
  },

  async updateFactoryPayment(
    paymentId: string,
    updates: {
      amount?: number;
      method?: FactoryPayment['method'];
      date?: string;
      notes?: string;
      receiptNumber?: string;
    },
    performedBy = 'الإدارة'
  ): Promise<{ payment: FactoryPayment; factoryOrder: FactoryOrder }> {
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];

    const payment = memoryDB.factoryPayments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('دفعة المصنع المراد تعديلها غير موجودة');
    }

    const order = memoryDB.factoryOrders.find(o => o.id === payment.factoryOrderId || o.orderNumber === payment.factoryOrderNumber);
    if (!order) {
      throw new Error('أمر المصنع المرتبط بالدفعة غير موجود');
    }

    const oldAmount = payment.amount;
    const oldMethod = payment.method;
    const oldReceipt = payment.receiptNumber;

    if (updates.amount !== undefined) {
      const num = Number(updates.amount);
      if (isNaN(num) || num <= 0) {
        throw new Error('قيمة الدفعة المعدلة يجب أن تكون رقماً موجباً أكبر من الصفر');
      }
      payment.amount = num;
    }

    if (updates.method !== undefined) {
      payment.method = updates.method;
    }

    if (updates.date !== undefined) {
      payment.date = updates.date.trim();
    }

    if (updates.notes !== undefined) {
      payment.notes = updates.notes.trim() || undefined;
    }

    if (updates.receiptNumber !== undefined) {
      const cleanRec = updates.receiptNumber.trim() || undefined;
      if (cleanRec && cleanRec !== oldReceipt) {
        const dup = memoryDB.factoryPayments.find(
          p => p.id !== paymentId && p.status === 'VALID' && (p.factoryOrderId === order.id || p.factoryOrderNumber === order.orderNumber) && p.receiptNumber && p.receiptNumber.trim().toLowerCase() === cleanRec.toLowerCase()
        );
        if (dup) {
          throw new Error(`رقم الإيصال / المرجع (${cleanRec}) مستخدم بالفعل في دفعة أخرى لنفس أمر المصنع.`);
        }
      }
      payment.receiptNumber = cleanRec;
    }

    payment.updatedAt = new Date().toISOString();

    // Recalculate balances
    const allValidPayments = memoryDB.factoryPayments.filter(
      p => p.status === 'VALID' && (p.factoryOrderId === order.id || p.factoryOrderNumber === order.orderNumber)
    );
    const newPaid = allValidPayments.reduce((acc, p) => acc + p.amount, 0);
    const itemsTotal = (order.items || []).reduce((acc: number, item: any) => acc + (item.totalFactoryPrice || 0), 0);
    const costTotal = (order.factoryCostTotal && order.factoryCostTotal > 0) ? order.factoryCostTotal : itemsTotal;
    const newRemaining = costTotal - newPaid;

    let newStatus: FactoryPaymentStatus = 'UNPAID';
    if (newPaid <= 0) {
      newStatus = 'UNPAID';
    } else if (newPaid < costTotal) {
      newStatus = 'PARTIALLY_PAID';
    } else if (newPaid === costTotal) {
      newStatus = 'FULLY_PAID';
    } else {
      newStatus = 'OVERPAID';
    }

    order.paidToFactoryAmount = newPaid;
    order.remainingToFactoryAmount = newRemaining;
    order.paymentStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    const auditDetail = `تم تعديل دفعة المصنع (المعرف: ${payment.id}) لأمر التشغيل ${order.orderNumber} بواسطة (${performedBy}). المبلغ: كان ${oldAmount} ج وأصبح ${payment.amount} ج، الطريقة: ${oldMethod} -> ${payment.method}. المسدد الجديد: ${newPaid} ج، المتبقي: ${newRemaining} ج.`;

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.factoryPayment.update({
              where: { id: payment.id },
              data: {
                amount: payment.amount,
                method: payment.method,
                date: payment.date,
                notes: payment.notes,
                receiptNumber: payment.receiptNumber,
                updatedAt: new Date(),
              },
            });

            await tx.factoryOrder.update({
              where: { id: order.id },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                paymentStatus: newStatus,
                updatedAt: new Date(),
              },
            });

            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                action: 'تعديل دفعة مصنع',
                performedBy,
                details: auditDetail,
              },
            });
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.updateFactoryPayment.prisma');
      }
    }

    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      action: 'تعديل دفعة مصنع',
      performedBy,
      details: auditDetail,
      timestamp: new Date().toISOString(),
    });

    saveLocalDB(memoryDB);

    const updatedOrder: FactoryOrder = {
      ...order,
      paidToFactoryAmount: newPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newStatus,
      payments: allValidPayments,
    };

    return { payment, factoryOrder: updatedOrder };
  },

  async deleteFactoryPayment(
    paymentId: string,
    performedBy = 'الإدارة',
    reason = 'حذف دفعة مسجلة بالخطأ'
  ): Promise<{ success: boolean; factoryOrder: FactoryOrder }> {
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];

    const payIdx = memoryDB.factoryPayments.findIndex(p => p.id === paymentId);
    if (payIdx === -1) {
      throw new Error('دفعة المصنع المراد حذفها غير موجودة');
    }

    const payment = memoryDB.factoryPayments[payIdx];
    const order = memoryDB.factoryOrders.find(o => o.id === payment.factoryOrderId || o.orderNumber === payment.factoryOrderNumber);
    if (!order) {
      throw new Error('أمر المصنع المرتبط بالدفعة غير موجود');
    }

    // Remove from active payments
    memoryDB.factoryPayments.splice(payIdx, 1);

    // Recalculate balances
    const remainingPayments = memoryDB.factoryPayments.filter(
      p => p.status === 'VALID' && (p.factoryOrderId === order.id || p.factoryOrderNumber === order.orderNumber)
    );
    const newPaid = remainingPayments.reduce((acc, p) => acc + p.amount, 0);
    const itemsTotal = (order.items || []).reduce((acc: number, item: any) => acc + (item.totalFactoryPrice || 0), 0);
    const costTotal = (order.factoryCostTotal && order.factoryCostTotal > 0) ? order.factoryCostTotal : itemsTotal;
    const newRemaining = costTotal - newPaid;

    let newStatus: FactoryPaymentStatus = 'UNPAID';
    if (newPaid <= 0) {
      newStatus = 'UNPAID';
    } else if (newPaid < costTotal) {
      newStatus = 'PARTIALLY_PAID';
    } else if (newPaid === costTotal) {
      newStatus = 'FULLY_PAID';
    } else {
      newStatus = 'OVERPAID';
    }

    order.paidToFactoryAmount = newPaid;
    order.remainingToFactoryAmount = newRemaining;
    order.paymentStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    const auditDetail = `قام الإداري (${performedBy}) بحذف دفعة مصنع بقيمة ${payment.amount} ج.م (طريقة: ${payment.method}، إيصال: ${payment.receiptNumber || 'بدون'}) لأمر التشغيل ${order.orderNumber}. السبب: ${reason}. المسدد الجديد: ${newPaid} ج، المتبقي: ${newRemaining} ج.`;

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.factoryPayment.delete({
              where: { id: paymentId },
            });

            await tx.factoryOrder.update({
              where: { id: order.id },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                paymentStatus: newStatus,
                updatedAt: new Date(),
              },
            });

            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                action: 'حذف دفعة مصنع',
                performedBy,
                details: auditDetail,
              },
            });
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.deleteFactoryPayment.prisma');
      }
    }

    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      action: 'حذف دفعة مصنع',
      performedBy,
      details: auditDetail,
      timestamp: new Date().toISOString(),
    });

    saveLocalDB(memoryDB);

    const updatedOrder: FactoryOrder = {
      ...order,
      paidToFactoryAmount: newPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newStatus,
      payments: remainingPayments,
    };

    return { success: true, factoryOrder: updatedOrder };
  },

  async updateFactoryOrderStatus(orderId: string, status: FactoryOrder['status'], performedBy = 'المصنع'): Promise<FactoryOrder | null> {
    memoryDB = loadLocalDB();
    const fo = memoryDB.factoryOrders.find(item => item.id === orderId || item.orderNumber === orderId);
    if (!fo) return null;

    fo.status = status;
    fo.updatedAt = new Date().toISOString();

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.factoryOrder.updateMany({
            where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
            data: { status, updatedAt: new Date() },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.updateFactoryOrderStatus.prisma');
      }
    }

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
      bookingCode: fo.bookingCode || (booking ? booking.bookingCode : 'FACTORY_ORDER'),
      action: 'تحديث حالة أمر المصنع',
      performedBy,
      details: `تم تحديث حالة أمر المصنع ${fo.orderNumber} إلى ${status}`,
    });

    saveLocalDB(memoryDB);
    return fo;
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { bookingCode?: string }): Promise<AuditLog> {
    let bCode = (log.bookingCode || '').trim();
    if (!bCode && log.bookingId) {
      const b = await this.getBookingById(log.bookingId);
      if (b && b.bookingCode) {
        bCode = b.bookingCode.trim();
      }
    }
    if (!bCode) {
      bCode = 'SYSTEM';
    }

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: log.bookingId || '',
      bookingCode: bCode,
      action: log.action,
      performedBy: log.performedBy,
      details: log.details,
      timestamp: new Date().toISOString(),
    };

    if (!memoryDB || !Array.isArray(memoryDB.auditLogs)) {
      memoryDB = loadLocalDB();
    }
    memoryDB.auditLogs.unshift(newLog);
    saveLocalDB(memoryDB);

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.auditLog.create({
            data: {
              id: newLog.id,
              bookingId: newLog.bookingId || null,
              bookingCode: newLog.bookingCode,
              action: newLog.action,
              performedBy: newLog.performedBy,
              details: newLog.details,
            },
          });
        }
      } catch (err: any) {
        // Safe logging without interrupting response
        logServerError(err, 'db.addAuditLog.prisma');
      }
    }

    return newLog;
  },

  async getAuditLogs(bookingId?: string): Promise<AuditLog[]> {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const whereClause = bookingId 
            ? { OR: [{ bookingId }, { bookingCode: bookingId }] } 
            : undefined;
          const logs = await client.auditLog.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' },
            take: 50,
          });
          if (logs && logs.length > 0) {
            return logs.map(l => ({
              id: l.id,
              bookingId: l.bookingId || '',
              bookingCode: l.bookingCode || '',
              action: l.action,
              performedBy: l.performedBy,
              details: l.details,
              timestamp: l.timestamp.toISOString(),
            }));
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.getAuditLogs.prisma');
      }
    }

    memoryDB = loadLocalDB();
    if (bookingId) {
      return memoryDB.auditLogs.filter(l => l.bookingId === bookingId || l.bookingCode === bookingId);
    }
    return memoryDB.auditLogs.slice(0, 50);
  },

  async getStats() {
    const bookings = await this.getBookings();
    const totalBookings = bookings.length;
    let totalMeals = 0;
    let totalRevenue = 0;
    let totalFactoryCost = 0;
    let totalCollected = 0;

    bookings.forEach(b => {
      if (b.status !== 'CANCELLED') {
        totalMeals += b.totalMealsCount;
        totalRevenue += b.totalDistributorPrice;
        totalFactoryCost += (b.totalFactoryPrice || 0);
        totalCollected += b.paidAmount;
      }
    });

    const totalProfit = totalRevenue - totalFactoryCost;
    const totalOutstanding = Math.max(0, totalRevenue - totalCollected);
    const meals = await this.getMeals(true);
    const factoryOrders = await this.getFactoryOrders();

    return {
      totalBookings,
      totalMeals,
      totalRevenue,
      totalFactoryCost,
      totalProfit,
      totalCollected,
      totalOutstanding,
      activeMealsCount: meals.filter(m => m.isActive).length,
      factoryOrdersCount: factoryOrders.length,
    };
  },

  async verifyAdmin(username: string, password: string): Promise<AdminUser | null> {
    if (!username || !password) return null;

    // 1. Check PostgreSQL via Prisma ORM
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbUser = await client.adminUser.findFirst({
            where: {
              OR: [
                { username: { equals: username, mode: 'insensitive' } },
                { email: { equals: username, mode: 'insensitive' } },
              ],
            },
          });
          if (dbUser) {
            const isValid = bcrypt.compareSync(password, dbUser.passwordHash);
            if (isValid) {
              return {
                id: dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role as any,
              };
            }
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.verifyAdmin.prisma');
      }
    }

    // 2. Check local memoryDB
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

  async updateAdminPassword(username: string, newPasswordHash: string, performedBy = 'الإدارة'): Promise<boolean> {
    // 1. Update memoryDB
    memoryDB = loadLocalDB();
    const user = memoryDB.adminUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );
    if (user) {
      user.passwordHash = newPasswordHash;
      saveLocalDB(memoryDB);
    }

    // 2. Update PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.adminUser.updateMany({
            where: {
              OR: [
                { username: { equals: username, mode: 'insensitive' } },
                { email: { equals: username, mode: 'insensitive' } },
              ],
            },
            data: {
              passwordHash: newPasswordHash,
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.updateAdminPassword.prisma');
      }
    }

    // 3. Log audit event
    await this.addAuditLog({
      bookingId: '',
      bookingCode: 'ADMIN_AUTH',
      action: 'تغيير كلمة مرور الإداري',
      performedBy,
      details: `تم تغيير كلمة المرور للمستخدم (${username}) بنجاح، وتشفيرها عبر bcrypt وإلغاء جميع الجلسات القديمة فوراً.`,
    });

    return true;
  },

  // STRICT TEST BOOKING MANAGEMENT: Only bookings with isTest === true can be modified or deleted
  async updateTestBooking(id: string, updates: Partial<Booking>, performedBy = 'الإدارة'): Promise<Booking> {
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    const isTest = Boolean(booking.isTest && booking.bookingCode !== 'CLB-2026-5131');
    if (!isTest) {
      throw new Error('ممنوع: لا يمكن تعديل سوى الحجوزات التجريبية فقط (isTest: true). الحجوزات الحقيقية والتاريخية محمية بالكامل ولا تقبل التعديل من هذا المسار.');
    }

    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id);

    const updatedBooking: Booking = {
      ...booking,
      ...updates,
      version: booking.version + 1,
      updatedAt: new Date().toISOString(),
    };

    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    }

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              customerName: updates.customerName ?? booking.customerName,
              customerPhone: updates.customerPhone ?? booking.customerPhone,
              eventName: updates.eventName ?? booking.eventName,
              eventDate: updates.eventDate ?? booking.eventDate,
              deliveryTime: updates.deliveryTime ?? booking.deliveryTime,
              deliveryGovernorate: updates.deliveryGovernorate ?? booking.deliveryGovernorate,
              deliveryAddress: updates.deliveryAddress ?? booking.deliveryAddress,
              notes: updates.notes !== undefined ? updates.notes : booking.notes,
              status: updates.status ?? booking.status,
              version: updatedBooking.version,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.updateTestBooking.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: 'تعديل حجز تجريبي',
      performedBy,
      details: `تم تعديل بيانات الحجز التجريبي ${booking.bookingCode} (الإصدار v${updatedBooking.version}).`,
    });

    return updatedBooking;
  },

  async deleteTestBooking(id: string, performedBy = 'الإدارة'): Promise<{ success: boolean; bookingCode: string }> {
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    const isTest = Boolean(booking.isTest && booking.bookingCode !== 'CLB-2026-5131');
    if (!isTest) {
      throw new Error('ممنوع منعاً باتاً: لا يمكن حذف سوى الحجوزات التجريبية فقط (isTest: true). الحجوزات الحقيقية للعملاء محمية ولا يجوز حذفها.');
    }

    const bookingCode = booking.bookingCode;
    const targetId = booking.id;

    // Delete from PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          // Delete child records first
          await client.bookingItem.deleteMany({ where: { bookingId: targetId } });
          await client.payment.deleteMany({ where: { bookingId: targetId } });
          await client.factoryOrder.deleteMany({ where: { bookingId: targetId } });
          await client.auditLog.deleteMany({ where: { bookingId: targetId } });
          await client.booking.delete({ where: { id: targetId } });
        }
      } catch (err: any) {
        logServerError(err, 'db.deleteTestBooking.prisma');
      }
    }

    // Delete from memoryDB
    memoryDB = loadLocalDB();
    memoryDB.bookings = memoryDB.bookings.filter(b => b.id !== targetId && b.bookingCode !== bookingCode);
    memoryDB.payments = memoryDB.payments.filter(p => p.bookingId !== targetId);
    memoryDB.factoryOrders = memoryDB.factoryOrders.filter(fo => fo.bookingId !== targetId);
    saveLocalDB(memoryDB);

    await this.addAuditLog({
      bookingId: '',
      bookingCode,
      action: 'حذف حجز تجريبي',
      performedBy,
      details: `تم حذف الحجز التجريبي رقم ${bookingCode} بكافة بنوده التجريبية بعد التأكيد الصريح.`,
    });

    return { success: true, bookingCode };
  },

  async updateBookingByAdmin(
    id: string,
    updates: {
      customerName?: string;
      customerPhone?: string;
      customerWhatsapp?: string;
      preferredContact?: 'whatsapp' | 'phone';
      eventName?: string;
      eventDate?: string;
      deliveryTime?: string;
      deliveryGovernorate?: string;
      deliveryAddress?: string;
      notes?: string;
      status?: BookingStatus;
      statusNotes?: string;
      items?: {
        mealCode: string;
        quantity: number;
        drinkOption: DrinkModification;
      }[];
    },
    performedBy = 'الإدارة'
  ): Promise<Booking> {
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    const meals = await this.getMeals(true);
    const mealsMap = new Map(meals.map(m => [m.code, m]));

    let validatedItems = booking.items;
    let totalMealsCount = booking.totalMealsCount;
    let totalDistributorPrice = booking.totalDistributorPrice;
    let totalFactoryPrice = booking.totalFactoryPrice || 0;
    let profitMargin = booking.profitMargin || 0;
    let remainingAmount = booking.remainingAmount;

    if (updates.items && Array.isArray(updates.items)) {
      if (updates.items.length === 0) {
        throw new Error('يجب أن يحتوي الحجز على صنف واحد على الأقل');
      }

      totalMealsCount = 0;
      totalDistributorPrice = 0;
      totalFactoryPrice = 0;

      validatedItems = updates.items.map(item => {
        const meal = mealsMap.get(item.mealCode);
        if (!meal) {
          throw new Error(`الوجبة ${item.mealCode} غير موجودة في المنيو المعتمد`);
        }
        const quantity = Math.max(1, Math.floor(item.quantity));
        totalMealsCount += quantity;

        const baseDistributorPrice = meal.distributorPrice;
        const baseFactoryPrice = meal.factoryPrice || 0;

        let distributorDrinkDelta = 0;
        let factoryDrinkDelta = 0;

        if (meal.hasJuice) {
          if (item.drinkOption === 'no_juice') {
            distributorDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
            factoryDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
          } else if (item.drinkOption === 'pepsi') {
            distributorDrinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra; // +10 for customer
            factoryDrinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment; // +4 for factory
          }
        }

        const unitDistributorPrice = Math.max(0, baseDistributorPrice + distributorDrinkDelta);
        const unitFactoryPrice = Math.max(0, baseFactoryPrice + factoryDrinkDelta);
        const itemTotalDistributor = unitDistributorPrice * quantity;
        const itemTotalFactory = unitFactoryPrice * quantity;

        totalDistributorPrice += itemTotalDistributor;
        totalFactoryPrice += itemTotalFactory;

        return {
          mealId: meal.id,
          mealCode: meal.code,
          mealName: meal.name,
          category: meal.category,
          ingredients: meal.ingredients,
          quantity,
          drinkOption: item.drinkOption,
          baseDistributorPrice,
          unitDistributorPrice,
          totalDistributorPrice: itemTotalDistributor,
          baseFactoryPrice,
          factoryDrinkAdjustment: factoryDrinkDelta,
          unitFactoryPrice,
          totalFactoryPrice: itemTotalFactory,
        };
      });

      profitMargin = totalDistributorPrice - totalFactoryPrice;
      remainingAmount = Math.max(0, totalDistributorPrice - booking.paidAmount);
    }

    const targetStatus = updates.status || booking.status;
    if ((targetStatus === 'CONFIRMED' || targetStatus === 'IN_PRODUCTION') && totalMealsCount < 50) {
      throw new Error(`لا يمكن اعتماد الحجز أو نقله للتشغيل بكمية تقل عن 50 وجبة (الكمية الإجمالية الحالية: ${totalMealsCount} وجبة). يرجى تعديل الكميات أولاً.`);
    }

    const updatedBooking: Booking = {
      ...booking,
      customerName: updates.customerName !== undefined ? updates.customerName.trim() : booking.customerName,
      customerPhone: updates.customerPhone !== undefined ? updates.customerPhone.trim() : booking.customerPhone,
      customerWhatsapp: updates.customerWhatsapp !== undefined ? updates.customerWhatsapp.trim() : booking.customerWhatsapp,
      preferredContact: updates.preferredContact || booking.preferredContact,
      eventName: updates.eventName !== undefined ? updates.eventName.trim() : booking.eventName,
      eventDate: updates.eventDate || booking.eventDate,
      deliveryTime: updates.deliveryTime || booking.deliveryTime,
      deliveryGovernorate: updates.deliveryGovernorate || booking.deliveryGovernorate,
      deliveryAddress: updates.deliveryAddress !== undefined ? updates.deliveryAddress.trim() : booking.deliveryAddress,
      notes: updates.notes !== undefined ? updates.notes.trim() : booking.notes,
      status: targetStatus,
      statusNotes: updates.statusNotes !== undefined ? updates.statusNotes : booking.statusNotes,
      items: validatedItems,
      totalMealsCount,
      totalDistributorPrice,
      totalFactoryPrice,
      profitMargin,
      remainingAmount,
      version: booking.version + 1,
      updatedAt: new Date().toISOString(),
    };

    // Update MemoryDB
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id);
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    }

    // Update PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              customerName: updatedBooking.customerName,
              customerPhone: updatedBooking.customerPhone,
              customerWhatsapp: updatedBooking.customerWhatsapp,
              preferredContact: updatedBooking.preferredContact,
              eventName: updatedBooking.eventName,
              eventDate: updatedBooking.eventDate,
              deliveryTime: updatedBooking.deliveryTime,
              deliveryGovernorate: updatedBooking.deliveryGovernorate,
              deliveryAddress: updatedBooking.deliveryAddress,
              notes: updatedBooking.notes,
              status: updatedBooking.status,
              statusNotes: updatedBooking.statusNotes,
              totalMealsCount: updatedBooking.totalMealsCount,
              totalDistributorPrice: updatedBooking.totalDistributorPrice,
              totalFactoryPrice: updatedBooking.totalFactoryPrice,
              profitMargin: updatedBooking.profitMargin,
              remainingAmount: updatedBooking.remainingAmount,
              version: updatedBooking.version,
              updatedAt: new Date(),
            },
          });

          if (updates.items && Array.isArray(updates.items)) {
            await client.bookingItem.deleteMany({ where: { bookingId: booking.id } });
            await client.bookingItem.createMany({
              data: validatedItems.map(it => ({
                bookingId: booking.id,
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
            });
          }
        }
      } catch (err: any) {
        logServerError(err, 'db.updateBookingByAdmin.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: 'تعديل حجز بواسطة الإدارة',
      performedBy,
      details: `تم تعديل بيانات الحجز ${booking.bookingCode} (الإصدار v${updatedBooking.version}). إجمالي الوجبات: ${totalMealsCount}، إجمالي القيمة: ${totalDistributorPrice} ج.`,
    });

    return updatedBooking;
  },

  async confirmBooking(id: string, performedBy = 'الإدارة'): Promise<Booking> {
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    if (booking.totalMealsCount < 50) {
      throw new Error(`لا يمكن تأكيد حجز يقل إجمالي وجباته عن 50 وجبة (العدد الحالي: ${booking.totalMealsCount} وجبة). يرجى تعديل الكميات أولاً لتصل إلى 50 وجبة على الأقل.`);
    }

    const prevStatus = booking.status;
    const newVersion = booking.version + 1;
    const now = new Date().toISOString();

    const updatedBooking: Booking = {
      ...booking,
      status: 'CONFIRMED',
      statusNotes: `تم تأكيد واعتماد الحجز رسمياً بواسطة الإدارة (${performedBy}) في ${new Date().toLocaleString('ar-EG')}.`,
      version: newVersion,
      updatedAt: now,
    };

    // Update MemoryDB
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id);
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    }

    // Update PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              statusNotes: updatedBooking.statusNotes,
              version: newVersion,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.confirmBooking.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: 'تأكيد واعتماد الحجز',
      performedBy,
      details: `تم تأكيد واعتماد الحجز ${booking.bookingCode} (تغيير الحالة من ${prevStatus} إلى CONFIRMED) بواسطة (${performedBy}). إجمالي الوجبات: ${booking.totalMealsCount} وجبة، القيمة: ${booking.totalDistributorPrice} ج.م.`,
    });

    return updatedBooking;
  },

  async confirmFactoryOrderSent(orderId: string, performedBy = 'الإدارة'): Promise<FactoryOrder> {
    memoryDB = loadLocalDB();
    const order = memoryDB.factoryOrders.find(fo => fo.id === orderId || fo.orderNumber === orderId);
    if (!order) {
      throw new Error('أمر المصنع غير موجود');
    }

    const now = new Date().toISOString();
    order.status = 'MANUALLY_CONFIRMED' as any;
    order.sentBy = performedBy;
    order.sentAt = now;
    order.updatedAt = now;

    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.factoryOrder.updateMany({
            where: { OR: [{ id: order.id }, { orderNumber: order.orderNumber }] },
            data: { status: 'MANUALLY_CONFIRMED', updatedAt: new Date() },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.confirmFactoryOrderSent.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: order.bookingId,
      bookingCode: order.bookingCode || 'FACTORY_ORDER',
      action: 'تأكيد إرسال أمر التشغيل للمصنع يدوياً',
      performedBy,
      details: `قام الإداري (${performedBy}) بتأكيد إرسال أمر التشغيل ${order.orderNumber} (الإصدار v${order.version}) إلى واتساب المصنع يدوياً في ${now}.`,
    });

    saveLocalDB(memoryDB);
    return order;
  },
};

export function buildFactoryWhatsAppMessage(factoryOrder: FactoryOrder, booking: Booking, factoryPhone?: string): { messageText: string; whatsappUrl: string } {
  const itemsText = factoryOrder.items.map((it) => {
    let drinkText = 'عصير بخيرة القياسي';
    if (it.drinkOption === 'pepsi') {
      drinkText = 'استبدال العصير بكانز بيبسي';
    } else if (it.drinkOption === 'no_juice') {
      drinkText = 'بدون عصير';
    } else if (it.drinkLabel) {
      drinkText = it.drinkLabel;
    }

    return [
      `• *الوجبة:* ${it.mealName} (${it.mealCode})`,
      `  - *خيار المشروب:* ${drinkText}`,
      `  - *الكمية:* ${it.quantity} بوكس`,
      `  - *سعر المصنع المعدّل للبوكس:* ${it.unitFactoryPrice ?? 0} ج.م`,
      `  - *إجمالي الصنف للمصنع:* ${it.totalFactoryPrice ?? 0} ج.م`,
      `  - *المكونات:* ${it.ingredients}`
    ].join('\n');
  }).join('\n\n');

  const totalCost = factoryOrder.factoryCostTotal || 0;

  const lines = [
    `*أمر تشغيل مطبخ ومصنع CÉLÈBRE CATERING*`,
    `-----------------------------------------`,
    `*رقم أمر التشغيل:* ${factoryOrder.orderNumber} (الإصدار v${factoryOrder.version})`,
    `*رقم الحجز المرجعي:* ${booking.bookingCode}`,
    `*تاريخ وموعد التسليم:* ${factoryOrder.eventDate} الساعة ${factoryOrder.deliveryTime}`,
    `*مكان التسليم:* ${factoryOrder.deliveryLocation}`,
    `*العميل / المستلم:* ${booking.customerName} (${booking.customerPhone})`,
    `-----------------------------------------`,
    `*بيان الوجبات وتكلفة التشغيل للمصنع:*`,
    itemsText,
    `-----------------------------------------`,
    `*إجمالي عدد البوكسات:* ${booking.totalMealsCount} بوكس`,
    `*إجمالي تكلفة أمر المصنع بعد التعديل:* ${totalCost.toLocaleString('ar-EG')} جنيه مصري`,
    `*تعليمات التعبئة والتغليف:* ${factoryOrder.packagingNotes}`,
    `-----------------------------------------`,
    `*تنبيه تشغيلي:* هذه وثيقة تشغيل وتكلفة مصنع رسمية صادرة من إدارة سيليبري (تتضمن أسعار المصنع المعدّلة فقط وخالية تماماً من أسعار وهوامش ربح الموزع).`
  ];

  const messageText = lines.join('\n');
  const cleanPhone = (factoryPhone || '').replace(/\D/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}` : '';
  return { messageText, whatsappUrl };
}
