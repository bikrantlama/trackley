import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp, type Achievement } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Category = "all" | "habits" | "fitness" | "finance" | "social" | "level";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "habits", label: "Habits" },
  { key: "fitness", label: "Fitness" },
  { key: "finance", label: "Finance" },
  { key: "social", label: "Social" },
  { key: "level", label: "Level" },
];

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const colors = useColors();
  const unlocked = !!achievement.unlockedAt;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: unlocked ? colors.gold + "60" : colors.border,
          borderWidth: 1,
          opacity: unlocked ? 1 : 0.55,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: unlocked
              ? colors.gold + "20"
              : colors.secondary,
          },
        ]}
      >
        <Ionicons
          name={achievement.icon as any}
          size={26}
          color={unlocked ? colors.gold : colors.mutedForeground}
        />
      </View>
      <View style={{ flex: 1 }}>
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
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.rightCol}>
        <View
          style={[
            styles.xpBadge,
            { backgroundColor: colors.xp + "20" },
          ]}
        >
          <Text style={[styles.xpText, { color: colors.xp }]}>
            +{achievement.xpReward}
          </Text>
        </View>
        {unlocked && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.gold}
            style={{ marginTop: 6 }}
          />
        )}
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const colors = useColors();
  const { achievements } = useApp();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered =
    activeCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === activeCategory);

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.summary,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryLeft}>
          <Text style={[styles.summaryCount, { color: colors.gold }]}>
            {unlockedCount}
          </Text>
          <Text
            style={[styles.summaryLabel, { color: colors.mutedForeground }]}
          >
            of {achievements.length} unlocked
          </Text>
        </View>
        <View
          style={[styles.progressBg, { backgroundColor: colors.secondary }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.gold,
                width:
                  `${Math.round((unlockedCount / achievements.length) * 100)}%` as `${number}%`,
              },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          <FlatList
            data={CATEGORIES}
            keyExtractor={(c) => c.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveCategory(item.key)}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor:
                      activeCategory === item.key
                        ? colors.primary + "25"
                        : colors.secondary,
                    borderColor:
                      activeCategory === item.key
                        ? colors.primary
                        : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catLabel,
                    {
                      color:
                        activeCategory === item.key
                          ? colors.primary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <AchievementCard achievement={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No achievements in this category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  summaryLeft: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  summaryCount: { fontSize: 36, fontWeight: "700", fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  catList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 3 },
  desc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  date: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4 },
  rightCol: { alignItems: "center" },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  xpText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
