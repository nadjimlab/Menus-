import React from 'react';
import { ArrowRight, Sparkles, Flame, Clock, MapPin, MessageCircle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { MustacheLogo } from './MustacheLogo';

interface HeroProps {
  onExploreMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu }) => {
  const { config } = useConfig();
  const { isRTL } = useLanguage();

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(
      isRTL
        ? "السلام عليكم شنب تاكوس ! أريد الاطلاع على القائمة وطلب وجبة."
        : "Bonjour CHENEB TACOS ! Je souhaite voir la carte et passer une commande."
    );
    window.open(`https://wa.me/${config.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <section id="hero" className="relative pt-24 pb-14 md:pt-32 md:pb-20 overflow-hidden bg-[#0A0A0B]">
      {/* Background Decorative Immersive Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#FF6321] blur-[140px] opacity-15 pointer-events-none -z-10" />
      <div className="absolute -top-20 right-10 w-80 h-80 bg-[#FF6321] blur-[120px] opacity-10 pointer-events-none -z-10" />

      {/* Decorative Watermark */}
      <div className="absolute top-24 right-4 opacity-25 select-none pointer-events-none hidden xl:block -z-10">
        <span className="text-[160px] font-black italic tracking-tighter text-white/5 block leading-none">
          CHENEB
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Top Brand Micro-Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1A1C] border border-white/10 text-[#FF6321] text-xs font-black uppercase tracking-wider mb-6 backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-[#FF6321] fill-current" />
              <span>{isRTL ? 'قائمة تفاعلية ذكية • الوادي' : 'Menu Digital Interactif • El Oued'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white">
              {isRTL ? (
                <>
                  المذاق الحقيقي للـ <br className="hidden sm:inline" />
                  <span className="text-[#FF6321]">طاكوس الفرنسي الأصلي</span>
                </>
              ) : (
                <>
                  Le Vrai Goût du <br className="hidden sm:inline" />
                  <span className="text-[#FF6321]">Tacos Français</span>
                </>
              )}
            </h1>

            {/* Signature Tagline */}
            <div className="text-lg sm:text-xl font-black text-[#FF6321] mb-4 tracking-wide font-sans">
              {isRTL ? 'الأصالة والبنة عند الشنب 🌮🔥' : 'L\'authenticité & la gourmandise chez CHENEB 🌮🔥'}
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-400 max-w-xl mb-8 leading-relaxed">
              {isRTL
                ? 'خصص وجبتك بدقة متناهية: احذف ما لا ترغب به، اختر صلصاتك المفضلة وإضافاتك الشهية واطلب بضغطة زر مباشرة عبر الواتساب.'
                : 'Personnalisez votre tacos, burger ou plat selon vos envies exactes. Retirez ce que vous n\'aimez pas, ajoutez vos suppléments préférés et commandez en un clic directement sur WhatsApp.'}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-10">
              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6321] text-black font-black uppercase tracking-tighter text-base shadow-[0_10px_25px_rgba(255,99,33,0.35)] flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <span>{isRTL ? 'تصفح القائمة الكاملة' : 'Découvrir le Menu'}</span>
                <ArrowRight className={`w-4 h-4 stroke-[3] ${isRTL ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={openWhatsAppDirect}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-[#FF6321]" />
                <span>{isRTL ? 'طلب سريع عبر الواتساب' : 'Commander sur WhatsApp'}</span>
              </button>
            </div>

            {/* Quick Badges Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg border-t border-white/5 pt-6">
              <div className="flex items-center gap-2.5 text-left p-2 rounded-xl bg-[#1A1A1C]/60 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#FF6321]/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#FF6321]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white">
                    {isRTL ? '100% حسب ذوقك' : '100% Sur Mesure'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {isRTL ? 'مكونات على اختيارك' : 'Ingrédients au choix'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-left p-2 rounded-xl bg-[#1A1A1C]/60 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#FF6321]/15 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#FF6321]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white">
                    {isRTL ? 'خدمة 7/7 أيام' : 'Service 7j/7'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {isRTL ? config.openingHoursAr : config.openingHoursFr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-left col-span-2 sm:col-span-1 p-2 rounded-xl bg-[#1A1A1C]/60 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#FF6321]/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#FF6321]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white">
                    {config.wilaya}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {isRTL ? 'حي الرمال - الوادي' : 'Hay Erremal'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="absolute inset-0 bg-[#FF6321] blur-3xl opacity-20 -z-10 scale-95" />

            <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10 bg-[#1A1A1C] shadow-2xl p-3 sm:p-4 backdrop-blur-md">
              <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1000&auto=format&fit=crop"
                  alt="Tacos Français Chaud et Croustillant CHENEB TACOS"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0A0A0B] via-[#0A0A0B]/30 to-transparent" />

                {/* Floating Badge Top Right */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#FF6321] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_12px_rgba(255,99,33,0.4)]">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>{isRTL ? 'الأكثر تميزاً' : 'SIGNATURE CHENEB'}</span>
                </div>

                {/* Bottom Overlay Card */}
                <div className="absolute bottom-3 left-3 right-3 p-4 rounded-2xl bg-[#0F0F10]/95 backdrop-blur-md border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MustacheLogo size="sm" showText={false} />
                        <span className="text-base font-black italic tracking-tight text-white font-heading">
                          {isRTL ? 'طاكوس شاورما دجاج XL' : 'Tacos Shawarma XL'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isRTL ? 'صلصة جبنية خاصة + بطاطس مقرمشة' : 'Sauce fromagère maison + frites'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#FF6321] font-heading block">
                        600 {config.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
