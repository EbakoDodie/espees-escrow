import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdbGmZjVXL28WDsyAcraF9X0NYDbfILow",
  authDomain: "espees-escrow.firebaseapp.com",
  projectId: "espees-escrow",
  storageBucket: "espees-escrow.firebasestorage.app",
  messagingSenderId: "210226702411",
  appId: "1:210226702411:web:d67d900612e1deae4cc5ce"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
