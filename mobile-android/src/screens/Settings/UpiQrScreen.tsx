// ==============================================================================
// Lekha Jokha - Mobile Dynamic Bharat UPI QR Code & Direct Intent Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { UpiQrResponse } from '../../types';

interface UpiQrScreenProps {
  onBack?: () => void;
}

export const UpiQrScreen: React.FC<UpiQrScreenProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('500');
  const [note, setNote] = useState('Payment to Lekha Jokha');
  const [upiData, setUpiData] = useState<UpiQrResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQr();
  }, []);

  const generateQr = async () => {
    const amt = Number(amount) || 0;
    setLoading(true);
    try {
      const res = await apiClient.getUpiQr(amt, note);
      setUpiData(res);
    } catch (e: any) {
      console.warn('Failed to generate UPI QR:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpiApp = async () => {
    if (!upiData?.upiUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(upiData.upiUrl);
      if (canOpen) {
        await Linking.openURL(upiData.upiUrl);
      } else {
        // Direct intent attempt
        await Linking.openURL(upiData.upiUrl);
      }
    } catch (e: any) {
      Alert.alert(
        'UPI App',
        'Could not directly launch UPI app. Please scan the QR code using Google Pay, PhonePe, or Paytm.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="🇮🇳 Bharat UPI Dynamic QR" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* UPI QR Display Card */}
        <View style={styles.qrCard}>
          <Text style={styles.payeeName}>{upiData?.name || 'Lekha Jokha Merchant'}</Text>
          <Text style={styles.vpaText}>UPI ID: {upiData?.vpa || 'merchant@upi'}</Text>

          {upiData?.qrImageUrl ? (
            <Image
              source={{ uri: upiData.qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={{ color: COLORS.textTertiary }}>Loading QR Code...</Text>
            </View>
          )}

          <Text style={styles.amountBanner}>
            ₹{Number(amount || 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.noteBanner}>Note: {note}</Text>

          {/* Direct Android UPI Intent Launcher */}
          <TouchableOpacity style={styles.upiIntentBtn} onPress={handleOpenUpiApp}>
            <Text style={styles.upiIntentText}>
              📱 Open in GPay / PhonePe / Paytm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Amount Customization */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>Customize Payment Request</Text>

          <Input
            label="Amount (₹)"
            keyboardType="numeric"
            placeholder="0 for open amount"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={styles.chipsRow}>
            {[100, 250, 500, 1000, 2500].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.chip}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={styles.chipText}>₹{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Transaction Remark"
            placeholder="Bill / Invoice note"
            value={note}
            onChangeText={setNote}
          />

          <Button
            title={loading ? 'Generating...' : '⚡ Generate Dynamic QR'}
            variant="primary"
            onPress={generateQr}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: SPACING.md
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4
  },
  payeeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827'
  },
  vpaText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12
  },
  qrImage: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    marginVertical: 8
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceVariant,
    marginVertical: 8
  },
  amountBanner: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    marginTop: 8
  },
  noteBanner: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    marginBottom: 12
  },
  upiIntentBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    width: '100%',
    alignItems: 'center'
  },
  upiIntentText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  inputCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6
  },
  chip: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  }
});
