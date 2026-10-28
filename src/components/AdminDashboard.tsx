import React, { useState, useEffect } from 'react';
import { Meal, Booking, FactoryOrder, AdminUser, BookingStatus, PaymentRecord, AuditLog } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import {
  Lock,
  LogOut,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Printer,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Shield,
  Send,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  Key,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuUpdated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onMenuUpdated,
}) => {
  // Authentication State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('celebre_admin_token'));
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('celebre_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'factory_orders' | 'menu' | 'audit' | 'system' | 'password'>('overview');

  // Session & notice state
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [factoryOrders, setFactoryOrders] = useState<FactoryOrder[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Booking for Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('vodafone_cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Factory Order Review Modal State (strictly server authoritative factory prices & duplicate prevention)
  const [isFactoryReviewOpen, setIsFactoryReviewOpen] = useState(false);
  const [factoryPreviewData, setFactoryPreviewData] = useState<any | null>(null);
  const [isLoadingFactoryPreview, setIsLoadingFactoryPreview] = useState(false);
  const [forceNewVersion, setForceNewVersion] = useState(false);
  const [isSubmittingFactoryOrder, setIsSubmittingFactoryOrder] = useState(false);
  const [factoryOrderError, setFactoryOrderError] = useState<string | null>(null);

  // Test Booking Delete Confirmation Modal State
  const [deletingTestBooking, setDeletingTestBooking] = useState<Booking | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Test Booking Edit Modal State
  const [editingTestBooking, setEditingTestBooking] = useState<Booking | null>(null);
  const [isSavingTestBooking, setIsSavingTestBooking] = useState(false);
  const [testEditError, setTestEditError] = useState<string | null>(null);

  // Edit Meal State
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Edit Booking State (General scheduling updates)
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [editEventDate, setEditEventDate] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editStatus, setEditStatus] = useState<BookingStatus>('INITIAL');
  const [editNotes, setEditNotes] = useState('');

  // Selected Factory Order for printing
  const [printingFactoryOrder, setPrintingFactoryOrder] = useState<FactoryOrder | null>(null);

  // Handle 401 and server-enforced 15-minute inactivity timeout
  const handleAuthError = (status: number, data?: any): boolean => {
    if (status === 401) {
      const isTimeout = data?.code === 'SESSION_INACTIVITY_TIMEOUT';
      const msg = isTimeout 
        ? 'انتهت الجلسة بسبب عدم النشاط (15 دقيقة). يرجى تسجيل الدخول مجدداً.'
        : (data?.error || 'جلسة الدخول منتهية أو غير صالحة، يرجى تسجيل الدخول مجدداً.');
      
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('celebre_admin_token');
      localStorage.removeItem('celebre_admin_user');
      setSessionNotice(msg);
      setLoginError(msg);
      return true;
    }
    return false;
  };

  // Load data when authenticated
  useEffect(() => {
    if (token && isOpen) {
      loadAllData();
    }
  }, [token, isOpen]);

  const loadAllData = async () => {
    if (!token) return;
    setIsLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      if (currentUser?.role !== 'factory') {
        const statsRes = await fetch('/api/admin/stats', { headers });
        if (statsRes.status === 401) {
          handleAuthError(401, await statsRes.json());
          return;
        }
        if (statsRes.ok) setStats(await statsRes.json());
      }

      // Bookings
      const bookingsRes = await fetch('/api/admin/bookings', { headers });
      if (bookingsRes.status === 401) {
        handleAuthError(401, await bookingsRes.json());
        return;
      }
      if (bookingsRes.ok) setBookings(await bookingsRes.json());

      // Factory Orders
      const foRes = await fetch('/api/admin/factory-orders', { headers });
      if (foRes.status === 401) {
        handleAuthError(401, await foRes.json());
        return;
      }
      if (foRes.ok) setFactoryOrders(await foRes.json());

      // Meals
      const mealsRes = await fetch('/api/admin/meals', { headers });
      if (mealsRes.status === 401) {
        handleAuthError(401, await mealsRes.json());
        return;
      }
      if (mealsRes.ok) setMeals(await mealsRes.json());

      // Audit Logs
      if (currentUser?.role !== 'factory') {
        const auditRes = await fetch('/api/admin/audit-logs', { headers });
        if (auditRes.status === 401) {
          handleAuthError(401, await auditRes.json());
          return;
        }
        if (auditRes.ok) setAuditLogs(await auditRes.json());
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    setSessionNotice(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('celebre_admin_token', data.token);
      localStorage.setItem('celebre_admin_user', JSON.stringify(data.user));

      if (data.user.role === 'factory') {
        setActiveTab('factory_orders');
      } else {
        setActiveTab('overview');
      }
    } catch (err: any) {
      setLoginError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Error logging out on server:', err);
    } finally {
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('celebre_admin_token');
      localStorage.removeItem('celebre_admin_user');
      setSelectedBooking(null);
      setIsPaymentModalOpen(false);
      setIsFactoryReviewOpen(false);
      setDeletingTestBooking(null);
      setEditingTestBooking(null);
      setSessionNotice('تم تسجيل الخروج بنجاح وإلغاء الجلسة على الخادم.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (handleAuthError(res.status, data)) return;
        throw new Error(data.error || 'فشل تغيير كلمة المرور');
      }

      setPasswordSuccess(data.message || 'تم تحديث كلمة المرور بنجاح.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto force logout after 2.5 seconds to mandate re-login with new password
      setTimeout(() => {
        handleLogout();
        setLoginError('تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة.');
      }, 2500);
    } catch (err: any) {
      setPasswordError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOpenFactoryReview = async (bookingId: string) => {
    setIsLoadingFactoryPreview(true);
    setFactoryOrderError(null);
    setForceNewVersion(false);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/factory-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleAuthError(res.status, data)) return;
        throw new Error(data.error || 'فشل تحميل معاينة أمر المصنع');
      }
      setFactoryPreviewData(data.preview);
      setIsFactoryReviewOpen(true);
    } catch (err: any) {
      alert(err.message || 'فشل فتح معاينة أمر المصنع');
    } finally {
      setIsLoadingFactoryPreview(false);
    }
  };

  const handleConfirmFactoryOrder = async () => {
    if (!factoryPreviewData) return;
    setIsSubmittingFactoryOrder(true);
    setFactoryOrderError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${factoryPreviewData.bookingId}/factory-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ forceNewVersion }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (handleAuthError(res.status, data)) return;
        throw new Error(data.error || 'فشل إصدار أمر المصنع');
      }

      setIsFactoryReviewOpen(false);
      loadAllData();
      if (selectedBooking && selectedBooking.id === factoryPreviewData.bookingId) {
        const updatedBookingRes = await fetch(`/api/admin/bookings/${factoryPreviewData.bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (updatedBookingRes.ok) {
          setSelectedBooking(await updatedBookingRes.json());
        }
      }
      setPrintingFactoryOrder(data.factoryOrder);
    } catch (err: any) {
      setFactoryOrderError(err.message || 'حدث خطأ أثناء إصدار أمر المصنع');
    } finally {
      setIsSubmittingFactoryOrder(false);
    }
  };

  const handleConfirmDeleteTestBooking = async () => {
    if (!deletingTestBooking) return;
    setIsDeletingBooking(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${deletingTestBooking.id}/test-delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleAuthError(res.status, data)) return;
        throw new Error(data.error || 'فشل حذف الحجز التجريبي');
      }

      setDeletingTestBooking(null);
      if (selectedBooking && selectedBooking.id === deletingTestBooking.id) {
        setSelectedBooking(null);
      }
      loadAllData();
    } catch (err: any) {
      setDeleteError(err.message || 'فشل حذف الحجز');
    } finally {
      setIsDeletingBooking(false);
    }
  };

  const handleSaveTestBookingEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestBooking) return;
    setIsSavingTestBooking(true);
    setTestEditError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${editingTestBooking.id}/test-edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: editingTestBooking.customerName,
          customerPhone: editingTestBooking.customerPhone,
          eventName: editingTestBooking.eventName,
          eventDate: editingTestBooking.eventDate,
          deliveryTime: editingTestBooking.deliveryTime,
          deliveryGovernorate: editingTestBooking.deliveryGovernorate,
          deliveryAddress: editingTestBooking.deliveryAddress,
          notes: editingTestBooking.notes,
          status: editingTestBooking.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (handleAuthError(res.status, data)) return;
        throw new Error(data.error || 'فشل حفظ تعديلات الحجز التجريبي');
      }

      setEditingTestBooking(null);
      if (selectedBooking && selectedBooking.id === editingTestBooking.id) {
        setSelectedBooking(data.booking);
      }
      loadAllData();
    } catch (err: any) {
      setTestEditError(err.message || 'حدث خطأ أثناء تعديل الحجز التجريبي');
    } finally {
      setIsSavingTestBooking(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadAllData();
        if (selectedBooking && selectedBooking.id === bookingId) {
          const updated = await res.json();
          setSelectedBooking(updated.booking);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !paymentAmount) return;

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          notes: paymentNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedBooking(data.booking);
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentNotes('');
        loadAllData();
      }
    } catch (err) {
      console.error('Error adding payment:', err);
    }
  };

  const handleOpenEditBooking = (b: Booking) => {
    setEditEventDate(b.eventDate);
    setEditDeliveryTime(b.deliveryTime);
    setEditDeliveryAddress(b.deliveryAddress);
    setEditStatus(b.status);
    setEditNotes(b.notes || '');
    setIsEditBookingModalOpen(true);
  };

  const handleSaveBookingEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventDate: editEventDate,
          deliveryTime: editDeliveryTime,
          deliveryAddress: editDeliveryAddress,
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedBooking(data.booking);
        setIsEditBookingModalOpen(false);
        loadAllData();
      }
    } catch (err) {
      console.error('Error saving booking edits:', err);
    }
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal) return;

    try {
      const res = await fetch(`/api/admin/meals/${editingMeal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          distributorPrice: editingMeal.distributorPrice,
          factoryPrice: editingMeal.factoryPrice,
          ingredients: editingMeal.ingredients,
          name: editingMeal.name,
          isActive: editingMeal.isActive,
        }),
      });

      if (res.ok) {
        setEditingMeal(null);
        loadAllData();
        onMenuUpdated();
      }
    } catch (err) {
      console.error('Error saving meal:', err);
    }
  };

  const handleUpdateFactoryOrderStatus = async (foId: string, status: FactoryOrder['status']) => {
    try {
      const res = await fetch(`/api/admin/factory-orders/${foId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error('Error updating factory order status:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border-2 border-[#7A0C2E]/30 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Top Navbar */}
        <div className="bg-[#560820] text-white px-6 py-3.5 flex items-center justify-between border-b border-[#C59B27]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-xs">
              <img src={CELEBRE_CONFIG.logoUrl} alt="Celebre" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>لوحة التحكم الإدارية وتشغيل المصنع</span>
                <span className="text-xs bg-[#C59B27] text-slate-900 px-2 py-0.5 rounded-full font-bold">
                  {currentUser ? (currentUser.role === 'factory' ? 'المصنع' : 'الإدارة العامة') : 'محمي'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <span className="text-[#DFC066] font-bold hidden sm:inline">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-rose-300 flex items-center gap-1 sm:border-r border-white/20 sm:pr-2 sm:mr-1 transition-colors font-bold"
                  title="تسجيل الخروج من لوحة الإدارة"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body: Login OR Dashboard */}
        {!token ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto my-auto w-full text-center space-y-6">
            <div className="w-16 h-16 bg-[#7A0C2E]/10 text-[#7A0C2E] rounded-full flex items-center justify-center mx-auto border border-[#7A0C2E]/20">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-2xl font-black text-[#560820]">
                تسجيل الدخول للنظام
              </h4>
              <p className="text-xs text-slate-500">
                أدخل بيانات حساب الإدارة أو مسؤول تشغيل المصنع
              </p>
            </div>

            {sessionNotice && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>{sessionNotice}</span>
              </div>
            )}

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم أو البريد
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم المستخدم..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#7A0C2E] hover:bg-[#560820] text-white font-black text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className="pt-2 text-xs text-slate-400 text-center">
              <span>نظام محمي ومشفر بالكامل لشركة CÉLÈBRE للضيافة والحفلات.</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Dashboard Tabs Header */}
            <div className="bg-[#FAF8F5] px-6 py-2 border-b border-[#E8DCC0] flex items-center gap-2 overflow-x-auto text-xs font-bold">
              {currentUser?.role !== 'factory' && (
                <>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeTab === 'overview'
                        ? 'bg-[#7A0C2E] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#7A0C2E]'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>التقارير والمؤشرات المالية</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeTab === 'bookings'
                        ? 'bg-[#7A0C2E] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#7A0C2E]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>الحجوزات والطلبات ({bookings.length})</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('factory_orders')}
                className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'factory_orders'
                    ? 'bg-[#7A0C2E] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#7A0C2E]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>أوامر تشغيل المصنع ({factoryOrders.length})</span>
              </button>

              {currentUser?.role !== 'factory' && (
                <>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeTab === 'menu'
                        ? 'bg-[#7A0C2E] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#7A0C2E]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>إدارة المنيو وأسعار الوجبات (18)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeTab === 'audit'
                        ? 'bg-[#7A0C2E] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#7A0C2E]'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>سجل التدقيق والعمليات</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('system')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeTab === 'system'
                        ? 'bg-[#7A0C2E] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#7A0C2E]'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>حالة النظام والربط (Supabase / Vercel)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeTab === 'password'
                        ? 'bg-[#7A0C2E] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#7A0C2E]'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>تغيير كلمة المرور</span>
                  </button>
                </>
              )}

              <div className="mr-auto">
                <button
                  onClick={loadAllData}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Tab 1: OVERVIEW & FINANCIAL STATS */}
            {activeTab === 'overview' && stats && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8DCC0] space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">إجمالي مبيعات الموزع</span>
                    <div className="text-2xl font-black text-[#7A0C2E]">
                      {stats.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
                    </div>
                    <span className="text-[11px] text-slate-400">إجمالي الحجوزات النشطة</span>
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8DCC0] space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">تكلفة المصنع الإجمالية</span>
                    <div className="text-2xl font-black text-slate-800">
                      {stats.totalFactoryCost.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
                    </div>
                    <span className="text-[11px] text-slate-400">سري وغير معلن للعميل</span>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-xs font-semibold text-emerald-800 block">صافي الربح المتوقع</span>
                    <div className="text-2xl font-black text-emerald-700">
                      {stats.totalProfit.toLocaleString()} <span className="text-xs font-bold text-emerald-600">ج.م</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      هامش ربح تقديري: {stats.totalRevenue > 0 ? Math.round((stats.totalProfit / stats.totalRevenue) * 100) : 0}%
                    </span>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
                    <span className="text-xs font-semibold text-amber-800 block">المبالغ المحصلة / المتبقية</span>
                    <div className="text-xl font-black text-amber-900">
                      {stats.totalCollected.toLocaleString()} / <span className="text-rose-700">{stats.totalOutstanding.toLocaleString()}</span>
                    </div>
                    <span className="text-[11px] text-amber-700">متبقي قيد التحصيل عند التسليم</span>
                  </div>

                </div>

                {/* Operations Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block">إجمالي عدد الوجبات المطلوبة</span>
                    <span className="text-3xl font-black text-[#560820] mt-1 block">{stats.totalMeals} بوكس</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block">عدد الحجوزات الكلي</span>
                    <span className="text-3xl font-black text-[#560820] mt-1 block">{stats.totalBookings} حجز</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block">أوامر تشغيل المصنع الصادرة</span>
                    <span className="text-3xl font-black text-[#560820] mt-1 block">{stats.factoryOrdersCount} أمر</span>
                  </div>
                </div>

                {/* Recent Bookings Quick View */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm">أحدث الحجوزات الواردة</h4>
                    <button onClick={() => setActiveTab('bookings')} className="text-xs font-bold text-[#7A0C2E] hover:underline">
                      عرض جميع الحجوزات
                    </button>
                  </div>

                  <div className="space-y-2">
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EBDDC3] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#7A0C2E] ml-2">{b.bookingCode}</span>
                          <strong className="text-slate-800">{b.customerName}</strong>
                          <span className="text-slate-500 mr-2">({b.eventName}) - {b.totalMealsCount} وجبة</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#7A0C2E]">{b.totalDistributorPrice} ج</span>
                          <span className="bg-white px-2 py-0.5 rounded-md border text-[11px] font-bold">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: BOOKINGS MANAGEMENT */}
            {activeTab === 'bookings' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Search & Status Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
                    {['ALL', 'INITIAL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          statusFilter === st
                            ? 'bg-[#7A0C2E] text-white shadow-2xs'
                            : 'bg-white border text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {st === 'ALL' ? 'الكل' : st}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="بحث برقم الحجز أو العميل..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-9 pl-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7A0C2E]"
                    />
                  </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#FAF8F5] text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">رقم الحجز</th>
                        <th className="p-3">العميل والموبايل</th>
                        <th className="p-3">المناسبة والموعد</th>
                        <th className="p-3">المكان</th>
                        <th className="p-3">الوجبات</th>
                        <th className="p-3">المبلغ / المدفوع</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings
                        .filter(b => {
                          const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
                          const matchesSearch =
                            b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.customerPhone.includes(searchQuery);
                          return matchesStatus && matchesSearch;
                        })
                        .map(b => (
                          <tr key={b.id} className={`hover:bg-slate-50 ${b.isTest ? 'bg-purple-50/30' : ''}`}>
                            <td className="p-3">
                              <span className="font-mono font-bold text-[#7A0C2E] block">{b.bookingCode}</span>
                              {b.isTest && (
                                <span className="inline-block mt-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                  حجز تجريبي
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <strong className="text-slate-900 block">{b.customerName}</strong>
                              <span className="text-slate-500 font-mono" dir="ltr">{b.customerPhone}</span>
                            </td>
                            <td className="p-3">
                              <span className="block font-medium">{b.eventName}</span>
                              <span className="text-slate-500 text-[11px]">{b.eventDate} ({b.deliveryTime})</span>
                            </td>
                            <td className="p-3 text-slate-600">
                              {b.deliveryGovernorate} - {b.deliveryAddress.substring(0, 25)}...
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {b.totalMealsCount} بوكس
                            </td>
                            <td className="p-3">
                              <strong className="text-[#7A0C2E] block">{b.totalDistributorPrice} ج</strong>
                              <span className="text-[11px] text-emerald-700">مدفوع: {b.paidAmount} ج</span>
                            </td>
                            <td className="p-3">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value as BookingStatus)}
                                className="text-[11px] font-bold bg-[#FAF8F5] border border-slate-300 rounded-md px-1.5 py-1 text-slate-800 focus:ring-1 focus:ring-[#7A0C2E]"
                              >
                                <option value="INITIAL">INITIAL (حجز مبدئي)</option>
                                <option value="PENDING_CONFIRMATION">PENDING_CONFIRMATION (قيد المراجعة)</option>
                                <option value="CONFIRMED">CONFIRMED (مؤكد)</option>
                                <option value="IN_PRODUCTION">IN_PRODUCTION (بالمصنع)</option>
                                <option value="READY_FOR_DELIVERY">READY_FOR_DELIVERY (جاهز)</option>
                                <option value="DELIVERED">DELIVERED (تم التسليم)</option>
                                <option value="CANCELLED">CANCELLED (ملغي)</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedBooking(b)}
                                  className="p-1.5 bg-[#7A0C2E]/10 hover:bg-[#7A0C2E]/20 text-[#7A0C2E] rounded-lg"
                                  title="عرض تفاصيل الحجز وتسجيل المدفوعات"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenFactoryReview(b.id)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg"
                                  title="إنشاء طلب مصنع (مراجعة واعتماد)"
                                >
                                  <Package className="w-4 h-4" />
                                </button>

                                {/* STRICT: Edit and Delete buttons are ONLY shown for test bookings */}
                                {b.isTest && (
                                  <>
                                    <button
                                      onClick={() => setEditingTestBooking(b)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                                      title="تعديل الحجز التجريبي"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingTestBooking(b)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                                      title="حذف الحجز التجريبي"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Tab 3: FACTORY ORDERS */}
            {activeTab === 'factory_orders' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      أوامر تشغيل المصنع والمطبخ المركزي (Kitchen Work Orders)
                    </h4>
                    <p className="text-xs text-slate-500">
                      معلومات التشغيل والتعبئة الصافية (الكميات، المكونات، المواعيد) - خالية تماماً من أسعار وهوامش ربح الموزع.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {factoryOrders.map(fo => (
                    <div key={fo.id} className="p-4 bg-white rounded-2xl border-2 border-[#EBDDC3] shadow-xs space-y-3">
                      
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-mono font-black text-sm text-[#7A0C2E]">{fo.orderNumber}</span>
                          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded mr-2 font-bold text-slate-600">
                            v{fo.version} (حجز: {fo.bookingCode})
                          </span>
                        </div>
                        <select
                          value={fo.status}
                          onChange={(e) => handleUpdateFactoryOrderStatus(fo.id, e.target.value as any)}
                          className="text-xs font-bold bg-[#FAF8F5] border border-slate-300 rounded-lg px-2 py-1"
                        >
                          <option value="PENDING">PENDING (قيد الانتظار)</option>
                          <option value="PREPARING">PREPARING (جاري التجهيز)</option>
                          <option value="COMPLETED">COMPLETED (اكتمل وجاهز)</option>
                        </select>
                      </div>

                      <div className="text-xs space-y-1 text-slate-700">
                        <div>موعد التسليم: <strong className="text-slate-900">{fo.eventDate} ({fo.deliveryTime})</strong></div>
                        <div>المكان: <span>{fo.deliveryLocation}</span></div>
                      </div>

                      {/* Items checklist */}
                      <div className="bg-[#FAF8F5] p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                        <span className="font-bold text-slate-700 block text-[11px]">قائمة الوجبات والمكونات المطلوبة:</span>
                        {fo.items.map((it, idx) => (
                          <div key={idx} className="border-b border-slate-200/60 pb-1.5 last:border-none">
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>• {it.mealCode} - {it.quantity} وجبة</span>
                              <span className="text-[#7A0C2E]">{it.specialInstructions}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{it.ingredients}</p>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                        <strong>تعليمات التعبئة: </strong> {fo.packagingNotes}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setPrintingFactoryOrder(fo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>معاينة وطباعة أمر المصنع</span>
                        </button>
                      </div>

                    </div>
                  ))}

                  {factoryOrders.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                      لا توجد أوامر تشغيل صادرة للمصنع حتى الآن.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 4: MENU MANAGEMENT */}
            {activeTab === 'menu' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      القائمة المركزية للوجبات الـ18 (Central Meals Catalog)
                    </h4>
                    <p className="text-xs text-slate-500">
                      تحديث أسعار الموزع وسعر المصنع السري وحالة التفعيل. لا تتأثر الحجوزات السابقة بالتحديث وتظل محتفظة بالأسعار التاريخية وقت إنشائها.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meals.map(m => (
                    <div key={m.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-mono font-bold text-sm text-[#7A0C2E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EBDDC3]">
                          {m.code}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {m.isActive ? 'مفعلة بالمنيو' : 'معطلة'}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-slate-800">{m.name}</h5>
                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed bg-[#FAF8F5] p-2 rounded-lg">
                        {m.ingredients}
                      </p>

                      <div className="pt-2 border-t flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">سعر الموزع:</span>
                          <strong className="text-[#7A0C2E] text-base">{m.distributorPrice} ج</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">سعر المصنع (سري):</span>
                          <strong className="text-slate-800 text-base">{m.factoryPrice} ج</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">الربح للوجبة:</span>
                          <strong className="text-emerald-700 text-base">
                            {(m.distributorPrice - (m.factoryPrice || 0))} ج
                          </strong>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingMeal(m)}
                        className="w-full py-1.5 bg-[#FAF8F5] hover:bg-[#7A0C2E] text-[#7A0C2E] hover:text-white font-bold text-xs rounded-xl border border-[#C59B27] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل الأسعار والمكونات</span>
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Tab 5: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm mb-2">سجل العمليات والتدقيق (Changelog Audit Trail)</h4>
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[#7A0C2E]">{log.action}</strong>
                          <span className="text-slate-500">• {log.performedBy}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: SYSTEM & SUPABASE / VERCEL SETTINGS */}
            {activeTab === 'system' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
                
                <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-base text-slate-900">حالة قاعدة البيانات (PostgreSQL / Supabase)</h4>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    نظام Celebre Catering مهيأ للربط المباشر مع قاعدة بيانات <strong>Supabase / PostgreSQL</strong> عبر متغير البيئة <code>DATABASE_URL</code>.
                  </p>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8DCC0] space-y-2 font-mono text-xs">
                    <div><strong>الحالة الحالية:</strong> <span className="text-emerald-700 font-bold">نشط ومتصل بقاعدة البيانات</span></div>
                    <div><strong>الدومين المستهدف للإنتاج:</strong> <span className="text-[#7A0C2E]">https://celebre-eg.com</span></div>
                    <div><strong>طريقة النشر:</strong> جاهز للنشر على منصة Vercel كـ Serverless / Edge Function أو Node Full-Stack.</div>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-base text-slate-900">متغيرات البيئة للإنتاج على Vercel:</h4>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-xs font-mono" dir="ltr">
{`# Database (Supabase PostgreSQL Connection Pooler)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Admin initial credentials
ADMIN_PASSWORD="YourSecurePassword2026"
JWT_SECRET="celebre-catering-jwt-super-secret-key-2026"

# Domain
APP_URL="https://celebre-eg.com"`}
                  </pre>
                </div>

              </div>
            )}

            {/* Tab 7: CHANGE ADMIN PASSWORD */}
            {activeTab === 'password' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-xl mx-auto w-full">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#E8DCC0] shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#7A0C2E]/10 text-[#7A0C2E] flex items-center justify-center border border-[#7A0C2E]/20">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-[#560820]">تغيير كلمة مرور الإداري</h4>
                      <p className="text-xs text-slate-500">
                        قم بتعيين كلمة مرور جديدة قوية لحساب المشرف الحالي ({currentUser?.username})
                      </p>
                    </div>
                  </div>

                  {passwordSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 text-right">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        كلمة المرور الحالية
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="أدخل كلمة المرور الحالية..."
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        كلمة المرور الجديدة
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="كلمة مرور جديدة (8 أحرف على الأقل)..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        يجب أن تتكون من 8 خانات على الأقل وتجمع بين الحروف والأرقام.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="أعد إدخال كلمة المرور الجديدة..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#7A0C2E] focus:outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-3 bg-[#7A0C2E] hover:bg-[#560820] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Shield className="w-4 h-4 text-[#DFC066]" />
                        <span>{isChangingPassword ? 'جاري الحفظ والتشفير...' : 'حفظ كلمة المرور الجديدة وإلغاء الجلسات القديمة'}</span>
                      </button>
                    </div>
                  </form>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                    <strong>ملاحظة أمنية:</strong>
                    <p>
                      عند تغيير كلمة المرور، سيتم تشفيرها فوراً بخوارزمية bcrypt، وحفظها في قاعدة بيانات Supabase PostgreSQL، وإلغاء جميع الجلسات النشطة على الخادم، مما يفرض إعادة تسجيل الدخول بكلمة المرور الجديدة.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Selected Booking Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="font-mono font-bold text-[#7A0C2E] text-lg">{selectedBooking.bookingCode}</span>
                  <span className="text-xs text-slate-500 mr-2">(v{selectedBooking.version})</span>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3 rounded-xl border">
                <div>العميل: <strong>{selectedBooking.customerName}</strong></div>
                <div>الموبايل: <strong dir="ltr">{selectedBooking.customerPhone}</strong></div>
                <div>المناسبة: <strong>{selectedBooking.eventName}</strong></div>
                <div>الموعد: <strong>{selectedBooking.eventDate} ({selectedBooking.deliveryTime})</strong></div>
                <div className="col-span-2">العنوان: <span>{selectedBooking.deliveryGovernorate} - {selectedBooking.deliveryAddress}</span></div>
              </div>

              {/* Financial & Payments Box */}
              <div className="p-3 bg-white rounded-xl border space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span>إجمالي سعر الموزع: <span className="text-[#7A0C2E]">{selectedBooking.totalDistributorPrice} ج</span></span>
                  <span>المدفوع: <span className="text-emerald-700">{selectedBooking.paidAmount} ج</span></span>
                  <span>المتبقي: <span className="text-rose-700">{selectedBooking.remainingAmount} ج</span></span>
                </div>

                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                >
                  + تسجيل دفعة مالية جديدة
                </button>

                {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <span className="font-bold text-slate-700 block">سجل المدفوعات:</span>
                    {selectedBooking.payments.map(p => (
                      <div key={p.id} className="flex justify-between text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                        <span>{p.date} - {p.method} {p.notes ? `(${p.notes})` : ''}</span>
                        <strong className="text-emerald-700">{p.amount} ج</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700">الوجبات المطلوبة:</span>
                {selectedBooking.items.map((it, idx) => (
                  <div key={idx} className="p-2 bg-[#FAF8F5] rounded-lg border flex justify-between items-center">
                    <div>
                      <strong className="text-[#7A0C2E]">{it.mealCode}</strong> ({it.quantity} وجبة) - {it.drinkOption}
                      <p className="text-[11px] text-slate-600">{it.ingredients}</p>
                    </div>
                    <div className="text-left font-bold">
                      <div>موزع: {it.totalDistributorPrice} ج</div>
                      <div className="text-slate-400 text-[10px]">مصنع: {it.totalFactoryPrice || 0} ج</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {selectedBooking.isTest && (
                    <>
                      <button
                        onClick={() => {
                          const target = selectedBooking;
                          setSelectedBooking(null);
                          setEditingTestBooking(target);
                        }}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-blue-200"
                        title="تعديل الحجز التجريبي"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل الحجز التجريبي</span>
                      </button>

                      <button
                        onClick={() => {
                          const target = selectedBooking;
                          setSelectedBooking(null);
                          setDeletingTestBooking(target);
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-rose-200"
                        title="حذف الحجز التجريبي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الحجز التجريبي</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditBooking(selectedBooking)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>تعديل الموعد والحالة</span>
                  </button>
                  <button
                    onClick={() => handleOpenFactoryReview(selectedBooking.id)}
                    disabled={isLoadingFactoryPreview}
                    className="px-4 py-2 bg-[#7A0C2E] hover:bg-[#560820] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Package className="w-4 h-4 text-[#DFC066]" />
                    <span>{isLoadingFactoryPreview ? 'جاري التحضير...' : 'إنشاء طلب مصنع'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Modal */}
        {isPaymentModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
              <h4 className="font-bold text-sm text-[#7A0C2E]">تسجيل دفعة للحجز {selectedBooking.bookingCode}</h4>
              <form onSubmit={handleAddPayment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1">المبلغ المحصل (جنيه)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="مثال: 2000"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                    <option value="instapay">إنستاباي (InstaPay)</option>
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">ملاحظات أو رقم الإيصال</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="رقم العملية..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-3 py-1.5 text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                  >
                    حفظ الدفعة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Booking Modal */}
        {isEditBookingModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-[#7A0C2E]">تعديل بيانات الحجز {selectedBooking.bookingCode}</h4>
                <button onClick={() => setIsEditBookingModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveBookingEdits} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تاريخ التسليم</label>
                    <input
                      type="date"
                      required
                      value={editEventDate}
                      onChange={(e) => setEditEventDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">وقت التسليم</label>
                    <input
                      type="time"
                      required
                      value={editDeliveryTime}
                      onChange={(e) => setEditDeliveryTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">حالة الحجز</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 border rounded-lg font-bold bg-[#FAF8F5]"
                  >
                    <option value="INITIAL">INITIAL (حجز مبدئي)</option>
                    <option value="PENDING_CONFIRMATION">PENDING_CONFIRMATION (قيد المراجعة)</option>
                    <option value="CONFIRMED">CONFIRMED (مؤكد)</option>
                    <option value="IN_PRODUCTION">IN_PRODUCTION (جاري التجهيز بالمصنع)</option>
                    <option value="READY_FOR_DELIVERY">READY_FOR_DELIVERY (جاهز للتسليم)</option>
                    <option value="DELIVERED">DELIVERED (تم التسليم)</option>
                    <option value="CANCELLED">CANCELLED (ملغي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">مكان وعنوان التسليم</label>
                  <input
                    type="text"
                    required
                    value={editDeliveryAddress}
                    onChange={(e) => setEditDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ملاحظات التجهيز والتغليف</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditBookingModalOpen(false)}
                    className="px-3 py-1.5 text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#7A0C2E] hover:bg-[#560820] text-white font-bold rounded-lg transition-colors"
                  >
                    حفظ التعديلات والتحديث
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Meal Modal */}
        {editingMeal && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
              <h4 className="font-bold text-sm text-[#7A0C2E]">تعديل الوجبة {editingMeal.code}</h4>
              <form onSubmit={handleSaveMeal} className="space-y-3">
                <div>
                  <label className="block text-slate-700 mb-1">اسم الوجبة</label>
                  <input
                    type="text"
                    value={editingMeal.name}
                    onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1">سعر الموزع (معلن للعميل)</label>
                    <input
                      type="number"
                      value={editingMeal.distributorPrice}
                      onChange={(e) => setEditingMeal({ ...editingMeal, distributorPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">سعر المصنع (سري)</label>
                    <input
                      type="number"
                      value={editingMeal.factoryPrice}
                      onChange={(e) => setEditingMeal({ ...editingMeal, factoryPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">المكونات المعتمدة</label>
                  <textarea
                    rows={3}
                    value={editingMeal.ingredients}
                    onChange={(e) => setEditingMeal({ ...editingMeal, ingredients: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingMeal.isActive}
                    onChange={(e) => setEditingMeal({ ...editingMeal, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="font-bold text-slate-800">تفعيل هذه الوجبة في المنيو العام</label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMeal(null)}
                    className="px-3 py-1.5 text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#7A0C2E] text-white font-bold rounded-lg"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Factory Order Ticket Modal */}
        {printingFactoryOrder && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3 print:static print:p-0 print:bg-white">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900 print:shadow-none print:border-none print:p-0 printable-factory-ticket">
              <div className="text-center border-b pb-3">
                <span className="font-mono font-black text-xl text-[#7A0C2E]">
                  أمر تشغيل مطبخ ومصنع Celebre Catering
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  رقم الأمر: {printingFactoryOrder.orderNumber} (الإصدار {printingFactoryOrder.version})
                </p>
              </div>

              <div className="text-xs space-y-1.5 bg-[#FAF8F5] p-3 rounded-xl border">
                <div>تاريخ التسليم: <strong>{printingFactoryOrder.eventDate} ({printingFactoryOrder.deliveryTime})</strong></div>
                <div>مكان التسليم: <strong>{printingFactoryOrder.deliveryLocation}</strong></div>
                <div>رقم الحجز: <span className="font-mono">{printingFactoryOrder.bookingCode}</span></div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800">بيان الوجبات والمكونات (فحص الجودة):</span>
                {printingFactoryOrder.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border">
                    <div className="flex justify-between font-bold">
                      <span>• {it.mealCode} ({it.quantity} بوكس)</span>
                      <span className="text-[#7A0C2E]">{it.specialInstructions}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1">{it.ingredients}</p>
                  </div>
                ))}
              </div>

              <div className="text-[11px] bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <strong>التعبئة: </strong> {printingFactoryOrder.packagingNotes}
              </div>

              <div className="flex justify-between items-center pt-2 border-t no-print">
                <span className="text-[10px] text-slate-400">Celebre Factory Order • السعر وهامش الربح محجوب تماماً</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrintingFactoryOrder(null)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-[#7A0C2E] text-white font-bold text-xs rounded-lg"
                  >
                    طباعة التذكرة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Factory Order Review Modal (Strictly factory costs, server-calculated, duplicate prevention) */}
        {isFactoryReviewOpen && factoryPreviewData && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4 text-xs">
              
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#7A0C2E]/10 text-[#7A0C2E] rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#560820]">
                      مراجعة واعتماد أمر تشغيل المصنع (CÉLÈBRE Kitchen Order)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      رقم الحجز: <strong className="font-mono text-[#7A0C2E]">{factoryPreviewData.bookingCode}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsFactoryReviewOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {factoryOrderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{factoryOrderError}</span>
                </div>
              )}

              {/* Event & Logistics Details */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8DCC0]">
                <div>المناسبة: <strong className="text-slate-900">{factoryPreviewData.eventName}</strong></div>
                <div>موعد التسليم: <strong className="text-slate-900">{factoryPreviewData.eventDate} ({factoryPreviewData.deliveryTime})</strong></div>
                <div className="col-span-2">مكان التسليم: <span>{factoryPreviewData.deliveryLocation}</span></div>
                <div>إجمالي الوجبات: <strong className="text-[#7A0C2E]">{factoryPreviewData.totalMealsCount} بوكس</strong></div>
                <div>إجمالي تكلفة المصنع: <strong className="text-emerald-700 text-sm">{factoryPreviewData.totalFactoryCost.toLocaleString()} ج.م</strong></div>
              </div>

              {/* Duplicate Prevention Alert & Versioning */}
              {factoryPreviewData.existingOrdersCount > 0 && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">تنبيه أمني لمنع التكرار:</strong>
                      <span>
                        يوجد بالفعل أمر تشغيل مصنع صادر لهذا الحجز ({factoryPreviewData.existingOrders[0]?.orderNumber} - الإصدار v{factoryPreviewData.existingOrders[0]?.version}).
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1 font-bold text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceNewVersion}
                      onChange={(e) => setForceNewVersion(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7A0C2E] focus:ring-[#7A0C2E]"
                    />
                    <span>تأكيد إصدار نسخة تشغيل جديدة محدثة للمصنع (الإصدار v{factoryPreviewData.existingOrdersCount + 1})</span>
                  </label>
                </div>
              )}

              {/* Confidential Factory Items Breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">تفاصيل الوجبات وتكلفة المصنع (مسترجعة من قاعدة البيانات):</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#FAF8F5] text-slate-700 font-bold border-b">
                      <tr>
                        <th className="p-2.5">كود الوجبة</th>
                        <th className="p-2.5">الكمية والمشروب</th>
                        <th className="p-2.5">سعر المصنع للوحدة</th>
                        <th className="p-2.5">إجمالي تكلفة المصنع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {factoryPreviewData.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <span className="font-mono font-bold text-[#7A0C2E]">{it.mealCode}</span>
                            <span className="block text-[11px] text-slate-500">{it.mealName}</span>
                          </td>
                          <td className="p-2.5">
                            <strong className="text-slate-800">{it.quantity} بوكس</strong>
                            <span className="block text-[11px] text-[#7A0C2E]">{it.specialInstructions}</span>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-700">
                            {it.unitFactoryPrice} ج
                          </td>
                          <td className="p-2.5 font-mono font-bold text-emerald-700">
                            {it.totalFactoryPrice} ج
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Server Authority & Privacy Note */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  الأسعار والتكاليف محسوبة على الخادم حصراً وفق جدول المصنع المعتمد. أسعار البيع وهوامش الربح محجوبة تماماً عن المصنع.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsFactoryReviewOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFactoryOrder}
                  disabled={isSubmittingFactoryOrder || (factoryPreviewData.existingOrdersCount > 0 && !forceNewVersion)}
                  className="px-5 py-2 bg-[#7A0C2E] hover:bg-[#560820] text-white font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Package className="w-4 h-4 text-[#DFC066]" />
                  <span>
                    {isSubmittingFactoryOrder 
                      ? 'جاري الإصدار والربط...' 
                      : (factoryPreviewData.existingOrdersCount > 0 
                          ? `تأكيد إصدار النسخة v${factoryPreviewData.existingOrdersCount + 1}` 
                          : 'تأكيد وإصدار أمر المصنع')}
                  </span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Test Booking Warning Modal */}
        {deletingTestBooking && (
          <div className="fixed inset-0 z-80 bg-black/70 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-right">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-lg font-black text-slate-900">تأكيد حذف الحجز التجريبي</h4>
                <p className="text-xs text-slate-500">
                  أنت على وشك حذف الحجز التجريبي رقم <strong className="font-mono text-[#7A0C2E]">{deletingTestBooking.bookingCode}</strong>
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="bg-[#FAF8F5] p-3 rounded-xl border text-xs space-y-1 text-slate-700">
                <div>العميل: <strong className="text-slate-900">{deletingTestBooking.customerName}</strong></div>
                <div>المناسبة: <strong className="text-slate-900">{deletingTestBooking.eventName}</strong></div>
                <div>الوجبات: <strong>{deletingTestBooking.totalMealsCount} وجبة</strong> بقيمة <strong>{deletingTestBooking.totalDistributorPrice} ج</strong></div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
                <strong>تحذير أمني:</strong>
                <p>
                  سيتم حذف بيانات الحجز التجريبي وبنوده ومدفوعاته التجريبية نهائياً من قاعدة بيانات PostgreSQL. الحجوزات الحقيقية للعملاء محمية بالكامل ولا تقبل الحذف.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingBooking}
                  onClick={() => setDeletingTestBooking(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  disabled={isDeletingBooking}
                  onClick={handleConfirmDeleteTestBooking}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingBooking ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Test Booking Modal */}
        {editingTestBooking && (
          <div className="fixed inset-0 z-80 bg-black/70 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-xs">
              
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">تعديل بيانات الحجز التجريبي</h4>
                    <span className="text-[11px] font-mono text-[#7A0C2E] font-bold">{editingTestBooking.bookingCode}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTestBooking(null)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {testEditError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{testEditError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTestBookingEdits} className="space-y-3 text-right">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم العميل (تجريبي)</label>
                  <input
                    type="text"
                    required
                    value={editingTestBooking.customerName}
                    onChange={(e) => setEditingTestBooking({ ...editingTestBooking, customerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
                    <input
                      type="text"
                      required
                      value={editingTestBooking.customerPhone}
                      onChange={(e) => setEditingTestBooking({ ...editingTestBooking, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">اسم المناسبة</label>
                    <input
                      type="text"
                      required
                      value={editingTestBooking.eventName}
                      onChange={(e) => setEditingTestBooking({ ...editingTestBooking, eventName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تاريخ المناسبة</label>
                    <input
                      type="date"
                      required
                      value={editingTestBooking.eventDate}
                      onChange={(e) => setEditingTestBooking({ ...editingTestBooking, eventDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">وقت التسليم</label>
                    <input
                      type="time"
                      required
                      value={editingTestBooking.deliveryTime}
                      onChange={(e) => setEditingTestBooking({ ...editingTestBooking, deliveryTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">المحافظة</label>
                    <input
                      type="text"
                      required
                      value={editingTestBooking.deliveryGovernorate}
                      onChange={(e) => setEditingTestBooking({ ...editingTestBooking, deliveryGovernorate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">حالة الحجز</label>
                    <select
                      value={editingTestBooking.status}
                      onChange={(e) => setEditingTestBooking({ ...editingTestBooking, status: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl font-bold"
                    >
                      <option value="INITIAL">INITIAL</option>
                      <option value="PENDING_CONFIRMATION">PENDING_CONFIRMATION</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                      <option value="READY_FOR_DELIVERY">READY_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">عنوان التسليم بالتفصيل</label>
                  <input
                    type="text"
                    required
                    value={editingTestBooking.deliveryAddress}
                    onChange={(e) => setEditingTestBooking({ ...editingTestBooking, deliveryAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ملاحظات الحجز</label>
                  <textarea
                    rows={2}
                    value={editingTestBooking.notes || ''}
                    onChange={(e) => setEditingTestBooking({ ...editingTestBooking, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingTestBooking(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTestBooking}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {isSavingTestBooking ? 'جاري الحفظ...' : 'حفظ تعديلات الحجز التجريبي'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
