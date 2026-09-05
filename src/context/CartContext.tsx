import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, CartCustomization } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, customization: CartCustomization, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const CART_STORAGE_KEY = 'cheneb_tacos_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage error handled
    }
  }, [items]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const calculateUnitPrice = (product: Product, customization: CartCustomization): number => {
    let price = product.basePrice;
    if (customization.selectedSize) {
      price += customization.selectedSize.priceDelta;
    }
    customization.selectedExtras.forEach(item => {
      price += item.extra.price * item.quantity;
    });
    return Math.max(0, price);
  };

  const generateCartItemId = (product: Product, customization: CartCustomization): string => {
    const sizeId = customization.selectedSize ? customization.selectedSize.id : 'default';
    const removedSorted = [...customization.removedIngredientIds].sort().join(',');
    const saucesSorted = (customization.selectedSauces || []).sort().join(',');
    const extrasSorted = customization.selectedExtras
      .map(e => `${e.extra.id}:${e.quantity}`)
      .sort()
      .join(',');
    const notesHash = customization.specialInstructions ? customization.specialInstructions.trim().toLowerCase() : '';
    return `${product.id}__${sizeId}__rem_${removedSorted}__sauce_${saucesSorted}__ext_${extrasSorted}__note_${notesHash}`;
  };

  const addToCart = (product: Product, customization: CartCustomization, quantity = 1) => {
    if (quantity <= 0) return;
    const unitPrice = calculateUnitPrice(product, customization);
    const cartItemId = generateCartItemId(product, customization);

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: unitPrice * newQty,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          cartItemId,
          product,
          customization,
          unitPrice,
          quantity,
          totalPrice: unitPrice * quantity,
        };
        return [...prevItems, newItem];
      }
    });

    const sizeName = customization.selectedSize ? ` (${customization.selectedSize.name})` : '';
    setToastMessage(`${product.nameFr}${sizeName} ajouté au panier !`);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
