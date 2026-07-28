import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView 
} from 'react-native';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as Clipboard from 'expo-clipboard';
import { auth, db } from '../../firebaseConfig';
import { COLORS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const CURRENCIES = ['NGN', 'USD', 'XAF', 'GHS', 'ZAR', 'KES', 'UGX', 'GBP', 'EUR'];

const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'GHS': return 'GH₵';
    case 'ZAR': return 'R';
    case 'KES': return 'KSh';
    case 'UGX': return 'USh';
    case 'XAF': return 'FCFA';
    case 'NGN':
    default: return '₦';
  }
};

export default function P2POrderBookScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('SELL'); // 'SELL' shows sell offers (user buys), 'BUY' shows buy requests (user sells)
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Profile State
  const [userProfile, setUserProfile] = useState(null);
  const [pastorNameMissing, setPastorNameMissing] = useState(true);

  // Modal State for Posting New Listing
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newOrderType, setNewOrderType] = useState('SELL');
  const [amountEspees, setAmountEspees] = useState('');
  const [pricePerEspee, setPricePerEspee] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Flutterwave Escrow Ledger');
  const [postingLoading, setPostingLoading] = useState(false);

  const currentUser = auth.currentUser;

  // 1. Listen/Fetch User Profile to enforce KYC & Pastor details
  useEffect(() => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        if (!data.pastorName || data.pastorName.trim() === '') {
          setPastorNameMissing(true);
        } else {
          setPastorNameMissing(false);
        }
      } else {
        setPastorNameMissing(true);
      }
    }, (err) => {
      console.error('Error listening to user profile:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Real-Time Listings Listener
  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setListings(docs);
      setLoading(false);
    }, (error) => {
      console.error('Listings snapshot error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Copy Wallet Address
  const handleCopyWallet = async (walletAddress) => {
    if (!walletAddress) {
      Alert.alert('Notice', 'No destination wallet address provided.');
      return;
    }
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied to Clipboard', `Wallet Address copied successfully.`);
  };

  // Intercept Post Order Modal Trigger
  const handleOpenCreateListingModal = () => {
    if (!userProfile || userProfile.kycStatus !== 'APPROVED') {
      Alert.alert(
        'Verification Required',
        `Your KYC status is currently: ${userProfile?.kycStatus || 'NOT_STARTED'}. You must complete ID verification to post order listings on E-Qub.`,
        [
          { text: 'Complete KYC', onPress: () => navigation.navigate('Register') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    setCreateModalVisible(true);
  };

  // Submit P2P Order Listing to Firestore
  const handleCreateListingSubmit = async () => {
    if (!amountEspees || !pricePerEspee) {
      Alert.alert('Error', 'Please enter both Espees Quantity and Rate.');
      return;
    }

    if (newOrderType === 'SELL' && pastorNameMissing) {
      Alert.alert(
        'Action Restricted',
        'Providing Pastor details in KYC is required to enable Espees selling privileges. Please update your profile.',
        [
          { text: 'Complete Profile KYC', onPress: () => { setCreateModalVisible(false); navigation.navigate('Register'); } },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    setPostingLoading(true);
    try {
      const destinationWallet = userProfile?.destinationWallet || `ESP_${currentUser.uid.substring(0, 10).toUpperCase()}`;

      await addDoc(collection(db, 'listings'), {
        sellerId: currentUser.uid,
        sellerName: userProfile?.fullName || currentUser.displayName || 'Loveworld Member',
        sellerPastorName: userProfile?.pastorName || 'N/A',
        type: newOrderType, // 'BUY' or 'SELL'
        amountEspees: parseFloat(amountEspees),
        pricePerEspee: parseFloat(pricePerEspee),
        currency: selectedCurrency,
        totalNaira: parseFloat(amountEspees) * parseFloat(pricePerEspee), // Held amount in selected currency value
        paymentMethod: paymentMethod,
        destinationWallet: destinationWallet,
        status: 'OPEN',
        createdAt: serverTimestamp()
      });

      Alert.alert('Success', 'P2P Order posted successfully to E-Qub Marketplace!');
      setCreateModalVisible(false);
      setAmountEspees('');
      setPricePerEspee('');
    } catch (err) {
      console.error('Error posting listing:', err);
      Alert.alert('Error', 'Failed to create order listing.');
    } finally {
      setPostingLoading(false);
    }
  };

  // Handle Accept Exchange Offer Fulfill Checks
  const handleAcceptOffer = (item) => {
    if (!userProfile || userProfile.kycStatus !== 'APPROVED') {
      Alert.alert(
        'Verification Required',
        `Your KYC status is currently: ${userProfile?.kycStatus || 'NOT_STARTED'}. You must get approved by compliance to trade.`,
        [
          { text: 'Check KYC', onPress: () => navigation.navigate('Register') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // Accepting a BUY request means the current user is selling their Espees (SELL order action).
    // This requires Pastor details to be present in user KYC configuration.
    if (item.type === 'BUY' && pastorNameMissing) {
      Alert.alert(
        'Action Restricted',
        'Providing Pastor details in KYC is required to enable Espees selling privileges.',
        [
          { text: 'Provide Pastor Details', onPress: () => navigation.navigate('Register') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    navigation.navigate('EscrowPayment', { order: item });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const filteredListings = listings.filter(item => item.type === activeTab && item.status === 'OPEN');

  return (
    <View style={styles.container}>
      
      {/* Dynamic KYC / Selling Restrictions Warnings Banner */}
      {userProfile && userProfile.kycStatus === 'APPROVED' && pastorNameMissing && (
        <View style={styles.warningBanner}>
          <Ionicons name="lock-closed" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
          <Text style={styles.warningBannerText}>
            Selling Locked: Fill Pastor Details in KYC.
          </Text>
          <TouchableOpacity 
            style={styles.warningFixBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.warningFixBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      {userProfile && userProfile.kycStatus !== 'APPROVED' && (
        <View style={styles.errorBanner}>
          <Ionicons name="shield" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.errorBannerText}>
            Trading restricted. Complete compliance deck to unlock buy/sell.
          </Text>
          <TouchableOpacity 
            style={styles.errorFixBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.errorFixBtnText}>Complete KYC</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerUserContainer}>
          <Text style={styles.welcomeText}>E-Qub Marketplace</Text>
          {/* Layout Guard: display name has flex-shrink and numberOfLines */}
          <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
            {userProfile?.fullName || currentUser?.email}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.headerBtn}>
            <Ionicons name="card" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.headerBtn}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'SELL' && styles.activeTabButton]}
          onPress={() => setActiveTab('SELL')}
        >
          <Text style={[styles.tabText, activeTab === 'SELL' && styles.activeTabText]}>
            Buy Espees (Sell Orders)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'BUY' && styles.activeTabButton]}
          onPress={() => setActiveTab('BUY')}
        >
          <Text style={[styles.tabText, activeTab === 'BUY' && styles.activeTabText]}>
            Sell Espees (Buy Requests)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Ionicons name="newspaper-outline" size={48} color={COLORS.surfaceBorder} />
              <Text style={styles.emptyStateText}>No active {activeTab === 'SELL' ? 'selling' : 'buying'} offers listed.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const sym = getCurrencySymbol(item.currency || 'NGN');
            const totalFiat = item.amountEspees * item.pricePerEspee;
            
            // Check if user is blocked from accepting this specific order type
            const isSellAction = item.type === 'BUY'; // Fulfilling a Buy request means the user is selling.
            const isRestrictedSell = isSellAction && pastorNameMissing;

            return (
              <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.typeBadge, { borderColor: item.type === 'SELL' ? COLORS.primary : COLORS.success }]}>
                    <Text style={[styles.typeBadgeText, { color: item.type === 'SELL' ? COLORS.primary : COLORS.success }]}>
                      {item.type === 'SELL' ? 'SELL OFFER' : 'BUY REQUEST'}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>{item.amountEspees.toLocaleString()} ESP</Text>
                </View>

                <View style={styles.cardDetailsRow}>
                  <Text style={styles.detailLabel}>Rate per Espee:</Text>
                  <Text style={styles.detailValue}>{sym}{item.pricePerEspee.toLocaleString()}</Text>
                </View>

                <View style={styles.cardDetailsRow}>
                  <Text style={styles.detailLabel}>Total Exchange Value:</Text>
                  <Text style={styles.totalValueText}>{sym}{totalFiat.toLocaleString()}</Text>
                </View>

                <View style={styles.cardDetailsRow}>
                  <Text style={styles.detailLabel}>Trader:</Text>
                  {/* Layout Guard: name uses flex-shrink and numberOfLines */}
                  <Text style={styles.detailValueName} numberOfLines={1} ellipsizeMode="tail">
                    {item.sellerName}
                  </Text>
                </View>

                {/* Counterparty Destination Wallet */}
                <View style={styles.walletBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.walletBoxLabel}>Destination Wallet Address:</Text>
                    <Text style={styles.walletBoxAddress} numberOfLines={1} ellipsizeMode="middle">
                      {item.destinationWallet}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => handleCopyWallet(item.destinationWallet)}
                  >
                    <Ionicons name="copy-outline" size={14} color={COLORS.background} />
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.cardActionRow}>
                  <TouchableOpacity 
                    style={styles.chatButton}
                    onPress={() => navigation.navigate('ChatScreen', { transactionId: item.id, uid: currentUser.uid })}
                  >
                    <Ionicons name="chatbubbles-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.chatButtonText}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.tradeButton, 
                      isRestrictedSell && styles.tradeButtonDisabled
                    ]}
                    onPress={() => handleAcceptOffer(item)}
                  >
                    <Text style={[styles.tradeButtonText, isRestrictedSell && styles.tradeButtonTextDisabled]}>
                      {isRestrictedSell ? 'Sell Locked' : 'Accept Exchange'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create Order Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={handleOpenCreateListingModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>

      {/* Post Listing Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Publish Escrow Listing</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Order Type Toggle */}
              <View style={styles.typeToggleRow}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, newOrderType === 'SELL' && styles.toggleBtnActive]}
                  onPress={() => {
                    if (pastorNameMissing) {
                      Alert.alert(
                        'Restricted',
                        'Providing Pastor details in KYC is required to enable Espees selling privileges.'
                      );
                      return;
                    }
                    setNewOrderType('SELL');
                  }}
                >
                  <Text style={[styles.toggleBtnText, newOrderType === 'SELL' && styles.toggleBtnTextActive]}>
                    SELL ESPEES
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, newOrderType === 'BUY' && styles.toggleBtnActive]}
                  onPress={() => setNewOrderType('BUY')}
                >
                  <Text style={[styles.toggleBtnText, newOrderType === 'BUY' && styles.toggleBtnTextActive]}>
                    BUY ESPEES
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Espees Quantity</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 1500"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={amountEspees}
                onChangeText={setAmountEspees}
              />

              {/* Rate per Espee with adjacent Currency picker */}
              <Text style={styles.inputLabel}>Rate per Espees</Text>
              <View style={styles.rateRow}>
                <TouchableOpacity 
                  style={styles.currencySelectBtn}
                  onPress={() => setCurrencyModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.currencySelectText}>{selectedCurrency}</Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.primary} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
                <TextInput
                  style={styles.rateInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={pricePerEspee}
                  onChangeText={setPricePerEspee}
                />
              </View>
              <Text style={styles.conversionRatioText}>
                {amountEspees && pricePerEspee ? (
                  `Conversion: ${amountEspees} ESP = ${getCurrencySymbol(selectedCurrency)}${(parseFloat(amountEspees) * parseFloat(pricePerEspee)).toLocaleString()}`
                ) : (
                  'Enter quantities above to see live conversion calculations.'
                )}
              </Text>

              <Text style={styles.inputLabel}>Payment Method</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Flutterwave Escrow ledger"
                placeholderTextColor={COLORS.textSecondary}
                value={paymentMethod}
                onChangeText={setPaymentMethod}
              />

              <TouchableOpacity 
                style={styles.postSubmitButton}
                onPress={handleCreateListingSubmit}
                disabled={postingLoading}
              >
                {postingLoading ? (
                  <ActivityIndicator color={COLORS.textDark} />
                ) : (
                  <Text style={styles.postSubmitButtonText}>Publish Escrow Listing</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Currency Dropdown Selector Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.currencyModalOverlay}>
          <View style={styles.currencyCard}>
            <Text style={styles.currencyTitle}>Select Currency</Text>
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[styles.currencyItem, selectedCurrency === cur && styles.currencyItemActive]}
                onPress={() => {
                  setSelectedCurrency(cur);
                  setCurrencyModalVisible(false);
                }}
              >
                <Text style={[styles.currencyText, selectedCurrency === cur && styles.currencyTextActive]}>
                  {cur} ({getCurrencySymbol(cur)})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  warningBanner: {
    backgroundColor: COLORS.warning,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningBannerText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  warningFixBtn: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  warningFixBtnText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: COLORS.danger,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  errorFixBtn: {
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  errorFixBtnText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  headerUserContainer: {
    flex: 1,
    marginRight: 10,
  },
  welcomeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  userText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 80,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: 15,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  amountText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  detailValueName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    maxWidth: '60%',
  },
  totalValueText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  walletBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  walletBoxLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  walletBoxAddress: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  copyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  copyButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  chatButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  chatButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  tradeButton: {
    flex: 1.5,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tradeButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tradeButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 13,
  },
  tradeButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeToggleRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleBtnText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  toggleBtnTextActive: {
    color: COLORS.background,
  },
  inputLabel: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 14,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currencySelectBtn: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  currencySelectText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  rateInput: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    flex: 1,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
  },
  conversionRatioText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  postSubmitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  postSubmitButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Currency Modal Styles
  currencyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    width: '80%',
    maxHeight: '70%',
  },
  currencyTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  currencyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    alignItems: 'center',
  },
  currencyItemActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  currencyText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  currencyTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
