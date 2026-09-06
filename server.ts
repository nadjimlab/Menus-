import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- API ROUTES ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', database: 'firebase' });
});

// Bridge for OLD cached mobile clients and fallback API
let _db: any = null;
function getDb() {
  if (_db) return _db;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const fbApp = getApps().length === 0 ? initializeApp(configJson) : getApps()[0];
      try {
        _db = initializeFirestore(fbApp, { ignoreUndefinedProperties: true }, configJson.firestoreDatabaseId || undefined);
      } catch {
        _db = getFirestore(fbApp, configJson.firestoreDatabaseId || undefined);
      }
      return _db;
    }
  } catch (err) {
    console.error('Failed to init Firebase in server:', err);
  }
  return null;
}

// GET all orders from Firestore
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const database = getDb();
    if (database) {
      const q = query(collection(database, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const orders: any[] = [];
      snapshot.forEach((d) => orders.push(d.data()));
      res.json({ success: true, orders });
      return;
    }
  } catch (err) {
    console.error('Bridge GET /api/orders error:', err);
  }
  res.status(500).json({ success: false, orders: [] });
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const database = getDb();
    const newOrder = req.body;
    if (database && newOrder && newOrder.id) {
      // Strip undefined keys just in case
      const cleanOrder = JSON.parse(JSON.stringify(newOrder));
      await setDoc(doc(database, 'orders', newOrder.id), cleanOrder);
      res.status(201).json({ success: true, order: cleanOrder });
      return;
    }
  } catch (err) {
    console.error('Bridge POST /api/orders error:', err);
  }
  res.status(400).json({ success: false });
});

app.patch('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const database = getDb();
    const updates = req.body;
    if (database) {
      const cleanUpdates = JSON.parse(JSON.stringify(updates));
      await updateDoc(doc(database, 'orders', req.params.id), cleanUpdates);
      res.json({ success: true });
      return;
    }
  } catch (err) {
    console.error('Bridge PATCH error:', err);
  }
  res.status(400).json({ success: false });
});

app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const database = getDb();
    if (database && req.params.id) {
      await deleteDoc(doc(database, 'orders', req.params.id));
      res.json({ success: true, deleted: req.params.id });
      return;
    }
  } catch (err) {
    console.error('Bridge DELETE /api/orders/:id error:', err);
  }
  res.status(400).json({ success: false });
});

app.delete('/api/orders', async (_req: Request, res: Response) => {
  try {
    const database = getDb();
    if (database) {
      const snapshot = await getDocs(collection(database, 'orders'));
      const batchDeletes: Promise<void>[] = [];
      snapshot.forEach((d) => {
        batchDeletes.push(deleteDoc(doc(database, 'orders', d.id)));
      });
      await Promise.all(batchDeletes);
      res.json({ success: true, count: batchDeletes.length });
      return;
    }
  } catch (err) {
    console.error('Bridge DELETE ALL error:', err);
  }
  res.status(500).json({ success: false });
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
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CHENEB TACOS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
