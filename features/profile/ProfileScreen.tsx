import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight, FadeInUp, useAnimatedStyle, withSpring, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useApp, getRankForLevel, RANK_THRESHOLDS, getLevelXP, BORDER_ITEMS, UserProfile } from "@/context/AppContext";
import { THEMES } from "@/constants/themes";
import { useTheme } from "@/hooks/useTheme";
import { CrystalCard } from "@/components/CrystalCard";

const { width } = Dimensions.get("window");
const AVATAR_COLORS = ["#818CF8", "#F43F5E", "#F59E0B", "#10D9A0", "#00D9F5", "#C084FC"];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function StatCard({ icon, value, label, color, index }: { icon: string; value: string; label: string; color: string; index: number }) {
  const colors = useTheme();
  return (
    <View style={styles.statCardWrapper}>
      <Animated.View entering={FadeInDown.delay(400 + index * 100)}>
        <CrystalCard style={[styles.statCard, { borderColor: colors.border }]}>
          <View style={[styles.statIconBg, { backgroundColor: color + "15" }]}>
            <MaterialCommunityIcons name={icon as any} size={24} color={color} />
          </View>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
        </CrystalCard>
      </Animated.View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const {
    profile,
    xp,
    level,
    fitnessProfile,
    coins,
    getTotalHabitsCompleted,
    getTotalWorkoutsCompleted,
    achievements,
    friends,
    setProfile,
    setFitnessProfile,
    themeId,
    setTheme,
    logout,
    isDemoMode,
    avatarBorderId,
  } = useApp();

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(profile.name || "");
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editGoal, setEditGoal] = useState<string>(fitnessProfile.goal || "stay_fit");
  const [isSaving, setIsSaving] = useState(false);

  // Sync edit state when modal opens
  useEffect(() => {
    if (editModal) {
      setEditName(profile.name || "");
      setEditBio(profile.bio || "");
      setEditGoal(fitnessProfile.goal || "stay_fit");
    }
  }, [editModal, profile.name, profile.bio, fitnessProfile.goal]);

  const rank = getRankForLevel(level);
  const rankInfo = RANK_THRESHOLDS.find((r) => r.rank === rank.rank) ?? RANK_THRESHOLDS[0];
  const nextRank = RANK_THRESHOLDS.find((r) => r.level > level);

  const currentLvlXP = getLevelXP(level);
  const nextLvlXP = getLevelXP(level + 1);
  const xpInCurrentLevel = Math.max(0, xp - currentLvlXP);
  const xpNeededForNext = nextLvlXP - currentLvlXP;
  const progressPct = (xpInCurrentLevel / xpNeededForNext) * 100;

  const avatarColor = AVATAR_COLORS[level % AVATAR_COLORS.length];
  const activeBorder = BORDER_ITEMS.find((b) => b.id === avatarBorderId) ?? null;

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
      if (!result.canceled) {
      setProfile({ photoUri: result.assets[0].uri });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
      >
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <View style={[styles.demoBanner, { backgroundColor: "rgba(16,217,160,0.1)", borderColor: "rgba(16,217,160,0.3)" }]}>
            <MaterialCommunityIcons name="play-circle-outline" size={18} color="#10D9A0" />
            <Text style={styles.demoText}>Demo Mode — Data is not saved</Text>
          </View>
        )}

        {/* Header Section */}
        <Animated.View entering={FadeInDown.duration(800)}>
          <CrystalCard style={styles.heroSection}>
            <TouchableOpacity onPress={pickPhoto} style={styles.avatarContainer}>
              <LinearGradient
                colors={activeBorder ? [activeBorder.color, activeBorder.color + "60"] : [avatarColor, avatarColor + "80"]}
                style={[styles.avatarGlow, activeBorder && { opacity: 0.7 }]}
              />
              {profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={[styles.avatar, activeBorder && { borderColor: activeBorder.color, borderWidth: 3 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }, activeBorder && { borderColor: activeBorder.color, borderWidth: 3 }]}>
                  <Text style={[styles.avatarInitials, { color: activeBorder ? activeBorder.color : avatarColor }]}>
                    {getInitials(profile.name || "User")}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <TouchableOpacity onPress={() => setEditModal(true)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.heroName, { color: colors.foreground }]}>
                  {profile.name || "Trackley Member"}
                </Text>
                <Ionicons name="pencil" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.heroBio, { color: colors.mutedForeground }]} numberOfLines={2}>
                {profile.bio || "Optimizing life, one habit at a time."}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.rankBadge, { backgroundColor: rankInfo.color + "20" }]}>
                  <Ionicons name={rankInfo.icon as any} size={14} color={rankInfo.color} />
                  <Text style={[styles.rankText, { color: rankInfo.color }]}>{rank.rank}</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.levelText, { color: colors.foreground }]}>Level {level}</Text>
                </View>
              </View>
            </View>
          </CrystalCard>
        </Animated.View>

        {/* XP Progress */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <CrystalCard style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View>
                <Text style={[styles.xpTitle, { color: colors.foreground }]}>Experience</Text>
                <Text style={[styles.xpSubtitle, { color: colors.mutedForeground }]}>{xp} Total XP</Text>
              </View>
              <Text style={[styles.xpValue, { color: colors.primary }]}>
                {Math.floor(progressPct)}%
              </Text>
            </View>
            <View style={[styles.xpTrack, { backgroundColor: colors.secondary }]}>
              <LinearGradient
                colors={[colors.primary, colors.accent || colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${progressPct}%` }]}
              />
            </View>
            {nextRank && (
              <Text style={[styles.nextRankLabel, { color: colors.mutedForeground }]}>
                Next Rank: <Text style={{ color: nextRank.color }}>{nextRank.rank}</Text> at Lvl {nextRank.level}
              </Text>
            )}
          </CrystalCard>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard index={0} icon="checkbox-marked-circle" value={getTotalHabitsCompleted().toString()} label="Habits" color={colors.primary} />
          <StatCard index={1} icon="dumbbell" value={getTotalWorkoutsCompleted().toString()} label="Workouts" color="#F43F5E" />
          <StatCard index={2} icon="trophy" value={achievements.filter(a => a.unlockedAt).length.toString()} label="Awards" color="#F59E0B" />
          <StatCard index={3} icon="account-group" value={friends.length.toString()} label="Friends" color="#10D9A0" />
        </View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <CrystalCard style={styles.menuCard}>
            {[
              { icon: "trophy-variant", label: "Achievements", desc: "View your hall of fame", color: "#F59E0B", route: "/(tabs)/achievements" },
              { icon: "dumbbell", label: "Fitness", desc: "Workouts & BMI goals", color: "#10D9A0", route: "/(tabs)/fitness" },
              { icon: "wallet-outline", label: "Wallet & Store", desc: `${coins || 0} coins available`, color: colors.gold, route: "/(tabs)/store" },
              { icon: "account-group", label: "Friends", desc: `${friends.length} friends`, color: "#0EA5E9", route: "/(tabs)/friends" },
              { icon: "cash-multiple", label: "Finance", desc: "Budget & bill splits", color: "#34D399", route: "/(tabs)/finance" },
              { icon: "pencil-circle", label: "Edit Profile", desc: "Name, bio & photo", color: colors.foreground, route: null, action: "edit" },
            ].map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                onPress={() => { 
                  Haptics.selectionAsync(); 
                  if (item.action === "edit") {
                    setEditModal(true);
                  } else if (item.route) {
                    require("expo-router").router.push(item.route as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: item.color + "18" }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </CrystalCard>
        </Animated.View>

        {/* Rank Path */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <CrystalCard style={styles.pathCard}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rank Journey</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
              {RANK_THRESHOLDS.map((r, i) => {
                const isUnlocked = level >= r.level;
                const isCurrent = rank.rank === r.rank;
                return (
                  <View key={r.rank} style={styles.pathItem}>
                    {i > 0 && <View style={[styles.pathLine, { backgroundColor: isUnlocked ? r.color : colors.border }]} />}
                    <View style={[
                      styles.pathNode, 
                      { backgroundColor: isUnlocked ? r.color + "20" : colors.secondary, borderColor: isCurrent ? r.color : "transparent" }
                    ]}>
                      <Ionicons name={r.icon as any} size={20} color={isUnlocked ? r.color : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.pathName, { color: isUnlocked ? colors.foreground : colors.mutedForeground }]}>{r.rank}</Text>
                    <Text style={styles.pathLevel}>Lvl {r.level}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </CrystalCard>
        </Animated.View>

        {/* Premium Logout */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "08" }]}
            onPress={() => {
              Alert.alert("Sign Out", "Are you sure you want to exit your premium experience?", [
                { text: "Stay", style: "cancel" },
                { 
                  text: "Sign Out", 
                  style: "destructive", 
                  onPress: async () => {
                    await logout();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  } 
                }
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>{isDemoMode ? "Exit Demo Mode" : "End Premium Session"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} onPress={() => setEditModal(false)} />
          <Animated.View 
            entering={FadeInUp.duration(350).springify()} 
            style={[styles.sheet, { backgroundColor: colors.card }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Edit Profile</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>DISPLAY NAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.secondary,
                      color: colors.foreground,
                      borderColor: colors.border,
                    }
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your display name"
                  placeholderTextColor={colors.mutedForeground}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>BIO</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, minHeight: 90, textAlignVertical: "top", paddingTop: 14 }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Write a little about yourself"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                />
              </View>

              <View style={[styles.inputGroup, { marginBottom: 24 }]}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>PRIMARY GOAL</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[{key:"lose_weight",label:"Lose Weight",icon:"scale-bathroom"},{key:"build_muscle",label:"Build Muscle",icon:"arm-flex"},{key:"stay_fit",label:"Stay Fit",icon:"heart-pulse"}].map(g => {
                    const isActive = editGoal === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.input,
                          { flex: 1, alignItems: "center", padding: 12, backgroundColor: isActive ? colors.primary + "15" : colors.secondary, borderColor: isActive ? colors.primary : colors.border }
                        ]}
                        onPress={() => { setEditGoal(g.key); Haptics.selectionAsync(); }}
                      >
                        <MaterialCommunityIcons name={g.icon as any} size={20} color={isActive ? colors.primary : colors.mutedForeground} />
                        <Text style={{ fontSize: 11, marginTop: 6, color: isActive ? colors.foreground : colors.mutedForeground, fontWeight: isActive ? "700" : "500", textAlign:"center" }}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                onPress={async () => {
                  setIsSaving(true);
                  try {
                    setProfile({ name: editName, bio: editBio });
                    setFitnessProfile({ ...fitnessProfile, goal: editGoal as any });
                    setEditModal(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (err: any) {
                    Alert.alert("Action Blocked", err.message);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.saveBtn, { marginTop: 8 }]}
                >
                  {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    margin: 16,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  avatarContainer: {
    position: "relative",
    width: 84,
    height: 84,
  },
  avatarGlow: {
    position: "absolute",
    inset: -4,
    borderRadius: 46,
    opacity: 0.3,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "900",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  heroBio: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  rankBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  rankText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  levelText: { fontSize: 11, fontWeight: "700" },
  editCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  
  xpCard: { marginHorizontal: 16, marginBottom: 16, padding:16 },
  xpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  xpTitle: { fontSize: 16, fontWeight: "800" },
  xpSubtitle: { fontSize: 12, opacity: 0.7 },
  xpValue: { fontSize: 18, fontWeight: "900" },
  xpTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 5 },
  nextRankLabel: { fontSize: 11, marginTop: 8, fontWeight: "600" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  statCardWrapper: { width: (width - 44) / 2 },
  statCard: { padding: 16, alignItems: "center", gap: 8 },
  statIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

  pathCard: { marginHorizontal: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  pathItem: { alignItems: "center", width: 80 },
  pathLine: { position: "absolute", top: 18, left: -40, width: 40, height: 2, opacity: 0.5 },
  pathNode: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, marginBottom: 6 },
  pathName: { fontSize: 10, fontWeight: "700" },
  pathLevel: { fontSize: 9, opacity: 0.5 },

  logoutBtn: { 
    marginHorizontal: 16, 
    height: 64, 
    borderRadius: 24, 
    borderWidth: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12, 
    overflow: "hidden" 
  },
  logoutText: { fontSize: 16, fontWeight: "800" },
  demoBanner: { 
    marginHorizontal: 16, 
    marginBottom: 12, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    borderWidth: 1 
  },
  demoText: { color: "#10D9A0", fontSize: 13, fontWeight: "700" },

  sectionLabelRow: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, marginTop: 4 },
  sectionLabelText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },

  menuCard: { marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuIconBg: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 1 },
  menuDesc: { fontSize: 12, fontFamily: "Inter_400Regular", opacity: 0.75 },

  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  hubTile: {
    width: (width - 44) / 2,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubIconBg: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hubLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  hubDesc: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { padding: 24, borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, borderBottomWidth: 0 },
  sheetHandle: { width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: "900", marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  input: { padding: 16, borderRadius: 16, borderWidth: 1.5, fontSize: 16 },
  saveBtn: { height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginTop: 8, overflow: 'hidden' },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
