import { db } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const submitKYC = async (uid, kycData) => {
  await updateDoc(doc(db, 'users', uid), {
    ...kycData,
    kycStatus: 'submitted',
    kycSubmittedAt: serverTimestamp(),
  });
};

export const updateKYCStep = async (uid, step) => {
  await updateDoc(doc(db, 'users', uid), { kycStep: step });
};
