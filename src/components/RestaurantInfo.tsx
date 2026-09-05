import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { MustacheLogo } from './MustacheLogo';
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Instagram,
  Facebook,
  ExternalLink,
  Navigation,
  ShieldCheck,
} from 'lucide-react';

export const RestaurantInfo: React.FC = () => {
  const { config } = useConfig();
  const { isRTL } = useLanguage();

  return (
    <section id="contact-section" className="py-16 sm:py-24 bg-[#0A0A0B] border-t border-white/5 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF6321] blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1A1C] border border-white/10 text-[#FF6321] text-xs font-black uppercase tracking-wider mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
            <span>{isRTL ? 'موقعنا في الوادي' : 'Retrouvez-nous à El Oued'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white font-heading mb-3">
            {isRTL ? (
              <>شنب طاكوس <span className="text-[#FF6321]">يرحب بكم دائماً</span></>
            ) : (
              <>CHENEB TACOS <span className="text-[#FF6321]">vous accueille</span></>
            )}
          </h2>
          <p className="text-sm text-gray-400">
            {isRTL
              ? 'في المطعم، أو استلام باليد، أو عبر خدمة توصيل سريعة لكافة أحياء مدينة الوادي.'
              : "Sur place, à emporter ou en livraison rapide à travers toute la ville d'El Oued."}
          </p>
        </div>

        {/* 3 Main Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {/* Card 1: Téléphone & WhatsApp */}
          <div className="p-6 rounded-3xl bg-[#1A1A1C] border border-white/5 flex flex-col justify-between space-y-5 hover:border-[#FF6321]/40 transition-colors">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6321]/15 flex items-center justify-center text-[#FF6321]">
                <Phone className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tight text-white font-heading">
                  {isRTL ? 'الطلبات المباشرة' : 'Commandes Directes'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isRTL
                    ? 'اتصل مباشرة بفريقنا أو اطلب على واتساب بسرعة وسهولة.'
                    : 'Appelez directement notre équipe pour passer commande ou demander des renseignements.'}
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={`tel:${config.phone}`}
                  className="text-2xl font-black text-[#FF6321] font-heading tracking-wide hover:underline block"
                >
                  {config.phone}
                </a>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-white/5">
              <a
                href={`https://wa.me/${config.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-3 rounded-xl bg-[#252527] hover:bg-[#FF6321] hover:text-black border border-white/5 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#FF6321]" />
                <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
              </a>
              <a
                href={`tel:${config.phone}`}
                className="flex-1 py-3 px-3 rounded-xl bg-[#252527] hover:bg-white hover:text-black border border-white/5 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#FF6321]" />
                <span>{isRTL ? 'اتصال هاتفي' : 'Appeler'}</span>
              </a>
            </div>
          </div>

          {/* Card 2: Adresse & Google Maps */}
          <div className="p-6 rounded-3xl bg-[#1A1A1C] border border-white/5 flex flex-col justify-between space-y-5 hover:border-[#FF6321]/40 transition-colors">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6321]/15 flex items-center justify-center text-[#FF6321]">
                <MapPin className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tight text-white font-heading">
                  {isRTL ? 'موقع المطعم' : 'Localisation du Restaurant'}
                </h3>
                <p className="text-sm font-bold text-gray-200 mt-1">
                  {isRTL ? config.addressAr : config.addressFr}
                </p>
                <p className="text-xs text-[#FF6321] font-bold mt-0.5">
                  {isRTL ? config.addressFr : config.addressAr}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-semibold">{config.wilaya}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <a
                href={config.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,99,33,0.3)] transition-all"
              >
                <Navigation className="w-4 h-4 stroke-[2.5]" />
                <span>{isRTL ? 'الاتجاه عبر خرائط جوجل' : 'Itinéraire Google Maps'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 3: Horaires & Qualité */}
          <div className="p-6 rounded-3xl bg-[#1A1A1C] border border-white/5 flex flex-col justify-between space-y-5 hover:border-[#FF6321]/40 transition-colors">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6321]/15 flex items-center justify-center text-[#FF6321]">
                <Clock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tight text-white font-heading">
                  {isRTL ? 'أوقات العمل' : "Horaires d'Ouverture"}
                </h3>
                <p className="text-sm font-bold text-gray-200 mt-1">
                  {isRTL ? config.openingHoursAr : config.openingHoursFr}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-semibold">
                  {isRTL ? config.openingHoursFr : config.openingHoursAr}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-[#FF6321] font-bold">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>{isRTL ? 'لحوم حلال 100% وطازجة يومياً' : 'Viandes 100% Halal & Fraîches'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-around">
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-bold"
              >
                <Instagram className="w-4 h-4 text-[#FF6321]" />
                <span>Instagram</span>
              </a>
              <span className="text-gray-700">•</span>
              <a
                href={config.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-bold"
              >
                <Facebook className="w-4 h-4 text-[#FF6321]" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Concept Story Banner */}
        <div id="concept-section" className="p-6 sm:p-8 rounded-3xl bg-[#0F0F10] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <MustacheLogo size="lg" showText={false} />
            <div>
              <h4 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white font-heading">
                {isRTL ? 'شنب طاكوس.. أصل الطاكوس الفرنسي في الوادي' : 'La Marque du Vrai Tacos à El Oued'}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mt-1">
                {isRTL
                  ? 'في شنب طاكوس، نحضّر كل فطيرة حسب التقاليد الحقيقية: صلصة جبن محضرة صباح كل يوم، بطاطس مقرمشة ولحوم طازجة متبلة بعناية فائقة.'
                  : 'Chez CHENEB TACOS, nous préparons chaque galette selon la véritable tradition du French Tacos : sauce fromagère mijotée chaque matin, frites croustillantes et viandes marinées avec soin.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-[#1A1A1C] border border-white/5 text-center">
              <div className="text-2xl font-black text-[#FF6321] font-heading">100%</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                {isRTL ? 'طازج وحلال' : 'Frais & Halal'}
              </div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#1A1A1C] border border-white/5 text-center">
              <div className="text-2xl font-black text-[#FF6321] font-heading">7j/7</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                {isRTL ? 'طيلة الأسبوع' : 'Non Stop'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
