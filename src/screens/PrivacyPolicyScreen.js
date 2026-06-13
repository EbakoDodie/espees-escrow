import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/colors';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Effective: June 2025</Text>
      {[
        ['1. Data We Collect', 'We collect your name, email, phone number, date of birth, country, wallet addresses, and KYC document details required for identity verification and regulatory compliance.'],
        ['2. How We Use Your Data', 'Your data is used to facilitate secure P2P escrow transactions, verify your identity, prevent fraud, send transaction notifications, and comply with applicable laws.'],
        ['3. Data Sharing', 'We do not sell your personal data. We may share necessary information with KYC verification partners, payment processors (Flutterwave), and law enforcement when legally required.'],
        ['4. Escrow & Payments', 'All payments are held in escrow until both parties confirm transaction completion. Funds are released only upon verified confirmation of Espees delivery.'],
        ['5. Security', 'We use industry-standard encryption and Firebase security rules to protect your data. You are responsible for keeping your login credentials secure.'],
        ['6. Your Rights', 'You may request access, correction, or deletion of your personal data by contacting us at privacy@espees.org.'],
        ['7. Contact', 'For privacy concerns: privacy@espees.org'],
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
