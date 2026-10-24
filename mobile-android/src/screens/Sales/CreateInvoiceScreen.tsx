// ==============================================================================
// Lekha Jokha - Mobile Native Create Tax Invoice Screen
// Fast Touch Bill Creation, Multi-Item Selector, Auto GST Calculation
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

interface CreateInvoiceScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreateInvoiceScreen: React.FC<CreateInvoiceScreenProps> = ({
  onBack,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [parties, setParties] = useState<Party[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedPartyName, setSelectedPartyName] = useState('Cash Customer');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank / UPI' | 'Credit'>('Cash');
  const [billItems, setBillItems] = useState<InvoiceItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [partiesRes, itemsRes] = await Promise.all([
          apiClient.getParties(),
          apiClient.getItems()
        ]);
        setParties((partiesRes.parties || []).filter(p => p.type === 'Customer'));
        setItemsList(itemsRes.items || []);
        if (itemsRes.items && itemsRes.items.length > 0) {
          // Default first item for easy testing
          const first = itemsRes.items[0];
          const amount = first.salePrice * (1 + first.gstRate / 100);
          setBillItems([{
            itemId: first.id,
            name: first.name,
            hsn: first.hsn,
            qty: 1,
            rate: first.salePrice,
            gstRate: first.gstRate,
            amount: Math.round(amount)
          }]);
          setPaidAmount(String(Math.round(amount)));
        }
      } catch (err: any) {
        console.error('Failed to load data for invoice:', err);
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

  const handleAddItem = (item: Item) => {
    const existing = billItems.find(i => i.itemId === item.id);
    if (existing) {
      existing.qty += 1;
      const lineSubtotal = existing.qty * existing.rate;
      existing.amount = lineSubtotal + (lineSubtotal * existing.gstRate) / 100;
      setBillItems([...billItems]);
    } else {
      const lineSubtotal = item.salePrice;
      const amount = lineSubtotal + (lineSubtotal * item.gstRate) / 100;
      setBillItems([
        ...billItems,
        {
          itemId: item.id,
          name: item.name,
          hsn: item.hsn,
          qty: 1,
          rate: item.salePrice,
          gstRate: item.gstRate,
          amount: Math.round(amount)
        }
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...billItems];
    updated.splice(index, 1);
    setBillItems(updated);
  };

  const handleSaveInvoice = async () => {
    if (billItems.length === 0) {
      Alert.alert(t('common.error'), 'Please add at least one item to the invoice.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createSale({
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
      Alert.alert(t('common.success'), 'Invoice created successfully!');
      onSuccess();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('sales.createInvoice')}
        rightAction={
          <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Customer Picker Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('sales.customer')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerChips}>
            <TouchableOpacity
              style={[styles.customerChip, selectedPartyName === 'Cash Customer' && styles.customerChipActive]}
              onPress={() => {
                setSelectedPartyId('');
                setSelectedPartyName('Cash Customer');
              }}
            >
              <Text style={[styles.customerChipText, selectedPartyName === 'Cash Customer' && styles.customerChipTextActive]}>
                💵 Cash Customer
              </Text>
            </TouchableOpacity>

            {parties.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.customerChip, selectedPartyId === p.id && styles.customerChipActive]}
                onPress={() => {
                  setSelectedPartyId(p.id);
                  setSelectedPartyName(p.name);
                }}
              >
                <Text style={[styles.customerChipText, selectedPartyId === p.id && styles.customerChipTextActive]}>
                  👤 {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('sales.items')} ({billItems.length})</Text>

          {billItems.map((item, idx) => (
            <View key={idx} style={styles.lineItem}>
              <View style={styles.itemMeta}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  Qty: {item.qty} × ₹{item.rate} (GST {item.gstRate}%)
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(idx)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Quick Item Add Carousel */}
          <Text style={styles.subHeading}>+ Tap to add from Catalog</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogChips}>
            {itemsList.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.catalogChip}
                onPress={() => handleAddItem(item)}
              >
                <Text style={styles.catalogName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.catalogPrice}>₹{item.salePrice} (Stock: {item.stock})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Payment & Amount Entry */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('sales.paymentMode')}</Text>
          <View style={styles.paymentModesRow}>
            {(['Cash', 'Bank / UPI', 'Credit'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                onPress={() => setPaymentMode(mode)}
              >
                <Text style={[styles.modeText, paymentMode === mode && styles.modeTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label={t('sales.paidAmount')}
            value={paidAmount}
            onChangeText={setPaidAmount}
            keyboardType="numeric"
            prefix="₹"
          />
        </View>

        {/* Totals Summary Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('sales.subtotal')}</Text>
            <Text style={styles.totalVal}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('sales.tax')}</Text>
            <Text style={styles.totalVal}>₹{tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>{t('sales.total')}</Text>
            <Text style={styles.grandVal}>₹{total.toFixed(2)}</Text>
          </View>
          {balance > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.balanceLabel}>{t('sales.balanceDue')}</Text>
              <Text style={styles.balanceVal}>₹{balance.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <Button
          title="Save & Generate Invoice"
          onPress={handleSaveInvoice}
          loading={submitting}
          style={styles.saveBtn}
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
  subHeading: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs
  },
  customerChips: {
    flexDirection: 'row'
  },
  customerChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    marginRight: SPACING.sm
  },
  customerChipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  customerChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  customerChipTextActive: {
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
  itemMeta: {
    flex: 1
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
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemAmount: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: SPACING.md
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '700'
  },
  catalogChips: {
    flexDirection: 'row'
  },
  catalogChip: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    marginRight: SPACING.sm,
    width: 140
  },
  catalogName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  catalogPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: 2
  },
  paymentModesRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 6
  },
  modeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  modeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  modeTextActive: {
    color: '#FFFFFF'
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
  },
  balanceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '700'
  },
  balanceVal: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.danger
  },
  saveBtn: {
    marginBottom: SPACING.xl
  }
});
