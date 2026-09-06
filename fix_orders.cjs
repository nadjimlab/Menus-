const fs = require('fs');
let content = fs.readFileSync('src/context/OrderContext.tsx', 'utf8');

const regex = /if \(\!supabase\) \{[\s\S]*?updateDoc\([\s\S]*?\}\n\s*void supabase\.from\('orders'\)\.update\([\s\S]*?\}\);\n\s*\}/;

const replacement = `if (!supabase) {
      updateDoc(doc(db, 'orders', orderId), { status, statusUpdatedAt: statusUpdates.statusUpdatedAt, estimatedMinutes: statusUpdates.estimatedMinutes }).catch((err) => console.error('Failed to update order status in Firestore:', err));
    } else {
      void supabase.from('orders').update({ status, status_updated_at: statusUpdates.statusUpdatedAt, estimated_minutes: statusUpdates.estimatedMinutes }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Supabase status update failed:', error.message);
      });
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/context/OrderContext.tsx', content);
