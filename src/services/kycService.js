import { db } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendLocalNotification } from './notificationService';

export const submitKYC = async (uid, kycData) => {
  await updateDoc(doc(db, 'users', uid), {
    ...kycData,
    kycStatus: 'submitted',
    kycRejectionReason: null,
    kycSubmittedAt: serverTimestamp(),
  });
  await sendLocalNotification(
    'KYC Submitted',
    'Your KYC has been submitted. You will be notified within 24-48 hours.'
  );
};

export const updateKYCStep = async (uid, step) => {
  await updateDoc(doc(db, 'users', uid), { kycStep: step });
};
