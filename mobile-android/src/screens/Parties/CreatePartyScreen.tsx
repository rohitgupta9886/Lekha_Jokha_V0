// ==============================================================================
// Lekha Jokha - Mobile Add New Customer or Supplier Screen
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { useTranslation } from '../../i18n/i18nContext';

interface CreatePartyScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreatePartyScreen: React.FC<CreatePartyScreenProps> = ({
  onBack,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState<'Customer' | 'Supplier'>('Customer');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Delhi');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Please enter party name');
      return;
    }

    setSubmitting(true);
    try {
      const balanceNum = Number(openingBalance) || 0;
      await apiClient.createParty({
        name: name.trim(),
        type,
        phone: phone.trim(),
        gstin: gstin.trim().toUpperCase(),
        address: address.trim(),
        state: state.trim(),
        balance: type === 'Supplier' && balanceNum > 0 ? -balanceNum : balanceNum
      });
      Alert.alert(t('common.success'), `${type} added successfully!`);
      onSuccess();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to add party');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('parties.addParty')}
        rightAction={
          <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Party Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'Customer' && styles.typeBtnActive]}
              onPress={() => setType('Customer')}
            >
              <Text style={[styles.typeBtnText, type === 'Customer' && styles.typeBtnTextActive]}>
                👤 {t('parties.customers')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'Supplier' && styles.typeBtnActive]}
              onPress={() => setType('Supplier')}
            >
              <Text style={[styles.typeBtnText, type === 'Supplier' && styles.typeBtnTextActive]}>
                🏭 {t('parties.suppliers')}
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label={t('parties.partyName') + ' *'}
            placeholder="e.g. Aggarwal Sweets & Namkeen"
            value={name}
            onChangeText={setName}
          />

          <Input
            label={t('parties.phone')}
            placeholder="10-digit mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label={t('parties.gstin')}
            placeholder="15-character GSTIN (Optional)"
            value={gstin}
            onChangeText={setGstin}
            autoCapitalize="characters"
          />

          <Input
            label={t('parties.state')}
            placeholder="e.g. Delhi, Maharashtra, Punjab"
            value={state}
            onChangeText={setState}
          />

          <Input
            label={t('parties.address')}
            placeholder="Shop / office street address"
            value={address}
            onChangeText={setAddress}
          />

          <Input
            label={t('parties.openingBalance')}
            placeholder="0.00"
            value={openingBalance}
            onChangeText={setOpeningBalance}
            keyboardType="numeric"
            prefix="₹"
            helper={type === 'Customer' ? 'Amount to receive (+)' : 'Amount to pay (-)'}
          />
        </View>

        <Button
          title={t('common.save') + ` ${type}`}
          onPress={handleSave}
          loading={submitting}
          style={{ marginBottom: 40 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  scrollContent: {
    padding: SPACING.md
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  cardHeading: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F8FAFC'
  },
  typeBtnActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  typeBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  typeBtnTextActive: {
    color: COLORS.primary
  }
});
