import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../constants/colors';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

export default function ChatScreen({ route, navigation }) {
  const { order } = route.params;
  const { user, profile } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const chatId = `order_${order.id}`;

  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: text.trim(),
      senderId: user.uid,
      senderName: profile.name,
      createdAt: serverTimestamp(),
    });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Chat</Text>
        <Text style={styles.headerSub}>{order.amount} ESP · {order.type?.toUpperCase()}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isMe = item.senderId === user.uid;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
              <Text style={[styles.bubbleText, isMe && { color: COLORS.textDark }]}>{item.text}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, marginBottom: 8 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: 13 },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 14, marginBottom: 8 },
  bubbleMe: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  bubbleThem: { backgroundColor: COLORS.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  senderName: { color: COLORS.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bubbleText: { color: COLORS.text, fontSize: 15 },
  inputRow: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { backgroundColor: COLORS.primary, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: COLORS.textDark, fontSize: 18 },
});
