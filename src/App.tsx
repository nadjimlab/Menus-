import React, { useState, useMemo, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { CartProvider, useCart } from './context/CartContext';
import { OrderProvider, useOrders } from './context/OrderContext';
import { PRODUCTS, CATEGORIES, MOOD_FILTERS } from './data/menuData';
import { Product, CategoryId } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TableBanner } from './components/TableBanner';
import { MoodSelector } from './components/MoodSelector';
import { CategoryNav } from './components/CategoryNav';
import { FilterBar, SubFilterType } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ShareModal } from './components/ShareModal';
import { AdminOrdersModal } from './components/AdminOrdersModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { TacoGameModal } from './components/TacoGameModal';
import { SearchModal } from './components/SearchModal';
import { RestaurantInfo } from './components/RestaurantInfo';
import { StickyCartBar } from './components/StickyCartBar';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { MustacheLogo } from './components/MustacheLogo';
import { Utensils, Lock } from 'lucide-react';

const MenuAppContent: React.FC = () => {
  const { config } = useConfig();
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const { isAdminOpen, setIsAdminOpen } = useOrders();
  const { isRTL } = useLanguage();

  // Category & Filter state
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [activeMoodId, setActiveMoodId] = useState<string | null>(null);
  const [activeSubFilter, setActiveSubFilter] = useState<SubFilterType>('all');

  // Modals state
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [productToShare, setProductToShare] = useState<Product | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lastOrderMessage, setLastOrderMessage] = useState<string | null>(null);

  // Open Product Customization Modal
  // Listen for admin / kds secret URL parameters (e.g. ?admin=1 or ?kds=1)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('admin') === '1' ||
        params.get('admin') === 'true' ||
        params.get('kds') === '1' ||
        params.get('kitchen') === '1'
      ) {
        setIsAdminOpen(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleOpenCustomization = (product: Product) => {
    setSelectedProductForModal(product);
    setIsProductModalOpen(true);
  };

  // Open Share Dialog
  const handleOpenShare = (product: Product) => {
    if (navigator.share) {
      navigator
        .share({
          title: `${product.nameFr} — CHENEB TACOS`,
          text: `Découvrez ${product.nameFr} (${product.basePrice} ${config.currency}) chez CHENEB TACOS à El Oued ! 🌮`,
          url: window.location.href,
        })
        .catch(() => {
          setProductToShare(product);
          setIsShareModalOpen(true);
        });
    } else {
      setProductToShare(product);
      setIsShareModalOpen(true);
    }
  };

  // Filter products based on Category + Mood + SubFilter
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // 1. Category check
      if (activeCategory !== 'all' && product.categoryId !== activeCategory) {
        return false;
      }

      // 2. Mood check
      if (activeMoodId) {
        const mood = MOOD_FILTERS.find((m) => m.id === activeMoodId);
        if (mood && !mood.filterFn(product)) {
          return false;
        }
      }

      // 3. Sub-filter check
      switch (activeSubFilter) {
        case 'popular':
          return product.isPopular === true;
        case 'new':
          return product.isNew === true;
        case 'chicken':
          return product.hasChicken === true;
        case 'meat':
          return product.hasMeat === true;
        case 'cheese':
          return product.isCheeseLover === true;
        case 'spicy':
          return product.isSpicy === true;
        case 'budget':
          return product.isBudgetFriendly === true;
        case 'all':
        default:
          return true;
      }
    });
  }, [activeCategory, activeMoodId, activeSubFilter]);

  // Counts per category for badge indicators
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      all: PRODUCTS.length,
      tacos: 0,
      burgers: 0,
      sandwiches: 0,
      pizza: 0,
      plats: 0,
      boissons: 0,
    };
    PRODUCTS.forEach((p) => {
      if (counts[p.categoryId] !== undefined) {
        counts[p.categoryId]++;
      }
    });
    return counts;
  }, []);

  return (
    <div className={`min-h-screen bg-[#0A0A0B] text-white flex flex-col selection:bg-[#FF6321] selection:text-black ${isRTL ? 'font-sans' : ''}`}>
      {/* Header Navigation */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Spacer for Fixed Header */}
      <div className="h-16 sm:h-20" />

      {/* Table Detection Banner (if table QR scanned or set) */}
      <TableBanner />

      {/* Hero Visual Banner */}
      <Hero onExploreMenu={() => {
        const el = document.getElementById('menu-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }} />

      {/* Main Interactive Menu Container */}
      <main id="menu-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-white/5 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1C] border border-white/5 text-[#FF6321] text-xs font-bold uppercase tracking-widest mb-2">
              <Utensils className="w-3.5 h-3.5" />
              <span>{isRTL ? 'قائمة الطعام الحصرية' : 'La Carte Gourmande'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-heading">
              {isRTL ? 'اختر وجبتك واستمتع بالمذاق' : 'Explorez Notre Carte'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              {isRTL
                ? 'طاكوس فرنسي محشو بالصلصة الجبنية، برغر سماش، بيتزا، سندويتشات، ومشروبات باردة في الوادي.'
                : 'Tacos français gratinés à la sauce fromagère maison, smash burgers fondants, sandwiches & boissons fraîches à El Oued.'}
            </p>
          </div>

          <div className="text-xs text-gray-400 shrink-0 font-medium">
            <span className="text-[#FF6321] font-black text-base">{filteredProducts.length}</span>{' '}
            {isRTL ? 'وجبة متوفرة' : `${filteredProducts.length > 1 ? 'plats disponibles' : 'plat disponible'}`}
          </div>
        </div>

        {/* Mood Selector */}
        <MoodSelector
          selectedMoodId={activeMoodId}
          onSelectMood={(moodId) => setActiveMoodId(moodId)}
        />

        {/* Category Navigation Pills (Sticky below Header) */}
        <CategoryNav
          activeCategory={activeCategory}
          onSelectCategory={(catId) => setActiveCategory(catId)}
          categoryCounts={categoryCounts}
        />

        {/* Secondary Sub-filters Bar */}
        <FilterBar
          activeFilter={activeSubFilter}
          onSelectFilter={(filter) => setActiveSubFilter(filter)}
        />

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center p-8 bg-[#141416] rounded-3xl border border-white/5 my-8 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1A1C] flex items-center justify-center text-gray-500 mb-4">
              <Utensils className="w-8 h-8 text-[#FF6321]" />
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-white font-heading">
                {isRTL ? 'لا توجد وجبات مطابقة لهذا الاختيار' : 'Aucun plat ne correspond à cette combinaison'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isRTL ? 'جرب إعادة ضبط الفلاتر أو اختيار فئة أخرى.' : 'Essayez de réinitialiser vos filtres ou de changer de catégorie.'}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveMoodId(null);
                setActiveSubFilter('all');
              }}
              className="px-6 py-3 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-wider text-xs shadow-[0_4px_15px_rgba(255,99,33,0.3)] transition-all cursor-pointer"
            >
              {isRTL ? 'عرض جميع الوجبات' : 'Afficher toute la carte'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onCustomize={handleOpenCustomization}
                onShare={handleOpenShare}
              />
            ))}
          </div>
        )}
      </main>

      {/* Restaurant Info & Location Section */}
      <RestaurantInfo />

      {/* Footer */}
      <footer className="bg-[#0A0A0B] border-t border-white/5 py-12 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center space-y-4">
          <MustacheLogo size="sm" />
          <p className="max-w-md text-gray-400 leading-relaxed text-xs">
            {config.restaurantName} — Menu Digital & Expérience de commande sur mesure.
            Spécialiste du Tacos français, burgers gourmets, sandwichs, pizzas et plats à El Oued.
          </p>
          <div className="flex items-center gap-4 text-gray-500 text-xs font-semibold">
            <span>Téléphone : {config.phone}</span>
            <span>•</span>
            <span>{config.addressFr}</span>
          </div>
          <div className="pt-2 border-t border-white/5 w-full max-w-md flex items-center justify-between text-[11px] text-gray-600">
            <span>© {new Date().getFullYear()} CHENEB TACOS. Tous droits réservés.</span>
            {/* Discreet Staff Entrance */}
            <button
              onClick={() => setIsAdminOpen(true)}
              title={isRTL ? 'فضاء طاقم ومطبخ المطعم (محمي برمز PIN)' : 'Espace Équipe & Cuisine (Protégé par code PIN)'}
              className="text-gray-700 hover:text-gray-400 flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-white/5"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>{isRTL ? 'إدارة المطبخ' : 'Accès Staff'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Cart Bar */}
      <StickyCartBar />

      {/* Floating WhatsApp Quick Action Button */}
      <FloatingWhatsApp />

      {/* Modals & Overlays */}
      {/* 1. Product Customization Experience Modal */}
      <ProductModal
        product={selectedProductForModal}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProductForModal(null);
        }}
      />

      {/* 2. Slide-Over Cart Drawer */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* 3. Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(orderMsg) => setLastOrderMessage(orderMsg)}
      />

      {/* 4. Order Confirmation Success Modal */}
      <OrderSuccessModal
        isOpen={!!lastOrderMessage}
        orderMessage={lastOrderMessage || ''}
        onClose={() => setLastOrderMessage(null)}
      />

      {/* 5. Live Customer Order Tracker Modal */}
      <OrderTrackerModal />

      {/* 6. Mini Game: Taco Catch Challenge ("لعبة شنب تاكوس") */}
      <TacoGameModal />

      {/* 7. Product Sharing Modal */}
      <ShareModal
        product={productToShare}
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setProductToShare(null);
        }}
      />

      {/* 8. Admin Orders KDS & QR Code Manager */}
      <AdminOrdersModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* 9. Instant Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(product) => handleOpenCustomization(product)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ConfigProvider>
        <CartProvider>
          <OrderProvider>
            <MenuAppContent />
          </OrderProvider>
        </CartProvider>
      </ConfigProvider>
    </LanguageProvider>
  );
}
