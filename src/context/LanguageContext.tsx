import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const DICTIONARY: Record<string, { fr: string; ar: string }> = {
  // Navigation & Header
  menu: { fr: 'Menu', ar: 'القائمة' },
  cart: { fr: 'Panier', ar: 'السلة' },
  order: { fr: 'Commander', ar: 'اطلب الآن' },
  myOrder: { fr: 'Suivi de commande', ar: 'تتبع طلبي' },
  searchPlaceholder: { fr: 'Rechercher un tacos, burger, boisson...', ar: 'ابحث عن تاكوس، برغر، مشروب...' },
  admin: { fr: 'Espace Restaurant', ar: 'لوحة التحكم' },
  playGame: { fr: 'Jeu Cheneb', ar: 'لعبة شنب تاكوس' },

  // Table QR
  tableNotice: { fr: 'Vous commandez depuis la Table', ar: 'أنت تطلب من الطاولة رقم' },
  changeTable: { fr: 'Changer', ar: 'تغيير' },

  // Categories
  all: { fr: 'Tout le menu', ar: 'جميع الوجبات' },
  tacos: { fr: 'Tacos Français', ar: 'طاكوس فرنسي' },
  burgers: { fr: 'Burgers Smash', ar: 'برغر سماش' },
  sandwiches: { fr: 'Sandwiches & Chawarma', ar: 'سندويتشات وشاورما' },
  pizza: { fr: 'Pizzas Maison', ar: 'بيتزا إيطالية' },
  plats: { fr: 'Plats & Barquettes', ar: 'أطباق وصحون' },
  boissons: { fr: 'Boissons & Jus', ar: 'مشروبات وعصائر' },

  // Product customization
  customize: { fr: 'Personnaliser', ar: 'تخصيص' },
  chooseSize: { fr: '1. Choisissez votre taille', ar: '1. اختر الحجم المناسب' },
  chooseSauces: { fr: '2. Vos sauces au choix', ar: '2. اختر الصلصات المفضلة' },
  freeSauceLimit: { fr: 'Jusqu\'à 2 sauces offertes', ar: 'حتى صلصتين مجانيتين' },
  removeIngredients: { fr: '3. Personnaliser la garniture', ar: '3. تعديل المكونات' },
  removeHelp: { fr: 'Cliquez pour retirer un ingrédient', ar: 'اضغط لاستبعاد أي مكوّن لا ترغب به' },
  inclus: { fr: 'Inclus', ar: 'موجود' },
  sans: { fr: 'Sans', ar: 'بدون' },
  addExtras: { fr: '4. Suppléments & Gourmandises', ar: '4. إضافات لذيذة' },
  kitchenNotes: { fr: '5. Instructions pour le chef', ar: '5. ملاحظات خاصة للمطبخ' },
  addToCart: { fr: 'Ajouter au panier', ar: 'إضافة إلى السلة' },

  // Cart & Checkout
  emptyCart: { fr: 'Votre panier est vide', ar: 'سلتك فارغة حالياً' },
  subtotal: { fr: 'Sous-total', ar: 'المجموع الفرعي' },
  deliveryFee: { fr: 'Frais de livraison', ar: 'توصيل الطلب' },
  total: { fr: 'Total à payer', ar: 'الإجمالي للدفع' },
  checkout: { fr: 'Valider la commande', ar: 'تأكيد وإرسال الطلب' },
  surPlace: { fr: 'Sur place (Table)', ar: 'تناول بالمطعم (طاولة)' },
  aEmporter: { fr: 'À emporter', ar: 'استلام سفري (Emporter)' },
  livraison: { fr: 'Livraison à domicile', ar: 'توصيل للمنزل' },
  fullName: { fr: 'Nom & Prénom', ar: 'الاسم واللقب' },
  phone: { fr: 'Numéro de téléphone', ar: 'رقم الهاتف' },
  address: { fr: 'Quartier / Adresse à El Oued', ar: 'الحي / العنوان بالتفصيل في الوادي' },
  tableNum: { fr: 'Numéro de Table', ar: 'رقم الطاولة' },

  // Order status
  statusReceived: { fr: 'Commande reçue', ar: 'تم استقبال الطلب' },
  statusPreparing: { fr: 'En cours de préparation', ar: 'قيد التحضير في المطبخ' },
  statusReady: { fr: 'Prête à servir !', ar: 'طلبك جاهز وصحة وعافية !' },
  statusCompleted: { fr: 'Terminée', ar: 'مكتملة' },
  statusCancelled: { fr: 'Annulée', ar: 'ملغاة' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cheneb_language') as Language;
      if (saved === 'ar' || saved === 'fr') return saved;
    }
    // Default to French with instant Arabic switch
    return 'fr';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      localStorage.setItem('cheneb_language', language);
    }
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'fr' ? 'ar' : 'fr'));
  };

  const t = (key: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return language === 'ar' ? entry.ar : entry.fr;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
