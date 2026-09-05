import React, { useRef } from 'react';
import { CATEGORIES } from '../data/menuData';
import { CategoryId } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CategoryNavProps {
  activeCategory: CategoryId;
  onSelectCategory: (categoryId: CategoryId) => void;
  categoryCounts: Record<CategoryId, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const { isRTL } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCategoryEmoji = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return '✨';
      case 'Flame':
        return '🌮';
      case 'Utensils':
        return '🍔';
      case 'Sandwich':
        return '🌯';
      case 'Pizza':
        return '🍕';
      case 'ChefHat':
        return '🍽️';
      case 'CupSoda':
        return '🥤';
      default:
        return '🍽️';
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-16 z-25 bg-[#0A0A0B]/95 backdrop-blur-md py-2.5 mb-6 border-b border-white/5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Scroll Arrows for Desktop */}
      <button
        onClick={() => scroll('left')}
        aria-label="Défiler vers la gauche"
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1A1A1C] border border-white/10 text-gray-300 hover:text-white items-center justify-center shadow-lg transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => scroll('right')}
        aria-label="Défiler vers la droite"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1A1A1C] border border-white/10 text-gray-300 hover:text-white items-center justify-center shadow-lg transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Categories Row */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar px-1 scroll-smooth"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id as CategoryId] ?? cat.count;
          const primaryName = isRTL ? cat.nameAr : cat.nameFr;
          const secondaryName = isRTL ? cat.nameFr : cat.nameAr;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as CategoryId)}
              className={`shrink-0 group flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#FF6321] text-black shadow-[0_4px_15px_rgba(255,99,33,0.35)] scale-102'
                  : 'bg-[#1A1A1C] text-white hover:bg-[#252527] hover:border-white/10 border border-white/5'
              }`}
            >
              <span className="text-sm">{getCategoryEmoji(cat.icon)}</span>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-heading font-black">{primaryName}</span>
                <span
                  className={`text-[10px] hidden sm:inline ${
                    isActive ? 'text-black/70 font-bold' : 'text-gray-400 font-medium'
                  }`}
                >
                  ({secondaryName})
                </span>
              </div>
              <span
                className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
