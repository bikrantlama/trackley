import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, getRankForLevel, RANK_THRESHOLDS } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const XP_PER_LEVEL = 300;

const AVATAR_COLORS = [
  "#818CF8",
  "#F43F5E",
  "#F59E0B",
  "#10D9A0",
  "#00D9F5",
  "#C084FC",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    profile,
    xp,
    level,
    fitnessProfile,
    getTotalHabitsCompleted,
    getTotalWorkoutsCompleted,
    completedWorkouts,
    achievements,
    friends,
    setProfile,
  } = useApp();

  const [editModal, setEditModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio);

  const rank = getRankForLevel(level);
  const rankInfo = RANK_THRESHOLDS.find((r) => r.rank === rank.rank) ?? RANK_THRESHOLDS[0];
  const nextRank = RANK_THRESHOLDS.find((r) => r.level > level);
  const progressPct = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const totalHabits = getTotalHabitsCompleted();
  const totalWorkouts = getTotalWorkoutsCompleted();

  const bmi =
    fitnessProfile.weight && fitnessProfile.height
      ? fitnessProfile.weight / Math.pow(fitnessProfile.height / 100, 2)
      : null;

  async function pickProfilePhoto() {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Photo upload requires the mobile app.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload your photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfile({ photoUri: result.assets[0].uri });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

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

  function saveEdit() {
    setProfile({ name: editName.trim(), bio: editBio.trim() });
    setEditModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const avatarColor = AVATAR_COLORS[level % AVATAR_COLORS.length];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={pickProfilePhoto} style={styles.avatarWrap} activeOpacity={0.8}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor + "30", borderColor: avatarColor }]}>
              <Text style={[styles.avatarInitials, { color: avatarColor }]}>
                {profile.name ? getInitials(profile.name) : "?"}
              </Text>
            </View>
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.heroInfo}>
          <Text style={[styles.heroName, { color: colors.foreground }]}>
            {profile.name || "Tap to set name"}
          </Text>
          {profile.bio ? (
            <Text style={[styles.heroBio, { color: colors.mutedForeground }]} numberOfLines={2}>
              {profile.bio}
            </Text>
          ) : null}
          <View style={styles.rankRow}>
            <View style={[styles.rankBadge, { backgroundColor: rankInfo.color + "20", borderColor: rankInfo.color }]}>
              <Ionicons name={rankInfo.icon as any} size={14} color={rankInfo.color} />
              <Text style={[styles.rankText, { color: rankInfo.color }]}>
                {rank.rank}
              </Text>
            </View>
            <Text style={[styles.levelText, { color: colors.mutedForeground }]}>
              Level {level}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setEditName(profile.name);
            setEditBio(profile.bio);
            setEditModal(true);
          }}
          style={[styles.editBtn, { backgroundColor: colors.secondary }]}
        >
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.xpSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.xpHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>XP Progress</Text>
          <Text style={[styles.xpNumbers, { color: colors.xp }]}>
            {xp % XP_PER_LEVEL} / {XP_PER_LEVEL}
          </Text>
        </View>
        <View style={[styles.xpBarBg, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.xpBarFill,
              {
                width: `${Math.min(progressPct, 100)}%` as `${number}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
        {nextRank && (
          <Text style={[styles.nextRank, { color: colors.mutedForeground }]}>
            Next rank: <Text style={{ color: nextRank.color }}>{nextRank.rank}</Text> at Level {nextRank.level}
          </Text>
        )}
        <Text style={[styles.totalXp, { color: colors.mutedForeground }]}>
          {xp} total XP earned
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="checkbox-marked-circle-outline" value={totalHabits.toString()} label="Habits Done" color={colors.primary} />
        <StatCard icon="dumbbell" value={totalWorkouts.toString()} label="Workouts" color={colors.accent} />
        <StatCard icon="trophy-outline" value={`${unlockedCount}/${achievements.length}`} label="Achievements" color={colors.gold} />
        <StatCard icon="account-group" value={friends.length.toString()} label="Friends" color={colors.success} />
      </View>

      {fitnessProfile.weight && fitnessProfile.height && (
        <View style={[styles.statsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Body Stats</Text>
          <View style={styles.bodyRow}>
            <View style={styles.bodyStat}>
              <Text style={[styles.bodyVal, { color: colors.foreground }]}>
                {fitnessProfile.weight} kg
              </Text>
              <Text style={[styles.bodyLabel, { color: colors.mutedForeground }]}>Weight</Text>
            </View>
            <View style={[styles.bodyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.bodyStat}>
              <Text style={[styles.bodyVal, { color: colors.foreground }]}>
                {fitnessProfile.height} cm
              </Text>
              <Text style={[styles.bodyLabel, { color: colors.mutedForeground }]}>Height</Text>
            </View>
            <View style={[styles.bodyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.bodyStat}>
              <Text style={[styles.bodyVal, { color: bmi && bmi < 25 ? colors.success : colors.warning }]}>
                {bmi ? bmi.toFixed(1) : "--"}
              </Text>
              <Text style={[styles.bodyLabel, { color: colors.mutedForeground }]}>BMI</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.progressSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
              <TouchableOpacity
                key={idx}
                onPress={() => setProgressModal(true)}
                style={{ marginRight: 10 }}
              >
                <Image source={{ uri }} style={styles.progressThumb} />
                <Text style={[styles.photoDate, { color: colors.mutedForeground }]}>
                  Photo {idx + 1}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={addProgressPhoto}
              style={[styles.addPhotoThumb, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="add" size={28} color={colors.mutedForeground} />
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <View style={[styles.rankSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Rank Progression</Text>
        {RANK_THRESHOLDS.map((r, idx) => {
          const isCurrentRank = rank.rank === r.rank;
          const isUnlocked = level >= r.level;
          return (
            <View key={r.rank} style={styles.rankItem}>
              <View style={[styles.rankIconWrap, { backgroundColor: isUnlocked ? r.color + "20" : colors.secondary }]}>
                <Ionicons name={r.icon as any} size={18} color={isUnlocked ? r.color : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankName, { color: isUnlocked ? colors.foreground : colors.mutedForeground }]}>
                  {r.rank}
                </Text>
                <Text style={[styles.rankLevel, { color: colors.mutedForeground }]}>
                  Level {r.level}+
                </Text>
              </View>
              {isCurrentRank && (
                <View style={[styles.currentBadge, { backgroundColor: r.color + "20" }]}>
                  <Text style={[styles.currentBadgeText, { color: r.color }]}>Current</Text>
                </View>
              )}
              {!isCurrentRank && isUnlocked && (
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              )}
              {!isUnlocked && (
                <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
              )}
            </View>
          );
        })}
      </View>

      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setEditModal(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 40 }]}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Edit Profile</Text>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Your name..."
            placeholderTextColor={colors.mutedForeground}
            maxLength={30}
          />
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Bio</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, height: 80 }]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Tell your story..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={120}
          />
          <TouchableOpacity onPress={saveEdit} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  heroBio: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  rankText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  levelText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  xpSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  xpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  xpNumbers: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  xpBarBg: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  xpBarFill: { height: 8, borderRadius: 4 },
  nextRank: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  totalXp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    width: "47%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  bodyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 12 },
  bodyStat: { alignItems: "center", flex: 1 },
  bodyVal: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bodyLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  bodyDivider: { width: 1, height: 40 },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addPhotoBtnText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptyPhotos: {
    height: 100,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  emptyPhotosText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressThumb: { width: 90, height: 120, borderRadius: 12 },
  photoDate: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
  addPhotoThumb: {
    width: 90,
    height: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rankSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  rankItem: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  rankIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rankName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  rankLevel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1 },
  sheetTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 16 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 14 },
  saveBtn: { padding: 14, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
