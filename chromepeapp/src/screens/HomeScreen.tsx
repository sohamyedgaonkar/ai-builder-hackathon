import React from 'react';
import {ScrollView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QuickActionButton from '../components/QuickActionButton';
import TransactionItem from '../components/TransactionItem';
import {currentUser, transactions} from '../data/mockData';
import type {HomeStackParams} from '../navigation/AppNavigator';
import colors from '../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParams, 'Home'>;
};

export default function HomeScreen({navigation}: Props) {
  const recent = transactions.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#003087" />
      
      {/* Top Header - PayPal Style */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <View style={styles.paypalLogoBadge}>
              <Text style={styles.paypalLogoBadgeText}>P</Text>
            </View>
            <Text style={styles.paypalLogoText}>
              <Text style={{color: '#FFFFFF'}}>Pay</Text>
              <Text style={{color: '#0070BA'}}>Pal</Text>
            </Text>
            <View style={styles.sandboxPill}>
              <View style={styles.activeDot} />
              <Text style={styles.sandboxPillText}>SANDBOX</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileIconWrapper}>
            <Image 
              source={{uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop'}} 
              style={styles.profileImage} 
            />
          </TouchableOpacity>
        </View>

        {/* PayPal Balance & User Profile Card */}
        <View style={styles.balanceCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <View>
              <Text style={styles.balanceLabel}>PayPal Balance</Text>
              <Text style={styles.balanceAmount}>${currentUser.walletBalanceUsd.toFixed(2)} USD</Text>
              <Text style={styles.balanceInr}>≈ ₹{currentUser.walletBalance.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.accountBadge}>
              <Icon name="verified-user" size={16} color="#007934" />
              <Text style={styles.accountBadgeText}>Verified</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.userRow}>
            <Icon name="account-circle" size={18} color="#003087" />
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userDot}>•</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{currentUser.email}</Text>
          </View>
          <View style={[styles.userRow, {marginTop: 4}]}>
            <Icon name="credit-card" size={16} color="#545D68" />
            <Text style={styles.userSub}>Linked: {currentUser.linkedAccount} ({currentUser.cardMasked})</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick PayPal Actions */}
        <View style={styles.actionsSection}>
          <View style={styles.gridRow}>
            <QuickActionButton icon="send" label="Send" onPress={() => navigation.navigate('SendMoney')} />
            <QuickActionButton icon="call-received" label="Request" onPress={() => {}} />
            <QuickActionButton icon="qr-code-scanner" label="Scan to Pay" onPress={() => {}} />
            <QuickActionButton icon="account-balance-wallet" label="Wallet" onPress={() => navigation.navigate('SendMoney')} />
          </View>
        </View>

        {/* Bills & Recharges */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payments & Utility</Text>
          <View style={styles.gridRow}>
            <QuickActionButton icon="receipt" label="Bills" onPress={() => navigation.navigate('Bills')} />
            <QuickActionButton icon="smartphone" label="Recharge" onPress={() => navigation.navigate('Recharge')} />
            <QuickActionButton icon="bolt" label="Electricity" onPress={() => navigation.navigate('Bills')} />
            <QuickActionButton icon="wifi" label="Broadband" onPress={() => navigation.navigate('Bills')} />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, {marginBottom: 20}]}>
          <Text style={styles.sectionLabel}>Recent PayPal Activity</Text>
          {recent.map(t => (
            <TransactionItem
              key={t.id}
              name={t.name}
              amount={t.amount}
              type={t.type}
              date={t.date}
              note={t.note}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#003087'},
  headerContainer: {
    backgroundColor: '#003087',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paypalLogoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0070BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paypalLogoBadgeText: {
    color: '#FFC439',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  paypalLogoText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sandboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC439',
  },
  sandboxPillText: {
    fontSize: 10,
    color: '#FFC439',
    fontWeight: '700',
  },
  profileIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFC439',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#545D68',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#003087',
    marginTop: 2,
  },
  balanceInr: {
    fontSize: 13,
    color: '#545D68',
    marginTop: 2,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  accountBadgeText: {
    fontSize: 11,
    color: '#007934',
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E8ECF0',
    marginVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C0C0C',
    marginLeft: 6,
  },
  userDot: {
    color: '#545D68',
    marginHorizontal: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#545D68',
    flex: 1,
  },
  userSub: {
    fontSize: 12,
    color: '#545D68',
    marginLeft: 6,
  },
  scrollContent: {
    backgroundColor: '#F5F7FA',
    paddingBottom: 40,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003087',
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
