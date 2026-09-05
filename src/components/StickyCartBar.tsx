import React from 'react';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const StickyCartBar: React.FC = () => {
  const { totalCount, subtotal, isCartOpen, isCheckoutOpen, setIsCartOpen } = useCart();
  const { config } = useConfig();
  const { isRTL } = useLanguage();

  // Don't show if empty or if drawers are already open
  if (totalCount === 0 || isCartOpen || isCheckoutOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full p-4 rounded-2xl bg-[#0F0F10]/95 hover:bg-[#1A1A1C] text-white font-bold shadow-2xl shadow-black/80 flex items-center justify-between border border-white/10 hover:border-[#FF6321]/40 backdrop-blur-xl active:scale-98 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#FF6321] flex items-center justify-center relative shadow-[0_0_15px_rgba(255,99,33,0.4)]">
            <ShoppingBag className="w-5 h-5 text-black stroke-[2.5]" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center shadow-md">
              {totalCount}
            </span>
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <span className="text-sm font-black italic uppercase tracking-tight block leading-tight text-white">
              {isRTL ? 'عرض سلة الطلبات' : 'Voir le panier'}
            </span>
            <span className="text-xs text-gray-400">
              {totalCount} {isRTL ? 'وجبات مختارة' : totalCount > 1 ? 'articles' : 'article'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={isRTL ? 'text-left' : 'text-right'}>
            <span className="text-lg sm:text-xl font-black font-heading text-[#FF6321]">
              {subtotal} {config.currency}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FF6321] text-black group-hover:scale-105 flex items-center justify-center transition-transform shadow-[0_2px_10px_rgba(255,99,33,0.3)]">
            <ArrowRight className={`w-4 h-4 stroke-[3] ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>
    </div>
  );
};
