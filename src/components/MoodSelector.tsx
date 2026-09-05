import React, { useState } from 'react';
import { MOOD_FILTERS } from '../data/menuData';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';

interface MoodSelectorProps {
  selectedMoodId: string | null;
  onSelectMood: (moodId: string | null) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMoodId,
  onSelectMood,
}) => {
  const { isRTL } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeMood = MOOD_FILTERS.find((m) => m.id === selectedMoodId);

  return (
    <div className="mb-5 p-3 sm:p-4 rounded-2xl bg-[#0F0F10] border border-white/5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-[#FF6321]/15 text-[#FF6321] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white font-heading">
                {isRTL ? 'ماذا تشتهي اليوم؟' : "Envie d'un plat spécifique ?"}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
              )}
            </div>
            {!isExpanded && activeMood && (
              <span className="text-[11px] text-[#FF6321] font-bold">
                {isRTL ? `المحدد: ${activeMood.labelAr}` : `Filtre actif : ${activeMood.labelFr}`}
              </span>
            )}
          </div>
        </button>

        {selectedMoodId && (
          <button
            onClick={() => onSelectMood(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1A1A1C] text-gray-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-[#FF6321]" />
            <span>{isRTL ? 'إلغاء' : 'Effacer'}</span>
          </button>
        )}
      </div>

      {/* Mood Options */}
      <div className={`mt-3 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar ${isExpanded ? 'flex' : 'hidden sm:flex'}`}>
        {MOOD_FILTERS.map((mood) => {
          const isActive = selectedMoodId === mood.id;
          const label = isRTL ? mood.labelAr : mood.labelFr;
          return (
            <button
              key={mood.id}
              onClick={() => onSelectMood(isActive ? null : mood.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#FF6321] text-black shadow-[0_2px_10px_rgba(255,99,33,0.3)] scale-102 font-black'
                  : 'bg-[#1A1A1C] text-gray-300 hover:text-white hover:bg-[#252527] border border-white/5'
              }`}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
