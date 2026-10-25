import React, { useState, useEffect } from 'react';
import { Meal, DrinkModification, Booking } from './types';
import { INITIAL_MEALS, CELEBRE_CONFIG } from './data/defaultMeals';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { BookingWizard } from './components/BookingWizard';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { TrackingModal } from './components/TrackingModal';
import { MenuPdfView } from './components/MenuPdfView';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);

  // Cart & Wizard State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [initialBookingItems, setInitialBookingItems] = useState<{
    meal: Meal;
    quantity: number;
    drinkOption: DrinkModification;
  }[]>([]);

  // Tracking Modal State
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingParams, setTrackingParams] = useState({ code: '', verify: '' });

  // PDF Menu Modal State
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);

  // Admin Portal State
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Order Success State
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Fetch meals on mount
  const fetchMeals = async () => {
    try {
      const res = await fetch('/api/meals');
      if (res.ok) {
        const data = await res.json();
        setMeals(data);
      } else {
        // Fallback to static initial meals if API has transient delay
        setMeals(
          INITIAL_MEALS.map((m, idx) => ({
            ...m,
            id: `meal-${idx + 1}`,
            version: 1,
            updatedAt: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.warn('API fetch meals fallback to initial meals:', err);
      setMeals(
        INITIAL_MEALS.map((m, idx) => ({
          ...m,
          id: `meal-${idx + 1}`,
          version: 1,
          updatedAt: new Date().toISOString(),
        }))
      );
    } finally {
      setIsLoadingMeals(false);
    }
  };

  useEffect(() => {
    fetchMeals();

    // Check URL parameters for tracking or direct actions
    const searchParams = new URLSearchParams(window.location.search);
    const trackCode = searchParams.get('track') || searchParams.get('code');
    const verifyCode = searchParams.get('verify') || searchParams.get('pin');
    const adminParam = searchParams.get('admin');

    if (trackCode) {
      setTrackingParams({ code: trackCode, verify: verifyCode || '' });
      setIsTrackingOpen(true);
    }

    if (adminParam === 'true' || window.location.pathname === '/admin') {
      setIsAdminOpen(true);
    }
  }, []);

  const handleAddMealToOrder = (meal: Meal, quantity = 1, drinkOption: DrinkModification = 'standard') => {
    setInitialBookingItems(prev => {
      const existing = prev.find(i => i.meal.code === meal.code);
      if (existing) {
        return prev.map(i => i.meal.code === meal.code ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { meal, quantity: Math.max(10, quantity), drinkOption }];
    });
    setIsBookingOpen(true);
  };

  const handleOrderSuccess = (booking: Booking, waUrl: string) => {
    setIsBookingOpen(false);
    setSuccessBooking(booking);
    setWhatsappUrl(waUrl);
    setInitialBookingItems([]);
  };

  const handleTrackFromSuccess = (code: string, verify: string) => {
    setSuccessBooking(null);
    setTrackingParams({ code, verify });
    setIsTrackingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-800 antialiased selection:bg-[#7A0C2E] selection:text-white">
      
      {/* Navigation, Main Sections, & Footer - Hidden completely during modal printing */}
      <div className="no-print flex-1 flex flex-col">
        <Navbar
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenTracking={() => {
            setTrackingParams({ code: '', verify: '' });
            setIsTrackingOpen(true);
          }}
          onOpenPdfMenu={() => setIsPdfMenuOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          cartCount={initialBookingItems.reduce((acc, curr) => acc + curr.quantity, 0)}
        />

        <main className="flex-1">
          <Hero
            onOpenBooking={() => setIsBookingOpen(true)}
            onOpenPdfMenu={() => setIsPdfMenuOpen(true)}
          />

          <MenuSection
            meals={meals}
            onAddMealToOrder={handleAddMealToOrder}
            onOpenBooking={() => setIsBookingOpen(true)}
          />

          <AboutSection />
        </main>

        <Footer
          onOpenPdfMenu={() => setIsPdfMenuOpen(true)}
          onOpenTracking={() => {
            setTrackingParams({ code: '', verify: '' });
            setIsTrackingOpen(true);
          }}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      </div>

      {/* Modals */}
      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        meals={meals}
        initialItems={initialBookingItems}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderSuccessModal
        booking={successBooking}
        whatsappUrl={whatsappUrl}
        onClose={() => setSuccessBooking(null)}
        onTrackOrder={handleTrackFromSuccess}
      />

      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialCode={trackingParams.code}
        initialVerify={trackingParams.verify}
      />

      <MenuPdfView
        isOpen={isPdfMenuOpen}
        onClose={() => setIsPdfMenuOpen(false)}
        meals={meals}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onMenuUpdated={fetchMeals}
      />

    </div>
  );
}
