import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { PlacedOrder, OrderStatus, CustomerOrderInfo, CartItem, OrderItemRecord } from '../types';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

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
const API_ORDERS_URL = '/api/orders';

// Keep the kitchen empty until a real customer or cashier creates an order.
const INITIAL_DEMO_ORDERS: PlacedOrder[] = [];

const orderToSupabaseRow = (order: PlacedOrder, customerUserId?: string) => ({
  id: order.id,
  created_at: order.createdAt,
  customer_info: order.customerInfo,
  items: order.items,
  subtotal: order.subtotal,
  delivery_fee: order.deliveryFee,
  total: order.total,
  status: order.status,
  estimated_minutes: order.estimatedMinutes,
  is_paid: order.isPaid,
  payment_method: order.paymentMethod,
  cash_received: order.cashReceived ?? null,
  change_given: order.changeGiven ?? null,
  paid_at: order.paidAt ?? null,
  status_updated_at: order.statusUpdatedAt ?? null,
  source: order.source,
  notes: order.customerInfo.notes ?? null,
  customer_user_id: customerUserId ?? null,
});

const supabaseRowToOrder = (row: Record<string, any>): PlacedOrder => ({
  id: row.id,
  createdAt: row.created_at,
  customerInfo: row.customer_info || {},
  items: row.items || [],
  subtotal: Number(row.subtotal || 0),
  deliveryFee: Number(row.delivery_fee || 0),
  total: Number(row.total || 0),
  status: row.status,
  estimatedMinutes: Number(row.estimated_minutes || 0),
  isPaid: Boolean(row.is_paid),
  paymentMethod: row.payment_method,
  cashReceived: row.cash_received == null ? undefined : Number(row.cash_received),
  changeGiven: row.change_given == null ? undefined : Number(row.change_given),
  paidAt: row.paid_at || undefined,
  statusUpdatedAt: row.status_updated_at || undefined,
  source: row.source,
});

const saveOrderToSupabase = async (order: PlacedOrder) => {
  if (!supabase) return false;
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('orders').upsert(orderToSupabaseRow(order, sessionData.session?.user.id));
  if (error) {
    console.error('Supabase order write failed:', error.message);
    return false;
  }
  return true;
};

const syncOrderToApi = async (order: PlacedOrder) => {
  try {
    await fetch(API_ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch {
    // Firestore is the primary realtime store; the API is a deployment fallback.
  }
};

const syncOrderPatchToApi = async (orderId: string, updates: Record<string, unknown>) => {
  try {
    await fetch(`${API_ORDERS_URL}/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch {
    // Ignore fallback errors when Firestore is available.
  }
};

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
  const pendingSupabaseOrderIds = useRef(new Set<string>());

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

    if (supabase) {
      let active = true;
      const loadOrders = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          const { error: authError } = await supabase.auth.signInAnonymously();
          if (authError) console.error('Anonymous customer auth failed:', authError.message);
        }
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase order read failed:', error.message);
          return;
        }
        if (active) {
          const remoteOrders = (data || []).map((row) => supabaseRowToOrder(row));
          setOrders((current) => {
            const remoteIds = new Set(remoteOrders.map((order) => order.id));
            const stillPending = current.filter(
              (order) => pendingSupabaseOrderIds.current.has(order.id) && !remoteIds.has(order.id)
            );
            return [...stillPending, ...remoteOrders];
          });
        }
      };
      void loadOrders();
      const { data: authListener } = supabase.auth.onAuthStateChange(() => void loadOrders());
      const refreshTimer = window.setInterval(() => void loadOrders(), 5000);
      const channel = supabase
        .channel('orders-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          const next = supabaseRowToOrder((payload.new || payload.old) as Record<string, any>);
          setOrders((current) => {
            if (payload.eventType === 'INSERT') {
              if (current.some((order) => order.id === next.id)) return current;
              pendingSupabaseOrderIds.current.delete(next.id);
              soundFx.playNewOrderNotification();
              return [next, ...current];
            }
            if (payload.eventType === 'UPDATE') {
              return current.map((order) => (order.id === next.id ? next : order));
            }
            return current.filter((order) => order.id !== next.id);
          });
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Supabase Realtime connection failed:', status);
          }
        });
      return () => {
        active = false;
        authListener.subscription.unsubscribe();
        window.clearInterval(refreshTimer);
        void supabase.removeChannel(channel);
      };
    }

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
    if (supabase) pendingSupabaseOrderIds.current.add(orderId);

    // Play chime
    soundFx.playNewOrderNotification();

    // Supabase is the shared cross-device source when configured.
    if (!supabase) {
      setDoc(doc(db, 'orders', orderId), newOrder).catch((err) =>
        console.error('Failed to save order to Firestore:', err)
      );
    }
    void saveOrderToSupabase(newOrder);
    void syncOrderToApi(newOrder);

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

    if (!supabase) {
      setDoc(doc(db, 'orders', orderId), newOrder).catch((err) =>
        console.error('Failed to save caisse order to Firestore:', err)
      );
    }
    void saveOrderToSupabase(newOrder);
    void syncOrderToApi(newOrder);

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

    const paymentUpdates = {
      isPaid: true,
      paymentMethod,
      cashReceived: cashReceived !== undefined ? cashReceived : null,
      changeGiven: changeGiven !== undefined ? changeGiven : null,
      paidAt: new Date().toISOString(),
    };
    if (!supabase) {
      updateDoc(doc(db, 'orders', orderId), paymentUpdates).catch((err) => console.error('Failed to update order payment in Firestore:', err));
    }
    if (supabase) {
      void supabase.from('orders').update({ is_paid: true, payment_method: paymentMethod, cash_received: paymentUpdates.cashReceived, change_given: paymentUpdates.changeGiven, paid_at: paymentUpdates.paidAt }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Supabase payment update failed:', error.message);
      });
    }
    void syncOrderPatchToApi(orderId, {
      isPaid: true,
      paymentMethod,
      cashReceived: cashReceived !== undefined ? cashReceived : null,
      changeGiven: changeGiven !== undefined ? changeGiven : null,
      paidAt: new Date().toISOString(),
    });
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

    const statusUpdates = {
      status,
      statusUpdatedAt: new Date().toISOString(),
      estimatedMinutes: status === 'ready' ? 0 : status === 'preparing' ? 10 : 10,
    };
    if (!supabase) {
      updateDoc(doc(db, 'orders', orderId), { status, statusUpdatedAt: statusUpdates.statusUpdatedAt, estimatedMinutes: statusUpdates.estimatedMinutes }).catch((err) => console.error('Failed to update order status in Firestore:', err));
    }
    if (supabase) {
      void supabase.from('orders').update({ status, status_updated_at: statusUpdates.statusUpdatedAt, estimated_minutes: statusUpdates.estimatedMinutes }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Supabase status update failed:', error.message);
      });
    }
    void syncOrderPatchToApi(orderId, { status, statusUpdatedAt: new Date().toISOString() });

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

    if (!supabase) {
      deleteDoc(doc(db, 'orders', orderId)).catch((err) =>
        console.error('Failed to delete order from Firestore:', err)
      );
    } else void supabase.from('orders').delete().eq('id', orderId);
  };

  const clearAllOrders = () => {
    setOrders([]);
    setActiveCustomerOrderId(null);

    if (!supabase) {
      orders.forEach((o) => {
        deleteDoc(doc(db, 'orders', o.id)).catch(() => {});
      });
    } else void supabase.from('orders').delete().not('id', 'is', null);
  };

  const clearActiveOrder = () => {
    setActiveCustomerOrderId(null);
  };

  const activeCustomerOrder = orders.find((o) => o.id === activeCustomerOrderId);

  // Never expose a previous table's order when the same device scans a new table QR.
  useEffect(() => {
    if (
      tableNumber &&
      activeCustomerOrder &&
      (activeCustomerOrder.customerInfo.deliveryType !== 'sur_place' ||
        activeCustomerOrder.customerInfo.tableNumber !== tableNumber)
    ) {
      setActiveCustomerOrderId(null);
      setIsOrderTrackerOpen(false);
    }
  }, [tableNumber, activeCustomerOrder?.id, activeCustomerOrder?.customerInfo.tableNumber]);

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
