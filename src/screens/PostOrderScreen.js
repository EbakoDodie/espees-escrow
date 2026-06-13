import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { postOrder } from '../services/orderService';
import { AuthContext } from '../context/AuthContext';

const CURRENCIES = ['NGN', 'XAF', 'GHS', 'KES', 'USD'];

export default function PostOrderScreen({ navigation }) {
  const { user, profile } = useContext(AuthContext);
  const [form, setForm] = useState({ type: 'sell', amount: '', rate: '', currency: 'NGN', walletAddress: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePost = async () => {
    if (!form.amount || !form.rate || !form.walletAddress)
      return Alert.alert('Error', 'Please fill amount, rate, and wallet address');
    if (profile?.kycStatus !== 'verified')
      return Alert.alert('KYC Required', 'Complete KYC verification before posting orders');
    setLoading(true);
    try {
      await postOrder({ ...form, userId: user.uid, userName: profile.name, userCountry: profile.country });
      Alert.alert('Success', 'Your order has been posted!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Post an Order</Text>

      <Text style={styles.label}>Order Type</Text>
      <View style={styles.typeRow}>
        {['buy', 'sell'].map(t => (
          <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]} onPress={() => update('type', t)}>
            <Text style={[styles.typeBtnText, form.type === t && { color: COLORS.textDark }]}>
              {t === 'buy' ? '📈 Buy Espees' : '📉 Sell Espees'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {[
        { label: 'Amount (ESP)', key: 'amount', placeholder: 'e.g. 500', type: 'numeric' },
        { label: 'Your Rate (per ESP)', key: 'rate', placeholder: 'e.g. 650', type: 'numeric' },
        { label: 'Wallet Address', key: 'walletAddress', placeholder: 'Your Espees wallet address' },
        { label: 'Additional Notes (optional)', key: 'notes', placeholder: 'Payment method preferences...' },
      ].map(f => (
        <View key={f.key}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={form[f.key]}
            onChangeText={v => update(f.key, v)}
            placeholder={f.placeholder}
            placeholderTextColor={COLORS.textMuted}
            keyboardType={f.type || 'default'}
          />
        </View>
      ))}

      <Text style={styles.label}>Currency</Text>
      <View style={styles.currencyRow}>
        {CURRENCIES.map(c => (
          <TouchableOpacity key={c} style={[styles.currencyChip, form.currency === c && styles.currencyChipActive]} onPress={() => update('currency', c)}>
            <Text style={[styles.currencyText, form.currency === c && { color: COLORS.textDark }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handlePost} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Posting...' : 'Post Order'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.primary },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 28 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '700' },
  input: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 15, marginBottom: 20 },
  currencyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
  currencyChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.surfaceLight },
  currencyChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyText: { color: COLORS.textMuted, fontWeight: '600' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
});
