import React from 'react';
import { useOrders } from '../context/OrderContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  Phone,
  MessageCircle,
  Gamepad2,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  Lock,
  ShoppingBag,
} from 'lucide-react';

export const OrderTrackerModal: React.FC = () => {
  const {
    activeCustomerOrder,
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    setIsTacoGameOpen,
  } = useOrders();
  const { config } = useConfig();
  const { isRTL } = useLanguage();

  if (!isOrderTrackerOpen) return null;

  // If customer has no active order: show strict privacy guarantee screen
  if (!activeCustomerOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0F0F10] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <BellRing className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isRTL ? 'حماية تامة للخصوصية' : 'Confidentialité Garantie'}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white font-heading mb-2">
            {isRTL ? 'مركز إشعارات وتتبع الطلبات' : 'Centre de Suivi des Commandes'}
          </h3>

          <p className="text-xs text-gray-300 leading-relaxed mb-6">
            {isRTL
              ? 'لا توجد أي طلبيات جارية خاصة بك حالياً على هذا الجهاز. لحماية خصوصية وسرية الزبائن، لا يقوم نظامنا بإظهار طلبيات الآخرين مطلقاً.'
              : 'Aucune commande active enregistrée sur cet appareil. Pour préserver la stricte confidentialité des clients, seules vos propres commandes s\'affichent ici.'}
          </p>

          <div className="p-3.5 rounded-2xl bg-[#18181A] border border-white/5 text-start space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isRTL ? 'كيف يعمل جرس الإشعار؟' : 'Comment ça fonctionne ?'}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {isRTL
                ? 'بمجرد أن تؤكد طلبك (سواء من طاولتك برمز QR أو أونلاين)، سيظهر طلبك هنا وحده، وسيرن جرس التنبيه مع إشعار فوري على شاشتك عند جهوزية الوجبة.'
                : 'Dès validation de votre commande (à table ou en ligne), elle apparaîtra ici avec une alerte sonore et visuelle dès qu\'elle sera prête.'}
            </p>
          </div>

          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="w-full py-3 rounded-2xl bg-linear-to-r from-[#FF6321] to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:opacity-95 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isRTL ? 'تصفح قائمة الطعام واطلب الآن 🌮' : 'Découvrir le Menu & Commander'}</span>
          </button>
        </div>
      </div>
    );
  }

  const order = activeCustomerOrder;
  const status = order.status;

  const getStepState = (stepIndex: number) => {
    // 0: received, 1: preparing, 2: ready/completed
    const statusMap: Record<string, number> = {
      received: 0,
      preparing: 1,
      ready: 2,
      completed: 2,
      cancelled: -1,
    };
    const currentLevel = statusMap[status] ?? 0;

    if (currentLevel > stepIndex) return 'completed';
    if (currentLevel === stepIndex) return 'current';
    return 'pending';
  };

  const steps = [
    {
      id: 'received',
      icon: CheckCircle2,
      titleFr: 'Commande reçue',
      titleAr: 'تم استقبال طلبك',
      descFr: 'Le restaurant a validé votre commande',
      descAr: 'تم تسجيل طلبك بنجاح في نظام المطعم',
    },
    {
      id: 'preparing',
      icon: ChefHat,
      titleFr: 'En préparation',
      titleAr: 'قيد التحضير في المطبخ',
      descFr: 'Le chef prépare vos tacos avec soin',
      descAr: 'الشيف يقوم بإعداد وطهي وجبتك الآن',
    },
    {
      id: 'ready',
      icon: BellRing,
      titleFr: order.customerInfo.deliveryType === 'sur_place' ? 'Prête à table !' : 'Prête à servir !',
      titleAr: order.customerInfo.deliveryType === 'sur_place' ? 'جاهز للتقديم على طاولتك !' : 'طلبك جاهز للاستلام !',
      descFr: order.customerInfo.deliveryType === 'sur_place' ? `Service direct à la Table ${order.customerInfo.tableNumber || ''}` : 'Votre repas chaud vous attend',
      descAr: order.customerInfo.deliveryType === 'sur_place' ? `يتم تقديمه لطاولتكم رقم ${order.customerInfo.tableNumber || ''}` : 'وجبتك ساخنة في انتظارك',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0F0F10] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 bg-[#141416] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              status === 'ready'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce'
                : 'bg-[#FF6321] text-black shadow-[0_0_15px_rgba(255,99,33,0.3)]'
            }`}>
              {status === 'ready' ? <BellRing className="w-5 h-5 stroke-[2.5]" /> : <Clock className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-400">
                  {order.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  status === 'ready'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : status === 'preparing'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    : 'bg-[#FF6321]/20 text-[#FF6321] border border-[#FF6321]/40'
                }`}>
                  {status === 'ready' ? (isRTL ? 'جاهز وصحة وهنا' : 'Prête !') : status === 'preparing' ? (isRTL ? 'قيد التحضير' : 'En préparation') : (isRTL ? 'تم الاستقبال' : 'Reçue')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-heading">
                {isRTL ? 'متابعة حالة طلبك مباشرة' : 'Suivi de votre commande en direct'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 no-scrollbar">
          {/* Privacy & Notification Guarantee Banner */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5 text-gray-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isRTL ? 'طلب محمي بخصوصية تامة (لا يظهر لأي زبون آخر)' : 'Commande privée & confidentielle'}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <BellRing className="w-3 h-3 animate-pulse" />
              <span>{isRTL ? 'تنبيه الجرس نشط' : 'Alerte cloche active'}</span>
            </span>
          </div>

          {/* Status Ready Banner */}
          {status === 'ready' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.3)] text-center animate-in zoom-in-95 duration-300">
              <div className="inline-flex p-2 rounded-full bg-emerald-500 text-black mb-2 shadow-lg">
                <BellRing className="w-6 h-6 animate-pulse stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-white font-heading">
                {isRTL ? '🎉 وجبتك ساخنة وجاهزة للتقديم !' : '🎉 Votre commande est prête !'}
              </h3>
              <p className="text-xs text-emerald-200 mt-1 font-sans">
                {order.customerInfo.deliveryType === 'sur_place'
                  ? isRTL
                    ? `النادل في طريقه لتقديم طلبك إلى الطاولة رقم ${order.customerInfo.tableNumber || ''}. شهية طيبة!`
                    : `Le serveur arrive à votre Table N° ${order.customerInfo.tableNumber || ''}. Bon appétit !`
                  : isRTL
                  ? 'يمكنك الآن التوجه لاستلام طلبك الساخن. صحة وعافية!'
                  : 'Vous pouvez vous présenter pour récupérer votre commande toute chaude. Bon appétit !'}
              </p>
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="p-4 rounded-2xl bg-[#141416] border border-white/5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {isRTL ? 'مراحل تحضير الوجبة' : 'Étapes de préparation'}
            </h4>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const state = getStepState(idx);
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-start gap-3 relative">
                    {/* Connecting vertical line */}
                    {idx < steps.length - 1 && (
                      <div
                        className={`absolute left-[17px] top-8 bottom-[-8px] w-0.5 ${
                          state === 'completed' ? 'bg-[#FF6321]' : 'bg-white/10'
                        }`}
                      />
                    )}

                    {/* Circle icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all ${
                        state === 'completed'
                          ? 'bg-[#FF6321] text-black shadow-[0_0_10px_rgba(255,99,33,0.4)]'
                          : state === 'current'
                          ? 'bg-white text-black ring-4 ring-[#FF6321]/30 font-black animate-pulse'
                          : 'bg-[#1A1A1C] text-gray-500 border border-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                    </div>

                    {/* Step details */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs sm:text-sm font-bold font-heading ${
                            state === 'current'
                              ? 'text-[#FF6321]'
                              : state === 'completed'
                              ? 'text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {isRTL ? step.titleAr : step.titleFr}
                        </span>
                        {state === 'current' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FF6321]/20 text-[#FF6321]">
                            {isRTL ? 'الآن' : 'En cours'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isRTL ? step.descAr : step.descFr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Mini-Game Teaser while waiting */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-[#1A1A1C] to-[#141416] border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                    {isRTL ? 'لعبة شنب تاكوس 🌮' : 'Jeu Cheneb Tacos 🌮'}
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  {isRTL
                    ? 'العب واجمع التاكوس بينما تنتظر وجبتك !'
                    : 'Jouez et attrapez un max de tacos en attendant !'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsTacoGameOpen(true);
              }}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isRTL ? 'العب الآن' : 'Jouer'}
            </button>
          </div>

          {/* Order Items Breakdown */}
          <div className="p-4 rounded-2xl bg-[#141416] border border-white/5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {isRTL ? 'تفاصيل الوجبات' : 'Articles commandés'} ({order.items.length})
              </span>
              {order.customerInfo.tableNumber && (
                <span className="text-xs font-black text-[#FF6321] flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Table {order.customerInfo.tableNumber}</span>
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-xs py-1 border-b border-white/5 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {item.quantity}x {isRTL ? item.nameAr : item.nameFr}
                      </span>
                      {item.sizeName && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-sm bg-[#FF6321]/20 text-[#FF6321]">
                          {item.sizeName}
                        </span>
                      )}
                    </div>
                    {item.sauces && item.sauces.length > 0 && (
                      <p className="text-[10px] text-gray-400">
                        {item.sauces.join(' • ')}
                      </p>
                    )}
                    {item.removedIngredients && item.removedIngredients.length > 0 && (
                      <p className="text-[10px] text-rose-400">
                        Sans : {item.removedIngredients.join(', ')}
                      </p>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-[10px] text-amber-300">
                        + {item.extras.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-300 shrink-0">
                    {item.totalPrice} {config.currency}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">{isRTL ? 'المجموع الإجمالي' : 'Total payé'}</span>
              <span className="text-base font-black text-[#FF6321] font-heading">
                {order.total} {config.currency}
              </span>
            </div>
          </div>

          {/* Restaurant Contact / Help */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <a
              href={`tel:${config.phone}`}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-200 hover:text-white border border-white/5 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>{isRTL ? 'اتصال بالمطعم' : 'Appeler le restaurant'}</span>
            </a>

            {/* ONLY show WhatsApp follow-up button for ONLINE orders. Table orders stay strictly inside the app/table! */}
            {order.customerInfo.deliveryType === 'sur_place' ? (
              <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 text-center">
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {isRTL
                    ? `طلب طاولة ${order.customerInfo.tableNumber || '1'}`
                    : `Service Table ${order.customerInfo.tableNumber || '1'}`}
                </span>
              </div>
            ) : (
              <a
                href={`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
                  `Bonjour, je demande des nouvelles pour ma commande #${order.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-200 hover:text-white border border-white/5 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isRTL ? 'متابعة عبر واتساب' : 'Suivi WhatsApp'}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
