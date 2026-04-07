import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp, getRankForLevel, RANK_THRESHOLDS } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const XP_PER_LEVEL = 300;

function QuickCard({
  icon,
  iconType,
  value,
  label,
  color,
  onPress,
}: {
  icon: string;
  iconType: "ionicons" | "mci";
  value: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + "18" }]}>
        {iconType === "ionicons" ? (
          <Ionicons name={icon as any} size={22} color={color} />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        )}
      </View>
      <Text style={[styles.cardValue, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const {
    habits, xp, level, fitnessProfile, transactions, groups, friends,
    profile, achievements, getTotalHabitsCompleted, getTotalWorkoutsCompleted,
  } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const progressPct = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  const balance = transactions.reduce((s, t) => t.type === "income" ? s + t.amount : s - t.amount, 0);
  const bmi = fitnessProfile.weight && fitnessProfile.height
    ? fitnessProfile.weight / Math.pow(fitnessProfile.height / 100, 2)
    : null;

  const rank = getRankForLevel(level);
  const rankInfo = RANK_THRESHOLDS.find((r) => r.rank === rank.rank) ?? RANK_THRESHOLDS[0];
  const nextRank = RANK_THRESHOLDS.find((r) => r.level > level);
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt).length;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            {profile.name ? profile.name : "Trackley"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8}>
          <View style={[styles.rankPill, { backgroundColor: rankInfo.color + "18", borderColor: rankInfo.color + "40" }]}>
            <Ionicons name={rankInfo.icon as any} size={14} color={rankInfo.color} />
            <Text style={[styles.rankPillText, { color: rankInfo.color }]}>{rank.rank}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.xpTopRow}>
          <View>
            <Text style={[styles.xpLevelLabel, { color: colors.mutedForeground }]}>Level {level}</Text>
            <Text style={[styles.xpValue, { color: colors.xp }]}>{xp} XP</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/achievements")}
            style={[styles.achieveBtn, { backgroundColor: colors.gold + "18" }]}
          >
            <Ionicons name="trophy-outline" size={16} color={colors.gold} />
            <Text style={[styles.achieveBtnText, { color: colors.gold }]}>
              {unlockedAchievements}/{achievements.length}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.xpBarBg, { backgroundColor: colors.secondary }]}>
          <View style={[styles.xpBarFill, { backgroundColor: colors.primary, width: `${Math.min(progressPct, 100)}%` as `${number}%` }]} />
        </View>
        <View style={styles.xpBottomRow}>
          <Text style={[styles.xpProgress, { color: colors.mutedForeground }]}>
            {xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP to next level
          </Text>
          {nextRank && (
            <Text style={[styles.nextRankText, { color: nextRank.color }]}>
              → {nextRank.rank} at Lv.{nextRank.level}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        <QuickCard icon="checkbox-marked-circle-outline" iconType="mci" value={`${completedToday}/${habits.length}`} label="Habits Today" color={colors.primary} onPress={() => router.push("/(tabs)/habits")} />
        <QuickCard icon="run" iconType="mci" value={bmi ? bmi.toFixed(1) : "--"} label="BMI" color={colors.accent} onPress={() => router.push("/(tabs)/fitness")} />
        <QuickCard icon="cash-outline" iconType="ionicons" value={`₨${Math.abs(balance).toLocaleString("ne-NP")}`} label={balance >= 0 ? "Balance" : "Deficit"} color={balance >= 0 ? colors.success : colors.destructive} onPress={() => router.push("/(tabs)/finance")} />
        <QuickCard icon="people-outline" iconType="ionicons" value={friends.length.toString()} label="Friends" color={colors.warning} onPress={() => router.push("/(tabs)/friends")} />
      </View>

      {habits.length > 0 && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/habits")}
          style={[styles.habitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.85}
        >
          <View style={styles.habitsCardHeader}>
            <Text style={[styles.habitsCardTitle, { color: colors.foreground }]}>Today's Habits</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </View>
          {habits.slice(0, 4).map((h) => {
            const done = h.completedDates.includes(today);
            return (
              <View key={h.id} style={styles.habitRow}>
                <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                <Text
                  style={[styles.habitName, { color: done ? colors.mutedForeground : colors.foreground }, done && { textDecorationLine: "line-through" }]}
                  numberOfLines={1}
                >
                  {h.name}
                </Text>
                <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={18} color={done ? colors.primary : colors.mutedForeground} />
              </View>
            );
          })}
          {habits.length > 4 && (
            <Text style={[styles.moreText, { color: colors.mutedForeground }]}>+{habits.length - 4} more habits</Text>
          )}
        </TouchableOpacity>
      )}

      {fitnessProfile.goal && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/fitness")}
          style={[styles.fitnessCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.85}
        >
          <View style={styles.habitsCardHeader}>
            <View style={styles.fitCardLeft}>
              <MaterialCommunityIcons name="dumbbell" size={18} color={colors.accent} />
              <Text style={[styles.habitsCardTitle, { color: colors.foreground }]}>Fitness Goal</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.goalText, { color: colors.mutedForeground }]}>
            {fitnessProfile.goal === "lose_weight" ? "Lose Weight" : fitnessProfile.goal === "build_muscle" ? "Build Muscle" : "Stay Fit"} ·{" "}
            {getTotalWorkoutsCompleted()} workouts completed
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 110 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  appName: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold" },
  rankPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  rankPillText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  xpCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  xpTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  xpLevelLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  xpValue: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold" },
  achieveBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  achieveBtnText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  xpBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  xpBarFill: { height: 6, borderRadius: 3 },
  xpBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpProgress: { fontSize: 11, fontFamily: "Inter_400Regular" },
  nextRankText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  card: { width: "47.5%", padding: 14, borderRadius: 18, borderWidth: 1, alignItems: "center", gap: 6 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardValue: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  cardLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  habitsCard: { padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  habitsCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  habitsCardTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  habitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  habitName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  moreText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fitnessCard: { padding: 16, borderRadius: 18, borderWidth: 1 },
  fitCardLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
});
