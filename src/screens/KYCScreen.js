import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { submitKYC } from '../services/kycService';
import { AuthContext } from '../context/AuthContext';

const STEPS = ['Personal Info', 'ID Document', 'Selfie Check', 'Review'];

export default function KYCScreen({ navigation }) {
  const { user, profile, setProfile } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ idType: 'National ID', idNumber: '', bvn: '' });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    try {
      await submitKYC(user.uid, { kycData: form });
      setProfile(p => ({ ...p, kycStatus: 'submitted' }));
      Alert.alert('KYC Submitted', 'Your documents are under review. This takes 24–48 hours.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>KYC Verification</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={styles.stepWrapper}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i <= step && { color: COLORS.textDark }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i === step && { color: COLORS.primary }]}>{s}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      {step === 0 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Personal Information</Text>
          <Text style={styles.stepDesc}>Confirm your details match your official ID documents.</Text>
          <View style={styles.infoCard}>
            {[['Name', profile?.name], ['Email', profile?.email], ['Country', profile?.country], ['Date of Birth', profile?.dob]].map(([k, v]) => (
              <View key={k} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{k}</Text>
                <Text style={styles.infoValue}>{v || 'Not provided'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>ID Document</Text>
          <Text style={styles.stepDesc}>Select your ID type and enter your document number.</Text>
          <View style={styles.idTypeRow}>
            {['National ID', 'Passport', "Driver's License"].map(t => (
              <TouchableOpacity key={t} style={[styles.idChip, form.idType === t && styles.idChipActive]} onPress={() => update('idType', t)}>
                <Text style={[styles.idChipText, form.idType === t && { color: COLORS.textDark }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>ID Number</Text>
          <TextInput style={styles.input} value={form.idNumber} onChangeText={v => update('idNumber', v)} placeholder="Enter ID number" placeholderTextColor={COLORS.textMuted} />
          <Text style={styles.label}>BVN / Tax ID (optional)</Text>
          <TextInput style={styles.input} value={form.bvn} onChangeText={v => update('bvn', v)} placeholder="Enter BVN or Tax ID" placeholderTextColor={COLORS.textMuted} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Selfie Check</Text>
          <Text style={styles.stepDesc}>Take a selfie holding your ID. This confirms you are the owner.</Text>
          <View style={styles.selfieBox}>
            <Text style={styles.selfieIcon}>📸</Text>
            <Text style={styles.selfieText}>Selfie upload coming soon</Text>
            <Text style={styles.selfieSubtext}>Contact support@espees.org to submit manually</Text>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Review & Submit</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>ID Type</Text><Text style={styles.infoValue}>{form.idType}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>ID Number</Text><Text style={styles.infoValue}>{form.idNumber || '—'}</Text></View>
          </View>
        </View>
      )}

      <View style={styles.btnRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, step > 0 && { flex: 1 }]} onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}>
          <Text style={styles.btnText}>{step === STEPS.length - 1 ? 'Submit KYC' : 'Continue →'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.primary },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 28 },
  progressContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 32 },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  stepLabel: { color: COLORS.textMuted, fontSize: 9, textAlign: 'center' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginTop: 14 },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepContent: { marginBottom: 32 },
  stepTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  stepDesc: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 22 },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.textMuted, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  idTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  idChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surfaceLight },
  idChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  idChipText: { color: COLORS.textMuted, fontSize: 13 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, color: COLORS.text, marginBottom: 16 },
  selfieBox: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' },
  selfieIcon: { fontSize: 48, marginBottom: 12 },
  selfieText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  selfieSubtext: { color: COLORS.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12 },
  backBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 18, alignItems: 'center', paddingHorizontal: 24 },
  backBtnText: { color: COLORS.textMuted, fontWeight: '700' },
  btn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
});
