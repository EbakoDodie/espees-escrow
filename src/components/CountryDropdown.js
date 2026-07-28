import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'CI', name: 'Ivory Coast', dial: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
  { code: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
  { code: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' }
];

export default function CountryDropdown({ selectedCountry, onSelect }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dial.includes(searchQuery)
  );

  const currentCountry = COUNTRIES.find(c => c.name === selectedCountry) || COUNTRIES[0];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Country of Residence</Text>
      <TouchableOpacity 
        style={styles.selectButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.selectedRow}>
          <Text style={styles.flagText}>{currentCountry.flag}</Text>
          <Text style={styles.selectText}>{currentCountry.name} ({currentCountry.dial})</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry === item.name && styles.countryItemSelected
                  ]}
                  onPress={() => {
                    onSelect(item.name);
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <View style={styles.countryRow}>
                    <Text style={styles.flagText}>{item.flag}</Text>
                    <Text style={styles.countryItemText}>{item.name} ({item.dial})</Text>
                  </View>
                  {selectedCountry === item.name && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  selectButton: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  selectText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    maxHeight: '80%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textPrimary,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  countryItemText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
});
