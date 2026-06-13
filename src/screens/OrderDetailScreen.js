import React, { useContext, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Linking, Modal
} from 'react-native';
import { COLORS } from '../constants/colors';
import { acceptOrder, markEscrowed, completeOrder, cancelOrder } from '../services/orderService';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/config';

export default function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params;
  const { user, profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isOwner = order.userId === user?.uid;
  const isBuyer = order.buyer?.uid === user?.uid;
  const total = (order.amount * order.rate).toLocaleString();
  const totalRaw = order.amount * order.rate;

  const statusColors = {
    open: COLORS.primary,
    accepted: COLORS.warning,
    escrowed: '#60A5FA',
    completed: COLORS.success,
    cancelled: COLORS.error,
  };

  const handleAccept = async () => {
    if (profile?.kycStatus !== 'verified')
      return Alert.alert('KYC Required', 'Complete and get your KYC verified before accepting orders.');

    Alert.alert(
      'Accept Order',
      `You are about to accept this ${order.type?.toUpperCase()} order.\n\n📦 Amount: ${order.amount} ESP\n💱 Rate: ${order.rate} ${order.currency}/ESP\n💰 Total: ${total} ${order.currency}\n\nAfter accepting you will be directed to make payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Proceed', onPress: async () => {
            setLoading(true);
            try {
              await acceptOrder(order.id, {
                uid: user.uid,
                name: profile.name,
                email: user.email,
                walletAddress: profile.walletAddress || '',
              });
              setLoading(false);
              // Show payment modal immediately after accepting
              setShowPaymentModal(true);
            } catch (e) {
              setLoading(false);
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const handlePayNow = async () => {
    const txRef = `ESCROW-${order.id}-${Date.now()}`;
    const paymentUrl = `https://checkout.flutterwave.com/v3/hosted/pay?` +
      `public_key=${CONFIG.FLUTTERWAVE_PUBLIC_KEY}` +
      `&tx_ref=${txRef}` +
      `&amount=${totalRaw}` +
      `&currency=${order.currency}` +
      `&customer_email=${user.email}` +
      `&customer_name=${encodeURIComponent(profile.name)}` +
      `&customization_title=Espees%20Escrow` +
      `&customization_description=P2P%20Escrow%20Payment%20for%20${order.amount}%20ESP`;

    try {
      await Linking.openURL(paymentUrl);
      // After browser opens, ask for confirmation when they return
      setTimeout(() => {
        Alert.alert(
          'Payment Confirmation',
          'Did you complete the payment on the Flutterwave page?',
          [
            { text: 'Not yet — go back', style: 'cancel' },
            {
              text: 'Yes, I paid ✓', onPress: async () => {
                setLoading(true);
                try {
                  await markEscrowed(order.id, txRef);
                  setShowPaymentModal(false);
                  setLoading(false);
                  Alert.alert(
                    '🔒 Payment Secured!',
                    'Your payment is now held in escrow.\n\nThe seller has been notified to send your Espees to your wallet.\n\nYou will receive a notification once the Espees are sent.',
                    [{ text: 'View My Orders', onPress: () => navigation.navigate('Orders') }]
                  );
                } catch (e) {
                  setLoading(false);
                  Alert.alert('Error', e.message);
                }
              }
            }
          ]
        );
      }, 4000);
    } catch (e) {
      Alert.alert('Error', 'Could not open payment page. Please try again.');
    }
  };

  const handleReleaseEspees = async () => {
    Alert.alert(
      'Release Espees to Buyer',
      `Confirm you have sent ${order.amount} ESP to:\n\n${order.buyer?.walletAddress || 'Buyer wallet not provided'}\n\nBuyer: ${order.buyer?.name}\n\nOnce you confirm, the payment of ${total} ${order.currency} will be released to you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Have Sent the Espees ✓', onPress: async () => {
            setLoading(true);
            try {
              await completeOrder(order.id);
              setLoading(false);
              Alert.alert(
                '🎉 Order Complete!',
                `Payment of ${total} ${order.currency} has been released to your account.\n\nThank you for trading on Espees Escrow!`,
                [{ text: 'View Orders', onPress: () => navigation.navigate('Orders') }]
              );
            } catch (e) {
              setLoading(false);
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Order', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await cancelOrder(order.id);
            setLoading(false);
            navigation.goBack();
          } catch (e) {
            setLoading(false);
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
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
      <Text style={styles.total}>Total: {total} {order.currency}</Text>

      {/* Status bar */}
      <View style={[styles.statusBar, {
        backgroundColor: (statusColors[order.status] || COLORS.textMuted) + '22',
        borderColor: statusColors[order.status] || COLORS.textMuted
      }]}>
        <Text style={[styles.statusText, { color: statusColors[order.status] || COLORS.textMuted }]}>
          {order.status === 'open' && '🟡 Open — Waiting for buyer'}
          {order.status === 'accepted' && '🟠 Accepted — Awaiting payment'}
          {order.status === 'escrowed' && '🔵 Payment secured in escrow'}
          {order.status === 'completed' && '✅ Order Completed'}
          {order.status === 'cancelled' && '❌ Cancelled'}
        </Text>
      </View>

      {/* Order Details */}
      <View style={styles.detailCard}>
        {[
          ['Posted by', order.userName],
          ['Country', order.userCountry],
          ['Rate', `${order.rate} ${order.currency}/ESP`],
          ['Total Value', `${total} ${order.currency}`],
          ['Espees Amount', `${order.amount} ESP`],
          ['Wallet Address', order.walletAddress],
          ['Notes', order.notes || 'None'],
        ].map(([label, val]) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{val || '—'}</Text>
          </View>
        ))}
        {order.buyer && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buyer</Text>
            <Text style={styles.detailValue}>{order.buyer.name}</Text>
          </View>
        )}
      </View>

      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 16 }} />}

      {/* === ACTION BUTTONS === */}

      {/* Open order — not owner — can accept */}
      {!isOwner && !isBuyer && order.status === 'open' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { order })}>
            <Text style={styles.chatBtnText}>💬 Chat with Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={loading}>
            <Text style={styles.acceptBtnText}>✓ Accept Order & Pay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Accepted — buyer needs to pay */}
      {isBuyer && order.status === 'accepted' && (
        <View style={styles.actions}>
          <View style={styles.paymentNotice}>
            <Text style={styles.paymentNoticeTitle}>💳 Payment Required</Text>
            <Text style={styles.paymentNoticeText}>
              You accepted this order. Please complete payment of{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{total} {order.currency}</Text>{' '}
              to secure the Espees in escrow.
            </Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { order })}>
            <Text style={styles.chatBtnText}>💬 Chat with Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payBtn} onPress={() => setShowPaymentModal(true)} disabled={loading}>
            <Text style={styles.payBtnText}>💳 Pay {total} {order.currency} Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Escrowed — seller needs to release */}
      {isOwner && order.status === 'escrowed' && (
        <View style={styles.actions}>
          <View style={[styles.escrowNotice, { borderColor: COLORS.primary }]}>
            <Text style={[styles.escrowNoticeTitle, { color: COLORS.primary }]}>⚡ Action Required</Text>
            <Text style={styles.escrowNoticeText}>
              Payment of <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{total} {order.currency}</Text> is secured in escrow.{'\n\n'}
              Send <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{order.amount} ESP</Text> to buyer's wallet:{'\n'}
              <Text style={{ color: COLORS.text }}>{order.buyer?.walletAddress || 'Not provided'}</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { order })}>
            <Text style={styles.chatBtnText}>💬 Chat with Buyer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleReleaseEspees} disabled={loading}>
            <Text style={styles.acceptBtnText}>✅ I've Sent the Espees — Release Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Escrowed — buyer waiting */}
      {isBuyer && order.status === 'escrowed' && (
        <View style={styles.escrowNotice}>
          <Text style={styles.escrowNoticeTitle}>🔒 Payment Secured</Text>
          <Text style={styles.escrowNoticeText}>
            Your payment is in escrow. Waiting for the seller to send your Espees.{'\n\n'}
            If no action in 24hrs, contact: support@espees.org
          </Text>
        </View>
      )}

      {/* Open — owner can cancel */}
      {isOwner && order.status === 'open' && (
        <View style={styles.actions}>
          <View style={styles.ownerNote}>
            <Text style={styles.ownerNoteText}>📢 This is your order. You'll be notified when someone accepts it.</Text>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'completed' && (
        <View style={[styles.escrowNotice, { borderColor: COLORS.success }]}>
          <Text style={[styles.escrowNoticeTitle, { color: COLORS.success }]}>🎉 Completed</Text>
          <Text style={styles.escrowNoticeText}>This order was completed successfully.</Text>
        </View>
      )}

      {/* === PAYMENT MODAL === */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Complete Payment</Text>

            <View style={styles.modalSummary}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Espees Amount</Text>
                <Text style={styles.modalValue}>{order.amount} ESP</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Rate</Text>
                <Text style={styles.modalValue}>{order.rate} {order.currency}/ESP</Text>
              </View>
              <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.modalLabel}>Total to Pay</Text>
                <Text style={[styles.modalValue, { color: COLORS.primary, fontSize: 20, fontWeight: '900' }]}>
                  {total} {order.currency}
                </Text>
              </View>
            </View>

            <View style={styles.modalSteps}>
              <Text style={styles.modalStepsTitle}>How it works:</Text>
              {[
                '1. Tap "Pay Now" below',
                '2. Complete payment on the secure Flutterwave page',
                '3. Return to the app and confirm payment',
                '4. Your funds are held in escrow until seller sends Espees',
                '5. Once Espees arrive in your wallet, payment is released to seller',
              ].map(step => (
                <Text key={step} style={styles.modalStep}>{step}</Text>
              ))}
            </View>

            <TouchableOpacity style={styles.payNowBtn} onPress={handlePayNow} disabled={loading}>
              {loading
                ? <ActivityIndicator color={COLORS.textDark} />
                : <Text style={styles.payNowBtnText}>💳 Pay {total} {order.currency} Now</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: COLORS.primary },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  typeText: { fontWeight: '800', fontSize: 12 },
  amount: { color: COLORS.text, fontSize: 48, fontWeight: '900' },
  rate: { color: COLORS.primary, fontSize: 18, marginBottom: 4 },
  total: { color: COLORS.textMuted, fontSize: 16, marginBottom: 20 },
  statusBar: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  statusText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  detailCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.textMuted, fontSize: 14 },
  detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  actions: { gap: 12 },
  chatBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  chatBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  acceptBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  acceptBtnText: { color: COLORS.textDark, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  payBtn: { backgroundColor: COLORS.success, borderRadius: 12, padding: 18, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: COLORS.error, fontWeight: '700' },
  ownerNote: { backgroundColor: COLORS.gold10, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.primary },
  ownerNoteText: { color: COLORS.primary, textAlign: 'center', fontSize: 14 },
  paymentNotice: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.warning, marginBottom: 4 },
  paymentNoticeTitle: { color: COLORS.warning, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  paymentNoticeText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
  escrowNotice: { backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#60A5FA', marginBottom: 12 },
  escrowNoticeTitle: { color: '#60A5FA', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  escrowNoticeText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141414', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, borderTopWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.primary, fontSize: 22, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  modalSummary: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalLabel: { color: COLORS.textMuted, fontSize: 14 },
  modalValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  modalSteps: { marginBottom: 24 },
  modalStepsTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  modalStep: { color: COLORS.textMuted, fontSize: 13, lineHeight: 24 },
  payNowBtn: { backgroundColor: COLORS.success, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  payNowBtnText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  modalCancelBtn: { padding: 14, alignItems: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontSize: 15 },
});
