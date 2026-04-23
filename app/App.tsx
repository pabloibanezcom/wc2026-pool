import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

const fontAssets = {
  'FIFASans-Regular': require('./assets/fonts/FIFASans-Regular.ttf'),
  'FIFASans-Medium': require('./assets/fonts/FIFASans-Medium.ttf'),
  'FWC26-NormalRegular': require('./assets/fonts/FWC26-NormalRegular.ttf'),
  'FWC26-NormalMedium': require('./assets/fonts/FWC26-NormalMedium.ttf'),
  'FWC26-UltraCondensedBlack': require('./assets/fonts/FWC26-UltraCondensedBlack.ttf'),
  'FWC26-UltraCondensedBold': require('./assets/fonts/FWC26-UltraCondensedBold.ttf'),
};

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const injectLink = (rel: string, href: string, extra?: Record<string, string>) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const el = document.createElement('link');
    el.rel = rel;
    el.href = href;
    if (extra) Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  };

  injectLink('manifest', '/manifest.json');
  injectLink('apple-touch-icon', '/icon-192.png');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
  }
}

export default function App() {
  useFonts(fontAssets);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}
