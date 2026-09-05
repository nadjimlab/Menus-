import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/menuData';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, X, Sliders } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { config } = useConfig();
  const { isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  const filteredProducts = PRODUCTS.filter((p) => {
    if (!normalizedQuery) return false;

    const matchNameFr = p.nameFr.toLowerCase().includes(normalizedQuery);
    const matchNameAr = p.nameAr.toLowerCase().includes(normalizedQuery);
    const matchDescFr = p.descriptionFr.toLowerCase().includes(normalizedQuery);
    const matchDescAr = p.descriptionAr ? p.descriptionAr.toLowerCase().includes(normalizedQuery) : false;
    const matchCat = p.categoryId.toLowerCase().includes(normalizedQuery);
    const matchIngredients = p.defaultIngredients.some(
      (ing) =>
        ing.nameFr.toLowerCase().includes(normalizedQuery) ||
        ing.nameAr.toLowerCase().includes(normalizedQuery)
    );

    return matchNameFr || matchNameAr || matchDescFr || matchDescAr || matchCat || matchIngredients;
  });

  const popularKeywords = isRTL
    ? ['طاكوس', 'شاورما', 'دجاج', 'لحم مفروم', 'شيدر', 'برغر', 'بيتزا']
    : ['Tacos', 'Shawarma', 'Poulet', 'Viande Hachée', 'Cheddar', 'Burger', 'Pizza'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
      >
        {/* Search input header */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-[#0F0F10]">
          <Search className="w-5 h-5 text-[#FF6321] shrink-0 stroke-[2.5]" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isRTL
                ? 'ماذا تشتهي اليوم؟ (طاكوس، دجاج، شيدر، برغر...)'
                : 'Que voulez-vous manger ? (Tacos, Poulet, Cheddar...)'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-gray-500 focus:outline-hidden font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#1A1A1C]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1A1C] text-gray-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick keywords chips */}
        {!query && (
          <div className="p-4 border-b border-white/5 bg-[#0A0A0B]">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2.5">
              {isRTL ? 'عمليات البحث الأكثر طلباً' : 'Recherches fréquentes'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setQuery(kw)}
                  className="px-3 py-1.5 rounded-full bg-[#1A1A1C] hover:bg-[#252527] hover:text-[#FF6321] text-xs font-bold text-gray-300 border border-white/5 transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {query && filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              <p className="font-bold text-white mb-1">{isRTL ? 'لم يتم العثور على أي وجبة' : 'Aucun plat trouvé'}</p>
              <p className="text-xs text-gray-400">
                {isRTL
                  ? 'جرّب كتابة مكوّن آخر أو تصفح الأقسام مباشرة من القائمة.'
                  : 'Essayez avec un autre ingrédient ou parcourez les catégories du menu.'}
              </p>
            </div>
          ) : query ? (
            filteredProducts.map((prod) => {
              const displayName = isRTL ? prod.nameAr : prod.nameFr;
              const secondaryName = isRTL ? prod.nameFr : prod.nameAr;
              const ingredientsList = prod.defaultIngredients
                .map((i) => (isRTL ? i.nameAr : i.nameFr))
                .join(', ');

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/5 hover:border-[#FF6321]/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.image}
                      alt={displayName}
                      className="w-14 h-14 rounded-xl object-cover border border-white/5 shrink-0 bg-[#0F0F10]"
                    />
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-[#FF6321] transition-colors font-heading">
                        {displayName}
                      </h4>
                      <p className="text-xs text-[#FF6321] font-bold">
                        {secondaryName}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {ingredientsList}
                      </p>
                    </div>
                  </div>

                  <div className={`text-${isRTL ? 'left pr-3' : 'right pl-3'} shrink-0`}>
                    <span className="text-sm font-black text-[#FF6321] font-heading block">
                      {prod.basePrice} {config.currency}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center justify-end gap-1 mt-1 group-hover:text-white font-bold">
                      <Sliders className="w-3 h-3 text-[#FF6321]" />
                      <span>{isRTL ? 'تخصيص' : 'Choisir'}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs font-medium">
              {isRTL
                ? 'اكتب اسم أي ساندويتش، طاكوس، برغر أو بيتزا للبحث المباشر.'
                : "Tapez un ingrédient ou le nom d'un sandwich, tacos, burger ou pizza pour afficher les options."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
