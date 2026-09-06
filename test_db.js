const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    const res = await setDoc(doc(db, 'orders', 'test-order'), { test: 123 });
    console.log("Write success!");
  } catch (e) {
    console.error("Write failed:", e);
  }
}
test();
