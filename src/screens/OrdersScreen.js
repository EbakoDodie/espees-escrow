import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { COLORS } from '../constants/colors';
import { getAllUserOrders } from '../services/orderService';
import { AuthContext } from '../context/AuthContext';

const STATUS_COLORS = {
  open: COLORS.primary,
  accepted: COLORS.warning,
  escrowed: '#60A5FA',
  completed: COLORS.success,
  cancelled: COLORS.error,
};

const STATUS_ICONS = {
  open: '🟡',
  accepted: '🟠',
  escrowed: '🔵',
  completed: '✅',
  cancelled: '❌',
};

export default function OrdersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = getAllUserOrders(user.uid, setOrders);
    return unsub;
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const active = orders.filter(o => ['open', 'accepted', 'escrowed'].includes(o.status));
  const completed = orders.filter(o => ['completed', 'cancelled'].includes(o.status));
  const displayed = tab === 'active' ? active : completed;

  const formatDate = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <View style={styles.tabs}>
        {['active', 'history'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? `Active (${active.length})` : `History (${completed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={displayed}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders here yet</Text>
            <Text style={styles.emptySubText}>Pull down to refresh</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.status === 'escrowed' && styles.cardEscrowed]}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{STATUS_ICONS[item.status] || '⚪'}</Text>
                <View>
                  <Text style={styles.cardType}>
                    {item.role === 'buyer' ? '📥 Buying' : '📤 Selling'} · {item.amount} ESP
                  </Text>
                  <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.textMuted) + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.textMuted }]}>
                  {item.status?.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardRate}>{item.rate} {item.currency}/ESP</Text>
              <Text style={styles.cardTotal}>{(item.amount * item.rate).toLocaleString()} {item.currency}</Text>
            </View>
            {item.status === 'escrowed' && item.role === 'buyer' && (
              <View style={styles.actionRequired}>
                <Text style={styles.actionRequiredText}>⏳ Waiting for seller to send Espees</Text>
              </View>
            )}
            {item.status === 'escrowed' && item.role === 'seller' && (
              <View style={[styles.actionRequired, { backgroundColor: 'rgba(255,215,0,0.1)', borderColor: COLORS.primary }]}>
                <Text style={[styles.actionRequiredText, { color: COLORS.primary }]}>⚠️ Action Required: Send Espees to buyer</Text>
              </View>
            )}
            {item.status === 'accepted' && item.role === 'buyer' && (
              <View style={[styles.actionRequired, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: COLORS.warning }]}>
                <Text style={[styles.actionRequiredText, { color: COLORS.warning }]}>💳 Action Required: Complete payment</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', padding: 24, paddingTop: 56 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: COLORS.textDark },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardEscrowed: { borderColor: '#60A5FA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 24 },
  cardType: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  cardDate: { color: COLORS.textMuted, fontSize: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardRate: { color: COLORS.textMuted, fontSize: 13 },
  cardTotal: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  actionRequired: { backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 8, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#60A5FA' },
  actionRequiredText: { color: '#60A5FA', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
  emptySubText: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
});
