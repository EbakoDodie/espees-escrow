import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Modal, FlatList
} from 'react-native';
import { COLORS } from '../constants/colors';
import { COUNTRIES } from '../constants/countries';
import { registerUser } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', dob: '', country: '' });
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

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
        { label: 'Phone / WhatsApp', key: 'phone', placeholder: '+237 600 000 000', type: 'phone-pad' },
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
      <TouchableOpacity style={styles.countrySelector} onPress={() => setShowCountryPicker(true)}>
        <Text style={form.country ? styles.countrySelectorText : styles.countrySelectorPlaceholder}>
          {form.country || 'Select your country...'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By registering you agree to our{' '}
        <Text style={{ color: COLORS.primary }} onPress={() => navigation.navigate('Terms')}>Terms</Text> and{' '}
        <Text style={{ color: COLORS.primary }} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
      </Text>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search country..."
              placeholderTextColor={COLORS.textMuted}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, form.country === item && styles.countryItemActive]}
                  onPress={() => { update('country', item); setShowCountryPicker(false); setCountrySearch(''); }}
                >
                  <Text style={[styles.countryItemText, form.country === item && { color: COLORS.textDark }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  countrySelector: {
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  countrySelectorText: { color: COLORS.text, fontSize: 15 },
  countrySelectorPlaceholder: { color: COLORS.textMuted, fontSize: 15 },
  dropdownArrow: { color: COLORS.textMuted, fontSize: 12 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
  terms: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  modalClose: { color: COLORS.textMuted, fontSize: 20 },
  searchInput: {
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, color: COLORS.text, marginBottom: 12,
  },
  countryItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  countryItemActive: { backgroundColor: COLORS.primary, borderRadius: 8 },
  countryItemText: { color: COLORS.text, fontSize: 15 },
});
