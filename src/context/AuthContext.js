import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { registerForPushNotifications, sendLocalNotification } from '../services/notificationService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const profileUnsubRef = useRef(null);
  const prevKycStatusRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then(val => {
      if (val === 'true') setHasSeenOnboarding(true);
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await AsyncStorage.setItem('lastLogin', Date.now().toString());
        await registerForPushNotifications(firebaseUser.uid);

        if (profileUnsubRef.current) profileUnsubRef.current();
        profileUnsubRef.current = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (prevKycStatusRef.current && prevKycStatusRef.current !== data.kycStatus) {
                if (data.kycStatus === 'verified') {
                  sendLocalNotification('KYC Approved!', 'Your identity is verified. You can now trade.');
                } else if (data.kycStatus === 'rejected') {
                  const reason = data.kycRejectionReason || 'Please resubmit with clearer documents.';
                  sendLocalNotification('KYC Rejected', `Reason: ${reason}`);
                }
              }
              prevKycStatusRef.current = data.kycStatus;
              setProfile(data);
            }
          }
        );
      } else {
        if (profileUnsubRef.current) profileUnsubRef.current();
        setUser(null);
        setProfile(null);
        prevKycStatusRef.current = null;
      }
      setLoading(false);
    });
    return () => { unsub(); if (profileUnsubRef.current) profileUnsubRef.current(); };
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasSeenOnboarding, markOnboardingSeen, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
