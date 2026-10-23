import React from 'react';
import { ShoppingBag, FileText, CheckCircle2, ShieldCheck, Sparkles, Clock, Phone } from 'lucide-react';
import { CELEBRE_CONFIG } from '../data/defaultMeals';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenPdfMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenPdfMenu }) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#FFFDFB] to-[#F5EFE6] pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-[#EBDDC3]">
      {/* Subtle decorative ornaments */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-[#7A0C2E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Right column (Text & CTAs in RTL) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7A0C2E]/10 text-[#7A0C2E] text-sm font-bold border border-[#7A0C2E]/20 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
              <span>الريادة في كاترينج الأفراح والمؤتمرات الكبرى بمصر</span>
            </div>

            {/* Tagline & Main heading */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#560820] tracking-tight leading-tight">
                «كل مناسبة.. <span className="text-[#C59B27] inline-block font-serif">أحلى مع سيليبري</span>»
              </h1>
              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-2xl font-normal">
                نقدم لكم قائمة متكاملة تضم <strong className="font-bold text-[#7A0C2E]">18 وجبة معتمدة</strong> (ميكس بوكس وسندوتش بوكس) بأسعار موزع تنافسية، معبأة في <strong className="font-bold text-[#7A0C2E]">العلبة البيضاء الرسمية الفاخرة</strong> المرفقة بشوكة ومنديل معطر لتشريف مناسبتكم.
              </p>
            </div>

            {/* Features check pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-slate-700 text-sm font-semibold">
              <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-[#E8DCC0] shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-[#C59B27] flex-shrink-0" />
                <span>العلبة البيضاء الرسمية المعتمدة لكل وجبة</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-[#E8DCC0] shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-[#C59B27] flex-shrink-0" />
                <span>عصير + شوكة ومنديل مع كل بوكس</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-[#E8DCC0] shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-[#C59B27] flex-shrink-0" />
                <span>إمكانية تعديل المشروب (بدون عصير أو بيبسي)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-[#E8DCC0] shadow-2xs">
                <Clock className="w-5 h-5 text-[#C59B27] flex-shrink-0" />
                <span>التزام صارم بمواعيد التسليم للقاعات والمنازل</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#7A0C2E] to-[#94133A] hover:from-[#560820] hover:to-[#7A0C2E] text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingBag className="w-6 h-6 text-[#DFC066]" />
                <span>احجز وجبتك الآن</span>
              </button>

              <button
                onClick={onOpenPdfMenu}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-[#FAF8F5] text-[#7A0C2E] font-bold text-base rounded-2xl border-2 border-[#C59B27] shadow-sm hover:shadow transition-all"
              >
                <FileText className="w-5 h-5 text-[#C59B27]" />
                <span>تحميل المنيو الرسمي PDF</span>
              </button>

              <a
                href={`tel:${CELEBRE_CONFIG.hotline}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-4 text-slate-700 hover:text-[#7A0C2E] font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
              >
                <Phone className="w-4 h-4 text-[#C59B27]" />
                <span dir="ltr">01284484868</span>
              </a>
            </div>

            {/* Live Trust Indicators */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                حجز مبدئي مباشر بدون دفع إلكتروني
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                تأكيد فوري عبر WhatsApp
              </span>
            </div>
          </div>

          {/* Left column (Visual imagery: official white packaging & logo) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative card */}
              <div className="relative bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-[#E5D7B7] overflow-hidden">
                
                {/* Official stack photo */}
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 mb-4 group">
                  <img
                    src={CELEBRE_CONFIG.boxImage}
                    alt="Celebre Official Packaging Stacks"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="bg-[#C59B27] text-white text-xs font-black px-2.5 py-1 rounded-md w-fit mb-1">
                      العلبة البيضاء الرسمية المعتمدة
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-white/95">
                      تجهيز وتغليف فاخر لجميع المناسبات والأفراح بختم الجودة ورمز SCAN ME
                    </p>
                  </div>
                </div>

                {/* Sub-card with open box details */}
                <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBDDC3] flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-[#DFC066]">
                    <img
                      src="/assets/aistudio/________________7b046020.jpg"
                      alt="Inside Celebre Meal Box"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-[#7A0C2E] block text-sm">
                      محتويات منتقاة طبقاً للوصف حرفياً
                    </span>
                    <span className="text-slate-600 block mt-0.5">
                      جاتوه فاخر مغلف، سندوتشات طازجة، وعصير بخيرة مع كل طلب
                    </span>
                  </div>
                </div>

                {/* Hotline ribbon badge */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-[#7A0C2E]">خدمة العملاء والحجوزات</span>
                  <span className="font-mono font-bold text-slate-800 bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-slate-200" dir="ltr">
                    01284484868
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
