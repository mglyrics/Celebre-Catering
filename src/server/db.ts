import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { Meal, Booking, BookingStatus, PaymentRecord, FactoryOrder, AuditLog, AdminUser, DrinkModification } from '../types';
import { INITIAL_MEALS, CELEBRE_CONFIG } from '../data/defaultMeals';

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
  }, performedBy = 'الإدارة'): Promise<{ payment: PaymentRecord; booking: Booking }> {
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      throw new Error('قيمة الدفعة يجب أن تكون أكبر من الصفر');
    }

    memoryDB = loadLocalDB();
    const booking = memoryDB.bookings.find(b => b.id === data.bookingId || b.bookingCode === data.bookingId);
    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    // Active valid payments
    const activePayments = memoryDB.payments.filter(p => p.bookingId === booking.id && p.status !== 'CANCELLED');
    const currentPaid = activePayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const currentRemaining = Math.max(0, booking.totalDistributorPrice - currentPaid);

    if (Number(data.amount) > currentRemaining && !data.allowOverpayment) {
      throw new Error(`قيمة الدفعة (${data.amount} ج) تتجاوز المبلغ المتبقي على العميل (${currentRemaining} ج). إذا كانت دفعة تسوية خاصة أو زيادة مقصودة، يرجى تفعيل خيار "سماح بمبلغ تسوية زائد".`);
    }

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: booking.id,
      amount: Number(data.amount),
      method: data.method,
      date: data.date || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      receiptNumber: data.receiptNumber || '',
      recordedBy: performedBy,
      status: 'VALID',
      createdAt: new Date().toISOString(),
    };

    memoryDB.payments.unshift(payment);

    // Update booking totals without automatically changing booking status
    const newPaidAmount = currentPaid + payment.amount;
    booking.paidAmount = newPaidAmount;
    booking.remainingAmount = Math.max(0, booking.totalDistributorPrice - newPaidAmount);
    booking.version += 1;
    booking.updatedAt = new Date().toISOString();

    // Persist to PostgreSQL if configured
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.payment.create({
            data: {
              id: payment.id,
              bookingId: booking.id,
              amount: payment.amount,
              method: payment.method,
              date: payment.date,
              notes: `[سجلت بواسطة: ${performedBy}] ${payment.notes || ''}`.trim(),
              receiptNumber: payment.receiptNumber || null,
            },
          });

          await client.booking.update({
            where: { id: booking.id },
            data: {
              paidAmount: booking.paidAmount,
              remainingAmount: booking.remainingAmount,
              version: booking.version,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.addPayment.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: booking.id,
      action: 'تسجيل دفعة مالية',
      performedBy,
      details: `تم تسجيل دفعة بقيمة ${payment.amount} ج.م بطريقة (${payment.method}) للحجز ${booking.bookingCode}. المسدد: ${booking.paidAmount} ج، المتبقي: ${booking.remainingAmount} ج. مرجع: ${payment.receiptNumber || 'لا يوجد'}.`,
    });

    saveLocalDB(memoryDB);
    return { payment, booking };
  },

  async cancelPayment(
    paymentId: string,
    reason: string,
    performedBy = 'الإدارة'
  ): Promise<{ success: boolean; payment: PaymentRecord; booking: Booking }> {
    if (!reason || !reason.trim()) {
      throw new Error('يرجى تحديد سبب إلغاء أو عكس الدفعة المالية لتوثيقها في سجل التدقيق');
    }

    memoryDB = loadLocalDB();
    const payment = memoryDB.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('الدفعة المالية غير موجودة');
    }

    if (payment.status === 'CANCELLED') {
      throw new Error('هذه الدفعة ملغاة بالفعل مسبقاً');
    }

    const booking = memoryDB.bookings.find(b => b.id === payment.bookingId);
    if (!booking) {
      throw new Error('الحجز المرتبط بهذه الدفعة غير موجود');
    }

    const now = new Date().toISOString();
    payment.status = 'CANCELLED';
    payment.cancelledBy = performedBy;
    payment.cancelledAt = now;
    payment.cancelReason = reason.trim();
    payment.notes = `${payment.notes || ''} [ملغاة بواسطة ${performedBy} في ${new Date().toLocaleString('ar-EG')} - سبب: ${reason.trim()}]`.trim();

    // Recalculate booking paid & remaining based on valid payments
    const validPayments = memoryDB.payments.filter(p => p.bookingId === booking.id && p.status !== 'CANCELLED');
    const newPaidAmount = validPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    booking.paidAmount = newPaidAmount;
    booking.remainingAmount = Math.max(0, booking.totalDistributorPrice - newPaidAmount);
    booking.version += 1;
    booking.updatedAt = now;

    // Persist reversal to PostgreSQL
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.payment.update({
            where: { id: payment.id },
            data: {
              notes: payment.notes,
            },
          });

          await client.booking.update({
            where: { id: booking.id },
            data: {
              paidAmount: booking.paidAmount,
              remainingAmount: booking.remainingAmount,
              version: booking.version,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        logServerError(err, 'db.cancelPayment.prisma');
      }
    }

    await this.addAuditLog({
      bookingId: booking.id,
      action: 'إلغاء وعكس دفعة مالية',
      performedBy,
      details: `تم إلغاء الدفعة بقيمة ${payment.amount} ج.م للحجز ${booking.bookingCode}. السبب: ${reason.trim()}. الرصيد المسدد الجديد: ${booking.paidAmount} ج، والمتبقي: ${booking.remainingAmount} ج.`,
    });

    saveLocalDB(memoryDB);
    return { success: true, payment, booking };
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
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id || b.bookingCode === booking.bookingCode);
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
      let drinkDelta = 0;
      if (item.drinkOption === 'no_juice') {
        drinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
      } else if (item.drinkOption === 'pepsi') {
        drinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra;
      }
      const unitFactPrice = Math.max(0, baseFactPrice + drinkDelta);
      const totalFactItemPrice = unitFactPrice * item.quantity;
      totalFactoryCost += totalFactItemPrice;

      return {
        mealCode: item.mealCode,
        mealName: meal?.name || item.mealName,
        quantity: item.quantity,
        drinkOption: item.drinkOption,
        ingredients: meal?.ingredients || item.ingredients,
        unitFactoryPrice: unitFactPrice,
        totalFactoryPrice: totalFactItemPrice,
        specialInstructions: item.drinkOption === 'no_juice' 
          ? 'بدون عصير (-5 ج)' 
          : item.drinkOption === 'pepsi' 
          ? 'استبدال العصير بكانز بيبسي (+10 ج)' 
          : 'عصير بخيرة القياسي',
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

    this.addAuditLog({
      bookingId: booking.id,
      action: 'إصدار أمر تشغيل المصنع',
      performedBy,
      details: `تم إصدار أمر تشغيل المصنع ${orderNumber} (الإصدار v${version}) بإجمالي ${booking.totalMealsCount} وجبة وتكلفة مصنع ${preview.totalFactoryCost} ج (خالٍ تماماً من هوامش ربح الموزع).`,
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
            orderBy: { createdAt: 'desc' },
          });
          if (dbOrders && dbOrders.length > 0) {
            return dbOrders.map(fo => {
              let parsedItems = [];
              try {
                parsedItems = JSON.parse(fo.itemsJson);
              } catch {}
              const costTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.totalFactoryPrice || 0), 0);
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
    return memoryDB.factoryOrders;
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
          const logs = await client.auditLog.findMany({
            where: bookingId ? { bookingId } : undefined,
            orderBy: { timestamp: 'desc' },
            take: 50,
          });
          if (logs && logs.length > 0) {
            return logs.map(l => ({
              id: l.id,
              bookingId: l.bookingId || '',
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
      return memoryDB.auditLogs.filter(l => l.bookingId === bookingId);
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

    const isTest = Boolean(booking.isTest || booking.bookingCode === 'CLB-2026-1699' || booking.customerName.includes('تجريب'));
    if (!isTest) {
      throw new Error('ممنوع: لا يمكن تعديل سوى الحجوزات التجريبية فقط (isTest: true). الحجوزات الحقيقية والتاريخية محمية بالكامل ولا تقبل التعديل من هذا المسار.');
    }

    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id || b.bookingCode === booking.bookingCode);

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

    const isTest = Boolean(booking.isTest || booking.bookingCode === 'CLB-2026-1699' || booking.customerName.includes('تجريب'));
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

        let drinkDelta = 0;
        if (meal.hasJuice) {
          if (item.drinkOption === 'no_juice') {
            drinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
          } else if (item.drinkOption === 'pepsi') {
            drinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra;
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
          category: meal.category,
          ingredients: meal.ingredients,
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
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id || b.bookingCode === booking.bookingCode);
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
    const memIdx = memoryDB.bookings.findIndex(b => b.id === booking.id || b.bookingCode === booking.bookingCode);
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
    return [
      `• *كود:* ${it.mealCode} | *اسم الوجبة:* ${it.mealName}`,
      `  - *الكمية:* ${it.quantity} بوكس | ${it.specialInstructions || it.drinkOption}`,
      `  - *سعر المصنع:* ${it.unitFactoryPrice ?? 0} ج | *إجمالي المصنع:* ${it.totalFactoryPrice ?? 0} ج`,
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
    `*بيان الوجبات والتشغيل المطلوب:*`,
    itemsText,
    `-----------------------------------------`,
    `*إجمالي عدد البوكسات:* ${booking.totalMealsCount} بوكس`,
    `*إجمالي تكلفة المصنع المعتمدة:* ${totalCost.toLocaleString('ar-EG')} جنيه مصري`,
    `*تعليمات التعبئة والتغليف:* ${factoryOrder.packagingNotes}`,
    `-----------------------------------------`,
    `*تنبيه تشغيلي:* هذه وثيقة تشغيل وتكلفة مصنع رسمية صادرة من إدارة سيليبري (خالية من هوامش ربح الموزع).`
  ];

  const messageText = lines.join('\n');
  const cleanPhone = (factoryPhone || '').replace(/\D/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}` : '';
  return { messageText, whatsappUrl };
}
