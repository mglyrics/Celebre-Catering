import React, { useState } from 'react';
import { Booking } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import {
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Search,
  Phone,
  ShieldCheck,
  Send,
} from 'lucide-react';

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

  const messengerUrl = 'https://m.me/celebre.catering';

  const handleCopySummary = () => {
    const text =
      `طلب حجز سيليبري كاترينج\n` +
      `رقم الحجز: ${booking.bookingCode}\n` +
      `رمز التحقق السري: ${booking.securityCode}\n` +
      `العميل: ${booking.customerName}\n` +
      `الموبايل: ${booking.customerPhone}\n` +
      `المناسبة: ${booking.eventName}\n` +
      `الموعد: ${booking.eventDate} (${booking.deliveryTime})\n` +
      `العنوان: ${booking.deliveryGovernorate} - ${booking.deliveryAddress}\n` +
      `إجمالي الوجبات: ${booking.totalMealsCount} بوكس\n` +
      `المبلغ التقديري: ${booking.totalDistributorPrice} جنيه مصري\n` +
      `رابط المتابعة: https://celebre-eg.com/track?code=${booking.bookingCode}&verify=${booking.securityCode}\n` +
      `الخط الساخن: 01284484868`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-[#C59B27]/40 overflow-hidden text-center p-6 sm:p-8 space-y-5">
        
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
            تم حفظ الطلب مركزياً في قاعدة بيانات Celebre Catering
          </p>
        </div>

        {/* Booking Credentials Box */}
        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8DCC0] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DCC0] pb-2">
            <span className="text-xs font-bold text-slate-600">رقم الحجز المعتمد:</span>
            <span className="font-mono font-black text-lg text-[#7A0C2E] bg-white px-3 py-1 rounded-lg border border-[#EBDDC3]">
              {booking.bookingCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">رمز التحقق السري للمتابعة:</span>
            <span className="font-mono font-black text-base text-[#C59B27] bg-white px-3 py-0.5 rounded-lg border border-[#EBDDC3]">
              {booking.securityCode}
            </span>
          </div>
        </div>

        {/* Persistence Assurance Banner */}
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-right text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">الحجز مسجل ومحمي 100%:</strong>
            <span>طلبك محفوظ بالكامل في قاعدة البيانات برقم الحجز الموضح أعلاه، ولن يُفقد حتى لو لم تتم المراسلة أو انقطع الاتصال.</span>
          </div>
        </div>

        {/* Order Details Brief */}
        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-right space-y-1.5">
          <div className="flex justify-between">
            <span>عدد الوجبات:</span>
            <strong className="text-slate-800 font-bold">{booking.totalMealsCount} بوكس</strong>
          </div>
          <div className="flex justify-between">
            <span>إجمالي القيمة التقديرية (سعر الموزع):</span>
            <strong className="text-[#7A0C2E] font-black">{booking.totalDistributorPrice} جنيه مصري</strong>
          </div>
          <div className="flex justify-between">
            <span>موعد ومكان التسليم:</span>
            <strong className="text-slate-800">{booking.eventDate} ({booking.deliveryGovernorate})</strong>
          </div>
        </div>

        {/* Primary Messaging Actions */}
        <div className="space-y-2.5 pt-1">
          {/* WhatsApp Direct Link with Pre-filled Message */}
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

          {/* Meta Messenger Direct Link */}
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#0084FF] hover:bg-[#0070D6] text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4 text-blue-100" />
            <span>مراسلة الإدارة عبر Messenger (Facebook)</span>
            <ExternalLink className="w-4 h-4 text-blue-200" />
          </a>

          {/* Secondary Actions: Copy Summary & Order Tracking */}
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
