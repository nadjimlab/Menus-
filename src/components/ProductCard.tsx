import React, { useState } from 'react';
import { Product } from '../types';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Sliders, Plus, Share2, Flame, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onCustomize: (product: Product) => void;
  onShare: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onCustomize,
  onShare,
}) => {
  const { config } = useConfig();
  const { addToCart } = useCart();
  const { isRTL, language } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const hasMultipleSizes = product.sizes && product.sizes.length > 1;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSauce =
      product.categoryId === 'tacos'
        ? ['Sauce Fromagère Maison', 'Sauce Algérienne']
        : product.categoryId === 'burgers'
        ? ['Sauce Burger Biggy']
        : [];

    addToCart(
      product,
      {
        selectedSize: product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined,
        removedIngredientIds: [],
        selectedSauces: defaultSauce,
        selectedExtras: [],
      },
      1
    );
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Best Seller':
      case 'Populaire':
        return 'bg-[#FF6321] text-black font-black shadow-[0_2px_8px_rgba(255,99,33,0.4)]';
      case 'Nouveau':
        return 'bg-emerald-500 text-black font-black shadow-[0_2px_8px_rgba(16,185,129,0.3)]';
      case 'Maxi Format':
        return 'bg-purple-600 text-white font-black';
      default:
        return 'bg-[#1A1A1C] text-[#FF6321] border border-[#FF6321]/40 font-bold';
    }
  };

  const getBadgeLabel = (badge: string) => {
    if (language !== 'ar') return badge;
    switch (badge) {
      case 'Best Seller':
      case 'Populaire':
        return 'الأكثر طلباً 🔥';
      case 'Nouveau':
        return 'جديد ✨';
      case 'Maxi Format':
        return 'حجم ماكسي';
      case 'Spicy 🌶️':
        return 'حار 🌶️';
      default:
        return badge;
    }
  };

  const displayName = isRTL ? product.nameAr : product.nameFr;
  const secondaryName = isRTL ? product.nameFr : product.nameAr;
  const displayDesc = isRTL && product.descriptionAr ? product.descriptionAr : product.descriptionFr;

  return (
    <div
      onClick={() => onCustomize(product)}
      className="group relative flex flex-col bg-[#1A1A1C] hover:bg-[#202023] rounded-3xl overflow-hidden border border-white/5 hover:border-[#FF6321]/40 transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer"
    >
      {/* Food Photography Container */}
      <div className="relative w-full aspect-16/10 overflow-hidden bg-[#0A0A0B]">
        <img
          src={
            imgError
              ? 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop'
              : product.image
          }
          alt={displayName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-[#1A1A1C] via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges & Share Row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {product.badge ? (
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider pointer-events-auto backdrop-blur-md flex items-center gap-1 ${getBadgeStyle(
                product.badge
              )}`}
            >
              {product.badge === 'Best Seller' && <Flame className="w-3 h-3 fill-current" />}
              {product.badge === 'Nouveau' && <Sparkles className="w-3 h-3" />}
              <span>{getBadgeLabel(product.badge)}</span>
            </span>
          ) : (
            <div />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(product);
            }}
            title={isRTL ? 'مشاركة هذه الوجبة' : 'Partager ce plat'}
            aria-label={`Partager ${displayName}`}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 hover:text-black hover:bg-[#FF6321] transition-colors flex items-center justify-center pointer-events-auto shadow-md cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Available Sizes Tag overlay */}
        {hasMultipleSizes && (
          <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-bold text-gray-300">
            {product.sizes?.map((s) => s.name).join(' • ')}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Title & Secondary name */}
        <div className="mb-1.5">
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#FF6321] transition-colors font-heading leading-tight">
            {displayName}
          </h3>
          <p className="text-xs font-bold text-[#FF6321] mt-0.5">
            {secondaryName}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3 flex-1">
          {displayDesc}
        </p>

        {/* Ingredients Quick Snapshot */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.defaultIngredients.slice(0, 3).map((ing) => (
            <span
              key={ing.id}
              className="px-2 py-0.5 rounded-md bg-[#0F0F10] border border-white/5 text-[10px] font-medium text-gray-400"
            >
              {isRTL ? ing.nameAr : ing.nameFr}
            </span>
          ))}
          {product.defaultIngredients.length > 3 && (
            <span className="text-[10px] text-gray-500 self-center">
              +{product.defaultIngredients.length - 3}
            </span>
          )}
        </div>

        {/* Price & Actions Bottom Bar */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 block leading-none mb-0.5">
              {hasMultipleSizes ? (isRTL ? 'ابتداءً من' : 'Dès') : (isRTL ? 'السعر' : 'Prix')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[#FF6321] font-heading">
                {product.basePrice}
              </span>
              <span className="text-xs font-bold text-gray-400">{config.currency}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Button */}
            <button
              onClick={handleQuickAdd}
              title={isRTL ? 'إضافة سريعة إلى السلة' : 'Ajout rapide classique'}
              aria-label="Ajout rapide au panier"
              className="w-9 h-9 rounded-xl bg-[#0F0F10] hover:bg-[#FF6321] hover:text-black border border-white/10 text-gray-200 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Customization Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCustomize(product);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6321] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-[0_2px_10px_rgba(255,99,33,0.3)] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isRTL ? 'تخصيص' : 'Personnaliser'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
