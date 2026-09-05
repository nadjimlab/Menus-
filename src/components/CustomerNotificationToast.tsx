import React, { useEffect, useState, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { useLanguage } from '../context/LanguageContext';
import { soundFx } from '../utils/soundEffects';
import { BellRing, CheckCircle2, ChefHat, X, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CustomerNotificationToast: React.FC = () => {
  const { activeCustomerOrder, setIsOrderTrackerOpen } = useOrders();
  const { isRTL } = useLanguage();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [toastDesc, setToastDesc] = useState('');
  const [toastType, setToastType] = useState<'ready' | 'preparing' | 'received'>('received');

  const lastKnownStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeCustomerOrder) {
      setToastVisible(false);
      lastKnownStatusRef.current = null;
      return;
    }

    const currentStatus = activeCustomerOrder.status;

    // Check if status changed
    if (lastKnownStatusRef.current && lastKnownStatusRef.current !== currentStatus) {
      if (currentStatus === 'ready') {
        setToastType('ready');
        setToastTitle(
          activeCustomerOrder.customerInfo.deliveryType === 'sur_place'
            ? (isRTL ? '🔔 وجبتك جاهزة للتقديم على طاولتك !' : '🔔 Votre commande est prête à table !')
            : (isRTL ? '🔔 طلبك جاهز للاستلام الآن !' : '🔔 Votre commande est prête !')
        );
        setToastDesc(
          isRTL
            ? `طلب #${activeCustomerOrder.id} أصبح ساخناً وجاهزاً، صحة وهنا !`
            : `La commande #${activeCustomerOrder.id} est prête. Bon appétit !`
        );
        setToastVisible(true);
        soundFx.playOrderReadyCelebration();

        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.2 },
          });
        } catch {
          // ignore
        }
      } else if (currentStatus === 'preparing') {
        setToastType('preparing');
        setToastTitle(
          isRTL ? '👨‍🍳 الشيف بدأ تحضير طلبك الآن' : '👨‍🍳 Commande en cours de préparation'
        );
        setToastDesc(
          isRTL
            ? `طلب #${activeCustomerOrder.id} قيد الإعداد بعناية في مطبخ شنب طاكوس`
            : `Nos chefs préparent votre repas avec soin`
        );
        setToastVisible(true);
        soundFx.playNewOrderNotification();
      }
    }

    lastKnownStatusRef.current = currentStatus;
  }, [activeCustomerOrder?.status, activeCustomerOrder?.id, isRTL]);

  if (!toastVisible || !activeCustomerOrder) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div
        onClick={() => {
          setIsOrderTrackerOpen(true);
          setToastVisible(false);
        }}
        className={`p-4 rounded-3xl border shadow-2xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
          toastType === 'ready'
            ? 'bg-linear-to-r from-emerald-950 via-[#102018] to-emerald-950 border-emerald-500/60 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
            : 'bg-[#18181B] border-[#FF6321]/50 shadow-[0_10px_30px_rgba(255,99,33,0.25)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              toastType === 'ready'
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce'
                : 'bg-[#FF6321] text-black shadow-[0_0_15px_rgba(255,99,33,0.4)]'
            }`}
          >
            {toastType === 'ready' ? (
              <BellRing className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChefHat className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          <div className="min-w-0">
            <h5 className="text-xs sm:text-sm font-black text-white font-heading truncate">
              {toastTitle}
            </h5>
            <p className="text-[11px] text-gray-300 truncate mt-0.5">{toastDesc}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline text-[10px] font-bold text-gray-300 underline">
            {isRTL ? 'عرض الطلب' : 'Détails'}
          </span>
          <ChevronRight className="w-4 h-4 text-white" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastVisible(false);
            }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
