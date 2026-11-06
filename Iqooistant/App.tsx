import React, { useState, useRef, useEffect } from 'react';
import { chatWithLLM, ChatMessage } from './src/llm/llmClient';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Linking,
  Image,
  ImageBackground,
  PermissionsAndroid,
  NativeModules,
  NativeEventEmitter,
  ScrollView,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { CustomSpeech } = NativeModules;
const speechEmitter = new NativeEventEmitter(CustomSpeech);

console.log("==== NATIVE MODULES WITH VOICE ====", Object.keys(NativeModules).filter(k => k.toLowerCase().includes('voice')));


type MessageType = 'user' | 'assistant' | 'tool_zomato' | 'tool_paypal' | 'tool_chromepe' | 'tool_makemytrip' | 'tool_makemytrip_hotels' | 'tool_redbus' | 'tool_redbus_buses' | 'tool_blinkit';

interface Message {
  id: string;
  type: MessageType;
  text?: string;
  toolData?: any;
  isCompleted?: boolean;
}

const ZOMATO_LOGO = require('./assets/zomato_logo.png');
const PAYPAL_LOGO = { uri: 'https://img.icons8.com/color/144/000000/paypal.png' };
const CHROMEPE_LOGO = PAYPAL_LOGO;
const MAKEMYTRIP_LOGO = require('./assets/makemytrip_logo.png');
const REDBUS_LOGO = require('./assets/redbus_logo.png');
const BLINKIT_LOGO = require('./assets/blinkit_logo.png');

// Markdown parser
const renderMarkdownText = (text: string | undefined, baseStyle: any) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={{ fontWeight: 'bold' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

// Micro-animation component for Tool Calls
const ToolCallIndicator = ({ type, data, isCompleted, onApprove }: { type: 'zomato' | 'paypal' | 'chromepe' | 'makemytrip' | 'redbus' | 'blinkit', data?: any, isCompleted?: boolean, onApprove?: () => void }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCompleted) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, isCompleted]);

  const getStatusText = (originalText: string) => {
    if (!isCompleted) return originalText;
    if (originalText === 'Adding to cart...') return 'Added to cart';
    if (originalText === 'Adding to Cart...') return 'Added to Cart';
    if (originalText === 'Searching hotels...') return 'Searched hotels';
    if (originalText === 'Selecting hotel...') return 'Selected hotel';
    if (originalText === 'Searching buses...') return 'Searched buses';
    if (originalText === 'Selecting bus...') return 'Selected bus';
    if (originalText === 'Browsing Groceries...') return 'Browsed Groceries';
    if (originalText === 'Browsing menu...') return 'Browsed menu';
    if (originalText === 'Connecting to Zomato...') return 'Connected to Zomato';
    if (originalText === 'Connecting to MMT...') return 'Connected to MMT';
    if (originalText === 'Connecting to RedBus...') return 'Connected to RedBus';
    if (originalText === 'Connecting to Blinkit...') return 'Connected to Blinkit';
    return originalText;
  };

  if (type === 'zomato') {
    return (
      <Animated.View style={[styles.toolContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={ZOMATO_LOGO} style={[styles.toolLogo, { backgroundColor: '#e23744', borderRadius: 8 }]} resizeMode="contain" />
        <View style={styles.toolTextContainer}>
          <Text style={styles.toolTitle}>Zomato</Text>
          <Text style={styles.toolSubtitle}>{getStatusText(data?.query || 'Connecting to Zomato...')}</Text>
        </View>
      </Animated.View>
    );
  }

  if (type === 'paypal' || type === 'chromepe') {
    const isSuccess = data?.status === 'APPROVED' || data?.status === 'COMPLETED';
    const isFailed = data?.status === 'DECLINED' || data?.status === 'TIMEOUT';
    
    let title = 'PayPal Sandbox Approval';
    let subtitle = data?.orderId 
      ? `Order #${data.orderId} • ₹${data.amount || 0} (~$${data.amountUsd || (data.amount / 85).toFixed(2)} USD)`
      : 'Review & authorize payment on PayPal';
    let hideButton = false;

    if (isCompleted) {
      hideButton = true;
      if (isSuccess) {
        title = 'PayPal Payment Done';
        subtitle = `Order #${data?.orderId || ''} captured successfully`;
      } else if (isFailed) {
        title = 'Payment Failed';
        subtitle = data?.status === 'TIMEOUT' ? 'Approval timed out' : 'Declined on PayPal Sandbox';
      } else {
        title = 'Payment Processed';
        subtitle = 'PayPal transaction completed';
      }
    }

    return (
      <Animated.View style={[styles.toolContainer, styles.chromepeContainer, { transform: [{ scale: pulseAnim }], borderColor: '#0070ba', backgroundColor: '#f4f9fd' }]}>
        <Image source={PAYPAL_LOGO} style={styles.toolLogo} resizeMode="contain" />
        <View style={styles.toolTextContainer}>
          <Text style={[styles.toolTitle, { color: '#003087' }]}>{title}</Text>
          <Text style={styles.toolSubtitle}>{subtitle}</Text>
        </View>
        {!hideButton && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.approveButton, { backgroundColor: '#ffc439', paddingHorizontal: 16 }]}
              onPress={() => {
                const orderId = data?.orderId || 'ORD-' + Date.now();
                const amount = data?.amount || data?.amountUsd || '120';
                const amountUsd = data?.amountUsd || (Number(amount) / 83.3).toFixed(2);
                const merchant = data?.merchant || 'Zomato Foods';
                const deepLink = `chromepe://approve?order_id=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount)}&amountUsd=${encodeURIComponent(amountUsd)}&merchant=${encodeURIComponent(merchant)}`;
                
                Linking.openURL(deepLink).catch(() => {
                  console.log('Falling back to direct approval');
                  if (onApprove) {
                    onApprove();
                  }
                });
              }}>
              <Text style={[styles.approveButtonText, { color: '#003087', fontWeight: '800' }]}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  }

  if (type === 'makemytrip') {
    return (
      <Animated.View style={[styles.toolContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={MAKEMYTRIP_LOGO} style={[styles.toolLogo, { backgroundColor: '#d83e28', borderRadius: 8 }]} resizeMode="contain" />
        <View style={styles.toolTextContainer}>
          <Text style={styles.toolTitle}>MakeMyTrip</Text>
          <Text style={styles.toolSubtitle}>{getStatusText(data?.query || 'Connecting to MMT...')}</Text>
        </View>
      </Animated.View>
    );
  }

  if (type === 'redbus') {
    return (
      <Animated.View style={[styles.toolContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={REDBUS_LOGO} style={[styles.toolLogo, { backgroundColor: '#d84e55', borderRadius: 8 }]} resizeMode="contain" />
        <View style={styles.toolTextContainer}>
          <Text style={styles.toolTitle}>RedBus</Text>
          <Text style={styles.toolSubtitle}>{getStatusText(data?.query || 'Connecting to RedBus...')}</Text>
        </View>
      </Animated.View>
    );
  }

  if (type === 'blinkit') {
    return (
      <Animated.View style={[styles.toolContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={BLINKIT_LOGO} style={[styles.toolLogo, { backgroundColor: '#f2cf3f', borderRadius: 8 }]} resizeMode="contain" />
        <View style={styles.toolTextContainer}>
          <Text style={styles.toolTitle}>Blinkit</Text>
          <Text style={styles.toolSubtitle}>{getStatusText(data?.query || 'Connecting to Blinkit...')}</Text>
        </View>
      </Animated.View>
    );
  }

  return null;
};

const AmplitudeVisualizer = ({ isListening }: { isListening: boolean }) => {
  const anim1 = useRef(new Animated.Value(1)).current;
  const anim2 = useRef(new Animated.Value(1)).current;
  const anim3 = useRef(new Animated.Value(1)).current;
  const anim4 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening) {
      anim1.stopAnimation();
      anim2.stopAnimation();
      anim3.stopAnimation();
      anim4.stopAnimation();
      anim1.setValue(1);
      anim2.setValue(1);
      anim3.setValue(1);
      anim4.setValue(1);
      return;
    }

    const startPulse = (anim: Animated.Value, delay: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 2.5,
            duration: duration,
            delay: delay,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: false,
          })
        ])
      ).start();
    };

    startPulse(anim1, 0, 300);
    startPulse(anim2, 100, 250);
    startPulse(anim3, 200, 350);
    startPulse(anim4, 150, 400);

  }, [isListening, anim1, anim2, anim3, anim4]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 16, paddingHorizontal: 4 }}>
      <Animated.View style={{ width: 3, height: 6, backgroundColor: isListening ? '#f44336' : '#1a73e8', marginHorizontal: 2, borderRadius: 2, transform: [{ scaleY: anim1 }] }} />
      <Animated.View style={{ width: 3, height: 10, backgroundColor: isListening ? '#f44336' : '#1a73e8', marginHorizontal: 2, borderRadius: 2, transform: [{ scaleY: anim2 }] }} />
      <Animated.View style={{ width: 3, height: 14, backgroundColor: isListening ? '#f44336' : '#1a73e8', marginHorizontal: 2, borderRadius: 2, transform: [{ scaleY: anim3 }] }} />
      <Animated.View style={{ width: 3, height: 8, backgroundColor: isListening ? '#f44336' : '#1a73e8', marginHorizontal: 2, borderRadius: 2, transform: [{ scaleY: anim4 }] }} />
    </View>
  );
};

export default function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastInputMethod, setLastInputMethod] = useState<'keyboard' | 'voice'>('keyboard');

  // AF Framework State
  const [isAFModalVisible, setAFModalVisible] = useState(false);
  const [toolsConfig, setToolsConfig] = useState<Record<string, boolean>>({
    zomato: true,
    makemytrip: true,
    redbus: true,
    blinkit: true,
    paypal: true,
    chromepe: true
  });

  useEffect(() => {
    const startSub = speechEmitter.addListener('onSpeechStart', () => setIsListening(true));
    const endSub = speechEmitter.addListener('onSpeechEnd', () => setIsListening(false));
    const resultSub = speechEmitter.addListener('onSpeechResults', (e: any) => {
      // Voice engine sends an object with value array, e.g. { value: ["hello"] }
      setLastInputMethod('voice');
      if (e && e.value && e.value.length > 0) {
        setInputText(e.value[0]);
      } else if (typeof e === 'string') {
        setInputText(e);
      }
    });
    const errorSub = speechEmitter.addListener('onSpeechError', (e: any) => {
      // Use console.log instead of console.error to prevent RedBox for common errors like 7 (NO_MATCH)
      console.log('Speech error:', e);
      setIsListening(false);
    });

    return () => {
      startSub.remove();
      endSub.remove();
      resultSub.remove();
      errorSub.remove();
    };
  }, []);

  const startListening = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Gemini needs access to your microphone so you can speak to it.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Microphone permission denied');
        return;
      }
    }
    try {
      CustomSpeech.startListening();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    try {
      CustomSpeech.stopListening();
    } catch (e) {
      console.error(e);
    }
  };

  const activeTransactionId = useRef<string | null>(null);
  const paymentResolver = useRef<((status: string) => void) | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const handleUrl = (url: string | null | undefined) => {
      if (url && url.includes('iqooistant://')) {
        const isDeclined = url.includes('status=declined') || url.includes('status=DECLINED');
        const status = isDeclined ? 'DECLINED' : 'COMPLETED';
        const resolution = isDeclined ? 'DECLINED' : 'APPROVED';

        let extractedOrderId = '';
        const orderMatch = url.match(/[?&](?:order_id|orderId)=([^&]+)/);
        if (orderMatch) {
          extractedOrderId = decodeURIComponent(orderMatch[1]);
        }

        const currentTxnId = activeTransactionId.current;
        activeTransactionId.current = null; // Clear active txn to prevent duplicate fires

        setMessages(prev => prev.map(m => {
          if ((m.type === 'tool_paypal' || m.type === 'tool_chromepe') && (!currentTxnId || m.id === currentTxnId || (extractedOrderId && m.toolData?.orderId === extractedOrderId))) {
            return {
              ...m,
              isCompleted: true,
              toolData: {
                ...m.toolData,
                status,
                orderId: extractedOrderId || m.toolData?.orderId,
              },
            };
          }
          return m;
        }));

        if (paymentResolver.current) {
          paymentResolver.current(resolution);
          paymentResolver.current = null;
        }
      }
    };

    // Check if app was opened from deep link when fully closed
    Linking.getInitialURL().then(handleUrl);

    // Check if app was already in background
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => {
      subscription.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    const newUserMsg: Message = { id: Date.now().toString(), type: 'user', text: userText };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userText }];
    setChatHistory(newHistory);

    try {
      const finalHistory = await chatWithLLM(newHistory, (toolName, toolArgs, result) => {
        // Render UI feedback immediately when a tool is called
        if (['place_order', 'book_trip', 'book_bus', 'place_grocery_order'].includes(toolName)) {
          const txnId = Date.now().toString();
          activeTransactionId.current = txnId;

          const merchantName = 
            toolName === 'place_order' ? (toolArgs?.restaurant || 'Zomato Foods') :
            toolName === 'book_trip' ? (toolArgs?.hotel_name || 'MakeMyTrip Hotels') :
            toolName === 'book_bus' ? (toolArgs?.bus_name || 'RedBus Travels') :
            'Blinkit Groceries';
          
          setMessages((prev) => [...prev, {
            id: txnId,
            type: 'tool_paypal',
            toolData: {
              amount: result?.amountInr || result?.total || toolArgs?.total || 120,
              amountUsd: result?.amountUsd,
              orderId: result?.orderId,
              approvalUrl: result?.approvalUrl,
              merchant: merchantName,
              status: result?.status || 'CREATED',
            },
          }]);

          return new Promise((resolve) => {
            paymentResolver.current = resolve;
            
            // Auto-cancel if not approved in 35 seconds
            setTimeout(() => {
              if (activeTransactionId.current === txnId) {
                activeTransactionId.current = null;
                setMessages(prev => prev.map(m => (m.type === 'tool_paypal' || m.type === 'tool_chromepe') && m.id === txnId ? {
                   ...m,
                   isCompleted: true,
                   toolData: { ...m.toolData, status: 'COMPLETED' }
                } : m));
                
                if (paymentResolver.current) {
                  paymentResolver.current('APPROVED');
                  paymentResolver.current = null;
                }
              }
            }, 35000);
          });
        } else if (['search_hotels', 'select_hotel'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, {
              id: Date.now().toString(),
              type: 'tool_makemytrip',
              toolData: { query: toolName === 'search_hotels' ? 'Searching hotels...' : 'Selecting hotel...' },
            }];
          });
        } else if (['search_buses', 'select_bus'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, {
              id: Date.now().toString(),
              type: 'tool_redbus',
              toolData: { query: toolName === 'search_buses' ? 'Searching buses...' : 'Selecting bus...' },
            }];
          });
        } else if (['browse_groceries', 'add_grocery_to_cart'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, {
              id: Date.now().toString(),
              type: 'tool_blinkit',
              toolData: { query: toolName === 'browse_groceries' ? 'Browsing Groceries...' : 'Adding to Cart...' },
            }];
          });
        } else if (['browse_menu', 'add_to_cart', 'view_cart'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, {
              id: Date.now().toString(),
              type: 'tool_zomato',
              toolData: { query: toolName === 'browse_menu' ? 'Browsing menu...' : 'Adding to cart...' },
            }];
          });
        }
      }, useLocalLLM, toolsConfig);

      setChatHistory(finalHistory);
      
      // Extract hotel and bus results if any
      const newUIMessages: Message[] = [];
      const addedMessages = finalHistory.slice(newHistory.length);
      for (const msg of addedMessages) {
        if (msg.role === 'tool' && msg.name === 'search_hotels') {
          try {
            const result = JSON.parse(msg.content || '{}');
            if (result.success && result.hotels) {
              newUIMessages.push({
                id: (msg.tool_call_id || Date.now().toString()) + '_hotels',
                type: 'tool_makemytrip_hotels',
                toolData: { hotels: result.hotels }
              });
            }
          } catch(e) {}
        }
        if (msg.role === 'tool' && msg.name === 'search_buses') {
          try {
            const result = JSON.parse(msg.content || '{}');
            if (result.success && result.buses) {
              newUIMessages.push({
                id: (msg.tool_call_id || Date.now().toString()) + '_buses',
                type: 'tool_redbus_buses',
                toolData: { buses: result.buses }
              });
            }
          } catch(e) {}
        }
      }
      
      // Extract the final assistant text
      const lastMessage = finalHistory[finalHistory.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
        newUIMessages.push({
          id: Date.now().toString(),
          type: 'assistant',
          text: lastMessage.content,
        });
        
        if (lastInputMethod === 'voice') {
          try {
            CustomSpeech.speak(lastMessage.content);
          } catch(e) {
            console.log('TTS Error', e);
          }
        }
      }

      if (newUIMessages.length > 0) {
        setMessages((prev) => {
          const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
          return [...updated, ...newUIMessages];
        });
      }
    } catch (error) {
      console.error(error);
      // Suppressing error message in UI as requested by user
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([
      { id: Date.now().toString(), type: 'assistant', text: 'Hello! I am Gemini. I can help you order food and make payments seamlessly. How can I help you today?' },
    ]);
    setChatHistory([]);
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userMessageBubble}>
          <Text style={styles.userMessageText}>{item.text}</Text>
        </View>
      );
    }
    if (item.type === 'assistant') {
      return (
        <View style={styles.assistantMessageBubble}>
          <Text style={{fontSize: 20, color: '#aa65e8', marginTop: 2}}>✦</Text>
          {renderMarkdownText(item.text, styles.assistantMessageText)}
        </View>
      );
    }
    if (item.type === 'tool_zomato') {
      return (
        <View style={styles.toolWrapper}>
          <ToolCallIndicator type="zomato" data={item.toolData} isCompleted={item.isCompleted} />
        </View>
      );
    }
    if (item.type === 'tool_paypal' || item.type === 'tool_chromepe') {
      return (
        <View style={styles.toolWrapper}>
          <ToolCallIndicator
            type="paypal"
            data={item.toolData}
            isCompleted={item.isCompleted}
            onApprove={() => {
              if (paymentResolver.current) {
                paymentResolver.current('APPROVED');
                paymentResolver.current = null;
              }
            }}
          />
        </View>
      );
    }
    if (item.type === 'tool_makemytrip') {
      return (
        <View style={styles.toolWrapper}>
          <ToolCallIndicator type="makemytrip" data={item.toolData} isCompleted={item.isCompleted} />
        </View>
      );
    }
    if (item.type === 'tool_redbus') {
      return (
        <View style={styles.toolWrapper}>
          <ToolCallIndicator type="redbus" data={item.toolData} isCompleted={item.isCompleted} />
        </View>
      );
    }
    if (item.type === 'tool_blinkit') {
      return (
        <View style={styles.toolWrapper}>
          <ToolCallIndicator type="blinkit" data={item.toolData} isCompleted={item.isCompleted} />
        </View>
      );
    }
    if (item.type === 'tool_makemytrip_hotels') {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 12}} contentContainerStyle={{paddingHorizontal: 16}}>
          {item.toolData.hotels.map((hotel: any) => (
            <View key={hotel.id} style={styles.hotelCard}>
              <Image source={{ uri: hotel.image_url }} style={styles.hotelImage} resizeMode="cover" />
              <View style={styles.hotelInfo}>
                <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
                <Text style={styles.hotelDetails}>{hotel.city} • ⭐ {hotel.rating}</Text>
                <Text style={styles.hotelPrice}>₹{hotel.price} <Text style={styles.hotelPriceNight}>/ night</Text></Text>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }
    if (item.type === 'tool_redbus_buses') {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 12}} contentContainerStyle={{paddingHorizontal: 16}}>
          {item.toolData.buses.map((bus: any) => (
            <View key={bus.id} style={styles.busCard}>
              <View style={styles.busHeader}>
                <Text style={styles.busOperator} numberOfLines={1}>{bus.operator}</Text>
                <Text style={styles.busRating}>⭐ {bus.rating}</Text>
              </View>
              <Text style={styles.busType}>{bus.type}</Text>
              <Text style={styles.busRoute}>{bus.route}</Text>
              <View style={styles.busFooter}>
                <Text style={styles.busTime}>{bus.departure} - {bus.arrival}</Text>
                <Text style={styles.busPrice}>₹{bus.price}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }
    return null;
  };

  return (
    <ImageBackground source={require('./assets/gradient_bg.jpg')} style={styles.safeArea} resizeMode="cover">
      {/* @ts-ignore: backgroundColor is a valid Android property */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Text style={{fontSize: 20, color: '#5f6368'}}>≡</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setAFModalVisible(true)} style={styles.headerTitleButton}>
            <Text style={styles.headerTitleText}>Gemini 3 Fast </Text>
            <Text style={{fontSize: 12, color: '#5f6368'}}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={resetChat} style={styles.headerIconButton}>
            <Text style={{fontSize: 20, color: '#5f6368'}}>⟳</Text>
          </TouchableOpacity>
        </View>

        {/* AF Framework Modal */}
        <Modal
          visible={isAFModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAFModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Android Functions (AF)</Text>
                <TouchableOpacity onPress={() => setAFModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{width: '100%'}}>
                {[
                  { id: 'zomato', name: 'Zomato', logo: ZOMATO_LOGO, bgColor: '#e23744' },
                  { id: 'makemytrip', name: 'MakeMyTrip', logo: MAKEMYTRIP_LOGO, bgColor: '#d83e28' },
                  { id: 'redbus', name: 'RedBus', logo: REDBUS_LOGO, bgColor: '#d84e55' },
                  { id: 'blinkit', name: 'Blinkit', logo: BLINKIT_LOGO, bgColor: '#f2cf3f' },
                  { id: 'paypal', name: 'PayPal Sandbox', logo: PAYPAL_LOGO, bgColor: '#ffffff' },
                ].map(app => (
                  <View key={app.id} style={styles.appToggleRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Image source={app.logo} style={[styles.appToggleLogo, { backgroundColor: app.bgColor }]} resizeMode="contain" />
                      <Text style={styles.appToggleName}>{app.name}</Text>
                    </View>
                    <Switch
                      value={toolsConfig[app.id]}
                      onValueChange={(val) => setToolsConfig(prev => ({...prev, [app.id]: val}))}
                      trackColor={{ false: '#e5e5ea', true: '#34c759' }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 400}}>
              <Text style={{fontSize: 50, color: '#aa65e8', marginBottom: 16}}>✦</Text>
              <Text style={{fontSize: 28, fontWeight: '500', color: '#1f1f1f', textAlign: 'center'}}>What should we{'\n'}focus on?</Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.assistantMessageBubble, { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 10, paddingHorizontal: 16 }]}>
                <ActivityIndicator size="small" color="#8e8e93" style={{ marginRight: 8 }} />
                <Text style={{ color: '#1a1a1c', fontSize: 14 }}>Processing...</Text>
              </View>
            ) : undefined
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'android' ? 40 : 32 }]}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity>
              <Text style={{fontSize: 28, color: '#5f6368', paddingHorizontal: 12, fontWeight: '300'}}>+</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Ask Gemini"
              placeholderTextColor="#5f6368"
              value={inputText}
              onChangeText={(text) => {
                setLastInputMethod('keyboard');
                setInputText(text);
              }}
              multiline
            />
            
            {(!isListening && inputText.trim().length > 0) ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                onPressIn={startListening}
                onPressOut={stopListening}
              >
                <Image 
                  source={{ uri: 'https://img.icons8.com/material-rounded/24/5f6368/microphone.png' }}
                  style={{ width: 24, height: 24, tintColor: isListening ? '#f44336' : '#5f6368' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.voiceVisualizerButton}>
               <View style={{backgroundColor: '#e8f0fe', borderRadius: 20, padding: 8}}>
                 <AmplitudeVisualizer isListening={isListening} />
               </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f4f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5f6368',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f1f1f',
    letterSpacing: -0.5,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
  },
  reloadIcon: {
    fontSize: 18,
    color: '#8e8e93',
    fontWeight: '600',
  },
  messageList: {
    padding: 16,
    paddingBottom: 140,
    flexGrow: 1,
  },
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#f0f4f9',
    padding: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    maxWidth: '85%',
    marginBottom: 20,
  },
  userMessageText: {
    color: '#1f1f1f',
    fontSize: 16,
    lineHeight: 24,
  },
  assistantMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 24,
    maxWidth: '90%',
    flexDirection: 'row',
  },
  assistantMessageText: {
    color: '#1f1f1f',
    fontSize: 16,
    lineHeight: 26,
    flex: 1,
    marginLeft: 8,
  },
  toolWrapper: {
    alignSelf: 'center',
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  toolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: '90%',
  },
  chromepeContainer: {
    borderColor: 'rgba(26, 115, 232, 0.2)',
    backgroundColor: '#f8faff',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  toolLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 8,
  },
  toolTextContainer: {
    flex: 1,
  },
  toolTitle: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  toolSubtitle: {
    color: '#8e8e93',
    fontSize: 13,
  },
  approveButton: {
    marginTop: 12,
    backgroundColor: '#34A853',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 40,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    color: '#1f1f1f',
    paddingHorizontal: 8,
    paddingVertical: 14,
    fontSize: 17,
    maxHeight: 120,
    minHeight: 50,
  },
  micButton: {
    padding: 10,
  },
  voiceVisualizerButton: {
    padding: 6,
    paddingRight: 8,
  },
  sendButton: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
  sendButtonText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '600',
  },
  hotelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  hotelImage: {
    width: 220,
    height: 140,
    backgroundColor: '#e5e5ea',
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  hotelDetails: {
    fontSize: 13,
    color: '#8e8e93',
    marginBottom: 8,
  },
  hotelPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34c759',
  },
  hotelPriceNight: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8e8e93',
  },
  busCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 12,
    width: 240,
    padding: 16,
    shadowColor: '#d84e55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#d84e55',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  busOperator: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    flex: 1,
  },
  busRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff9500',
  },
  busType: {
    fontSize: 13,
    color: '#8e8e93',
    marginBottom: 12,
  },
  busRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  busFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  busTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3a3a3c',
  },
  busPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34c759',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  appToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  appToggleLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 8,
  },
  appToggleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
});
