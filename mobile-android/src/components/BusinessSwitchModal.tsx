// ==============================================================================
// Lekha Jokha - Mobile Multi-Business Switcher Modal
// Enforces SaaS Plan Quotas & Swaps Business Context
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';
import { Business } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { useTranslation } from '../i18n/i18nContext';

interface BusinessSwitchModalProps {
  visible: boolean;
  onClose: () => void;
  businesses: Business[];
  activeBusinessId: string;
  onSelectBusiness: (bizId: string) => void;
  onCreateBusiness: (name: string, gstin?: string, state?: string) => Promise<void>;
  planMaxBusinesses: number;
}

export const BusinessSwitchModal: React.FC<BusinessSwitchModalProps> = ({
  visible,
  onClose,
  businesses,
  activeBusinessId,
  onSelectBusiness,
  onCreateBusiness,
  planMaxBusinesses
}) => {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizGstin, setNewBizGstin] = useState('');
  const [newBizState, setNewBizState] = useState('Delhi (07)');
  const [submitting, setSubmitting] = useState(false);

  const canAddMore = businesses.length < planMaxBusinesses;

  const handleCreate = async () => {
    if (!newBizName.trim()) {
      Alert.alert(t('common.error'), 'Please enter business name');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateBusiness(newBizName.trim(), newBizGstin.trim(), newBizState.trim());
      setShowAddForm(false);
      setNewBizName('');
      setNewBizGstin('');
      onClose();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('dash.switchBusiness')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.quotaInfo}>
            {businesses.length} of {planMaxBusinesses} businesses in use
          </Text>

          {!showAddForm ? (
            <>
              <FlatList
                data={businesses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isActive = item.id === activeBusinessId;
                  return (
                    <TouchableOpacity
                      style={[styles.bizItem, isActive && styles.bizItemActive]}
                      onPress={() => {
                        onSelectBusiness(item.id);
                        onClose();
                      }}
                    >
                      <View style={styles.bizIconArea}>
                        <Text style={styles.bizIcon}>🏢</Text>
                      </View>
                      <View style={styles.bizDetails}>
                        <Text style={[styles.bizItemName, isActive && styles.activeText]}>
                          {item.name}
                        </Text>
                        <Text style={styles.bizItemSub}>
                          {item.gstin ? `GST: ${item.gstin}` : 'Unregistered'} • {item.state}
                        </Text>
                      </View>
                      {isActive && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />

              {canAddMore ? (
                <Button
                  title={t('set.addBusiness')}
                  variant="outline"
                  onPress={() => setShowAddForm(true)}
                  style={{ marginTop: SPACING.md }}
                />
              ) : (
                <View style={styles.limitBanner}>
                  <Text style={styles.limitBannerText}>
                    Plan limit reached ({planMaxBusinesses} businesses max). Upgrade to Max for up to 5 businesses.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>New Business Profile</Text>
              <Input
                label="Business / Firm Name *"
                placeholder="e.g. Royal Garments & Textiles"
                value={newBizName}
                onChangeText={setNewBizName}
              />
              <Input
                label="GSTIN (Optional)"
                placeholder="15-digit GSTIN (e.g. 07AAAAA0000A1Z5)"
                value={newBizGstin}
                onChangeText={setNewBizGstin}
                autoCapitalize="characters"
              />
              <Input
                label="State"
                placeholder="e.g. Delhi (07)"
                value={newBizState}
                onChangeText={setNewBizState}
              />

              <View style={styles.formActions}>
                <Button
                  title={t('common.cancel')}
                  variant="outline"
                  onPress={() => setShowAddForm(false)}
                  style={{ flex: 1, marginRight: SPACING.sm }}
                />
                <Button
                  title={t('common.save')}
                  loading={submitting}
                  onPress={handleCreate}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.textPrimary
  },
  closeBtn: {
    padding: 6
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textSecondary
  },
  quotaInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md
  },
  bizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    backgroundColor: '#FAFAFA'
  },
  bizItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface
  },
  bizIconArea: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  bizIcon: {
    fontSize: 18
  },
  bizDetails: {
    flex: 1
  },
  bizItemName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  activeText: {
    color: COLORS.primary
  },
  bizItemSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  checkMark: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700'
  },
  limitBanner: {
    backgroundColor: COLORS.warningSurface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md
  },
  limitBannerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    textAlign: 'center'
  },
  addForm: {
    marginTop: SPACING.sm
  },
  formTitle: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md
  },
  formActions: {
    flexDirection: 'row',
    marginTop: SPACING.md
  }
});
