import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  Layout, 
  SlideInUp,
} from "react-native-reanimated";

import { useApp, getRankForLevel, type Friend } from "@/context/AppContext";
import { auth, db } from "@/lib/firebase";
import { useTheme } from "@/hooks/useTheme";
import { CrystalCard } from "@/components/CrystalCard";

const { width } = Dimensions.get("window");
const AVATAR_COLORS = ["#818CF8", "#F43F5E", "#F59E0B", "#10D9A0", "#00D9F5", "#C084FC", "#F97316"];

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  stay_fit: "Stay Fit",
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 280 },
  leaderboardContainer: { marginBottom: 30 },
  lbHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, paddingHorizontal: 4 },
  lbHeaderIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(245, 158, 11, 0.1)", alignItems: "center", justifyContent: "center" },
  leaderboardTitle: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_800ExtraBold", letterSpacing: -0.5 },
  
  // Podium Styles
  podiumRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", height: 260, marginBottom: 10, marginTop: 24 },
  podiumColumn: { flex: 1, alignItems: "center" },
  podiumAvatarWrap: { position: "relative", marginBottom: 10, alignItems: "center" },
  crown: { position: "absolute", top: -14, zIndex: 10 },
  podiumAvatar: { width: 64, height: 64, borderRadius: 24, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  podiumAvatarText: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  badge: { position: "absolute", bottom: -5, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  podiumName: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 2, textAlign: "center", width: "100%" },
  podiumXp: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  pillarContainer: {
    width: "100%",
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  pillar: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillarGlow: {
    position: 'absolute',
    bottom: -20,
    left: '10%',
    right: '10%',
    height: 40,
    borderRadius: 20,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  podiumBase: { width: "85%", borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: "center", paddingTop: 12 },
  podiumLevel: { fontSize: 10, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },

  remainingCard: { padding: 8, marginTop: 10 },
  lbRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  lbRankNum: { width: 20, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  miniAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  lbName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  lbRight: { alignItems: "flex-end" },
  lbXp: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  lbXpLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  aloneState: { alignItems: "center", paddingVertical: 20 },
  aloneText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", opacity: 0.8 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 10, paddingHorizontal: 4 },
  sectionLabel: { fontSize: 13, fontWeight: "800", fontFamily: "Inter_800ExtraBold", letterSpacing: 1.5 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: "700" },

  card: { flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 14, gap: 4 },
  avatarContainer: { position: "relative" },
  avatarGlow: { position: "absolute", top: -4, left: -4, right: -4, bottom: -4, borderRadius: 22, opacity: 0.3 },
  avatar: { width: 60, height: 60, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  friendName: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold", maxWidth: "70%" },
  rankBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rankText: { fontSize: 10, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  friendGoal: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  statsRow: { flexDirection: "row", gap: 16 },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  miniStatVal: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  deleteBtn: { padding: 10, marginLeft: "auto" },

  addFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 24,
    gap: 14,
  },
  addFriendIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  addFriendSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  sheetContainer: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "90%" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12 },
  sheetHeader: { alignItems: "center", marginBottom: 24 },
  knob: { width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(128,128,128,0.3)", marginBottom: 16 },
  sheetTitle: { fontSize: 24, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 8 },
  sheetSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", opacity: 0.7, paddingHorizontal: 20 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 8, letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderRadius: 16, padding: 14, fontSize: 16, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  
  goalRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  goalBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, alignItems: "center", borderWidth: 1.5, gap: 6 },
  goalLabel: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  
  searchBtn: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  resultCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 12 },
  resultName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultMeta: { fontSize: 12, fontFamily: "Inter_400Regular", opacity: 0.8 },

  addBtn: { padding: 16, borderRadius: 18, alignItems: "center", marginBottom: 20 },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, opacity: 0.7, marginBottom: 30 },
  emptyAddBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyAddBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});

function FriendCard({ friend, onDelete, index }: { friend: Friend; onDelete: () => void; index: number }) {
  const colors = useTheme();
  const rank = getRankForLevel(friend.level);
  const avatarColor = friend.avatarColor || AVATAR_COLORS[0];

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
    >
      <CrystalCard style={styles.card}>
        <View style={[styles.avatarContainer]}>
          <LinearGradient
            colors={[avatarColor, avatarColor + "80"]}
            style={styles.avatarGlow}
          />
          <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: avatarColor }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {friend.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.friendName, { color: colors.foreground }]} numberOfLines={1}>
              {friend.name}
            </Text>
            <View style={[styles.rankBadge, { backgroundColor: avatarColor + "15" }]}>
              <Text style={[styles.rankText, { color: avatarColor }]}>{rank.rank}</Text>
            </View>
            {friend.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={16} color="#0EA5E9" style={{ marginLeft: 2 }} title="Verified User" />
            )}
          </View>
          
          <Text style={[styles.friendGoal, { color: colors.mutedForeground }]}>
            {GOAL_LABELS[friend.goal] || friend.goal} • Level {friend.level}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={14} color={colors.primary} />
              <Text style={[styles.miniStatVal, { color: colors.foreground }]}>{friend.habitsCompleted}</Text>
            </View>
            <View style={styles.miniStat}>
              <MaterialCommunityIcons name="dumbbell" size={14} color={colors.accent} />
              <Text style={[styles.miniStatVal, { color: colors.foreground }]}>{friend.workoutsCompleted}</Text>
            </View>
            <View style={styles.miniStat}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color="#F59E0B" />
              <Text style={[styles.miniStatVal, { color: colors.foreground }]}>{friend.xp} XP</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete();
          }} 
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </CrystalCard>
    </Animated.View>
  );
}

function PodiumItem({ entry, rank }: { entry: any; rank: number }) {
  const colors = useTheme();
  const isMe = entry.isMe;
  const avatarColor = isMe ? colors.primary : (entry.avatarColor || AVATAR_COLORS[rank % AVATAR_COLORS.length]);
  
  const currentHeight = rank === 1 ? 160 : rank === 2 ? 120 : 90;
  const scale = rank === 1 ? 1.05 : 1;

  return (
    <Animated.View 
      entering={FadeInDown.delay(rank * 150).springify().damping(12)}
      style={[styles.podiumColumn, { transform: [{ scale }] }]}
    >
      <View style={styles.podiumAvatarWrap}>
        {rank === 1 && (
          <Animated.View entering={SlideInUp.delay(600)} style={styles.crown}>
            <Ionicons name="trophy" size={26} color="#FFD700" />
          </Animated.View>
        )}
        <View style={[styles.podiumAvatar, { borderColor: avatarColor, backgroundColor: avatarColor + "20" }]}>
          <Text style={[styles.podiumAvatarText, { color: avatarColor }]}>
            {entry.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
          </Text>
        </View>
        <LinearGradient
          colors={rank === 1 ? ["#FFD700", "#FFA500"] : rank === 2 ? ["#E2E2E2", "#A0A0A0"] : ["#CD7F32", "#8B4513"]}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{rank}</Text>
        </LinearGradient>
      </View>
      
      <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>
        {isMe ? "You" : entry.name}
        {entry.isVerified && (
          <MaterialCommunityIcons name="check-decagram" size={12} color="#0EA5E9" style={{ marginLeft: 2 }} />
        )}
      </Text>
      <View style={styles.xpBadge}>
        <MaterialCommunityIcons name="lightning-bolt" size={12} color={colors.primary} />
        <Text style={[styles.podiumXp, { color: colors.primary }]}>{entry.xp}</Text>
      </View>

      <View style={[styles.pillarContainer, { height: currentHeight }]}>
        <LinearGradient
          colors={[avatarColor + "40", avatarColor + "05"]}
          style={[styles.pillar, { borderRadius: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }]}
        />
        <View style={[styles.pillarGlow, { backgroundColor: avatarColor, opacity: 0.15 }]} />
      </View>
    </Animated.View>
  );
}

function Leaderboard({ myData }: { myData: any }) {
  const colors = useTheme();
  const { friends } = useApp();

  const allEntries = useMemo(() => {
    return [
      { ...myData, isMe: true, avatarColor: colors.primary },
      ...friends.map((f) => ({ ...f, isMe: false })),
    ].sort((a, b) => b.xp - a.xp);
  }, [friends, myData, colors.primary]);

  const top3 = allEntries.slice(0, 3);
  const remaining = allEntries.slice(3);

  const podiumOrder = useMemo(() => {
    if (top3.length === 1) return [null, top3[0], null];
    if (top3.length === 2) return [top3[1], top3[0], null];
    return [top3[1], top3[0], top3[2]];
  }, [top3]);

  return (
    <View style={styles.leaderboardContainer}>
      <View style={styles.lbHeader}>
        <View style={styles.lbHeaderIcon}>
          <MaterialCommunityIcons name="trophy-variant" size={20} color="#F59E0B" />
        </View>
        <Text style={[styles.leaderboardTitle, { color: colors.foreground }]}>Global Standings</Text>
      </View>

      <View style={styles.podiumRow}>
        {podiumOrder.map((entry, idx) => {
          if (!entry) return <View key={`empty-${idx}`} style={styles.podiumColumn} />;
          const rank = entry === top3[0] ? 1 : entry === top3[1] ? 2 : 3;
          return <PodiumItem key={entry.name + rank} entry={entry} rank={rank} />;
        })}
      </View>

      {remaining.length > 0 && (
        <CrystalCard style={styles.remainingCard}>
          {remaining.map((entry, idx) => {
            const actualRank = idx + 4;
            return (
              <View key={entry.name + actualRank} style={[styles.lbRow, idx !== 0 && { borderTopWidth: 1, borderTopColor: colors.border + "40" }]}>
                <Text style={[styles.lbRankNum, { color: colors.mutedForeground }]}>{actualRank}</Text>
                <View style={[styles.miniAvatar, { backgroundColor: (entry.avatarColor || AVATAR_COLORS[0]) + "20" }]}>
                   <Text style={{ color: entry.avatarColor || AVATAR_COLORS[0], fontSize: 10, fontWeight: "700" }}>
                     {entry.name[0].toUpperCase()}
                   </Text>
                </View>
                <Text style={[styles.lbName, { color: entry.isMe ? colors.primary : colors.foreground }]} numberOfLines={1}>
                  {entry.name}{entry.isMe ? " (You)" : ""}
                  {entry.isVerified && (
                    <MaterialCommunityIcons name="check-decagram" size={12} color="#0EA5E9" style={{ marginLeft: 2 }} />
                  )}
                </Text>
                <View style={styles.lbRight}>
                  <Text style={[styles.lbXp, { color: colors.foreground }]}>{entry.xp}</Text>
                  <Text style={[styles.lbXpLabel, { color: colors.mutedForeground }]}>XP</Text>
                </View>
              </View>
            );
          })}
        </CrystalCard>
      )}

      {allEntries.length === 1 && (
        <View style={styles.aloneState}>
          <Text style={[styles.aloneText, { color: colors.mutedForeground }]}>
            It's a bit quiet here... Add friends to see how you rank!
          </Text>
        </View>
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useTheme();
  const { friends, addFriend, deleteFriend, xp, level, profile, getTotalHabitsCompleted, getTotalWorkoutsCompleted } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  async function handleSearch() {
    const q = searchQuery.trim();
    setIsSearching(true);
    try {
      let snapshotByEmail;
      if (q.includes("@")) {
        snapshotByEmail = await db.collection("users")
          .where("email", "==", q)
          .get();
      }
      
      const snapshotByName = await db.collection("users")
        .where("name", "==", q)
        .limit(5)
        .get();
      
      const emailResults = snapshotByEmail ? snapshotByEmail.docs : [];
      const nameResults = snapshotByName.docs;

      const combined = [...emailResults, ...nameResults];
      const seen = new Set();
      const results = combined.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return u.id !== auth.currentUser?.uid;
      });
      
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("Invalid user");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError("There was a problem searching for users.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddVerified(user: any) {
    addFriend({
      name: user.name,
      level: user.level || 1,
      xp: user.xp || 0,
      rank: getRankForLevel(user.level || 1).rank,
      habitsCompleted: user.habitsCompleted || 0,
      workoutsCompleted: user.workoutsCompleted || 0,
      goal: user.goal || "stay_fit",
      avatarColor: AVATAR_COLORS[friends.length % AVATAR_COLORS.length],
      isVerified: true
    });
    setModalVisible(false);
    setSearchQuery("");
    setSearchResults([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const GOALS = [
    { key: "lose_weight", label: "Lose Weight", icon: "scale-bathroom" },
    { key: "build_muscle", label: "Build Muscle", icon: "arm-flex" },
    { key: "stay_fit", label: "Stay Fit", icon: "heart-pulse" },
  ];



  function handleDelete(id: string) {
    Alert.alert("Remove Friend", "Are you sure you want to remove this friend from your circle?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Remove", 
        style: "destructive", 
        onPress: () => {
          deleteFriend(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } 
      },
    ]);
  }

  const myData = useMemo(() => ({
    name: profile.name || "User",
    xp,
    level,
    habitsCompleted: getTotalHabitsCompleted(),
    workoutsCompleted: getTotalWorkoutsCompleted()
  }), [profile.name, xp, level]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Leaderboard myData={myData} />
            
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
              style={[styles.addFriendButton, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
            >
              <View style={[styles.addFriendIconBox, { backgroundColor: colors.primary }]}>
                <Ionicons name="person-add" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addFriendTitle, { color: colors.foreground }]}>Find Friends</Text>
                <Text style={[styles.addFriendSubtitle, { color: colors.mutedForeground }]}>Find and follow more champions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                MY FRIENDS
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>{friends.length}</Text>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <FriendCard 
            friend={item} 
            index={index}
            onDelete={() => handleDelete(item.id)} 
          />
        )}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(400)} style={styles.empty}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + "10" }]}>
              <MaterialCommunityIcons name="account-group" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Friends Yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Fitness is better together. Add your friends to track each other's progress and stay motivated.
            </Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyAddBtnText}>Add your first friend</Text>
            </TouchableOpacity>
          </Animated.View>
        }
      />


      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView 
            style={[styles.sheet, { backgroundColor: colors.card }]} 
            contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 60 : 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.knob} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Find Verified Users</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                Search by exact name to add friends.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>SEARCH NAME</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput 
                  style={[styles.input, { flex: 1, backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} 
                  placeholder="Name or email..." 
                  placeholderTextColor={colors.mutedForeground} 
                  value={searchQuery} 
                  onChangeText={(t) => { setSearchQuery(t); setSearchError(""); setSearchResults([]); }} 
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity 
                   onPress={handleSearch}
                   disabled={isSearching}
                   style={[styles.searchBtn, { backgroundColor: colors.primary, opacity: isSearching ? 0.6 : 1 }]}
                >
                   {isSearching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
              {searchError ? (
                <Animated.View entering={FadeInDown.duration(200)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 4 }}>
                  <Ionicons name="person-remove-outline" size={15} color="#F43F5E" />
                  <Text style={{ color: "#F43F5E", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 }}>{searchError}</Text>
                </Animated.View>
              ) : null}
            </View>

            {searchResults.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>RESULTS</Text>
                {searchResults.map((user) => (
                  <TouchableOpacity 
                    key={user.id} 
                    onPress={() => handleAddVerified(user)}
                    style={[styles.resultCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <View style={[styles.miniAvatar, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={{ color: colors.primary, fontWeight: "700" }}>{user.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: colors.foreground }]}>{user.name}</Text>
                      <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>Level {user.level || 1} • Verified</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
