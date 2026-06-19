import { db, storage } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendLocalNotification } from './notificationService';

export const uploadKYCDocument = async (uid, fileUri, fileType, docType) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const fileName = `kyc/${uid}/${docType}_${Date.now()}.${fileType === 'image' ? 'jpg' : 'pdf'}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (e) {
    throw new Error('Failed to upload document: ' + e.message);
  }
};

export const submitKYC = async (uid, kycData) => {
  await updateDoc(doc(db, 'users', uid), {
    ...kycData,
    kycStatus: 'submitted',
    kycRejectionReason: null,
    kycSubmittedAt: serverTimestamp(),
  });
  await sendLocalNotification(
    'KYC Submitted',
    'Your KYC documents have been submitted for review. You will be notified within 24-48 hours.'
  );
};

export const updateKYCStep = async (uid, step) => {
  await updateDoc(doc(db, 'users', uid), { kycStep: step });
};
