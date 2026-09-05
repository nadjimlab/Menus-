import React, { useState } from 'react';
import { Product } from '../types';
import { useConfig } from '../context/ConfigContext';
import { X, Copy, Check, MessageCircle, Facebook, Share2 } from 'lucide-react';

interface ShareModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { config } = useConfig();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Découvrez ${product.nameFr} (${product.basePrice} ${config.currency}) chez CHENEB TACOS ! 🌮🔥`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText}\n${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(currentUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#0A0A0B] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6321]/15 text-[#FF6321] flex items-center justify-center">
              <Share2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black italic uppercase tracking-tight text-white font-heading">
              Partager ce délice
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-[#1A1A1C] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product snapshot */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1A1A1C] border border-white/5">
          <img
            src={product.image}
            alt={product.nameFr}
            className="w-14 h-14 rounded-xl object-cover border border-white/5 shrink-0 bg-[#0F0F10]"
          />
          <div>
            <h4 className="text-sm font-black text-white font-heading truncate">
              {product.nameFr}
            </h4>
            <p className="text-xs text-[#FF6321] font-bold font-sans">
              {product.nameAr}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 font-bold">
              {product.basePrice} {config.currency}
            </p>
          </div>
        </div>

        {/* Sharing options */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 rounded-2xl bg-[#252527] hover:bg-[#FF6321] hover:text-black border border-white/5 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#FF6321]" />
            <span>Partager sur WhatsApp</span>
          </button>

          <button
            onClick={handleFacebookShare}
            className="w-full py-3 px-4 rounded-2xl bg-[#252527] hover:bg-blue-600 hover:text-white border border-white/5 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Facebook className="w-4 h-4 text-blue-400" />
            <span>Partager sur Facebook</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-2xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Lien copié !' : 'Copier le lien direct'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
