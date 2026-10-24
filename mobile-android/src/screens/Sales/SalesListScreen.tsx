// ==============================================================================
// Lekha Jokha - Mobile Sales Invoice List Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../api/client';
import { SaleInvoice } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface SalesListScreenProps {
  onNavigateCreateInvoice: () => void;
}

export const SalesListScreen: React.FC<SalesListScreenProps> = ({
  onNavigateCreateInvoice
}) => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = async () => {
    try {
      const res = await apiClient.getSales();
      setSales(res.sales || []);
    } catch (err: any) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.number.toLowerCase().includes(search.toLowerCase()) ||
      s.partyName.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Paid') return matchesSearch && s.status === 'Paid';
    if (filter === 'Unpaid') return matchesSearch && s.status === 'Unpaid';
    return matchesSearch;
  });

  const totalSalesAmount = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);

  const handleShareWhatsApp = (invoice: SaleInvoice) => {
    Alert.alert(
      'WhatsApp Share',
      `Sending GST Invoice #${invoice.number} of ₹${invoice.total.toLocaleString('en-IN')} to ${invoice.partyName} via WhatsApp.`
    );
  };

  const handlePrintPdf = (invoice: SaleInvoice) => {
    Alert.alert(
      'GST Tax Invoice PDF',
      `Invoice #${invoice.number}\nDate: ${invoice.date}\nParty: ${invoice.partyName}\nAmount: ₹${invoice.total.toLocaleString('en-IN')}\nStatus: ${invoice.status}\n\nDocument ready for thermal/A4 printing.`
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t('sales.title')} />

      <View style={styles.searchBar}>
        <Input
          placeholder={t('sales.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Paid', 'Unpaid'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab === 'All' ? t('common.all') : tab === 'Paid' ? t('sales.statusPaid') : t('sales.statusUnpaid')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{filteredSales.length} Invoices</Text>
        <Text style={styles.summaryTotal}>Total: ₹{totalSalesAmount.toLocaleString('en-IN')}</Text>
      </View>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🧾"
              title={t('common.empty')}
              description="No sales invoices found matching your criteria."
              actionTitle={t('sales.createInvoice')}
              onAction={onNavigateCreateInvoice}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.invoiceCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.invNumber}>{item.number}</Text>
                <Text style={styles.invDate}>{item.date}</Text>
              </View>
              <Badge
                label={item.status}
                variant={item.status === 'Paid' ? 'success' : 'danger'}
              />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.partyName} numberOfLines={1}>{item.partyName}</Text>
              <Text style={styles.paymentMode}>Mode: {item.paymentMode}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.totalLabel}>{t('sales.total')}</Text>
                <Text style={styles.totalAmount}>₹{item.total.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleShareWhatsApp(item)}
                >
                  <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.printBtn]}
                  onPress={() => handlePrintPdf(item)}
                >
                  <Text style={styles.printBtnText}>🖨️ PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateCreateInvoice}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Sale</Text>
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
  searchInput: {
    backgroundColor: COLORS.surface
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  filterTextActive: {
    color: '#FFFFFF'
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: '#F1F5F9',
    marginTop: SPACING.xs
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
  invoiceCard: {
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
  invNumber: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.primary
  },
  invDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  cardBody: {
    marginBottom: SPACING.sm
  },
  partyName: {
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
  totalAmount: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  actionButtons: {
    flexDirection: 'row'
  },
  actionBtn: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    marginRight: 6
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534'
  },
  printBtn: {
    backgroundColor: '#EFF6FF',
    marginRight: 0
  },
  printBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
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
