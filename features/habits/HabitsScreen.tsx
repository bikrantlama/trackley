import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import React, { useState, useEffect, useRef } from "react";
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
  Image,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  FadeInDown,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useApp, getLevelXP, getRankForLevel, Achievement } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { TrackleyLogo } from "@/components/TrackleyLogo";
import { GlassContainer } from "@/components/GlassContainer";
import { CrystalCard } from "@/components/CrystalCard";
import CrystalBurst, { type CrystalBurstRef } from "@/components/CrystalBurst";

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

/** Returns the number of consecutive days completed up to and including today */
function getConsecutiveStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse(); // newest first
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    if (sorted[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const PRIORITY_COLORS = {
  high: "#F43F5E",
  medium: "#F59E0B",
  low: "#10D9A0",
};

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function HabitCard({
  habit,
  onToggle,
  onDelete,
  onLongPress,
}: {
  habit: ReturnType<typeof useApp>["habits"][0];
  onToggle: (event: any) => void;
  onDelete: () => void;
  onLongPress: () => void;
}) {
  const colors = useTheme();
  const today = new Date().toISOString().split("T")[0];
  const done = habit.completedDates.includes(today);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const priorityColor = habit.priority ? PRIORITY_COLORS[habit.priority] : colors.mutedForeground;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  function handlePress(event: any) {
    scale.value = withSequence(
      withSpring(0.93, { damping: 12 }),
      withSpring(1, { damping: 8 })
    );
    if (!done) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 400 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggle(event);
  }

  const totalCompleted = habit.completedDates.length;
  const consecutiveStreak = getConsecutiveStreak(habit.completedDates);

  return (
    <Animated.View style={[animStyle, { marginBottom: 10 }]}>
      <Animated.View
        style={[
          glowStyle,
          StyleSheet.absoluteFillObject,
          {
            borderRadius: 24,
            backgroundColor: colors.primary + "30",
          },
        ]}
      />
      <TouchableOpacity
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress();
        }}
        delayLongPress={400}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: habit.priority ? priorityColor + "60" : (done ? colors.primary : colors.border),
              borderWidth: habit.priority ? 2 : 1.5,
              borderRadius: 24,
              shadowColor: habit.priority ? priorityColor : "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: habit.priority ? 0.2 : 0.1,
              shadowRadius: 10,
              elevation: 4,
            },
          ]}
        >
          {habit.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={[styles.priorityText, { color: priorityColor }]}>{PRIORITY_LABELS[habit.priority]}</Text>
            </View>
          )}
          <Text style={styles.emoji}>{habit.emoji}</Text>
          <View style={styles.cardBody}>
            <Text
              style={[styles.habitName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            <View style={styles.streakRow}>
              {consecutiveStreak >= 1 && (
                <View style={[styles.streakPill, { backgroundColor: "#F59E0B15" }]}>
                  <Text style={styles.streakFire}>🔥</Text>
                  <Text style={[styles.streakCount, { color: "#F59E0B" }]}>{consecutiveStreak} day streak</Text>
                </View>
              )}
              <Text style={[styles.streak, { color: colors.mutedForeground }]}>
                {habit.reminderTime ? `⏰ ${habit.reminderTime} • ` : ""}
                {totalCompleted} total
              </Text>
            </View>
          </View>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.checkBtn,
            {
              backgroundColor: done
                ? colors.primary
                : colors.secondary,
              borderColor: done ? colors.primary : colors.border,
              borderWidth: 1,
            },
          ]}
        >
          {done && (
            <Ionicons
              name="checkmark"
              size={18}
              color="#fff"
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function XPBar({ xp, level }: { xp: number; level: number }) {
  const colors = useTheme();
  const currentLevelXP = getLevelXP(level);
  const nextLevelXP = getLevelXP(level + 1);
  const xpInLevel = xp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progress = Math.max(0, Math.min(xpInLevel / xpNeededForNext, 1));
  const rank = getRankForLevel(level);

  // Animated XP bar fill
  const barWidth = useSharedValue(0);
  React.useEffect(() => {
    barWidth.value = withDelay(300, withTiming(progress * 100, { duration: 800 }));
  }, [progress]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%` as `${number}%`,
  }));

  return (
    <GlassContainer style={styles.xpContainer}>
      <View style={styles.xpHeader}>
        <View>
          <Text style={[styles.levelText, { color: colors.foreground }]}>Level {level}</Text>
          <Text style={[styles.rankText, { color: colors.primary }]}>{rank.rank}</Text>
        </View>
        <TrackleyLogo size={32} />
      </View>
      <View style={[styles.xpBarBg, { backgroundColor: colors.secondary }]}>
        <Animated.View
          style={[
            styles.xpBarFill,
            barStyle,
            { backgroundColor: colors.primary },
          ]}
        />
      </View>
      <View style={styles.xpFooter}>
        <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
          {Math.floor(xpInLevel)} / {Math.floor(xpNeededForNext)} XP to Lv.{level + 1}
        </Text>
        <Text style={[styles.totalXp, { color: colors.primary }]}>{xp} XP Total</Text>
      </View>
    </GlassContainer>
  );
}

export default function HabitsScreen() {
  const colors = useTheme();
  const { habits, xp, level, addHabit, deleteHabit, toggleHabit, toggleHabitPriority, profile, themeId } = useApp();
  
  // Sort habits by priority (high > medium > low > none), then by creation date
  const sortedHabits = [...habits].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aP = a.priority ? priorityOrder[a.priority] : 3;
    const bP = b.priority ? priorityOrder[b.priority] : 3;
    if (aP !== bP) return aP - bP;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  const router = require("expo-router").router;
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎯");
  const [reminderTime, setReminderTime] = useState<Date>(new Date());
  const [enableReminder, setEnableReminder] = useState(false);
  const burstRef = useRef<CrystalBurstRef>(null);
  const [showPicker, setShowPicker] = useState(false);

  const scheduleNotification = async (habitId: string, habitName: string, time: Date) => {
    try {
      const hour = time.getHours();
      const minute = time.getMinutes();
      
      await Notifications.requestPermissionsAsync();

      // Schedule a sequence of 3 notifications (Snooze Logic: T, T+5, T+10)
      for (let i = 0; i < 3; i++) {
        const offsetMin = i * 5;
        let targetHour = hour;
        let targetMin = minute + offsetMin;

        if (targetMin >= 60) {
          targetHour = (targetHour + Math.floor(targetMin / 60)) % 24;
          targetMin = targetMin % 60;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: `habit-${habitId}-${i}`,
          content: {
            title: i === 0 ? "Trackley Habit ⏰" : "Habit Reminder (Snooze) 🔔",
            body: `Don't forget: ${habitName}`,
            sound: "default",
            data: { habitId, isSnooze: i > 0 },
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: targetHour,
            minute: targetMin,
          },
        });
      }
    } catch (e) {
      console.log('Error scheduling notification', e);
    }
  };

  // Notification sound logic moved to root _layout.tsx for global coverage

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    // Format the time as h:mm A to save into the context
    let formattedTime: string | undefined = undefined;
    if (enableReminder) {
       formattedTime = reminderTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const habitId = addHabit(newName.trim(), newEmoji, formattedTime);
    if (enableReminder) {
      scheduleNotification(habitId, newName.trim(), reminderTime);
    }
    setNewName("");
    setNewEmoji("🎯");
    setEnableReminder(false);
    setReminderTime(new Date());
    setModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingLabel, { color: colors.mutedForeground }]}>{greeting()},</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{profile?.name || "Champion"}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.profileBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Ionicons name="person" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

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
          data={sortedHabits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onToggle={(event) => {
                const today = new Date().toISOString().split("T")[0];
                const isAlreadyDone = item.completedDates.includes(today);
                if (!isAlreadyDone && burstRef.current) {
                   const { pageX, pageY } = event.nativeEvent;
                   burstRef.current.trigger(pageX, pageY);
                }
                toggleHabit(item.id);
              }}
              onDelete={() => handleDelete(item.id)}
              onLongPress={() => {
                Alert.alert(
                  "Set Priority",
                  `Choose priority for "${item.name}"`,
                  [
                    { text: "High Priority", onPress: () => toggleHabitPriority(item.id) },
                    { text: "Medium Priority", onPress: () => toggleHabitPriority(item.id) },
                    { text: "Low Priority", onPress: () => toggleHabitPriority(item.id) },
                    { text: "Clear Priority", onPress: () => toggleHabitPriority(item.id) },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              }}
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
              maxHeight: '85%',
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              New Habit
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={HABIT_EMOJIS}
            keyExtractor={(e) => e}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20, flexGrow: 0 }}
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

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled" 
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="What do you want to build?"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              maxLength={40}
            />
            
            <View style={[styles.reminderToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="alarm-outline" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Daily Reminder</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>Tap to set daily alarm</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setEnableReminder(!enableReminder)}
                style={[
                  styles.toggleTrack, 
                  { backgroundColor: enableReminder ? colors.success : colors.muted + '40' }
                ]}
              >
                <View style={[styles.toggleThumb, { left: enableReminder ? 22 : 2 }]} />
              </TouchableOpacity>
            </View>

            {enableReminder && (
              <View style={[styles.timePickerContainer, { backgroundColor: colors.secondary + '50', borderColor: colors.border }]}>
                <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>REMINDER TIME</Text>
                <View style={styles.timeDisplayRow}>
                  <Text style={[styles.timeDisplay, { color: colors.foreground }]}>
                    {reminderTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowPicker(true)}
                    style={[styles.setTimeBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.setTimeBtnText}>Set Time</Text>
                  </TouchableOpacity>
                </View>

                {(Platform.OS === 'ios' || showPicker) && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                    themeVariant={themeId === 'crystal' ? 'light' : 'dark'}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') setShowPicker(false);
                      if (date) {
                        setReminderTime(date);
                        Haptics.selectionAsync();
                      }
                    }}
                    style={Platform.OS === 'ios' ? { height: 120, width: '100%' } : undefined}
                  />
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.addBtnText, { color: "#fff" }]}>
                Create Habit (+{XP_PER_HABIT} XP)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
      <CrystalBurst ref={burstRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  xpContainer: {
    margin: 16,
    padding: 14,
    borderRadius: 24,
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
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  greetingLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: 2,
  },
  xpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
  streak: { fontSize: 11, fontFamily: "Inter_400Regular", opacity: 0.7 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  streakFire: { fontSize: 11 },
  streakCount: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 2,
    backgroundColor: "rgba(255,0,0,0.05)",
    borderRadius: 16,
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
    bottom: 220,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#0A65FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    padding: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  emojiBtn: {
    width: 58,
    height: 58,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    position: 'absolute',
  },
  timePickerContainer: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeDisplay: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  setTimeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  setTimeBtnText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  addBtn: {
    padding: 18,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  priorityBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
