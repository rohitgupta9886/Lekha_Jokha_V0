// ==============================================================================
// Lekha Jokha - Mobile Delivery Challans & Goods Dispatch Screen
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
import { DeliveryChallan, Party, Item } from '../../types';

interface DeliveryChallansScreenProps {
  onBack?: () => void;
  onNavigateInvoice?: (invoiceId?: string) => void;
}

export const DeliveryChallansScreen: React.FC<DeliveryChallansScreenProps> = ({
  onBack,
  onNavigateInvoice
}) => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // New Challan Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemQty, setItemQty] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chalRes, partyRes, itemRes] = await Promise.all([
        apiClient.getDeliveryChallans(),
        apiClient.getParties(),
        apiClient.getItems()
      ]);
      setChallans(chalRes.challans || []);
      const custs = partyRes.parties?.filter((p) => p.type === 'Customer') || [];
      setParties(custs);
      if (custs.length > 0) setSelectedParty(custs[0]);
      setItems(itemRes.items || []);
      if (itemRes.items && itemRes.items.length > 0) setSelectedItem(itemRes.items[0]);
    } catch (e: any) {
      console.warn('Failed to load challans:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallan = async () => {
    if (!selectedParty) {
      Alert.alert('Party Required', 'Please select a consignee / customer.');
      return;
    }
    if (!selectedItem) {
      Alert.alert('Item Required', 'Please select a product to dispatch.');
      return;
    }
    const qty = Number(itemQty) || 0;
    if (qty <= 0) {
      Alert.alert('Invalid Qty', 'Please enter a valid dispatch quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const lineItem = {
        itemId: selectedItem.id,
        name: selectedItem.name,
        hsn: selectedItem.hsn,
        qty: qty,
        rate: selectedItem.salePrice || 0,
        gstRate: selectedItem.gstRate || 0,
        amount: Math.round(qty * (selectedItem.salePrice || 0))
      };

      await apiClient.createDeliveryChallan({
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        vehicleNo: vehicleNo.trim() || undefined,
        items: [lineItem],
        totalQty: qty,
        total: lineItem.amount,
        status: 'Dispatched'
      });

      setModalVisible(false);
      setVehicleNo('');
      setItemQty('1');
      await loadData();
      Alert.alert('Challan Generated', 'Goods delivery challan dispatched successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create challan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async (challan: DeliveryChallan) => {
    Alert.alert(
      'Convert to Tax Invoice',
      `Generate Tax Invoice for Challan #${challan.number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert Now',
          onPress: async () => {
            try {
              const res = await apiClient.convertDeliveryChallan(challan.id);
              Alert.alert('Invoice Created', `Invoice #${res.invoice.number} created successfully!`);
              await loadData();
              if (onNavigateInvoice) {
                onNavigateInvoice(res.invoice.id);
              }
            } catch (e: any) {
              Alert.alert('Conversion Failed', e.message || 'Could not convert challan');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="🚚 Delivery Challans & Dispatch" onBack={onBack} />

      {/* Header bar */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summarySub}>Active Challans</Text>
          <Text style={styles.summaryValue}>{challans.length} Documents</Text>
        </View>
        <Button
          title="+ Dispatch Challan"
          variant="primary"
          onPress={() => setModalVisible(true)}
        />
      </View>

      {/* List */}
      <FlatList
        data={challans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Delivery Challans created yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.partyName}>{item.partyName}</Text>
                <Text style={styles.metaText}>
                  Challan #{item.number} • {item.date}
                </Text>
                {item.vehicleNo ? (
                  <Text style={styles.vehicleText}>Vehicle: {item.vehicleNo}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalText}>₹{item.total?.toLocaleString('en-IN')}</Text>
                <Text style={styles.qtyText}>Total Qty: {item.totalQty}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === 'Converted to Invoice'
                    ? styles.statusConverted
                    : styles.statusDispatched
                ]}
              >
                {item.status}
              </Text>

              {item.status !== 'Converted to Invoice' && (
                <TouchableOpacity
                  style={styles.convertBtn}
                  onPress={() => handleConvert(item)}
                >
                  <Text style={styles.convertBtnText}>⚡ Convert to Invoice</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dispatch Delivery Challan</Text>

            {/* Select Customer */}
            <Text style={styles.fieldLabel}>Consignee / Customer:</Text>
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
              label="Transport Vehicle No."
              placeholder="e.g. DL-01-AB-1234"
              value={vehicleNo}
              onChangeText={setVehicleNo}
            />

            {/* Select Item */}
            <Text style={styles.fieldLabel}>Dispatch Item:</Text>
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
              label="Dispatch Quantity *"
              keyboardType="numeric"
              placeholder="1"
              value={itemQty}
              onChangeText={setItemQty}
            />

            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={submitting ? 'Dispatching...' : 'Dispatch Challan'}
                variant="primary"
                onPress={handleCreateChallan}
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
    color: COLORS.primary
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
  vehicleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2
  },
  totalText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  qtyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm
  },
  statusDispatched: {
    backgroundColor: '#E0F2FE',
    color: '#0284C7'
  },
  statusConverted: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32'
  },
  convertBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm
  },
  convertBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12
  }
});
