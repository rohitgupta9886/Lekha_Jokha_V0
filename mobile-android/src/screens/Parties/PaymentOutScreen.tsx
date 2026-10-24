// ==============================================================================
// Lekha Jokha - Mobile Payment-Out (Supplier Khata Payout) Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { PaymentOut, Party } from '../../types';

interface PaymentOutScreenProps {
  onBack?: () => void;
}

export const PaymentOutScreen: React.FC<PaymentOutScreenProps> = ({ onBack }) => {
  const [payments, setPayments] = useState<PaymentOut[]>([]);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  // New Payment-Out Dialog State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, partyRes] = await Promise.all([
        apiClient.getPaymentsOut(),
        apiClient.getParties()
      ]);
      setPayments(payRes.payments || []);
      const sups = partyRes.parties?.filter((p) => p.type === 'Supplier') || [];
      setSuppliers(sups);
      if (sups.length > 0) {
        setSelectedSupplier(sups[0]);
      }
    } catch (e: any) {
      console.warn('Failed to load payments-out:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    const amt = Number(amount) || 0;
    if (!selectedSupplier) {
      Alert.alert('Supplier Required', 'Please select a supplier for this payout voucher.');
      return;
    }
    if (amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createPaymentOut({
        partyId: selectedSupplier.id,
        partyName: selectedSupplier.name,
        amount: amt,
        paymentMode,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined
      });

      setModalVisible(false);
      setAmount('');
      setReferenceNo('');
      setNotes('');
      await loadData();
      Alert.alert('Success', `₹${amt} payout to ${selectedSupplier.name} recorded!`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record Payment-Out');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaidOut = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <View style={styles.container}>
      <Header title="💸 Payment-Out (Supplier Payouts)" onBack={onBack} />

      {/* Summary Card */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summarySub}>Total Supplier Payouts</Text>
          <Text style={styles.summaryValue}>₹{totalPaidOut.toLocaleString('en-IN')}</Text>
        </View>
        <Button
          title="+ Record Payout"
          variant="primary"
          onPress={() => setModalVisible(true)}
        />
      </View>

      {/* Payouts List */}
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Payment-Out vouchers recorded.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.partyName}>{item.partyName}</Text>
                <Text style={styles.metaText}>
                  Voucher #{item.number} • {item.date}
                </Text>
              </View>
              <Text style={styles.amountText}>-₹{item.amount?.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.badgeRow}>
              <Text style={styles.modeBadge}>Mode: {item.paymentMode}</Text>
              {item.referenceNo ? (
                <Text style={styles.refText}>Ref: {item.referenceNo}</Text>
              ) : null}
            </View>
          </View>
        )}
      />

      {/* Add Payment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Supplier Payout Voucher</Text>

            {/* Select Supplier */}
            <Text style={styles.fieldLabel}>Select Supplier:</Text>
            <FlatList
              horizontal
              data={suppliers}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.partyChip,
                    selectedSupplier?.id === item.id && styles.partyChipSelected
                  ]}
                  onPress={() => setSelectedSupplier(item)}
                >
                  <Text
                    style={[
                      styles.partyChipText,
                      selectedSupplier?.id === item.id && styles.partyChipTextSelected
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.partyBalance}>
                    Payable: ₹{Math.abs(item.balance || 0)}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <Input
              label="Amount Paid (₹) *"
              keyboardType="numeric"
              placeholder="e.g. 12000"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Payment Mode Selector */}
            <Text style={styles.fieldLabel}>Payment Mode:</Text>
            <View style={styles.modeRow}>
              {(['Bank Transfer', 'UPI', 'Cash', 'Cheque'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, paymentMode === mode && styles.modeBtnSelected]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      paymentMode === mode && styles.modeBtnTextSelected
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Bank Reference / Cheque No."
              placeholder="e.g. NEFT-99214"
              value={referenceNo}
              onChangeText={setReferenceNo}
            />

            <Input
              label="Notes / Khata Remarks"
              placeholder="Optional notes"
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={submitting ? 'Saving...' : 'Confirm Payout'}
                variant="error"
                onPress={handleRecordPayment}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  summarySub: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.error
  },
  listContent: {
    padding: SPACING.md
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: 14
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.error
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  modeBadge: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginRight: 8
  },
  refText: {
    fontSize: 11,
    color: COLORS.textSecondary
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.md
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  partyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceVariant,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  partyChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary
  },
  partyChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  partyChipTextSelected: {
    color: COLORS.primary
  },
  partyBalance: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceVariant,
    marginHorizontal: 2
  },
  modeBtnSelected: {
    backgroundColor: COLORS.primary
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  modeBtnTextSelected: {
    color: '#FFFFFF'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12
  }
});
