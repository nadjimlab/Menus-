import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { useLanguage } from '../context/LanguageContext';
import { UtensilsCrossed, X, Check, Edit3 } from 'lucide-react';

export const TableBanner: React.FC = () => {
  const { tableNumber, setTableNumber } = useOrders();
  const { isRTL } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [newTable, setNewTable] = useState('');

  if (!tableNumber && !isEditing) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTable.trim()) {
      setTableNumber(newTable.trim());
      setIsEditing(false);
      setNewTable('');
    }
  };

  return (
    <div className="bg-linear-to-r from-[#FF6321] via-orange-500 to-[#FF6321] text-black px-4 py-2 text-xs font-black shadow-lg relative z-30 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black/15 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-black" />
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-2">
              <span className="text-black font-extrabold">Table N°:</span>
              <input
                type="number"
                min="1"
                max="50"
                autoFocus
                placeholder="Ex: 5"
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
                className="w-16 px-2 py-0.5 rounded-lg bg-white text-black text-xs font-bold focus:outline-hidden"
              />
              <button
                type="submit"
                className="p-1 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg bg-black/20 text-black hover:bg-black/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 font-heading tracking-tight">
              <span>
                {isRTL
                  ? `أنت تطلب من الطاولة رقم ${tableNumber} 🍽️`
                  : `Vous commandez depuis la Table N° ${tableNumber} 🍽️`}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-sans opacity-80">
                {isRTL
                  ? '(سيتم تحضير الطلب وتقديمه لطاولتك مباشرة)'
                  : '(Votre commande sera servie directement à votre table)'}
              </span>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewTable(tableNumber || '');
                setIsEditing(true);
              }}
              className="px-2 py-0.5 rounded-lg bg-black/15 hover:bg-black/25 text-black text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isRTL ? 'تعديل' : 'Changer'}</span>
            </button>

            <button
              onClick={() => setTableNumber(null)}
              title="Quitter le mode table"
              className="p-1 rounded-lg bg-black/15 hover:bg-black/25 text-black transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
