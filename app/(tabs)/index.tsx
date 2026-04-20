import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated as RNAnimated,
} from "react-native";

import { useApp, getRankForLevel, RANK_THRESHOLDS } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { Pedometer } from "expo-sensors";
import { LinearGradient } from "expo-linear-gradient";
import { CrystalCard } from "@/components/CrystalCard";

/** Returns a BMI category label */
function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#60A5FA" };
  if (bmi < 25)   return { label: "Normal", color: "#10D9A0" };
  if (bmi < 30)   return { label: "Overweight", color: "#F59E0B" };
  return { label: "Obese", color: "#F43F5E" };
}

/** Inline consecutive streak counter */
function getConsecutiveStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (sorted[i] === expected.toISOString().split("T")[0]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

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
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.cardWrapper}
      activeOpacity={0.8}
    >
      <CrystalCard style={styles.quickCard}>
        <View style={[styles.cardIcon, { backgroundColor: color + "18" }]}>
          {iconType === "ionicons" ? (
            <Ionicons name={icon as any} size={22} color={color} />
          ) : (
            <MaterialCommunityIcons name={icon as any} size={22} color={color} />
          )}
        </View>
        <Text style={[styles.cardValue, { color: theme.foreground }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.cardLabel, { color: theme.mutedForeground }]}>{label}</Text>
      </CrystalCard>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const {
    habits, xp, level, fitnessProfile, transactions, groups, friends,
    profile, achievements, coins, getTotalHabitsCompleted, getTotalWorkoutsCompleted,
  } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  
  const [stepCount, setStepCount] = React.useState(0);

  // Coin count bounce animation
  const coinScale = useRef(new RNAnimated.Value(1)).current;
  const prevCoins = useRef(coins || 0);
  useEffect(() => {
    if ((coins || 0) !== prevCoins.current) {
      prevCoins.current = coins || 0;
      RNAnimated.sequence([
        RNAnimated.spring(coinScale, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
        RNAnimated.spring(coinScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    }
  }, [coins]);

  React.useEffect(() => {
    let sub: Pedometer.Subscription | null = null;
    const initPedometer = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          
          try {
            const pastStepCount = await Pedometer.getStepCountAsync(start, end);
            if (pastStepCount) {
              setStepCount(pastStepCount.steps);
            }
          } catch (e) {
            console.log("Could not get past steps", e);
          }
          
          sub = Pedometer.watchStepCount(result => {
            // Only tracking active steps if we couldn't get history, or combining
            setStepCount(prev => prev + result.steps);
          });
        }
      } catch (e) {
        console.log("Pedometer error", e);
      }
    };
    initPedometer();
    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);
  
  // New Non-linear XP Logic
  const currentLvlXP = Math.pow(level - 1, 2) * 100;
  const nextLvlXP = Math.pow(level, 2) * 100;
  const xpInCurrentLevel = xp - currentLvlXP;
  const xpNeededForNext = nextLvlXP - currentLvlXP;
  const progressPct = (xpInCurrentLevel / xpNeededForNext) * 100;

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

  const DAILY_MESSAGES = [
    "Visualize your success, then execute with relentless intensity.",
    "Small wins every single day build a champion's monument.",
    "The grind never stops. Your future self is watching you right now.",
    "Consistency is the only bridge between your goals and your reality.",
    "Level up your life, one habit at a time. The world is waiting.",
    "Discipline is doing what needs to be done, even when you don't feel like it.",
    "Your habits define your future. Choose them wisely.",
    "Fortune favors the bold and the consistent.",
    "Greatness is not a destination, it is a daily practice.",
    "The only limits that exist are the ones you place on yourself."
  ];
  const dailyMessage = DAILY_MESSAGES[new Date().getDate() % DAILY_MESSAGES.length];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: theme.mutedForeground }]}>{greeting},</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8}>
            <Text style={[styles.appName, { color: theme.foreground }]}>
              {profile.name || "Champion"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/friends")} activeOpacity={0.8} style={styles.profileBtn}>
            <View style={[styles.avatarBorder, { borderColor: theme.primary + "40" }]}>
               <Ionicons name="person-add" size={18} color={theme.primary} style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8} style={styles.profileBtn}>
            <View style={[styles.avatarBorder, { borderColor: theme.primary + "40" }]}>
               <Ionicons name="person" size={20} color={theme.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Hero Section */}
      <CrystalCard style={styles.heroCard}>
        <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroSub, { color: theme.mutedForeground }]}>Current Rank</Text>
              <View style={styles.heroRankRow}>
                <Ionicons name={rankInfo.icon as any} size={22} color={rankInfo.color} />
                <Text style={[styles.heroRank, { color: rankInfo.color }]}>{rank.rank}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.walletHero, { backgroundColor: theme.gold + "12", borderColor: theme.gold + "20", borderWidth: 1 }]}
              onPress={() => router.push("/(tabs)/store")}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="database" size={16} color={theme.gold} />
              <Text style={[styles.walletHeroText, { color: theme.gold }]}>{coins || 0}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroProgressArea}>
            <View style={styles.heroProgressLabels}>
              <Text style={[styles.heroLvl, { color: theme.foreground }]}>Level {level}</Text>
              <Text style={[styles.heroXP, { color: theme.xp }]}>{xp} XP Total</Text>
            </View>
            <View style={[styles.xpBarBg, { backgroundColor: theme.secondary }]}>
              <View style={[styles.xpBarFill, { backgroundColor: theme.primary, width: `${Math.min(progressPct, 100)}%` as `${number}%` }]} />
            </View>
            <Text style={[styles.heroNeeded, { color: theme.mutedForeground }]}>
              {Math.floor(xpInCurrentLevel)} / {xpNeededForNext} XP to next rank
            </Text>
          </View>
        </View>
      </CrystalCard>

      <View style={styles.motivationBox}>
        <Text style={[styles.motivationText, { color: theme.mutedForeground }]}>
          “{dailyMessage}”
        </Text>
      </View>

      <View style={styles.grid}>
        <QuickCard icon="checkbox-marked-circle-outline" iconType="mci" value={`${completedToday}/${habits.length}`} label="Habits Today" color={theme.primary} onPress={() => router.push("/(tabs)/habits")} />
        <RNAnimated.View style={[styles.cardWrapper, { transform: [{ scale: coinScale }] }]}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/store")} activeOpacity={0.8} style={{ flex: 1 }}>
            <CrystalCard style={styles.quickCard}>
              <View style={[styles.cardIcon, { backgroundColor: (theme.gold || "#F59E0B") + "18" }]}>
                <MaterialCommunityIcons name="database" size={22} color={theme.gold || "#F59E0B"} />
              </View>
              <Text style={[styles.cardValue, { color: theme.foreground }]} numberOfLines={1}>
                {(coins || 0).toString()}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.mutedForeground }]}>My Coins</Text>
            </CrystalCard>
          </TouchableOpacity>
        </RNAnimated.View>
        <QuickCard icon="cash-outline" iconType="ionicons" value={`NRS ${Math.abs(balance).toLocaleString("en-US")}`} label="Budget" color={balance >= 0 ? theme.success : theme.destructive} onPress={() => router.push("/(tabs)/finance")} />
        <QuickCard icon="people-outline" iconType="ionicons" value={friends.length.toString()} label="Connections" color={theme.warning} onPress={() => router.push("/(tabs)/friends")} />
        <TouchableOpacity onPress={() => router.push("/(tabs)/fitness")} style={styles.cardWrapper} activeOpacity={0.8}>
          <CrystalCard style={styles.quickCard}>
            <View style={[styles.cardIcon, { backgroundColor: theme.accent + "18" }]}>
              <MaterialCommunityIcons name="run" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.cardValue, { color: theme.foreground }]} numberOfLines={1}>
              {bmi ? bmi.toFixed(1) : "--"}
            </Text>
            {bmi ? (
              <Text style={[styles.cardLabel, { color: getBmiCategory(bmi).color }]}>
                {getBmiCategory(bmi).label}
              </Text>
            ) : (
              <Text style={[styles.cardLabel, { color: theme.mutedForeground }]}>BMI</Text>
            )}
          </CrystalCard>
        </TouchableOpacity>
      </View>

      {habits.length > 0 ? (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/habits")}
          activeOpacity={0.85}
          style={styles.habitsWrapper}
        >
          <CrystalCard style={styles.habitsCard}>
            <View style={styles.habitsCardHeader}>
              <Text style={[styles.habitsCardTitle, { color: theme.foreground }]}>Today's Habits</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
            </View>
          {habits.slice(0, 4).map((h) => {
            const done = h.completedDates.includes(today);
            const streak = getConsecutiveStreak(h.completedDates);
            return (
              <View key={h.id} style={styles.habitRow}>
                <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                <Text
                  style={[styles.habitName, { color: done ? theme.mutedForeground : theme.foreground }, done && { textDecorationLine: "line-through" }]}
                  numberOfLines={1}
                >
                  {h.name}
                </Text>
                {streak >= 2 && !done && (
                  <View style={styles.miniStreakBadge}>
                    <Text style={styles.miniStreakText}>🔥{streak}</Text>
                  </View>
                )}
                <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={18} color={done ? theme.primary : theme.mutedForeground} />
              </View>
            );
          })}
            {habits.length > 4 && (
              <Text style={[styles.moreText, { color: theme.mutedForeground }]}>+{habits.length - 4} more habits</Text>
            )}
          </CrystalCard>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/habits")}
          activeOpacity={0.85}
          style={styles.habitsWrapper}
        >
          <CrystalCard style={[styles.habitsCard, { borderStyle: "dashed", borderColor: theme.primary + "40", alignItems: "center", justifyContent: "center", paddingVertical: 28 }]}>
            <View style={[styles.emptyHabitIcon, { backgroundColor: theme.primary + "12" }]}>
              <MaterialCommunityIcons name="star-plus-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.habitsCardTitle, { color: theme.foreground, marginTop: 12, fontSize: 16, fontWeight: "700" }]}>Start Your First Habit</Text>
            <Text style={[styles.moreText, { color: theme.mutedForeground, textAlign: "center", marginTop: 6 }]}>
              Small daily actions compound into{"\n"}extraordinary results.
            </Text>
            <View style={[styles.emptyHabitCTA, { backgroundColor: theme.primary }]}>
              <Text style={styles.emptyHabitCTAText}>Create a Habit</Text>
            </View>
          </CrystalCard>
        </TouchableOpacity>
      )}

      {fitnessProfile.goal ? (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/fitness")}
          activeOpacity={0.85}
          style={styles.fitnessWrapper}
        >
          <CrystalCard style={styles.fitnessCard}>
            <View style={styles.habitsCardHeader}>
              <View style={styles.fitCardLeft}>
                <MaterialCommunityIcons name="dumbbell" size={18} color={theme.accent} />
                <Text style={[styles.habitsCardTitle, { color: theme.foreground }]}>Fitness Goal</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
            </View>
          <Text style={[styles.goalText, { color: theme.mutedForeground }]}>
            {fitnessProfile.goal === "lose_weight" ? "Lose Weight" : fitnessProfile.goal === "build_muscle" ? "Build Muscle" : "Stay Fit"} ·{" "}
            {getTotalWorkoutsCompleted()} workouts completed
          </Text>
          </CrystalCard>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/fitness")}
          style={[styles.fitnessCard, { backgroundColor: "rgba(255,255,255,0.02)", borderColor: theme.border, borderStyle: "dashed" }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.habitsCardTitle, { color: theme.foreground, marginBottom: 4 }]}>Set Your Fitness Goal</Text>
          <Text style={[styles.goalText, { color: theme.mutedForeground }]}>
            Tell us your weight and target to unlock custom BMI plans.
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  cardWrapper: { width: "48%" },
  quickCard: { padding: 16, borderRadius: 24 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  cardValue: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  cardLabel: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    heroCard: { 
    padding: 0, 
    borderRadius: 32, 
    marginBottom: 16,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroInner: { padding: 20 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, zIndex: 1 },
  heroSub: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  heroRankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroRank: { fontSize: 24, fontWeight: "900", fontFamily: "Inter_700Bold" },
  
  walletHero: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 16,
  },
  walletHeroText: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },
  
  heroProgressArea: { zIndex: 1 },
  heroProgressLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 },
  heroLvl: { fontSize: 16, fontWeight: "800" },
  heroXP: { fontSize: 12, fontWeight: "600" },
  heroNeeded: { fontSize: 11, marginTop: 6, opacity: 0.8 },
  xpBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 4 },

  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  profileBtn: { padding: 2 },
  habitsWrapper: { marginBottom: 12 },
  habitsCard: { padding: 18, borderRadius: 28 },
  fitnessWrapper: { marginBottom: 12 },
  habitsCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  habitsCardTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  habitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  habitName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  moreText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fitnessCard: { padding: 18, borderRadius: 28, borderWidth: 1 },
  fitCardLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  motivationBox: { marginBottom: 16, paddingHorizontal: 8, alignItems: "center" },
  motivationText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 20, opacity: 0.55, textAlign: "center" },
  miniStreakBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: "rgba(245,158,11,0.15)" },
  miniStreakText: { fontSize: 11, fontWeight: "700", color: "#F59E0B" },
  emptyHabitIcon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyHabitCTA: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 16 },
  emptyHabitCTAText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});

