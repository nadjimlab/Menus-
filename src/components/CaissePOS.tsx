import React, { useState, useMemo, useRef } from 'react';
import { useProducts } from '../context/ProductsContext';
import { useOrders } from '../context/OrderContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, CategoryId, OrderItemRecord, PlacedOrder } from '../types';
import { CATEGORIES } from '../data/menuData';
import { MustacheIcon } from './MustacheLogo';
import { soundFx } from '../utils/soundEffects';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Receipt,
  RotateCcw,
  Clock,
  User,
  ArrowRight,
  Calculator,
  X,
  Sparkles,
  DollarSign,
  TrendingUp,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface CaissePOSProps {
  onOrderPlaced?: () => void;
  /** Keep the draft ticket outside the POS view so tab changes cannot discard it. */
  ticketItems?: OrderItemRecord[];
  onTicketItemsChange?: React.Dispatch<React.SetStateAction<OrderItemRecord[]>>;
}

export const CaissePOS: React.FC<CaissePOSProps> = ({
  onOrderPlaced,
  ticketItems: controlledTicketItems,
  onTicketItemsChange,
}) => {
  const { products } = useProducts();
  const { orders, placeCaisseOrder, markOrderPaid, updateOrderStatus } = useOrders();
  const { config } = useConfig();
  const { isRTL } = useLanguage();

  // Active sub-tab inside Caisse
  const [caisseTab, setCaisseTab] = useState<'pos' | 'unpaid' | 'history'>('pos');

  // Mobile view toggle between Menu and Ticket
  const [mobileView, setMobileView] = useState<'menu' | 'ticket'>('menu');

  // POS State
  const [posCategory, setPosCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);

  // Current Ticket State. The parent owns this draft when provided, so switching
  // between admin tabs never destroys an in-progress ticket.
  const [localTicketItems, setLocalTicketItems] = useState<OrderItemRecord[]>([]);
  const ticketItems = controlledTicketItems ?? localTicketItems;
  const setTicketItems = onTicketItemsChange ?? setLocalTicketItems;
  const [orderType, setOrderType] = useState<'sur_place' | 'a_emporter' | 'livraison'>('sur_place');
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'baridimob' | 'carte'>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [activeTicketOrderForReceipt, setActiveTicketOrderForReceipt] = useState<PlacedOrder | null>(null);

  // Manual delivery fee adjustment for POS delivery orders
  const [posDeliveryFee, setPosDeliveryFee] = useState<number>(config.deliveryFee || 200);

  // Settlement modal for existing unpaid orders
  const [orderToSettle, setOrderToSettle] = useState<PlacedOrder | null>(null);
  const [settleMethod, setSettleMethod] = useState<'cash' | 'baridimob' | 'carte'>('cash');
  const [settleCashReceived, setSettleCashReceived] = useState<string>('');

  // Toast feedback and submission guard
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const isSubmittingTicketRef = useRef(false);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Filter products for POS
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = posCategory === 'all' || p.categoryId === posCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nameFr.toLowerCase().includes(q) ||
        p.nameAr.includes(q) ||
        (p.categoryId && p.categoryId.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, posCategory, searchQuery]);

  // Ticket calculations
  const subtotal = useMemo(() => {
    return ticketItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [ticketItems]);

  const deliveryFee = orderType === 'livraison' ? posDeliveryFee : 0;
  const totalAmount = subtotal + deliveryFee;

  const cashReceivedNumber = Number(cashReceivedInput) || 0;
  const cashReceivedProvided = cashReceivedInput.trim().length > 0;
  const changeToGive = Math.max(0, cashReceivedNumber - totalAmount);
  const cashPaymentIsInsufficient =
    paymentMethod === 'cash' && cashReceivedProvided && cashReceivedNumber < totalAmount;
  const settleCashReceivedNumber = Number(settleCashReceived) || 0;
  const settleCashReceivedProvided = settleCashReceived.trim().length > 0;
  const settleCashIsInsufficient =
    settleMethod === 'cash' &&
    Boolean(orderToSettle) &&
    settleCashReceivedProvided &&
    settleCashReceivedNumber < (orderToSettle?.total || 0);

  // Add item to ticket
  const handleAddItemToTicket = (product: Product, sizeOption?: { name: string; priceDelta: number }) => {
    if (!product.available) {
      showFeedback(isRTL ? 'هذا المنتج نفد من المخزون حالياً' : 'Produit indisponible en cuisine');
      return;
    }

    // If product has sizes and size not provided, prompt size modal
    if (product.sizes && product.sizes.length > 0 && !sizeOption) {
      setSelectedProductForSize(product);
      return;
    }

    const unitPrice = product.basePrice + (sizeOption?.priceDelta || 0);
    const lineId = `${product.id}-${sizeOption?.name || 'standard'}`;

    setTicketItems((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (existing) {
        return prev.map((item) =>
          item.id === lineId
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * unitPrice }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: lineId,
            nameFr: product.nameFr,
            nameAr: product.nameAr,
            sizeName: sizeOption?.name,
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice,
          },
        ];
      }
    });

    soundFx.playAddCustomExtra();
    setSelectedProductForSize(null);
  };

  // Modify quantity
  const handleUpdateQuantity = (lineId: string, delta: number) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.id === lineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as OrderItemRecord[]
    );
  };

  // Clear ticket
  const handleClearTicket = () => {
    setTicketItems([]);
    setCashReceivedInput('');
  };

  // Validate and place order. The ref closes the same-event-loop race that a
  // boolean state alone cannot prevent when Confirm is tapped twice quickly.
  const handleValidateTicket = (isImmediatePayment: boolean) => {
    if (isSubmittingTicketRef.current) return;
    if (ticketItems.length === 0) {
      showFeedback(isRTL ? 'الوصل فارغ، يرجى إضافة أطباق أولاً' : 'Veuillez ajouter des articles au ticket');
      return;
    }

    if (isImmediatePayment && cashPaymentIsInsufficient) {
      showFeedback(isRTL ? 'المبلغ المستلم أقل من المبلغ الإجمالي' : 'Le montant reçu est inférieur au total');
      return;
    }

    isSubmittingTicketRef.current = true;
    setIsSubmittingTicket(true);

    let createdOrder: PlacedOrder;
    try {
      createdOrder = placeCaisseOrder({
        customerName: customerName.trim() || (orderType === 'sur_place' ? `Table ${tableNumber}` : 'Client Caisse'),
      deliveryType: orderType,
      tableNumber: orderType === 'sur_place' ? tableNumber : undefined,
      items: ticketItems,
      subtotal,
      deliveryFee,
      total: totalAmount,
      isPaid: isImmediatePayment,
      paymentMethod: isImmediatePayment ? paymentMethod : 'cash',
      cashReceived:
        isImmediatePayment && paymentMethod === 'cash'
          ? cashReceivedProvided
            ? cashReceivedNumber
            : totalAmount
          : totalAmount,
      changeGiven: isImmediatePayment && paymentMethod === 'cash' ? changeToGive : 0,
        notes: orderType === 'sur_place' ? `Table ${tableNumber}` : 'Commande comptoir caisse',
      });
    } catch (error) {
      console.error('POS order creation failed:', error);
      showFeedback(isRTL ? 'تعذر حفظ الطلب، الوصل لم يُمسح' : 'Impossible d’enregistrer la commande, le ticket est conservé');
      isSubmittingTicketRef.current = false;
      setIsSubmittingTicket(false);
      return;
    }

    soundFx.playAddOrderSuccess();

    // Show thermal receipt
    setActiveTicketOrderForReceipt(createdOrder);

    // Reset ticket
    handleClearTicket();
    setCustomerName('');
    showFeedback(
      isImmediatePayment
        ? isRTL ? 'تم تحصيل الطلب بنجاح وإرساله للمطبخ !' : 'Commande encaissée et transmise en cuisine !'
        : isRTL ? 'تم إرسال الطلب للمطبخ (الدفع مؤجل)' : 'Commande transmise en cuisine (paiement différé) !'
    );

    if (onOrderPlaced) {
      onOrderPlaced();
    }
    isSubmittingTicketRef.current = false;
    setIsSubmittingTicket(false);
  };

  // Quick cash amount button handler
  const handleQuickCash = (amount: number) => {
    setCashReceivedInput(amount.toString());
  };

  // Print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

    // Cashier metrics must use only real, well-formed orders.
  const realOrders = orders.filter((o) => Boolean(o.id && o.createdAt && o.source && Array.isArray(o.items) && o.items.length > 0 && Number.isFinite(o.total)));
  const todayOrders = realOrders.filter((o) => {
    const orderDate = new Date(o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });
  const paidOrders = todayOrders.filter((o) => o.isPaid);
  const unpaidOrders = realOrders.filter((o) => !o.isPaid && o.status !== 'cancelled');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCash = paidOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);
  const totalBaridimob = paidOrders
    .filter((o) => o.paymentMethod === 'baridimob')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#0A0A0B] text-white">
      {/* Caisse Header & Stats */}
      <div className="p-3 sm:p-4 border-b border-white/5 bg-[#0F0F10] shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6321] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(255,99,33,0.3)]">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white font-heading">
                  {isRTL ? 'لوحة كاشير المطعم (نقطة البيع)' : 'Caisse & Point de Vente (POS)'}
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isRTL ? 'متصل' : 'En Ligne'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {isRTL ? 'تسجيل طلبات الصندوق السريعة، التحصيل النقدي، وطباعة وصولات الدفع' : 'Encaissement rapide, rendu de monnaie, tickets de caisse'}
              </p>
            </div>
          </div>

          {/* Caisse Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#141416] p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setCaisseTab('pos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                caisseTab === 'pos'
                  ? 'bg-[#FF6321] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isRTL ? 'نقطة البيع (وصل جديد)' : 'Point de Vente'}</span>
            </button>

            <button
              onClick={() => setCaisseTab('unpaid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer relative ${
                caisseTab === 'unpaid'
                  ? 'bg-[#FF6321] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{isRTL ? 'في انتظار التحصيل' : 'À Encaisser'}</span>
              {unpaidOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                  {unpaidOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setCaisseTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                caisseTab === 'history'
                  ? 'bg-[#FF6321] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isRTL ? 'إيرادات اليوم' : 'Bilan Journalier'}</span>
            </button>
          </div>
        </div>

        {/* Quick Caisse Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-white/5">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#141416] border border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/50 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-gray-400 truncate">
                {isRTL ? 'إجمالي المحصل اليوم' : 'Recette du Jour'}
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                {totalRevenue} {config.currency}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#141416] border border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6321]/15 text-[#FF6321] flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-gray-400 truncate">
                {isRTL ? 'السيولة النقدية (Espèces)' : 'Espèces en Caisse'}
              </span>
              <span className="text-xs sm:text-sm font-black text-white font-mono">
                {totalCash} {config.currency}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#141416] border border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950/50 text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-gray-400 truncate">
                {isRTL ? 'بريدي موب (BaridiMob)' : 'BaridiMob'}
              </span>
              <span className="text-xs sm:text-sm font-black text-blue-400 font-mono">
                {totalBaridimob} {config.currency}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#141416] border border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950/50 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-gray-400 truncate">
                {isRTL ? 'في انتظار الدفع' : 'Non Encaissées'}
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                {unpaidOrders.length} {isRTL ? 'طلب' : 'cmd'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback toast */}
      {feedbackMessage && (
        <div className="bg-[#FF6321] text-black px-4 py-2 text-xs font-black flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* TAB 1: POINT DE VENTE (POS) */}
      {caisseTab === 'pos' && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Mobile switcher button bar */}
          <div className="md:hidden flex border-b border-white/5 bg-[#141416] shrink-0">
            <button
              onClick={() => setMobileView('menu')}
              className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                mobileView === 'menu' ? 'bg-[#FF6321] text-black' : 'text-gray-400'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>{isRTL ? 'قائمة الطعام' : 'Menu Plats'}</span>
            </button>
            <button
              onClick={() => setMobileView('ticket')}
              className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-colors relative ${
                mobileView === 'ticket' ? 'bg-[#FF6321] text-black' : 'text-gray-400'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>
                {isRTL ? 'الوصل الحالي' : 'Ticket'} ({ticketItems.reduce((acc, i) => acc + i.quantity, 0)})
              </span>
              {totalAmount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono">
                  {totalAmount} دج
                </span>
              )}
            </button>
          </div>

          {/* LEFT: PRODUCTS LIST (Always on desktop, conditional on mobile) */}
          <div
            className={`flex-1 min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-white/5 overflow-hidden ${
              mobileView === 'ticket' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search & Category Pills */}
            <div className="p-3 bg-[#0E0E10] border-b border-white/5 flex flex-col gap-2 shrink-0">
              <div className="relative">
                <Search
                  className={`w-4 h-4 text-gray-500 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isRTL ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={isRTL ? 'البحث في المنتجات' : 'Rechercher un produit'}
                  placeholder={isRTL ? 'بحث سريع عن طبق أو مشروب...' : 'Recherche rapide plat, boisson...'}
                  className={`w-full py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6321] ${
                    isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                  }`}
                />
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setPosCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    posCategory === 'all'
                      ? 'bg-[#FF6321] text-black font-black'
                      : 'bg-[#141416] text-gray-400 hover:text-white'
                  }`}
                >
                  {isRTL ? 'الكل' : 'Tous'}
                </button>
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPosCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      posCategory === c.id
                        ? 'bg-[#FF6321] text-black font-black'
                        : 'bg-[#141416] text-gray-400 hover:text-white'
                    }`}
                  >
                    {isRTL ? c.nameAr : c.nameFr}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 auto-rows-max content-start">
              {availableProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleAddItemToTicket(prod)}
                  disabled={!prod.available}
                  className={`relative p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group active:scale-95 ${
                    prod.available
                      ? 'bg-[#141416] border-white/5 hover:border-[#FF6321]/50 hover:bg-[#1A1A1D]'
                      : 'bg-neutral-900/40 border-red-950/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-neutral-900 mb-2">
                    <img
                      src={prod.image}
                      alt={isRTL ? prod.nameAr : prod.nameFr}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {prod.badge && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#FF6321] text-black text-[8px] font-black uppercase">
                        {prod.badge}
                      </span>
                    )}
                    {prod.sizes && prod.sizes.length > 0 && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 text-white text-[8px] font-bold">
                        {prod.sizes.length} T
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white truncate font-heading">
                      {isRTL ? prod.nameAr : prod.nameFr}
                    </h4>
                    <span className="text-xs font-black text-[#FF6321] font-mono">
                      {prod.sizes && prod.sizes.length > 0
                        ? isRTL
                          ? `ابتداءً من ${prod.basePrice} ${config.currency}`
                          : `À partir de ${prod.basePrice} ${config.currency}`
                        : `${prod.basePrice} ${config.currency}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: TICKET & PAYMENT (Always on desktop, conditional on mobile) */}
          <div
            className={`w-full md:w-[380px] lg:w-[420px] bg-[#0D0D0E] min-h-0 flex flex-col shrink-0 overflow-hidden ${
              mobileView === 'menu' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Ticket Header & Order Type Selection */}
            <div className="p-3 border-b border-white/5 bg-[#141416] shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#FF6321]" />
                  <span>{isRTL ? 'وصل الطلب الحالي' : 'Ticket Actuel'}</span>
                </span>
                {ticketItems.length > 0 && (
                  <button
                    onClick={handleClearTicket}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isRTL ? 'إفراغ' : 'Vider'}</span>
                  </button>
                )}
              </div>

              {/* Order Type Toggle: Sur place / A emporter / Livraison */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0A0A0B] border border-white/5">
                <button
                  onClick={() => setOrderType('sur_place')}
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    orderType === 'sur_place'
                      ? 'bg-[#FF6321] text-black font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-3 h-3" />
                  <span>{isRTL ? 'صالة' : 'Table'}</span>
                </button>

                <button
                  onClick={() => setOrderType('a_emporter')}
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    orderType === 'a_emporter'
                      ? 'bg-[#FF6321] text-black font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>{isRTL ? 'سفري' : 'Emporter'}</span>
                </button>

                <button
                  onClick={() => setOrderType('livraison')}
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    orderType === 'livraison'
                      ? 'bg-[#FF6321] text-black font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  <span>{isRTL ? 'توصيل' : 'Livraison'}</span>
                </button>
              </div>

              {/* Table or Customer input */}
              {orderType === 'sur_place' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {isRTL ? 'طاولة رقم:' : 'N° Table :'}
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => setTableNumber(tbl)}
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          tableNumber === tbl
                            ? 'bg-[#FF6321] text-black'
                            : 'bg-[#1A1A1C] text-gray-300 hover:bg-[#252527]'
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={isRTL ? 'اسم الزبون (اختياري)...' : 'Nom du client (optionnel)...'}
                      className="w-full px-2.5 py-1 bg-[#1A1A1C] border border-white/5 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6321]"
                    />
                  </div>

                  {orderType === 'livraison' && (
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#1A1A1C] border border-amber-500/30 text-xs">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isRTL ? 'توصيل يدوي:' : 'Livraison :'}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPosDeliveryFee((p) => Math.max(0, p - 50))}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold cursor-pointer"
                        >
                          -50
                        </button>
                        <input
                          type="number"
                          value={posDeliveryFee}
                          onChange={(e) => setPosDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                          className="w-12 text-center bg-black/50 border border-white/10 rounded px-1 text-xs font-mono font-bold text-amber-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPosDeliveryFee((p) => p + 50)}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold cursor-pointer"
                        >
                          +50
                        </button>
                        <span className="text-[10px] text-gray-500 font-bold">{config.currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ticket Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
              {ticketItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-500">
                  <Receipt className="w-10 h-10 stroke-1 text-gray-600 mb-2" />
                  <p className="text-xs font-bold text-gray-400">
                    {isRTL ? 'الوصل فارغ حالياً' : 'Aucun article sélectionné'}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    {isRTL ? 'انقر على الأطباق من القائمة لإضافتها للوصل' : 'Touchez un plat du menu pour l\'ajouter au ticket'}
                  </p>
                </div>
              ) : (
                ticketItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#141416] border border-white/5 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-black text-white truncate font-heading">
                        {isRTL ? item.nameAr : item.nameFr}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        {item.sizeName && (
                          <span className="px-1 rounded bg-white/10 text-[9px] font-bold">
                            {item.sizeName}
                          </span>
                        )}
                        <span className="font-mono">{item.unitPrice} {config.currency}</span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-[#1A1A1C] p-1 rounded-lg border border-white/5 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black font-mono">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-black text-white font-mono shrink-0 w-16 text-right">
                      {item.totalPrice} {config.currency}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Payment & Cash Change Calculator */}
            <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-[#141416] shrink-0 space-y-3 max-h-[52dvh] overflow-y-auto overscroll-contain md:max-h-[40dvh]">
              {/* Subtotal & Total */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>{isRTL ? 'المجموع الفرعي:' : 'Sous-total :'}</span>
                  <span className="font-mono">{subtotal} {config.currency}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>{isRTL ? 'خدمة التوصيل:' : 'Frais de livraison :'}</span>
                    <span className="font-mono">+{deliveryFee} {config.currency}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-white/5 font-black text-base">
                  <span className="text-white">{isRTL ? 'المبلغ الإجمالي:' : 'Total à Payer :'}</span>
                  <span className="text-[#FF6321] text-lg font-mono font-heading">
                    {totalAmount} {config.currency}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white font-black shadow'
                      : 'bg-[#1A1A1C] text-gray-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'نقداً' : 'Espèces'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('baridimob')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'baridimob'
                      ? 'bg-blue-600 text-white font-black shadow'
                      : 'bg-[#1A1A1C] text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>BaridiMob</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('carte')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'carte'
                      ? 'bg-purple-600 text-white font-black shadow'
                      : 'bg-[#1A1A1C] text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'بطاقة' : 'Carte'}</span>
                </button>
              </div>

              {/* Cash tendered & Change Calculator (if cash) */}
              {paymentMethod === 'cash' && totalAmount > 0 && (
                <div className="p-2.5 rounded-2xl bg-[#0A0A0B] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-300">
                      {isRTL ? 'المبلغ المستلم من الزبون:' : 'Espèces reçues :'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step="50"
                        inputMode="numeric"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                        placeholder={totalAmount.toString()}
                        aria-label={isRTL ? 'المبلغ المستلم' : 'Montant reçu'}
                        className={`w-24 px-2 py-1 bg-[#1A1A1C] rounded-lg text-xs text-right font-mono font-black text-white focus:outline-none focus:border-[#FF6321] border ${
                          cashPaymentIsInsufficient ? 'border-red-500' : 'border-white/10'
                        }`}
                      />
                      <span className="text-[10px] text-gray-500 font-mono">DA</span>
                    </div>
                  </div>

                  {/* Quick cash buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(totalAmount)}
                      className="px-2 py-1 rounded-lg bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 text-[10px] font-mono font-bold whitespace-nowrap"
                    >
                      {isRTL ? 'المبلغ بالضبط' : 'Compte juste'}
                    </button>
                    {[500, 1000, 2000, 3000, 5000]
                      .filter((amt) => amt >= totalAmount)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickCash(amt)}
                          className="px-2 py-1 rounded-lg bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 text-[10px] font-mono font-bold whitespace-nowrap"
                        >
                          {amt} دج
                        </button>
                      ))}
                  </div>

                  {/* Change to return banner */}
                  {cashPaymentIsInsufficient && (
                    <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-between text-red-300 font-black">
                      <span className="text-xs">
                        {isRTL ? 'المبلغ المستلم أقل من الإجمالي' : 'Montant reçu insuffisant'}
                      </span>
                      <span className="text-xs font-mono">
                        {Math.max(0, totalAmount - cashReceivedNumber)} {config.currency}
                      </span>
                    </div>
                  )}

                  {cashReceivedNumber > totalAmount && (
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-emerald-400 font-black">
                      <span className="text-xs">
                        {isRTL ? 'باقي الصرف للزبون (Rendu):' : 'Monnaie à rendre :'}
                      </span>
                      <span className="text-sm font-mono font-heading">
                        {changeToGive} {config.currency}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="shrink-0 sticky bottom-0 z-10 space-y-1.5 pt-2 border-t border-white/5 bg-[#0D0D0E]">
                <button
                  type="button"
                  onClick={() => handleValidateTicket(true)}
                  disabled={ticketItems.length === 0 || cashPaymentIsInsufficient || isSubmittingTicket}
                  className="w-full py-3 px-4 rounded-2xl bg-[#FF6321] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-black font-black uppercase tracking-tight text-xs sm:text-sm shadow-[0_8px_18px_rgba(255,99,33,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isRTL ? `تأكيد ودفع فوري (${totalAmount} ${config.currency})` : `Encaisser & Valider (${totalAmount} ${config.currency})`}
                  </span>
                </button>

                {orderType === 'sur_place' && (
                  <button
                    type="button"
                    onClick={() => handleValidateTicket(false)}
                    disabled={ticketItems.length === 0 || isSubmittingTicket}
                    className="w-full py-2 px-3 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] disabled:opacity-40 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {isRTL ? 'إرسال للمطبخ والدفع لاحقاً عند المغادرة' : 'Envoyer en cuisine (Paiement différé)'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNPAID ORDERS WAITING FOR SETTLEMENT */}
      {caisseTab === 'unpaid' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black uppercase text-white font-heading">
              {isRTL ? 'طلبات في انتظار الدفع والتحصيل' : 'Commandes en Attente de Paiement'} ({unpaidOrders.length})
            </h4>
            <span className="text-xs text-gray-400">
              {isRTL ? 'طلبات الطاولات أو الزبائن الذين لم يدفعوا بعد' : 'Service à table ou emporter non encore réglé'}
            </span>
          </div>

          {unpaidOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 stroke-1 text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-gray-300">
                {isRTL ? 'رائع ! جميع الطلبات محصلة ومدفوعة بالكامل' : 'Toutes les commandes sont réglées !'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isRTL ? 'لا توجد أي فواتير معلقة للصندوق' : 'Aucune créance en attente de caisse'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unpaidOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-[#141416] border border-amber-500/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-black text-xs">
                        #{order.id}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h5 className="text-sm font-black text-white font-heading">
                      {order.customerInfo.deliveryType === 'sur_place'
                        ? isRTL ? `طاولة رقم ${order.customerInfo.tableNumber || '1'}` : `Table N° ${order.customerInfo.tableNumber || '1'}`
                        : order.customerInfo.customerName}
                    </h5>

                    <p className="text-xs text-gray-400 mt-1">
                      {order.items.map((i) => `${i.quantity}x ${i.nameFr}`).join(', ')}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] text-gray-400">
                        {isRTL ? 'المطلوب للدفع:' : 'Total dû :'}
                      </span>
                      <span className="text-sm font-black text-[#FF6321] font-mono">
                        {order.total} {config.currency}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setOrderToSettle(order);
                        setSettleCashReceived(order.total.toString());
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-colors cursor-pointer active:scale-95"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'تحصيل الآن' : 'Encaisser'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAILY CAISSE SUMMARY & HISTORY */}
      {caisseTab === 'history' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-black uppercase text-white font-heading">
                {isRTL ? 'ملخص إيرادات ومعاملات اليوم' : 'Rapport Journalier de Caisse'}
              </h4>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>{isRTL ? 'طباعة تقرير اليوم' : 'Imprimer le bilan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#141416] border border-white/5">
              <span className="text-xs text-gray-400 font-bold block mb-1">
                {isRTL ? 'المداخيل الإجمالية' : 'Total des Encaissements'}
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono font-heading">
                {totalRevenue} {config.currency}
              </span>
              <span className="text-[11px] text-gray-500 block mt-1">
                {paidOrders.length} {isRTL ? 'طلب مدفوع' : 'commandes payées'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#141416] border border-white/5">
              <span className="text-xs text-gray-400 font-bold block mb-1">
                {isRTL ? 'الدفع نقداً (Espèces)' : 'Espèces'}
              </span>
              <span className="text-2xl font-black text-white font-mono font-heading">
                {totalCash} {config.currency}
              </span>
              <span className="text-[11px] text-gray-500 block mt-1">
                {paidOrders.filter((o) => o.paymentMethod === 'cash').length} {isRTL ? 'معاملة نقدية' : 'transactions espèces'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#141416] border border-white/5">
              <span className="text-xs text-gray-400 font-bold block mb-1">
                BaridiMob / Carte
              </span>
              <span className="text-2xl font-black text-blue-400 font-mono font-heading">
                {totalBaridimob} {config.currency}
              </span>
              <span className="text-[11px] text-gray-500 block mt-1">
                {paidOrders.filter((o) => o.paymentMethod === 'baridimob').length} {isRTL ? 'تحويل رقمي' : 'virements'}
              </span>
            </div>
          </div>

          {/* Paid orders table */}
          <div className="rounded-2xl border border-white/5 overflow-hidden bg-[#141416]">
            <div className="p-3 border-b border-white/5 bg-[#18181B] flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-300">
                {isRTL ? 'سجل المعاملات المدفوعة' : 'Historique des Transactions Payées'}
              </span>
              <span className="text-xs text-gray-500 font-mono">{paidOrders.length} {isRTL ? 'عملية' : 'opérations'}</span>
            </div>

            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {paidOrders.map((o) => (
                <div key={o.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-gray-300">#{o.id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] uppercase font-bold">
                      {o.paymentMethod || 'cash'}
                    </span>
                    <span className="text-gray-300 truncate max-w-[160px] sm:max-w-xs">
                      {o.customerInfo.deliveryType === 'sur_place'
                        ? `Table ${o.customerInfo.tableNumber || '1'}`
                        : o.customerInfo.customerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-[11px]">
                      {o.paidAt ? new Date(o.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span className="font-mono font-black text-emerald-400">
                      +{o.total} {config.currency}
                    </span>
                    <button
                      onClick={() => setActiveTicketOrderForReceipt(o)}
                      title={isRTL ? 'عرض وطباعة الوصل' : 'Imprimer le ticket'}
                      className="p-1 rounded bg-[#1A1A1C] hover:bg-[#252527] text-gray-400 hover:text-white"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SIZE SELECTOR MODAL FOR PRODUCT */}
      {selectedProductForSize && selectedProductForSize.sizes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0A0A0B] border border-white/10 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-black text-white font-heading">
                  {isRTL ? selectedProductForSize.nameAr : selectedProductForSize.nameFr}
                </h4>
                <p className="text-xs text-gray-400">
                  {isRTL ? 'اختر حجم الطبق:' : 'Choisissez la taille :'}
                </p>
              </div>
              <button
                onClick={() => setSelectedProductForSize(null)}
                className="w-7 h-7 rounded-full bg-[#1A1A1C] text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {selectedProductForSize.sizes.map((s) => {
                const finalP = selectedProductForSize.basePrice + s.priceDelta;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleAddItemToTicket(selectedProductForSize, s)}
                    className="w-full p-3 rounded-2xl bg-[#141416] hover:bg-[#FF6321] hover:text-black border border-white/5 text-left flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black block">{s.name} ({s.label})</span>
                      {s.description && (
                        <span className="text-[10px] text-gray-400 group-hover:text-black/80">
                          {s.description}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black font-mono">
                      {finalP} {config.currency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTLE UNPAID ORDER */}
      {orderToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow">
                  <Banknote className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase text-white font-heading">
                    {isRTL ? `تحصيل طلب #${orderToSettle.id}` : `Encaisser #${orderToSettle.id}`}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {orderToSettle.customerInfo.deliveryType === 'sur_place'
                      ? `Table ${orderToSettle.customerInfo.tableNumber || '1'}`
                      : orderToSettle.customerInfo.customerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOrderToSettle(null)}
                className="w-8 h-8 rounded-full bg-[#1A1A1C] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total due */}
            <div className="p-3 rounded-2xl bg-[#141416] border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">
                {isRTL ? 'المبلغ المطلوب للدفع:' : 'Montant à Encaisser :'}
              </span>
              <span className="text-xl font-black text-[#FF6321] font-mono font-heading">
                {orderToSettle.total} {config.currency}
              </span>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSettleMethod('cash')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                  settleMethod === 'cash' ? 'bg-emerald-600 text-white font-black' : 'bg-[#141416] text-gray-400'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>{isRTL ? 'نقداً' : 'Espèces'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSettleMethod('baridimob')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                  settleMethod === 'baridimob' ? 'bg-blue-600 text-white font-black' : 'bg-[#141416] text-gray-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>BaridiMob</span>
              </button>

              <button
                type="button"
                onClick={() => setSettleMethod('carte')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                  settleMethod === 'carte' ? 'bg-purple-600 text-white font-black' : 'bg-[#141416] text-gray-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isRTL ? 'بطاقة' : 'Carte'}</span>
              </button>
            </div>

            {/* Cash change calculate */}
            {settleMethod === 'cash' && (
              <div className="space-y-2 p-3 rounded-2xl bg-[#141416] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">
                    {isRTL ? 'المبلغ المستلم:' : 'Espèces reçues :'}
                  </span>
                  <input
                    type="number"
                    value={settleCashReceived}
                    onChange={(e) => setSettleCashReceived(e.target.value)}
                    inputMode="numeric"
                    min={0}
                    aria-label={isRTL ? 'المبلغ المستلم للتسوية' : 'Montant reçu pour règlement'}
                    className={`w-24 px-2 py-1 bg-[#1A1A1C] rounded-lg text-xs font-mono font-bold text-right text-white border ${
                      settleCashIsInsufficient ? 'border-red-500' : 'border-white/10'
                    }`}
                  />
                </div>

                {settleCashIsInsufficient && (
                  <div className="flex justify-between text-xs text-red-300 font-black pt-2 border-t border-white/5">
                    <span>{isRTL ? 'المبلغ غير كافٍ:' : 'Montant insuffisant :'}</span>
                    <span className="font-mono">
                      {orderToSettle.total - settleCashReceivedNumber} {config.currency}
                    </span>
                  </div>
                )}

                {Number(settleCashReceived) > orderToSettle.total && (
                  <div className="flex justify-between text-xs text-emerald-400 font-black pt-2 border-t border-white/5">
                    <span>{isRTL ? 'باقي الصرف:' : 'Monnaie à rendre :'}</span>
                    <span className="font-mono">
                      {Number(settleCashReceived) - orderToSettle.total} {config.currency}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const received = settleCashReceivedProvided ? settleCashReceivedNumber : orderToSettle.total;
                const change = Math.max(0, received - orderToSettle.total);
                if (settleMethod === 'cash' && received < orderToSettle.total) {
                  showFeedback(isRTL ? 'المبلغ المستلم أقل من المبلغ المطلوب' : 'Le montant reçu est inférieur au total');
                  return;
                }
                markOrderPaid(orderToSettle.id, settleMethod, received, change);
                showFeedback(isRTL ? 'تم تسجيل تحصيل المبلغ بنجاح !' : 'Paiement enregistré avec succès !');
                setActiveTicketOrderForReceipt({
                  ...orderToSettle,
                  isPaid: true,
                  paymentMethod: settleMethod,
                  cashReceived: received,
                  changeGiven: change,
                  paidAt: new Date().toISOString(),
                });
                setOrderToSettle(null);
              }}
              disabled={settleCashIsInsufficient}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(16,185,129,0.3)] transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isRTL ? 'تأكيد استلام المبلغ وإغلاق الفاتورة' : 'Confirmer l\'encaissement'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: THERMAL RECEIPT PRINT (TICKET DE CAISSE) */}
      {activeTicketOrderForReceipt && (
        <div className="print-receipt-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="print-receipt w-full max-w-sm bg-white text-black rounded-3xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col font-mono text-xs"
          >
            {/* Action Bar */}
                          <div className="print-hidden flex items-center justify-between border-b pb-3 mb-3 print:hidden">

              <span className="font-black text-xs uppercase tracking-tight text-neutral-800">
                {isRTL ? 'معاينة وصل الصندوق' : 'Ticket de Caisse'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrintReceipt}
                  className="px-2.5 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'طباعة' : 'Imprimer'}</span>
                </button>
                <button
                  onClick={() => setActiveTicketOrderForReceipt(null)}
                  className="w-7 h-7 rounded-full bg-neutral-200 hover:bg-neutral-300 text-black flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thermal Ticket Content */}
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-1">
                <div className="w-9 h-9 rounded-full bg-[#FF6321] flex items-center justify-center shadow-xs">
                  <MustacheIcon className="w-5 h-2.5 text-black" />
                </div>
              </div>
              <h3 className="font-black text-base uppercase tracking-tighter">
                {config.restaurantName}
              </h3>
              <p className="text-[10px] text-neutral-600">
                {config.addressFr}
              </p>
              <p className="text-[10px] text-neutral-600">
                Tél : {config.phone}
              </p>
              <div className="border-t border-dashed border-neutral-400 my-2" />
            </div>

            {/* Ticket Info */}
            <div className="space-y-1 text-[11px] my-1">
              <div className="flex justify-between">
                <span>N° Ticket :</span>
                <span className="font-black font-sans">{activeTicketOrderForReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Heure :</span>
                <span>
                  {new Date(activeTicketOrderForReceipt.createdAt).toLocaleDateString('fr-FR')}{' '}
                  {new Date(activeTicketOrderForReceipt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between font-black">
                <span>Service :</span>
                <span className="uppercase">
                  {activeTicketOrderForReceipt.customerInfo.deliveryType === 'sur_place'
                    ? `Table ${activeTicketOrderForReceipt.customerInfo.tableNumber || '1'}`
                    : activeTicketOrderForReceipt.customerInfo.deliveryType === 'livraison'
                    ? 'Livraison'
                    : 'À Emporter'}
                </span>
              </div>
              <div className="border-t border-dashed border-neutral-400 my-2" />
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 my-1">
              {activeTicketOrderForReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold">{item.quantity}x </span>
                    <span>{item.nameFr}</span>
                    {item.sizeName && <span className="text-[10px] text-neutral-500"> ({item.sizeName})</span>}
                  </div>
                  <span className="font-bold shrink-0">{item.totalPrice} {config.currency}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-neutral-400 my-2" />
            </div>

            {/* Totals & Payments */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Sous-total :</span>
                <span>{activeTicketOrderForReceipt.subtotal} {config.currency}</span>
              </div>
              {activeTicketOrderForReceipt.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Livraison :</span>
                  <span>+{activeTicketOrderForReceipt.deliveryFee} {config.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-1 border-t border-black">
                <span>TOTAL :</span>
                <span>{activeTicketOrderForReceipt.total} {config.currency}</span>
              </div>

              {activeTicketOrderForReceipt.isPaid && (
                <div className="pt-2 text-[10px] space-y-0.5 text-neutral-600">
                  <div className="flex justify-between">
                    <span>Mode de règlement :</span>
                    <span className="uppercase font-bold">
                      {activeTicketOrderForReceipt.paymentMethod === 'baridimob'
                        ? 'BaridiMob'
                        : activeTicketOrderForReceipt.paymentMethod === 'carte'
                        ? 'Carte'
                        : 'Espèces'}
                    </span>
                  </div>
                  {activeTicketOrderForReceipt.paymentMethod === 'cash' &&
                    activeTicketOrderForReceipt.cashReceived !== undefined && (
                    <>
                      <div className="flex justify-between">
                        <span>Montant reçu :</span>
                        <span>{activeTicketOrderForReceipt.cashReceived} {config.currency}</span>
                      </div>
                      <div className="flex justify-between font-bold text-neutral-900">
                        <span>Rendu monnaie :</span>
                        <span>{activeTicketOrderForReceipt.changeGiven || 0} {config.currency}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Thermal Footer message */}
            <div className="border-t border-dashed border-neutral-400 my-2" />
            <div className="text-center text-[10px] text-neutral-600 space-y-1">
              <p className="font-bold">Merci de votre visite et Saha Ftourkoum !</p>
              <p>الأصالة والبنة عند الشنب طاكوس</p>
              <p className="text-[9px]">www.cheneb-tacos.dz</p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200 print-hidden print:hidden">
              <button
                onClick={() => setActiveTicketOrderForReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-[#FF6321] text-black font-black text-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {isRTL ? 'طلب جديد' : 'Nouvelle Commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
