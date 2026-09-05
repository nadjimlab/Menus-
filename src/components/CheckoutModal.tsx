import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useOrders } from '../context/OrderContext';
import { useLanguage } from '../context/LanguageContext';
import { DeliveryType } from '../types';
import {
  X,
  MessageCircle,
  Phone,
  Bike,
  ShoppingBag,
  Utensils,
  MapPin,
  User,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  QrCode,
  Info,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderMessage: string) => void;
}

type OrderChannel = 'table' | 'online';

const PROFILE_STORAGE_KEY = 'cheneb_customer_profile_v1';

const EL_OUED_NEIGHBORHOODS = [
  'حي الرمال',
  'حمة يوسف',
  'وسط المدينة',
  'حي 19 مارس',
  'حي 8 ماي',
  'حي تكسبت',
  'حي الأعشاش',
  'حي المصالح',
  'حي النزلة',
];

const COMMON_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, subtotal, clearCart, setIsCartOpen } = useCart();
  const { config } = useConfig();
  const { tableNumber: detectedTable, placeOrder, setIsOrderTrackerOpen } = useOrders();
  const { isRTL } = useLanguage();

  // Primary Choice: Table Order vs Online Order
  const [orderChannel, setOrderChannel] = useState<OrderChannel>(() => {
    return detectedTable ? 'table' : 'online';
  });

  // Online sub-mode: Livraison (+fee) vs A emporter (0 DA)
  const [onlineType, setOnlineType] = useState<'livraison' | 'a_emporter'>('livraison');

  // Manual delivery fee adjustment based on delivery company distance
  const [manualDeliveryFee, setManualDeliveryFee] = useState<number>(config.deliveryFee || 200);

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [tableNumber, setTableNumber] = useState(detectedTable || '1');
  const [orderNotes, setOrderNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize from localStorage and detected table
  useEffect(() => {
    if (detectedTable) {
      setTableNumber(detectedTable);
      setOrderChannel('table');
    }
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.customerName) setCustomerName(data.customerName);
        if (data.customerPhone) setCustomerPhone(data.customerPhone);
        if (data.deliveryAddress) setDeliveryAddress(data.deliveryAddress);
        if (!detectedTable && data.orderChannel) setOrderChannel(data.orderChannel);
        if (data.onlineType) setOnlineType(data.onlineType);
      }
    } catch {
      // Ignore
    }
  }, [detectedTable]);

  if (!isOpen) return null;

  // Effective delivery type for backend / context
  const effectiveDeliveryType: DeliveryType =
    orderChannel === 'table' ? 'sur_place' : onlineType;

  const deliveryFee =
    orderChannel === 'online' && onlineType === 'livraison' ? manualDeliveryFee : 0;
  const finalTotal = subtotal + deliveryFee;

  // Build formatted WhatsApp message
  const buildWhatsAppMessage = (orderId?: string) => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let msg = '';
    if (orderChannel === 'table') {
      msg += `🍽️ *طلب مباشر من الطاولة رقم (${tableNumber.trim() || '؟'})* 🍽️\n`;
      msg += `🏪 *مطعم شنب طاكوس (داخل الصالة)*\n`;
    } else if (onlineType === 'livraison') {
      msg += `🛵 *طلب أونلاين - توصيل للمنزل (مدينة الوادي)* 🛵\n`;
      msg += `🔥 *CHENEB TACOS - COMMANDE EN LIGNE*\n`;
    } else {
      msg += `🛍️ *طلب أونلاين - استلام من المحل (À emporter)* 🛍️\n`;
      msg += `🔥 *CHENEB TACOS - COMMANDE EN LIGNE*\n`;
    }

    if (orderId) {
      msg += `🆔 *Réf commande :* #${orderId}\n`;
    }
    msg += `🕒 *Heure :* ${timeStr}\n`;
    msg += `------------------------------\n`;
    msg += `📋 *تفاصيل الوجبات والطلب :*\n\n`;

    items.forEach((item, index) => {
      const { product, customization, quantity, totalPrice } = item;
      const itemName = isRTL
        ? `${product.nameAr} (${product.nameFr})`
        : `${product.nameFr} (${product.nameAr})`;

      msg += `*${index + 1}. ${quantity}x ${itemName}* — *${totalPrice} ${config.currency}*\n`;

      // Size
      if (customization.selectedSize) {
        msg += `   • 📏 الحجم : ${customization.selectedSize.name} (${customization.selectedSize.label})\n`;
      }

      // Sauces
      if (customization.selectedSauces && customization.selectedSauces.length > 0) {
        msg += `   • 🥫 الصلصات : ${customization.selectedSauces.join(', ')}\n`;
      }

      // Removed ingredients
      if (customization.removedIngredientIds.length > 0) {
        const removedNames = customization.removedIngredientIds
          .map((id) => {
            const ing = product.defaultIngredients?.find((i) => i.id === id);
            return ing ? (isRTL ? ing.nameAr : ing.nameFr) : id;
          })
          .join(', ');
        msg += `   • ❌ بدون : ${removedNames}\n`;
      }

      // Extra options
      if (customization.selectedExtras && customization.selectedExtras.length > 0) {
        const extrasStr = customization.selectedExtras
          .map((item) => {
            const extraName = isRTL ? item.extra.nameAr : item.extra.nameFr;
            const extraQty = item.quantity > 1 ? ` (${item.quantity}x)` : '';
            return `${extraName}${extraQty} (+${item.extra.price * item.quantity} ${config.currency})`;
          })
          .join(', ');
        msg += `   • ➕ إضافات ومشروبات : ${extrasStr}\n`;
      }

      msg += `\n`;
    });

    msg += `------------------------------\n`;

    if (orderChannel === 'table') {
      msg += `🪑 *رقم الطاولة في المطعم :* طاولة رقم [ ${tableNumber.trim() || '1'} ]\n`;
      msg += `👤 *اسم الزبون :* ${customerName.trim()}\n`;
      if (customerPhone.trim()) {
        msg += `📞 *الهاتف :* ${customerPhone.trim()}\n`;
      }
    } else {
      msg += `👤 *اسم الزبون :* ${customerName.trim()}\n`;
      msg += `📞 *رقم الهاتف :* ${customerPhone.trim()}\n`;
      if (onlineType === 'livraison') {
        msg += `📍 *عنوان التوصيل (الوادي) :* ${deliveryAddress.trim()}\n`;
      } else {
        msg += `🛍️ *طريقة الاستلام :* استلام شخصي ومباشر من المحل (حي الرمال)\n`;
      }
    }

    if (orderNotes.trim()) {
      msg += `📝 *ملاحظات خاصة :* ${orderNotes.trim()}\n`;
    }

    msg += `------------------------------\n`;
    msg += `💰 *المجموع الفرعي :* ${subtotal} ${config.currency}\n`;
    if (orderChannel === 'online' && onlineType === 'livraison') {
      msg += `🛵 *تكلفة التوصيل :* ${deliveryFee} ${config.currency}\n`;
    }
    msg += `🔥 *المبلغ الإجمالي للدفع :* ${finalTotal} ${config.currency}\n`;
    msg += `------------------------------\n`;
    msg += isRTL
      ? `يرجى تأكيد الطلب وتحديد الوقت التقريبي للتحضير 🙏`
      : `Merci de confirmer la commande et le délai estimé 🙏`;

    return msg;
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setValidationError(isRTL ? 'يرجى إدخال اسمك الكريم للمتابعة.' : 'Veuillez indiquer votre nom.');
      return;
    }

    if (orderChannel === 'table') {
      if (!tableNumber.trim()) {
        setValidationError(
          isRTL
            ? 'يرجى تحديد أو إدخال رقم الطاولة التي تجلس فيها.'
            : 'Veuillez sélectionner ou indiquer votre numéro de table.'
        );
        return;
      }
    } else {
      // Online order
      if (!customerPhone.trim() || customerPhone.trim().length < 9) {
        setValidationError(
          isRTL
            ? 'يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد الطلب (مثال: 0661234567).'
            : 'Veuillez indiquer un numéro de téléphone valide (ex: 06 61 23 45 67).'
        );
        return;
      }

      if (onlineType === 'livraison' && !deliveryAddress.trim()) {
        setValidationError(
          isRTL
            ? 'يرجى تحديد عنوان التوصيل والحي في مدينة الوادي.'
            : 'Veuillez indiquer votre quartier et adresse de livraison à El Oued.'
        );
        return;
      }
    }

    setValidationError(null);

    // Save profile for future convenience
    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          orderChannel,
          onlineType,
        })
      );
    } catch {
      // Ignore
    }

    // Register order in OrderContext
    const placedOrder = placeOrder(
      {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType: effectiveDeliveryType,
        deliveryAddress: orderChannel === 'online' && onlineType === 'livraison' ? deliveryAddress.trim() : undefined,
        tableNumber: orderChannel === 'table' ? tableNumber.trim() : undefined,
        notes: orderNotes.trim(),
      },
      items,
      subtotal,
      deliveryFee
    );

    const message = buildWhatsAppMessage(placedOrder.id);

    // If ONLINE order: Launch WhatsApp to send and follow the order
    // If TABLE order: Do NOT open WhatsApp - only confirm directly in the restaurant system
    if (orderChannel === 'online') {
      const encoded = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encoded}`;
      window.open(whatsappUrl, '_blank');
    }

    // Clear cart & transition to live order tracker
    clearCart();
    setIsCartOpen(false);
    onClose();
    onOrderSuccess(
      orderChannel === 'table'
        ? isRTL ? `تم تأكيد طلب الطاولة رقم ${tableNumber || '1'} بنجاح!` : `Commande Table ${tableNumber || '1'} confirmée !`
        : message
    );
    setIsOrderTrackerOpen(true);
  };

  const handleCopyMessage = () => {
    const message = buildWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectNeighborhood = (nh: string) => {
    if (!deliveryAddress.includes(nh)) {
      setDeliveryAddress((prev) => (prev ? `${nh}، ${prev}` : nh));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 bg-[#0F0F10] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6321] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(255,99,33,0.3)]">
              {orderChannel === 'table' ? (
                <Utensils className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <MessageCircle className="w-5 h-5 fill-current" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white font-heading">
                {orderChannel === 'table'
                  ? isRTL ? 'تأكيد طلب الطاولة' : 'Confirmer Commande à Table'
                  : isRTL ? 'إتمام وتأكيد الطلب' : 'Finaliser Votre Commande'}
              </h2>
              <p className="text-xs text-gray-400">
                {orderChannel === 'table'
                  ? isRTL ? 'طلب مباشر من الطاولة داخل المطعم' : 'Commande directe à table au restaurant'
                  : isRTL ? 'طلب أونلاين عبر واتساب • شنب طاكوس' : 'Commande en ligne sur WhatsApp'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSendWhatsApp} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
          {/* Validation Error banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/90 text-red-300 text-xs font-bold animate-in shake duration-200">
              ⚠️ {validationError}
            </div>
          )}

          {/* PRIMARY ORDER CHANNEL TOGGLE: TABLE ORDER vs ONLINE ORDER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] font-heading">
                {isRTL ? '1. اختر نوع الطلب' : '1. Type de Commande'}
              </label>
              {detectedTable && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <QrCode className="w-3 h-3" />
                  <span>{isRTL ? `طاولة رقم ${detectedTable} (QR مسح)` : `Table ${detectedTable} détectée`}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-1 bg-[#141416] border border-white/5 rounded-2xl">
              {/* Option 1: Direct Table Order */}
              <button
                type="button"
                onClick={() => {
                  setOrderChannel('table');
                  if (!tableNumber) setTableNumber(detectedTable || '1');
                  setValidationError(null);
                }}
                className={`relative flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                  orderChannel === 'table'
                    ? 'bg-[#FF6321] text-black border-transparent shadow-[0_4px_20px_rgba(255,99,33,0.35)] font-black'
                    : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    orderChannel === 'table' ? 'bg-black text-[#FF6321]' : 'bg-[#1A1A1C] text-gray-400'
                  }`}
                >
                  <Utensils className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1">
                    <span>{isRTL ? 'طلب مباشر من طاولة' : 'Commande à Table'}</span>
                  </div>
                  <div className={`text-[10px] ${orderChannel === 'table' ? 'text-black/80 font-bold' : 'text-gray-500'}`}>
                    {isRTL ? 'داخل صالة المطعم' : 'Sur place au resto'}
                  </div>
                </div>
              </button>

              {/* Option 2: Online Order */}
              <button
                type="button"
                onClick={() => {
                  setOrderChannel('online');
                  setValidationError(null);
                }}
                className={`relative flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                  orderChannel === 'online'
                    ? 'bg-[#FF6321] text-black border-transparent shadow-[0_4px_20px_rgba(255,99,33,0.35)] font-black'
                    : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    orderChannel === 'online' ? 'bg-black text-[#FF6321]' : 'bg-[#1A1A1C] text-gray-400'
                  }`}
                >
                  <Bike className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black">
                    <span>{isRTL ? 'طلب أونلاين' : 'Commande en Ligne'}</span>
                  </div>
                  <div className={`text-[10px] ${orderChannel === 'online' ? 'text-black/80 font-bold' : 'text-gray-500'}`}>
                    {isRTL ? 'توصيل أو استلام' : 'Livraison ou emporter'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* CHANNEL SPECIFIC CONFIGURATION */}

          {/* === A. IF TABLE ORDER === */}
          {orderChannel === 'table' && (
            <div className="p-4 rounded-2xl bg-[#141416] border border-[#FF6321]/20 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#FF6321]" />
                  <span>{isRTL ? 'اختر رقم طاولتك داخل المطعم' : 'Sélectionnez votre numéro de table'}</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  {isRTL ? 'خدمة الصالة مجاناً' : 'Service en salle gratuit'}
                </span>
              </div>

              {/* Table Quick Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
                {COMMON_TABLES.map((t) => {
                  const isSelected = tableNumber === String(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTableNumber(String(t))}
                      className={`h-11 rounded-xl font-black text-xs flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-[#FF6321] text-black shadow-[0_0_12px_rgba(255,99,33,0.35)] scale-105'
                          : 'bg-[#1A1A1C] border border-white/5 text-gray-300 hover:text-white hover:bg-[#252527]'
                      }`}
                    >
                      <span className="text-[9px] opacity-70 leading-none">{isRTL ? 'طاولة' : 'T'}</span>
                      <span className="text-sm font-black leading-tight">{t}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Table Number Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-400 shrink-0">
                  {isRTL ? 'أو أدخل رقم الطاولة :' : 'Ou numéro personnalisé :'}
                </span>
                <input
                  type="text"
                  placeholder={isRTL ? 'مثال: 14' : 'Ex: 14'}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs font-bold text-white placeholder-gray-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/5 text-[11px] text-gray-400">
                <Info className="w-3.5 h-3.5 text-[#FF6321] shrink-0 mt-0.5" />
                <span>
                  {isRTL
                    ? 'سيقوم طاقم المطبخ بتحضير طلبك وتقديمه مباشرة إلى طاولتك داخل مطعم شنب طاكوس.'
                    : 'L\'équipe en cuisine préparera votre commande et vous l\'apportera directement à votre table.'}
                </span>
              </div>
            </div>
          )}

          {/* === B. IF ONLINE ORDER (LIVRAISON vs A EMPORTER) === */}
          {orderChannel === 'online' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <label className="block text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] font-heading">
                {isRTL ? 'طريقة الاستلام' : 'Mode de Réception'}
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setOnlineType('livraison')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    onlineType === 'livraison'
                      ? 'bg-[#FF6321] text-black border-transparent shadow-[0_4px_15px_rgba(255,99,33,0.3)] font-black'
                      : 'bg-[#1A1A1C] border-white/5 text-gray-400 hover:text-white hover:bg-[#252527]'
                  }`}
                >
                  <Bike className="w-5 h-5 mb-1 stroke-[2.5]" />
                  <span className="text-xs font-bold">{isRTL ? 'توصيل للمنزل' : 'Livraison à Domicile'}</span>
                  <span className={`text-[10px] ${onlineType === 'livraison' ? 'text-black/80 font-bold' : 'text-gray-500'}`}>
                    +{config.deliveryFee} DA (الوادي)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlineType('a_emporter')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    onlineType === 'a_emporter'
                      ? 'bg-[#FF6321] text-black border-transparent shadow-[0_4px_15px_rgba(255,99,33,0.3)] font-black'
                      : 'bg-[#1A1A1C] border-white/5 text-gray-400 hover:text-white hover:bg-[#252527]'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 mb-1 stroke-[2.5]" />
                  <span className="text-xs font-bold">{isRTL ? 'استلام من المحل' : 'À Emporter'}</span>
                  <span className={`text-[10px] ${onlineType === 'a_emporter' ? 'text-black/80 font-bold' : 'text-gray-500'}`}>
                    {isRTL ? 'مجاني (حي الرمال)' : 'Gratuit (Hay Erremal)'}
                  </span>
                </button>
              </div>

              {/* Delivery Address & El Oued Neighborhoods */}
              {onlineType === 'livraison' && (
                <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-gray-300 font-bold">
                      {isRTL ? 'عنوان التوصيل والحي في مدينة الوادي' : 'Adresse & Quartier à El Oued'}{' '}
                      <span className="text-[#FF6321]">*</span>
                    </label>
                    <span className="text-[10px] text-gray-500">
                      {isRTL ? 'انقر على الحي للإضافة السريعة' : 'Cliquez pour ajouter'}
                    </span>
                  </div>

                  {/* Neighborhood chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {EL_OUED_NEIGHBORHOODS.map((nh) => (
                      <button
                        key={nh}
                        type="button"
                        onClick={() => handleSelectNeighborhood(nh)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          deliveryAddress.includes(nh)
                            ? 'bg-[#FF6321]/20 border-[#FF6321] text-[#FF6321]'
                            : 'bg-[#1A1A1C] border-white/10 text-gray-400 hover:text-white hover:border-white/25'
                        }`}
                      >
                        +{nh}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <MapPin className={`w-4 h-4 text-gray-500 absolute ${isRTL ? 'right-3' : 'left-3'} top-3`} />
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        isRTL
                          ? 'مثال: حي الرمال، بالقرب من صيدلية النور...'
                          : 'Ex: Hay Erremal, en face de la pharmacie...'
                      }
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className={`w-full ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3'} py-2 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-hidden resize-none transition-colors`}
                    />
                  </div>

                  {/* Manual Delivery Fee Adjustment Based On Delivery Company Distance */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-[#FF6321]" />
                        <span>{isRTL ? 'سعر التوصيل (تعديل يدوي حسب المسافة)' : 'Tarif de livraison (Ajustable)'}</span>
                      </label>
                      <span className="text-xs font-black text-[#FF6321] font-mono bg-[#FF6321]/10 px-2 py-0.5 rounded-lg border border-[#FF6321]/20">
                        {manualDeliveryFee} {config.currency}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      {isRTL
                        ? 'يختلف سعر التوصيل بحسب مسافة وسعر شركة التوصيل المعتمدة. يمكنك اختياره سريعاً أو كتابته يدوياً:'
                        : 'Le prix varie selon la distance convenue avec l\'entreprise de livraison. Choisissez ou saisissez le montant :'}
                    </p>

                    {/* Quick Distance Presets */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { fee: 150, labelAr: 'قريب (150 دج)', labelFr: '150 DA' },
                        { fee: 200, labelAr: 'الوسط (200 دج)', labelFr: '200 DA' },
                        { fee: 250, labelAr: 'متوسط (250 دج)', labelFr: '250 DA' },
                        { fee: 300, labelAr: 'بعيد (300 دج)', labelFr: '300 DA' },
                      ].map((preset) => (
                        <button
                          key={preset.fee}
                          type="button"
                          onClick={() => setManualDeliveryFee(preset.fee)}
                          className={`py-1 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center ${
                            manualDeliveryFee === preset.fee
                              ? 'bg-[#FF6321] text-black border-transparent font-black shadow-xs'
                              : 'bg-[#1A1A1D] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          {isRTL ? preset.labelAr : preset.labelFr}
                        </button>
                      ))}
                    </div>

                    {/* Manual +/- adjust stepper */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setManualDeliveryFee((prev) => Math.max(0, prev - 50))}
                        className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-black text-xs transition-colors cursor-pointer"
                      >
                        -50 دج
                      </button>
                      <div className="flex-1 flex items-center justify-center bg-[#1A1A1D] border border-white/10 rounded-xl px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={manualDeliveryFee}
                          onChange={(e) => setManualDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-500 font-bold ml-1">{config.currency}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setManualDeliveryFee((prev) => prev + 50)}
                        className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-black text-xs transition-colors cursor-pointer"
                      >
                        +50 دج
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {onlineType === 'a_emporter' && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-xs text-gray-300">
                  <ShoppingBag className="w-4 h-4 text-[#FF6321] shrink-0" />
                  <span>
                    {isRTL
                      ? 'سيكون طلبك جاهزاً ومعلباً للاستلام السريع في مطعم شنب طاكوس بحي الرمال.'
                      : 'Votre commande sera emballée et prête à être récupérée rapidement au restaurant.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customer Details */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] font-heading">
              {isRTL ? '2. معلومات الزبون' : '2. Vos Coordonnées'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                  {isRTL ? 'الاسم واللقب' : 'Nom & Prénom'} <span className="text-[#FF6321]">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 text-gray-500 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    required
                    placeholder={isRTL ? 'مثال: محمد' : 'Ex: Mohamed'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3'} py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-hidden transition-colors`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                  {isRTL ? 'رقم الهاتف (الوادي)' : 'Numéro de Téléphone (El Oued)'}{' '}
                  {orderChannel === 'online' && <span className="text-[#FF6321]">*</span>}
                  {orderChannel === 'table' && <span className="text-gray-500 text-[10px]"> (اختياري)</span>}
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 text-gray-500 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="tel"
                    required={orderChannel === 'online'}
                    placeholder="Ex: 06 61 23 45 67"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3'} py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-hidden transition-colors`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                {isRTL ? 'ملاحظات إضافية على الطلب (اختياري)' : 'Remarques pour la commande (optionnel)'}
              </label>
              <input
                type="text"
                placeholder={
                  isRTL
                    ? 'مثال: بدون حار إضافي، صرف لـ 2000 دج...'
                    : 'Ex: Sans sauce piquante, prévoir de la monnaie...'
                }
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Mini Summary Breakdown */}
          <div className="p-4 rounded-2xl bg-[#1A1A1C] border border-white/5 text-xs space-y-2">
            <div className="flex justify-between text-gray-400 font-medium">
              <span>{isRTL ? 'الوجبات المحددة' : 'Articles'} ({items.length}) :</span>
              <span className="font-bold text-white">{subtotal} {config.currency}</span>
            </div>

            <div className="flex justify-between text-gray-400 font-medium">
              <span>{isRTL ? 'نوع الطلب المختار :' : 'Type de commande :'}</span>
              <span className="font-bold text-white">
                {orderChannel === 'table'
                  ? isRTL ? `طاولة رقم ${tableNumber || '1'} (داخل المطعم)` : `Table ${tableNumber || '1'} (Au resto)`
                  : onlineType === 'livraison'
                  ? isRTL ? 'توصيل أونلاين للمنزل' : 'Livraison à domicile'
                  : isRTL ? 'استلام أونلاين من المحل' : 'À emporter'}
              </span>
            </div>

            {orderChannel === 'online' && onlineType === 'livraison' && (
              <div className="flex justify-between text-gray-400 font-medium">
                <span>{isRTL ? 'تكلفة التوصيل :' : 'Frais de livraison :'}</span>
                <span className="font-bold text-[#FF6321]">+{deliveryFee} {config.currency}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/5 font-heading">
              <span>{isRTL ? 'المبلغ الإجمالي للدفع :' : 'Total à régler :'}</span>
              <span className="text-xl text-[#FF6321]">{finalTotal} {config.currency}</span>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {orderChannel === 'table' ? (
              /* TABLE ORDER: ONLY Direct Confirmation (NO WhatsApp) */
              <>
                <button
                  type="submit"
                  className="w-full py-4 px-4 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-base shadow-[0_10px_20px_rgba(255,99,33,0.3)] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-98 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {isRTL
                      ? `تأكيد الطلب للطاولة ${tableNumber || '1'} (${finalTotal} ${config.currency})`
                      : `Confirmer la Commande (Table ${tableNumber || '1'}) (${finalTotal} ${config.currency})`}
                  </span>
                </button>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 text-center text-xs text-gray-300">
                  <Utensils className="w-4 h-4 text-[#FF6321] shrink-0" />
                  <span>
                    {isRTL
                      ? `يتم إرسال الطلب فوراً إلى شاشة المطبخ ليتم تحضيره وتقديمه لطاولتكم رقم ${tableNumber || '1'}`
                      : `Votre commande est envoyée directement en cuisine pour être servie à votre table N° ${tableNumber || '1'}`}
                  </span>
                </div>
              </>
            ) : (
              /* ONLINE ORDER: Send and Follow via WhatsApp */
              <>
                <button
                  type="submit"
                  className="w-full py-4 px-4 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-base shadow-[0_10px_20px_rgba(255,99,33,0.3)] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>
                    {isRTL
                      ? `إرسال ومتابعة الطلب عبر واتساب (${finalTotal} ${config.currency})`
                      : `Envoyer et Suivre sur WhatsApp (${finalTotal} ${config.currency})`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="py-2.5 px-3 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{isRTL ? 'تم نسخ النص !' : 'Texte copié !'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                        <span>{isRTL ? 'نسخ نص الطلب' : 'Copier le texte'}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`tel:${config.phone}`}
                    className="py-2.5 px-3 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>{isRTL ? `اتصال: ${config.phone}` : `Appel : ${config.phone}`}</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
