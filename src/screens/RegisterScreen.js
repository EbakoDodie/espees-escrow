import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { registerUser } from '../services/authService';

const COUNTRIES = ['Nigeria', 'Cameroon', 'Ghana', 'Kenya', 'South Africa', 'Uganda', 'USA', 'UK', 'Other'];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', dob: '', country: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.country)
      return Alert.alert('Error', 'Please fill all required fields');
    setLoading(true);
    try {
      await registerUser(form);
      Alert.alert('Success', 'Account created! Please verify your email then log in.');
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the Espees P2P marketplace</Text>

      {[
        { label: 'Full Name *', key: 'name', placeholder: 'John Doe' },
        { label: 'Email Address *', key: 'email', placeholder: 'you@example.com', type: 'email-address' },
        { label: 'Password *', key: 'password', placeholder: '••••••••', secure: true },
        { label: 'Phone / WhatsApp', key: 'phone', placeholder: '+234 800 000 0000', type: 'phone-pad' },
        { label: 'Date of Birth', key: 'dob', placeholder: 'DD/MM/YYYY' },
      ].map(field => (
        <View key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={form[field.key]}
            onChangeText={v => update(field.key, v)}
            placeholder={field.placeholder}
            placeholderTextColor={COLORS.textMuted}
            keyboardType={field.type || 'default'}
            secureTextEntry={field.secure || false}
            autoCapitalize="none"
          />
        </View>
      ))}

      <Text style={styles.label}>Country *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
        {COUNTRIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.countryChip, form.country === c && styles.countryChipActive]}
            onPress={() => update('country', c)}
          >
            <Text style={[styles.countryText, form.country === c && { color: COLORS.textDark }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
      </TouchableOpacity>
      <Text style={styles.terms}>
        By registering you agree to our{' '}
        <Text style={{ color: COLORS.primary }} onPress={() => navigation.navigate('Terms')}>Terms</Text> and{' '}
        <Text style={{ color: COLORS.primary }} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: COLORS.primary, fontSize: 16 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 28 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 15, marginBottom: 16,
  },
  countryChip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: COLORS.surfaceLight,
  },
  countryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  countryText: { color: COLORS.textMuted, fontSize: 13 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
  terms: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 20 },
});
