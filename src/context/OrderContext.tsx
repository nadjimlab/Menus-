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

  // Server Synchronization: Initial fetch, Server-Sent Events (SSE), and periodic polling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial fetch from server
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      })
      .catch((err) => {
        console.warn('Initial server orders fetch failed, falling back to local cache', err);
      });

    // 2. Real-Time Server-Sent Events (SSE) for instant cross-device updates (phone <-> laptop)
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/orders/events');

      es.addEventListener('INIT', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (Array.isArray(payload.orders)) {
            setOrders(payload.orders);
          }
        } catch {}
      });

      es.addEventListener('NEW_ORDER', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.order) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === payload.order.id)) return prev;
              return [payload.order, ...prev];
            });
            // Sound chime for incoming orders
            soundFx.playNewOrderNotification();
          }
        } catch {}
      });

      es.addEventListener('ORDERS_UPDATED', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (Array.isArray(payload.orders)) {
            setOrders(payload.orders);
          }
        } catch {}
      });

      es.addEventListener('STATUS_CHANGED', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.orderId === activeCustomerOrderId) {
            if (payload.status === 'ready') {
              soundFx.playOrderReadyCelebration();
              try {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              } catch {}
            } else if (payload.status === 'preparing') {
              soundFx.playNewOrderNotification();
            }
          }
        } catch {}
      });
    } catch (e) {
      console.warn('SSE connection failed:', e);
    }

    // 3. Fallback background polling every 3.5 seconds
    const pollInterval = setInterval(() => {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        })
        .catch(() => {});
    }, 3500);

    // 4. Same-browser storage and BroadcastChannel synchronization
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
        if (type === 'ORDERS_UPDATED' && payload.orders) {
          setOrders(payload.orders);
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
      if (es) es.close();
      clearInterval(pollInterval);
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
      isPaid: false,
      paymentMethod: 'unpaid',
      source: customerInfo.deliveryType === 'sur_place' ? 'table' : 'online',
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    setActiveCustomerOrderId(orderId);

    // Play chime
    soundFx.playNewOrderNotification();

    // 1. Post to central Express backend for multi-device cross-network synchronization
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.error('Failed to post order to server:', err));

    // 2. Broadcast across tabs
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

    // Post to central Express backend
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.error('Failed to post caisse order to server:', err));

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

    // Patch to server
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isPaid: true,
        paymentMethod,
        cashReceived: cashReceived !== undefined ? cashReceived : undefined,
        changeGiven: changeGiven !== undefined ? changeGiven : undefined,
      }),
    }).catch((err) => console.error('Failed to patch order payment on server:', err));

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

    // Patch status to server
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error('Failed to patch order status on server:', err));

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

    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to delete order on server:', err));
  };

  const clearAllOrders = () => {
    setOrders([]);
    setActiveCustomerOrderId(null);

    fetch('/api/orders', {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to clear orders on server:', err));
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
