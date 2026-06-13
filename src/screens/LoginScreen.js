import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../constants/colors';
import { loginUser } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>⚡ ESPEES</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your escrow account</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
          />
          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>
          <TouchableOpacity style={styles.kcBtn} onPress={() => Alert.alert('KingsChat', 'Enter your KingsChat Client ID in config.js to enable this feature.')}>
            <Text style={styles.kcBtnText}>👑 Login with KingsChat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={{ color: COLORS.primary }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 64 },
  header: { marginBottom: 40 },
  logo: { color: COLORS.primary, fontSize: 22, fontWeight: '900', letterSpacing: 4, marginBottom: 16 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 6 },
  form: { gap: 4 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 15, marginBottom: 16,
  },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 4 },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 13 },
  kcBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  kcBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  registerLink: { alignItems: 'center', marginTop: 28 },
  registerText: { color: COLORS.textMuted, fontSize: 14 },
});
