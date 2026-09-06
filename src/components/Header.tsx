import React, { useState, useEffect } from 'react';
import { ShoppingBag, Phone, Search, MapPin, Gamepad2, Clock, Globe, BellRing, Bell } from 'lucide-react';
import { MustacheLogo } from './MustacheLogo';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { useOrders } from '../context/OrderContext';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenAdmin }) => {
  const { totalCount, subtotal, setIsCartOpen } = useCart();
  const { config } = useConfig();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const {
    activeCustomerOrder,
    setIsOrderTrackerOpen,
  } = useOrders();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b border-white/5 ${
        scrolled
          ? 'bg-[#0F0F10]/95 backdrop-blur-md shadow-2xl shadow-black/60 py-3'
          : 'bg-[#0F0F10]/90 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('hero');
            }}
            className="flex items-center focus:outline-hidden"
          >
            <MustacheLogo size="md" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-400">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-[#FF6321] font-bold transition-colors cursor-pointer"
            >
              {isRTL ? 'الرئيسية' : 'Accueil'}
            </button>
            <button
              onClick={() => scrollToSection('menu-section')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {isRTL ? 'القائمة' : 'Menu'}
            </button>
            <button
              onClick={() => scrollToSection('concept-section')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {isRTL ? 'التجربة' : "L'Expérience"}
            </button>
            <button
              onClick={() => scrollToSection('contact-section')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {isRTL ? 'اتصل بنا' : 'Contact'}
            </button>
          </nav>

          {/* Right Action Icons & Search Input */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              title={isRTL ? 'Passer en Français' : 'التحويل إلى العربية'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-xs font-black text-white transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF6321]" />
              <span className="font-heading uppercase">{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>

            {/* Customer Order Tracker & Notification Bell */}
            {activeCustomerOrder ? (
              <button
                onClick={() => setIsOrderTrackerOpen(true)}
                title={isRTL ? 'إشعار وتتبع طلبك الجاري' : 'Suivi de commande en direct'}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer active:scale-95 shadow-lg ${
                  activeCustomerOrder.status === 'ready'
                    ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-bounce'
                    : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                }`}
              >
                <BellRing className={`w-3.5 h-3.5 ${activeCustomerOrder.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>
                  {activeCustomerOrder.status === 'ready'
                    ? (isRTL ? 'طلبك جاهز!' : 'Prêt !')
                    : (isRTL ? 'جاري التحضير' : 'En cours')}
                </span>
                <span className="hidden sm:inline font-mono font-bold text-[10px] opacity-80">
                  #{activeCustomerOrder.id.replace('CT-', '')}
                </span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              </button>
            ) : (
              <button
                onClick={() => setIsOrderTrackerOpen(true)}
                title={isRTL ? 'مركز الإشعارات وتتبع الطلبات الخاصة بك' : 'Notifications & Suivi'}
                className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-amber-400 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}

            {/* Search Bar Trigger Desktop */}
            <div
              onClick={onOpenSearch}
              className="hidden xl:flex items-center gap-2 bg-[#1A1A1C] border border-white/10 rounded-full py-1.5 px-4 text-xs text-gray-400 hover:text-white hover:border-[#FF6321]/50 transition-all cursor-pointer w-48"
            >
              <Search className="w-3.5 h-3.5 text-[#FF6321]" />
              <span className="truncate">{isRTL ? 'بحث في الوجبات...' : 'Rechercher un plat...'}</span>
            </div>

            {/* Mobile Search Icon Button */}
            <button
              onClick={onOpenSearch}
              aria-label="Rechercher un plat"
              className="xl:hidden w-8 h-8 rounded-full bg-[#1A1A1C] border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#FF6321] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Cart Button with Count Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Voir le panier"
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 hover:border-[#FF6321]/40 text-white font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-lg"
            >
              <ShoppingBag className="w-4 h-4 text-[#FF6321]" />
              <span className="hidden sm:inline">{isRTL ? 'السلة' : 'Panier'}</span>
              {totalCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black bg-[#FF6321] text-black rounded-full">
                  {totalCount}
                </span>
              )}
              {totalCount > 0 && (
                <span className="hidden 2xl:inline text-xs font-black text-[#FF6321] pl-1 border-l border-white/10">
                  {subtotal} {config.currency}
                </span>
              )}
            </button>


          </div>
        </div>


      </div>
    </header>
  );
};
