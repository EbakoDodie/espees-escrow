import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { postOrder } from '../services/orderService';
import { AuthContext } from '../context/AuthContext';

const CURRENCIES = ['XAF', 'NGN', 'GHS', 'KES', 'USD', 'EUR', 'GBP'];
const CURRENCY_RATES = { XAF: 650, NGN: 1500, GHS: 15, KES: 130, USD: 1, EUR: 0.92, GBP: 0.79 };

export default function PostOrderScreen({ navigation }) {
  const { user, profile } = useContext(AuthContext);
  const [form, setForm] = useState({ type: 'sell', amount: '', rate: '', currency: 'XAF', walletAddress: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const suggestedRate = CURRENCY_RATES[form.currency] || 650;
  const total = form.amount && form.rate ? (parseFloat(form.amount) * parseFloat(form.rate)).toLocaleString() : '0';

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

      <Text style={styles.label}>Currency</Text>
      <View style={styles.currencyRow}>
        {CURRENCIES.map(c => (
          <TouchableOpacity key={c}
            style={[styles.currencyChip, form.currency === c && styles.currencyChipActive]}
            onPress={() => { update('currency', c); update('rate', CURRENCY_RATES[c]?.toString() || ''); }}
          >
            <Text style={[styles.currencyText, form.currency === c && { color: COLORS.textDark }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rateHint}>
        <Text style={styles.rateHintText}>💡 Suggested rate for {form.currency}: {suggestedRate} {form.currency}/ESP</Text>
      </View>

      <Text style={styles.label}>Amount (ESP)</Text>
      <TextInput
        style={styles.input}
        value={form.amount}
        onChangeText={v => update('amount', v)}
        placeholder="e.g. 500"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Rate ({form.currency} per ESP)</Text>
      <TextInput
        style={styles.input}
        value={form.rate.toString()}
        onChangeText={v => update('rate', v)}
        placeholder={`e.g. ${suggestedRate}`}
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
      />

      {form.amount && form.rate && (
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Order Total</Text>
          <Text style={styles.totalValue}>{total} {form.currency}</Text>
        </View>
      )}

      <Text style={styles.label}>Your Espees Wallet Address</Text>
      <TextInput
        style={styles.input}
        value={form.walletAddress}
        onChangeText={v => update('walletAddress', v)}
        placeholder="Your wallet address"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={form.notes}
        onChangeText={v => update('notes', v)}
        placeholder="e.g. Preferred payment: MoMo, Orange Money..."
        placeholderTextColor={COLORS.textMuted}
        multiline
      />

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
  backText: { color: COLORS.primary, fontSize: 16 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 28 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '700' },
  currencyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  currencyChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.surfaceLight },
  currencyChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyText: { color: COLORS.textMuted, fontWeight: '600' },
  rateHint: { backgroundColor: COLORS.gold10, borderRadius: 10, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: COLORS.primary },
  rateHintText: { color: COLORS.primary, fontSize: 12 },
  input: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 15, marginBottom: 20 },
  totalBox: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: COLORS.textMuted, fontSize: 14 },
  totalValue: { color: COLORS.primary, fontSize: 16, fontWeight: '900' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
});
