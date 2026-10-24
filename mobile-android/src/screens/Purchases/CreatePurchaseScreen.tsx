// ==============================================================================
// Lekha Jokha - Mobile Record Purchase Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
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
import { Party, Item, InvoiceItem } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface CreatePurchaseScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreatePurchaseScreen: React.FC<CreatePurchaseScreenProps> = ({
  onBack,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedPartyName, setSelectedPartyName] = useState('');
  const [billItems, setBillItems] = useState<InvoiceItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'Bank / Cheque' | 'Cash' | 'Credit'>('Bank / Cheque');
  const [paidAmount, setPaidAmount] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [partiesRes, itemsRes] = await Promise.all([
          apiClient.getParties(),
          apiClient.getItems()
        ]);
        const supps = (partiesRes.parties || []).filter(p => p.type === 'Supplier');
        setSuppliers(supps);
        if (supps.length > 0) {
          setSelectedPartyId(supps[0].id);
          setSelectedPartyName(supps[0].name);
        }
        setItemsList(itemsRes.items || []);
        if (itemsRes.items && itemsRes.items.length > 0) {
          const item = itemsRes.items[0];
          const lineAmount = item.purchasePrice * (1 + item.gstRate / 100);
          setBillItems([{
            itemId: item.id,
            name: item.name,
            hsn: item.hsn,
            qty: 10,
            rate: item.purchasePrice,
            gstRate: item.gstRate,
            amount: Math.round(lineAmount * 10)
          }]);
          setPaidAmount(String(Math.round(lineAmount * 10)));
        }
      } catch (err: any) {
        console.error('Failed to load purchase form data:', err);
      }
    };
    loadData();
  }, []);

  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;
    for (const item of billItems) {
      const lineSubtotal = item.qty * item.rate;
      const lineTax = (lineSubtotal * item.gstRate) / 100;
      subtotal += lineSubtotal;
      tax += lineTax;
    }
    const total = subtotal + tax;
    const paid = Number(paidAmount) || 0;
    const balance = Math.max(0, total - paid);
    return { subtotal, tax, total, balance };
  };

  const { subtotal, tax, total, balance } = calculateTotals();

  const handleSavePurchase = async () => {
    if (!selectedPartyName) {
      Alert.alert(t('common.error'), 'Please select a supplier');
      return;
    }
    if (billItems.length === 0) {
      Alert.alert(t('common.error'), 'Please add at least one item');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createPurchase({
        partyId: selectedPartyId,
        partyName: selectedPartyName,
        paymentMode,
        items: billItems,
        subtotal,
        tax,
        total,
        paid: Number(paidAmount) || 0,
        balance,
        status: (Number(paidAmount) || 0) >= total ? 'Paid' : 'Unpaid'
      });
      Alert.alert(t('common.success'), 'Purchase bill recorded successfully!');
      onSuccess();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to save purchase bill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('pur.recordPurchase')}
        rightAction={
          <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Supplier Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('pur.supplier')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {suppliers.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selectedPartyId === s.id && styles.chipActive]}
                onPress={() => {
                  setSelectedPartyId(s.id);
                  setSelectedPartyName(s.name);
                }}
              >
                <Text style={[styles.chipText, selectedPartyId === s.id && styles.chipTextActive]}>
                  🏭 {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Items Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Items Received ({billItems.length})</Text>
          {billItems.map((item, idx) => (
            <View key={idx} style={styles.lineItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  Qty: {item.qty} × ₹{item.rate} (GST {item.gstRate}%)
                </Text>
              </View>
              <Text style={styles.itemAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        {/* Payment Amount */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Payment Details</Text>
          <Input
            label="Paid Amount (₹)"
            value={paidAmount}
            onChangeText={setPaidAmount}
            keyboardType="numeric"
            prefix="₹"
          />
        </View>

        {/* Totals Summary */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalVal}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST Input Tax</Text>
            <Text style={styles.totalVal}>₹{tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>Total Purchase</Text>
            <Text style={styles.grandVal}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        <Button
          title="Save Purchase Bill"
          onPress={handleSavePurchase}
          loading={submitting}
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
    padding: SPACING.md,
    paddingBottom: 40
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  sectionHeading: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm
  },
  chipRow: {
    flexDirection: 'row'
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    marginRight: SPACING.sm
  },
  chipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  chipTextActive: {
    color: COLORS.primary
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  itemName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  itemDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  itemAmount: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  totalCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  totalLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary
  },
  totalVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4
  },
  grandLabel: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary
  },
  grandVal: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    color: COLORS.primary
  }
});
