import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useApp } from "@/context/AppContext";
import { TrackleyLogo } from "@/components/TrackleyLogo";
import { useTheme } from "@/hooks/useTheme";

const { width, height } = Dimensions.get("window");

// ─── Quick-add habit presets ──────────────────────────────────────────────────
const PRESET_HABITS = [
  { emoji: "💧", name: "Drink 8 Glasses of Water" },
  { emoji: "📚", name: "Read for 30 Minutes" },
  { emoji: "💪", name: "Morning Workout" },
  { emoji: "🧘", name: "Meditate" },
  { emoji: "🚶", name: "10,000 Steps" },
  { emoji: "😴", name: "Sleep by 10 PM" },
  { emoji: "✍️", name: "Journal" },
  { emoji: "🥗", name: "Eat Healthy" },
  { emoji: "🚿", name: "Cold Shower" },
  { emoji: "🎯", name: "Study 1 Hour" },
  { emoji: "🌱", name: "No Sugar Today" },
  { emoji: "🎸", name: "Practice Skill" },
];

const GOALS = [
  { key: "lose_weight",   label: "Lose Weight",    icon: "scale-bathroom",  color: "#F87171", desc: "Burn fat, feel lighter" },
  { key: "build_muscle",  label: "Build Muscle",   icon: "arm-flex",        color: "#818CF8", desc: "Gain strength & size" },
  { key: "stay_fit",      label: "Stay Fit",       icon: "heart-pulse",     color: "#10D9A0", desc: "Maintain your edge" },
  { key: "endurance",     label: "Endurance",      icon: "run-fast",        color: "#60A5FA", desc: "Run further, faster" },
  { key: "flexibility",   label: "Flexibility",    icon: "yoga",            color: "#C084FC", desc: "Move with freedom" },
  { key: "longevity",     label: "Longevity",      icon: "leaf",            color: "#34D399", desc: "Age like fine wine" },
] as const;

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  const colors = useTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? colors.primary : colors.border,
              width: i === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Step 1 — Welcome ─────────────────────────────────────────────────────────
function StepWelcome({ name, setName, onNext }: { name: string; setName: (v: string) => void; onNext: () => void }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.stepContainer, { paddingTop: insets.top + 40, paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoRow}>
          <TrackleyLogo size={72} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.stepTextBlock}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Welcome to{"\n"}Trackley</Text>
          <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
            Your premium lifestyle OS.{"\n"}Let's get you set up in 60 seconds.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputBlock}>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>YOUR NAME</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              placeholder="e.g. Alex, Jordan, Bikrant..."
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => { if (name.trim()) onNext(); }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.featureGrid}>
          {[
            { icon: "lightning-bolt", label: "Gamification", color: "#F59E0B" },
            { icon: "dumbbell", label: "Fitness", color: "#F43F5E" },
            { icon: "cash-multiple", label: "Finance", color: "#10D9A0" },
            { icon: "account-group", label: "Friends", color: "#818CF8" },
          ].map((f) => (
            <View key={f.label} style={[styles.featurePill, { backgroundColor: f.color + "15", borderColor: f.color + "30" }]}>
              <MaterialCommunityIcons name={f.icon as any} size={16} color={f.color} />
              <Text style={[styles.featureLabel, { color: f.color }]}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).springify()} style={{ width: "100%", marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => { if (name.trim()) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); } }}
            activeOpacity={0.85}
            style={{ opacity: name.trim() ? 1 : 0.4 }}
          >
            <LinearGradient
              colors={["#10D9A0", "#00B4D8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Let's Go →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 2 — Goal & Body ─────────────────────────────────────────────────────
function StepGoal({
  goal, setGoal, weight, setWeight, height: h, setHeight, onNext, onBack,
}: {
  goal: string; setGoal: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  height: string; setHeight: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.stepContainer, { paddingTop: insets.top + 24, paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepTextBlock}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Your Goal</Text>
          <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
            This personalises your experience and unlocks your BMI tracker.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.goalGrid}>
          {GOALS.map((g, i) => {
            const active = goal === g.key;
            return (
              <Animated.View key={g.key} entering={FadeInDown.delay(i * 60).springify()} style={styles.goalTileWrap}>
                <TouchableOpacity
                  onPress={() => { setGoal(g.key); Haptics.selectionAsync(); }}
                  activeOpacity={0.85}
                  style={[
                    styles.goalTile,
                    {
                      backgroundColor: active ? g.color + "20" : colors.card,
                      borderColor: active ? g.color : colors.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={g.icon as any} size={28} color={active ? g.color : colors.mutedForeground} />
                  <Text style={[styles.goalLabel, { color: active ? g.color : colors.foreground }]}>{g.label}</Text>
                  <Text style={[styles.goalDesc, { color: colors.mutedForeground }]}>{g.desc}</Text>
                  {active && (
                    <Animated.View entering={FadeIn.duration(200)} style={[styles.goalCheck, { backgroundColor: g.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.bodyRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>WEIGHT (kg)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="weight-kilogram" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.textInput, { color: colors.foreground }]}
                placeholder="70"
                placeholderTextColor={colors.mutedForeground}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>HEIGHT (cm)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="human-male-height" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.textInput, { color: colors.foreground }]}
                placeholder="175"
                placeholderTextColor={colors.mutedForeground}
                value={h}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.btnRow}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { if (goal) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); } }}
            activeOpacity={0.85}
            style={[styles.nextBtnFlex, { opacity: goal ? 1 : 0.4 }]}
          >
            <LinearGradient colors={["#818CF8", "#C084FC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnGrad}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 3 — First Habit ─────────────────────────────────────────────────────
function StepHabit({
  selected, setSelected, onFinish, onBack, isLoading,
}: {
  selected: Set<string>; setSelected: (v: Set<string>) => void;
  onFinish: () => void; onBack: () => void; isLoading: boolean;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  function toggle(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
    Haptics.selectionAsync();
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.stepContainer, { paddingTop: insets.top + 24, paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.stepTextBlock}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>First Habits</Text>
        <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
          Pick your starting habits. You can add more any time.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.habitGrid}>
        {PRESET_HABITS.map((h, i) => {
          const active = selected.has(h.name);
          return (
            <Animated.View key={h.name} entering={FadeInDown.delay(i * 40).springify()} style={styles.habitChipWrap}>
              <TouchableOpacity
                onPress={() => toggle(h.name)}
                activeOpacity={0.8}
                style={[
                  styles.habitChip,
                  {
                    backgroundColor: active ? colors.primary + "20" : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <Text style={styles.habitEmoji}>{h.emoji}</Text>
                <Text style={[styles.habitChipText, { color: active ? colors.primary : colors.foreground }]} numberOfLines={2}>
                  {h.name}
                </Text>
                {active && (
                  <Animated.View entering={FadeIn.duration(150)} style={[styles.habitCheck, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={9} color="#fff" />
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>

      {selected.size > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.selectedBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.selectedText, { color: colors.primary }]}>
            {selected.size} habit{selected.size !== 1 ? "s" : ""} selected
          </Text>
        </Animated.View>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onFinish}
          disabled={isLoading}
          activeOpacity={0.85}
          style={styles.nextBtnFlex}
        >
          <LinearGradient colors={["#F59E0B", "#F43F5E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnGrad}>
            <Text style={styles.nextBtnText}>
              {selected.size > 0 ? `Start with ${selected.size} Habit${selected.size !== 1 ? "s" : ""} 🚀` : "Skip & Start →"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Main Onboarding Screen ───────────────────────────────────────────────────
export default function OnboardingScreen() {
  const colors = useTheme();
  const { setProfile, setFitnessProfile, addHabit, completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const BG_COLORS: [string, string, ...string[]] = [
    "#0D0D1A", "#10D9A020", "#0D0D1A"
  ];

  async function finish() {
    setIsLoading(true);
    try {
      // Save profile
      setProfile({ name: name.trim() || "Champion", bio: "" });

      // Save fitness profile
      setFitnessProfile({
        weight: parseFloat(weight) || null,
        height: parseFloat(height) || null,
        goal: goal as any || "stay_fit",
        age: null,
        gender: null,
        activityLevel: null,
      });

      // Add selected habits
      const presets = PRESET_HABITS.filter((h) => selectedHabits.has(h.name));
      for (const h of presets) {
        addHabit(h.name, h.emoji);
      }

      // Mark onboarding complete & navigate
      completeOnboarding();
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Background gradient blob */}
      <LinearGradient
        colors={BG_COLORS}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={[styles.glowBlob, { backgroundColor: colors.primary + "18" }]} />

      {/* Step dots */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.dotsRow}>
        <StepDots current={step} total={3} />
      </Animated.View>

      {/* Steps */}
      {step === 0 && (
        <Animated.View key="s0" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(250)} style={styles.stepWrapper}>
          <StepWelcome name={name} setName={setName} onNext={() => setStep(1)} />
        </Animated.View>
      )}
      {step === 1 && (
        <Animated.View key="s1" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(250)} style={styles.stepWrapper}>
          <StepGoal
            goal={goal} setGoal={setGoal}
            weight={weight} setWeight={setWeight}
            height={height} setHeight={setHeight}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        </Animated.View>
      )}
      {step === 2 && (
        <Animated.View key="s2" entering={FadeInRight.duration(350)} style={styles.stepWrapper}>
          <StepHabit
            selected={selectedHabits}
            setSelected={setSelectedHabits}
            onFinish={finish}
            onBack={() => setStep(1)}
            isLoading={isLoading}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  glowBlob: {
    position: "absolute",
    top: -100,
    left: -80,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    opacity: 0.6,
  },
  dotsRow: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  stepWrapper: { flex: 1 },

  stepContainer: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoRow: { marginBottom: 28 },
  stepTextBlock: { alignItems: "center", marginBottom: 32 },
  stepTitle: {
    fontSize: 38,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 12,
  },
  stepSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.75,
  },

  inputBlock: { width: "100%", marginBottom: 24 },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_500Medium",
  },

  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 32,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  featureLabel: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },

  nextBtn: {
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    elevation: 8,
    shadowColor: "#10D9A0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },

  // Goal grid
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    marginBottom: 20,
  },
  goalTileWrap: { width: (width - 68) / 2 },
  goalTile: {
    padding: 16,
    borderRadius: 20,
    alignItems: "flex-start",
    gap: 6,
    position: "relative",
    minHeight: 110,
  },
  goalLabel: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
  goalDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  goalCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // Body inputs
  bodyRow: { flexDirection: "row", gap: 12, width: "100%", marginBottom: 24 },

  // Navigation buttons
  btnRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnFlex: { flex: 1 },
  nextBtnGrad: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  // Habit grid
  habitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    marginBottom: 16,
  },
  habitChipWrap: { width: (width - 68) / 2 },
  habitChip: {
    padding: 14,
    borderRadius: 18,
    alignItems: "flex-start",
    gap: 6,
    position: "relative",
    minHeight: 80,
  },
  habitEmoji: { fontSize: 24 },
  habitChipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  habitCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    width: "100%",
  },
  selectedText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
