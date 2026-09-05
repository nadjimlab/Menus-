import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingWhatsApp: React.FC = () => {
  const { config } = useConfig();
  const { totalCount } = useCart();

  const handleOpen = () => {
    const text = encodeURIComponent('Bonjour CHENEB TACOS ! J\'ai une question à propos de votre menu.');
    window.open(`https://wa.me/${config.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div
      className={`fixed z-30 transition-all duration-300 ${
        totalCount > 0
          ? 'bottom-22 right-4 sm:bottom-6 sm:right-6'
          : 'bottom-6 right-4 sm:right-6'
      }`}
    >
      <button
        onClick={handleOpen}
        title="Commander sur WhatsApp"
        aria-label="Contacter le restaurant sur WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 hover:border-[#FF6321]/50 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <MessageCircle className="w-7 h-7 text-[#FF6321] fill-current" />

        {/* Pulse effect badge */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6321] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF6321]"></span>
        </span>

        {/* Tooltip on hover for desktop */}
        <span className="hidden sm:group-hover:block absolute right-16 px-3 py-1.5 rounded-xl bg-[#0F0F10] text-xs font-bold text-gray-200 shadow-xl border border-white/10 whitespace-nowrap">
          📱 Commander sur WhatsApp
        </span>
      </button>
    </div>
  );
};
