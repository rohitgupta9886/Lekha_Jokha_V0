// ==============================================================================
// Lekha Jokha - Mobile Native Add Product Screen
// ==============================================================================

import React, { useState } from 'react';
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
import { useTranslation } from '../../i18n/i18nContext';

interface CreateItemScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreateItemScreen: React.FC<CreateItemScreenProps> = ({
  onBack,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [hsn, setHsn] = useState('1006');
  const [barcode, setBarcode] = useState(`890103${Math.floor(100000 + Math.random() * 900000)}`);
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [gstRate, setGstRate] = useState<number>(5);
  const [unit, setUnit] = useState('PCS');
  const [stock, setStock] = useState('20');
  const [minStock, setMinStock] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Please enter item name');
      return;
    }
    if (!salePrice.trim()) {
      Alert.alert(t('common.error'), 'Please enter sale price');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createItem({
        name: name.trim(),
        category: category.trim(),
        hsn: hsn.trim(),
        barcode: barcode.trim(),
        salePrice: Number(salePrice) || 0,
        purchasePrice: Number(purchasePrice) || 0,
        gstRate,
        unit,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5
      });
      Alert.alert(t('common.success'), 'Product created successfully!');
      onSuccess();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('inv.addProduct')}
        rightAction={
          <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Basic Details</Text>
          <Input
            label={t('inv.productName') + ' *'}
            placeholder="e.g. Fortune Mustard Oil 1 Ltr"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label={t('inv.category')}
                placeholder="Groceries, FMCG..."
                value={category}
                onChangeText={setCategory}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('inv.hsn')}
                placeholder="e.g. 1514"
                value={hsn}
                onChangeText={setHsn}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label={t('inv.barcode')}
            placeholder="Scan or auto-generated"
            value={barcode}
            onChangeText={setBarcode}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pricing & GST</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label={t('inv.salePrice') + ' *'}
                placeholder="0.00"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                prefix="₹"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('inv.purchasePrice')}
                placeholder="0.00"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="numeric"
                prefix="₹"
              />
            </View>
          </View>

          <Text style={styles.gstLabel}>GST Tax Rate</Text>
          <View style={styles.gstChips}>
            {[0, 5, 12, 18, 28].map((rate) => (
              <TouchableOpacity
                key={rate}
                style={[styles.gstChip, gstRate === rate && styles.gstChipActive]}
                onPress={() => setGstRate(rate)}
              >
                <Text style={[styles.gstChipText, gstRate === rate && styles.gstChipTextActive]}>
                  {rate}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Inventory Stock</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label={t('inv.openingStock')}
                placeholder="0"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('inv.minStock')}
                placeholder="5"
                value={minStock}
                onChangeText={setMinStock}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.gstLabel}>Unit of Measurement</Text>
          <View style={styles.gstChips}>
            {['PCS', 'BAG', 'LTR', 'KG', 'BOX', 'MTR'].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.gstChip, unit === u && styles.gstChipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.gstChipText, unit === u && styles.gstChipTextActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Save Product to Inventory"
          onPress={handleSave}
          loading={submitting}
          style={{ marginBottom: 40 }}
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
    padding: SPACING.md
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  cardHeading: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm
  },
  row: {
    flexDirection: 'row'
  },
  gstLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 4
  },
  gstChips: {
    flexDirection: 'row',
    marginBottom: SPACING.sm
  },
  gstChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    marginRight: 6
  },
  gstChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  gstChipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  gstChipTextActive: {
    color: '#FFFFFF'
  }
});
