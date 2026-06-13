import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';

const slides = [
  { icon: '🔐', title: 'Secure Escrow', desc: 'Your funds are held safely until both parties confirm the transaction is complete.' },
  { icon: '🌍', title: 'Global P2P Trading', desc: 'Buy and sell Espees with people from anywhere in the world, in your local currency.' },
  { icon: '⚡', title: 'Instant Settlement', desc: 'Once confirmed, Espees are sent directly to your wallet. No delays.' },
];

export default function OnboardingScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const { markOnboardingSeen } = useContext(AuthContext);

  const next = async () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      await markOnboardingSeen();
      navigation.replace('Login');
    }
  };

  const skip = async () => {
    await markOnboardingSeen();
    navigation.replace('Login');
  };

  const slide = slides[index];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </View>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <TouchableOpacity style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>{index === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'space-between' },
  skip: { alignSelf: 'flex-end', marginTop: 48 },
  skipText: { color: COLORS.textMuted, fontSize: 14 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  icon: { fontSize: 80, marginBottom: 32 },
  title: { color: COLORS.primary, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  desc: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 24 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 40 },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
});
