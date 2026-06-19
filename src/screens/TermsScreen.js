import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/colors';

export default function TermsScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.date}>Effective: June 2025</Text>
      {[
        ['1. Eligibility', 'You must be at least 18 years old and complete KYC verification to use Espees Escrow. By using this app you confirm you meet these requirements.'],
        ['2. Escrow Service', 'Espees Escrow holds buyer funds until the seller confirms delivery of Espees tokens. We act as a neutral intermediary and are not responsible for exchange rate fluctuations.'],
        ['3. KYC Requirement', 'Full platform features require completed identity verification. Unverified users may only browse the P2P marketplace.'],
        ['4. Fees', 'A platform fee applies to each completed transaction. Current fee rates are displayed at the time of order acceptance.'],
        ['5. Prohibited Activities', 'Money laundering, fraud, use of false identities, and manipulation of escrow processes are strictly prohibited and will result in immediate account termination.'],
        ['6. Disputes', 'In case of a dispute, contact support@espees.org within 24 hours of the transaction. We will review evidence from both parties and make a final decision within 72 hours.'],
        ['7. Limitation of Liability', 'Espees Escrow is not liable for losses due to incorrect wallet addresses, blockchain network failures, or force majeure events.'],
        ['8. Governing Law', 'These terms are governed by applicable digital commerce regulations in the user\'s jurisdiction.'],
      ].map(([title, body]) => (
        <View key={title} style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionBody}>{body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.primary },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  date: { color: COLORS.textMuted, fontSize: 13, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { color: COLORS.primary, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  sectionBody: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
});
