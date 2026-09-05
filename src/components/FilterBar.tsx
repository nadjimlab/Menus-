import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export type SubFilterType = 'all' | 'popular' | 'new' | 'chicken' | 'meat' | 'cheese' | 'spicy' | 'budget';

interface FilterBarProps {
  activeFilter: SubFilterType;
  onSelectFilter: (filter: SubFilterType) => void;
  resultCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onSelectFilter,
  resultCount,
}) => {
  const { isRTL } = useLanguage();

  const filters: { id: SubFilterType; labelFr: string; labelAr: string }[] = [
    { id: 'all', labelFr: 'Tous', labelAr: 'الكل' },
    { id: 'popular', labelFr: '🔥 Populaires', labelAr: '🔥 الأكثر طلباً' },
    { id: 'new', labelFr: '✨ Nouveaux', labelAr: '✨ جديد' },
    { id: 'chicken', labelFr: '🍗 Poulet', labelAr: '🍗 دجاج' },
    { id: 'meat', labelFr: '🥩 Viande Hachée', labelAr: '🥩 لحم مفروم' },
    { id: 'cheese', labelFr: '🧀 Fromage', labelAr: '🧀 عشاق الجبن' },
    { id: 'spicy', labelFr: '🌶️ Épicé', labelAr: '🌶️ حار' },
    { id: 'budget', labelFr: '💰 Budget', labelAr: '💰 اقتصادي' },
  ];

  return (
    <div className="flex items-center justify-between gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-2 shrink-0">
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          const label = isRTL ? f.labelAr : f.labelFr;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#FF6321] text-black shadow-[0_2px_10px_rgba(255,99,33,0.3)] font-black uppercase tracking-wider'
                  : 'bg-[#1A1A1C] text-gray-400 hover:text-white hover:bg-[#252527] border border-white/5'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {resultCount !== undefined && (
        <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-bold shrink-0 hidden sm:inline">
          {resultCount} {isRTL ? 'وجبة' : resultCount > 1 ? 'plats trouvés' : 'plat trouvé'}
        </span>
      )}
    </div>
  );
};
