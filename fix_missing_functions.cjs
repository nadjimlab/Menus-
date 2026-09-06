const fs = require('fs');
let content = fs.readFileSync('src/context/OrderContext.tsx', 'utf8');

const lines = content.split('\n');

// Find the start of the messed up block.
// It is around line 380 in the current file:
//     // Supabase is the shared cross-device source when configured.
//     if (!supabase) {

const searchStr = `    // Supabase is the shared cross-device source when configured.`;
const startIndex = lines.findIndex(l => l.includes(searchStr));

if (startIndex === -1) {
  console.log("Could not find start");
  process.exit(1);
}

// Find the end of `void syncOrderPatchToApi` for the messed up block
let endIndex = -1;
for (let i = startIndex; i < lines.length; i++) {
  if (lines[i].includes('void syncOrderPatchToApi(orderId, {')) {
    // skip to the end of the syncOrderPatchToApi call block which is `  };` for the end of the function
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('  };')) {
        endIndex = j;
        break;
      }
    }
    break;
  }
}

if (endIndex === -1) {
  console.log("Could not find end");
  process.exit(1);
}

const replacementCode = `    if (!supabase) {
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
    const orderId = \`CT-C\${randomSuffix}\`;
    const fee = orderData.deliveryFee || 0;

    const newOrder: PlacedOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerInfo: {
        customerName: orderData.customerName || (orderData.deliveryType === 'sur_place' ? \`Table \${orderData.tableNumber || '1'}\` : 'Client Caisse'),
        customerPhone: orderData.customerPhone || '',
        deliveryType: orderData.deliveryType,
        tableNumber: orderData.tableNumber,
        deliveryAddress: orderData.deliveryType === 'sur_place' ? \`Table \${orderData.tableNumber || '1'}\` : 'Comptoir / Caisse',
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
          cashReceived,
          changeGiven,
          paidAt: new Date().toISOString(),
        };
      }
      return o;
    });
    setOrders(updated);

    if (!supabase) {
      updateDoc(doc(db, 'orders', orderId), {
        isPaid: true,
        paymentMethod,
        cashReceived: cashReceived !== undefined ? cashReceived : null,
        changeGiven: changeGiven !== undefined ? changeGiven : null,
        paidAt: new Date().toISOString(),
      }).catch((err) => console.error('Failed to mark order as paid in Firestore:', err));
    } else {
      void supabase.from('orders').update({
        is_paid: true,
        payment_method: paymentMethod,
        cash_received: cashReceived !== undefined ? cashReceived : null,
        change_given: changeGiven !== undefined ? changeGiven : null,
        paid_at: new Date().toISOString(),
      }).eq('id', orderId).then(({ error }) => {
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
  };`;

const newLines = [
  ...lines.slice(0, startIndex),
  replacementCode,
  ...lines.slice(endIndex + 1)
];

fs.writeFileSync('src/context/OrderContext.tsx', newLines.join('\n'));
