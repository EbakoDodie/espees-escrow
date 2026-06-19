import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { COLORS } from '../constants/colors';
import { submitKYC } from '../services/kycService';
import { AuthContext } from '../context/AuthContext';

const STEPS = ['Personal Info', 'ID Document', 'Review'];

export default function KYCScreen({ navigation }) {
  const { user, profile, setProfile } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ idType: 'National ID', idNumber: '', bvn: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (profile?.kycStatus === 'submitted') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>📋</Text>
          <Text style={styles.statusTitle}>KYC Under Review</Text>
          <Text style={styles.statusDesc}>
            Your documents have been submitted and are currently being reviewed.{'\n\n'}
            This typically takes 24-48 hours. You will receive a notification once verified.{'\n\n'}
            Questions? Contact support@espees.org
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>SUBMITTED — PENDING APPROVAL</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const handleSubmit = async () => {
    if (!form.idNumber.trim())
      return Alert.alert('Required', 'Please enter your ID number.');
    setSubmitting(true);
    try {
      await submitKYC(user.uid, { kycData: form });
      setProfile(p => ({ ...p, kycStatus: 'submitted' }));
      Alert.alert(
        'KYC Submitted!',
        'Your information has been submitted for review.\n\nPlease email your ID document photos to:\nkyc@espees.org\n\nSubject: KYC - ' + profile?.name,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
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
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Step 0 — Personal Info */}
      {step === 0 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Personal Information</Text>
          <Text style={styles.stepDesc}>
            Confirm your details match your official ID documents.
          </Text>
          <View style={styles.infoCard}>
            {[
              ['Name', profile?.name],
              ['Email', profile?.email],
              ['Country', profile?.country],
              ['Date of Birth', profile?.dob],
            ].map(([k, v]) => (
              <View key={k} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{k}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{v || 'Not provided'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Step 1 — ID Details */}
      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>ID Document</Text>
          <Text style={styles.stepDesc}>Select your ID type and enter your document number.</Text>

          <Text style={styles.label}>ID Type</Text>
          <View style={styles.idTypeRow}>
            {['National ID', 'Passport', "Driver's License"].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.idChip, form.idType === t && styles.idChipActive]}
                onPress={() => update('idType', t)}
              >
                <Text style={[styles.idChipText, form.idType === t && { color: COLORS.textDark }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>ID Number *</Text>
          <TextInput
            style={styles.input}
            value={form.idNumber}
            onChangeText={v => update('idNumber', v)}
            placeholder="Enter your ID number"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>BVN / Tax ID (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.bvn}
            onChangeText={v => update('bvn', v)}
            placeholder="Enter BVN or Tax ID"
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={styles.docNotice}>
            <Text style={styles.docNoticeTitle}>📎 Document Upload</Text>
            <Text style={styles.docNoticeText}>
              After submitting this form, please email clear photos of your ID document and a selfie holding it to:{'\n\n'}
              <Text style={{ color: COLORS.primary, fontWeight: '800' }}>kyc@espees.org</Text>{'\n\n'}
              Subject: KYC - {profile?.name}
            </Text>
          </View>
        </View>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Review & Submit</Text>
          <Text style={styles.stepDesc}>Check your details before submitting.</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{profile?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Country</Text>
              <Text style={styles.infoValue}>{profile?.country}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Type</Text>
              <Text style={styles.infoValue}>{form.idType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Number</Text>
              <Text style={styles.infoValue}>{form.idNumber || '—'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>BVN / Tax ID</Text>
              <Text style={styles.infoValue}>{form.bvn || '—'}</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>📎 Don't forget!</Text>
            <Text style={styles.warningText}>
              After tapping Submit, email your ID photos to:{'\n'}
              <Text style={{ color: COLORS.primary, fontWeight: '800' }}>kyc@espees.org</Text>{'\n'}
              Subject: KYC - {profile?.name}
            </Text>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.prevBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, step > 0 && { flex: 1 }]}
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.textDark} />
            : <Text style={styles.btnText}>
                {step === STEPS.length - 1 ? 'Submit KYC' : 'Continue →'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16 },
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
  infoLabel: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  idTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  idChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surfaceLight },
  idChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  idChipText: { color: COLORS.textMuted, fontSize: 13 },
  input: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, color: COLORS.text, marginBottom: 16 },
  docNotice: { backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#60A5FA', marginTop: 8 },
  docNoticeTitle: { color: '#60A5FA', fontWeight: '800', fontSize: 15, marginBottom: 8 },
  docNoticeText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 22 },
  warningBox: { backgroundColor: COLORS.gold10, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: COLORS.primary, marginTop: 16 },
  warningTitle: { color: COLORS.primary, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  warningText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 12 },
  prevBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 18, alignItems: 'center', paddingHorizontal: 20 },
  prevBtnText: { color: COLORS.textMuted, fontWeight: '700' },
  btn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  btnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
  statusCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: 24 },
  statusIcon: { fontSize: 56, marginBottom: 16 },
  statusTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  statusDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  statusBadge: { backgroundColor: COLORS.gold10, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primary },
  statusBadgeText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
  backBtn: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  backBtnText: { color: COLORS.textMuted, fontWeight: '700' },
});
