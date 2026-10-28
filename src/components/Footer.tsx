import React from 'react';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import { Phone, Heart, ShieldAlert, FileText, ArrowUp } from 'lucide-react';

interface FooterProps {
  onOpenPdfMenu: () => void;
  onOpenTracking: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPdfMenu,
  onOpenTracking,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1E1E24] text-white pt-14 pb-8 border-t-4 border-[#C59B27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-xs">
                <img
                  src={CELEBRE_CONFIG.logoUrl}
                  alt="Celebre Catering Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-serif tracking-tight">
                  CÉLÈBRE CATERING
                </span>
                <span className="text-xs text-[#C59B27] block font-bold">
                  «كل مناسبة.. أحلى مع سيليبري»
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              منصة إدارة كاترينج المناسبات والأفراح الأولى في مصر. نلتزم بأعلى معايير التعبئة في العلبة البيضاء الرسمية وتوريد وجبات متكاملة تلبي رغبات عملائنا بأفضل أسعار الموزع.
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
              <span>تابعونا:</span>
              <a
                href={CELEBRE_CONFIG.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C59B27] transition-colors"
              >
                Facebook
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={CELEBRE_CONFIG.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C59B27] transition-colors"
              >
                TikTok
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={CELEBRE_CONFIG.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C59B27] transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#C59B27] tracking-wider">
              روابط الموقع
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">الرئيسية</a>
              </li>
              <li>
                <a href="#menu" className="hover:text-white transition-colors">قائمة الوجبات (18 وجبة)</a>
              </li>
              <li>
                <a href="#packaging" className="hover:text-white transition-colors">العلبة الرسمية والتعبئة</a>
              </li>
              <li>
                <button onClick={onOpenPdfMenu} className="hover:text-white transition-colors text-right">
                  تحميل منيو الوجبات PDF
                </button>
              </li>
              <li>
                <button onClick={onOpenTracking} className="hover:text-white transition-colors text-right">
                  متابعة حالة الحجز
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#C59B27] tracking-wider">
              الاتصال والحجوزات
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C59B27]" />
                <span>الخط الساخن المعلن:</span>
              </div>
              <a
                href={`tel:${CELEBRE_CONFIG.hotline}`}
                className="font-mono text-lg font-black text-white block hover:text-[#C59B27] transition-colors"
                dir="ltr"
              >
                {CELEBRE_CONFIG.phoneFormatted}
              </a>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                خدمة الرد والتنسيق متاحة طوال أيام الأسبوع لجميع محافظات جمهورية مصر العربية.
              </p>
              <div className="pt-2 text-slate-400 text-[11px]">
                النطاق الرسمي: <span className="text-[#C59B27] font-mono" dir="ltr">https://celebre-eg.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Discreet Admin Access */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} CÉLÈBRE Catering Management Platform. جميع الحقوق محفوظة.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
            >
              <span>للأعلى</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
