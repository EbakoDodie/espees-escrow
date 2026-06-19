import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registerUser = async ({ name, email, password, phone, dob, country }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid, name, email, phone, dob, country,
    kycStatus: 'pending', kycStep: 0,
    emailVerified: false, walletAddress: '',
    createdAt: serverTimestamp(),
  });
  // Cache login session
  await AsyncStorage.setItem('lastLogin', Date.now().toString());
  return cred.user;
};

export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await AsyncStorage.setItem('lastLogin', Date.now().toString());
  return cred.user;
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('lastLogin');
  return signOut(auth);
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const isSessionValid = async () => {
  const lastLogin = await AsyncStorage.getItem('lastLogin');
  if (!lastLogin) return false;
  const elapsed = Date.now() - parseInt(lastLogin);
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  return elapsed < SEVEN_DAYS;
};
