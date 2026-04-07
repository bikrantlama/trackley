import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const HABIT_EMOJIS = [
  "🏃",
  "📚",
  "💧",
  "🧘",
  "🥗",
  "😴",
  "💊",
  "🎯",
  "🎸",
  "✍️",
  "🧹",
  "🌱",
];

const XP_PER_LEVEL = 300;
const XP_PER_HABIT = 25;

function HabitCard({
  habit,
  onToggle,
  onDelete,
}: {
  habit: ReturnType<typeof useApp>["habits"][0];
  onToggle: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const today = new Date().toISOString().split("T")[0];
  const done = habit.completedDates.includes(today);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(0.93, { damping: 12 }),
      withSpring(1, { damping: 8 })
    );
    if (!done) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 400 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  }

  const streak = habit.completedDates.length;

  return (
    <Animated.View style={[animStyle, { marginBottom: 10 }]}>
      <Animated.View
        style={[
          glowStyle,
          StyleSheet.absoluteFillObject,
          {
            borderRadius: 16,
            backgroundColor: colors.primary + "30",
          },
        ]}
      />
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: done ? colors.primary + "60" : colors.border,
            borderWidth: 1,
            borderRadius: 16,
          },
        ]}
      >
        <Text style={styles.emoji}>{habit.emoji}</Text>
        <View style={styles.cardBody}>
          <Text
            style={[styles.habitName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
          <Text style={[styles.streak, { color: colors.mutedForeground }]}>
            {streak} day{streak !== 1 ? "s" : ""} completed
          </Text>
        </View>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.checkBtn,
            {
              backgroundColor: done
                ? colors.primary
                : colors.secondary,
              borderRadius: 20,
            },
          ]}
        >
          <Ionicons
            name={done ? "checkmark" : "checkmark-outline"}
            size={20}
            color={done ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={{ padding: 6, marginLeft: 4 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function XPBar({ xp, level }: { xp: number; level: number }) {
  const colors = useColors();
  const progress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL;

  return (
    <View
      style={[
        styles.xpContainer,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.xpRow}>
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.levelText, { color: colors.xp }]}>
            LVL {level}
          </Text>
        </View>
        <View style={styles.xpBarWrap}>
          <View
            style={[styles.xpBarBg, { backgroundColor: colors.secondary }]}
          >
            <View
              style={[
                styles.xpBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(progress * 100, 100)}%` as `${number}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
            {xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP
          </Text>
        </View>
        <Text style={[styles.totalXp, { color: colors.xp }]}>{xp} XP</Text>
      </View>
    </View>
  );
}

export default function HabitsScreen() {
  const colors = useColors();
  const { habits, xp, level, addHabit, deleteHabit, toggleHabit } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎯");

  function handleAdd() {
    if (!newName.trim()) return;
    addHabit(newName.trim(), newEmoji);
    setNewName("");
    setNewEmoji("🎯");
    setModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Habit", "Remove this habit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteHabit(id),
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <XPBar xp={xp} level={level} />

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="checkbox-marked-circle-outline"
            size={56}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No habits yet. Start building!
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onToggle={() => toggleHabit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Platform.OS === "web" ? 34 : 40,
            },
          ]}
        >
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            New Habit
          </Text>
          <FlatList
            data={HABIT_EMOJIS}
            keyExtractor={(e) => e}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setNewEmoji(item)}
                style={[
                  styles.emojiBtn,
                  {
                    backgroundColor:
                      item === newEmoji
                        ? colors.primary + "30"
                        : colors.secondary,
                    borderColor:
                      item === newEmoji ? colors.primary : "transparent",
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.secondary,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Habit name..."
            placeholderTextColor={colors.mutedForeground}
            value={newName}
            onChangeText={setNewName}
            maxLength={40}
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.addBtnText, { color: "#fff" }]}>
              Add Habit (+{XP_PER_HABIT} XP/day)
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  xpContainer: {
    margin: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  xpBarWrap: { flex: 1 },
  xpBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  xpBarFill: { height: 6, borderRadius: 3 },
  xpLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  totalXp: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  habitName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  streak: { fontSize: 12, fontFamily: "Inter_400Regular" },
  checkBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  addBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
