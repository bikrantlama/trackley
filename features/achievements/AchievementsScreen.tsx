import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  FadeInRight,
  Layout, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  useSharedValue
} from "react-native-reanimated";

import { useApp, type Achievement } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { CrystalCard } from "@/components/CrystalCard";

const { width } = Dimensions.get("window");

type Category = "all" | "habits" | "fitness" | "finance" | "social" | "level";

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "trophy" },
  { key: "habits", label: "Habits", icon: "checkbox-marked" },
  { key: "fitness", label: "Fitness", icon: "run" },
  { key: "finance", label: "Finance", icon: "cash" },
  { key: "social", label: "Social", icon: "account-group" },
  { key: "level", label: "Level", icon: "star" },
];

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const colors = useTheme();
  const unlocked = !!achievement.unlockedAt;

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 60).springify()}
      layout={Layout.springify()}
    >
      <CrystalCard 
        style={[
          styles.card, 
          unlocked && { borderColor: "#F59E0B60" },
          !unlocked && { opacity: 0.6 }
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={unlocked ? ["#F59E0B", "#D97706"] : [colors.secondary, colors.background]}
            style={styles.iconGlow}
          />
          <View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: unlocked ? "#F59E0B" : colors.border }]}>
            <MaterialCommunityIcons
              name={achievement.icon as any}
              size={24}
              color={unlocked ? "#F59E0B" : colors.mutedForeground}
            />
          </View>
          {unlocked && (
            <Animated.View entering={FadeInRight.delay(200)} style={styles.unlockIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
            </Animated.View>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
          <Text
            style={[styles.desc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>
          {unlocked && achievement.unlockedAt && (
            <Text style={[styles.date, { color: "#F59E0B90" }]}>
              Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.rightCol}>
          <View style={[styles.xpBadge, { backgroundColor: unlocked ? "#F59E0B15" : colors.secondary }]}>
            <Text style={[styles.xpText, { color: unlocked ? "#F59E0B" : colors.mutedForeground }]}>
              +{achievement.xpReward} XP
            </Text>
          </View>
        </View>
      </CrystalCard>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const colors = useTheme();
  const { achievements } = useApp();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = useMemo(() => 
    activeCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === activeCategory)
  , [achievements, activeCategory]);

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const progressPercent = (unlockedCount / achievements.length) * 100;
  const earnedXP = achievements.filter((a) => a.unlockedAt).reduce((sum, a) => sum + (a.xpReward || 0), 0);
  const totalAvailableXP = achievements.reduce((sum, a) => sum + (a.xpReward || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>MILESTONES</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Hall of Fame</Text>
          </View>
          <View style={styles.unlockedBox}>
            <Text style={[styles.unlockedCount, { color: "#F59E0B" }]}>{unlockedCount}</Text>
            <Text style={[styles.unlockedLabel, { color: colors.mutedForeground }]}>/{achievements.length}</Text>
          </View>
        </View>

        <View style={[styles.progressContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressTop}>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>Overall Mastery</Text>
            <Text style={[styles.progressPercent, { color: "#F59E0B" }]}>{Math.round(progressPercent)}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.secondary }]}>
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressBarFill, 
                { width: `${progressPercent}%` as `${number}%` }
              ]}
            />
          </View>
          <View style={styles.xpTotalsRow}>
            <Text style={[styles.xpEarned, { color: "#F59E0B" }]}>
              {earnedXP.toLocaleString()} XP earned
            </Text>
            <Text style={[styles.xpTotal, { color: colors.mutedForeground }]}>
              / {totalAvailableXP.toLocaleString()} total
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.catList}
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => {
                setActiveCategory(item.key);
                Haptics.selectionAsync();
              }}
              style={[
                styles.catBtn,
                {
                  backgroundColor: activeCategory === item.key ? colors.primary : colors.card,
                  borderColor: activeCategory === item.key ? colors.primary : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons 
                name={item.icon as any} 
                size={16} 
                color={activeCategory === item.key ? "#fff" : colors.mutedForeground} 
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.catLabel,
                  { color: activeCategory === item.key ? "#fff" : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <AchievementCard achievement={item} index={index} />}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(200)} style={styles.empty}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="trophy-outline" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No achievements in this category yet. Keep pushing!
            </Text>
          </Animated.View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 10 },
  headerSub: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  headerTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  unlockedBox: { flexDirection: "row", alignItems: "baseline" },
  unlockedCount: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  unlockedLabel: { fontSize: 16, fontWeight: "600" },

  progressContainer: { padding: 16, borderRadius: 24, borderWidth: 1.5 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  progressText: { fontSize: 13, fontWeight: "600" },
  progressPercent: { fontSize: 13, fontWeight: "800" },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, borderRadius: 4 },
  xpTotalsRow: { flexDirection: "row", alignItems: "baseline", marginTop: 10, gap: 2 },
  xpEarned: { fontSize: 13, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  xpTotal: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  filterSection: { marginBottom: 15 },
  catList: { paddingHorizontal: 20, gap: 10 },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  catLabel: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  iconContainer: { position: "relative" },
  iconGlow: { position: "absolute", top: -4, left: -4, right: -4, bottom: -4, borderRadius: 18, opacity: 0.15 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  unlockIndicator: { position: "absolute", top: -6, right: -6, backgroundColor: "#fff", borderRadius: 10 },
  
  title: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 4 },
  desc: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18, opacity: 0.8 },
  date: { fontSize: 10, fontFamily: "Inter_700Bold", marginTop: 8, textTransform: "uppercase" },
  
  rightCol: { marginLeft: 10, alignItems: "flex-end" },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  xpText: { fontSize: 12, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyText: { textAlign: "center", fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 22 },
});
