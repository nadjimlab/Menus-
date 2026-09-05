import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlacedOrder, OrderStatus, CustomerOrderInfo, CartItem, OrderItemRecord } from '../types';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface OrderContextType {
  orders: PlacedOrder[];
  activeCustomerOrderId: string | null;
  activeCustomerOrder: PlacedOrder | undefined;
  tableNumber: string | null;
  setTableNumber: (table: string | null) => void;
  isOrderTrackerOpen: boolean;
  setIsOrderTrackerOpen: (open: boolean) => void;
  isTacoGameOpen: boolean;
  setIsTacoGameOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  placeOrder: (customerInfo: CustomerOrderInfo, items: CartItem[], subtotal: number, deliveryFee: number) => PlacedOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  clearActiveOrder: () => void;
}

const ORDERS_STORAGE_KEY = 'cheneb_placed_orders_v2';
const ACTIVE_ORDER_ID_KEY = 'cheneb_active_customer_order_id_v2';
const TABLE_STORAGE_KEY = 'cheneb_customer_table_v1';

// Initial demo orders for the kitchen display
const INITIAL_DEMO_ORDERS: PlacedOrder[] = [
  {
    id: 'CT-2104',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    customerInfo: {
      customerName: 'Karim Brahimi',
      customerPhone: '0661234567',
      deliveryType: 'sur_place',
      tableNumber: '3',
      deliveryAddress: 'Table 3',
      notes: 'Bien piquant avec sauce algérienne svp',
    },
    items: [
      {
        id: 'item-1',
        nameFr: 'Tacos Français Double',
        nameAr: 'طاكوس فرنسي دوبل',
        sizeName: 'L',
        quantity: 1,
        unitPrice: 750,
        totalPrice: 750,
        sauces: ['Sauce Fromagère Maison', 'Sauce Algérienne'],
        removedIngredients: [],
        extras: ['Supplément Cheddar Fondu'],
      },
      {
        id: 'item-2',
        nameFr: 'Canette Coca-Cola 33cl',
        nameAr: 'كوكاكولا 33 سل',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
      },
    ],
    subtotal: 850,
    deliveryFee: 0,
    total: 850,
    status: 'preparing',
    estimatedMinutes: 10,
  },
  {
    id: 'CT-2103',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    customerInfo: {
      customerName: 'Yassine M.',
      customerPhone: '0550998877',
      deliveryType: 'livraison',
      deliveryAddress: 'Cité 19 Mars, en face la mosquée, El Oued',
      notes: 'Appeler quand le livreur arrive',
    },
    items: [
      {
        id: 'item-3',
        nameFr: 'Smash Burger Double Cheese',
        nameAr: 'سماش برغر دبل تشيز',
        sizeName: 'Double',
        quantity: 2,
        unitPrice: 650,
        totalPrice: 1300,
        sauces: ['Sauce Burger Biggy'],
        removedIngredients: ['Oignons caramélisés'],
        extras: [],
      },
    ],
    subtotal: 1300,
    deliveryFee: 150,
    total: 1450,
    status: 'ready',
    estimatedMinutes: 0,
  },
];

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
  const [isTacoGameOpen, setIsTacoGameOpen] = useState(false);
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

  // Multi-tab sync with BroadcastChannel & storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setOrders(updated);
        } catch {
          // ignore
        }
      }
      if (e.key === ACTIVE_ORDER_ID_KEY) {
        setActiveCustomerOrderId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cheneb_orders_channel');
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'ORDERS_UPDATED') {
          setOrders(payload.orders);
        }
        if (type === 'STATUS_CHANGED') {
          // Check if this is the active customer's order
          if (payload.orderId === activeCustomerOrderId) {
            if (payload.status === 'ready') {
              soundFx.playOrderReadyCelebration();
              try {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              } catch {
                // ignore
              }
            } else if (payload.status === 'preparing') {
              soundFx.playNewOrderNotification();
            }
          }
        }
      };
    } catch {
      // BroadcastChannel may not be available in all browsers
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, [activeCustomerOrderId]);

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
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    setActiveCustomerOrderId(orderId);

    // Play chime
    soundFx.playNewOrderNotification();

    // Broadcast
    try {
      const channel = new BroadcastChannel('cheneb_orders_channel');
      channel.postMessage({
        type: 'ORDERS_UPDATED',
        payload: { orders: updated },
      });
      channel.close();
    } catch {
      // ignore
    }

    return newOrder;
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

    // Broadcast across tabs
    try {
      const channel = new BroadcastChannel('cheneb_orders_channel');
      channel.postMessage({
        type: 'ORDERS_UPDATED',
        payload: { orders: updated },
      });
      channel.postMessage({
        type: 'STATUS_CHANGED',
        payload: { orderId, status },
      });
      channel.close();
    } catch {
      // ignore
    }
  };

  const deleteOrder = (orderId: string) => {
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    if (activeCustomerOrderId === orderId) {
      setActiveCustomerOrderId(null);
    }
  };

  const clearAllOrders = () => {
    setOrders([]);
    setActiveCustomerOrderId(null);
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
        isTacoGameOpen,
        setIsTacoGameOpen,
        isAdminOpen,
        setIsAdminOpen,
        placeOrder,
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
