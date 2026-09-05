import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlacedOrder, OrderStatus, CustomerOrderInfo, CartItem, OrderItemRecord } from '../types';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface OrderContextType {
  orders: PlacedOrder[];
  activeCustomerOrderId: string | null;
  activeCustomerOrder: PlacedOrder | undefined;
  tableNumber: string | null;
  setTableNumber: (table: string | null) => void;
  isOrderTrackerOpen: boolean;
  setIsOrderTrackerOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  placeOrder: (customerInfo: CustomerOrderInfo, items: CartItem[], subtotal: number, deliveryFee: number) => PlacedOrder;
  placeCaisseOrder: (orderData: {
    customerName?: string;
    customerPhone?: string;
    deliveryType: 'sur_place' | 'a_emporter' | 'livraison';
    tableNumber?: string;
    items: OrderItemRecord[];
    subtotal: number;
    deliveryFee?: number;
    total: number;
    isPaid: boolean;
    paymentMethod: 'cash' | 'baridimob' | 'carte';
    cashReceived?: number;
    changeGiven?: number;
    notes?: string;
  }) => PlacedOrder;
  markOrderPaid: (orderId: string, paymentMethod: 'cash' | 'baridimob' | 'carte', cashReceived?: number, changeGiven?: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  clearActiveOrder: () => void;
}

const ORDERS_STORAGE_KEY = 'cheneb_placed_orders_v2';
const ACTIVE_ORDER_ID_KEY = 'cheneb_active_customer_order_id_v2';
const TABLE_STORAGE_KEY = 'cheneb_customer_table_v1';

// Initial demo orders for the kitchen display
const INITIAL_DEMO_ORDERS: PlacedOrder[] = [];

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<PlacedOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // Ignore JSON error
      }
    }
    return INITIAL_DEMO_ORDERS;
  });

  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_ORDER_ID_KEY) || null;
    }
    return null;
  });

  const [tableNumber, setTableNumberState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      // 1. Check URL query params e.g. ?table=5 or ?table_id=5
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table') || params.get('table_id') || params.get('t');
      if (urlTable) {
        localStorage.setItem(TABLE_STORAGE_KEY, urlTable);
        return urlTable;
      }
      // 2. Check hash parameter e.g. #table=5
      if (window.location.hash.includes('table=')) {
        const hashMatch = window.location.hash.match(/table=(\d+)/);
        if (hashMatch && hashMatch[1]) {
          localStorage.setItem(TABLE_STORAGE_KEY, hashMatch[1]);
          return hashMatch[1];
        }
      }
      // 3. Fallback to localStorage
      return localStorage.getItem(TABLE_STORAGE_KEY) || null;
    }
    return null;
  });

  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Sync orders to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  // Sync active order ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeCustomerOrderId) {
        localStorage.setItem(ACTIVE_ORDER_ID_KEY, activeCustomerOrderId);
      } else {
        localStorage.removeItem(ACTIVE_ORDER_ID_KEY);
      }
    }
  }, [activeCustomerOrderId]);

  // Firebase Firestore Real-Time Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedOrders: PlacedOrder[] = [];
          snapshot.forEach((docSnap) => {
            loadedOrders.push(docSnap.data() as PlacedOrder);
          });

          setOrders((prevOrders) => {
            // Check if there's a new order compared to previous state to play sound notification
            if (loadedOrders.length > prevOrders.length) {
              soundFx.playNewOrderNotification();
            }
            return loadedOrders;
          });
        },
        (error) => {
          console.warn('Firestore snapshot error, falling back to localStorage', error);
          // Fallback to localStorage if offline or permissions issue
          const cached = localStorage.getItem(ORDERS_STORAGE_KEY);
          if (cached) {
            try {
              setOrders(JSON.parse(cached));
            } catch {}
          }
        }
      );
    } catch (err) {
      console.warn('Failed to initialize Firestore listener:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const setTableNumber = (table: string | null) => {
    setTableNumberState(table);
    if (typeof window !== 'undefined') {
      if (table) {
        localStorage.setItem(TABLE_STORAGE_KEY, table);
      } else {
        localStorage.removeItem(TABLE_STORAGE_KEY);
      }
    }
  };

  const placeOrder = (
    customerInfo: CustomerOrderInfo,
    items: CartItem[],
    subtotal: number,
    deliveryFee: number
  ): PlacedOrder => {
    // Generate order ID e.g. "CT-8492"
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `CT-${randomSuffix}`;

    const orderItems: OrderItemRecord[] = items.map((ci) => ({
      id: ci.cartItemId,
      nameFr: ci.product.nameFr,
      nameAr: ci.product.nameAr,
      sizeName: ci.customization.selectedSize?.name,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      totalPrice: ci.totalPrice,
      sauces: ci.customization.selectedSauces,
      removedIngredients: ci.customization.removedIngredientIds.map((id) => {
        const ing = ci.product.defaultIngredients.find((i) => i.id === id);
        return ing ? ing.nameFr : id;
      }),
      extras: ci.customization.selectedExtras.map((e) => `${e.extra.nameFr} (x${e.quantity})`),
      specialInstructions: ci.customization.specialInstructions,
    }));

    const newOrder: PlacedOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerInfo: {
        ...customerInfo,
        tableNumber: customerInfo.deliveryType === 'sur_place' ? customerInfo.tableNumber || tableNumber || undefined : undefined,
      },
      items: orderItems,
      subtotal,
      deliveryFee: customerInfo.deliveryType === 'livraison' ? deliveryFee : 0,
      total: subtotal + (customerInfo.deliveryType === 'livraison' ? deliveryFee : 0),
      status: 'received',
      estimatedMinutes: 15,
      isPaid: false,
      paymentMethod: 'unpaid',
      source: customerInfo.deliveryType === 'sur_place' ? 'table' : 'online',
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    setActiveCustomerOrderId(orderId);

    // Play chime
    soundFx.playNewOrderNotification();

    // Save to Firestore for real-time cross-device sync
    setDoc(doc(db, 'orders', orderId), newOrder).catch((err) =>
      console.error('Failed to save order to Firestore:', err)
    );

    return newOrder;
  };

  const placeCaisseOrder = (orderData: {
    customerName?: string;
    customerPhone?: string;
    deliveryType: 'sur_place' | 'a_emporter' | 'livraison';
    tableNumber?: string;
    items: OrderItemRecord[];
    subtotal: number;
    deliveryFee?: number;
    total: number;
    isPaid: boolean;
    paymentMethod: 'cash' | 'baridimob' | 'carte';
    cashReceived?: number;
    changeGiven?: number;
    notes?: string;
  }): PlacedOrder => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `CT-C${randomSuffix}`;
    const fee = orderData.deliveryFee || 0;

    const newOrder: PlacedOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerInfo: {
        customerName: orderData.customerName || (orderData.deliveryType === 'sur_place' ? `Table ${orderData.tableNumber || '1'}` : 'Client Caisse'),
        customerPhone: orderData.customerPhone || '',
        deliveryType: orderData.deliveryType,
        tableNumber: orderData.tableNumber,
        deliveryAddress: orderData.deliveryType === 'sur_place' ? `Table ${orderData.tableNumber || '1'}` : 'Comptoir / Caisse',
        notes: orderData.notes,
      },
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: fee,
      total: orderData.total,
      status: 'preparing', // Directly into preparing since cashier took it
      estimatedMinutes: 10,
      isPaid: orderData.isPaid,
      paymentMethod: orderData.paymentMethod,
      cashReceived: orderData.cashReceived,
      changeGiven: orderData.changeGiven,
      paidAt: orderData.isPaid ? new Date().toISOString() : undefined,
      source: 'caisse',
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    soundFx.playNewOrderNotification();

    // Save to Firestore for real-time sync
    setDoc(doc(db, 'orders', orderId), newOrder).catch((err) =>
      console.error('Failed to save caisse order to Firestore:', err)
    );

    return newOrder;
  };

  const markOrderPaid = (
    orderId: string,
    paymentMethod: 'cash' | 'baridimob' | 'carte',
    cashReceived?: number,
    changeGiven?: number
  ) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          isPaid: true,
          paymentMethod,
          cashReceived: cashReceived !== undefined ? cashReceived : o.total,
          changeGiven: changeGiven !== undefined ? changeGiven : 0,
          paidAt: new Date().toISOString(),
        };
      }
      return o;
    });

    setOrders(updated);

    // Update in Firestore
    const orderRef = doc(db, 'orders', orderId);
    updateDoc(orderRef, {
      isPaid: true,
      paymentMethod,
      cashReceived: cashReceived !== undefined ? cashReceived : null,
      changeGiven: changeGiven !== undefined ? changeGiven : null,
      paidAt: new Date().toISOString(),
    }).catch((err) => console.error('Failed to update order payment in Firestore:', err));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          statusUpdatedAt: new Date().toISOString(),
          estimatedMinutes: status === 'ready' ? 0 : status === 'preparing' ? 10 : o.estimatedMinutes,
        };
      }
      return o;
    });

    setOrders(updated);

    // Update in Firestore
    const orderRef = doc(db, 'orders', orderId);
    updateDoc(orderRef, {
      status,
      statusUpdatedAt: new Date().toISOString(),
      estimatedMinutes: status === 'ready' ? 0 : status === 'preparing' ? 10 : 10,
    }).catch((err) => console.error('Failed to update order status in Firestore:', err));

    // If status is ready and matches current active customer, play sound + confetti
    if (orderId === activeCustomerOrderId) {
      if (status === 'ready') {
        soundFx.playOrderReadyCelebration();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else if (status === 'preparing') {
        soundFx.playNewOrderNotification();
      }
    }
  };

  const deleteOrder = (orderId: string) => {
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    if (activeCustomerOrderId === orderId) {
      setActiveCustomerOrderId(null);
    }

    deleteDoc(doc(db, 'orders', orderId)).catch((err) =>
      console.error('Failed to delete order from Firestore:', err)
    );
  };

  const clearAllOrders = () => {
    setOrders([]);
    setActiveCustomerOrderId(null);

    // Delete all orders in Firestore
    orders.forEach((o) => {
      deleteDoc(doc(db, 'orders', o.id)).catch(() => {});
    });
  };

  const clearActiveOrder = () => {
    setActiveCustomerOrderId(null);
  };

  const activeCustomerOrder = orders.find((o) => o.id === activeCustomerOrderId);

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeCustomerOrderId,
        activeCustomerOrder,
        tableNumber,
        setTableNumber,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        isAdminOpen,
        setIsAdminOpen,
        placeOrder,
        placeCaisseOrder,
        markOrderPaid,
        updateOrderStatus,
        deleteOrder,
        clearAllOrders,
        clearActiveOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
