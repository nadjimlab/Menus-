const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importLines = `
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
`;

const routeLines = `
// Bridge for OLD cached mobile clients
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const fbApp = initializeApp(configJson, 'bridge-app');
      const db = getFirestore(fbApp, configJson.firestoreDatabaseId || undefined);
      
      const newOrder = req.body;
      if (newOrder && newOrder.id) {
        await setDoc(doc(db, 'orders', newOrder.id), newOrder);
        res.status(201).json({ success: true, order: newOrder });
        return;
      }
    }
  } catch (err) {
    console.error('Bridge POST /api/orders error:', err);
  }
  res.status(400).json({ success: false });
});

app.patch('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const fbApp = initializeApp(configJson, 'bridge-app-patch');
      const db = getFirestore(fbApp, configJson.firestoreDatabaseId || undefined);
      
      const updates = req.body;
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'orders', req.params.id), updates);
      res.json({ success: true });
      return;
    }
  } catch (err) {
    console.error('Bridge PATCH error:', err);
  }
  res.status(400).json({ success: false });
});
`;

code = code.replace("import { createServer as createViteServer } from 'vite';", "import { createServer as createViteServer } from 'vite';\n" + importLines);
code = code.replace("// --- VITE MIDDLEWARE", routeLines + "\n// --- VITE MIDDLEWARE");

fs.writeFileSync('server.ts', code);
