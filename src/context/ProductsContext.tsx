import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/menuData';

interface ProductsContextType {
  products: Product[];
  addProduct: (newProduct: Omit<Product, 'id'> & { id?: string }) => Product;
  updateProduct: (id: string, updatedFields: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;
  resetToDefaultProducts: () => void;
}

const PRODUCTS_STORAGE_KEY = 'cheneb_products_v2';

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Error loading products from localStorage:', err);
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Save to localStorage when products change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      } catch (err) {
        console.error('Error saving products to localStorage:', err);
      }
    }
  }, [products]);

  // Add new product
  const addProduct = (newProductData: Omit<Product, 'id'> & { id?: string }): Product => {
    const generatedId = newProductData.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullProduct: Product = {
      ...newProductData,
      id: generatedId,
      available: newProductData.available !== undefined ? newProductData.available : true,
      defaultIngredients: newProductData.defaultIngredients || [],
      availableExtras: newProductData.availableExtras || [],
    };

    setProducts((prev) => [fullProduct, ...prev]);
    return fullProduct;
  };

  // Update existing product
  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  // Delete product
  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  // Toggle availability
  const toggleProductAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, available: !item.available } : item))
    );
  };

  // Reset to default factory menu
  const resetToDefaultProducts = () => {
    setProducts(INITIAL_PRODUCTS);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        resetToDefaultProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
