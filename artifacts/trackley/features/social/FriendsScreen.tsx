import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
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

import { useApp, getRankForLevel, type Friend } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const AVATAR_COLORS = ["#818CF8", "#F43F5E", "#F59E0B", "#10D9A0", "#00D9F5", "#C084FC", "#F97316"];

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  stay_fit: "Stay Fit",
};

function FriendCard({ friend, onDelete }: { friend: Friend; onDelete: () => void }) {
  const colors = useColors();
  const rank = getRankForLevel(friend.level);
  const avatarColor = friend.avatarColor || AVATAR_COLORS[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor + "20", borderColor: avatarColor }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>
          {friend.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.friendName, { color: colors.foreground }]} numberOfLines={1}>{friend.name}</Text>
          <View style={[styles.rankBadge, { backgroundColor: avatarColor + "20" }]}>
            <Text style={[styles.rankText, { color: avatarColor }]}>{rank.rank}</Text>
          </View>
        </View>
        <Text style={[styles.friendGoal, { color: colors.mutedForeground }]}>
          {GOAL_LABELS[friend.goal] || friend.goal} · Level {friend.level}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={12} color={colors.primary} />
            <Text style={[styles.miniStatVal, { color: colors.foreground }]}>{friend.habitsCompleted}</Text>
          </View>
          <View style={styles.miniStat}>
            <MaterialCommunityIcons name="dumbbell" size={12} color={colors.accent} />
            <Text style={[styles.miniStatVal, { color: colors.foreground }]}>{friend.workoutsCompleted}</Text>
          </View>
          <View style={styles.miniStat}>
            <MaterialCommunityIcons name="star" size={12} color={colors.xp} />
            <Text style={[styles.miniStatVal, { color: colors.foreground }]}>{friend.xp} XP</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} style={{ padding: 6 }}>
        <Ionicons name="trash-outline" size={16} color={colors.destructive} />
      </TouchableOpacity>
    </View>
  );
}

function Leaderboard({ myData }: { myData: { name: string; xp: number; level: number; habitsCompleted: number; workoutsCompleted: number } }) {
  const colors = useColors();
  const { friends } = useApp();

  const allEntries = [
    { name: myData.name || "You", xp: myData.xp, level: myData.level, habitsCompleted: myData.habitsCompleted, workoutsCompleted: myData.workoutsCompleted, isMe: true },
    ...friends.map((f) => ({ name: f.name, xp: f.xp, level: f.level, habitsCompleted: f.habitsCompleted, workoutsCompleted: f.workoutsCompleted, isMe: false })),
  ].sort((a, b) => b.xp - a.xp);

  const medalColors = ["#F59E0B", "#9CA3AF", "#CD7C2F"];

  return (
    <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.leaderboardTitle, { color: colors.foreground }]}>Leaderboard</Text>
      {allEntries.map((entry, idx) => (
        <View key={entry.name + idx} style={[styles.lbRow, { backgroundColor: entry.isMe ? colors.primary + "10" : "transparent" }]}>
          <View style={styles.lbRank}>
            {idx < 3 ? (
              <MaterialCommunityIcons name="medal" size={20} color={medalColors[idx] ?? colors.mutedForeground} />
            ) : (
              <Text style={[styles.lbRankNum, { color: colors.mutedForeground }]}>#{idx + 1}</Text>
            )}
          </View>
          <Text style={[styles.lbName, { color: entry.isMe ? colors.primary : colors.foreground }]} numberOfLines={1}>
            {entry.name}{entry.isMe ? " (You)" : ""}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.lbXp, { color: colors.xp }]}>{entry.xp} XP</Text>
          <Text style={[styles.lbLevel, { color: colors.mutedForeground }]}>Lv.{entry.level}</Text>
        </View>
      ))}
      {allEntries.length <= 1 && (
        <Text style={[styles.emptyLb, { color: colors.mutedForeground }]}>Add friends to compete on the leaderboard!</Text>
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useColors();
  const { friends, addFriend, deleteFriend, xp, level, profile, getTotalHabitsCompleted, getTotalWorkoutsCompleted } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [friendLevel, setFriendLevel] = useState("1");
  const [friendXp, setFriendXp] = useState("0");
  const [friendHabits, setFriendHabits] = useState("0");
  const [friendWorkouts, setFriendWorkouts] = useState("0");
  const [friendGoal, setFriendGoal] = useState("stay_fit");

  const GOALS = [
    { key: "lose_weight", label: "Lose Weight" },
    { key: "build_muscle", label: "Build Muscle" },
    { key: "stay_fit", label: "Stay Fit" },
  ];

  function handleAdd() {
    if (!name.trim()) return;
    addFriend({
      name: name.trim(),
      level: parseInt(friendLevel, 10) || 1,
      xp: parseInt(friendXp, 10) || 0,
      rank: getRankForLevel(parseInt(friendLevel, 10) || 1).rank,
      habitsCompleted: parseInt(friendHabits, 10) || 0,
      workoutsCompleted: parseInt(friendWorkouts, 10) || 0,
      goal: friendGoal,
      avatarColor: AVATAR_COLORS[friends.length % AVATAR_COLORS.length],
    });
    setName(""); setFriendLevel("1"); setFriendXp("0"); setFriendHabits("0"); setFriendWorkouts("0");
    setModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleDelete(id: string) {
    Alert.alert("Remove Friend", "Remove this friend?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteFriend(id) },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        ListHeaderComponent={
          <>
            <Leaderboard myData={{ name: profile.name, xp, level, habitsCompleted: getTotalHabitsCompleted(), workoutsCompleted: getTotalWorkoutsCompleted() }} />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {friends.length} Friend{friends.length !== 1 ? "s" : ""}
            </Text>
          </>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <FriendCard friend={item} onDelete={() => handleDelete(item.id)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No friends yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add friends to compare progress and compete on the leaderboard.
            </Text>
          </View>
        }
      />

      <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <ScrollView style={[styles.sheet, { backgroundColor: colors.card }]} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 40 }}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Friend</Text>
          <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
            Add a friend and manually enter their current stats to track and compare progress.
          </Text>
          <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} placeholder="Friend's name..." placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Their Level</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={friendLevel} onChangeText={setFriendLevel} keyboardType="numeric" placeholder="1" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Their XP</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={friendXp} onChangeText={setFriendXp} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Habits Done</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={friendHabits} onChangeText={setFriendHabits} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Workouts Done</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} value={friendWorkouts} onChangeText={setFriendWorkouts} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Their Goal</Text>
          <View style={styles.goalRow}>
            {GOALS.map((g) => (
              <TouchableOpacity key={g.key} onPress={() => setFriendGoal(g.key)} style={[styles.goalBtn, { backgroundColor: friendGoal === g.key ? colors.primary + "25" : colors.secondary, borderColor: friendGoal === g.key ? colors.primary : "transparent", borderWidth: 1 }]}>
                <Text style={[styles.goalLabel, { color: friendGoal === g.key ? colors.primary : colors.mutedForeground }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>Add Friend</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  leaderboard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  leaderboardTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 14 },
  lbRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4 },
  lbRank: { width: 28, alignItems: "center" },
  lbRankNum: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  lbName: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  lbXp: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginRight: 8 },
  lbLevel: { fontSize: 12, fontFamily: "Inter_400Regular", minWidth: 36, textAlign: "right" },
  emptyLb: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, marginBottom: 10, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  friendName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", flex: 1 },
  rankBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  rankText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  friendGoal: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  statsRow: { flexDirection: "row", gap: 14 },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  miniStatVal: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  fab: { position: "absolute", bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#818CF8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "transparent", paddingHorizontal: 20, paddingTop: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 6 },
  sheetSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 12 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 },
  goalRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  goalBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  goalLabel: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  addBtn: { padding: 14, borderRadius: 12, alignItems: "center", marginTop: 4 },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
