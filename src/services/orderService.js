import { db } from './firebase';
import {
  collection, addDoc, query, where,
  orderBy, updateDoc, doc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';

export const postOrder = async (orderData) => {
  return await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'open',
    createdAt: serverTimestamp(),
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
  });
};

export const getUserOrders = (uid, callback) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const acceptOrder = async (orderId, buyerData) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'accepted',
    buyer: buyerData,
    acceptedAt: serverTimestamp(),
  });
};

export const markEscrowed = async (orderId, paymentRef) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'escrowed',
    paymentRef,
    escrowedAt: serverTimestamp(),
  });
};

export const completeOrder = async (orderId) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
};
