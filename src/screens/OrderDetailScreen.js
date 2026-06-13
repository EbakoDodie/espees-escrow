import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { acceptOrder } from '../services/orderService';
import { AuthContext } from '../context/AuthContext';

export default function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params;
  const { user, profile } = useContext(AuthContext);
  const isOwner = order.userId === user?.uid;

  const handleAccept = async () => {
    if (profile?.kycStatus !== 'verified')
      return Alert.alert('KYC Required', 'Verify your identity before accepting orders');
    try {
      await acceptOrder(order.id, { uid: user.uid, name: profile.name, email: user.email });
      Alert.alert('Order Accepted', 'The seller has been notified. Proceed to payment.');
      navigation.navigate('Orders');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={[styles.typeBadge, { backgroundColor: order.type === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
        <Text style={[styles.typeText, { color: order.type === 'buy' ? COLORS.success : COLORS.error }]}>
          {order.type?.toUpperCase()} ORDER
        </Text>
      </View>
      <Text style={styles.amount}>{order.amount} ESP</Text>
      <Text style={styles.rate}>@ {order.rate} {order.currency}/ESP</Text>

      <View style={styles.detailCard}>
        {[
          { label: 'Posted by', value: order.userName },
          { label: 'Country', value: order.userCountry },
          { label: 'Total Value', value: `${(order.amount * order.rate).toLocaleString()} ${order.currency}` },
          { label: 'Wallet Address', value: order.walletAddress },
          { label: 'Notes', value: order.notes || 'None' },
          { label: 'Status', value: order.status?.toUpperCase() },
        ].map(d => (
          <View key={d.label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{d.label}</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{d.value}</Text>
          </View>
        ))}
      </View>

      {!isOwner && order.status === 'open' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { order })}>
            <Text style={styles.chatBtnText}>💬 Chat with Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <Text style={styles.acceptBtnText}>✓ Accept Order</Text>
          </TouchableOpacity>
        </View>
      )}
      {isOwner && (
        <View style={styles.ownerNote}>
          <Text style={styles.ownerNoteText}>This is your order. You'll be notified when someone accepts it.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56 },
  back: { marginBottom: 24 },
  backText: { color: COLORS.primary },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  typeText: { fontWeight: '800', fontSize: 12 },
  amount: { color: COLORS.text, fontSize: 48, fontWeight: '900' },
  rate: { color: COLORS.primary, fontSize: 18, marginBottom: 32 },
  detailCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 32 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.textMuted, fontSize: 14 },
  detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  actions: { gap: 12 },
  chatBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  chatBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  acceptBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  acceptBtnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 16 },
  ownerNote: { backgroundColor: COLORS.gold10, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.primary },
  ownerNoteText: { color: COLORS.primary, textAlign: 'center', fontSize: 14 },
});
