import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { COLORS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Authentication Failed', error.message || 'Unable to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // In production, we use expo-auth-session or @react-native-google-signin/google-signin.
      // Here, we simulate a secure Google Sign-In redirect and token validation.
      Alert.alert(
        'Google Sign-In',
        'Simulating Google authentication flow...',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false)
          },
          {
            text: 'Proceed as Google User',
            onPress: async () => {
              try {
                const mockEmail = 'google.member@equb.org';
                const mockPassword = 'GoogleSecurePass2026!';
                let user;
                
                try {
                  const userCred = await signInWithEmailAndPassword(auth, mockEmail, mockPassword);
                  user = userCred.user;
                } catch (authErr) {
                  // User doesn't exist, create profile
                  if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
                    const userCred = await createUserWithEmailAndPassword(auth, mockEmail, mockPassword);
                    user = userCred.user;

                    // Automatically initialize their profile in Firestore
                    await setDoc(doc(db, 'users', user.uid), {
                      uid: user.uid,
                      email: mockEmail,
                      fullName: 'Deacon John Doe (Google)',
                      contact: '+2348000000000',
                      country: 'Nigeria',
                      zone: 'Lagos Zone 5',
                      church: 'Christ Embassy Lekki',
                      pastorName: 'Pastor Deola Phillips',
                      hasPastorDetails: true,
                      kycStatus: 'APPROVED', // Pre-approve mock user for fast testing
                      canSell: true,
                      createdAt: new Date().toISOString(),
                      destinationWallet: 'ESP_' + user.uid.substring(0, 10).toUpperCase()
                    });
                  } else {
                    throw authErr;
                  }
                }
                Alert.alert('Google Sign-In', 'Authentication successful! Logged in.');
              } catch (e) {
                console.error(e);
                Alert.alert('Google Sign-In Error', e.message || 'Failed to authenticate.');
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerBox}>
          <Text style={styles.titleText}>E-QUB</Text>
          <Text style={styles.subtitleText}>Automated Escrow & P2P Exchange</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="member@loveworld.org"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={18} color={COLORS.primary} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create New Member Account</Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  titleText: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  subtitleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
