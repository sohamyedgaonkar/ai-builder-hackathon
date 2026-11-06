import React, {useState} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../theme/colors';
import {currentUser} from '../data/mockData';

export interface PendingTransaction {
  txnId: string;
  amount: string;
  amountUsd?: string;
  vpa: string;
  merchantName: string;
  description: string;
}

interface Props {
  visible: boolean;
  transaction: PendingTransaction | null;
  onApprove: (txnId: string) => Promise<void>;
  onReject: () => void;
}

export default function TransactionApprovalModal({
  visible,
  transaction,
  onApprove,
  onReject,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!transaction) return null;

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(transaction.txnId);
    setLoading(false);
  };

  const formattedAmount = transaction.amount ? transaction.amount.toString().replace(/[^\d.]/g, '') : '0.00';
  const usdAmount = transaction.amountUsd || (Number(formattedAmount) / 83.3).toFixed(2);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top PayPal Header */}
          <View style={styles.header}>
            <View style={styles.paypalBadge}>
              <Text style={styles.paypalBadgeText}>P</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.title}>
                <Text style={{ color: '#003087', fontWeight: '800' }}>Pay</Text>
                <Text style={{ color: '#0070ba', fontWeight: '800' }}>Pal</Text>
                <Text style={{ color: '#545D68', fontSize: 16, fontWeight: '500' }}> Checkout</Text>
              </Text>
              <View style={styles.sandboxBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.sandboxText}>Sandbox Account Linked</Text>
              </View>
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencyUsd}>${usdAmount}</Text>
            <Text style={styles.currencyInr}>≈ ₹{formattedAmount}</Text>
          </View>

          {/* Stored User Details Card */}
          <View style={styles.userCard}>
            <View style={styles.userHeader}>
              <Icon name="account-circle" size={24} color="#003087" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.userName}>{currentUser.name}</Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
              </View>
              <View style={styles.verifiedPill}>
                <Icon name="check" size={14} color="#007934" />
                <Text style={styles.verifiedText}>Saved</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentMethodRow}>
              <Icon name="credit-card" size={20} color="#0070ba" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.methodLabel}>Payment Method</Text>
                <Text style={styles.methodValue}>PayPal Balance ($150.00) & Visa {currentUser.cardMasked}</Text>
              </View>
            </View>
          </View>

          {/* Transaction Metadata */}
          <View style={styles.detailsBox}>
            <DetailRow label="Merchant" value={transaction.merchantName || 'Online Merchant'} />
            <DetailRow label="Order ID" value={transaction.txnId} />
            <DetailRow label="Description" value={transaction.description || 'In-App Purchase'} />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={onReject}
              disabled={loading}>
              <Text style={styles.rejectText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveButton}
              onPress={handleApprove}
              disabled={loading}>
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.approveText}>Authorizing...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.paypalP}>P</Text>
                  <Text style={styles.approveText}>Approve with PayPal</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,18,50,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },
  paypalBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#003087',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003087',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  paypalBadgeText: {
    color: '#FFC439',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  sandboxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007934',
  },
  sandboxText: {
    fontSize: 12,
    color: '#007934',
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currencyUsd: {
    fontSize: 38,
    fontWeight: '800',
    color: '#003087',
  },
  currencyInr: {
    fontSize: 15,
    fontWeight: '600',
    color: '#545D68',
    marginTop: 2,
  },
  userCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E7EB',
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C0C0C',
  },
  userEmail: {
    fontSize: 12,
    color: '#545D68',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#007934',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E7EB',
    marginVertical: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodLabel: {
    fontSize: 11,
    color: '#545D68',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  methodValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#003087',
    marginTop: 1,
  },
  detailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: '#545D68',
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C0C0C',
    flex: 2,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 24,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#545D68',
  },
  approveButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 24,
    backgroundColor: '#0070BA', // PayPal Blue
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0070BA',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  paypalP: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  approveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
