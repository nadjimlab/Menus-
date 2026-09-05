import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS } from '../data/menuData';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CupSoda,
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    addToCart,
    subtotal,
    totalCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const { config } = useConfig();
  const { isRTL } = useLanguage();

  // Esc key listener & body lock
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  // Quick upsell items
  const quickDrinks = PRODUCTS.filter((p) => p.categoryId === 'boissons');

  const handleQuickAddDrink = (product: typeof quickDrinks[0]) => {
    addToCart(
      product,
      {
        selectedSize: product.sizes?.[0],
        removedIngredientIds: [],
        selectedExtras: [],
      },
      1
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex ${isRTL ? 'justify-start' : 'justify-end'} bg-black/85 backdrop-blur-xs transition-opacity animate-in fade-in duration-200`}>
      {/* Click outside to close */}
      <div className="flex-1 cursor-pointer" onClick={() => setIsCartOpen(false)} />

      {/* Drawer Container */}
      <div className={`relative w-full max-w-md bg-[#0A0A0B] ${isRTL ? 'border-r' : 'border-l'} border-white/10 h-full flex flex-col shadow-2xl animate-in ${isRTL ? 'slide-in-from-left' : 'slide-in-from-right'} duration-300`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#0F0F10] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6321] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(255,99,33,0.3)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-white font-heading">
                {isRTL ? 'سلة طلباتك' : 'Votre Panier'}
              </h2>
              <span className="text-xs text-gray-400">
                {totalCount} {isRTL ? 'عناصر مختارة' : totalCount > 1 ? 'articles sélectionnés' : 'article sélectionné'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                title={isRTL ? 'تفريغ السلة' : 'Vider le panier'}
                className="text-xs text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#1A1A1C] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              aria-label="Fermer le panier"
              className="w-8 h-8 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {items.length === 0 ? (
            /* EMPTY STATE */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#1A1A1C] border border-white/10 flex items-center justify-center text-gray-600 shadow-inner">
                <ShoppingBag className="w-9 h-9 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tight text-white font-heading">
                  {isRTL ? 'سلتك فارغة حالياً' : 'Votre panier est vide'}
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {isRTL
                    ? 'اختر طاكوسك، برغرك أو وجبتك المفضلة لبدء طلبك بسهولة !'
                    : 'Composez votre Tacos, Burger ou Plat préféré pour commander en un clic !'}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-[0_4px_15px_rgba(255,99,33,0.3)] transition-all cursor-pointer"
              >
                {isRTL ? 'تصفح قائمة الطعام' : 'Découvrir la carte'}
              </button>
            </div>
          ) : (
            <>
              {/* ITEMS LIST */}
              {items.map((item) => {
                const { product, customization, quantity, totalPrice, unitPrice } = item;
                const displayName = isRTL ? product.nameAr : product.nameFr;
                const secondaryName = isRTL ? product.nameFr : product.nameAr;

                const removedNames = customization.removedIngredientIds.map((id) => {
                  const found = product.defaultIngredients.find((i) => i.id === id);
                  return found ? (isRTL ? found.nameAr : found.nameFr) : id;
                });

                return (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 rounded-2xl bg-[#1A1A1C] border border-white/5 hover:border-white/10 transition-all space-y-2.5"
                  >
                    {/* Row 1: Image, Title, Size & Remove */}
                    <div className="flex items-start gap-3">
                      <img
                        src={product.image}
                        alt={displayName}
                        className="w-16 h-16 rounded-xl object-cover border border-white/5 shrink-0 bg-[#0F0F10]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="text-sm font-black text-white font-heading truncate">
                              {displayName}
                            </h4>
                            <p className="text-[11px] font-bold text-[#FF6321]">
                              {secondaryName}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            aria-label={`Supprimer ${displayName}`}
                            className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {customization.selectedSize && (
                          <span className="inline-block text-[10px] font-black uppercase text-[#FF6321] bg-[#FF6321]/10 px-2 py-0.5 rounded-md mt-1">
                            {isRTL ? 'الحجم:' : 'Taille :'} {customization.selectedSize.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customization Details */}
                    {(removedNames.length > 0 ||
                      (customization.selectedSauces && customization.selectedSauces.length > 0) ||
                      customization.selectedExtras.length > 0 ||
                      customization.specialInstructions) && (
                      <div className="p-2.5 rounded-xl bg-[#0F0F10] border border-white/5 text-xs space-y-1.5">
                        {/* Sauces */}
                        {customization.selectedSauces && customization.selectedSauces.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-amber-400 font-bold">
                              {isRTL ? 'الصلصات:' : 'Sauces :'}
                            </span>
                            {customization.selectedSauces.map((sauce, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-200 text-[10px] font-medium border border-amber-800/40"
                              >
                                {sauce}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Removed Ingredients */}
                        {removedNames.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-red-400 font-bold">
                              {isRTL ? 'بدون:' : 'Sans :'}
                            </span>
                            {removedNames.map((name, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 text-[10px] font-medium border border-red-800/40"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Extras */}
                        {customization.selectedExtras.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-[#FF6321] font-bold">
                              {isRTL ? 'إضافات:' : 'Extras :'}
                            </span>
                            {customization.selectedExtras.map((extraItem) => (
                              <span
                                key={extraItem.extra.id}
                                className="px-1.5 py-0.5 rounded bg-[#FF6321]/15 text-[#FF6321] text-[10px] font-bold border border-[#FF6321]/30"
                              >
                                + {isRTL ? extraItem.extra.nameAr : extraItem.extra.nameFr}{' '}
                                {extraItem.quantity > 1 ? `x${extraItem.quantity}` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Special Instructions */}
                        {customization.specialInstructions && (
                          <p className="text-[10px] text-gray-400 italic">
                            <span className="font-bold text-gray-300">
                              {isRTL ? 'ملاحظة:' : 'Note :'}
                            </span>{' '}
                            "{customization.specialInstructions}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Price and Quantity Stepper */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-[#FF6321] font-heading">
                          {totalPrice}
                        </span>
                        <span className="text-xs font-bold text-gray-400">{config.currency}</span>
                        {quantity > 1 && (
                          <span className="text-[10px] text-gray-500 ml-1">
                            ({unitPrice} {config.currency} / u)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-[#0F0F10] border border-white/10 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, quantity - 1)}
                          aria-label="Diminuer"
                          className="w-7 h-7 rounded-lg bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, quantity + 1)}
                          aria-label="Augmenter"
                          className="w-7 h-7 rounded-lg bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* UP-SELL ROW FOR DRINKS, JUICES & WATER */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-300 uppercase tracking-wider mb-2">
                  <CupSoda className="w-3.5 h-3.5 text-[#FF6321]" />
                  <span>{isRTL ? 'إضافة مشروبات، عصائر أو مياه منعشة ؟' : 'Ajouter une boisson, jus ou eau ?'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {quickDrinks.slice(0, 4).map((drink) => (
                    <div
                      key={drink.id}
                      className="p-2.5 rounded-xl bg-[#1A1A1C] border border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {isRTL ? drink.nameAr : drink.nameFr}
                        </p>
                        <p className="text-[10px] text-[#FF6321] font-bold">
                          +{drink.basePrice} {config.currency}
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickAddDrink(drink)}
                        aria-label={`Ajouter ${drink.nameFr}`}
                        className="w-7 h-7 rounded-lg bg-[#FF6321] hover:brightness-110 text-black flex items-center justify-center font-black transition-transform active:scale-95 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary & Checkout CTA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/5 bg-[#0F0F10] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">
                  {isRTL ? 'المجموع الفرعي :' : 'Sous-total :'}
                </span>
                <span className="text-[11px] text-gray-500">
                  {isRTL ? 'التوصيل متاح لكافة أحياء الوادي' : 'Livraison disponible à El Oued'}
                </span>
              </div>
              <span className="font-black text-2xl text-[#FF6321] font-heading">
                {subtotal} {config.currency}
              </span>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={onProceedToCheckout}
              className="w-full py-4 px-5 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-base shadow-[0_10px_20px_rgba(255,99,33,0.3)] flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 cursor-pointer"
            >
              <span>{isRTL ? 'متابعة الطلب عبر الواتساب' : 'Commander sur WhatsApp'}</span>
              <ArrowRight className={`w-4 h-4 stroke-[3] ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
