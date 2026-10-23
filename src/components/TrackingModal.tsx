import React, { useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import {
  Search,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  AlertCircle,
  X,
  Printer,
  Calendar,
  MapPin,
  User,
  Phone,
  MessageCircle,
  FileText
} from 'lucide-react';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialVerify?: string;
}

const STATUS_STEPS: { status: BookingStatus; label: string; desc: string }[] = [
  { status: 'INITIAL', label: 'حجز مبدئي', desc: 'تم استلام طلبك ومسجل بالنظام' },
  { status: 'PENDING_CONFIRMATION', label: 'قيد المراجعة', desc: 'مراجعة المواعيد والتفاصيل مع العميل' },
  { status: 'CONFIRMED', label: 'مؤكد', desc: 'تم اعتماد الحجز وتسجيل الدفعة' },
  { status: 'IN_PRODUCTION', label: 'تجهيز بالمصنع', desc: 'الوجبات قيد التجهيز والتعبئة بالعلبة الرسمية' },
  { status: 'READY_FOR_DELIVERY', label: 'جاهز للشحن', desc: 'تم فحص الجودة وبانتظار موعد الشحن' },
  { status: 'DELIVERED', label: 'تم التسليم', desc: 'تم تسليم الوجبات لمقر المناسبة بنجاح' },
];

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  initialVerify = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [verify, setVerify] = useState(initialVerify);
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialCode && initialVerify) {
      setCode(initialCode);
      setVerify(initialVerify);
      handleSearch(initialCode, initialVerify);
    }
  }, [initialCode, initialVerify]);

  const handleSearch = async (c = code, v = verify) => {
    if (!c.trim() || !v.trim()) {
      setErrorMsg('يرجى إدخال رقم الحجز ورمز التحقق أو رقم الموبايل');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setBooking(null);

    try {
      const res = await fetch(`/api/bookings/track?code=${encodeURIComponent(c.trim())}&verify=${encodeURIComponent(v.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'لم يتم العثور على حجز يطابق هذه البيانات');
      }
      setBooking(data.booking);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ أثناء الاستعلام');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const currentStepIdx = booking ? STATUS_STEPS.findIndex(s => s.status === booking.status) : -1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#EBDDC3] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A0C2E] to-[#94133A] text-white px-6 py-4 flex items-center justify-between border-b border-[#C59B27]/30">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-[#DFC066]" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                متابعة حالة الحجز والطلبات
              </h3>
              <p className="text-xs text-white/80">
                استعلم عن حالة تجهيز وجباتك في Celebre Catering
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar Container */}
        <div className="p-6 bg-[#FAF8F5] border-b border-[#E8DCC0]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الحجز (مثال: CLB-2026-8492)
              </label>
              <input
                type="text"
                placeholder="CLB-2026-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E8DCC0] rounded-xl font-mono uppercase focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز التحقق أو رقم الموبايل
              </label>
              <input
                type="text"
                placeholder="رمز الـ PIN أو الموبايل"
                value={verify}
                onChange={(e) => setVerify(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E8DCC0] rounded-xl font-mono focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#7A0C2E] hover:bg-[#560820] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>بحث</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Booking Details & Status Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {booking ? (
            <div className="space-y-6">
              
              {/* Order Status Banner */}
              <div className="bg-white rounded-2xl border-2 border-[#E5D7B7] p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">رقم الحجز:</span>
                    <span className="font-mono font-black text-xl text-[#7A0C2E]">{booking.bookingCode}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-400 font-medium block">الحالة الحالية:</span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-[#C59B27]/15 text-[#7A0C2E] border border-[#C59B27]/30">
                      {STATUS_STEPS.find(s => s.status === booking.status)?.label || booking.status}
                    </span>
                  </div>
                </div>

                {/* Stepper Timeline */}
                <div className="relative pt-2 pb-1">
                  <div className="hidden sm:grid grid-cols-6 gap-2 text-center">
                    {STATUS_STEPS.map((s, idx) => {
                      const isDone = currentStepIdx >= idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div key={s.status} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            } ${isCurrent ? 'ring-4 ring-[#C59B27]/40 scale-110' : ''}`}
                          >
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-[#7A0C2E]' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {booking.statusNotes && (
                    <div className="mt-4 p-3 bg-[#FAF8F5] rounded-xl text-xs text-slate-700 border border-[#EBDDC3]">
                      <span className="font-bold text-[#7A0C2E]">ملاحظة الإدارة: </span>
                      {booking.statusNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Event & Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8DCC0] space-y-2">
                  <div className="font-bold text-slate-800 border-b border-[#E8DCC0] pb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>بيانات العميل والمناسبة</span>
                  </div>
                  <div>العميل: <strong className="text-slate-900">{booking.customerName}</strong></div>
                  <div>المناسبة: <strong className="text-slate-900">{booking.eventName}</strong></div>
                  <div>تاريخ التسليم: <strong className="text-slate-900">{booking.eventDate} ({booking.deliveryTime})</strong></div>
                </div>

                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8DCC0] space-y-2">
                  <div className="font-bold text-slate-800 border-b border-[#E8DCC0] pb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>مكان التسليم والتواصل</span>
                  </div>
                  <div>المحافظة: <strong className="text-slate-900">{booking.deliveryGovernorate}</strong></div>
                  <div>العنوان: <strong className="text-slate-900">{booking.deliveryAddress}</strong></div>
                  <div>الموبايل: <strong className="text-slate-900" dir="ltr">{booking.customerPhone}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-[#FAF8F5] text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">كود الوجبة</th>
                      <th className="p-3">المكونات والتعبئة</th>
                      <th className="p-3">المشروب</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {booking.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#7A0C2E]">
                          {it.mealCode}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs">
                          {it.ingredients}
                        </td>
                        <td className="p-3">
                          {it.drinkOption === 'no_juice' 
                            ? 'بدون عصير (-5ج)' 
                            : it.drinkOption === 'pepsi' 
                            ? 'بيبسي (+10ج)' 
                            : 'عصير بخيرة'}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {it.quantity} بوكس
                        </td>
                        <td className="p-3 font-bold text-[#7A0C2E]">
                          {it.totalDistributorPrice} ج
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#FAF8F5] border-t-2 border-[#E8DCC0] font-bold">
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-800">
                        إجمالي عدد الوجبات: {booking.totalMealsCount} وجبة
                      </td>
                      <td colSpan={2} className="p-3 text-left text-sm text-[#7A0C2E] font-black">
                        المجموع: {booking.totalDistributorPrice} جنيه
                      </td>
                    </tr>
                    {booking.paidAmount > 0 && (
                      <>
                        <tr className="text-emerald-700">
                          <td colSpan={3} className="px-3 py-1">المبلغ المدفوع (عربون):</td>
                          <td colSpan={2} className="px-3 py-1 text-left font-bold">{booking.paidAmount} جنيه</td>
                        </tr>
                        <tr className="text-amber-800">
                          <td colSpan={3} className="px-3 py-1 pb-3">المتبقي للتسليم:</td>
                          <td colSpan={2} className="px-3 py-1 pb-3 text-left font-bold">{booking.remainingAmount} جنيه</td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Print Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>طباعة بيانات الحجز</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">
                أدخل رقم الحجز الخاص بك لمتابعة حالة التجهيز والشحن
              </p>
              <p className="text-xs text-slate-400">
                مثال: CLB-2026-XXXX ورمز التحقق المسجل على إشعار الحجز
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
