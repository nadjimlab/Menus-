import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- API ROUTES ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', database: 'firebase' });
});

// Bridge for OLD cached mobile clients
let _db: any = null;
function getDb() {
  if (_db) return _db;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const fbApp = getApps().length === 0 ? initializeApp(configJson) : getApps()[0];
      _db = getFirestore(fbApp, configJson.firestoreDatabaseId || undefined);
      return _db;
    }
  } catch (err) {
    console.error('Failed to init Firebase in server:', err);
  }
  return null;
}

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const database = getDb();
    const newOrder = req.body;
    if (database && newOrder && newOrder.id) {
      await setDoc(doc(database, 'orders', newOrder.id), newOrder);
      res.status(201).json({ success: true, order: newOrder });
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
      await updateDoc(doc(database, 'orders', req.params.id), updates);
      res.json({ success: true });
      return;
    }
  } catch (err) {
    console.error('Bridge PATCH error:', err);
  }
  res.status(400).json({ success: false });
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
