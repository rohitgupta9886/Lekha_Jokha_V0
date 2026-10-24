// ==============================================================================
// Lekha Jokha - Mobile Sales Returns / Credit Notes Screen
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
import { SalesReturn, Party, Item } from '../../types';

interface SalesReturnsScreenProps {
  onBack?: () => void;
}

export const SalesReturnsScreen: React.FC<SalesReturnsScreenProps> = ({ onBack }) => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // New Return Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState('1');
  const [refundMode, setRefundMode] = useState<'Credit Note' | 'Cash' | 'Bank'>('Credit Note');
  const [reason, setReason] = useState('Damaged goods / Customer return');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [retRes, partyRes, itemRes] = await Promise.all([
        apiClient.getSalesReturns(),
        apiClient.getParties(),
        apiClient.getItems()
      ]);
      setReturns(retRes.returns || []);
      const custs = partyRes.parties?.filter((p) => p.type === 'Customer') || [];
      setParties(custs);
      if (custs.length > 0) setSelectedParty(custs[0]);
      setItems(itemRes.items || []);
      if (itemRes.items && itemRes.items.length > 0) setSelectedItem(itemRes.items[0]);
    } catch (e: any) {
      console.warn('Failed to load sales returns:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!selectedParty) {
      Alert.alert('Party Required', 'Please select a customer.');
      return;
    }
    if (!selectedItem) {
      Alert.alert('Item Required', 'Please select the returned item.');
      return;
    }
    const returnQty = Number(qty) || 0;
    if (returnQty <= 0) {
      Alert.alert('Invalid Qty', 'Please enter a valid return quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const lineItem = {
        itemId: selectedItem.id,
        name: selectedItem.name,
        hsn: selectedItem.hsn,
        qty: returnQty,
        rate: selectedItem.salePrice || 0,
        gstRate: selectedItem.gstRate || 0,
        amount: Math.round(returnQty * (selectedItem.salePrice || 0))
      };

      await apiClient.createSalesReturn({
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        invoiceNo: invoiceNo.trim() || undefined,
        items: [lineItem],
        total: lineItem.amount,
        refundMode,
        reason: reason.trim() || undefined
      });

      setModalVisible(false);
      setInvoiceNo('');
      setQty('1');
      await loadData();
      Alert.alert('Credit Note Issued', 'Sales return recorded and stock replenished!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to issue sales return');
    } finally {
      setSubmitting(false);
    }
  };

  const totalReturnAmt = returns.reduce((acc, r) => acc + (r.total || 0), 0);

  return (
    <View style={styles.container}>
      <Header title="🔄 Sales Returns (Credit Notes)" onBack={onBack} />

      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summarySub}>Total Returns Value</Text>
          <Text style={styles.summaryValue}>₹{totalReturnAmt.toLocaleString('en-IN')}</Text>
        </View>
        <Button
          title="+ Issue Credit Note"
          variant="primary"
          onPress={() => setModalVisible(true)}
        />
      </View>

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Sales Return / Credit Notes issued.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.partyName}>{item.partyName}</Text>
                <Text style={styles.metaText}>
                  Credit Note #{item.number} • {item.date}
                </Text>
                {item.invoiceNo ? (
                  <Text style={styles.invText}>Against Inv: {item.invoiceNo}</Text>
                ) : null}
              </View>
              <Text style={styles.amountText}>-₹{item.total?.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.badgeRow}>
              <Text style={styles.modeBadge}>{item.refundMode}</Text>
              {item.reason ? (
                <Text style={styles.reasonText} numberOfLines={1}>
                  {item.reason}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      />

      {/* Issue Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Issue Credit Note (Sales Return)</Text>

            <Text style={styles.fieldLabel}>Customer:</Text>
            <FlatList
              horizontal
              data={parties}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.partyChip,
                    selectedParty?.id === item.id && styles.partyChipSelected
                  ]}
                  onPress={() => setSelectedParty(item)}
                >
                  <Text
                    style={[
                      styles.partyChipText,
                      selectedParty?.id === item.id && styles.partyChipTextSelected
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <Input
              label="Original Invoice Number (Optional)"
              placeholder="e.g. INV-001"
              value={invoiceNo}
              onChangeText={setInvoiceNo}
            />

            <Text style={styles.fieldLabel}>Returned Product:</Text>
            <FlatList
              horizontal
              data={items}
              keyExtractor={(i) => i.id}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.partyChip,
                    selectedItem?.id === item.id && styles.partyChipSelected
                  ]}
                  onPress={() => setSelectedItem(item)}
                >
                  <Text
                    style={[
                      styles.partyChipText,
                      selectedItem?.id === item.id && styles.partyChipTextSelected
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.subText}>₹{item.salePrice}</Text>
                </TouchableOpacity>
              )}
            />

            <Input
              label="Returned Quantity *"
              keyboardType="numeric"
              placeholder="1"
              value={qty}
              onChangeText={setQty}
            />

            <Text style={styles.fieldLabel}>Settlement Mode:</Text>
            <View style={styles.modeRow}>
              {(['Credit Note', 'Cash', 'Bank'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, refundMode === mode && styles.modeBtnSelected]}
                  onPress={() => setRefundMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      refundMode === mode && styles.modeBtnTextSelected
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Return Reason"
              placeholder="e.g. Broken packaging / defect"
              value={reason}
              onChangeText={setReason}
            />

            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={submitting ? 'Issuing...' : 'Issue Credit Note'}
                variant="warning"
                onPress={handleCreateReturn}
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
    color: COLORS.warning
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
    justifyContent: 'space-between'
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
  invText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.warning
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  modeBadge: {
    backgroundColor: '#FFF7ED',
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginRight: 8
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1
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
  subText: {
    fontSize: 10,
    color: COLORS.textSecondary
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
    backgroundColor: COLORS.warning
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
