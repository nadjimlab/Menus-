import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent storage file
const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial demo seed orders if file does not exist
const INITIAL_DEMO_ORDERS = [
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
    isPaid: true,
    paymentMethod: 'cash',
    source: 'table',
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
    isPaid: true,
    paymentMethod: 'baridimob',
    source: 'online',
  },
];

let orders: any[] = [];

// Load orders from disk or initialize
try {
  if (fs.existsSync(ORDERS_FILE)) {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    orders = JSON.parse(raw);
  } else {
    orders = [...INITIAL_DEMO_ORDERS];
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  }
} catch (err) {
  console.error('Failed to load orders file, using memory seed:', err);
  orders = [...INITIAL_DEMO_ORDERS];
}

function saveOrdersToDisk() {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Failed to save orders to disk:', err);
  }
}

// SSE (Server-Sent Events) connected clients
const sseClients = new Set<Response>();

function broadcastSse(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ordersCount: orders.length, connectedClients: sseClients.size });
});

// SSE Stream for Real-Time Synchronization across Phones, Tablets, and PCs
app.get('/api/orders/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial orders payload
  res.write(`event: INIT\ndata: ${JSON.stringify({ orders })}\n\n`);

  sseClients.add(res);

  // Keep-alive ping every 20 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// GET all orders
app.get('/api/orders', (_req: Request, res: Response) => {
  res.json({ success: true, orders });
});

// POST new order (placed from Table QR scan, web, or caisse)
app.post('/api/orders', (req: Request, res: Response) => {
  const newOrder = req.body;
  if (!newOrder || !newOrder.id) {
    res.status(400).json({ success: false, error: 'Invalid order payload' });
    return;
  }

  // Prepend new order to list
  orders = [newOrder, ...orders.filter((o) => o.id !== newOrder.id)];
  saveOrdersToDisk();

  // Broadcast to all connected screens (Admin laptop, kitchen, caisse, other phones)
  broadcastSse('ORDERS_UPDATED', { orders, newOrder });
  broadcastSse('NEW_ORDER', { order: newOrder });

  res.status(201).json({ success: true, order: newOrder });
});

// PATCH order status or payment
app.patch('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveOrdersToDisk();

  broadcastSse('ORDERS_UPDATED', { orders, updatedOrder: orders[index] });
  if (updates.status) {
    broadcastSse('STATUS_CHANGED', { orderId: id, status: updates.status, order: orders[index] });
  }

  res.json({ success: true, order: orders[index] });
});

// DELETE single order
app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  orders = orders.filter((o) => o.id !== id);
  saveOrdersToDisk();

  broadcastSse('ORDERS_UPDATED', { orders, deletedId: id });
  res.json({ success: true });
});

// DELETE / CLEAR all orders
app.delete('/api/orders', (_req: Request, res: Response) => {
  orders = [];
  saveOrdersToDisk();

  broadcastSse('ORDERS_UPDATED', { orders: [] });
  res.json({ success: true });
});

// --- VITE MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CHENEB TACOS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
