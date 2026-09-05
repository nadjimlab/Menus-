import React, { useState, useEffect, useMemo } from 'react';
import { Product, SizeOption, ExtraOption, CartCustomization } from '../types';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { AVAILABLE_SAUCES } from '../data/menuData';
import {
  X,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  RotateCcw,
  Flame,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { config } = useConfig();
  const { addToCart, setIsCartOpen } = useCart();
  const { isRTL, language } = useLanguage();

  // Selected Size
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>(undefined);

  // Removed Ingredients: Set of IDs
  const [removedIngredientIds, setRemovedIngredientIds] = useState<string[]>([]);

  // Selected Sauces (names)
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);

  // Selected Extras: Map of extraId -> { extra: ExtraOption, quantity: number }
  const [selectedExtrasMap, setSelectedExtrasMap] = useState<
    Record<string, { extra: ExtraOption; quantity: number }>
  >({});

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Special chef note
  const [specialNotes, setSpecialNotes] = useState('');

  // Reset modal state when opened with a new product
  useEffect(() => {
    if (product) {
      const defaultSize =
        product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
      setSelectedSize(defaultSize);
      setRemovedIngredientIds([]);
      setSelectedExtrasMap({});
      setQuantity(1);
      setSpecialNotes('');

      // Default sauces based on category
      if (product.categoryId === 'tacos') {
        setSelectedSauces(['Sauce Fromagère Maison', 'Sauce Algérienne']);
      } else if (product.categoryId === 'burgers') {
        setSelectedSauces(['Sauce Burger Biggy']);
      } else {
        setSelectedSauces([]);
      }
    }
  }, [product, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Compute live dynamic price
  const basePrice = product.basePrice;
  const sizeDelta = selectedSize ? selectedSize.priceDelta : 0;
  const selectedExtrasList = Object.values(selectedExtrasMap) as { extra: ExtraOption; quantity: number }[];
  const extrasTotal: number = selectedExtrasList.reduce(
    (sum: number, item) => sum + item.extra.price * item.quantity,
    0
  );

  const unitPrice = basePrice + sizeDelta + extrasTotal;
  const grandTotal = unitPrice * quantity;

  // Toggle ingredient removal
  const toggleIngredient = (id: string) => {
    setRemovedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle sauces (max 2 free sauces)
  const toggleSauce = (sauceNameFr: string) => {
    setSelectedSauces((prev) => {
      if (prev.includes(sauceNameFr)) {
        return prev.filter((s) => s !== sauceNameFr);
      }
      if (prev.length >= 2) {
        // Replace the second sauce
        return [prev[0], sauceNameFr];
      }
      return [...prev, sauceNameFr];
    });
  };

  // Update extras quantity
  const updateExtraQuantity = (extra: ExtraOption, delta: number) => {
    setSelectedExtrasMap((prev) => {
      const current = prev[extra.id]?.quantity || 0;
      const nextQty = Math.max(0, Math.min(5, current + delta));

      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[extra.id];
        return copy;
      }

      return {
        ...prev,
        [extra.id]: { extra, quantity: nextQty },
      };
    });
  };

  // Reset to original recipe
  const handleResetCustomization = () => {
    setRemovedIngredientIds([]);
    setSelectedExtrasMap({});
    if (product.categoryId === 'tacos') {
      setSelectedSauces(['Sauce Fromagère Maison', 'Sauce Algérienne']);
    } else if (product.categoryId === 'burgers') {
      setSelectedSauces(['Sauce Burger Biggy']);
    } else {
      setSelectedSauces([]);
    }
  };

  // Handle Add To Cart
  const handleAddToCart = (andOpenCart = false) => {
    const selectedExtras: { extra: ExtraOption; quantity: number }[] = Object.values(selectedExtrasMap);

    const customization: CartCustomization = {
      selectedSize,
      removedIngredientIds,
      selectedSauces: selectedSauces.length > 0 ? selectedSauces : undefined,
      selectedExtras,
      specialInstructions: specialNotes.trim() ? specialNotes.trim() : undefined,
    };

    addToCart(product, customization, quantity);
    onClose();

    if (andOpenCart) {
      setIsCartOpen(true);
    }
  };

  const isTacosOrBurgerOrSandwich =
    product.categoryId === 'tacos' ||
    product.categoryId === 'burgers' ||
    product.categoryId === 'sandwiches';

  const displayName = isRTL ? product.nameAr : product.nameFr;
  const secondaryName = isRTL ? product.nameFr : product.nameAr;
  const displayDesc = isRTL && product.descriptionAr ? product.descriptionAr : product.descriptionFr;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-[#0A0A0B] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Top Header Controls Bar */}
        <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} z-20 flex items-center gap-2`}>
          {/* Reset custom button */}
          {(removedIngredientIds.length > 0 ||
            Object.keys(selectedExtrasMap).length > 0 ||
            selectedSauces.length > 0) && (
            <button
              onClick={handleResetCustomization}
              title={isRTL ? 'إعادة ضبط الوصفة الأصلية' : 'Réinitialiser la recette classique'}
              className="px-3 py-1.5 rounded-full bg-[#1A1A1C]/90 hover:bg-[#252527] backdrop-blur-md border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FF6321]" />
              <span className="hidden sm:inline">{isRTL ? 'الوصفة الأصلية' : 'Recette originale'}</span>
            </button>
          )}

          {/* Close modal button */}
          <button
            onClick={onClose}
            aria-label="Fermer la personnalisation"
            className="w-9 h-9 rounded-full bg-[#1A1A1C]/90 hover:bg-[#252527] backdrop-blur-md border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Hero Food Photography */}
          <div className="relative w-full h-44 sm:h-64 bg-[#0F0F10] overflow-hidden group">
            <div className="absolute inset-0 bg-[#FF6321] blur-3xl opacity-20 pointer-events-none" />
            <img
              src={product.image}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#0A0A0B] via-[#0A0A0B]/30 to-transparent" />

            {/* Category badge */}
            <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} px-3 py-1 rounded-full bg-[#FF6321] text-black text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-[0_2px_10px_rgba(255,99,33,0.4)]`}>
              <Flame className="w-3 h-3 fill-current" />
              <span>{product.categoryId.toUpperCase()}</span>
            </div>

            {/* Live dynamic price indicator on image */}
            <div className={`absolute bottom-3 ${isRTL ? 'right-4' : 'left-4'} px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-baseline gap-1.5 shadow-lg`}>
              <span className="text-[10px] uppercase font-bold text-gray-400">
                {isRTL ? 'سعر الوجبة :' : 'Prix unitaire :'}
              </span>
              <span className="text-base sm:text-lg font-black text-[#FF6321] font-heading">
                {unitPrice} {config.currency}
              </span>
            </div>
          </div>

          {/* Product Title & Description */}
          <div className="p-4 sm:p-6 pb-2">
            <div className="flex flex-col gap-1 mb-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white font-heading leading-tight">
                {displayName}
              </h2>
              <p className="text-sm font-bold text-[#FF6321]">
                {secondaryName}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {displayDesc}
            </p>
          </div>

          {/* SECTION 1: SIZE SELECTOR */}
          {product.sizes && product.sizes.length > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase font-black text-white tracking-wider flex items-center gap-2 font-heading">
                  <span className="w-5 h-5 rounded-full bg-[#FF6321] text-black text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span>{isRTL ? 'اختر الحجم المناسب' : 'Choisir la taille'}</span>
                </h4>
                <span className="text-[11px] text-[#FF6321] font-bold">
                  {isRTL ? 'إجباري' : 'Obligatoire'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  const price = product.basePrice + size.priceDelta;

                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#FF6321] text-black border-transparent shadow-[0_4px_15px_rgba(255,99,33,0.35)] ring-2 ring-[#FF6321]'
                          : 'bg-[#1A1A1C] border-white/5 text-white hover:bg-[#252527] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-sm font-black uppercase tracking-tight">
                          {size.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-black text-[#FF6321] flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] block mb-1.5 ${isSelected ? 'text-black/80 font-bold' : 'text-gray-400'}`}>
                        {size.label}
                      </span>
                      <span className={`text-xs font-black ${isSelected ? 'text-black' : 'text-[#FF6321]'}`}>
                        {price} {config.currency}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: INGREDIENTS INCLUS (RETIRER / SANS) */}
          {product.defaultIngredients.length > 0 && (
            <div className="px-4 sm:px-6 py-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs uppercase font-black text-white tracking-wider flex items-center gap-2 font-heading">
                  <span className="w-5 h-5 rounded-full bg-[#FF6321] text-black text-[11px] font-black flex items-center justify-center">
                    {product.sizes && product.sizes.length > 1 ? '2' : '1'}
                  </span>
                  <span>
                    {isRTL
                      ? 'مكونات الوجبة (اضغط لإلغاء أي مكوّن)'
                      : 'Ingrédients Inclus (Retirer un ingrédient ?)'}
                  </span>
                </h4>
                {removedIngredientIds.length > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded-full">
                    {removedIngredientIds.length} {isRTL ? 'ملغي' : 'Retiré(s)'}
                  </span>
                )}
              </div>

              {/* Helper Callout banner */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#1A1A1C] border border-white/5 text-gray-400 text-xs mb-3">
                <Info className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  {isRTL
                    ? 'اضغط على أي مكوّن لاستبعاده من الوجبة (مثلاً: بدون بصل أو بدون طماطم).'
                    : 'Touchez un ingrédient pour le retirer de votre plat si vous ne le souhaitez pas.'}
                </p>
              </div>

              {/* Ingredients Chips */}
              <div className="flex flex-wrap gap-2">
                {product.defaultIngredients.map((ing) => {
                  const isRemoved = removedIngredientIds.includes(ing.id);
                  const ingName = isRTL ? ing.nameAr : ing.nameFr;

                  return (
                    <button
                      key={ing.id}
                      onClick={() => ing.removable && toggleIngredient(ing.id)}
                      disabled={!ing.removable}
                      aria-pressed={isRemoved}
                      className={`group px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        !ing.removable
                          ? 'bg-[#1A1A1C]/50 text-gray-500 border-white/5 cursor-not-allowed opacity-60'
                          : isRemoved
                          ? 'bg-red-950/90 text-red-200 border-red-500/60 shadow-[0_2px_10px_rgba(239,68,68,0.2)]'
                          : 'bg-[#1A1A1C] text-gray-200 hover:text-white border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      {isRemoved ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}

                      <div className="flex flex-col items-start leading-tight">
                        <span className={isRemoved ? 'line-through text-red-300 font-bold' : 'text-white'}>
                          {isRemoved ? (isRTL ? `بدون ${ingName}` : `Sans ${ingName}`) : ingName}
                        </span>
                        <span className={`text-[10px] ${isRemoved ? 'text-red-400/80' : 'text-gray-400'}`}>
                          {isRTL ? (isRemoved ? 'تم الاستبعاد' : 'موجود بالوجبة') : isRemoved ? 'Retiré' : 'Inclus'}
                        </span>
                      </div>

                      {isRemoved && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 font-black">
                          {isRTL ? 'إلغاء' : 'Annuler'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: SAUCES */}
          {isTacosOrBurgerOrSandwich && (
            <div className="px-4 sm:px-6 py-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs uppercase font-black text-white tracking-wider flex items-center gap-2 font-heading">
                  <span className="w-5 h-5 rounded-full bg-[#FF6321] text-black text-[11px] font-black flex items-center justify-center">
                    {product.sizes && product.sizes.length > 1 ? '3' : '2'}
                  </span>
                  <span>{isRTL ? 'الصلصات المفضلة (اختر حتى صلصتين مجاناً)' : 'Sauces au choix (jusqu\'à 2 gratuites)'}</span>
                </h4>
                <span className="text-[11px] text-gray-400">
                  {selectedSauces.length}/2 {isRTL ? 'مختارة' : 'sélectionnée(s)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_SAUCES.map((sauce) => {
                  const isSelected = selectedSauces.includes(sauce.nameFr);
                  const sauceTitle = isRTL ? sauce.nameAr : sauce.nameFr;
                  const sauceSub = isRTL ? sauce.nameFr : sauce.nameAr;

                  return (
                    <button
                      key={sauce.id}
                      onClick={() => toggleSauce(sauce.nameFr)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF6321] text-black border-transparent font-black shadow-[0_2px_10px_rgba(255,99,33,0.3)]'
                          : 'bg-[#1A1A1C] border-white/5 text-gray-300 hover:text-white hover:bg-[#252527]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-tight">
                          {sauceTitle}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-black/80 font-semibold' : 'text-gray-400'
                          }`}
                        >
                          {sauceSub}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-black text-[#FF6321] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: EXTRAS / SUPPLÉMENTS */}
          {product.availableExtras.length > 0 && (
            <div className="px-4 sm:px-6 py-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase font-black text-white tracking-wider flex items-center gap-2 font-heading">
                  <span className="w-5 h-5 rounded-full bg-[#FF6321] text-black text-[11px] font-black flex items-center justify-center">
                    +
                  </span>
                  <span>{isRTL ? 'إضافات ومكملات لذيذة' : 'Suppléments Gourmands'}</span>
                </h4>
                {extrasTotal > 0 && (
                  <span className="text-xs font-black text-[#FF6321]">
                    +{extrasTotal} {config.currency}
                  </span>
                )}
              </div>

              {/* Extras Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.availableExtras.map((extra) => {
                  const currentQty = selectedExtrasMap[extra.id]?.quantity || 0;
                  const extraTitle = isRTL ? extra.nameAr : extra.nameFr;
                  const extraSub = isRTL ? extra.nameFr : extra.nameAr;

                  return (
                    <div
                      key={extra.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        currentQty > 0
                          ? 'bg-[#1A1A1C] border-[#FF6321]/50 shadow-[0_2px_12px_rgba(255,99,33,0.15)]'
                          : 'bg-[#141416] border-white/5'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {extraTitle}
                          </span>
                          <span className="text-[10px] text-gray-500 hidden sm:inline">
                            ({extraSub})
                          </span>
                        </div>
                        <span className="text-xs font-black text-[#FF6321]">
                          +{extra.price} {config.currency}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#0F0F10] border border-white/10 rounded-xl p-1 shrink-0">
                        {currentQty > 0 && (
                          <>
                            <button
                              onClick={() => updateExtraQuantity(extra, -1)}
                              aria-label={`Diminuer ${extraTitle}`}
                              className="w-8 h-8 rounded-lg bg-[#1A1A1C] hover:bg-[#252527] text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-white">
                              {currentQty}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => updateExtraQuantity(extra, 1)}
                          aria-label={`Ajouter ${extraTitle}`}
                          className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            currentQty > 0
                              ? 'w-8 bg-[#FF6321] text-black font-black'
                              : 'px-3 bg-[#252527] hover:bg-[#FF6321] hover:text-black text-white text-xs font-bold gap-1'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          {currentQty === 0 && <span>{isRTL ? 'إضافة' : 'Ajouter'}</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: REMARQUES AU CHEF */}
          <div className="px-4 sm:px-6 py-4 border-t border-white/5">
            <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
              <span>{isRTL ? 'ملاحظات خاصة للمطبخ 👨‍🍳' : 'Remarques pour la cuisine 👨‍🍳'}</span>
            </h4>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder={
                isRTL
                  ? 'مثال: الصلصة في علبة منفصلة، طاكوس مقرمش جيداً، بدون ملح إضافي...'
                  : 'Ex: Sauce à part svp, galette bien croustillante, sans sel...'
              }
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-hidden transition-colors resize-none"
            />
          </div>
        </div>

        {/* BOTTOM BAR / STICKY CTA */}
        <div className="p-4 sm:p-5 bg-[#0F0F10] border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] shrink-0">
          {/* Detailed Price Breakdown */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3 px-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span>{isRTL ? 'الأساسي' : 'Base'} : {basePrice} {config.currency}</span>
              {sizeDelta !== 0 && (
                <span className="text-[#FF6321] font-bold">
                  • {selectedSize?.name} (+{sizeDelta} DA)
                </span>
              )}
              {extrasTotal > 0 && (
                <span className="text-[#FF6321] font-bold">
                  • {isRTL ? 'إضافات' : 'Extras'} (+{extrasTotal} DA)
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] text-gray-400 mr-1">{isRTL ? 'سعر الواحدة:' : 'Unité :'}</span>
              <span className="text-sm sm:text-base font-black text-[#FF6321] font-heading">
                {unitPrice} {config.currency}
              </span>
            </div>
          </div>

          {/* Quantity & Actions Row */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-[#1A1A1C] border border-white/10 rounded-2xl p-1 shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuer la quantité"
                className="w-10 h-10 rounded-xl bg-[#0F0F10] hover:bg-[#252527] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-black text-base text-white font-heading">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Augmenter la quantité"
                className="w-10 h-10 rounded-xl bg-[#0F0F10] hover:bg-[#252527] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Primary Add to Cart Button */}
            <button
              onClick={() => handleAddToCart(false)}
              className="flex-1 py-3.5 px-4 sm:px-5 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-sm sm:text-base shadow-[0_10px_20px_rgba(255,99,33,0.3)] flex items-center justify-between transition-all duration-200 active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                <span>{isRTL ? 'إضافة إلى السلة' : 'Ajouter au panier'}</span>
              </div>
              <div className="bg-black/20 px-2.5 py-1 rounded-lg">
                <span className="text-sm sm:text-base font-black font-heading tracking-wide">
                  {grandTotal} {config.currency}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
