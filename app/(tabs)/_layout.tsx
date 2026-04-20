import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { PremiumBackground } from "@/components/PremiumBackground";
import { useTheme } from "@/hooks/useTheme";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="habits">
        <Icon sf={{ default: "checkmark.circle", selected: "checkmark.circle.fill" }} />
        <Label>Habits</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fitness">
        <Icon sf={{ default: "figure.run", selected: "figure.run.circle.fill" }} />
        <Label>Fitness</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="finance">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Coins</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="store">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Store</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Friends</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        tabBarPosition: "bottom",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : (isWeb ? "rgba(255,255,255,0.05)" : colors.background),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          ) : null,
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Ionicons name="home" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="checkmark.circle" tintColor={color} size={22} /> : <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: "Fitness",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="figure.run" tintColor={color} size={22} /> : <MaterialCommunityIcons name="run" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Coins",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="creditcard" tintColor={color} size={22} /> : <MaterialCommunityIcons name="wallet-outline" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          href: null,
          title: "Store",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bag" tintColor={color} size={22} /> : <MaterialCommunityIcons name="store-outline" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: null,
          title: "Friends",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Ionicons name="people" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.circle" tintColor={color} size={22} /> : <Ionicons name="person-circle-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="achievements" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <PremiumBackground>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
    </PremiumBackground>
  );
}
