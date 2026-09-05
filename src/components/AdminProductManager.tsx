import React, { useState } from 'react';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { Product, CategoryId, ProductBadge, SizeOption } from '../types';
import { CATEGORIES } from '../data/menuData';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Flame,
  Tag,
  DollarSign,
  Layers,
  Utensils,
  Eye,
  EyeOff,
} from 'lucide-react';

const BADGE_OPTIONS: (ProductBadge | '')[] = [
  '',
  'Populaire',
  'Nouveau',
  'Best Seller',
  'Spicy 🌶️',
  'Maxi Format',
];

export const AdminProductManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, toggleProductAvailability, resetToDefaultProducts } = useProducts();
  const { isRTL } = useLanguage();
  const { config } = useConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    nameFr: string;
    nameAr: string;
    categoryId: CategoryId;
    basePrice: number;
    descriptionFr: string;
    descriptionAr: string;
    image: string;
    badge: ProductBadge | '';
    isPopular: boolean;
    isNew: boolean;
    isSpicy: boolean;
    isCheeseLover: boolean;
    hasChicken: boolean;
    hasMeat: boolean;
    available: boolean;
    hasSizes: boolean;
  }>({
    nameFr: '',
    nameAr: '',
    categoryId: 'tacos',
    basePrice: 500,
    descriptionFr: '',
    descriptionAr: '',
    image: '',
    badge: '',
    isPopular: false,
    isNew: true,
    isSpicy: false,
    isCheeseLover: false,
    hasChicken: false,
    hasMeat: false,
    available: true,
    hasSizes: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open form for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      nameFr: '',
      nameAr: '',
      categoryId: selectedCategory !== 'all' ? (selectedCategory as CategoryId) : 'tacos',
      basePrice: 500,
      descriptionFr: '',
      descriptionAr: '',
      image: '',
      badge: 'Nouveau',
      isPopular: false,
      isNew: true,
      isSpicy: false,
      isCheeseLover: false,
      hasChicken: false,
      hasMeat: false,
      available: true,
      hasSizes: false,
    });
    setIsFormOpen(true);
  };

  // Open form for Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nameFr: product.nameFr,
      nameAr: product.nameAr,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      descriptionFr: product.descriptionFr || '',
      descriptionAr: product.descriptionAr || '',
      image: product.image,
      badge: product.badge || '',
      isPopular: !!product.isPopular,
      isNew: !!product.isNew,
      isSpicy: !!product.isSpicy,
      isCheeseLover: !!product.isCheeseLover,
      hasChicken: !!product.hasChicken,
      hasMeat: !!product.hasMeat,
      available: product.available,
      hasSizes: !!(product.sizes && product.sizes.length > 0),
    });
    setIsFormOpen(true);
  };

  // Handle submit (Create or Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameFr.trim() || !formData.nameAr.trim()) {
      showToast(isRTL ? 'يرجى إدخال اسم المنتج بالعربية والفرنسية' : 'Veuillez saisir le nom en français et arabe');
      return;
    }

    if (formData.basePrice <= 0) {
      showToast(isRTL ? 'يرجى إدخال سعر صحيح للمنتج' : 'Veuillez saisir un prix valide');
      return;
    }

    if (!formData.image.trim()) {
      showToast(isRTL ? 'يرجى رفع صورة حقيقية للمنتج أو التقاطها بالكاميرا' : 'Veuillez ajouter une vraie photo du produit');
      return;
    }

    // Default sizes generator if sizes enabled
    let sizes: SizeOption[] | undefined = undefined;
    if (formData.hasSizes) {
      if (editingProduct?.sizes && editingProduct.sizes.length > 0) {
        sizes = editingProduct.sizes;
      } else {
        sizes = [
          { id: 'size-standard', name: 'Standard', label: 'Taille Standard', priceDelta: 0 },
          { id: 'size-maxi', name: 'Maxi', label: 'Taille Maxi / XL', priceDelta: 150 },
          { id: 'size-mega', name: 'Mega', label: 'Taille Mega / XXL', priceDelta: 300 },
        ];
      }
    }

    const payload = {
      nameFr: formData.nameFr.trim(),
      nameAr: formData.nameAr.trim(),
      categoryId: formData.categoryId,
      basePrice: Number(formData.basePrice),
      descriptionFr: formData.descriptionFr.trim(),
      descriptionAr: formData.descriptionAr.trim(),
      image: formData.image.trim(),
      badge: (formData.badge as ProductBadge) || undefined,
      isPopular: formData.isPopular,
      isNew: formData.isNew,
      isSpicy: formData.isSpicy,
      isCheeseLover: formData.isCheeseLover,
      hasChicken: formData.hasChicken,
      hasMeat: formData.hasMeat,
      available: formData.available,
      sizes,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      showToast(isRTL ? `تم تحديث «${payload.nameAr}» بنجاح !` : `Produit «${payload.nameFr}» mis à jour !`);
    } else {
      addProduct({
        ...payload,
        defaultIngredients: [],
        availableExtras: [],
      });
      showToast(isRTL ? `تمت إضافة «${payload.nameAr}» إلى القائمة بنجاح !` : `Nouveau produit «${payload.nameFr}» ajouté !`);
    }

    setIsFormOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    showToast(isRTL ? `تم حذف المنتج «${productToDelete.nameAr}»` : `Produit «${productToDelete.nameFr}» supprimé`);
    setProductToDelete(null);
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nameFr.toLowerCase().includes(q) ||
      p.nameAr.includes(q) ||
      p.categoryId.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const activeCount = products.filter((p) => p.available).length;
  const outOfStockCount = products.length - activeCount;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top action header */}
      <div className="p-3 sm:p-4 border-b border-white/5 bg-[#0F0F10] shrink-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center text-[#FF6321]">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase text-white font-heading">
                {isRTL ? 'إدارة قائمة الطعام والمنتجات' : 'Gestion du Menu & Produits'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {isRTL
                  ? `إجمالي: ${products.length} منتج • متاح في المخزون: ${activeCount} • نفد: ${outOfStockCount}`
                  : `Total : ${products.length} produits • En stock : ${activeCount} • Épuisés : ${outOfStockCount}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              title={isRTL ? 'استعادة القائمة الأصلية' : 'Restaurer le menu d\'origine'}
              className="px-2.5 py-2 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/5 text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRTL ? 'استعادة الأصل' : 'Restaurer'}</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#FF6321] hover:brightness-110 text-black text-xs font-black uppercase tracking-tight flex items-center gap-1.5 shadow-[0_4px_12px_rgba(255,99,33,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isRTL ? 'إضافة منتج جديد' : 'Ajouter un Produit'}</span>
            </button>
          </div>
        </div>

        {/* Search bar & Category filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم (طاكوس، برغر، بيتزا...)' : 'Rechercher un plat (Tacos, Burger, Pizza...)'}
              className="w-full pl-9 pr-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6321] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter pills - scrollable horizontally */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#FF6321] text-black font-black'
                  : 'bg-[#141416] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {isRTL ? 'الكل' : 'Tous'} ({products.length})
            </button>
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#FF6321] text-black font-black'
                      : 'bg-[#141416] border border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{isRTL ? cat.nameAr : cat.nameFr}</span>
                  <span className="opacity-70 text-[10px] ml-1">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast banner if any */}
      {toastMessage && (
        <div className="bg-[#FF6321] text-black px-4 py-2 text-xs font-black flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Products list scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <Utensils className="w-12 h-12 stroke-1 text-gray-600 mb-3" />
            <p className="text-sm font-bold text-gray-300">
              {isRTL ? 'لم يتم العثور على أي منتج يطابق البحث' : 'Aucun produit ne correspond à votre recherche'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isRTL ? 'يمكنك إضافة منتج جديد بسهولة بالضغط على الزر أعلاه' : 'Vous pouvez ajouter un nouveau plat via le bouton ci-dessus'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`group relative p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  product.available
                    ? 'bg-[#141416] border-white/5 hover:border-white/15'
                    : 'bg-[#111113]/70 border-red-950/30 opacity-75'
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/5">
                    <img
                      src={product.image}
                      alt={product.nameFr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {product.badge && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#FF6321] text-black text-[9px] font-black uppercase shadow">
                        {product.badge}
                      </span>
                    )}
                    {!product.available && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-1 text-center">
                        <span className="text-[10px] font-black text-red-400 uppercase">
                          {isRTL ? 'نفد' : 'Épuisé'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-black text-white truncate font-heading">
                        {isRTL ? product.nameAr : product.nameFr}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {isRTL ? product.nameFr : product.nameAr}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-sm font-black text-[#FF6321]">
                        {product.basePrice} {config.currency}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-bold uppercase">
                        {product.categoryId}
                      </span>
                      {product.sizes && product.sizes.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/30 text-[9px] font-bold">
                          {product.sizes.length} {isRTL ? 'أحجام' : 'tailles'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description snippet */}
                {(product.descriptionFr || product.descriptionAr) && (
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-2">
                    {isRTL ? product.descriptionAr || product.descriptionFr : product.descriptionFr || product.descriptionAr}
                  </p>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-between gap-1.5 pt-2.5 mt-2.5 border-t border-white/5">
                  {/* Availability toggle */}
                  <button
                    onClick={() => toggleProductAvailability(product.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      product.available
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50'
                        : 'bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/50'
                    }`}
                  >
                    {product.available ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'متاح' : 'En stock'}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'غير متوفر' : 'Épuisé'}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      title={isRTL ? 'تعديل بيانات المنتج' : 'Modifier le produit'}
                      className="p-1.5 rounded-lg bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white border border-white/5 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#FF6321]" />
                      <span className="text-[11px]">{isRTL ? 'تعديل' : 'Modifier'}</span>
                    </button>

                    <button
                      onClick={() => setProductToDelete(product)}
                      title={isRTL ? 'حذف المنتج نهائياً' : 'Supprimer le produit'}
                      className="p-1.5 rounded-lg bg-[#1A1A1C] hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[92vh] bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/5 bg-[#0F0F10] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF6321] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(255,99,33,0.3)]">
                  {editingProduct ? <Edit2 className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white font-heading">
                    {editingProduct
                      ? isRTL ? 'تعديل بيانات المنتج' : 'Modifier le Produit'
                      : isRTL ? 'إضافة منتج جديد إلى القائمة' : 'Ajouter un Nouveau Plat'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isRTL
                      ? 'سيظهر هذا التعديل مباشرة على قائمة الزبائن وشاشة الكاشير'
                      : 'Les modifications s\'appliquent immédiatement sur le menu client et la caisse'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Names (Fr & Ar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'الاسم بالفرنسية (Nom Français) *' : 'Nom en Français *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameFr}
                    onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                    placeholder="ex: Tacos Mixte Spécial"
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6321]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'الاسم بالعربية *' : 'Nom en Arabe *'}
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: طاكوس مشكل خاص شنب"
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6321]"
                  />
                </div>
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'القسم / الصنف *' : 'Catégorie *'}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value as CategoryId })}
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6321]"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameFr} ({c.nameAr})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? `السعر الأساسي (${config.currency}) *` : `Prix de base (${config.currency}) *`}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-[#FF6321]"
                  />
                </div>
              </div>

              {/* Descriptions (Fr & Ar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'الوصف بالفرنسية (اختياري)' : 'Description Française (optionnel)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descriptionFr}
                    onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                    placeholder="Ingrédients, garniture, saveurs..."
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6321]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'الوصف بالعربية (اختياري)' : 'Description Arabe (optionnel)'}
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    placeholder="المكونات، التتبيلة، طريقة التقديم..."
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6321]"
                  />
                </div>
              </div>

              {/* Image selection with presets and upload */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRTL ? 'صورة المنتج (تصوير أو رفع من الجهاز)' : 'Photo (Prendre une photo ou uploader)'}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6321]"
                    />
                    <label className="px-3 py-2 bg-[#1A1A1C] border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#252527] transition-colors shrink-0">
                      <ImageIcon className="w-4 h-4 text-[#FF6321]" />
                      <span>{isRTL ? 'رفع/تصوير' : 'Uploader'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_WIDTH = 400;
                                const MAX_HEIGHT = 400;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                setFormData((prev) => ({ ...prev, image: dataUrl }));
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

              </div>
              {/* Badge & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'الشارة الترويجية (Badge)' : 'Badge promotionnel'}
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value as ProductBadge | '' })}
                    className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6321]"
                  >
                    <option value="">{isRTL ? 'بدون شارة' : 'Aucun badge'}</option>
                    {BADGE_OPTIONS.filter(Boolean).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRTL ? 'خيارات الحجم' : 'Options de tailles'}
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/10 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.hasSizes}
                      onChange={(e) => setFormData({ ...formData, hasSizes: e.target.checked })}
                      className="w-4 h-4 accent-[#FF6321] rounded"
                    />
                    <span>{isRTL ? 'تفعيل أحجام متعددة (Standard / Maxi / Mega)' : 'Activer plusieurs tailles (Standard / Maxi / Mega)'}</span>
                  </label>
                </div>
              </div>

              {/* Feature checkboxes */}
              <div className="pt-2 border-t border-white/5">
                <span className="block text-xs font-bold text-gray-300 mb-2">
                  {isRTL ? 'خصائص وتصنيفات إضافية' : 'Caractéristiques & Filtres'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/5 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#FF6321]"
                    />
                    <span>{isRTL ? 'شائع ومطلوب' : 'Populaire'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/5 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#FF6321]"
                    />
                    <span>{isRTL ? 'جديد في القائمة' : 'Nouveau'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/5 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.isSpicy}
                      onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#FF6321]"
                    />
                    <span>{isRTL ? 'حار / بيكو 🌶️' : 'Piquant 🌶️'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/5 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.isCheeseLover}
                      onChange={(e) => setFormData({ ...formData, isCheeseLover: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#FF6321]"
                    />
                    <span>{isRTL ? 'جبن مضاعف 🧀' : 'Fromage généreux'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/5 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.hasChicken}
                      onChange={(e) => setFormData({ ...formData, hasChicken: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#FF6321]"
                    />
                    <span>{isRTL ? 'دجاج 🍗' : 'Poulet 🍗'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/5 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.hasMeat}
                      onChange={(e) => setFormData({ ...formData, hasMeat: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#FF6321]"
                    />
                    <span>{isRTL ? 'لحم بقر 🥩' : 'Viande Hachée 🥩'}</span>
                  </label>
                </div>
              </div>

              {/* Availability Switch */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">
                    {isRTL ? 'حالة التوفر في المخزون' : 'Disponibilité en cuisine'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formData.available
                      ? isRTL ? 'المنتج متوفر ويمكن للزبائن طلبه الآن' : 'Le produit est visible et commandable par les clients'
                      : isRTL ? 'المنتج غير متوفر حالياً (نفد من المخزون)' : 'Le produit est marqué en rupture de stock'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, available: !formData.available })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                    formData.available ? 'bg-emerald-500 justify-end' : 'bg-gray-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-white/10">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-tight text-sm shadow-[0_8px_20px_rgba(255,99,33,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {editingProduct
                      ? isRTL ? 'حفظ التعديلات' : 'Enregistrer les Modifications'
                      : isRTL ? 'إضافة المنتج إلى القائمة الآن' : 'Ajouter le Plat au Menu'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0A0A0B] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h4 className="text-base font-black uppercase text-white font-heading mb-1">
              {isRTL ? 'تأكيد حذف المنتج' : 'Confirmer la suppression'}
            </h4>
            <p className="text-xs text-gray-400 mb-5 max-w-xs">
              {isRTL
                ? `هل أنت متأكد من رغبتك في حذف «${productToDelete.nameAr}» نهائياً من القائمة؟`
                : `Êtes-vous sûr de vouloir supprimer définitivement «${productToDelete.nameFr}» du menu ?`}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-colors shadow-[0_4px_12px_rgba(220,38,38,0.4)] cursor-pointer"
              >
                {isRTL ? 'نعم، احذف المنتج' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center mb-4">
              <RotateCcw className="w-7 h-7" />
            </div>

            <h4 className="text-base font-black uppercase text-white font-heading mb-1">
              {isRTL ? 'استعادة قائمة الطعام الأصلية' : 'Restaurer le menu par défaut'}
            </h4>
            <p className="text-xs text-gray-400 mb-5 max-w-xs">
              {isRTL
                ? 'سيتم إعادة جميع الأطباق والأسعار إلى القائمة الافتراضية الأصلية لمطعم شنب طاكوس.'
                : 'Tous les plats et prix d\'origine seront réinitialisés.'}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetToDefaultProducts();
                  setShowResetConfirm(false);
                  showToast(isRTL ? 'تمت استعادة قائمة الطعام الأصلية بنجاح' : 'Menu d\'origine restauré avec succès');
                }}
                className="py-2.5 px-4 rounded-xl bg-[#FF6321] hover:brightness-110 text-black font-black text-xs transition-colors shadow cursor-pointer"
              >
                {isRTL ? 'تأكيد الاستعادة' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
