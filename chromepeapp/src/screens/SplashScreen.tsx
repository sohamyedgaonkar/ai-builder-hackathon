import React, {useEffect} from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import colors from '../theme/colors';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({onFinish}: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#003087" />
      <View style={styles.logoBox}>
        <Text style={styles.logo}>P</Text>
      </View>
      <Text style={styles.appName}>
        <Text style={{color: '#FFFFFF'}}>Pay</Text>
        <Text style={{color: '#0070BA'}}>Pal</Text>
      </Text>
      <Text style={styles.tagline}>ChromePe Companion • Sandbox Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003087',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#0070BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {
    fontSize: 52,
    color: '#FFC439',
    fontWeight: '900',
    fontStyle: 'italic',
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    fontWeight: '500',
  },
});
