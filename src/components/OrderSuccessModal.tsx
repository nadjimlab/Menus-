import React, { useState } from 'react';
import { CheckCircle, Copy, Check, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderMessage: string;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  orderMessage,
  onClose,
}) => {
  const { config } = useConfig();
  const { isRTL } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReopenWhatsApp = () => {
    const encoded = encodeURIComponent(orderMessage);
    window.open(`https://wa.me/${config.whatsappNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Celebration icon */}
        <div className="w-16 h-16 rounded-full bg-[#FF6321]/15 border-2 border-[#FF6321]/40 text-[#FF6321] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,99,33,0.3)]">
          <CheckCircle className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white font-heading">
            {isRTL ? 'تم تجهيز طلبك بنجاح !' : 'Commande Transmise avec Succès !'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {isRTL
              ? 'تم فتح تطبيق واتساب لإرسال الطلب. فريق شنب طاكوس سيؤكد طلبك ووقت التجهيز فوراً.'
              : "Votre commande a été préparée pour WhatsApp. L'équipe de CHENEB TACOS va vous confirmer la réception et le délai."}
          </p>
        </div>

        {/* Message preview block */}
        <div className="p-3.5 rounded-2xl bg-[#1A1A1C] border border-white/5 text-left text-xs text-gray-300 max-h-36 overflow-y-auto no-scrollbar font-mono whitespace-pre-wrap">
          {orderMessage}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleReopenWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,99,33,0.3)] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{isRTL ? 'إعادة فتح واتساب' : 'Réouvrir WhatsApp'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isRTL ? 'تم نسخ النص !' : 'Message copié !') : (isRTL ? 'نسخ نص الطلب' : 'Copier le texte de commande')}</span>
          </button>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${config.phone}`}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>{isRTL ? 'اتصال بالمطعم' : 'Appeler resto'}</span>
            </a>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-[#252527] hover:bg-[#303033] border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{isRTL ? 'الرجوع للقائمة' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
