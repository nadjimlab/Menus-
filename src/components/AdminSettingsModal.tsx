import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { X, Save, RotateCcw, Settings, Check } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { config, updateConfig, resetConfig } = useConfig();

  const [formData, setFormData] = useState({
    whatsappNumber: config.whatsappNumber,
    phone: config.phone,
    deliveryFee: config.deliveryFee,
    currency: config.currency,
    addressFr: config.addressFr,
    addressAr: config.addressAr,
    openingHoursFr: config.openingHoursFr,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      whatsappNumber: formData.whatsappNumber.replace(/\+/g, '').replace(/\s/g, ''),
      phone: formData.phone,
      deliveryFee: Number(formData.deliveryFee) || 0,
      currency: formData.currency,
      addressFr: formData.addressFr,
      addressAr: formData.addressAr,
      openingHoursFr: formData.openingHoursFr,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser les paramètres par défaut ?')) {
      resetConfig();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#0F0F10]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6321] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(255,99,33,0.3)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-white font-heading">
                Paramètres Restaurant (Admin)
              </h2>
              <p className="text-xs text-gray-400">
                Configurez le WhatsApp et les coordonnées du restaurant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Paramètres sauvegardés avec succès !</span>
            </div>
          )}

          {/* WhatsApp number */}
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
              Numéro WhatsApp (Réception des commandes)
            </label>
            <div className="text-[11px] text-gray-400 mb-1.5 font-medium">
              Format international sans le signe + (ex: 213699992626)
            </div>
            <input
              type="text"
              required
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white font-mono focus:outline-hidden"
            />
          </div>

          {/* Contact phone */}
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
              Téléphone d'appel direct
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
            />
          </div>

          {/* Delivery fee & currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                Frais de livraison ({config.currency})
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
                Devise affichée
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
              Adresse physique (Français)
            </label>
            <input
              type="text"
              value={formData.addressFr}
              onChange={(e) => setFormData({ ...formData, addressFr: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
              العنوان بالعربية
            </label>
            <input
              type="text"
              value={formData.addressAr}
              onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white font-sans focus:outline-hidden text-right"
            />
          </div>

          {/* Opening Hours */}
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">
              Horaires d'ouverture
            </label>
            <input
              type="text"
              value={formData.openingHoursFr}
              onChange={(e) => setFormData({ ...formData, openingHoursFr: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1C] border border-white/10 focus:border-[#FF6321] text-xs sm:text-sm text-white focus:outline-hidden"
            />
          </div>

          {/* Save & Reset buttons */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 p-2 rounded-lg hover:bg-[#1A1A1C] transition-colors cursor-pointer font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Valeurs d'origine</span>
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_15px_rgba(255,99,33,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
