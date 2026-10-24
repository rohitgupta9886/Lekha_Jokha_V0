// ==============================================================================
// Lekha Jokha - Mobile POS Fast Counter Billing Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { Item, SaleInvoice } from '../../types';

interface CartItem {
  id: string;
  name: string;
  rate: number;
  qty: number;
  gstRate: number;
}

interface PosBillingScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const PosBillingScreen: React.FC<PosBillingScreenProps> = ({ onBack, onSuccess }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tenderCash, setTenderCash] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState<SaleInvoice | null>(null);
  const [returnChange, setReturnChange] = useState(0);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await apiClient.getItems();
      setItems(res.items || []);
    } catch (e: any) {
      console.warn('Failed to load items for POS:', e.message);
    }
  };

  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          rate: item.salePrice || 0,
          qty: 1,
          gstRate: item.gstRate || 0
        }
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.barcode && i.barcode.includes(searchQuery))
  );

  const subtotal = cart.reduce((acc, i) => acc + i.rate * i.qty, 0);
  const tax = cart.reduce((acc, i) => acc + (i.rate * i.qty * i.gstRate) / 100, 0);
  const total = Math.round(subtotal + tax);
  const tendered = Number(tenderCash) || 0;
  const change = Math.max(0, tendered - total);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one product to the POS bill.');
      return;
    }
    if (tendered < total) {
      Alert.alert('Insufficient Tender', `Tender cash ₹${tendered} is less than bill total ₹${total}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.processPosBilling({
        items: cart,
        tenderCash: tendered,
        customerPhone: customerPhone.trim() || undefined,
        paymentMode: 'Cash'
      });

      setReturnChange(res.change || change);
      setReceiptModal(res.invoice);
      setCart([]);
      setTenderCash('');
      setCustomerPhone('');
    } catch (e: any) {
      Alert.alert('POS Checkout Error', e.message || 'Failed to complete checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="⚡ Fast POS Counter Billing" onBack={onBack} />

      {/* Main Split Layout: Cart vs Items */}
      <View style={styles.content}>
        {/* Top: Barcode Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Scan barcode or type item name..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Item Grid */}
        <View style={styles.gridContainer}>
          <Text style={styles.sectionHeader}>Touch to Add Item ({filteredItems.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {filteredItems.slice(0, 15).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemChip}
                onPress={() => addToCart(item)}
              >
                <Text style={styles.itemChipName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemChipPrice}>₹{item.salePrice}</Text>
                <Text style={styles.itemChipStock}>Stock: {item.stock || 0}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cart Listing */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Cart Items ({cart.length})</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() => setCart([])}>
                <Text style={styles.clearCartText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Text style={styles.emptyCartText}>Cart is empty. Tap items above or scan barcode.</Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.cartRow}>
                  <View style={styles.cartRowInfo}>
                    <Text style={styles.cartRowName}>{item.name}</Text>
                    <Text style={styles.cartRowRate}>
                      ₹{item.rate} × {item.qty} = ₹{Math.round(item.rate * item.qty)}
                    </Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyDisplay}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Footer Checkout Panel */}
        <View style={styles.checkoutPanel}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal: ₹{subtotal}</Text>
            <Text style={styles.summaryLabel}>GST: ₹{Math.round(tax)}</Text>
            <Text style={styles.totalLabel}>Grand Total: ₹{total}</Text>
          </View>

          {/* Tender Quick Chips */}
          <View style={styles.tenderRow}>
            <Text style={styles.tenderLabel}>Cash Tender:</Text>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => setTenderCash(total.toString())}
            >
              <Text style={styles.chipText}>Exact ₹{total}</Text>
            </TouchableOpacity>
            {[100, 200, 500, 1000].map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.chip}
                onPress={() => setTenderCash(c.toString())}
              >
                <Text style={styles.chipText}>₹{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tender Input and Change Return Display */}
          <View style={styles.tenderInputRow}>
            <TextInput
              style={styles.tenderInput}
              keyboardType="numeric"
              placeholder="Enter received cash..."
              placeholderTextColor={COLORS.textTertiary}
              value={tenderCash}
              onChangeText={setTenderCash}
            />
            <View style={styles.changeBadge}>
              <Text style={styles.changeLabel}>Return (वापसी):</Text>
              <Text style={styles.changeAmount}>₹{change}</Text>
            </View>
          </View>

          <Button
            title={submitting ? 'Processing Bill...' : `⚡ COMPLETE POS SALE (₹${total})`}
            variant="success"
            onPress={handleCheckout}
            disabled={submitting || cart.length === 0}
          />
        </View>
      </View>

      {/* 58mm Thermal Print Modal */}
      <Modal visible={!!receiptModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>RECEIPT / कैश मेमो</Text>
            <Text style={styles.receiptMeta}>
              Bill #{receiptModal?.number} • {receiptModal?.date}
            </Text>
            <View style={styles.divider} />

            <ScrollView style={{ maxHeight: 200 }}>
              {receiptModal?.items?.map((it, idx) => (
                <View key={idx} style={styles.receiptLine}>
                  <Text style={styles.receiptLineItem}>
                    {it.name} (x{it.qty})
                  </Text>
                  <Text style={styles.receiptLinePrice}>₹{it.amount}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />
            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalText}>TOTAL PAID</Text>
              <Text style={styles.receiptTotalAmount}>₹{receiptModal?.total}</Text>
            </View>
            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptChangeText}>CHANGE RETURNED (वापसी):</Text>
              <Text style={styles.receiptChangeAmount}>₹{returnChange}</Text>
            </View>

            <View style={styles.receiptActions}>
              <Button
                title="Done / Next Bill"
                variant="primary"
                onPress={() => {
                  setReceiptModal(null);
                  if (onSuccess) onSuccess();
                }}
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
  content: {
    flex: 1,
    padding: SPACING.md
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 14
  },
  clearBtn: {
    padding: 8,
    marginLeft: 4
  },
  clearBtnText: {
    color: COLORS.textSecondary,
    fontSize: 16
  },
  gridContainer: {
    marginBottom: SPACING.sm
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  quickScroll: {
    flexDirection: 'row'
  },
  itemChip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    marginRight: 8,
    minWidth: 110,
    elevation: 2
  },
  itemChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  itemChipPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary
  },
  itemChipStock: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2
  },
  cartSection: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 6
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  clearCartText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600'
  },
  emptyCartBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyCartText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    textAlign: 'center'
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border
  },
  cartRowInfo: {
    flex: 1
  },
  cartRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  cartRowRate: {
    fontSize: 11,
    color: COLORS.textSecondary
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  qtyDisplay: {
    width: 32,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  checkoutPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.success
  },
  tenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  tenderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 6
  },
  chip: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: 6,
    marginBottom: 4
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary
  },
  tenderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  tenderInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 8
  },
  changeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center'
  },
  changeLabel: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600'
  },
  changeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.lg
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    elevation: 8
  },
  receiptTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4
  },
  receiptMeta: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  receiptLineItem: {
    fontSize: 13,
    color: '#374151'
  },
  receiptLinePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827'
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  receiptTotalText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827'
  },
  receiptTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981'
  },
  receiptChangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB'
  },
  receiptChangeAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB'
  },
  receiptActions: {
    marginTop: 16
  }
});
