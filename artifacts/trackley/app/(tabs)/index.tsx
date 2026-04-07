import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const XP_PER_LEVEL = 300;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, xp, level, fitnessProfile, transactions, groups } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const completedToday = habits.filter((h) =>
    h.completedDates.includes(today)
  ).length;
  const totalHabits = habits.length;
  const progressPct = XP_PER_LEVEL > 0 ? ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 : 0;

  const balance = transactions.reduce((sum, t) => {
    return t.type === "income" ? sum + t.amount : sum - t.amount;
  }, 0);

  const bmi =
    fitnessProfile.weight && fitnessProfile.height
      ? fitnessProfile.weight /
        Math.pow(fitnessProfile.height / 100, 2)
      : null;

  const topPad = 8;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 8,
        paddingBottom: 100 + bottomPad,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good day
          </Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Trackley
          </Text>
        </View>
        <View
          style={[
            styles.levelPill,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.levelPillText, { color: colors.xp }]}>
            LVL {level}
          </Text>
        </View>
      </View>

      <View style={[styles.xpRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.xpTextRow}>
          <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
            XP Progress
          </Text>
          <Text style={[styles.xpVal, { color: colors.xp }]}>
            {xp % XP_PER_LEVEL} / {XP_PER_LEVEL}
          </Text>
        </View>
        <View style={[styles.xpBarBg, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.xpBarFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.min(progressPct, 100)}%` as `${number}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.xpTotal, { color: colors.mutedForeground }]}>
          {xp} total XP
        </Text>
      </View>

      <View style={styles.cardsGrid}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/habits")}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="checkbox-marked-circle-outline"
            size={28}
            color={colors.primary}
          />
          <Text style={[styles.cardValue, { color: colors.foreground }]}>
            {completedToday}/{totalHabits}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            Habits Done
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/fitness")}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="run"
            size={28}
            color={colors.accent}
          />
          <Text style={[styles.cardValue, { color: colors.foreground }]}>
            {bmi ? bmi.toFixed(1) : "--"}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            BMI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/finance")}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="cash"
            size={28}
            color={balance >= 0 ? colors.success : colors.destructive}
          />
          <Text
            style={[
              styles.cardValue,
              {
                color: balance >= 0 ? colors.success : colors.destructive,
                fontSize: balance > 9999 ? 18 : 22,
              },
            ]}
            numberOfLines={1}
          >
            ${Math.abs(balance).toFixed(0)}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            {balance >= 0 ? "Balance" : "Deficit"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/finance")}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={28}
            color={colors.warning}
          />
          <Text style={[styles.cardValue, { color: colors.foreground }]}>
            {groups.length}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {totalHabits > 0 && (
        <View
          style={[
            styles.habitStreak,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.streakTitle, { color: colors.foreground }]}>
            Today's Habits
          </Text>
          {habits.slice(0, 3).map((h) => {
            const done = h.completedDates.includes(today);
            return (
              <View key={h.id} style={styles.streakRow}>
                <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                <Text
                  style={[
                    styles.streakName,
                    { color: done ? colors.mutedForeground : colors.foreground },
                    done && { textDecorationLine: "line-through" },
                  ]}
                  numberOfLines={1}
                >
                  {h.name}
                </Text>
                <Ionicons
                  name={done ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={done ? colors.primary : colors.mutedForeground}
                />
              </View>
            );
          })}
          {habits.length > 3 && (
            <Text style={[styles.moreHabits, { color: colors.mutedForeground }]}>
              +{habits.length - 3} more habits
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  appName: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  levelPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelPillText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  xpRow: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  xpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  xpLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  xpVal: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  xpBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  xpBarFill: { height: 6, borderRadius: 3 },
  xpTotal: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  card: {
    width: "47.5%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  cardValue: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  cardLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  habitStreak: {
    padding: 16,
    borderRadius: 16,
  },
  streakTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  streakName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  moreHabits: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
});
