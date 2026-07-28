import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { COLORS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ route }) {
  // Expect transactionId and uid via route.params
  const { transactionId, uid } = route.params || {};
  const currentUserId = uid || auth.currentUser?.uid;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);

  // Real-Time Sync on trades/{tradeId}/messages ordered by serverTimestamp
  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'trades', transactionId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text || '',
          senderId: data.senderId || '',
          senderName: data.senderName || 'Member',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
        };
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error('Chat snapshot error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [transactionId]);

  // Send Message Command (addDoc to trades/{tradeId}/messages)
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!transactionId) {
      Alert.alert('Error', 'Invalid transaction ID for chat session.');
      return;
    }

    const messagePayload = inputText.trim();
    setInputText(''); // Clear input instantly for snappy feel
    setSending(true);

    try {
      const messagesRef = collection(db, 'trades', transactionId, 'messages');
      await addDoc(messagesRef, {
        text: messagePayload,
        senderId: currentUserId,
        senderEmail: auth.currentUser?.email || 'member@equb.org',
        senderName: auth.currentUser?.displayName || 'E-Qub Member',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Send Error', 'Failed to transmit message.');
      setInputText(messagePayload); // Restore text on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>ESCREW TRADE LIVE CHAT</Text>
        <Text style={styles.headerSubtitle}>Trade Ref: {transactionId || 'E-QUB_LIVE'}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChatBox}>
              <Ionicons name="chatbubbles-outline" size={40} color={COLORS.surfaceBorder} />
              <Text style={styles.emptyChatText}>
                No messages in this trade escrow channel yet. Say hello to begin communication.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isOutgoing = item.senderId === currentUserId;

            return (
              <View style={[
                styles.messageBubbleContainer,
                isOutgoing ? styles.outgoingContainer : styles.incomingContainer
              ]}>
                <View style={[
                  styles.messageBubble,
                  isOutgoing ? styles.outgoingBubble : styles.incomingBubble
                ]}>
                  {!isOutgoing && (
                    <Text style={styles.incomingSenderName}>{item.senderName}</Text>
                  )}

                  <Text style={[
                    styles.messageText,
                    isOutgoing ? styles.outgoingText : styles.incomingText
                  ]}>
                    {item.text}
                  </Text>

                  <Text style={[
                    styles.timestampText,
                    isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp
                  ]}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Message Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type message to counterparty..."
          placeholderTextColor={COLORS.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || !inputText.trim()}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Ionicons name="send" size={18} color={COLORS.background} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  emptyChatBox: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: SPACING.xl,
  },
  emptyChatText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  messageBubbleContainer: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
  },
  outgoingContainer: {
    justifyContent: 'flex-end',
  },
  incomingContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: 14,
  },
  outgoingBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  incomingBubble: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 2,
  },
  incomingSenderName: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  outgoingText: {
    color: COLORS.background,
  },
  incomingText: {
    color: COLORS.primary,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  outgoingTimestamp: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  incomingTimestamp: {
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});
