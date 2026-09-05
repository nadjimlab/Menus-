export type CategoryId = 'all' | 'tacos' | 'burgers' | 'sandwiches' | 'pizza' | 'plats' | 'boissons';

export type ProductBadge = 'Populaire' | 'Nouveau' | 'Best Seller' | 'Spicy 🌶️' | 'Maxi Format';

export interface SizeOption {
  id: string;
  name: string; // e.g. "S", "M", "L", "XL", "XXL", "Normal", "Mega"
  label: string;
  priceDelta: number; // additional price compared to basePrice (or 0 for default)
  description?: string;
}

export interface DefaultIngredient {
  id: string;
  nameFr: string;
  nameAr: string;
  removable: boolean;
}

export interface ExtraOption {
  id: string;
  nameFr: string;
  nameAr: string;
  price: number; // in DA
  category?: 'fromage' | 'viande' | 'sauce' | 'accompagnement' | 'boisson';
}

export interface Product {
  id: string;
  nameFr: string;
  nameAr: string;
  categoryId: CategoryId;
  descriptionFr: string;
  descriptionAr: string;
  basePrice: number; // in DA (Algerian Dinar)
  image: string;
  fallbackImage?: string;
  badge?: ProductBadge;
  isPopular?: boolean;
  isNew?: boolean;
  isSpicy?: boolean;
  isCheeseLover?: boolean;
  isBudgetFriendly?: boolean;
  hasChicken?: boolean;
  hasMeat?: boolean;
  sizes?: SizeOption[];
  defaultIngredients: DefaultIngredient[];
  availableExtras: ExtraOption[];
  available: boolean;
}

export interface SauceOption {
  id: string;
  nameFr: string;
  nameAr: string;
  isSpicy?: boolean;
}

export interface CartCustomization {
  selectedSize?: SizeOption;
  removedIngredientIds: string[];
  selectedSauces?: string[]; // Array of sauce names e.g. ["Sauce Fromagère", "Algérienne"]
  selectedExtras: {
    extra: ExtraOption;
    quantity: number;
  }[];
  specialInstructions?: string;
}

export interface CartItem {
  cartItemId: string; // unique ID generated for this specific customized item
  product: Product;
  customization: CartCustomization;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface RestaurantConfig {
  restaurantName: string;
  taglineFr: string;
  taglineAr: string;
  phone: string;
  whatsappNumber: string; // international format without + e.g. "213699992626"
  addressFr: string;
  addressAr: string;
  wilaya: string;
  mapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  openingHoursFr: string;
  openingHoursAr: string;
  currency: string;
  deliveryFee: number;
  minOrderDelivery: number;
}

export type DeliveryType = 'sur_place' | 'a_emporter' | 'livraison';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItemRecord {
  id: string;
  nameFr: string;
  nameAr: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sauces?: string[];
  removedIngredients?: string[];
  extras?: string[];
  specialInstructions?: string;
}

export interface PlacedOrder {
  id: string; // e.g. "CT-8492"
  createdAt: string; // ISO string
  customerInfo: CustomerOrderInfo;
  items: OrderItemRecord[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  statusUpdatedAt?: string;
  estimatedMinutes?: number;
  isPaid?: boolean;
  paymentMethod?: 'cash' | 'baridimob' | 'carte' | 'unpaid';
  cashReceived?: number;
  changeGiven?: number;
  paidAt?: string;
  source?: 'online' | 'table' | 'caisse';
}

export interface CustomerOrderInfo {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  tableNumber?: string;
  notes?: string;
}

export interface MoodFilter {
  id: string;
  labelFr: string;
  labelAr: string;
  icon: string;
  filterFn: (product: Product) => boolean;
}

