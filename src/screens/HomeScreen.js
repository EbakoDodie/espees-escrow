import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { profile } = useContext(AuthContext);
  const kycVerified = profile?.kycStatus === 'verified';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 56 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{profile?.name || 'User'} 👋</Text>
        </View>
        <View style={[styles.kycBadge, { backgroundColor: kycVerified ? 'rgba(34,197,94,0.15)' : COLORS.gold10 }]}>
          <Text style={[styles.kycText, { color: kycVerified ? COLORS.success : COLORS.primary }]}>
            {kycVerified ? '✓ KYC Verified' : '⚠ KYC Pending'}
          </Text>
        </View>
      </View>

      {!kycVerified && (
        <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('KYC')}>
          <Text style={styles.kycBannerTitle}>Complete KYC to start trading</Text>
          <Text style={styles.kycBannerSub}>Identity verification is required to post and accept orders</Text>
          <Text style={styles.kycBannerCta}>Complete Now →</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        {[{ label: 'Active Orders', value: '0', icon: '📋' }, { label: 'Completed', value: '0', icon: '✅' }].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {[
          { icon: '📈', label: 'Buy Espees', screen: 'P2P' },
          { icon: '📉', label: 'Sell Espees', screen: 'P2P' },
          { icon: '➕', label: 'Post Order', screen: 'PostOrder' },
          { icon: '📋', label: 'My Orders', screen: 'Orders' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.screen)}>
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { color: COLORS.textMuted, fontSize: 14 },
  name: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  kycBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  kycText: { fontSize: 12, fontWeight: '700' },
  kycBanner: { backgroundColor: COLORS.gold10, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 24 },
  kycBannerTitle: { color: COLORS.primary, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  kycBannerSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  kycBannerCta: { color: COLORS.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { color: COLORS.primary, fontSize: 28, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { fontSize: 32, marginBottom: 10 },
  actionLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
