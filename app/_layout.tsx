import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { initAds, showStartupAd } from "@/lib/ads";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

import { useApp } from "@/context/AppContext";
import { ActivityIndicator, View } from "react-native";

function RootLayoutNav() {
  const { userId, habits } = useApp();
  const [isReady, setIsReady] = React.useState(false);
  const router = useRouter();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    initAds();
    const unsubscribe = showStartupAd();
    const timer = setTimeout(() => setIsReady(true), 600);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Navigate based on auth state — use replace so "auth" is never in the back stack
  useEffect(() => {
    if (!isReady) return;
    if (userId !== prevUserId.current) {
      prevUserId.current = userId;
      if (userId) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth");
      }
    }
  }, [isReady, userId]);

  useEffect(() => {
    let sound: Audio.Sound | null = null;
    let soundTimeout: ReturnType<typeof setTimeout> | null = null;

    async function playSound() {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: "https://assets.mixkit.co/active_storage/sfx/2860/2860-preview.mp3" },
          { shouldPlay: true, isLooping: true }
        );
        sound = newSound;
        if (soundTimeout) clearTimeout(soundTimeout);
        soundTimeout = setTimeout(() => {
          if (sound) {
            sound.stopAsync().catch(() => {});
            sound.unloadAsync().catch(() => {});
            sound = null;
          }
        }, 10000);
      } catch (e) {
        console.log("Error playing reminder sound", e);
      }
    }

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as { habitId?: string };
      if (data?.habitId) {
        const habitExists = habits.some(h => h.id === data.habitId);
        if (habitExists) {
          playSound();
        }
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { habitId?: string };
      if (data?.habitId) {
        const habitExists = habits.some(h => h.id === data.habitId);
        if (habitExists) {
          router.push("/(tabs)/habits");
        }
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
      if (soundTimeout) clearTimeout(soundTimeout);
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, [habits, router]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0D0D1A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#10D9A0" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
              <RootLayoutNav />
            </AppProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
