import React from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, setIsCartOpen } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/95 border border-orange-500/50 shadow-2xl shadow-orange-950/40 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <span className="font-bold text-white block">Super choix !</span>
          <span className="text-zinc-300 line-clamp-1">{toastMessage}</span>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
        >
          Panier
        </button>
      </div>
    </div>
  );
};
