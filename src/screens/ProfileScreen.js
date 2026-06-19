import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';
import { logoutUser } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const { profile, user, setProfile } = useContext(AuthContext);
  const kycColors = { pending: COLORS.textMuted, submitted: COLORS.warning, verified: COLORS.success, rejected: COLORS.error };

  const handleRefresh = async () => {
    try {
      await user.reload();
      setProfile(p => ({ ...p, emailVerified: user.emailVerified }));
      Alert.alert('Refreshed', user.emailVerified ? 'Email is now verified!' : 'Email not verified yet. Check your inbox and spam folder.');
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logoutUser },
    ]);
  };

  const kycStatusMessage = () => {
    switch (profile?.kycStatus) {
      case 'verified': return null;
      case 'submitted': return { text: 'Your documents are under review. We will notify you within 24-48 hours.', color: COLORS.warning };
      case 'rejected': return { text: `Rejected: ${profile?.kycRejectionReason || 'Please resubmit with clearer documents.'}`, color: COLORS.error };
      default: return { text: 'Complete KYC verification to start trading.', color: COLORS.textMuted };
    }
  };

  const kycMsg = kycStatusMessage();

  const kycBtnLabel = () => {
    switch (profile?.kycStatus) {
      case 'submitted': return null; // No button when submitted
      case 'rejected': return 'Resubmit KYC →';
      case 'verified': return null;
      default: return 'Complete KYC →';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{profile?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          style={[styles.emailBadge, { backgroundColor: user?.emailVerified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}
        >
          <Text style={{ color: user?.emailVerified ? COLORS.success : COLORS.error, fontSize: 12, fontWeight: '700' }}>
            {user?.emailVerified ? '✓ Email Verified' : '✗ Tap to refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kycCard}>
        <View style={styles.kycHeader}>
          <Text style={styles.kycTitle}>KYC Status</Text>
          <Text style={[styles.kycStatus, { color: kycColors[profile?.kycStatus] || COLORS.textMuted }]}>
            {profile?.kycStatus?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
        {kycMsg && (
          <View style={[styles.kycMsgBox, { backgroundColor: kycMsg.color + '18', borderColor: kycMsg.color }]}>
            <Text style={[styles.kycMsgText, { color: kycMsg.color }]}>{kycMsg.text}</Text>
          </View>
        )}
        {kycBtnLabel() && (
          <TouchableOpacity style={styles.kycBtn} onPress={() => navigation.navigate('KYC')}>
            <Text style={styles.kycBtnText}>{kycBtnLabel()}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoCard}>
        {[['Country', profile?.country], ['Phone', profile?.phone], ['Date of Birth', profile?.dob]].map(([k, v]) => (
          <View key={k} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{k}</Text>
            <Text style={styles.infoValue}>{v || '—'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.menuList}>
        {[
          { icon: '🔒', label: 'Privacy Policy', screen: 'PrivacyPolicy' },
          { icon: '📜', label: 'Terms & Conditions', screen: 'Terms' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 28 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.textDark },
  name: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 4, maxWidth: '80%', textAlign: 'center' },
  email: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  emailBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  kycCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  kycHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kycTitle: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  kycStatus: { fontWeight: '800', fontSize: 14 },
  kycMsgBox: { borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  kycMsgText: { fontSize: 13, lineHeight: 20 },
  kycBtn: { backgroundColor: COLORS.gold10, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  kycBtnText: { color: COLORS.primary, fontWeight: '700' },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.textMuted, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  menuList: { gap: 8, marginBottom: 32 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 18, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { color: COLORS.text, flex: 1, fontSize: 15 },
  menuArrow: { color: COLORS.textMuted, fontSize: 20 },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: COLORS.error, borderRadius: 12, padding: 18, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontWeight: '800', fontSize: 16 },
});
