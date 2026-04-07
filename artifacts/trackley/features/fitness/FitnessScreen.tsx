import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
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

type Goal = "lose_weight" | "build_muscle" | "stay_fit";

interface Workout {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  xp: number;
}

function getWorkouts(goal: Goal): Workout[] {
  if (goal === "lose_weight") {
    return [
      {
        id: "cardio_run",
        title: "Running Intervals",
        description: "Alternating 1 min sprint / 2 min jog. Burns fat fast.",
        duration: "30 min",
        icon: "run",
        xp: 50,
      },
      {
        id: "hiit_full",
        title: "Full-Body HIIT",
        description:
          "Burpees, jump squats, mountain climbers. 40s on / 20s off.",
        duration: "25 min",
        icon: "lightning-bolt",
        xp: 50,
      },
      {
        id: "light_strength",
        title: "Light Strength Circuit",
        description:
          "Bodyweight squats, push-ups, lunges. 3 × 15 reps each.",
        duration: "20 min",
        icon: "arm-flex",
        xp: 50,
      },
    ];
  }
  if (goal === "build_muscle") {
    return [
      {
        id: "pushups_prog",
        title: "Progressive Push-ups",
        description: "Wide, close-grip, diamond. 4 × 10–12 reps each.",
        duration: "20 min",
        icon: "arm-flex-outline",
        xp: 50,
      },
      {
        id: "squat_protocol",
        title: "Squat Protocol",
        description:
          "Bodyweight squats, jump squats, split squats. 4 × 10 reps.",
        duration: "20 min",
        icon: "weight-lifter",
        xp: 50,
      },
      {
        id: "bench_equivalent",
        title: "Chest & Tricep Blast",
        description:
          "Decline push-ups + tricep dips + chest fly (resistance band). 3 × 12.",
        duration: "25 min",
        icon: "dumbbell",
        xp: 50,
      },
    ];
  }
  return [
    {
      id: "cardio_balance",
      title: "Balanced Cardio",
      description: "20 min moderate jog + 5 min dynamic stretching.",
      duration: "25 min",
      icon: "run-fast",
      xp: 50,
    },
    {
      id: "mobility_flow",
      title: "Mobility Flow",
      description:
        "Hip circles, shoulder rolls, cat-cow, pigeon pose. Full joint health.",
      duration: "15 min",
      icon: "yoga",
      xp: 50,
    },
    {
      id: "strength_lite",
      title: "Strength & Core",
      description: "Plank 3×45s, push-ups 3×10, squats 3×12. Balanced.",
      duration: "20 min",
      icon: "arm-flex",
      xp: 50,
    },
  ];
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "#60A5FA" };
  if (bmi < 25) return { label: "Normal", color: "#34D399" };
  if (bmi < 30) return { label: "Overweight", color: "#FBBF24" };
  return { label: "Obese", color: "#F87171" };
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const colors = useColors();
  const { completeWorkout, isWorkoutCompleted } = useApp();
  const done = isWorkoutCompleted(workout.id);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  function handleComplete() {
    if (done) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 12 }),
      withSpring(1.02, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    glow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 600 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    completeWorkout(workout.id);
  }

  return (
    <Animated.View style={[animStyle, { marginBottom: 12 }]}>
      <Animated.View
        style={[
          glowStyle,
          StyleSheet.absoluteFillObject,
          { borderRadius: 16, backgroundColor: colors.primary + "25" },
        ]}
      />
      <View
        style={[
          styles.workoutCard,
          {
            backgroundColor: colors.card,
            borderColor: done ? colors.primary + "80" : colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.workoutTop}>
          <View
            style={[
              styles.workoutIconWrap,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name={workout.icon as any}
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.workoutTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {workout.title}
            </Text>
            <Text
              style={[styles.workoutDur, { color: colors.mutedForeground }]}
            >
              {workout.duration} · +{workout.xp} XP
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleComplete}
            disabled={done}
            style={[
              styles.doneBtn,
              { backgroundColor: done ? colors.primary : colors.secondary },
            ]}
          >
            <Ionicons
              name={done ? "checkmark-circle" : "checkmark-circle-outline"}
              size={22}
              color={done ? "#fff" : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
        <Text
          style={[styles.workoutDesc, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {workout.description}
        </Text>
      </View>
    </Animated.View>
  );
}

function StepTracker() {
  const colors = useColors();
  const [steps, setSteps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      setError("Step tracking not available on web");
      return;
    }

    let Pedometer: any = null;

    const run = async () => {
      try {
        const pedModule = await import("expo-sensors").catch(() => null);
        if (!pedModule) {
          setError("Pedometer not available");
          return;
        }
        Pedometer = pedModule.Pedometer;
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status !== "granted") {
          setError("Motion permission denied");
          return;
        }
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!isAvailable) {
          setError("Pedometer not available on this device");
          return;
        }

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();

        const pastResult = await Pedometer.getStepCountAsync(start, end);
        setSteps(pastResult.steps);

        subRef.current = Pedometer.watchStepCount((result: any) => {
          setSteps(result.steps);
        });
      } catch {
        setError("Step tracking unavailable");
      }
    };

    run();

    return () => {
      if (subRef.current?.remove) subRef.current.remove();
    };
  }, []);

  return (
    <View
      style={[
        styles.stepCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons
          name="shoe-sneaker"
          size={22}
          color={colors.accent}
        />
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          Steps Today
        </Text>
      </View>
      {error ? (
        <Text style={[styles.stepError, { color: colors.mutedForeground }]}>
          {error}
        </Text>
      ) : steps === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.stepRow}>
          <Text style={[styles.stepCount, { color: colors.accent }]}>
            {steps.toLocaleString()}
          </Text>
          <Text
            style={[styles.stepGoal, { color: colors.mutedForeground }]}
          >
            / 10,000 steps
          </Text>
        </View>
      )}
    </View>
  );
}

export default function FitnessScreen() {
  const colors = useColors();
  const { fitnessProfile, setFitnessProfile } = useApp();
  const [weight, setWeight] = useState(
    fitnessProfile.weight?.toString() ?? ""
  );
  const [height, setHeight] = useState(
    fitnessProfile.height?.toString() ?? ""
  );
  const [goal, setGoal] = useState<Goal>(
    (fitnessProfile.goal as Goal) ?? "stay_fit"
  );
  const [saved, setSaved] = useState(!!fitnessProfile.weight);

  const bmi =
    fitnessProfile.weight && fitnessProfile.height
      ? fitnessProfile.weight / Math.pow(fitnessProfile.height / 100, 2)
      : null;

  const bmiInfo = bmi ? getBMICategory(bmi) : null;
  const workouts = saved ? getWorkouts(goal) : [];

  function handleSave() {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || w <= 0 || h <= 0) return;
    setFitnessProfile({ weight: w, height: h, goal });
    setSaved(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const GOALS: { key: Goal; label: string; icon: string }[] = [
    { key: "lose_weight", label: "Lose Weight", icon: "fire" },
    { key: "build_muscle", label: "Build Muscle", icon: "arm-flex" },
    { key: "stay_fit", label: "Stay Fit", icon: "heart-pulse" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StepTracker />

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Your Profile
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
              Weight (kg)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="70"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
              Height (cm)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="170"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
          Goal
        </Text>
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.key}
              onPress={() => setGoal(g.key)}
              style={[
                styles.goalBtn,
                {
                  backgroundColor:
                    goal === g.key
                      ? colors.primary + "25"
                      : colors.secondary,
                  borderColor:
                    goal === g.key ? colors.primary : "transparent",
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={g.icon as any}
                size={18}
                color={
                  goal === g.key ? colors.primary : colors.mutedForeground
                }
              />
              <Text
                style={[
                  styles.goalLabel,
                  {
                    color:
                      goal === g.key ? colors.primary : colors.mutedForeground,
                  },
                ]}
                numberOfLines={1}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {bmi && bmiInfo && (
          <View
            style={[
              styles.bmiBox,
              { backgroundColor: bmiInfo.color + "15" },
            ]}
          >
            <Text style={[styles.bmiVal, { color: bmiInfo.color }]}>
              BMI: {bmi.toFixed(1)}
            </Text>
            <Text style={[styles.bmiCat, { color: bmiInfo.color }]}>
              {bmiInfo.label}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save & Get Workouts</Text>
        </TouchableOpacity>
      </View>

      {workouts.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginHorizontal: 0, marginBottom: 12 }]}>
            Today's Workouts
          </Text>
          {workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  stepCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  stepRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  stepCount: { fontSize: 36, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stepGoal: { fontSize: 14, fontFamily: "Inter_400Regular" },
  stepError: { fontSize: 13, fontFamily: "Inter_400Regular" },
  profileCard: { padding: 16, borderRadius: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  inputRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  inputWrap: { flex: 1 },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  goalRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    marginTop: 6,
  },
  goalBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  bmiBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  bmiVal: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bmiCat: { fontSize: 15, fontFamily: "Inter_500Medium" },
  saveBtn: {
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  workoutCard: { padding: 14, borderRadius: 16 },
  workoutTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  workoutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  workoutDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
  workoutDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
