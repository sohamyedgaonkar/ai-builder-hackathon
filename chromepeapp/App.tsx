import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Linking} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import TransactionApprovalModal, { PendingTransaction } from './src/components/TransactionApprovalModal';

const BACKEND_URL = 'https://chromepe-relay.chromepe-relay.workers.dev';
const MY_VPA = 'prasad@paypal'; 

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = url.slice(queryIndex + 1);
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      }
    }
  } catch (err) {
    console.log('Error parsing URL params:', err);
  }
  return params;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [pendingTxn, setPendingTxn] = useState<PendingTransaction | null>(null);

  const handleDeepLink = (url: string | null) => {
    if (!url) return;
    console.log('Received deep link in ChromePe PayPal App:', url);

    if (url.includes('chromepe://') || url.includes('paypal://')) {
      const params = parseUrlParams(url);
      const orderId = params.order_id || params.orderId || params.txnId || 'ORD-' + Date.now();
      const amount = params.amount || '120';
      const amountUsd = params.amountUsd;
      const merchant = params.merchant || params.merchantName || 'Online Merchant';
      const description = params.description || `PayPal Checkout (#${orderId.slice(-6)})`;

      setShowSplash(false);
      setPendingTxn({
        txnId: orderId,
        amount,
        amountUsd,
        vpa: 'paypal-sandbox',
        merchantName: merchant,
        description,
      });
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Don't poll if we are already showing a transaction modal
      if (pendingTxn) return;
      
      try {
        const response = await fetch(`${BACKEND_URL}/payment/pending?vpa=${MY_VPA}`);
        const data: any = await response.json();
        
        if (data && data.pending && data.txnId) {
          setPendingTxn(data);
        }
      } catch (e) {
        // Polling error ignored
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pendingTxn]);

  const handleApprove = async (txnId: string) => {
    try {
      fetch(`${BACKEND_URL}/payment/${txnId}/callback`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'SUCCESS'}),
      }).catch(() => {});

      setPendingTxn(null);

      // Return to Iqooistant Chat App via deep link with APPROVED status and orderId
      const returnUrl = `iqooistant://approve?status=APPROVED&order_id=${encodeURIComponent(txnId)}`;
      Linking.openURL(returnUrl).catch(() => {
        // Fallback scheme variant
        Linking.openURL(`iqooistant://payment?status=success&orderId=${encodeURIComponent(txnId)}`).catch(() => {
          console.log('Could not return to Iqooistant app via deep link');
        });
      });
    } catch (e) {
      console.error('Approve error:', e);
    }
  };

  const handleReject = async () => {
    if (!pendingTxn) return;
    const txnId = pendingTxn.txnId;
    try {
      fetch(`${BACKEND_URL}/payment/${txnId}/callback`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'FAILED'}),
      }).catch(() => {});
    } catch (e) {
      console.error('Reject error:', e);
    } finally {
      setPendingTxn(null);
      const returnUrl = `iqooistant://approve?status=DECLINED&order_id=${encodeURIComponent(txnId)}`;
      Linking.openURL(returnUrl).catch(() => {
        Linking.openURL(`iqooistant://payment?status=declined&orderId=${encodeURIComponent(txnId)}`).catch(() => {
          console.log('Could not return');
        });
      });
    }
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider style={{flex: 1}}>
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : (
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        )}
        
        <TransactionApprovalModal
          visible={!!pendingTxn}
          transaction={pendingTxn}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
