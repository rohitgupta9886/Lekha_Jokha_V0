// ==============================================================================
// Lekha Jokha - Mobile Purchases Bill List Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../api/client';
import { PurchaseBill } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface PurchasesListScreenProps {
  onNavigateCreatePurchase: () => void;
}

export const PurchasesListScreen: React.FC<PurchasesListScreenProps> = ({
  onNavigateCreatePurchase
}) => {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState<PurchaseBill[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPurchases = async () => {
    try {
      const res = await apiClient.getPurchases();
      setPurchases(res.purchases || []);
    } catch (err: any) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchases();
  };

  const filtered = purchases.filter((p) =>
    p.number.toLowerCase().includes(search.toLowerCase()) ||
    p.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchasesAmount = filtered.reduce((acc, p) => acc + (p.total || 0), 0);

  return (
    <View style={styles.container}>
      <Header title={t('pur.title')} />

      <View style={styles.searchBar}>
        <Input
          placeholder="Search by bill number or supplier..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{filtered.length} Purchase Bills</Text>
        <Text style={styles.summaryTotal}>Total: ₹{totalPurchasesAmount.toLocaleString('en-IN')}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="📥"
              title={t('common.empty')}
              description="No purchase bills found."
              actionTitle={t('pur.recordPurchase')}
              onAction={onNavigateCreatePurchase}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.billCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.billNumber}>{item.number}</Text>
                <Text style={styles.billDate}>{item.date}</Text>
              </View>
              <Badge
                label={item.status}
                variant={item.status === 'Paid' ? 'success' : 'danger'}
              />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.supplierName} numberOfLines={1}>{item.partyName}</Text>
              <Text style={styles.paymentMode}>Mode: {item.paymentMode}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.totalLabel}>Total Bill Amount</Text>
              <Text style={styles.totalVal}>₹{item.total.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateCreatePurchase}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Purchase</Text>
      </TouchableOpacity>
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
  billCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs
  },
  billNumber: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.primary
  },
  billDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  cardBody: {
    marginBottom: SPACING.sm
  },
  supplierName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  paymentMode: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: SPACING.xs
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  totalVal: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    elevation: 6
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
