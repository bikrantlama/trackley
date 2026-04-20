import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  Image,
  Alert,
  Linking,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  FadeInDown,
  withRepeat,
  Easing,
} from "react-native-reanimated";

import { type FitnessProfile, useApp, calcLevel } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { GlassContainer } from "@/components/GlassContainer";
import { CrystalCard } from "@/components/CrystalCard";
import { TrackleyLogo } from "@/components/TrackleyLogo";

type Goal = "lose_weight" | "build_muscle" | "stay_fit" | "endurance" | "strength" | "flexibility" | "longevity";

interface Exercise {
  name: string;
  reps?: string;
  duration?: string;
  instructions: string;
  videoUrl?: string;
}

const EXERCISE_VIDEOS: Record<string, string> = {
  "Dynamic Warmup": "https://www.youtube.com/watch?v=gjDW_UC2OlE",
  "HIIT Cardio Blast": "https://www.youtube.com/watch?v=mlcK5WLxjpE",
  "Yoga Flow": "https://www.youtube.com/watch?v=v7AYKMP6rOE",
  "Strength Training": "https://www.youtube.com/watch?v=ymPU0g7qU",
  "Core Crusher": "https://www.youtube.com/watch?v=AnYlTq8LJZ4",
  "Lower Body Burn": "https://www.youtube.com/watch?v=4sKJq2o6h2M",
  "Upper Body Power": "https://www.youtube.com/watch?v=PhuqmRkTqV8",
  "Full Body Circuit": "https://www.youtube.com/watch?v=r4w5Oe0U9Y8",
  "Stretch & Recovery": "https://www.youtube.com/watch?v=g_tea8ZNk5A",
  "Mobility Master": "https://www.youtube.com/watch?v=2L2lnxIcN3E",
  "Functional Strength & Mobility": "https://www.youtube.com/watch?v=4sKJq2o6h2M",
  "Stretch & Cool Down": "https://www.youtube.com/watch?v=g_tea8ZNk5A",
  "Low Impact Cardio": "https://www.youtube.com/watch?v=bMknfKXaD38",
  "Pilates Core": "https://www.youtube.com/watch?v=AnYlTq8LJZ4",
  "Boxing Basics": "https://www.youtube.com/watch?v=PhuqmRkTqV8",
  "Dance Cardio": "https://www.youtube.com/watch?v=bMknfKXaD38",
  "Swimming Workout": "https://www.youtube.com/watch?v=2L2lnxIcN3E",
  "HIIT Beginner": "https://www.youtube.com/watch?v=mlcK5WLxjpE",
  "Stretch & Flexibility": "https://www.youtube.com/watch?v=g_tea8ZNk5A",
  "Endurance Builder": "https://www.youtube.com/watch?v=mlcK5WLxjpE",
};

interface Workout {
  id: string;
  day: number; // 1-7
  title: string;
  description: string;
  duration: string;
  exercises: Exercise[];
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
  const plan: Workout[] = [];
  const isHighBMI = bmi && bmi >= 28;
  const isUnderweight = bmi && bmi < 18.5;

  const days = [1, 2, 3, 4, 5, 6, 7];

  days.forEach((day) => {
    let workout: Workout;
    
    // 60 Minute Structure Logic
    const warmup: Exercise = { 
      name: "Dynamic Warmup", 
      duration: "10 min", 
      instructions: "Arm circles, leg swings, jumping jacks (low impact if high BMI), and cat-cow to prime the body." 
    };
    
    const cooldown: Exercise = { 
      name: "Deep Recovery", 
      duration: "10 min", 
      instructions: "Static stretching for used muscle groups and 5 minutes of focused breathing." 
    };

    if (goal === "build_muscle" || goal === "strength") {
      const isPush = day % 3 === 1;
      const isPull = day % 3 === 2;
      const isLegs = day % 3 === 0;
      
      workout = {
        id: `day_${day}`,
        day,
        title: isPush ? "Power Push" : isPull ? "Hypertrophy Pull" : "Titan Legs",
        description: "Intense 60-minute resistance session optimized for total muscle activation.",
        duration: "60 min",
        icon: "arm-flex",
        xp: 80,
        intensity: "High",
        tip: "Focus on the mind-muscle connection. Slow negatives for maximum growth.",
        exercises: [
          warmup,
          { 
            name: isPush ? "Heavy Chest/Shoulder Press" : isPull ? "Deadlifts/Weighted Rows" : "Barbell Squats", 
            reps: "4 sets of 8-10", 
            instructions: "Compound movements: 40 minutes of heavy work with 90s rest." 
          },
          cooldown
        ]
      };
    } else if (goal === "lose_weight" || goal === "endurance") {
      workout = {
        id: `day_${day}`,
        day,
        title: day % 2 === 0 ? "Metabolic Blast" : "Endurance Zone 2",
        description: "60 minutes of metabolic conditioning to maximize fat oxidation.",
        duration: "60 min",
        icon: "fire",
        xp: 75,
        intensity: isHighBMI ? "Medium" : "High",
        tip: "Keep your heart rate consistent. Consistency over speed.",
        exercises: [
          warmup,
          { 
            name: day % 2 === 0 ? "HIIT Intervals / Circuit" : "Steady State Cardio", 
            duration: "40 min", 
            instructions: "Keep intensity at 70-80% of max HR for the entire block." 
          },
          cooldown
        ]
      };
    } else {
      workout = {
        id: `day_${day}`,
        day,
        title: "Total Conditioning",
        description: "A balanced 60-minute session for general health and longevity.",
        duration: "60 min",
        icon: "heart-pulse",
        xp: 65,
        intensity: "Medium",
        tip: "Drink at least 1L of water during this 1-hour session.",
        exercises: [
          warmup,
          { 
            name: "Functional Strength & Mobility", 
            duration: "40 min", 
            instructions: "Mix of bodyweight exercises and mobility flows." 
          },
          cooldown
        ]
      };
    }
    plan.push(workout);
  });

  return plan.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((ex) => ({
      ...ex,
      videoUrl: EXERCISE_VIDEOS[ex.name] || `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " exercise tutorial")}`,
    })),
  }));
}

function getRecommendations(profile: FitnessProfile, bmi: number | null): Recommendation[] {
  const recs: Recommendation[] = [];
  if (!profile.goal) return recs;

  const b = bmi || 22;

  // Nutrition
  let nutr: Recommendation = { title: "Nutrition Strategy", items: [], color: "#10D9A0", icon: "nutrition" };
  if (b < 18.5) nutr.items = ["Premium Protein Sourcing (NRS 500/day check)", "Caloric Surplus +600 kcal", "Post-workout carb loading"];
  else if (b < 25) nutr.items = ["Maintenance: High satiety foods", "3g protein per kg lean mass", "Mineral balance: Pink salt + Lemon"];
  else if (b < 30) nutr.items = ["Cyclical Ketosis or Carbs Cycling", "Fasted morning walks (20 min)", "Omega-3 supplementation"];
  else nutr.items = ["Blood sugar management: 2tbsp ACV", "Lean protein focus (Chicken/Tofu)", "Walk 10m post every meal"];
  recs.push(nutr);

  // Goal Specific
  if (profile.goal === "build_muscle" || profile.goal === "strength") {
    recs.push({ title: "Hypertrophy Secret", items: ["Sleep 9 hours tonight", "Creatine: 5g daily standard", "Focus on the 'stretch' position"], color: "#818CF8", icon: "arm-flex" });
  } else if (profile.goal === "lose_weight") {
    recs.push({ title: "Fat Decimation", items: ["12,000 steps minimum", "Cold exposure (Shower/Plunge)", "Black coffee pre-workout"], color: "#F43F5E", icon: "fire" });
  }

  return recs;
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "#60A5FA", desc: "Focus on nutrient density." };
  if (bmi < 25) return { label: "Normal", color: "#10D9A0", desc: "Optimal health. Maintain consistency." };
  if (bmi < 30) return { label: "Overweight", color: "#F59E0B", desc: "Focus on joint protection." };
  return { label: "Obese", color: "#F43F5E", desc: "Prioritize low-impact movement." };
}

import CrystalBurst, { type CrystalBurstRef } from "@/components/CrystalBurst";

const EXERCISE_ANIMATIONS: Record<string, { icon: string; color: string; animation: "pulse" | "bounce" | "rotate" }> = {
  "Dynamic Warmup": { icon: "run-fast", color: "#60A5FA", animation: "bounce" },
  "HIIT Cardio Blast": { icon: "fire", color: "#F43F5E", animation: "pulse" },
  "Yoga Flow": { icon: "meditation", color: "#A78BFA", animation: "bounce" },
  "Strength Training": { icon: "arm-flex", color: "#F59E0B", animation: "pulse" },
  "Core Crusher": { icon: "human-handsup", color: "#10D9A0", animation: "rotate" },
  "Lower Body Burn": { icon: "run", color: "#818CF8", animation: "bounce" },
  "Upper Body Power": { icon: "weight-lifter", color: "#F472B6", animation: "pulse" },
  "Full Body Circuit": { icon: "human", color: "#FB923C", animation: "bounce" },
  "Stretch & Recovery": { icon: "yoga", color: "#34D399", animation: "bounce" },
  "Stretch & Cool Down": { icon: "yoga", color: "#34D399", animation: "bounce" },
  "Stretch & Flexibility": { icon: "yoga", color: "#34D399", animation: "bounce" },
  "Low Impact Cardio": { icon: "walk", color: "#60A5FA", animation: "bounce" },
  "Pilates Core": { icon: "human-handsup", color: "#10D9A0", animation: "rotate" },
  "Boxing Basics": { icon: "boxing-glove", color: "#F43F5E", animation: "pulse" },
  "Dance Cardio": { icon: "human-handsup", color: "#F472B6", animation: "bounce" },
  "Swimming Workout": { icon: "swim", color: "#60A5FA", animation: "bounce" },
  "HIIT Beginner": { icon: "fire", color: "#F43F5E", animation: "pulse" },
  "Endurance Builder": { icon: "heart-pulse", color: "#F43F5E", animation: "pulse" },
  "Mobility Master": { icon: "human-handsup", color: "#A78BFA", animation: "rotate" },
  "Functional Strength & Mobility": { icon: "human", color: "#F59E0B", animation: "bounce" },
};

function AnimatedExerciseFigure({ exerciseName }: { exerciseName: string }) {
  const config = EXERCISE_ANIMATIONS[exerciseName] || { icon: "dumbbell", color: "#007AFF", animation: "pulse" as const };
  
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (config.animation === "pulse") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else if (config.animation === "bounce") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );
    } else if (config.animation === "rotate") {
      rotate.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 500 }),
          withTiming(-10, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [config.animation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.exerciseFigure, { backgroundColor: config.color + "15" }, animStyle]}>
      <MaterialCommunityIcons name={config.icon as any} size={28} color={config.color} />
    </Animated.View>
  );
}

function WorkoutCard({ workout, index, burstRef }: { workout: Workout; index: number; burstRef?: React.RefObject<CrystalBurstRef | null> }) {
  const colors = useTheme();
  const { completeWorkout, isWorkoutCompleted } = useApp();
  const done = isWorkoutCompleted(workout.id);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  function handleComplete(event: any) {
    if (done) return;
    scale.value = withSequence(withSpring(0.95, { damping: 12 }), withSpring(1.02, { damping: 8 }), withSpring(1, { damping: 12 }));
    glow.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 600 }));
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Trigger burst at button location
    if (burstRef?.current) {
      const { pageX, pageY } = event.nativeEvent;
      burstRef.current.trigger(pageX, pageY);
    }
    
    completeWorkout(workout.id);
  }

  const intensityColor = workout.intensity === "High" ? colors.destructive : workout.intensity === "Medium" ? colors.warning : colors.success;

  return (
    <Animated.View entering={FadeInDown.delay(index * 150)} style={{ marginBottom: 16 }}>
      <Animated.View style={animStyle}>
        <View style={{ overflow: 'hidden', borderRadius: 24 }}>
          <Animated.View style={[glowStyle, StyleSheet.absoluteFillObject, { backgroundColor: colors.primary + "25" }]} />
          <Animated.View style={[{ backgroundColor: colors.card, borderColor: done ? colors.primary + "80" : colors.border, borderWidth: 1, borderRadius: 24 }]}>
          <View style={styles.workoutTop}>
            <View style={[styles.workoutIconWrap, { backgroundColor: colors.primary + "20" }]}>
              <MaterialCommunityIcons name={workout.icon as any} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.workoutDay, { color: colors.primary, fontWeight: 'bold' }]}>Day {workout.day}</Text>
                <Text style={[styles.workoutTitle, { color: colors.foreground }]} numberOfLines={1}>{workout.title}</Text>
              </View>
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

          <View style={styles.exerciseList}>
            {workout.exercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseItem}>
                <AnimatedExerciseFigure exerciseName={ex.name} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, { color: colors.foreground }]}>{ex.name} {ex.reps ? `(${ex.reps})` : ex.duration ? `(${ex.duration})` : ""}</Text>
                  <Text style={[styles.exerciseInfo, { color: colors.mutedForeground }]}>{ex.instructions}</Text>
                  {ex.videoUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(ex.videoUrl!)} style={{ marginTop: 4 }}>
                      <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_500Medium" }}>▶ Watch Demo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          <GlassContainer style={[styles.tipBox, { backgroundColor: colors.primary + "10", borderStyle: 'solid' }]}>
            <Ionicons name="bulb-outline" size={14} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]} numberOfLines={2}>{workout.tip}</Text>
          </GlassContainer>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

function StepTracker() {
  const colors = useTheme();
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
          <Text style={[styles.stepCount, { color: colors.primary }]}>{steps.toLocaleString()}</Text>
          <View style={[styles.stepBarBg, { backgroundColor: colors.secondary }]}>
            <View style={[styles.stepBarFill, { backgroundColor: colors.primary, width: `${pct}%` as `${number}%` }]} />
          </View>
          <Text style={[styles.stepPct, { color: colors.mutedForeground }]}>{pct.toFixed(0)}% of daily goal</Text>
        </>
      )}
    </View>
  );
}

export default function FitnessScreen() {
  const colors = useTheme();
  const { fitnessProfile, setFitnessProfile, isWorkoutCompleted, completeWorkout } = useApp();
  const [weight, setWeight] = useState(fitnessProfile.weight?.toString() ?? "");
  const [height, setHeight] = useState(fitnessProfile.height?.toString() ?? "");
  const [age, setAge] = useState(fitnessProfile.age?.toString() ?? "");
  const [goal, setGoal] = useState<Goal>((fitnessProfile.goal as Goal) ?? "stay_fit");
  const [gender, setGender] = useState<FitnessProfile["gender"]>(fitnessProfile.gender ?? "male");
  const [activityLevel, setActivityLevel] = useState<FitnessProfile["activityLevel"]>(fitnessProfile.activityLevel ?? "moderate");
  const [saved, setSaved] = useState(!!fitnessProfile.weight);
  const [isProfileExpanded, setIsProfileExpanded] = useState(!fitnessProfile.weight);
  const [activeView, setActiveView] = useState<"workouts" | "recommendations">("workouts");

  const burstRef = React.useRef<CrystalBurstRef>(null);

  const { profile, setProfile } = useApp();

  async function addProgressPhoto() {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Photo upload requires the mobile app.");
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libPerm.granted) {
        Alert.alert("Permission needed", "Allow camera or photo access.");
        return;
      }
    }
    Alert.alert("Add Progress Photo", "Choose source:", [
      {
        text: "Camera",
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!r.canceled && r.assets[0]) {
            setProfile({
              progressPhotos: [...profile.progressPhotos, r.assets[0].uri],
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Library",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!r.canceled && r.assets[0]) {
            setProfile({
              progressPhotos: [...profile.progressPhotos, r.assets[0].uri],
            });
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

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
    setIsProfileExpanded(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const GOALS: { key: Goal; label: string; icon: string }[] = [
    { key: "lose_weight", label: "Weight Loss", icon: "fire" },
    { key: "build_muscle", label: "Muscle Gain", icon: "arm-flex" },
    { key: "stay_fit", label: "General Fit", icon: "heart-pulse" },
    { key: "endurance", label: "Endurance", icon: "lightning-bolt" },
    { key: "strength", label: "Raw Strength", icon: "weight-lifter" },
    { key: "flexibility", label: "Flexibility", icon: "yoga" },
    { key: "longevity", label: "Longevity", icon: "leaf" },
  ];

  const GENDERS: { key: NonNullable<FitnessProfile["gender"]>; label: string }[] = [
    { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "other", label: "Other" },
  ];

  const ACTIVITY: { key: NonNullable<FitnessProfile["activityLevel"]>; label: string }[] = [
    { key: "sedentary", label: "Sedentary" }, { key: "light", label: "Light" },
    { key: "moderate", label: "Moderate" }, { key: "active", label: "Active" },
    { key: "athlete", label: "Athlete" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting()},</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{profile?.name || "Champion"}</Text>
        </View>
        <TrackleyLogo size={36} />
      </View>

      <StepTracker />

      <CrystalCard style={[styles.profileCard, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Body Profile</Text>
          {saved && !isProfileExpanded && (
            <TouchableOpacity onPress={() => setIsProfileExpanded(true)}>
              <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isProfileExpanded && saved ? (
           <View style={{ flexDirection: "row", gap: 10 }}>
             <View style={{ flex: 1, backgroundColor: colors.secondary, padding: 12, borderRadius: 12 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>BMI</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontFamily: "Inter_700Bold" }}>{bmi?.toFixed(1)}</Text>
             </View>
             <View style={{ flex: 1, backgroundColor: colors.secondary, padding: 12, borderRadius: 12 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Goal</Text>
                <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_600SemiBold" }} numberOfLines={1}>{GOALS.find(g => g.key === goal)?.label}</Text>
             </View>
           </View>
        ) : (
          <>
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
          </>
        )}
      </CrystalCard>

      {saved && (
        <>
          <View style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["workouts", "recommendations"] as const).map((v) => (
              <TouchableOpacity key={v} onPress={() => setActiveView(v)} style={[styles.toggleBtn, { backgroundColor: activeView === v ? colors.primary : "transparent" }]}>
                <Text style={[styles.toggleLabel, { color: activeView === v ? "#fff" : colors.mutedForeground }]}>
                  {v === "workouts" ? "Workouts Plan" : "Expert Advice"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeView === "workouts" ? (
            <View style={{ gap: 16 }}>
              <View style={[styles.weeklySchedule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Weekly Schedule</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {workouts.map((w, i) => {
                    const isDone = isWorkoutCompleted(w.id);
                    return (
                      <View key={w.id} style={[styles.dayCircle, { backgroundColor: isDone ? colors.success + "20" : colors.secondary, borderColor: isDone ? colors.success : colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.dayCircleText, { color: isDone ? colors.success : colors.mutedForeground }]}>Day {w.day}</Text>
                        <MaterialCommunityIcons name={isDone ? "check-circle" : w.icon as any} size={20} color={isDone ? colors.success : colors.primary} />
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Only show today's workout */}
              {workouts.slice(0, 1).map((w, idx) => (
                <WorkoutCard key={w.id} workout={w} index={idx} burstRef={burstRef} />
              ))}

              {workouts.length > 1 && (
                <View style={[styles.lockedWorkouts, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="lock" size={20} color={colors.mutedForeground} />
                  <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
                    Complete today's workout to unlock more sessions
                  </Text>
                </View>
              )}
            </View>
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

      <GlassContainer style={[styles.progressSection, { marginTop: 12 }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Progress Photos</Text>
          <TouchableOpacity
            onPress={addProgressPhoto}
            style={[styles.addPhotoBtn, { backgroundColor: colors.primary + "20" }]}
          >
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
            <Text style={[styles.addPhotoBtnText, { color: colors.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {profile.progressPhotos.length === 0 ? (
          <TouchableOpacity
            onPress={addProgressPhoto}
            style={[styles.emptyPhotos, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyPhotosText, { color: colors.mutedForeground }]}>
              Take a photo to track your progress
            </Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {profile.progressPhotos.map((uri, idx) => (
              <View key={idx} style={{ marginRight: 10 }}>
                <Image source={{ uri }} style={styles.progressThumb} />
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Delete Photo", "Are you sure?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          setProfile({
                            progressPhotos: profile.progressPhotos.filter((p) => p !== uri),
                          });
                        },
                      },
                    ]);
                  }}
                  style={[styles.deletePhotoBtn, { backgroundColor: colors.destructive }]}
                >
                  <Ionicons name="trash-outline" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={addProgressPhoto}
              style={[styles.addPhotoThumb, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="add" size={28} color={colors.mutedForeground} />
            </TouchableOpacity>
          </ScrollView>
        )}
      </GlassContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  stepCard: { padding: 16, borderRadius: 24, marginBottom: 16 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  stepTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", flex: 1 },
  stepGoalLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stepCount: { fontSize: 38, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 8 },
  stepBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  stepBarFill: { height: 6, borderRadius: 3 },
  stepPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  stepError: { fontSize: 13, fontFamily: "Inter_400Regular" },
  profileCard: { padding: 16, borderRadius: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
  },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  inputWrap: { flex: 1 },
  inputLabel: { fontSize: 11, marginBottom: 6, fontFamily: "Inter_400Regular" },
  input: { borderWidth: 1, borderRadius: 24, padding: 10, fontSize: 14, fontFamily: "Inter_500Medium" },
  goalRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  goalBtn: { flexBasis: '30%', flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 24, gap: 4, minHeight: 70 },
  goalLabel: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  bmiBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 24, marginBottom: 14 },
  bmiVal: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bmiCat: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  saveBtn: { padding: 15, borderRadius: 24, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  viewToggle: { flexDirection: "row", padding: 4, borderRadius: 24, borderWidth: 1, marginBottom: 12 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 16, alignItems: "center" },
  toggleLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  workoutCard: { padding: 14, borderRadius: 24 },
  workoutTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  workoutIconWrap: { width: 42, height: 42, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  workoutTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  workoutDay: { fontSize: 13, fontFamily: "Inter_700Bold" },
  workoutMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  workoutDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
  intensityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  intensityText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", fontFamily: "Inter_800ExtraBold" },
  workoutXp: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  doneBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  exerciseList: { marginTop: 12, gap: 10, marginBottom: 12 },
  exerciseItem: { flexDirection: 'row', gap: 10 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 8 },
  exerciseName: { fontSize: 14, fontWeight: '600', fontFamily: "Inter_600SemiBold" },
  exerciseInfo: { fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  workoutDesc: { fontSize: 13, lineHeight: 18, marginBottom: 12, fontFamily: "Inter_400Regular" },
  tipBox: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 24, alignItems: "center" },
  tipText: { fontSize: 12, flex: 1, fontStyle: "italic", fontFamily: "Inter_400Regular" },
  recCard: { padding: 16, borderRadius: 24, marginBottom: 16 },
  recHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  recTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  recItem: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  recDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  recText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  progressSection: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addPhotoBtnText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptyPhotos: {
    height: 100,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  emptyPhotosText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressThumb: { width: 90, height: 120, borderRadius: 24 },
  deletePhotoBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  addPhotoThumb: {
    width: 90,
    height: 120,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  weeklySchedule: { padding: 16, borderRadius: 24, marginBottom: 8 },
  dayCircle: { width: 48, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dayCircleText: { fontSize: 10, fontWeight: '700' },
  viewSubTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4, marginBottom: 8 },
  exerciseFigure: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  lockedWorkouts: { padding: 16, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockedText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
});
