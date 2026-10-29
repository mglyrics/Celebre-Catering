export interface Meal {
  id: string;
  code: string; // e.g. "Sale-01"
  name: string;
  category: 'mix_box' | 'sandwich_box';
  ingredients: string; // Exact Arabic text
  distributorPrice: number; // Public price
  factoryPrice?: number; // Secret factory cost (only sent to admin)
  hasJuice: boolean; // whether drink modifications apply
  isActive: boolean;
  version: number;
  image?: string;
  updatedAt: string;
}

export type DrinkModification = 'standard' | 'no_juice' | 'pepsi';

export interface BookingMealItem {
  mealId: string;
  mealCode: string;
  mealName: string;
  ingredients: string;
  category: 'mix_box' | 'sandwich_box';
  quantity: number;
  drinkOption: DrinkModification;
  baseDistributorPrice: number;
  unitDistributorPrice: number; // final price after drink modification
  totalDistributorPrice: number;
  baseFactoryPrice?: number;
  unitFactoryPrice?: number;
  totalFactoryPrice?: number;
}

export type BookingStatus = 
  | 'INITIAL' // حجز مبدئي
  | 'PENDING_CONFIRMATION' // قيد المراجعة والتأكيد
  | 'CONFIRMED' // مؤكد
  | 'IN_PRODUCTION' // جاري التجهيز بالمصنع
  | 'READY_FOR_DELIVERY' // جاهز للتسليم
  | 'DELIVERED' // تم التسليم
  | 'CANCELLED'; // ملغي

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  method: 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer' | 'other';
  date: string;
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
}

export type FactoryOrderStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'PREPARING' 
  | 'COMPLETED' 
  | 'READY_TO_SEND' 
  | 'MANUALLY_CONFIRMED';

export interface FactoryOrder {
  id: string;
  orderNumber: string; // e.g. "FO-2026-001"
  bookingId: string;
  bookingCode: string;
  version: number; // revisions support
  status: FactoryOrderStatus | string;
  eventDate: string;
  deliveryTime: string;
  deliveryLocation: string;
  factoryCostTotal?: number; // total at factory prices
  items: {
    mealCode: string;
    mealName: string;
    quantity: number;
    drinkOption: DrinkModification;
    ingredients: string;
    unitFactoryPrice?: number;
    totalFactoryPrice?: number;
    specialInstructions?: string;
  }[];
  packagingNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  bookingId: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "CLB-2026-8492"
  securityCode: string; // 4-digit pin or last 4 digits of phone for safe verification
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  preferredContact: 'whatsapp' | 'phone';
  eventName: string; // e.g. "حفل زفاف", "مؤتمر سنوي", "عيد ميلاد"
  eventDate: string; // YYYY-MM-DD
  deliveryTime: string; // HH:MM
  deliveryGovernorate: string; // e.g. "القاهرة", "الجيزة", "الإسكندرية"
  deliveryAddress: string;
  notes?: string;
  
  items: BookingMealItem[];
  totalMealsCount: number;
  
  // Financials
  totalDistributorPrice: number;
  totalFactoryPrice?: number;
  profitMargin?: number;
  paidAmount: number;
  remainingAmount: number;
  
  status: BookingStatus;
  statusNotes?: string;
  isTest?: boolean; // علامة تمييز الحجز التجريبي
  
  // Versioning
  version: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations
  payments?: PaymentRecord[];
  factoryOrders?: FactoryOrder[];
  auditLogs?: AuditLog[];
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'factory';
  name: string;
}
