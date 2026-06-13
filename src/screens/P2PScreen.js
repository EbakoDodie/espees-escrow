import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { getOpenOrders } from '../services/orderService';

export default function P2PScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = getOpenOrders(setOrders);
    return unsub;
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.type === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>P2P Marketplace</Text>
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
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={styles.emptyText}>No open orders yet</Text>
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
            <Text style={styles.orderRate}>Rate: <Text style={{ color: COLORS.primary }}>{item.rate} {item.currency}/ESP</Text></Text>
            <Text style={styles.orderSeller}>by {item.userName} · {item.userCountry}</Text>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
              <Text style={styles.acceptBtnText}>View & Accept →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  postBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: COLORS.textDark },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontWeight: '800', fontSize: 12 },
  orderAmount: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  orderRate: { color: COLORS.textMuted, fontSize: 14, marginBottom: 4 },
  orderSeller: { color: COLORS.textMuted, fontSize: 13, marginBottom: 16 },
  acceptBtn: { backgroundColor: COLORS.gold10, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  acceptBtnText: { color: COLORS.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, marginBottom: 20 },
  postFirstBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  postFirstText: { color: COLORS.textDark, fontWeight: '700' },
});
