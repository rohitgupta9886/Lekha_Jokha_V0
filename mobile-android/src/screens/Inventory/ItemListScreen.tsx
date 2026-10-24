// ==============================================================================
// Lekha Jokha - Mobile Inventory & Stock Management Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../api/client';
import { Item } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface ItemListScreenProps {
  onNavigateCreateItem: () => void;
}

export const ItemListScreen: React.FC<ItemListScreenProps> = ({
  onNavigateCreateItem
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stock Adjustment State
  const [adjustModalItem, setAdjustModalItem] = useState<Item | null>(null);
  const [adjustType, setAdjustType] = useState<'Add' | 'Reduce'>('Add');
  const [adjustQty, setAdjustQty] = useState('10');
  const [adjustReason, setAdjustReason] = useState('Physical Stock Count');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await apiClient.getItems();
      setItems(res.items || []);
    } catch (err: any) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleAdjustSubmit = async () => {
    if (!adjustModalItem) return;
    const qtyNum = Number(adjustQty) || 0;
    if (qtyNum <= 0) {
      Alert.alert(t('common.error'), 'Quantity must be greater than 0');
      return;
    }
    setSubmittingAdjust(true);
    try {
      await apiClient.adjustStock(adjustModalItem.id, adjustType, qtyNum, adjustReason);
      Alert.alert(t('common.success'), `Stock ${adjustType === 'Add' ? 'increased' : 'reduced'} successfully.`);
      setAdjustModalItem(null);
      await fetchItems();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to adjust stock');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.barcode.includes(search) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalStockValue = items.reduce((acc, i) => acc + (i.stock * i.purchasePrice), 0);

  return (
    <View style={styles.container}>
      <Header title={t('inv.title')} />

      <View style={styles.searchBar}>
        <Input
          placeholder={t('items.search_placeholder') || 'Search item by name, barcode, or category...'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{filtered.length} Items</Text>
        <Text style={styles.summaryTotal}>Stock Valuation: ₹{totalStockValue.toLocaleString('en-IN')}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="📦"
              title={t('common.empty')}
              description="No inventory items found."
              actionTitle={t('inv.addProduct')}
              onAction={onNavigateCreateItem}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isLow = item.stock <= item.minStock;
          return (
            <View style={styles.itemCard}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.category} • HSN: {item.hsn} • Code: {item.barcode}
                  </Text>
                </View>
                <Badge
                  label={isLow ? `${item.stock} ${item.unit} (Low)` : `${item.stock} ${item.unit}`}
                  variant={isLow ? 'danger' : 'success'}
                />
              </View>

              <View style={styles.cardPrices}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Sale Price</Text>
                  <Text style={styles.salePrice}>₹{item.salePrice.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Purchase Price</Text>
                  <Text style={styles.purchasePrice}>₹{item.purchasePrice.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>GST Rate</Text>
                  <Text style={styles.gstRate}>{item.gstRate}%</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => {
                    setAdjustModalItem(item);
                    setAdjustQty('5');
                    setAdjustType('Add');
                  }}
                >
                  <Text style={styles.adjustBtnText}>⚡ {t('inv.adjustStock')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Floating Add Item Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateCreateItem}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Item</Text>
      </TouchableOpacity>

      {/* Stock Adjustment Dialog */}
      <Modal
        visible={Boolean(adjustModalItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setAdjustModalItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Stock: {adjustModalItem?.name}</Text>
            <Text style={styles.modalSub}>Current Stock: {adjustModalItem?.stock} {adjustModalItem?.unit}</Text>

            <View style={styles.adjustTypeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, adjustType === 'Add' && styles.typeBtnActive]}
                onPress={() => setAdjustType('Add')}
              >
                <Text style={[styles.typeBtnText, adjustType === 'Add' && styles.typeBtnTextActive]}>
                  + Add Stock
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, adjustType === 'Reduce' && styles.typeBtnDangerActive]}
                onPress={() => setAdjustType('Reduce')}
              >
                <Text style={[styles.typeBtnText, adjustType === 'Reduce' && styles.typeBtnTextActive]}>
                  - Reduce Stock
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Quantity to Adjust *"
              value={adjustQty}
              onChangeText={setAdjustQty}
              keyboardType="numeric"
            />

            <Input
              label="Reason for Adjustment"
              value={adjustReason}
              onChangeText={setAdjustReason}
              placeholder="e.g. Audit correction, Damaged stock"
            />

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setAdjustModalItem(null)}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title={t('common.submit')}
                loading={submittingAdjust}
                onPress={handleAdjustSubmit}
                style={{ flex: 1 }}
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
  searchBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: '#F1F5F9'
  },
  summaryCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  summaryTotal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700'
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 90
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs
  },
  itemName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  itemMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  cardPrices: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginVertical: SPACING.xs
  },
  priceBox: {
    flex: 1
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textSecondary
  },
  salePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary
  },
  purchasePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  gstRate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6
  },
  adjustBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm
  },
  adjustBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700'
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    elevation: 6
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.lg
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg
  },
  modalTitle: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  modalSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md
  },
  adjustTypeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 6
  },
  typeBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success
  },
  typeBtnDangerActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger
  },
  typeBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  typeBtnTextActive: {
    color: '#FFFFFF'
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.md
  }
});
