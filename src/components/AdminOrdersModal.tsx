import React, { useState, useEffect, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useManager } from '../context/ManagerContext';
import { PlacedOrder, OrderStatus } from '../types';
import { TableStandCard } from './TableStandCard';
import { MustacheIcon } from './MustacheLogo';
import { AdminProductManager } from './AdminProductManager';
import { CaissePOS } from './CaissePOS';
import { ManagerDashboard } from './ManagerDashboard';
import { soundFx } from '../utils/soundEffects';
import { supabase } from '../lib/supabase';
import {
  X,
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  Trash2,
  Phone,
  QrCode,
  Settings,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Save,
  RotateCcw,
  Check,
  CheckCheck,
  Lock,
  LogOut,
  KeyRound,
  ShieldAlert,
  Calculator,
  Utensils,
  Banknote,
  LayoutGrid,
} from 'lucide-react';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAFF_SESSION_STORAGE_KEY = 'cheneb_staff_session_v1';

export const AdminOrdersModal: React.FC<AdminOrdersModalProps> = ({ isOpen, onClose }) => {
  const {
    orders,
    updateOrderStatus,
    deleteOrder,
    clearAllOrders,
  } = useOrders();
  const { products } = useProducts();
  const { config, updateConfig, resetConfig } = useConfig();
  const { isRTL } = useLanguage();

  // Authentication State for Restaurant Staff
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [cashierLoginMode, setCashierLoginMode] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [cashierCode, setCashierCode] = useState('');
  const [staffSessionToken, setStaffSessionToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STAFF_SESSION_STORAGE_KEY) || '';
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [pinError, setPinError] = useState(false);
  const pinAuthenticatedRef = useRef(false);

  const [activeTab, setActiveTab] = useState<'orders' | 'caisse' | 'products' | 'qrcodes' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Settings form state
  const [formData, setFormData] = useState({
    whatsappNumber: config.whatsappNumber,
    phone: config.phone,
    deliveryFee: config.deliveryFee,
    currency: config.currency,
    addressFr: config.addressFr,
    addressAr: config.addressAr,
    openingHoursFr: config.openingHoursFr,
  });
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  const { setIsManagerAuthenticated } = useManager();

  useEffect(() => {
    let cancelled = false;
    const restoreStaffSession = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem(STAFF_SESSION_STORAGE_KEY) : null;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (token && supabaseUrl && publishableKey) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/staff-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
            body: JSON.stringify({ sessionToken: token }),
          });
          const result = await response.json() as { staff?: { fullName?: string; role?: string } };
          const role = result.staff?.role;
          if (response.ok && result.staff?.fullName && (role === 'manager' || role === 'cashier')) {
            if (cancelled) return;
            pinAuthenticatedRef.current = true;
            setStaffSessionToken(token);
            setCashierName(result.staff.fullName);
            setIsAuthenticated(true);
            setIsManagerMode(role === 'manager');
            setIsManagerAuthenticated(role === 'manager');
            setActiveTab(role === 'manager' ? 'orders' : 'caisse');
            return;
          }
        } catch {
          // Fall through to the normal login screen.
        }
        localStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
      }

      if (!supabase || pinAuthenticatedRef.current || cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (pinAuthenticatedRef.current || cancelled) return;
      const role = data.session?.user.app_metadata?.role;
      setIsAuthenticated(role === 'manager' || role === 'cashier');
      setIsManagerMode(role === 'manager');
      setIsManagerAuthenticated(role === 'manager');
    };
    void restoreStaffSession();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      if (pinAuthenticatedRef.current) return;
      const role = session?.user.app_metadata?.role;
      setIsAuthenticated(role === 'manager' || role === 'cashier');
      setIsManagerMode(role === 'manager');
      setIsManagerAuthenticated(role === 'manager');
    });
    return () => {
      cancelled = true;
      listener?.data.subscription.unsubscribe();
    };
  }, [setIsManagerAuthenticated]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMessage('');

    const normalizedCashierName = cashierName.trim().replace(/\s+/g, ' ');
    if (!normalizedCashierName || !/^\d{4}$/.test(cashierCode)) {
      setLoginErrorMessage(isRTL ? 'أدخل الاسم أو رمز الموظف وPIN من 4 أرقام' : 'Saisissez le nom/code employé et un PIN de 4 chiffres');
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!supabaseUrl || !publishableKey) {
      setLoginErrorMessage(isRTL ? 'إعدادات Supabase غير مكتملة' : 'La configuration Supabase est incomplète');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/verify-cashier-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({
          employeeName: normalizedCashierName,
          pin: cashierCode,
        }),
      });
      const result = await response.json() as { staff?: { fullName?: string; role?: string }; sessionToken?: string; error?: string };
      const role = result.staff?.role;

      if (!response.ok || !result.staff || (role !== 'cashier' && role !== 'manager')) {
        setLoginErrorMessage(result.error || (isRTL ? 'الاسم أو الرمز غير صحيح' : 'Nom ou code incorrect'));
        return;
      }

      const isManager = role === 'manager';
      if (!result.sessionToken) {
        setLoginErrorMessage(isRTL ? 'تعذر إنشاء جلسة آمنة' : 'Impossible de créer la session sécurisée');
        return;
      }
      localStorage.setItem(STAFF_SESSION_STORAGE_KEY, result.sessionToken);
      pinAuthenticatedRef.current = true;
      setStaffSessionToken(result.sessionToken);
      setIsAuthenticated(true);
      setIsManagerMode(isManager);
      setIsManagerAuthenticated(isManager);
      setActiveTab(isManager ? 'orders' : 'caisse');
    } catch {
      setLoginErrorMessage(isRTL ? 'تعذر الاتصال بخدمة التحقق' : 'Impossible de joindre le service de vérification');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    pinAuthenticatedRef.current = false;
    localStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
    setStaffSessionToken('');
    void supabase?.auth.signOut();
    setIsAuthenticated(false);
    setIsManagerMode(false);
    setIsManagerAuthenticated(false);
  };

  if (!isOpen) return null;

  if (isAuthenticated && isManagerMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0B] animate-in fade-in duration-200">
        <div className="flex justify-end p-2 bg-[#121214] border-b border-white/5">
          <button
            onClick={() => { handleLogout(); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-400 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isRTL ? 'تسجيل الخروج وإغلاق' : 'Déconnexion & Fermer'}</span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <ManagerDashboard managerAuth={{ name: cashierName.trim(), sessionToken: staffSessionToken }} />
        </div>
      </div>
    );
  }

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'active') return ['received', 'preparing', 'ready'].includes(order.status);
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const countByStatus = {
    received: orders.filter((o) => o.status === 'received').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  const handleStatusAdvance = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'received';
    if (currentStatus === 'received') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'completed';

    updateOrderStatus(orderId, nextStatus);

    if (soundEnabled) {
      if (nextStatus === 'ready') {
        soundFx.playOrderReadyCelebration();
      } else {
        soundFx.playNewOrderNotification();
      }
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      whatsappNumber: formData.whatsappNumber.replace(/\+/g, '').replace(/\s/g, ''),
      phone: formData.phone,
      deliveryFee: Number(formData.deliveryFee) || 0,
      currency: formData.currency,
      addressFr: formData.addressFr,
      addressAr: formData.addressAr,
      openingHoursFr: formData.openingHoursFr,
    });
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 2000);
  };

  const getTimeAgo = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diff < 1) return isRTL ? 'الآن' : 'À l\'instant';
    if (diff < 60) return isRTL ? `منذ ${diff} دقيقة` : `Il y a ${diff} min`;
    const hours = Math.floor(diff / 60);
    return isRTL ? `منذ ${hours} ساعة` : `Il y a ${hours} h`;
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <button onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1A1A1C] text-gray-300 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-3xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center text-[#FF6321] mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black uppercase text-white font-heading mb-1">
            {isRTL ? 'دخول طاقم المطعم' : 'Connexion équipe'}
          </h3>
          <div className="flex p-1 rounded-xl bg-[#141416] border border-white/10 mb-5">
            <button type="button" onClick={() => setCashierLoginMode(false)} className={`flex-1 py-2 rounded-lg text-xs font-black cursor-pointer ${!cashierLoginMode ? 'bg-[#FF6321] text-black' : 'text-gray-400'}`}>
              {isRTL ? 'المدير' : 'Manager'}
            </button>
            <button type="button" onClick={() => setCashierLoginMode(true)} className={`flex-1 py-2 rounded-lg text-xs font-black cursor-pointer ${cashierLoginMode ? 'bg-[#FF6321] text-black' : 'text-gray-400'}`}>
              {isRTL ? 'الكاشير' : 'Caissier'}
            </button>
          </div>
          <form onSubmit={handleAuthSubmit} className="w-full space-y-3 text-start">
            <label className="block text-xs font-bold text-gray-300">
              {isRTL ? (cashierLoginMode ? 'اسم الكاشير' : 'اسم المدير') : (cashierLoginMode ? 'Nom du caissier' : 'Nom du manager')}
            </label>
            <input type="text" required value={cashierName} onChange={(e) => setCashierName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#141416] border border-white/10 text-white outline-none focus:border-[#FF6321]" placeholder={isRTL ? 'مثال: يوسف بن سالم' : 'Ex : Youssef Ben Salem'} />
            <label className="block text-xs font-bold text-gray-300">{isRTL ? 'رمز السر (4 أرقام)' : 'Code secret (4 chiffres)'}</label>
            <input type="password" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="current-password" value={cashierCode} onChange={(e) => setCashierCode(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-3 rounded-xl bg-[#141416] border border-white/10 text-white outline-none focus:border-[#FF6321] tracking-[0.5em] text-center" placeholder="••••" />
            {loginErrorMessage && <p className="text-xs text-red-400 font-bold">{loginErrorMessage}</p>}
            <button type="submit" disabled={loginLoading} className="w-full py-3 rounded-xl bg-[#FF6321] disabled:opacity-50 text-black font-black cursor-pointer">
              {loginLoading ? (isRTL ? 'جارٍ التحقق...' : 'Vérification...') : (isRTL ? 'دخول آمن' : 'Connexion sécurisée')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unpaid count for caisse badge
  const unpaidOrdersCount = orders.filter((o) => !o.isPaid && o.status !== 'cancelled').length;
  const activeTableGroups = Array.from(
    orders
      .filter((order) => order.customerInfo.deliveryType === 'sur_place' && !['completed', 'cancelled'].includes(order.status))
      .reduce((groups, order) => {
        const table = order.customerInfo.tableNumber || '?';
        const current = groups.get(table) || [];
        groups.set(table, [...current, order]);
        return groups;
      }, new Map<string, PlacedOrder[]>())
  )
    .map(([table, tableOrders]) => [table, [...tableOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())] as const)
    .sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[100dvh] sm:h-[94vh] max-h-[100dvh] bg-[#0A0A0B] border border-white/10 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Bar */}
        <div className="p-3 sm:p-4 border-b border-white/5 bg-[#0F0F10] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6321] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(255,99,33,0.3)] shrink-0">
              <MustacheIcon className="w-6 h-3 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white font-heading">
                  {isRTL ? (isManagerMode ? 'لوحة إدارة المدير' : 'لوحة الكاشير') : (isManagerMode ? 'Administration & Gestion Restaurant' : 'Caisse & Commandes')}
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-[#FF6321]/20 text-[#FF6321] text-[9px] font-black uppercase">
                  Staff Pro
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {isRTL ? (isManagerMode ? 'الطلبات، الكاشير، وإدارة المطعم' : 'الطلبات ونقطة بيع الكاشير') : (isManagerMode ? 'Commandes KDS, Caisse POS & Gestion de la Carte' : 'Commandes & Caisse POS')}
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none pb-0.5">
            <div className="flex items-center gap-1 bg-[#1A1A1C] p-1 rounded-2xl border border-white/5 shrink-0">
              {/* 1. KDS Kitchen Orders */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-[#FF6321] text-black shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? 'المطبخ والطلبات' : 'Cuisine & KDS'}</span>
                {countByStatus.received > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center animate-pulse">
                    {countByStatus.received}
                  </span>
                )}
              </button>

              {/* 2. Caisse & POS */}
              <button
                onClick={() => setActiveTab('caisse')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'caisse'
                    ? 'bg-[#FF6321] text-black shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{isRTL ? 'الكاشير والصندوق' : 'Caisse & POS'}</span>
                {unpaidOrdersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] flex items-center justify-center font-bold">
                    {unpaidOrdersCount}
                  </span>
                )}
              </button>

              {isManagerMode && (
                <>
                  {/* 3. Product CRUD Manager */}
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'products'
                        ? 'bg-[#FF6321] text-black shadow-md'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'قائمة الطعام' : 'Menu & Plats'}</span>
                    <span className="opacity-70 text-[10px] hidden sm:inline">
                      ({products.length})
                    </span>
                  </button>

                  {/* 4. Table QR Codes */}
                  <button
                    onClick={() => setActiveTab('qrcodes')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'qrcodes'
                        ? 'bg-[#FF6321] text-black shadow-md'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'QR الطاولات' : 'QR Tables'}</span>
                  </button>

                  {/* 5. Settings */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'settings'
                        ? 'bg-[#FF6321] text-black shadow-md'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'الإعدادات' : 'Paramètres'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Lock / Logout session */}
            <button
              onClick={handleLogout}
              title={isRTL ? 'قفل لوحة الإدارة' : 'Verrouiller la session'}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#1A1A1C] hover:bg-red-950/60 hover:text-red-300 border border-white/5 text-gray-400 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isRTL ? 'قفل' : 'Verrouiller'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: LIVE ORDERS (KDS) */}
        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter & Action Bar */}
            <div className="p-3 sm:p-4 bg-[#141416] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-white text-black font-black'
                      : 'bg-[#1A1A1C] text-gray-300 hover:text-white'
                  }`}
                >
                  {isRTL ? 'النشطة' : 'Actives'} ({countByStatus.received + countByStatus.preparing + countByStatus.ready})
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-black font-black'
                      : 'bg-[#1A1A1C] text-gray-300 hover:text-white'
                  }`}
                >
                  {isRTL ? 'الكل' : 'Tous'} ({orders.length})
                </button>

                <button
                  onClick={() => setStatusFilter('received')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'received'
                      ? 'bg-amber-500 text-black font-black'
                      : 'bg-[#1A1A1C] text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{isRTL ? '📥 مستلمة' : '📥 Reçues'}</span>
                  <span className="font-mono font-black">({countByStatus.received})</span>
                </button>

                <button
                  onClick={() => setStatusFilter('preparing')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'preparing'
                      ? 'bg-[#FF6321] text-black font-black'
                      : 'bg-[#1A1A1C] text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{isRTL ? '👨‍🍳 قيد التحضير' : '👨‍🍳 En cours'}</span>
                  <span className="font-mono font-black">({countByStatus.preparing})</span>
                </button>

                <button
                  onClick={() => setStatusFilter('ready')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'ready'
                      ? 'bg-emerald-500 text-black font-black'
                      : 'bg-[#1A1A1C] text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{isRTL ? '🔔 جاهزة' : '🔔 Prêtes'}</span>
                  <span className="font-mono font-black">({countByStatus.ready})</span>
                </button>

                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-blue-500 text-white font-black'
                      : 'bg-[#1A1A1C] text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{isRTL ? '✅ مكتملة' : '✅ Servies'}</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                  className="p-2 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white border border-white/5 cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF6321]" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {orders.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Voulez-vous réinitialiser toutes les commandes ?')) {
                        clearAllOrders();
                      }
                    }}
                    className="p-2 rounded-xl bg-[#1A1A1C] hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Vider la liste"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Active tables overview */}
            {activeTableGroups.length > 0 && (
              <div className="px-3 sm:px-4 pt-3 bg-[#141416] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-[#FF6321]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      {isRTL ? 'الطاولات النشطة' : 'Tables actives'}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF6321]/15 text-[#FF6321] text-[10px] font-black">
                      {activeTableGroups.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {isRTL ? 'الطلبات غير المكتملة فقط' : 'Commandes non terminées uniquement'}
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                  {activeTableGroups.map(([table, tableOrders]) => {
                    const latest = tableOrders[0];
                    const statusLabel = latest.status === 'received'
                      ? (isRTL ? 'جديد' : 'Nouveau')
                      : latest.status === 'preparing'
                      ? (isRTL ? 'قيد التحضير' : 'En cuisine')
                      : (isRTL ? 'جاهز' : 'Prête');
                    const statusClass = latest.status === 'received'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                      : latest.status === 'preparing'
                      ? 'border-[#FF6321]/60 bg-[#FF6321]/10 text-[#FF9A73]'
                      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';

                    return (
                      <div key={table} className={`min-w-[190px] rounded-2xl border p-3 ${statusClass}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-white">{isRTL ? `طاولة ${table}` : `Table ${table}`}</div>
                              <div className="text-[10px] opacity-80">{tableOrders.length} {isRTL ? 'طلب نشط' : 'active'}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black">{statusLabel}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                          <span className="font-mono opacity-80">{latest.id}</span>
                          <span className="font-black text-white">{latest.total} {config.currency}</span>
                        </div>
                        <button
                          onClick={() => handleStatusAdvance(latest.id, latest.status)}
                          className="w-full mt-2 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-[10px] font-black text-white transition-colors cursor-pointer"
                        >
                          {latest.status === 'received'
                            ? (isRTL ? 'بدء التحضير' : 'Démarrer')
                            : latest.status === 'preparing'
                            ? (isRTL ? 'تحديد كجاهز' : 'Marquer prête')
                            : (isRTL ? 'إنهاء الطلب' : 'Terminer')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Orders Cards Grid */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
              {filteredOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A1A1C] flex items-center justify-center text-gray-500 mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white font-heading">
                    {isRTL ? 'لا توجد طلبات في هذا القسم حالياً' : 'Aucune commande dans cette section'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    {isRTL
                      ? 'الطلبات الجديدة القادمة من الزبائن أو الطاولات ستظهر هنا تلقائياً'
                      : 'Les nouvelles commandes passées par les clients apparaîtront ici automatiquement.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => {
                    const isTable = order.customerInfo.deliveryType === 'sur_place';

                    return (
                      <div
                        key={order.id}
                        className={`rounded-2xl bg-[#141416] border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xl ${
                          order.status === 'received'
                            ? 'border-amber-500/60 ring-2 ring-amber-500/20'
                            : order.status === 'preparing'
                            ? 'border-[#FF6321]/60 ring-2 ring-[#FF6321]/20'
                            : order.status === 'ready'
                            ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
                            : 'border-white/5 opacity-70'
                        }`}
                      >
                        {/* Order Card Header */}
                        <div className="p-3.5 bg-[#1A1A1C] border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-white">
                              {order.id}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {getTimeAgo(order.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isTable ? (
                              <span className="px-2 py-0.5 rounded-lg bg-[#FF6321] text-black text-[11px] font-black flex items-center gap-1 shadow-xs">
                                <UtensilsCrossed className="w-3 h-3" />
                                <span>Table {order.customerInfo.tableNumber || '?'}</span>
                              </span>
                            ) : order.customerInfo.deliveryType === 'livraison' ? (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[11px] font-black">
                                🛵 Livraison
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[11px] font-black">
                                🛍️ Emporter
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer Details */}
                        <div className="p-3.5 border-b border-white/5 bg-[#111113]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {order.customerInfo.customerName}
                            </span>
                            <a
                              href={`tel:${order.customerInfo.customerPhone}`}
                              className="text-xs text-[#FF6321] hover:underline flex items-center gap-1 font-mono font-bold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{order.customerInfo.customerPhone}</span>
                            </a>
                          </div>

                          {order.customerInfo.deliveryAddress && order.customerInfo.deliveryType === 'livraison' && (
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                              📍 {order.customerInfo.deliveryAddress}
                            </p>
                          )}

                          {order.customerInfo.notes && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[10px] text-amber-300 font-medium">
                              📝 {order.customerInfo.notes}
                            </div>
                          )}
                        </div>

                        {/* Items List */}
                        <div className="p-3.5 space-y-2 flex-1 max-h-56 overflow-y-auto no-scrollbar">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="pb-2 border-b border-white/5 last:border-0 last:pb-0">
                              <div className="flex items-start justify-between gap-1 text-xs">
                                <span className="font-bold text-white">
                                  <span className="text-[#FF6321] font-black mr-1">{item.quantity}x</span>
                                  {isRTL ? item.nameAr : item.nameFr}
                                </span>
                                {item.sizeName && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/10 text-gray-200">
                                    {item.sizeName}
                                  </span>
                                )}
                              </div>

                              {item.sauces && item.sauces.length > 0 && (
                                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                                  🥫 {item.sauces.join(', ')}
                                </p>
                              )}

                              {item.removedIngredients && item.removedIngredients.length > 0 && (
                                <p className="text-[10px] text-rose-400 font-semibold">
                                  ❌ Sans : {item.removedIngredients.join(', ')}
                                </p>
                              )}

                              {item.extras && item.extras.length > 0 && (
                                <p className="text-[10px] text-amber-300 font-semibold">
                                  ✨ + {item.extras.join(', ')}
                                </p>
                              )}

                              {item.specialInstructions && (
                                <p className="text-[10px] text-purple-300 italic">
                                  Note : {item.specialInstructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Card Footer with Price & Actions */}
                        <div className="p-3.5 bg-[#0F0F10] border-t border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{isRTL ? 'المجموع' : 'Total'}</span>
                            <span className="text-sm font-black text-[#FF6321] font-heading">
                              {order.total} {config.currency}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {order.status === 'received' && (
                              <button
                                onClick={() => handleStatusAdvance(order.id, 'received')}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#FF6321] hover:brightness-110 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                <ChefHat className="w-3.5 h-3.5" />
                                <span>{isRTL ? 'بدء التحضير' : 'Préparer'}</span>
                              </button>
                            )}

                            {order.status === 'preparing' && (
                              <button
                                onClick={() => handleStatusAdvance(order.id, 'preparing')}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:brightness-110 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                <BellRing className="w-3.5 h-3.5 animate-bounce" />
                                <span>{isRTL ? 'إشعار بالجاهزية !' : 'Prêt à servir !'}</span>
                              </button>
                            )}

                            {order.status === 'ready' && (
                              <button
                                onClick={() => handleStatusAdvance(order.id, 'ready')}
                                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{isRTL ? 'تم التسليم بنجاح' : 'Commande servie'}</span>
                              </button>
                            )}

                            {order.status === 'completed' && (
                              <div className="flex-1 py-1.5 text-center text-xs font-bold text-gray-500">
                                ✅ {isRTL ? 'مكتملة ومغلقة' : 'Commande clôturée'}
                              </div>
                            )}

                            <button
                              onClick={() => deleteOrder(order.id)}
                              title="Supprimer"
                              className="p-2 rounded-xl bg-[#1A1A1C] hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: CAISSE & POINT DE VENTE (POS) */}
        {activeTab === 'caisse' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <CaissePOS onOrderPlaced={() => setActiveTab('orders')} />
          </div>
        )}

        {/* Tab 3: PRODUCTS & MENU MANAGER (CRUD) */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <AdminProductManager />
          </div>
        )}

        {/* Tab 4: QR CODES FOR TABLES */}
        {activeTab === 'qrcodes' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                  {isRTL ? 'مولد رموز QR لجميع طاولات المطعم' : 'Générateur de QR Codes pour les Tables'}
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  {isRTL
                    ? 'اختر رقم الطاولة لتوليد بطاقة QR عالية الجودة جاهزة للطباعة أو التنزيل.'
                    : 'Sélectionnez un numéro de table pour générer une fiche QR imprimable à poser sur les tables.'}
                </p>
              </div>

              {/* Table Number Selector Pills */}
              <div className="flex items-center justify-center gap-2 flex-wrap max-w-xl mx-auto">
                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedTableNumber(num)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTableNumber === num
                        ? 'bg-[#FF6321] text-black shadow-lg scale-110'
                        : 'bg-[#1A1A1C] text-gray-300 hover:text-white hover:bg-[#252527] border border-white/5'
                    }`}
                  >
                    T{num}
                  </button>
                ))}
              </div>

              {/* Custom table number input */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-gray-400">{isRTL ? 'أو رقم طاولة مخصص:' : 'Ou numéro personnalisé :'}</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={selectedTableNumber}
                  onChange={(e) => setSelectedTableNumber(Number(e.target.value) || 1)}
                  className="w-16 px-2.5 py-1 rounded-lg bg-[#1A1A1C] border border-white/10 text-white font-mono text-center font-bold focus:outline-hidden"
                />
              </div>

              {/* Live Preview Card */}
              <div className="flex justify-center pt-2">
                <TableStandCard tableNumber={selectedTableNumber} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar">
            <form onSubmit={handleSettingsSubmit} className="max-w-xl mx-auto space-y-4">
              {savedSettingsSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{isRTL ? 'تم حفظ التعديلات بنجاح !' : 'Paramètres sauvegardés avec succès !'}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                  {isRTL ? 'رقم الواتساب (لاستقبال الطلبات)' : 'Numéro WhatsApp (Réception des commandes)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                  {isRTL ? 'رقم الهاتف للاتصال المباشر' : 'Téléphone d\'appel direct'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                    {isRTL ? 'سعر التوصيل' : 'Frais de livraison'} ({config.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                    {isRTL ? 'العملة' : 'Devise'}
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                  {isRTL ? 'عنوان المطعم في الوادي' : 'Adresse physique (Français)'}
                </label>
                <input
                  type="text"
                  value={formData.addressFr}
                  onChange={(e) => setFormData({ ...formData, addressFr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                  العنوان بالعربية
                </label>
                <input
                  type="text"
                  value={formData.addressAr}
                  onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden text-right"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                  {isRTL ? 'أوقات العمل' : 'Horaires d\'ouverture'}
                </label>
                <input
                  type="text"
                  value={formData.openingHoursFr}
                  onChange={(e) => setFormData({ ...formData, openingHoursFr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Réinitialiser aux valeurs d\'origine ?')) {
                      resetConfig();
                      onClose();
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 p-2 rounded-lg hover:bg-[#1A1A1C] transition-colors cursor-pointer font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'إعادة ضبط' : 'Valeurs par défaut'}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_15px_rgba(255,99,33,0.3)] transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isRTL ? 'حفظ الإعدادات' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
