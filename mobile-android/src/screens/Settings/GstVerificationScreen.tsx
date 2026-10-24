// ==============================================================================
// Lekha Jokha - Mobile Indian GSTIN Verification Tool
// Validates 15-character GSTIN, State Code, PAN & Taxpayer Status
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../api/client';
import { GSTVerificationResult } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface GstVerificationScreenProps {
  onBack: () => void;
}

export const GstVerificationScreen: React.FC<GstVerificationScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [gstinInput, setGstinInput] = useState('07AAAAA0000A1Z5');
  const [result, setResult] = useState<GSTVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!gstinInput.trim()) {
      setError('Please enter a 15-character GSTIN');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.verifyGstin(gstinInput.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'GSTIN Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('set.gstVerify')}
        rightAction={
          <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Official Indian GSTIN Validator</Text>
          <Text style={styles.subtitle}>
            Enter 15-digit GST Identification Number (GSTIN) to instantly verify jurisdiction, PAN & status.
          </Text>

          <Input
            label="GSTIN Number *"
            placeholder="e.g. 07AAAAA0000A1Z5"
            value={gstinInput}
            onChangeText={(v) => {
              setGstinInput(v.toUpperCase());
              if (error) setError('');
            }}
            autoCapitalize="characters"
            maxLength={15}
            error={error}
          />

          <Button
            title="Verify GSTIN with Server"
            onPress={handleVerify}
            loading={loading}
          />
        </View>

        {result && (
          <View style={[styles.resultCard, result.valid ? styles.resultCardValid : styles.resultCardInvalid]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{result.valid ? '✅' : '❌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultGstin}>{result.gstin}</Text>
                <Text style={styles.resultStatusText}>
                  {result.valid ? 'Verified Registered Taxpayer' : 'Invalid GSTIN'}
                </Text>
              </View>
              <Badge
                label={result.valid ? 'ACTIVE' : 'INVALID'}
                variant={result.valid ? 'success' : 'danger'}
              />
            </View>

            {result.valid ? (
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State Jurisdiction</Text>
                  <Text style={styles.detailVal}>{result.stateName} (Code: {result.stateCode})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Associated PAN</Text>
                  <Text style={styles.detailVal}>{result.pan}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Entity Constitution</Text>
                  <Text style={styles.detailVal}>{result.entityType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Taxpayer Status</Text>
                  <Text style={[styles.detailVal, { color: COLORS.success, fontWeight: '700' }]}>
                    {result.status}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.reasonText}>{result.reason}</Text>
            )}
          </View>
        )}
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
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  title: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACING.md
  },
  resultCardValid: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successSurface
  },
  resultCardInvalid: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerSurface
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  resultIcon: {
    fontSize: 24,
    marginRight: SPACING.md
  },
  resultGstin: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  resultStatusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: SPACING.sm
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  detailVal: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  reasonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 4
  }
});
