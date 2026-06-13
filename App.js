import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { OrderProvider } from './src/context/OrderContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OrderProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#0A0A0A" />
            <AppNavigator />
          </NavigationContainer>
        </OrderProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
