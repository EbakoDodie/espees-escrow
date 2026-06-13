import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { getUserOrders } from '../services/orderService';
import { AuthContext } from '../context/AuthContext';

const STATUS_COLORS = {
  open: COLORS.primary, accepted: COLORS.warning,
  escrowed: '#60A5FA', completed: COLORS.success, cancelled: COLORS.error,
};

export default function OrdersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (!user) return;
    const unsub = getUserOrders(user.uid, setOrders);
    return unsub;
  }, [user]);

  const active = orders.filter(o => ['open', 'accepted', 'escrowed'].includes(o.status));
  const completed = orders.filter(o => ['completed', 'cancelled'].includes(o.status));
  const displayed = tab === 'active' ? active : completed;

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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders here yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>{item.type?.toUpperCase()} · {item.amount} ESP</Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.textMuted) + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.textMuted }]}>
                  {item.status?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.cardRate}>{item.rate} {item.currency}/ESP · {(item.amount * item.rate).toLocaleString()} {item.currency} total</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardType: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardRate: { color: COLORS.textMuted, fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
});
