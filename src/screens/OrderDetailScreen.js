import React, { useContext, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Linking, Modal, TextInput, Clipboard
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
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [espeesTxHash, setEspeesTxHash] = useState('');

  const isOwner = order.userId === user?.uid;
  const isBuyer = order.buyer?.uid === user?.uid;
  const total = (order.amount * order.rate).toLocaleString();
  const totalRaw = order.amount * order.rate;

  const statusColors = {
    open: COLORS.primary, accepted: COLORS.warning,
    escrowed: '#60A5FA', completed: COLORS.success, cancelled: COLORS.error,
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Wallet address copied to clipboard.');
  };

  const handleAccept = async () => {
    if (profile?.kycStatus !== 'verified')
      return Alert.alert('KYC Required', 'Complete and get your KYC verified before accepting orders.');
    if (!profile?.walletAddress)
      return Alert.alert('Wallet Required', 'Please add your Espees wallet address in your profile before accepting orders.');

    Alert.alert(
      'Accept Order',
      `Accept this ${order.type?.toUpperCase()} order?\n\n📦 Amount: ${order.amount} ESP\n💱 Rate: ${order.rate} ${order.currency}/ESP\n💰 Total: ${total} ${order.currency}\n\nYou will be directed to payment immediately after.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Pay', onPress: async () => {
            setLoading(true);
            try {
              await acceptOrder(order.id, {
                uid: user.uid, name: profile.name,
                email: user.email, walletAddress: profile.walletAddress || '',
              });
              setLoading(false);
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
    const paymentUrl =
      `https://checkout.flutterwave.com/v3/hosted/pay` +
      `?public_key=${CONFIG.FLUTTERWAVE_PUBLIC_KEY}` +
      `&tx_ref=${txRef}` +
      `&amount=${totalRaw}` +
      `&currency=${order.currency}` +
      `&customer[email]=${user.email}` +
      `&customer[name]=${encodeURIComponent(profile.name)}` +
      `&customization[title]=Espees%20Escrow` +
      `&customization[description]=Escrow%20Payment%20for%20${order.amount}%20ESP`;

    try {
      await Linking.openURL(paymentUrl);
      setTimeout(() => {
        Alert.alert(
          'Payment Confirmation',
          'Did you complete the payment on Flutterwave?',
          [
            { text: 'Not yet', style: 'cancel' },
            {
              text: 'Yes, I paid', onPress: async () => {
                setLoading(true);
                try {
                  await markEscrowed(order.id, txRef);
                  setShowPaymentModal(false);
                  setLoading(false);
                  Alert.alert(
                    'Payment Secured!',
                    'Your payment is in escrow. The seller has been notified to send your Espees.',
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
      }, 4000);
    } catch (e) {
      Alert.alert('Error', 'Could not open payment page. Please try again.');
    }
  };

  const handleReleaseEspees = async () => {
    if (!espeesTxHash.trim())
      return Alert.alert('Required', 'Please enter the transaction hash or ID as proof that you sent the Espees.');

    Alert.alert(
      'Confirm Release',
      `You confirm you sent ${order.amount} ESP to:\n${order.buyer?.walletAddress || 'Not provided'}\n\nTransaction proof: ${espeesTxHash}\n\nPayment of ${total} ${order.currency} will be released to you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Release', onPress: async () => {
            setLoading(true);
            try {
              await completeOrder(order.id, espeesTxHash);
              setShowReleaseModal(false);
              setLoading(false);
              Alert.alert(
                'Order Complete!',
                `Payment of ${total} ${order.currency} has been released.\n\nThank you for trading on Espees Escrow!`,
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
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes Cancel', style: 'destructive', onPress: async () => {
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

      <View style={[styles.statusBar, { backgroundColor: (statusColors[order.status] || COLORS.textMuted) + '22', borderColor: statusColors[order.status] || COLORS.textMuted }]}>
        <Text style={[styles.statusText, { color: statusColors[order.status] || COLORS.textMuted }]}>
          {order.status === 'open' && 'Open - Waiting for buyer'}
          {order.status === 'accepted' && 'Accepted - Awaiting payment'}
          {order.status === 'escrowed' && 'Payment secured in escrow'}
          {order.status === 'completed' && 'Order Completed'}
          {order.status === 'cancelled' && 'Cancelled'}
        </Text>
      </View>

      <View style={styles.detailCard}>
        {[
          ['Posted by', order.userName],
          ['Country', order.userCountry],
          ['Rate', `${order.rate} ${order.currency}/ESP`],
          ['Total Value', `${total} ${order.currency}`],
          ['Espees Amount', `${order.amount} ESP`],
          ['Notes', order.notes || 'None'],
        ].map(([label, val]) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{val || '—'}</Text>
          </View>
        ))}

        {/* Wallet address — copyable */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Wallet Address</Text>
          <TouchableOpacity onPress={() => order.walletAddress && copyToClipboard(order.walletAddress)} style={styles.walletRow}>
            <Text style={styles.walletText} numberOfLines={1}>
              {order.walletAddress ? `${order.walletAddress.substring(0, 16)}...` : 'Not provided'}
            </Text>
            {order.walletAddress && <Text style={styles.copyBtn}>📋</Text>}
          </TouchableOpacity>
        </View>

        {order.buyer && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Buyer</Text>
              <Text style={styles.detailValue}>{order.buyer.name}</Text>
            </View>
            {order.buyer.walletAddress ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Buyer Wallet</Text>
                <TouchableOpacity onPress={() => copyToClipboard(order.buyer.walletAddress)} style={styles.walletRow}>
                  <Text style={styles.walletText} numberOfLines={1}>
                    {order.buyer.walletAddress.substring(0, 16)}...
                  </Text>
                  <Text style={styles.copyBtn}>📋</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

        {order.paymentProofUrl && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Proof</Text>
            <TouchableOpacity onPress={() => Linking.openURL(order.paymentProofUrl)}>
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>View Proof →</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.espeesTxHash && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Espees TX</Text>
            <TouchableOpacity onPress={() => copyToClipboard(order.espeesTxHash)} style={styles.walletRow}>
              <Text style={styles.walletText} numberOfLines={1}>{order.espeesTxHash.substring(0, 16)}...</Text>
              <Text style={styles.copyBtn}>📋</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 16 }} />}

      {/* Open — not owner */}
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

      {/* Accepted — buyer pays */}
      {isBuyer && order.status === 'accepted' && (
        <View style={styles.actions}>
          <View style={styles.paymentNotice}>
            <Text style={styles.paymentNoticeTitle}>💳 Payment Required</Text>
            <Text style={styles.paymentNoticeText}>
              Pay {total} {order.currency} to secure your Espees in escrow.
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

      {/* Escrowed — seller sends espees */}
      {isOwner && order.status === 'escrowed' && (
        <View style={styles.actions}>
          <View style={[styles.escrowNotice, { borderColor: COLORS.primary }]}>
            <Text style={[styles.escrowNoticeTitle, { color: COLORS.primary }]}>⚡ Action Required</Text>
            <Text style={styles.escrowNoticeText}>
              {total} {order.currency} is secured in escrow.{'\n\n'}
              Send {order.amount} ESP to buyer wallet — tap to copy:
            </Text>
            {order.buyer?.walletAddress ? (
              <TouchableOpacity style={styles.walletCopyBox} onPress={() => copyToClipboard(order.buyer.walletAddress)}>
                <Text style={styles.walletCopyText} numberOfLines={2}>{order.buyer.walletAddress}</Text>
                <Text style={styles.walletCopyIcon}>📋 Copy</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: COLORS.error, marginTop: 8 }}>Buyer wallet not provided — use chat to request it</Text>
            )}
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { order })}>
            <Text style={styles.chatBtnText}>💬 Chat with Buyer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => setShowReleaseModal(true)} disabled={loading}>
            <Text style={styles.acceptBtnText}>✅ I've Sent the Espees — Release Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Escrowed — buyer waiting */}
      {isBuyer && order.status === 'escrowed' && (
        <View style={styles.actions}>
          <View style={styles.escrowNotice}>
            <Text style={styles.escrowNoticeTitle}>🔒 Payment Secured</Text>
            <Text style={styles.escrowNoticeText}>
              Your payment is in escrow. Waiting for seller to send your Espees.{'\n\n'}
              If no action in 24hrs: support@espees.org
            </Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { order })}>
            <Text style={styles.chatBtnText}>💬 Chat with Seller</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Owner — open */}
      {isOwner && order.status === 'open' && (
        <View style={styles.actions}>
          <View style={styles.ownerNote}>
            <Text style={styles.ownerNoteText}>Your order is live. You'll be notified when someone accepts.</Text>
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

      {/* PAYMENT MODAL */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Complete Payment</Text>
            <View style={styles.modalSummary}>
              {[
                ['Amount', `${order.amount} ESP`],
                ['Rate', `${order.rate} ${order.currency}/ESP`],
                ['Currency', order.currency],
              ].map(([l, v]) => (
                <View key={l} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{l}</Text>
                  <Text style={styles.modalValue}>{v}</Text>
                </View>
              ))}
              <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.modalLabel}>Total to Pay</Text>
                <Text style={[styles.modalValue, { color: COLORS.primary, fontSize: 20, fontWeight: '900' }]}>
                  {total} {order.currency}
                </Text>
              </View>
            </View>
            <View style={styles.modalSteps}>
              <Text style={styles.modalStepsTitle}>How escrow works:</Text>
              {[
                '1. Tap Pay Now — Flutterwave opens',
                '2. Pay by card, bank transfer or mobile money',
                '3. Return here and confirm payment',
                '4. Funds held safely until seller sends Espees',
                '5. Espees arrive → payment released to seller',
              ].map(s => <Text key={s} style={styles.modalStep}>{s}</Text>)}
            </View>
            <TouchableOpacity style={styles.payNowBtn} onPress={handlePayNow} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payNowBtnText}>💳 Pay {total} {order.currency} Now</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RELEASE MODAL — requires TX hash proof */}
      <Modal visible={showReleaseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✅ Release Payment</Text>
            <Text style={styles.modalDesc}>
              Enter the transaction hash or ID from your Espees wallet as proof that you sent the Espees. This is required before payment is released.
            </Text>
            <View style={styles.modalSummary}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Espees Sent</Text>
                <Text style={styles.modalValue}>{order.amount} ESP</Text>
              </View>
              <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.modalLabel}>Payment to Receive</Text>
                <Text style={[styles.modalValue, { color: COLORS.success, fontWeight: '900' }]}>{total} {order.currency}</Text>
              </View>
            </View>
            <Text style={styles.label}>Transaction Hash / ID (Proof of Send)</Text>
            <TextInput
              style={styles.txInput}
              value={espeesTxHash}
              onChangeText={setEspeesTxHash}
              placeholder="e.g. 0xabc123... or TX-ID from your wallet"
              placeholderTextColor={COLORS.textMuted}
              multiline
            />
            <TouchableOpacity style={styles.payNowBtn} onPress={handleReleaseEspees} disabled={loading || !espeesTxHash.trim()}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payNowBtnText}>Confirm & Release Payment</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowReleaseModal(false)}>
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
  backText: { color: COLORS.primary, fontSize: 16 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  typeText: { fontWeight: '800', fontSize: 12 },
  amount: { color: COLORS.text, fontSize: 48, fontWeight: '900' },
  rate: { color: COLORS.primary, fontSize: 18, marginBottom: 4 },
  total: { color: COLORS.textMuted, fontSize: 16, marginBottom: 20 },
  statusBar: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  statusText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  detailCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '60%' },
  walletText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  copyBtn: { fontSize: 16 },
  walletCopyBox: { backgroundColor: COLORS.surfaceLight, borderRadius: 10, padding: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  walletCopyText: { color: COLORS.text, fontSize: 12, flex: 1 },
  walletCopyIcon: { color: COLORS.primary, fontWeight: '700', fontSize: 12, marginLeft: 8 },
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
  paymentNotice: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.warning },
  paymentNoticeTitle: { color: COLORS.warning, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  paymentNoticeText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
  escrowNotice: { backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#60A5FA', marginBottom: 12 },
  escrowNoticeTitle: { color: '#60A5FA', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  escrowNoticeText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141414', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, borderTopWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.primary, fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  modalSummary: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalLabel: { color: COLORS.textMuted, fontSize: 14 },
  modalValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  modalSteps: { marginBottom: 20 },
  modalStepsTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  modalStep: { color: COLORS.textMuted, fontSize: 13, lineHeight: 24 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  txInput: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, color: COLORS.text, marginBottom: 20, minHeight: 80, fontSize: 14 },
  payNowBtn: { backgroundColor: COLORS.success, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  payNowBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalCancelBtn: { padding: 14, alignItems: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontSize: 15 },
});
