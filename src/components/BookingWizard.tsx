import React, { useState, useMemo } from 'react';
import { Meal, DrinkModification, BookingMealItem, Booking } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  MessageCircle,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  meals: Meal[];
  initialItems: { meal: Meal; quantity: number; drinkOption: DrinkModification }[];
  onOrderSuccess: (booking: Booking, whatsappUrl: string) => void;
}

const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'القليوبية',
  'الإسكندرية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'دمياط',
  'كفر الشيخ',
  'السويس',
  'الإسماعيلية',
  'بورسعيد',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'أخرى'
];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  isOpen,
  onClose,
  meals,
  initialItems,
  onOrderSuccess,
}) => {
  // Form state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Cart items
  const [cartItems, setCartItems] = useState<{
    meal: Meal;
    quantity: number;
    drinkOption: DrinkModification;
  }[]>([]);

  // Client and Event info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'phone'>('whatsapp');
  const [eventName, setEventName] = useState('حفل زفاف');
  const [eventDate, setEventDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('18:00');
  const [deliveryGovernorate, setDeliveryGovernorate] = useState('القاهرة');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial items when modal opens
  React.useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setCartItems(initialItems);
    } else if (cartItems.length === 0 && meals.length > 0) {
      // Default with Sale-01 as starter if completely empty
      setCartItems([
        {
          meal: meals[0],
          quantity: 50,
          drinkOption: 'standard',
        }
      ]);
    }
  }, [initialItems, meals]);

  // Calculations
  const calculations = useMemo(() => {
    let totalMeals = 0;
    let totalDistributor = 0;

    const breakdown = cartItems.map(item => {
      const qty = Math.max(1, item.quantity);
      totalMeals += qty;

      let delta = 0;
      if (item.meal.hasJuice) {
        if (item.drinkOption === 'no_juice') {
          delta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
        } else if (item.drinkOption === 'pepsi') {
          delta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra;
        }
      }

      const unitPrice = Math.max(0, item.meal.distributorPrice + delta);
      const itemTotal = unitPrice * qty;
      totalDistributor += itemTotal;

      return {
        ...item,
        unitPrice,
        itemTotal,
      };
    });

    return {
      totalMeals,
      totalDistributor,
      breakdown,
    };
  }, [cartItems]);

  const handleAddMeal = (meal: Meal) => {
    const existingIdx = cartItems.findIndex(i => i.meal.code === meal.code);
    if (existingIdx >= 0) {
      const updated = [...cartItems];
      updated[existingIdx].quantity += 10;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { meal, quantity: 20, drinkOption: 'standard' }]);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    setCartItems(updated);
  };

  const handleUpdateDrink = (index: number, drinkOption: DrinkModification) => {
    const updated = [...cartItems];
    updated[index].drinkOption = drinkOption;
    setCartItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cartItems.filter((_, idx) => idx !== index);
    setCartItems(updated);
  };

  const handleNextToStep2 = () => {
    if (cartItems.length === 0) {
      setErrorMsg('يرجى اختيار وجبة واحدة على الأقل');
      return;
    }
    if (calculations.totalMeals < 50) {
      setErrorMsg(`الحد الأدنى للطلب 50 وجبة. إجمالي عدد الوجبات المحددة حالياً هو ${calculations.totalMeals} وجبة. يرجى إضافة ${50 - calculations.totalMeals} وجبة إضافية لإتمام الطلب.`);
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleNextToStep3 = () => {
    if (!customerName.trim()) {
      setErrorMsg('يرجى إدخال اسم العميل');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح (11 رقم)');
      return;
    }
    if (!eventDate) {
      setErrorMsg('يرجى تحديد تاريخ المناسبة والتسليم');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('يرجى إدخال عنوان التسليم واسم القاعة أو المكان بالتفصيل');
      return;
    }

    setErrorMsg(null);
    setStep(3);
  };

  const handleSubmitOrder = async () => {
    // Prevent duplicate clicks if already processing
    if (isSubmitting) return;

    if (calculations.totalMeals < 50) {
      setErrorMsg(`الحد الأدنى للطلب 50 وجبة. إجمالي عدد الوجبات الحالي (${calculations.totalMeals} وجبة) أقل من الحد الأدنى.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerWhatsapp: customerWhatsapp.trim() || customerPhone.trim(),
        preferredContact,
        eventName: eventName.trim(),
        eventDate,
        deliveryTime,
        deliveryGovernorate,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim(),
        items: cartItems.map(item => ({
          mealCode: item.meal.code,
          quantity: item.quantity,
          drinkOption: item.drinkOption,
        })),
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      // Safe response reading: NEVER call res.json() blindly on non-JSON responses
      let data: any = null;
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error('[Booking Submit] JSON parse error:', jsonErr);
        }
      } else {
        // Read text safely to avoid throwing SyntaxError: Unexpected token
        const rawText = await res.text().catch(() => '');
        console.warn('[Booking Submit] Non-JSON response received:', res.status, rawText.slice(0, 120));
      }

      if (!res.ok) {
        const serverError = data?.error || data?.message;
        if (serverError && typeof serverError === 'string') {
          throw new Error(serverError);
        }
        if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error(`تعذر حفظ الحجز مؤقتاً في خادم المنصة (كود ${res.status}). يرجى المحاولة مجدداً أو التواصل مباشرة عبر واتساب.`);
        }
        throw new Error(`تعذر إتمام الحجز (كود الخطأ: ${res.status}). يرجى مراجعة البيانات والمحاولة مجدداً.`);
      }

      // Strict validation: Verify booking was truly saved with an authoritative booking code
      if (!data || !data.success || !data.booking || !data.booking.bookingCode) {
        throw new Error('لم يتم استلام تأكيد حفظ الحجز بشكل سليم من الخادم. لم يتم إنشاء الحجز بعد.');
      }

      // Persist in client-side storage for instant offline / serverless instance resilience
      try {
        const saved = JSON.parse(localStorage.getItem('celebre_client_bookings') || '[]');
        const updated = [data.booking, ...saved.filter((b: any) => b.bookingCode !== data.booking.bookingCode)];
        localStorage.setItem('celebre_client_bookings', JSON.stringify(updated.slice(0, 30)));
      } catch (storageErr) {
        console.warn('Could not cache booking to localStorage:', storageErr);
      }

      onOrderSuccess(data.booking, data.whatsappUrl);
    } catch (err: any) {
      console.error('[Booking Submit Final Error]:', err);
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء إرسال الحجز');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#EBDDC3] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-[#7A0C2E] to-[#94133A] text-white px-6 py-4 flex items-center justify-between border-b border-[#C59B27]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-[#DFC066]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                نموذج حجز وجبات الكاترينج
              </h3>
              <p className="text-xs text-white/80">
                Celebre Catering - أسعار موزع معتمدة وتعبئة في العلبة الرسمية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-[#FAF8F5] px-6 py-3 border-b border-[#E8DCC0] flex items-center justify-between text-xs sm:text-sm font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#7A0C2E]' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 1 ? 'bg-[#7A0C2E]' : 'bg-slate-300'}`}>
              1
            </span>
            <span>اختيار الوجبات والمشروبات</span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#7A0C2E]' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 2 ? 'bg-[#7A0C2E]' : 'bg-slate-300'}`}>
              2
            </span>
            <span>بيانات المناسبة والتسليم</span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step === 3 ? 'text-[#7A0C2E]' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step === 3 ? 'bg-[#7A0C2E]' : 'bg-slate-300'}`}>
              3
            </span>
            <span>الملخص والتأكيد</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Meals & Quantities */}
          {step === 1 && (
            <div className="space-y-6">

              {/* Minimum Order 50 Meals Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                calculations.totalMeals >= 50
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    calculations.totalMeals >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {calculations.totalMeals >= 50 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm">الحد الأدنى للطلب 50 وجبة</h5>
                    <p className="text-xs mt-0.5 opacity-90">
                      {calculations.totalMeals >= 50
                        ? `طلبك الحالي مستوفٍ للحد الأدنى (إجمالي الوجبات: ${calculations.totalMeals} وجبة). يمكنك توزيع الكمية بحرية بين الأصناف المختلفة.`
                        : `إجمالي الوجبات المحددة حالياً (${calculations.totalMeals} وجبة). متبقي ${50 - calculations.totalMeals} وجبة للوصول للحد الأدنى المطلوب.`}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl font-black text-xs flex-shrink-0 whitespace-nowrap ${
                  calculations.totalMeals >= 50 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {calculations.totalMeals} / 50 وجبة
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">
                    الوجبات المختارة في طلبك ({calculations.totalMeals} وجبة)
                  </h4>
                  <p className="text-xs text-slate-500">
                    يمكنك طلب أكثر من نوع وجبة وتحديد خيار المشروب لكل نوع بشكل مستقل.
                  </p>
                </div>

                {/* Quick Add Meal Dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const meal = meals.find(m => m.code === e.target.value);
                      if (meal) handleAddMeal(meal);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="text-xs font-bold bg-[#FAF8F5] text-[#7A0C2E] border border-[#C59B27] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#7A0C2E] cursor-pointer"
                  >
                    <option value="" disabled>+ إضافة وجبة أخرى للقائمة</option>
                    {meals.map(m => (
                      <option key={m.code} value={m.code}>
                        {m.code} - {m.distributorPrice} ج ({m.category === 'mix_box' ? 'ميكس' : 'سندوتش'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {calculations.breakdown.map((item, idx) => (
                  <div
                    key={`${item.meal.code}-${idx}`}
                    className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8DCC0] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-[#7A0C2E] bg-white px-2 py-0.5 rounded border border-[#EBDDC3]">
                            {item.meal.code}
                          </span>
                          <span className="font-bold text-sm text-slate-800">
                            {item.meal.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {item.meal.ingredients}
                        </p>
                      </div>

                      {cartItems.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                          title="حذف هذه الوجبة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Quantity & Drink Modifier Row */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                        <span className="font-semibold text-slate-600">الكمية:</span>
                        <button
                          onClick={() => handleUpdateQty(idx, item.quantity - 5)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                          className="w-14 text-center font-bold text-slate-800 border-none focus:outline-none"
                        />
                        <button
                          onClick={() => handleUpdateQty(idx, item.quantity + 5)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-slate-400">بوكس</span>
                      </div>

                      {/* Drink Modifier Options */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-600">المشروب:</span>
                        <select
                          value={item.drinkOption}
                          onChange={(e) => handleUpdateDrink(idx, e.target.value as DrinkModification)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:ring-1 focus:ring-[#7A0C2E]"
                        >
                          <option value="standard">عصير بخيرة القياسي (شامل)</option>
                          <option value="no_juice">استبعاد العصير (-5 ج للوجبة)</option>
                          <option value="pepsi">استبدال ببيبسي (+10 ج للوجبة)</option>
                        </select>
                      </div>

                      {/* Item Total */}
                      <div className="font-bold text-slate-800">
                        <span className="text-slate-500 text-[11px]">سعر الوحدة: {item.unitPrice} ج | </span>
                        <span className="text-[#7A0C2E] text-sm">{item.itemTotal} جنيه</span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Running Total Card */}
              <div className="p-4 bg-white rounded-2xl border-2 border-[#C59B27]/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">إجمالي عدد الوجبات</span>
                  <span className="text-xl font-black text-[#560820]">{calculations.totalMeals} وجبة</span>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-500 block">إجمالي سعر الموزع</span>
                  <span className="text-2xl font-black text-[#7A0C2E]">{calculations.totalDistributor} جنيه</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Client & Event Information */}
          {step === 2 && (
            <div className="space-y-4 text-xs sm:text-sm">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>اسم العميل / المسؤول *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمود الشريف"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>رقم الموبايل * (11 رقم)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010XXXXXXXX أو 012XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>اسم / نوع المناسبة *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حفل زفاف بقاعة الماسة"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                  />
                </div>

                {/* Preferred Contact Method */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>طريقة التواصل المفضلة للتأكيد</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredContact('whatsapp')}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        preferredContact === 'whatsapp'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>واتساب (WhatsApp)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredContact('phone')}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        preferredContact === 'phone'
                          ? 'bg-blue-50 text-blue-800 border-blue-400'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>اتصال هاتفي</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>تاريخ التسليم المطلوب *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                  />
                </div>

                {/* Delivery Time */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>وقت التسليم المفضل للقاعة / المكان *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Governorate */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>المحافظة *</span>
                  </label>
                  <select
                    value={deliveryGovernorate}
                    onChange={(e) => setDeliveryGovernorate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                  >
                    {GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>مكان التسليم والعنوان التفصيلي *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اسم القاعة، الفندق، الشارع، علامة مميزة"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Special Packaging Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  ملاحظات خاصة بالتجهيز والتغليف والمناسبة (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="أي تعليمات محددة تخص التوزيع أو توقيت فتح القاعة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E8DCC0] rounded-xl focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                />
              </div>

            </div>
          )}

          {/* STEP 3: Review & Summary */}
          {step === 3 && (
            <div className="space-y-5 text-xs sm:text-sm">
              
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8DCC0] space-y-3">
                <h4 className="font-extrabold text-[#560820] text-sm sm:text-base border-b border-[#E8DCC0] pb-2">
                  ملخص بيانات الحجز النهائي
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">العميل:</span>
                    <strong className="text-slate-900">{customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">الموبايل:</span>
                    <strong className="text-slate-900" dir="ltr">{customerPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">المناسبة:</span>
                    <span className="text-slate-900">{eventName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">موعد التسليم:</span>
                    <span className="text-slate-900 font-bold">{eventDate} (الساعة {deliveryTime})</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">مكان التسليم:</span>
                    <span className="text-slate-900">{deliveryGovernorate} - {deliveryAddress}</span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#7A0C2E] text-white">
                    <tr>
                      <th className="p-2.5">كود الوجبة</th>
                      <th className="p-2.5">الكمية</th>
                      <th className="p-2.5">المشروب</th>
                      <th className="p-2.5">سعر الوحدة</th>
                      <th className="p-2.5">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculations.breakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-[#7A0C2E]">
                          {item.meal.code}
                        </td>
                        <td className="p-2.5 font-bold">
                          {item.quantity} بوكس
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {item.drinkOption === 'no_juice' 
                            ? 'بدون عصير (-5ج)' 
                            : item.drinkOption === 'pepsi' 
                            ? 'بيبسي (+10ج)' 
                            : 'عصير بخيرة القياسي'}
                        </td>
                        <td className="p-2.5">
                          {item.unitPrice} ج
                        </td>
                        <td className="p-2.5 font-bold text-[#7A0C2E]">
                          {item.itemTotal} جنيه
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#FAF8F5] font-black border-t-2 border-[#E8DCC0]">
                    <tr>
                      <td colSpan={2} className="p-3 text-slate-800">
                        إجمالي الوجبات: {calculations.totalMeals} وجبة
                      </td>
                      <td colSpan={3} className="p-3 text-left text-base text-[#7A0C2E]">
                        المجموع النهائي: {calculations.totalDistributor} جنيه مصري
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Reassurance Banner */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>تنويه هام:</strong> هذا حجز مبدئي مسجل في قاعدة البيانات. لن يتم خصم أي مبالغ إلكترونياً. سيتم إرسال ملخص الحجز مباشرة إلى إدارة Celebre Catering عبر واتساب لمراجعته والتواصل معكم لتأكيد الحجز النهائي ودفع العربون المتفق عليه.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#E8DCC0] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm bg-white rounded-xl border border-slate-200 shadow-2xs"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
            >
              إلغاء
            </button>
          )}

          {step === 1 && (
            <button
              onClick={handleNextToStep2}
              disabled={calculations.totalMeals < 50}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all ${
                calculations.totalMeals < 50
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-[#7A0C2E] hover:bg-[#560820] text-white'
              }`}
            >
              <span>متابعة بيانات المناسبة ({calculations.totalMeals} / 50 وجبة)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleNextToStep3}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#7A0C2E] hover:bg-[#560820] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
            >
              <span>مراجعة الطلب والملخص</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-sm rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري حفظ الحجز...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#DFC066]" />
                  <span>تأكيد وإرسال الحجز المبدئي</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
