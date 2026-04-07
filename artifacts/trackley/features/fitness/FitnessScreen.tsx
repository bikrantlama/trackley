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

import { type FitnessProfile, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Goal = "lose_weight" | "build_muscle" | "stay_fit";

interface Workout {
  id: string;
  title: string;
  description: string;
  duration: string;
  sets?: string;
  tip: string;
  icon: string;
  xp: number;
  intensity: "Low" | "Medium" | "High";
}

interface Recommendation {
  title: string;
  items: string[];
  color: string;
  icon: string;
}

function getWorkouts(goal: Goal, bmi: number | null): Workout[] {
  if (goal === "lose_weight") {
    return [
      { id: "lw_hiit", title: "HIIT Cardio Blast", description: "Burpees 45s, rest 15s · Jump squats 45s, rest 15s · Mountain climbers 45s, rest 15s. Repeat 5 rounds.", duration: "25 min", sets: "5 rounds", tip: "Keep your core tight throughout. Rest 1 min between rounds.", icon: "lightning-bolt", xp: 50, intensity: "High" },
      { id: "lw_run", title: "Interval Running", description: "2 min warm-up walk → 1 min sprint / 2 min jog alternating. Cool down 2 min walk.", duration: "30 min", sets: "8 intervals", tip: "Sprint at 80% max effort. The jog phase is your recovery.", icon: "run-fast", xp: 50, intensity: "High" },
      { id: "lw_circuit", title: "Full-Body Circuit", description: "Push-ups × 15, Squats × 20, Plank 30s, Jumping jacks × 30. Minimal rest between exercises.", duration: "20 min", sets: "4 rounds", tip: "Move fast between exercises — the goal is elevated heart rate.", icon: "fire", xp: 40, intensity: "Medium" },
    ];
  }
  if (goal === "build_muscle") {
    return [
      { id: "bm_push", title: "Push Strength", description: "Push-ups 4×12 · Diamond push-ups 3×10 · Tricep dips 3×12 · Pike push-ups 3×10", duration: "25 min", sets: "4 sets × 10–12 reps", tip: "2s down, 1s pause, explode up. Quality > quantity.", icon: "arm-flex", xp: 55, intensity: "High" },
      { id: "bm_legs", title: "Leg Day Protocol", description: "Squats 4×15 · Jump squats 3×10 · Lunges 3×12 each · Wall sit 3×45s · Calf raises 4×20", duration: "30 min", sets: "3–4 sets each", tip: "Keep your knees tracking over toes. Full depth on squats.", icon: "weight-lifter", xp: 55, intensity: "High" },
      { id: "bm_core", title: "Core & Pull", description: "Plank 4×45s · Side plank 3×30s each · Dead bug 3×10 · Superman 3×12 · Reverse crunch 3×15", duration: "20 min", sets: "3–4 sets", tip: "Breathe out during exertion. Don't hold your breath.", icon: "dumbbell", xp: 45, intensity: "Medium" },
    ];
  }
  return [
    { id: "sf_cardio", title: "Steady Cardio", description: "20 min jog at comfortable pace (able to hold conversation) + 5 min dynamic stretching (leg swings, arm circles, hip circles).", duration: "25 min", sets: "Continuous", tip: "Zone 2 cardio. Build aerobic base for long-term health.", icon: "run", xp: 40, intensity: "Low" },
    { id: "sf_mobility", title: "Mobility & Flexibility", description: "Hip flexors 45s each · Hamstring stretch 45s · Chest opener 30s · Shoulder rolls × 10 · Cat-cow × 10 · Pigeon pose 60s each side.", duration: "15 min", sets: "1–2 rounds", tip: "Never force a stretch. Work to 70% of your max range.", icon: "yoga", xp: 30, intensity: "Low" },
    { id: "sf_balanced", title: "Balanced Full-Body", description: "Squats 3×12 · Push-ups 3×10 · Plank 3×30s · Bicycle crunches 3×15 · 10 min jog.", duration: "35 min", sets: "3 sets each", tip: "Consistent effort across all muscle groups. Rest 60s between sets.", icon: "heart-pulse", xp: 45, intensity: "Medium" },
  ];
}

function getRecommendations(profile: FitnessProfile, bmi: number | null): Recommendation[] {
  const recs: Recommendation[] = [];

  if (!profile.goal) return recs;

  if (bmi) {
    let nutritionItems: string[] = [];
    if (bmi < 18.5) {
      nutritionItems = ["Eat caloric surplus: +300–500 kcal/day", "High protein: 1.6–2g per kg of bodyweight", "Add healthy fats: nuts, avocado, olive oil", "Eat every 3–4 hours to maintain calorie intake", "Include complex carbs: oats, rice, sweet potato"];
    } else if (bmi < 25) {
      nutritionItems = ["Maintain current calories ± 200 kcal", "Protein: 1.4–1.6g per kg bodyweight", "Balanced macros: 40% carbs, 30% protein, 30% fat", "Hydrate: 35ml per kg bodyweight daily", "Prioritize whole foods and minimize processed food"];
    } else if (bmi < 30) {
      nutritionItems = ["Caloric deficit: -300–500 kcal/day", "High protein: 1.8g per kg to preserve muscle", "Reduce refined carbs and sugar", "Eat fiber-rich foods: vegetables, legumes", "Avoid liquid calories — drink water and herbal tea"];
    } else {
      nutritionItems = ["Consult a doctor before starting intense training", "Gradual caloric deficit: -200–300 kcal/day", "Focus on whole, unprocessed foods", "Walk 30 min daily as your foundation", "Track meals honestly — awareness is step one"];
    }
    recs.push({ title: "Nutrition Strategy", items: nutritionItems, color: "#10D9A0", icon: "nutrition" });
  }

  if (profile.goal === "lose_weight") {
    recs.push({
      title: "Fat Loss Protocol",
      items: ["Train 4–5 days/week minimum", "Prioritize HIIT and cardio", "2 strength sessions/week to preserve muscle", "Stay active daily: aim 10,000 steps", "Sleep 7–9 hours — crucial for fat loss hormones"],
      color: "#F43F5E",
      icon: "fire",
    });
  } else if (profile.goal === "build_muscle") {
    recs.push({
      title: "Muscle Building Protocol",
      items: ["Train 4–5 days/week with progressive overload", "3 sets × 8–12 reps for hypertrophy", "Rest 48h between same muscle groups", "Sleep 8+ hours — growth hormone peaks during sleep", "Track your reps — increase load every 2 weeks"],
      color: "#818CF8",
      icon: "arm-flex",
    });
  } else {
    recs.push({
      title: "Balanced Fitness Protocol",
      items: ["Train 3–4 days/week mixing cardio + strength", "Include 1 mobility/yoga session per week", "Aim for 8,000+ steps daily", "Listen to your body — rest when needed", "Maintain healthy sleep: 7–8 hours"],
      color: "#00D9F5",
      icon: "heart-pulse",
    });
  }

  if (profile.activityLevel) {
    const recoveryItems =
      profile.activityLevel === "sedentary" || profile.activityLevel === "light"
        ? ["Start slow: 2–3 sessions per week", "Focus on form before intensity", "Rest day after each workout initially", "Increase volume by 10% every 2 weeks"]
        : ["Advanced: can train 5–6 days/week", "Periodize: 3 hard weeks + 1 deload week", "Active recovery: light yoga or swimming on rest days", "Monitor HRV if possible for recovery tracking"];
    recs.push({ title: "Recovery & Progression", items: recoveryItems, color: "#F59E0B", icon: "moon-waning-crescent" });
  }

  return recs;
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "#60A5FA" };
  if (bmi < 25) return { label: "Normal", color: "#10D9A0" };
  if (bmi < 30) return { label: "Overweight", color: "#F59E0B" };
  return { label: "Obese", color: "#F43F5E" };
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const colors = useColors();
  const { completeWorkout, isWorkoutCompleted } = useApp();
  const done = isWorkoutCompleted(workout.id);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  function handleComplete() {
    if (done) return;
    scale.value = withSequence(withSpring(0.95, { damping: 12 }), withSpring(1.02, { damping: 8 }), withSpring(1, { damping: 12 }));
    glow.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 600 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    completeWorkout(workout.id);
  }

  const intensityColor = workout.intensity === "High" ? colors.destructive : workout.intensity === "Medium" ? colors.warning : colors.success;

  return (
    <Animated.View style={[animStyle, { marginBottom: 12 }]}>
      <Animated.View style={[glowStyle, StyleSheet.absoluteFillObject, { borderRadius: 18, backgroundColor: colors.primary + "25" }]} />
      <View style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: done ? colors.primary + "80" : colors.border, borderWidth: 1 }]}>
        <View style={styles.workoutTop}>
          <View style={[styles.workoutIconWrap, { backgroundColor: colors.primary + "20" }]}>
            <MaterialCommunityIcons name={workout.icon as any} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.workoutTitle, { color: colors.foreground }]} numberOfLines={1}>{workout.title}</Text>
            <View style={styles.workoutMeta}>
              <Text style={[styles.workoutDur, { color: colors.mutedForeground }]}>{workout.duration}</Text>
              <View style={[styles.intensityBadge, { backgroundColor: intensityColor + "20" }]}>
                <Text style={[styles.intensityText, { color: intensityColor }]}>{workout.intensity}</Text>
              </View>
              <Text style={[styles.workoutXp, { color: colors.xp }]}>+{workout.xp} XP</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleComplete} disabled={done} style={[styles.doneBtn, { backgroundColor: done ? colors.primary : colors.secondary }]}>
            <Ionicons name={done ? "checkmark-circle" : "checkmark-circle-outline"} size={24} color={done ? "#fff" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        {workout.sets && (
          <Text style={[styles.workoutSets, { color: colors.accent }]}>{workout.sets}</Text>
        )}
        <Text style={[styles.workoutDesc, { color: colors.mutedForeground }]} numberOfLines={3}>{workout.description}</Text>
        <View style={[styles.tipBox, { backgroundColor: colors.secondary }]}>
          <Ionicons name="bulb-outline" size={14} color={colors.warning} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]} numberOfLines={2}>{workout.tip}</Text>
        </View>
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
    if (Platform.OS === "web") { setError("Step tracking requires the mobile app"); return; }
    let Pedometer: any = null;
    const run = async () => {
      try {
        const pedModule = await import("expo-sensors").catch(() => null);
        if (!pedModule) { setError("Pedometer not available"); return; }
        Pedometer = pedModule.Pedometer;
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status !== "granted") { setError("Motion permission denied"); return; }
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!isAvailable) { setError("Pedometer unavailable on this device"); return; }
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const pastResult = await Pedometer.getStepCountAsync(start, new Date());
        setSteps(pastResult.steps);
        subRef.current = Pedometer.watchStepCount((result: any) => setSteps(result.steps));
      } catch { setError("Step tracking unavailable"); }
    };
    run();
    return () => { if (subRef.current?.remove) subRef.current.remove(); };
  }, []);

  const pct = steps ? Math.min((steps / 10000) * 100, 100) : 0;

  return (
    <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons name="shoe-sneaker" size={20} color={colors.accent} />
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>Today's Steps</Text>
        <Text style={[styles.stepGoalLabel, { color: colors.mutedForeground }]}>/ 10,000</Text>
      </View>
      {error ? (
        <Text style={[styles.stepError, { color: colors.mutedForeground }]}>{error}</Text>
      ) : steps === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={[styles.stepCount, { color: colors.accent }]}>{steps.toLocaleString()}</Text>
          <View style={[styles.stepBarBg, { backgroundColor: colors.secondary }]}>
            <View style={[styles.stepBarFill, { backgroundColor: colors.accent, width: `${pct}%` as `${number}%` }]} />
          </View>
          <Text style={[styles.stepPct, { color: colors.mutedForeground }]}>{pct.toFixed(0)}% of daily goal</Text>
        </>
      )}
    </View>
  );
}

export default function FitnessScreen() {
  const colors = useColors();
  const { fitnessProfile, setFitnessProfile } = useApp();
  const [weight, setWeight] = useState(fitnessProfile.weight?.toString() ?? "");
  const [height, setHeight] = useState(fitnessProfile.height?.toString() ?? "");
  const [age, setAge] = useState(fitnessProfile.age?.toString() ?? "");
  const [goal, setGoal] = useState<Goal>((fitnessProfile.goal as Goal) ?? "stay_fit");
  const [gender, setGender] = useState<FitnessProfile["gender"]>(fitnessProfile.gender ?? "male");
  const [activityLevel, setActivityLevel] = useState<FitnessProfile["activityLevel"]>(fitnessProfile.activityLevel ?? "moderate");
  const [saved, setSaved] = useState(!!fitnessProfile.weight);
  const [activeView, setActiveView] = useState<"workouts" | "recommendations">("workouts");

  const bmi = fitnessProfile.weight && fitnessProfile.height
    ? fitnessProfile.weight / Math.pow(fitnessProfile.height / 100, 2)
    : null;
  const bmiInfo = bmi ? getBMICategory(bmi) : null;
  const workouts = saved ? getWorkouts(goal, bmi) : [];
  const recommendations = saved ? getRecommendations(fitnessProfile, bmi) : [];

  function handleSave() {
    const w = parseFloat(weight); const h = parseFloat(height); const a = parseInt(age, 10);
    if (!w || !h || w <= 0 || h <= 0) return;
    setFitnessProfile({ weight: w, height: h, goal, age: a || null, gender, activityLevel });
    setSaved(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const GOALS: { key: Goal; label: string; icon: string }[] = [
    { key: "lose_weight", label: "Lose Weight", icon: "fire" },
    { key: "build_muscle", label: "Build Muscle", icon: "arm-flex" },
    { key: "stay_fit", label: "Stay Fit", icon: "heart-pulse" },
  ];

  const GENDERS: { key: NonNullable<FitnessProfile["gender"]>; label: string }[] = [
    { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "other", label: "Other" },
  ];

  const ACTIVITY: { key: NonNullable<FitnessProfile["activityLevel"]>; label: string }[] = [
    { key: "sedentary", label: "Sedentary" }, { key: "light", label: "Light" },
    { key: "moderate", label: "Moderate" }, { key: "active", label: "Active" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StepTracker />

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Body Profile</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Weight (kg)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={styles.inputWrap}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Height (cm)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="170" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={styles.inputWrap}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Age</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" placeholderTextColor={colors.mutedForeground} />
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Gender</Text>
        <View style={[styles.goalRow, { marginBottom: 14 }]}>
          {GENDERS.map((g) => (
            <TouchableOpacity key={g.key} onPress={() => setGender(g.key)} style={[styles.goalBtn, { backgroundColor: gender === g.key ? colors.primary + "25" : colors.secondary, borderColor: gender === g.key ? colors.primary : "transparent", borderWidth: 1 }]}>
              <Text style={[styles.goalLabel, { color: gender === g.key ? colors.primary : colors.mutedForeground }]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Activity Level</Text>
        <View style={[styles.goalRow, { flexWrap: "wrap", marginBottom: 14 }]}>
          {ACTIVITY.map((a) => (
            <TouchableOpacity key={a.key} onPress={() => setActivityLevel(a.key)} style={[styles.goalBtn, { backgroundColor: activityLevel === a.key ? colors.accent + "25" : colors.secondary, borderColor: activityLevel === a.key ? colors.accent : "transparent", borderWidth: 1, marginBottom: 6 }]}>
              <Text style={[styles.goalLabel, { color: activityLevel === a.key ? colors.accent : colors.mutedForeground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Goal</Text>
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <TouchableOpacity key={g.key} onPress={() => setGoal(g.key)} style={[styles.goalBtn, { backgroundColor: goal === g.key ? colors.primary + "25" : colors.secondary, borderColor: goal === g.key ? colors.primary : "transparent", borderWidth: 1 }]}>
              <MaterialCommunityIcons name={g.icon as any} size={16} color={goal === g.key ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.goalLabel, { color: goal === g.key ? colors.primary : colors.mutedForeground }]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {bmi && bmiInfo && (
          <View style={[styles.bmiBox, { backgroundColor: bmiInfo.color + "15", borderColor: bmiInfo.color + "40", borderWidth: 1 }]}>
            <View>
              <Text style={[styles.bmiVal, { color: bmiInfo.color }]}>BMI {bmi.toFixed(1)}</Text>
              <Text style={[styles.bmiCat, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
            </View>
            <MaterialCommunityIcons name="gauge" size={32} color={bmiInfo.color + "80"} />
          </View>
        )}

        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Profile & Get Plan</Text>
        </TouchableOpacity>
      </View>

      {saved && (
        <>
          <View style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["workouts", "recommendations"] as const).map((v) => (
              <TouchableOpacity key={v} onPress={() => setActiveView(v)} style={[styles.toggleBtn, { backgroundColor: activeView === v ? colors.primary : "transparent" }]}>
                <Text style={[styles.toggleLabel, { color: activeView === v ? "#fff" : colors.mutedForeground }]}>
                  {v === "workouts" ? "Workouts" : "Recommendations"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeView === "workouts" ? (
            workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)
          ) : (
            recommendations.map((rec, idx) => (
              <View key={idx} style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: rec.color, borderWidth: 1, borderLeftWidth: 3 }]}>
                <View style={styles.recHeader}>
                  <MaterialCommunityIcons name={rec.icon as any} size={18} color={rec.color} />
                  <Text style={[styles.recTitle, { color: colors.foreground }]}>{rec.title}</Text>
                </View>
                {rec.items.map((item, i) => (
                  <View key={i} style={styles.recItem}>
                    <View style={[styles.recDot, { backgroundColor: rec.color }]} />
                    <Text style={[styles.recText, { color: colors.mutedForeground }]} numberOfLines={3}>{item}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  stepCard: { padding: 16, borderRadius: 18, marginBottom: 12 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  stepTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", flex: 1 },
  stepGoalLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stepCount: { fontSize: 38, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 8 },
  stepBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  stepBarFill: { height: 6, borderRadius: 3 },
  stepPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  stepError: { fontSize: 13, fontFamily: "Inter_400Regular" },
  profileCard: { padding: 16, borderRadius: 18, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 14 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  inputWrap: { flex: 1 },
  inputLabel: { fontSize: 11, marginBottom: 6, fontFamily: "Inter_400Regular" },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 14, fontFamily: "Inter_500Medium" },
  goalRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  goalBtn: { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 12, gap: 4 },
  goalLabel: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  bmiBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 14 },
  bmiVal: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bmiCat: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  saveBtn: { padding: 13, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  viewToggle: { flexDirection: "row", padding: 4, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  toggleLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  workoutCard: { padding: 14, borderRadius: 18 },
  workoutTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  workoutIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  workoutTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  workoutMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  workoutDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
  intensityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  intensityText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  workoutXp: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  workoutSets: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  workoutDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 10 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10 },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  doneBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  recCard: { padding: 14, borderRadius: 16, marginBottom: 12 },
  recHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  recTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  recItem: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  recDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  recText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
