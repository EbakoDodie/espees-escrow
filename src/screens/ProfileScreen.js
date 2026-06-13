import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';
import { logoutUser } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const { profile, user } = useContext(AuthContext);
  const kycColors = { pending: COLORS.textMuted, submitted: COLORS.warning, verified: COLORS.success, rejected: COLORS.error };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logoutUser },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.emailBadge, { backgroundColor: user?.emailVerified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
          <Text style={{ color: user?.emailVerified ? COLORS.success : COLORS.error, fontSize: 12, fontWeight: '700' }}>
            {user?.emailVerified ? '✓ Email Verified' : '✗ Email Not Verified'}
          </Text>
        </View>
      </View>

      <View style={styles.kycCard}>
        <View style={styles.kycHeader}>
          <Text style={styles.kycTitle}>KYC Status</Text>
          <Text style={[styles.kycStatus, { color: kycColors[profile?.kycStatus] || COLORS.textMuted }]}>
            {profile?.kycStatus?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
        {profile?.kycStatus !== 'verified' && (
          <TouchableOpacity style={styles.kycBtn} onPress={() => navigation.navigate('KYC')}>
            <Text style={styles.kycBtnText}>
              {profile?.kycStatus === 'submitted' ? 'Under Review — Check Status' : 'Complete KYC →'}
            </Text>
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
  name: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { color: COLORS.textMuted, fontSize: 14, marginBottom: 12 },
  emailBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  kycCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  kycHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  kycTitle: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  kycStatus: { fontWeight: '800', fontSize: 14 },
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
