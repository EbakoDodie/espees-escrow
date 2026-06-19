import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';
import { getOpenOrders } from '../services/orderService';

export default function P2PScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = getOpenOrders((data) => {
      setOrders(data);
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    });
    return unsub;
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Real-time listener auto-updates; just show refreshing briefly
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.type === filter);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>P2P Marketplace</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>Live · Updated {formatTime(lastUpdated)}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('PostOrder')}>
          <Text style={styles.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['all', 'buy', 'sell'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, filter === t && styles.tabActive]} onPress={() => setFilter(t)}>
            <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
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
              <Text style={styles.emptyIcon}>🔄</Text>
              <Text style={styles.emptyText}>No open orders yet</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
              <TouchableOpacity style={styles.postFirstBtn} onPress={() => navigation.navigate('PostOrder')}>
                <Text style={styles.postFirstText}>Post the first order</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
              <View style={styles.orderHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                  <Text style={[styles.typeText, { color: item.type === 'buy' ? COLORS.success : COLORS.error }]}>
                    {item.type?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.orderAmount}>{item.amount} ESP</Text>
              </View>
              <Text style={styles.orderRate}>
                Rate: <Text style={{ color: COLORS.primary }}>{item.rate} {item.currency}/ESP</Text>
              </Text>
              <Text style={styles.orderTotal}>
                Total: <Text style={{ color: COLORS.text }}>{(item.amount * item.rate).toLocaleString()} {item.currency}</Text>
              </Text>
              <Text style={styles.orderSeller}>by {item.userName} · {item.userCountry}</Text>
              {item.notes ? <Text style={styles.orderNotes}>💬 {item.notes}</Text> : null}
              <TouchableOpacity style={styles.acceptBtn} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
                <Text style={styles.acceptBtnText}>View & Accept →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Live indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  lastUpdated: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  postBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: COLORS.textDark },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: COLORS.textMuted, fontSize: 14 },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontWeight: '800', fontSize: 12 },
  orderAmount: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  orderRate: { color: COLORS.textMuted, fontSize: 14, marginBottom: 2 },
  orderTotal: { color: COLORS.textMuted, fontSize: 14, marginBottom: 4 },
  orderSeller: { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
  orderNotes: { color: COLORS.textMuted, fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
  acceptBtn: { backgroundColor: COLORS.gold10, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginTop: 8 },
  acceptBtnText: { color: COLORS.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, marginBottom: 4 },
  emptySubText: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20 },
  postFirstBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  postFirstText: { color: COLORS.textDark, fontWeight: '700' },
  liveIndicator: { position: 'absolute', top: 62, right: 110, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 10, fontWeight: '800' },
});
