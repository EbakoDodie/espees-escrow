import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './firebaseConfig';
import { COLORS } from './src/constants/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import P2POrderBookScreen from './src/screens/P2POrderBookScreen';
import EscrowPaymentScreen from './src/screens/EscrowPaymentScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, [initializing]);

  // Render Gold/Black activity loader during initial auth check
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Stack.Navigator
        initialRouteName={user ? "P2POrderBook" : "Login"}
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: COLORS.primary,
          },
          headerBackTitleVisible: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ title: 'E-Qub Login', headerShown: false }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: 'E-Qub KYC Registration' }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="P2POrderBook" 
              component={P2POrderBookScreen} 
              options={{ title: 'E-Qub P2P Orderbook', headerLeft: () => null }} 
            />
            <Stack.Screen 
              name="EscrowPayment" 
              component={EscrowPaymentScreen} 
              options={{ title: 'E-Qub Escrow Ledger' }} 
            />
            <Stack.Screen 
              name="ChatScreen" 
              component={ChatScreen} 
              options={{ title: 'E-Qub Trade Chat' }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: 'E-Qub Compliance Deck' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
