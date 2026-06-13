import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/colors';

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => navigation.replace('Onboarding'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>⚡</Text>
        </View>
        <Text style={styles.title}>ESPEES</Text>
        <Text style={styles.subtitle}>ESCROW</Text>
        <Text style={styles.tagline}>Secure. Fast. Trustless.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  logo: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.gold10, borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  logoText: { fontSize: 48 },
  title: { color: COLORS.primary, fontSize: 36, fontWeight: '900', letterSpacing: 8 },
  subtitle: { color: COLORS.text, fontSize: 18, fontWeight: '300', letterSpacing: 12 },
  tagline: { color: COLORS.textMuted, fontSize: 13, marginTop: 12 },
});
