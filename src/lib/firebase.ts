import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  projectId: configJson.projectId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  appId: configJson.appId,
  measurementId: configJson.measurementId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = (() => {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true }, configJson.firestoreDatabaseId || undefined);
  } catch {
    return getFirestore(app, configJson.firestoreDatabaseId || undefined);
  }
})();

