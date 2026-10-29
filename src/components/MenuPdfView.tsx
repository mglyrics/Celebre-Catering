import React, { useRef } from 'react';
import { Meal } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import {
  Printer,
  Download,
  X,
  Phone,
  Globe,
  CheckCircle2,
  Share2,
  ExternalLink,
  MessageCircle,
  Send,
} from 'lucide-react';

interface MenuPdfViewProps {
  isOpen: boolean;
  onClose: () => void;
  meals: Meal[];
}

export const MenuPdfView: React.FC<MenuPdfViewProps> = ({ isOpen, onClose, meals }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const mixBoxMeals = meals
    .filter((m) => m.category === 'mix_box' && m.isActive)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const sandwichBoxMeals = meals
    .filter((m) => m.category === 'sandwich_box' && m.isActive)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const handlePrint = () => {
    // Open printable endpoint directly in new window or use current window print
    window.open('/api/menu/pdf?print=true', '_blank');
  };

  const handleDownload = () => {
    window.location.href = '/api/menu/pdf?download=true';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-[#C59B27]/40 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Floating Top Controls (No-Print) */}
        <div className="no-print bg-gradient-to-r from-[#7A0C2E] to-[#94133A] text-white px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#C59B27]/30">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base">
              المنيو الرسمي المعتمد لـ Celebre Catering (PDF)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20"
              title="تحميل نسخة قابلة للفتح دون إنترنت"
            >
              <Download className="w-3.5 h-3.5 text-[#DFC066]" />
              <span>تحميل المنيو</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#C59B27] hover:bg-[#AA820A] text-slate-900 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Menu Body */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-2">
          
          {/* Header with Official Logo & Contact */}
          <div className="border-b-2 border-[#C59B27] pb-6 mb-8 text-center relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3">
              <img
                src={CELEBRE_CONFIG.logoUrl}
                alt="Celebre Official Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#7A0C2E] font-serif tracking-tight">
              CÉLÈBRE CATERING
            </h1>
            <p className="text-lg font-bold text-[#C59B27] mt-1">
              «كل مناسبة.. أحلى مع سيليبري»
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-2">
              القائمة الرسمية لخدمات الكاترينج وتجهيز وجبات الأفراح والمؤتمرات والمناسبات الخاصة بجمهورية مصر العربية.
            </p>

            {/* Quick Contact Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-700 bg-[#FAF8F5] py-2.5 px-4 rounded-xl border border-[#E8DCC0]">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C59B27]" />
                الخط الساخن: <strong className="font-mono text-[#7A0C2E]" dir="ltr">01284484868</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
                الموقع الإلكتروني: <strong className="font-mono text-[#7A0C2E]" dir="ltr">https://celebre-eg.com</strong>
              </span>
            </div>
          </div>

          {/* Section 1: Mix Box (Sale-01 to Sale-12) */}
          <div className="mb-10">
            <div className="bg-[#7A0C2E] text-white px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between">
              <h2 className="font-extrabold text-lg sm:text-xl">
                أولاً: ميكس بوكس (Mix Box)
              </h2>
              <span className="text-xs bg-[#C59B27] text-slate-900 px-2.5 py-0.5 rounded-md font-black">
                12 وجبة معتمدة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mixBoxMeals.map((meal) => (
                <div
                  key={meal.code}
                  className="p-3.5 rounded-xl border border-[#E2D5BA] bg-[#FAF8F5] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E8DCC0] pb-1.5 mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#7A0C2E] bg-white px-2 py-0.5 rounded border border-[#EBDDC3]">
                          {meal.code}
                        </span>
                        <span className="font-bold text-xs text-[#7A0C2E]">
                          {meal.name}
                        </span>
                      </div>
                      <span className="font-black text-sm text-[#7A0C2E] whitespace-nowrap">
                        {meal.distributorPrice} جنيه
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                      {meal.ingredients}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-200/60">
                    العلبة البيضاء الرسمية + شوكة ومنديل معطر
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Sandwich Box (Sale-13 to Sale-18) */}
          <div className="mb-8">
            <div className="bg-[#7A0C2E] text-white px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between">
              <h2 className="font-extrabold text-lg sm:text-xl">
                ثانياً: سندوتش بوكس (Sandwich Box)
              </h2>
              <span className="text-xs bg-[#C59B27] text-slate-900 px-2.5 py-0.5 rounded-md font-black">
                6 وجبات معتمدة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sandwichBoxMeals.map((meal) => (
                <div
                  key={meal.code}
                  className="p-3.5 rounded-xl border border-[#E2D5BA] bg-[#FAF8F5] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E8DCC0] pb-1.5 mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#7A0C2E] bg-white px-2 py-0.5 rounded border border-[#EBDDC3]">
                          {meal.code}
                        </span>
                        <span className="font-bold text-xs text-[#7A0C2E]">
                          {meal.name}
                        </span>
                      </div>
                      <span className="font-black text-sm text-[#7A0C2E] whitespace-nowrap">
                        {meal.distributorPrice} جنيه
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                      {meal.ingredients}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-200/60">
                    العلبة البيضاء الرسمية + شوكة ومنديل معطر
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drink Adjustment Terms & Packaging Policy */}
          <div className="p-4 bg-white rounded-2xl border-2 border-[#C59B27] space-y-2 text-xs">
            <h4 className="font-extrabold text-sm text-[#7A0C2E]">
              شروط المنيو وتعديل المشروبات والتعبئة الرسمية:
            </h4>
            <ul className="space-y-1 text-slate-700 leading-relaxed list-disc list-inside">
              <li>
                <strong>تعديل المشروبات:</strong> استبعاد العصير يخصم <strong>5 جنيه</strong> من سعر الموزع لكل وجبة، واستبدال العصير ببيبسي يضيف <strong>10 جنيه</strong> لكل وجبة.
              </li>
              <li>
                <strong>العلبة الرسمية المعتمدة:</strong> تُعبأ جميع الوجبات بالكامل في العلبة البيضاء الرسمية المرفقة بشوكة ومنديل معطر وفحص الجودة.
              </li>
              <li>
                <strong>المكونات المعتمدة:</strong> تجهيز محتويات كل وجبة طبقاً لوصف كود الوجبة حرفياً دون أي تغيير.
              </li>
              <li>
                <strong>الأسعار:</strong> الأسعار المذكورة هي أسعار الموزع الرسمية المعتمدة في جمهورية مصر العربية.
              </li>
            </ul>
          </div>

          {/* Footer with Socials & Hotline */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">
              تابعونا على منصات التواصل الاجتماعي:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 py-1 text-xs font-mono font-bold text-[#7A0C2E]" dir="ltr">
              <a href={CELEBRE_CONFIG.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Facebook
              </a>
              <span>•</span>
              <a href={CELEBRE_CONFIG.socials.tiktok} target="_blank" rel="noopener noreferrer" className="hover:underline">
                TikTok
              </a>
              <span>•</span>
              <a href={CELEBRE_CONFIG.socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Instagram
              </a>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Celebre Catering Packages © 2026 - جميع الحقوق محفوظة
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
