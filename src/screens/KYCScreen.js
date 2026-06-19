import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { submitKYC, uploadKYCDocument } from '../services/kycService';
import { AuthContext } from '../context/AuthContext';

const STEPS = ['Personal Info', 'ID Document', 'Upload Docs', 'Review'];

export default function KYCScreen({ navigation }) {
  const { user, profile, setProfile } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ idType: 'National ID', idNumber: '', bvn: '' });
  const [idFrontUri, setIdFrontUri] = useState(null);
  const [idBackUri, setIdBackUri] = useState(null);
  const [selfieUri, setSelfieUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // If already submitted, show status screen
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
            Your documents have been submitted and are currently being reviewed by our team.{'\n\n'}
            This process typically takes 24-48 hours. You will receive a notification once your identity has been verified.{'\n\n'}
            If you have questions, contact support@espees.org
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

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const takePhoto = async (setter) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!idFrontUri) return Alert.alert('Required', 'Please upload the front of your ID document.');
    setUploading(true);
    try {
      let idFrontUrl = '', idBackUrl = '', selfieUrl = '';
      idFrontUrl = await uploadKYCDocument(user.uid, idFrontUri, 'image', 'id_front');
      if (idBackUri) idBackUrl = await uploadKYCDocument(user.uid, idBackUri, 'image', 'id_back');
      if (selfieUri) selfieUrl = await uploadKYCDocument(user.uid, selfieUri, 'image', 'selfie');

      await submitKYC(user.uid, {
        kycData: { ...form, idFrontUrl, idBackUrl, selfieUrl }
      });
      setProfile(p => ({ ...p, kycStatus: 'submitted' }));
      Alert.alert('KYC Submitted!', 'Your documents are under review. You will be notified within 24-48 hours.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setUploading(false);
  };

  const ImageUploadBox = ({ uri, onPickLibrary, onTakePhoto, label }) => (
    <View style={styles.uploadBox}>
      {uri ? (
        <Image source={{ uri }} style={styles.uploadPreview} />
      ) : (
        <View style={styles.uploadPlaceholder}>
          <Text style={styles.uploadIcon}>📄</Text>
          <Text style={styles.uploadLabel}>{label}</Text>
        </View>
      )}
      <View style={styles.uploadBtns}>
        <TouchableOpacity style={styles.uploadBtn} onPress={onPickLibrary}>
          <Text style={styles.uploadBtnText}>📁 Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={onTakePhoto}>
          <Text style={styles.uploadBtnText}>📷 Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>KYC Verification</Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={styles.stepWrapper}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i <= step && { color: COLORS.textDark }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i === step && { color: COLORS.primary }]} numberOfLines={2}>{s}</Text>
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
                <Text style={styles.infoValue} numberOfLines={1}>{v || 'Not provided'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>ID Document Details</Text>
          <Text style={styles.stepDesc}>Select your ID type and enter your document number.</Text>
          <View style={styles.idTypeRow}>
            {['National ID', 'Passport', "Driver's License"].map(t => (
              <TouchableOpacity key={t} style={[styles.idChip, form.idType === t && styles.idChipActive]} onPress={() => update('idType', t)}>
                <Text style={[styles.idChipText, form.idType === t && { color: COLORS.textDark }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>ID Number</Text>
          <TextInput style={styles.input} value={form.idNumber} onChangeText={v => update('idNumber', v)} placeholder="Enter your ID number" placeholderTextColor={COLORS.textMuted} />
          <Text style={styles.label}>BVN / Tax ID (optional)</Text>
          <TextInput style={styles.input} value={form.bvn} onChangeText={v => update('bvn', v)} placeholder="Enter BVN or Tax ID" placeholderTextColor={COLORS.textMuted} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Upload Documents</Text>
          <Text style={styles.stepDesc}>Upload clear photos of your ID and a selfie holding it.</Text>

          <Text style={styles.uploadSectionLabel}>ID Front (Required)</Text>
          <ImageUploadBox
            uri={idFrontUri}
            onPickLibrary={() => pickImage(setIdFrontUri)}
            onTakePhoto={() => takePhoto(setIdFrontUri)}
            label="Upload front of your ID"
          />

          <Text style={styles.uploadSectionLabel}>ID Back (Optional)</Text>
          <ImageUploadBox
            uri={idBackUri}
            onPickLibrary={() => pickImage(setIdBackUri)}
            onTakePhoto={() => takePhoto(setIdBackUri)}
            label="Upload back of your ID"
          />

          <Text style={styles.uploadSectionLabel}>Selfie with ID (Optional but recommended)</Text>
          <ImageUploadBox
            uri={selfieUri}
            onPickLibrary={() => pickImage(setSelfieUri)}
            onTakePhoto={() => takePhoto(setSelfieUri)}
            label="Take a selfie holding your ID"
          />
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Review & Submit</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>ID Type</Text><Text style={styles.infoValue}>{form.idType}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>ID Number</Text><Text style={styles.infoValue}>{form.idNumber || '—'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>ID Front</Text><Text style={[styles.infoValue, { color: idFrontUri ? COLORS.success : COLORS.error }]}>{idFrontUri ? 'Uploaded ✓' : 'Not uploaded'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>ID Back</Text><Text style={[styles.infoValue, { color: idBackUri ? COLORS.success : COLORS.textMuted }]}>{idBackUri ? 'Uploaded ✓' : 'Not uploaded'}</Text></View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}><Text style={styles.infoLabel}>Selfie</Text><Text style={[styles.infoValue, { color: selfieUri ? COLORS.success : COLORS.textMuted }]}>{selfieUri ? 'Uploaded ✓' : 'Not uploaded'}</Text></View>
          </View>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>By submitting, you confirm all documents belong to you and the information is accurate.</Text>
          </View>
        </View>
      )}

      <View style={styles.btnRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.prevBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, step > 0 && { flex: 1 }]}
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator color={COLORS.textDark} />
            : <Text style={styles.btnText}>{step === STEPS.length - 1 ? 'Submit KYC' : 'Continue →'}</Text>
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
  infoLabel: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  idTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  idChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surfaceLight },
  idChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  idChipText: { color: COLORS.textMuted, fontSize: 13 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, color: COLORS.text, marginBottom: 16 },
  uploadSectionLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  uploadBox: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, overflow: 'hidden' },
  uploadPreview: { width: '100%', height: 160, resizeMode: 'cover' },
  uploadPlaceholder: { height: 120, justifyContent: 'center', alignItems: 'center' },
  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadLabel: { color: COLORS.textMuted, fontSize: 13 },
  uploadBtns: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  uploadBtn: { flex: 1, padding: 12, alignItems: 'center', borderRightWidth: 0.5, borderRightColor: COLORS.border },
  uploadBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  warningBox: { backgroundColor: COLORS.gold10, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.primary, marginTop: 16 },
  warningText: { color: COLORS.primary, fontSize: 13, lineHeight: 20 },
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
