import React, { useState } from 'react';
import { Phone, Menu, X, ShoppingBag, Search, FileText, ShieldCheck } from 'lucide-react';
import { CELEBRE_CONFIG } from '../data/defaultMeals';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenTracking: () => void;
  onOpenPdfMenu: () => void;
  onOpenAdmin: () => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenTracking,
  onOpenPdfMenu,
  onOpenAdmin,
  cartCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADFC7] shadow-xs">
      {/* Top golden announcement bar */}
      <div className="bg-[#7A0C2E] text-[#F3E5AB] text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="hidden sm:inline">✨</span>
        <span>«كل مناسبة.. أحلى مع سيليبري»</span>
        <span className="text-white/60 mx-1">|</span>
        <span>الخط الساخن والحجوزات: <a href={`tel:${CELEBRE_CONFIG.hotline}`} className="font-bold underline text-[#DFC066] hover:text-white" dir="ltr">{CELEBRE_CONFIG.phoneFormatted}</a></span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
              <img
                src={CELEBRE_CONFIG.logoUrl}
                alt="Celebre Catering Logo"
                className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#7A0C2E] font-serif">
                CÉLÈBRE
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#C59B27] -mt-1 tracking-wider">
                CATERING PACKAGES
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <a href="#hero" className="hover:text-[#7A0C2E] transition-colors py-1">
              الرئيسية
            </a>
            <a href="#menu" className="hover:text-[#7A0C2E] transition-colors py-1">
              قائمة الوجبات (18 وجبة)
            </a>
            <a href="#packaging" className="hover:text-[#7A0C2E] transition-colors py-1">
              العلبة الرسمية
            </a>
            <a href="#about" className="hover:text-[#7A0C2E] transition-colors py-1">
              من نحن
            </a>
            <button
              onClick={onOpenPdfMenu}
              className="flex items-center gap-1.5 text-[#7A0C2E] hover:text-[#560820] font-bold transition-colors py-1"
            >
              <FileText className="w-4 h-4 text-[#C59B27]" />
              تحميل المنيو PDF
            </button>
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 hover:text-[#7A0C2E] transition-colors py-1"
            >
              <Search className="w-4 h-4 text-slate-500" />
              متابعة حالة الحجز
            </button>
          </nav>

          {/* Actions: Hotline & Book Now Button */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={`tel:${CELEBRE_CONFIG.hotline}`}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-[#7A0C2E] bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E8DCC0] rounded-xl transition-all"
              title="اتصل بإدارة سيليبري"
            >
              <Phone className="w-4 h-4 text-[#C59B27]" />
              <span dir="ltr">{CELEBRE_CONFIG.hotline}</span>
            </a>

            <button
              onClick={onOpenBooking}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7A0C2E] to-[#94133A] hover:from-[#560820] hover:to-[#7A0C2E] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-[#DFC066]" />
              <span>احجز وجبتك</span>
              {cartCount > 0 && (
                <span className="bg-[#C59B27] text-white text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onOpenBooking}
              className="relative p-2 text-white bg-[#7A0C2E] rounded-lg"
              title="حجز الوجبات"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C59B27] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-[#7A0C2E] rounded-lg"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <a
            href="#hero"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800 hover:text-[#7A0C2E]"
          >
            الرئيسية
          </a>
          <a
            href="#menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800 hover:text-[#7A0C2E]"
          >
            قائمة الوجبات والأسعار (18 وجبة)
          </a>
          <a
            href="#packaging"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800 hover:text-[#7A0C2E]"
          >
            العلبة الرسمية والتعبئة
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800 hover:text-[#7A0C2E]"
          >
            من نحن وتواصل معنا
          </a>
          
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPdfMenu();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FAF8F5] text-[#7A0C2E] font-bold rounded-xl border border-[#EADFC7]"
            >
              <FileText className="w-4 h-4 text-[#C59B27]" />
              تحميل منيو الوجبات PDF
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracking();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-800 font-semibold rounded-xl"
            >
              <Search className="w-4 h-4 text-slate-600" />
              متابعة حالة حجز سابق
            </button>

            <a
              href={`tel:${CELEBRE_CONFIG.hotline}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-[#7A0C2E] font-bold rounded-xl border border-slate-200"
            >
              <Phone className="w-4 h-4 text-[#C59B27]" />
              <span>اتصل بالإدارة: {CELEBRE_CONFIG.phoneFormatted}</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#7A0C2E] text-white font-bold rounded-xl shadow-md"
            >
              <ShoppingBag className="w-5 h-5 text-[#DFC066]" />
              <span>احجز وجبتك الآن</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
