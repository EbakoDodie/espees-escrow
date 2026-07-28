import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';
import { COLORS, SPACING } from '../constants/theme';
import CountryDropdown from '../components/CountryDropdown';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  // Auth state
  const isUserLoggedIn = !!auth.currentUser;

  // Account Form State (only for registration)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');

  // KYC details (for logged in user)
  const [country, setCountry] = useState('Nigeria');
  const [zone, setZone] = useState('');
  const [church, setChurch] = useState('');
  const [pastorName, setPastorName] = useState('');
  
  // Bank Details (required for Flutterwave Automated Escrow Payouts)
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Document Upload State
  const [kycDocUri, setKycDocUri] = useState(null);
  const [kycDocName, setKycDocName] = useState('');
  const [kycStatus, setKycStatus] = useState('NOT_STARTED'); // NOT_STARTED, PENDING_APPROVAL, APPROVED, REJECTED
  const [hasPastorDetails, setHasPastorDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    // Check if logged in user already has a pending KYC
    const fetchExistingKyc = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setLoadingProfile(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.kycStatus) setKycStatus(data.kycStatus);
            if (data.fullName) setFullName(data.fullName);
            if (data.pastorName) setPastorName(data.pastorName);
            if (data.zone) setZone(data.zone);
            if (data.church) setChurch(data.church);
            if (data.country) setCountry(data.country);
            if (data.contact) setContact(data.contact);
            if (data.bankName) setBankName(data.bankName);
            if (data.accountNumber) setAccountNumber(data.accountNumber);
            if (data.accountName) setAccountName(data.accountName);
            if (data.kycDocumentName) setKycDocName(data.kycDocumentName);
            if (data.hasPastorDetails !== undefined) setHasPastorDetails(data.hasPastorDetails);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    fetchExistingKyc();
  }, [isUserLoggedIn]);

  // Handle Pick KYC Document (ID / Selfie)
  const handlePickKycDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const docAsset = result.assets[0];
        setKycDocUri(docAsset.uri);
        setKycDocName(docAsset.name);
        Alert.alert('File Selected', `"${docAsset.name}" selected as KYC document.`);
      }
    } catch (err) {
      console.error('Document Picker Error:', err);
      Alert.alert('Upload Error', 'Could not select document. Please try again.');
    }
  };

  // Google Sign-In on Registration
  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      Alert.alert(
        'Google Registration',
        'Simulating Google registration flow...',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          {
            text: 'Proceed as Google User',
            onPress: async () => {
              try {
                const mockEmail = `google.${Date.now()}@equb.org`;
                const mockPassword = 'GoogleSecurePass2026!';
                const userCred = await createUserWithEmailAndPassword(auth, mockEmail, mockPassword);
                const user = userCred.user;
                
                await updateProfile(user, { displayName: 'John Doe (Google)' });

                const userPayload = {
                  uid: user.uid,
                  email: mockEmail,
                  fullName: 'John Doe (Google)',
                  contact: '',
                  country: 'Nigeria',
                  zone: '',
                  church: '',
                  pastorName: '',
                  hasPastorDetails: false,
                  kycStatus: 'NOT_STARTED',
                  canSell: false,
                  createdAt: new Date().toISOString(),
                  destinationWallet: 'ESP_' + user.uid.substring(0, 10).toUpperCase()
                };

                await setDoc(doc(db, 'users', user.uid), userPayload);
                Alert.alert('Google Registered', 'Account created! Now please complete your KYC.');
              } catch (e) {
                console.error(e);
                Alert.alert('Google Registration Error', e.message);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Create User Account (Stage 1)
  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Email, Password, and Full Name.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName.trim() });

      const userPayload = {
        uid: user.uid,
        email: email.trim(),
        fullName: fullName.trim(),
        contact: contact.trim(),
        country: country,
        zone: '',
        church: '',
        pastorName: '',
        hasPastorDetails: false,
        kycStatus: 'NOT_STARTED',
        canSell: false,
        createdAt: new Date().toISOString(),
        destinationWallet: 'ESP_' + user.uid.substring(0, 10).toUpperCase()
      };

      await setDoc(doc(db, 'users', user.uid), userPayload);
      Alert.alert('Account Created', 'Your account has been created! Please complete KYC below to enable trading.');
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Registration Failed', error.message || 'Unable to create profile.');
    } finally {
      setLoading(false);
    }
  };

  // Submit KYC Details (Stage 2)
  const handleSubmitKyc = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to submit KYC.');
      return;
    }

    if (!zone.trim() || !church.trim() || !bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Zone Name, Church Name, and Bank/MoMo payment details.');
      return;
    }

    if (!kycDocUri && !kycDocName) {
      Alert.alert('Missing Document', 'Please upload a Government ID card or Selfie screenshot.');
      return;
    }

    setLoading(true);
    try {
      let documentUrl = '';

      // Upload file to Firebase Storage if a new one was selected
      if (kycDocUri) {
        const response = await fetch(kycDocUri);
        const blob = await response.blob();
        const fileRef = ref(storage, `kyc_documents/${currentUser.uid}/${kycDocName}`);
        await uploadBytes(fileRef, blob);
        documentUrl = await getDownloadURL(fileRef);
      }

      const hasPastor = !!pastorName.trim();
      const userDocRef = doc(db, 'users', currentUser.uid);

      await updateDoc(userDocRef, {
        country: country,
        zone: zone.trim(),
        church: church.trim(),
        pastorName: pastorName.trim(),
        hasPastorDetails: hasPastor,
        kycStatus: 'PENDING_APPROVAL',
        kycDocumentName: kycDocName,
        kycDocumentUrl: documentUrl || null,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        kycSubmittedAt: new Date().toISOString()
      });

      setKycStatus('PENDING_APPROVAL');
      setHasPastorDetails(hasPastor);
      Alert.alert(
        'KYC Submitted',
        'Your verification documents have been securely uploaded. Platform admins will review them shortly.'
      );
    } catch (err) {
      console.error('KYC Submission Error:', err);
      Alert.alert('Submission Error', err.message || 'Failed to submit KYC details.');
    } finally {
      setLoading(false);
    }
  };

  // Simulation Admin Approval
  const handleSimulateAdminAction = async (status) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const isApproved = status === 'APPROVED';
      const hasPastor = !!pastorName.trim();
      
      await updateDoc(userDocRef, {
        kycStatus: status,
        canSell: isApproved && hasPastor
      });

      setKycStatus(status);
      Alert.alert('Simulated Admin Action', `KYC Status updated to: ${status}. Selling Privilege: ${isApproved && hasPastor ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to simulate admin action.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching member details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Layout Guard: Header uses flex-shrink and numberOfLines */}
        <View style={styles.flexibleHeaderContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerBadge} numberOfLines={1} style={styles.headerBadgeText}>E-QUB COMPLIANCE DECK</Text>
            <View style={[styles.kycStatusBadge, { backgroundColor: kycStatus === 'APPROVED' ? COLORS.success : kycStatus === 'PENDING_APPROVAL' ? COLORS.warning : COLORS.danger }]}>
              <Text style={styles.kycStatusBadgeText}>{kycStatus}</Text>
            </View>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.flexibleMemberName} numberOfLines={1} ellipsizeMode="tail">
              {fullName ? `Profile: ${fullName}` : 'Register Account'}
            </Text>
          </View>
        </View>

        {/* 1. If Not Logged In: Show Account Creation Form */}
        {!isUserLoggedIn ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>Create Account</Text>
            
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Brother Chidi Okonkwo"
              placeholderTextColor={COLORS.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="member@loveworld.org"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Contact Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+234 800 000 0000"
              placeholderTextColor={COLORS.textSecondary}
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />

            <CountryDropdown 
              selectedCountry={country} 
              onSelect={(val) => setCountry(val)} 
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleCreateAccount}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textDark} />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>Register with Google</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 2. Logged In: Show KYC details or locked status card */
          <View>
            {kycStatus === 'PENDING_APPROVAL' ? (
              <View style={styles.lockedKycCard}>
                <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.lockedKycTitle}>Verification Under Review</Text>
                <Text style={styles.lockedKycSubtitle}>
                  Your identity files have been securely submitted. Compliance check is underway. Forms are temporarily locked.
                </Text>

                <View style={styles.detailsSummary}>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Zone:</Text> {zone}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Church:</Text> {church}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Pastor:</Text> {pastorName || 'None Provided'}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Bank:</Text> {bankName}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Account:</Text> {accountNumber}</Text>
                </View>

                {/* Simulated Admin Console */}
                <View style={styles.adminConsole}>
                  <Text style={styles.adminConsoleTitle}>Simulation Controls (Sandbox)</Text>
                  <View style={styles.adminButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.adminBtn, { backgroundColor: COLORS.success }]}
                      onPress={() => handleSimulateAdminAction('APPROVED')}
                    >
                      <Text style={styles.adminBtnText}>Approve KYC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.adminBtn, { backgroundColor: COLORS.danger }]}
                      onPress={() => handleSimulateAdminAction('REJECTED')}
                    >
                      <Text style={styles.adminBtnText}>Reject KYC</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : kycStatus === 'APPROVED' ? (
              <View style={styles.lockedKycCard}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} style={{ marginBottom: 12 }} />
                <Text style={[styles.lockedKycTitle, { color: COLORS.success }]}>KYC Approved & Active</Text>
                <Text style={styles.lockedKycSubtitle}>
                  You have full trade validation. {hasPastorDetails ? 'Espees Selling privileges are ENABLED.' : 'Espees Selling privileges are LOCKED (No Pastor Details provided).'}
                </Text>

                <View style={styles.detailsSummary}>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Zone:</Text> {zone}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Church:</Text> {church}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Pastor:</Text> {pastorName || 'None (Selling Locked)'}</Text>
                  <Text style={styles.summaryItem}><Text style={styles.boldText}>Bank Details:</Text> {bankName} - {accountNumber}</Text>
                </View>

                {/* Simulated Reset */}
                <TouchableOpacity 
                  style={[styles.submitButton, { backgroundColor: COLORS.primary }]}
                  onPress={() => handleSimulateAdminAction('NOT_STARTED')}
                >
                  <Text style={styles.submitButtonText}>Reset Verification Form</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // NOT_STARTED or REJECTED: Show Form
              <View style={styles.formCard}>
                {kycStatus === 'REJECTED' && (
                  <View style={styles.rejectedBanner}>
                    <Ionicons name="alert-circle" size={20} color={COLORS.background} />
                    <Text style={styles.rejectedText}>Previous submission rejected. Please correct and re-upload.</Text>
                  </View>
                )}

                <Text style={styles.sectionHeader}>Loveworld Affiliation Info</Text>
                
                <Text style={styles.label}>Loveworld Zone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Lagos Zone 5 / Celz5"
                  placeholderTextColor={COLORS.textSecondary}
                  value={zone}
                  onChangeText={setZone}
                />

                <Text style={styles.label}>Local Church *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Christ Embassy Lekki"
                  placeholderTextColor={COLORS.textSecondary}
                  value={church}
                  onChangeText={setChurch}
                />

                <Text style={styles.label}>Pastor's Full Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pastor Deola Phillips"
                  placeholderTextColor={COLORS.textSecondary}
                  value={pastorName}
                  onChangeText={setPastorName}
                />
                <Text style={styles.helpText}>
                  Note: Providing Pastor details in KYC is required to enable Espees selling privileges.
                </Text>

                <Text style={styles.sectionHeader}>Bank Details (For automated payout withdrawals)</Text>
                
                <Text style={styles.label}>Bank / MoMo Provider *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. GTBank or MTN MoMo"
                  placeholderTextColor={COLORS.textSecondary}
                  value={bankName}
                  onChangeText={setBankName}
                />

                <Text style={styles.label}>Account Number / Wallet Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0123456789 or 0541234567"
                  placeholderTextColor={COLORS.textSecondary}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Account Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={COLORS.textSecondary}
                  value={accountName}
                  onChangeText={setAccountName}
                />

                <Text style={styles.sectionHeader}>ID Verification File</Text>
                <TouchableOpacity 
                  style={styles.docUploadButton}
                  onPress={handlePickKycDocument}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.docUploadText} numberOfLines={1}>
                    {kycDocName ? `Selected: ${kycDocName}` : 'Select ID Card / Selfie Upload (PDF or Image)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSubmitKyc}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.textDark} />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit KYC Documents</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  centerLoading: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    marginTop: 10,
    fontSize: 14,
  },
  flexibleHeaderContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  kycStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kycStatusBadgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexibleMemberName: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionHeader: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingBottom: SPACING.xs,
  },
  label: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 15,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: -8,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  docUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  docUploadText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
  },
  googleButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  lockedKycCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  lockedKycTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  lockedKycSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  detailsSummary: {
    backgroundColor: COLORS.surfaceLight,
    width: '100%',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  summaryItem: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  adminConsole: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  adminConsoleTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  adminButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  adminBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  adminBtnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  rejectedBanner: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rejectedText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
});
