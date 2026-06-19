import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';
import { getAllUserOrders } from '../services/orderService';

export default function HomeScreen({ navigation }) {
  const { profile, user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const kycVerified = profile?.kycStatus === 'verified';

  useEffect(() => {
    if (!user) return;
    const unsub = getAllUserOrders(user.uid, setOrders);
    return unsub;
  }, [user]);

  const active = orders.filter(o => ['open', 'accepted', 'escrowed'].includes(o.status));
  const completed = orders.filter(o => o.status === 'completed');

  const actionRequired = orders.filter(o =>
    (o.status === 'accepted' && o.role === 'buyer') ||
    (o.status === 'escrowed' && o.role === 'seller')
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 24, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
    >
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
          <Text style={styles.kycBannerTitle}>
            {profile?.kycStatus === 'rejected' ? '❌ KYC Rejected — Resubmit' :
             profile?.kycStatus === 'submitted' ? '📋 KYC Under Review' :
             'Complete KYC to start trading'}
          </Text>
          <Text style={styles.kycBannerSub}>
            {profile?.kycStatus === 'rejected' && profile?.kycRejectionReason
              ? `Reason: ${profile.kycRejectionReason}`
              : 'Identity verification required to post and accept orders'}
          </Text>
          <Text style={styles.kycBannerCta}>
            {profile?.kycStatus === 'submitted' ? 'View Status →' : 'Complete Now →'}
          </Text>
        </TouchableOpacity>
      )}

      {actionRequired.length > 0 && (
        <TouchableOpacity style={styles.actionBanner} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.actionBannerTitle}>⚡ {actionRequired.length} Order{actionRequired.length > 1 ? 's' : ''} Needs Action</Text>
          <Text style={styles.actionBannerSub}>Tap to view and complete your pending orders</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        {[
          { label: 'Active Orders', value: active.length, icon: '📋', color: COLORS.primary },
          { label: 'Completed', value: completed.length, icon: '✅', color: COLORS.success },
        ].map(s => (
          <TouchableOpacity key={s.label} style={styles.statCard} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
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
  kycBanner: { backgroundColor: COLORS.gold10, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
  kycBannerTitle: { color: COLORS.primary, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  kycBannerSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  kycBannerCta: { color: COLORS.primary, fontWeight: '700' },
  actionBanner: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: COLORS.error, borderRadius: 16, padding: 16, marginBottom: 16 },
  actionBannerTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  actionBannerSub: { color: COLORS.textMuted, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { fontSize: 32, marginBottom: 10 },
  actionLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
