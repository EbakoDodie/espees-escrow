import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { COLORS } from '../constants/colors';
import { db } from '../services/firebase';
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

export default function ChatScreen({ route, navigation }) {
  const { order } = route.params;
  const { user, profile } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const chatId = `order_${order.id}`;

  useEffect(() => {
    // Mark chat as active
    const chatRef = doc(db, 'chats', chatId);
    updateDoc(chatRef, { lastSeen: serverTimestamp() }).catch(() => {});

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, []);

  const send = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msgText,
        senderId: user.uid,
        senderName: profile.name,
        orderId: order.id,
        createdAt: serverTimestamp(),
        read: false,
      });

      // Update chat metadata for notifications
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid,
        orderAmount: order.amount,
        orderId: order.id,
      }).catch(() =>
        addDoc(collection(db, 'chats'), {
          chatId,
          lastMessage: msgText,
          lastMessageTime: serverTimestamp(),
          lastSenderId: user.uid,
          orderId: order.id,
        })
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setText(msgText);
    }
    setSending(false);
  };

  const formatTime = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Order Chat</Text>
          <Text style={styles.headerSub}>{order.amount} ESP · {order.type?.toUpperCase()} · {order.status?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderSummary}>
        <Text style={styles.orderSummaryText}>
          {order.amount} ESP @ {order.rate} {order.currency}/ESP = {(order.amount * order.rate).toLocaleString()} {order.currency}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatText}>No messages yet</Text>
            <Text style={styles.emptyChatSub}>Start the conversation</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.senderId === user.uid;
          return (
            <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
              {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe && { color: COLORS.textDark }]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, isMe && { color: 'rgba(0,0,0,0.5)' }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, fontSize: 16 },
  headerInfo: { flex: 1 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  orderSummary: { backgroundColor: COLORS.gold10, padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orderSummaryText: { color: COLORS.primary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  messagesList: { padding: 16, paddingBottom: 8 },
  emptyChat: { alignItems: 'center', paddingTop: 60 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  emptyChatSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  bubbleWrap: { marginBottom: 12, alignItems: 'flex-start' },
  bubbleWrapMe: { alignItems: 'flex-end' },
  senderName: { color: COLORS.primary, fontSize: 11, fontWeight: '700', marginBottom: 4, marginLeft: 4 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 12, paddingHorizontal: 16 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { color: COLORS.text, fontSize: 15, lineHeight: 20 },
  bubbleTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'flex-end' },
  input: {
    flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, maxHeight: 100, fontSize: 15,
  },
  sendBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.border },
  sendBtnText: { color: COLORS.textDark, fontSize: 16 },
});
