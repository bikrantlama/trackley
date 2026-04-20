import { Platform } from 'react-native';

const adUnitId = __DEV__ ? 'ca-app-pub-3940256099942544/1033173712' : (process.env.EXPO_PUBLIC_AD_UNIT_ID || 'ca-app-pub-3940256099942544/1033173712');

export const initAds = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    // @ts-ignore - module optional at runtime
    const mobileAds = await import('react-native-google-mobile-ads');
    await mobileAds.default();
    console.log('Ads Initialized (Native)');
  } catch (e) {
    console.log('Ad module not available:', e);
  }
};

export const showStartupAd = (): (() => void) => {
  if (Platform.OS === 'web') return () => {};
  
  try {
    // @ts-ignore - module optional at runtime
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
    // @ts-ignore - module optional at runtime
    const interstitial = InterstitialAd.createForAdRequest(adUnitId, { keywords: ['fitness', 'lifestyle'] });
    // @ts-ignore - module optional at runtime
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitial.show();
    });
    // @ts-ignore - module optional at runtime
    interstitial.load();
    return unsubscribe;
  } catch {
    return () => {};
  }
};
