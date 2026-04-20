import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  FlatList,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { auth } from "@/lib/firebase";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
const { width, height } = Dimensions.get("window");

// ─── Slide height = 45% of screen so logo + slides + footer all fit ──────────
const SLIDE_H = height * 0.44;

const ONBOARDING_DATA = [
  {
    title: "Build Elite Habits",
    desc: "Turn goals into daily rituals with streaks, smart reminders, and instant XP rewards every day.",
    icon: "lightning-bolt",
    color: "#818CF8",
    benefit: "Daily Consistency"
  },
  {
    title: "Finance Mastery",
    desc: "Track every rupee, split group bills instantly, and see where your money really goes.",
    icon: "wallet",
    color: "#10D9A0",
    benefit: "Wealth Control"
  },
  {
    title: "Peak Fitness",
    desc: "BMI-tailored workouts for your exact goal — lose weight, build muscle, or stay fit.",
    icon: "dumbbell",
    color: "#F43F5E",
    benefit: "Body Goals"
  },
  {
    title: "Earn & Unlock",
    desc: "Earn coins from habits and workouts, then spend them on premium themes, borders & XP boosts.",
    icon: "gift",
    color: "#F59E0B",
    benefit: "Reward System"
  },
];

function DarkCard({ children, style, innerStyle }: { children: React.ReactNode; style?: any; innerStyle?: any }) {
  return (
    <View style={[styles.glassWrapper, style]}>
      {Platform.OS === "ios" ? (
         <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} />
      ) : (
         <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" }} />
      )}
      <LinearGradient
        colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
        style={styles.glassBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[styles.glassInner, innerStyle]}>{children}</View>
    </View>
  );
}

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const insets = useSafeAreaInsets();
  const { enterDemoMode } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const scrollRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeSlide) {
      setActiveSlide(index);
      Haptics.selectionAsync();
    }
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleAuth = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const cred = await auth.signInWithEmailAndPassword(email.trim(), password);
        if (cred.user && !cred.user.emailVerified) {
          await auth.signOut();
          setError("Please verify your email before signing in. Check your inbox.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
        if (cred.user) {
          await cred.user.sendEmailVerification();
          Alert.alert(
            "📧 Check Your Email",
            "A verification link has been sent. Please verify your email before signing in.",
            [{ text: "Go to Sign In", onPress: () => { setIsLogin(true); setPassword(""); } }]
          );
          await auth.signOut();
        }
      }
    } catch (err: any) {
      const code = err.code;
      let msg = "Something went wrong. Please try again.";
      if (code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-credential") {
        msg = "Incorrect email or password. Please try again.";
      } else if (code === "auth/email-already-in-use") {
        msg = "This email is already registered. Try signing in.";
      } else if (code === "auth/too-many-requests") {
        msg = "Too many attempts. Please wait a moment and try again.";
      } else if (code === "auth/network-request-failed") {
        msg = "No internet connection. Check your network and retry.";
      }
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDemoLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    enterDemoMode();
    setDemoLoading(false);
  };

  const handleResendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.sendEmailVerification();
        Alert.alert("Email Sent", "Verification email resent. Please check your inbox.");
      }
    } catch {
      Alert.alert("Error", "Could not resend verification email. Please try again.");
    }
  };

  // ─── Onboarding View ───────────────────────────────────────────────────────
  const OnboardingView = (
    <Animated.View entering={FadeIn.duration(600)} style={[styles.onboarding, { paddingTop: insets.top + 20 }]}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoCard}>
          <Image source={require("../assets/images/logo.png")} style={styles.logoImg} resizeMode="contain" />
        </View>
        <Text style={styles.tagline}>LIFESTYLE ARCHITECTURE</Text>
      </View>

      {/* Carousel */}
      <FlatList
        ref={scrollRef}
        data={ONBOARDING_DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => i.toString()}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <DarkCard style={styles.slideCard} innerStyle={{ alignItems: 'center' }}>
              {/* Icon */}
              <View style={[styles.slideIcon, { backgroundColor: item.color + "20" }]}>
                <MaterialCommunityIcons name={item.icon as any} size={40} color={item.color} />
              </View>
              {/* Badge */}
              <View style={[styles.badge, { backgroundColor: item.color + "20" }]}>
                <MaterialCommunityIcons name="star-four-points" size={9} color={item.color} />
                <Text style={[styles.badgeText, { color: item.color }]}>{item.benefit}</Text>
              </View>
              {/* Title & Desc */}
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideDesc}>{item.desc}</Text>


            </DarkCard>
          </View>
        )}
      />

      {/* Dots + Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {ONBOARDING_DATA.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: activeSlide === i ? "#10D9A0" : "rgba(255,255,255,0.2)", width: activeSlide === i ? 24 : 8 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => { setShowForm(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        >
          <LinearGradient colors={["#818CF8", "#10D9A0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGrad}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={19} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoBtn} onPress={handleDemo} disabled={demoLoading} activeOpacity={0.8}>
          {demoLoading ? (
            <ActivityIndicator size="small" color="#10D9A0" />
          ) : (
            <>
              <MaterialCommunityIcons name="play-circle-outline" size={18} color="#10D9A0" />
              <Text style={styles.demoBtnText}>Try Demo — No Account Needed</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ─── Auth Form View ────────────────────────────────────────────────────────
  const FormView = (
    <View style={[styles.form, { paddingTop: insets.top + 12 }]}>

      {/* Back */}
      <Animated.View entering={FadeIn.duration(400)}>
        <TouchableOpacity style={styles.backRow} onPress={() => { setShowForm(false); setError(null); }}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Logo + Title */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.formHeader}>
        <Image
          source={require("../assets/images/logo.png")}
          style={[styles.formLogo, { borderRadius: 24, marginBottom: 16 }]}
          resizeMode="cover"
        />
        <Text style={styles.formTitle}>{isLogin ? "Welcome Back" : "Join Trackley"}</Text>
        <Text style={styles.formSubtitle}>
          {isLogin ? "Sign in to your account" : "Create your Trackley profile"}
        </Text>
      </Animated.View>

      {/* Inputs */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Email */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={19} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
          </Animated.View>

          {/* Password */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={[styles.inputWrap, { marginTop: 12 }]}>
            <Ionicons name="lock-closed-outline" size={19} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.input}
              placeholder="Password (min. 6 chars)"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleAuth}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={19}
                color={showPassword ? "#10D9A0" : "rgba(255,255,255,0.35)"}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.errorBox}>
              <Ionicons name="alert-circle" size={17} color="#F43F5E" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorText}>{error}</Text>
                {error.toLowerCase().includes("verify") && (
                  <TouchableOpacity onPress={handleResendVerification} style={{ marginTop: 4 }}>
                    <Text style={{ color: "#10D9A0", fontSize: 12, fontWeight: "700" }}>
                      Resend verification email →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}

          {/* Sign In Button */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={{ marginTop: 24 }}>
            <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={["#818CF8", "#10D9A0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.authBtnGrad}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.authBtnText}>{isLogin ? "Sign In" : "Create Account"}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Toggle Sign In / Sign Up */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(null); }} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: "#10D9A0", fontWeight: "700" }}>
                  {isLogin ? "Sign Up" : "Sign In"}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Demo shortcut */}
          <Animated.View entering={FadeInDown.delay(360).springify()} style={{ marginTop: 20 }}>
            <TouchableOpacity style={styles.demoBtn} onPress={handleDemo} disabled={demoLoading}>
              {demoLoading ? (
                <ActivityIndicator size="small" color="#10D9A0" />
              ) : (
                <>
                  <MaterialCommunityIcons name="play-circle-outline" size={18} color="#10D9A0" />
                  <Text style={styles.demoBtnText}>Try Demo Mode Instead</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.legal}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );


  return (
    <View style={[styles.container, { backgroundColor: "#0D0D1A" }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {!showForm ? OnboardingView : FormView}
      </ScrollView>
    </View>
  );
}

const DARK_INPUT = {
  backgroundColor: "rgba(255,255,255,0.06)",
  borderColor: "rgba(255,255,255,0.14)",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  glassWrapper: {
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glassBackground: { ...StyleSheet.absoluteFillObject },
  glassInner: { padding: 0 },

  // ── Onboarding ──────────────────────────────────────────────────────────────
  onboarding: { flex: 1 },

  logoArea: { alignItems: "center", marginBottom: 20 },
  logoCard: {
    width: 90,
    height: 90,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImg: { width: 90, height: 90 },
  tagline: {
    fontSize: 11,
    letterSpacing: 4.5,
    textTransform: "uppercase",
    color: "#10D9A0",
    fontWeight: "700",
    fontFamily: "Inter_500Medium",
    marginTop: 5,
  },

  slide: { width, height: SLIDE_H, paddingHorizontal: 18, justifyContent: "center" },
  slideCard: { padding: 28, alignItems: "center", borderRadius: 32 },
  slideIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 14 },
  badgeText: { fontSize: 10, fontWeight: "800", fontFamily: "Inter_700Bold" },
  slideTitle: { fontSize: 24, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 8, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  slideDesc: { fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 21, marginBottom: 18, fontFamily: "Inter_400Regular" },

  featureList: { width: "100%", gap: 7 },
  featureRow: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  featureText: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: "600" },

  footer: { paddingHorizontal: 22, paddingTop: 12 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 18 },
  dot: { height: 7, borderRadius: 3.5 },

  primaryBtn: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnGrad: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },

  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16,217,160,0.3)",
    backgroundColor: "rgba(16,217,160,0.06)",
  },
  demoBtnText: { color: "#10D9A0", fontSize: 14, fontWeight: "600" },

  form: { flex: 1, paddingHorizontal: 24 },

  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 20 },
  backText: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.7)" },

  formHeader: { alignItems: "center", marginBottom: 36 },
  formLogoRing: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  formLogo: { width: 96, height: 96 },
  formTitle: { fontSize: 26, fontWeight: "900", color: "#fff", fontFamily: "Inter_700Bold", textAlign: "center" },
  formSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, textAlign: "center" },

  formCard: { padding: 0, gap: 0 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(244,63,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.25)",
    marginTop: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: "#F43F5E", fontWeight: "500", lineHeight: 18 },

  authBtn: { borderRadius: 18, overflow: "hidden" },
  authBtnGrad: { height: 56, alignItems: "center", justifyContent: "center" },
  authBtnText: { color: "#fff", fontSize: 17, fontWeight: "800", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },

  toggleBtn: { alignItems: "center", paddingVertical: 14 },
  toggleText: { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center" },

  legal: { textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11, paddingHorizontal: 20, marginTop: 20, marginBottom: 24, lineHeight: 16 },

  proTipArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  proTipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
