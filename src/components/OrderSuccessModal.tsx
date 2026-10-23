import React, { useState } from 'react';
import { Booking } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, Search, Phone, X } from 'lucide-react';

interface OrderSuccessModalProps {
  booking: Booking | null;
  whatsappUrl: string;
  onClose: () => void;
  onTrackOrder: (code: string, verify: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  booking,
  whatsappUrl,
  onClose,
  onTrackOrder,
}) => {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const handleCopySummary = () => {
    const text = `طلب حجز سيليبري كاترينج\nرقم الحجز: ${booking.bookingCode}\nرمز التحقق: ${booking.securityCode}\nالعميل: ${booking.customerName}\nالموبايل: ${booking.customerPhone}\nالمناسبة: ${booking.eventName}\nالموعد: ${booking.eventDate} (${booking.deliveryTime})\nالعنوان: ${booking.deliveryGovernorate} - ${booking.deliveryAddress}\nإجمالي الوجبات: ${booking.totalMealsCount}\nالمبلغ: ${booking.totalDistributorPrice} جنيه\nرابط المتابعة: https://celebre-eg.com/track?code=${booking.bookingCode}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-[#C59B27]/40 overflow-hidden text-center p-6 sm:p-8 space-y-6">
        
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-[#560820]">
            تم تسجيل حجزك المبدئي بنجاح!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            تم حفظ الطلب في قاعدة بيانات Celebre Catering برقم فريد
          </p>
        </div>

        {/* Credentials Box */}
        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8DCC0] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DCC0] pb-2">
            <span className="text-xs font-bold text-slate-500">رقم الحجز المعتمد:</span>
            <span className="font-mono font-black text-lg text-[#7A0C2E] bg-white px-3 py-1 rounded-lg border border-[#EBDDC3]">
              {booking.bookingCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">رمز التحقق السري للمتابعة:</span>
            <span className="font-mono font-black text-base text-[#C59B27] bg-white px-3 py-0.5 rounded-lg border border-[#EBDDC3]">
              {booking.securityCode}
            </span>
          </div>
        </div>

        {/* Order Details Brief */}
        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-right space-y-1">
          <div className="flex justify-between">
            <span>عدد الوجبات:</span>
            <strong className="text-slate-800">{booking.totalMealsCount} بوكس</strong>
          </div>
          <div className="flex justify-between">
            <span>إجمالي القيمة التقديرية:</span>
            <strong className="text-[#7A0C2E] font-bold">{booking.totalDistributorPrice} جنيه مصري</strong>
          </div>
          <div className="flex justify-between">
            <span>موعد ومكان التسليم:</span>
            <strong className="text-slate-800">{booking.eventDate} ({booking.deliveryGovernorate})</strong>
          </div>
        </div>

        {/* Primary Action: Send to WhatsApp */}
        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="w-5 h-5 text-emerald-100" />
            <span>إرسال تفاصيل الحجز للإدارة عبر WhatsApp</span>
            <ExternalLink className="w-4 h-4 text-emerald-200" />
          </a>

          <div className="flex gap-2">
            <button
              onClick={handleCopySummary}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم نسخ الملخص!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>نسخ ملخص الحجز</span>
                </>
              )}
            </button>

            <button
              onClick={() => onTrackOrder(booking.bookingCode, booking.securityCode)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#7A0C2E]/10 hover:bg-[#7A0C2E]/20 text-[#7A0C2E] font-bold text-xs rounded-xl border border-[#7A0C2E]/30 transition-colors"
            >
              <Search className="w-4 h-4 text-[#7A0C2E]" />
              <span>متابعة حالة الحجز</span>
            </button>
          </div>
        </div>

        {/* Hotline reassurance */}
        <p className="text-[11px] text-slate-500">
          لأي استفسار فوري أو لتعديل الطلب، يمكنكم الاتصال بالهاتف: <a href={`tel:${CELEBRE_CONFIG.hotline}`} className="font-bold underline text-[#7A0C2E]" dir="ltr">01284484868</a>
        </p>

        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
        >
          إغلاق النافذة
        </button>

      </div>
    </div>
  );
};
