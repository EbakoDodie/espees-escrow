import { db } from './firebase';
import {
  collection, addDoc, query, where,
  orderBy, updateDoc, doc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { sendLocalNotification } from './notificationService';

export const postOrder = async (orderData) => {
  return await addDoc(collection(db, 'orders'), {
    ...orderData, status: 'open', createdAt: serverTimestamp(),
  });
};

export const getOpenOrders = (callback) => {
  const q = query(
    collection(db, 'orders'),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => callback([]));
};

export const getAllUserOrders = (uid, callback) => {
  let sellerOrders = [];
  let buyerOrders = [];

  const unsubSeller = onSnapshot(
    query(collection(db, 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    snap => {
      sellerOrders = snap.docs.map(d => ({ id: d.id, role: 'seller', ...d.data() }));
      const merged = [...sellerOrders, ...buyerOrders].sort((a, b) =>
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(merged);
    }
  );

  const unsubBuyer = onSnapshot(
    query(collection(db, 'orders'), where('buyer.uid', '==', uid), orderBy('createdAt', 'desc')),
    snap => {
      buyerOrders = snap.docs.map(d => ({ id: d.id, role: 'buyer', ...d.data() }));
      const merged = [...sellerOrders, ...buyerOrders].sort((a, b) =>
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(merged);
    }
  );

  return () => { unsubSeller(); unsubBuyer(); };
};

export const acceptOrder = async (orderId, buyerData) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'accepted', buyer: buyerData, acceptedAt: serverTimestamp(),
  });
  await sendLocalNotification('Order Accepted', 'Proceed to payment to secure the escrow.');
};

export const markEscrowed = async (orderId, paymentRef, proofUrl = '') => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'escrowed', paymentRef, paymentProofUrl: proofUrl, escrowedAt: serverTimestamp(),
  });
  await sendLocalNotification('Payment Secured', 'Your payment is in escrow. Seller has been notified.');
};

export const completeOrder = async (orderId, espeesTxHash = '') => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'completed', espeesTxHash, completedAt: serverTimestamp(),
  });
  await sendLocalNotification('Order Complete!', 'The Espees have been sent. Payment released.');
};

export const cancelOrder = async (orderId) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'cancelled', cancelledAt: serverTimestamp(),
  });
};
