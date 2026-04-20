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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  useSharedValue
} from "react-native-reanimated";

import { useApp, type Group, type Transaction } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { CrystalCard } from "@/components/CrystalCard";

const { width } = Dimensions.get("window");

const EXPENSE_CATEGORIES = [
  { label: "Food", icon: "food-apple", color: "#F87171" },
  { label: "Transport", icon: "bus", color: "#60A5FA" },
  { label: "Health", icon: "heart-pulse", color: "#34D399" },
  { label: "Education", icon: "school", color: "#818CF8" },
  { label: "Entertainment", icon: "popcorn", color: "#F472B6" },
  { label: "Bills", icon: "receipt", color: "#FBBF24" },
  { label: "Shopping", icon: "cart", color: "#A78BFA" },
  { label: "Other", icon: "dots-horizontal", color: "#9CA3AF" },
];

const INCOME_CATEGORIES = [
  { label: "Salary", icon: "cash-multiple", color: "#10B981" },
  { label: "Freelance", icon: "laptop", color: "#3B82F6" },
  { label: "Business", icon: "briefcase", color: "#8B5CF6" },
  { label: "Gift", icon: "gift", color: "#F43F5E" },
  { label: "Investment", icon: "chart-line", color: "#F59E0B" },
  { label: "Other", icon: "bank", color: "#6B7280" },
];

function CategoryBreakdown({ transactions }: { transactions: any[] }) {
  const colors = useTheme();
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  if (expenses.length === 0 || total === 0) return null;

  const grouped = EXPENSE_CATEGORIES.map((cat) => {
    const amount = expenses.filter((t) => t.category === cat.label).reduce((s, t) => s + t.amount, 0);
    return { ...cat, amount, pct: total > 0 ? (amount / total) * 100 : 0 };
  }).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <View style={[catStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[catStyles.title, { color: colors.foreground }]}>Spending Breakdown</Text>
        {/* Segmented bar */}
        <View style={catStyles.bar}>
          {grouped.map((cat) => (
            <View
              key={cat.label}
              style={{ flex: cat.pct, backgroundColor: cat.color, minWidth: cat.pct > 2 ? 1 : 0 }}
            />
          ))}
        </View>
        {/* Legend */}
        <View style={catStyles.legend}>
          {grouped.slice(0, 5).map((cat) => (
            <View key={cat.label} style={catStyles.legendItem}>
              <View style={[catStyles.dot, { backgroundColor: cat.color }]} />
              <Text style={[catStyles.legendLabel, { color: colors.mutedForeground }]}>{cat.label}</Text>
              <Text style={[catStyles.legendPct, { color: colors.foreground }]}>{cat.pct.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const catStyles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 6, borderRadius: 20, padding: 16, borderWidth: 1.5 },
  title: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 12 },
  bar: { height: 10, borderRadius: 6, flexDirection: "row", overflow: "hidden", marginBottom: 12, gap: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  legendPct: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
});

function TransactionCard({ item, onDelete, index }: { item: Transaction; onDelete: () => void; index: number }) {
  const colors = useTheme();
  const isIncome = item.type === "income";
  const catInfo = (isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find(c => c.label === item.category) || (isIncome ? INCOME_CATEGORIES[5] : EXPENSE_CATEGORIES[7]);

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <CrystalCard style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: catInfo.color + "15" }]}>
          <MaterialCommunityIcons name={catInfo.icon as any} size={22} color={catInfo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.txLabel, { color: colors.foreground }]} numberOfLines={1}>{item.label}</Text>
          <Text style={[styles.txMeta, { color: colors.mutedForeground }]}>
            {item.category} • {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 10 }}>
          <Text style={[styles.txAmt, { color: isIncome ? colors.success : colors.destructive }]}>
            {isIncome ? "+" : "-"}NRS {item.amount.toLocaleString("en-US")}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete();
          }} 
          style={styles.txDelete}
        >
          <Ionicons name="trash-outline" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </CrystalCard>
    </Animated.View>
  );
}

function PersonalTab() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { transactions, addTransaction, deleteTransaction, getBalance } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Other");

  const balance = getBalance();
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  function handleAdd() {
    const num = parseFloat(amount);
    if (!num || !label.trim()) return;
    addTransaction({ type, amount: num, label: label.trim(), category });
    setAmount("");
    setLabel("");
    setCategory("Other");
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete", "Are you sure you want to remove this transaction?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          deleteTransaction(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } 
      },
    ]);
  }

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeInUp.springify()}>
        <LinearGradient
          colors={balance >= 0 ? ["#059669", "#10B981"] : ["#DC2626", "#EF4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCardGrad}
        >
          <View style={styles.balanceCardContent}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <Text 
              style={styles.balanceAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              NRS {Math.abs(balance).toLocaleString("en-US")}
            </Text>
            
            <View style={styles.summaryBar}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="arrow-down-circle" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.summaryTitle}>Income</Text>
                  <Text style={styles.summaryVal}>NRS {totalIncome.toLocaleString("en-US")}</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="arrow-up-circle" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.summaryTitle}>Expense</Text>
                  <Text style={styles.summaryVal}>NRS {totalExpense.toLocaleString("en-US")}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <CategoryBreakdown transactions={transactions} />

      <View style={styles.listHeaderRow}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>Recent Activity</Text>
        <Text style={[styles.listSub, { color: colors.mutedForeground }]}>{transactions.length} items</Text>
      </View>

      {transactions.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.empty}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + "10" }]}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No records yet. Start tracking your wealth.</Text>
        </Animated.View>
      ) : (
        <Animated.View>
        <FlatList
          data={transactions}
          keyExtractor={(t) => t.id}
          contentContainerStyle={[styles.list, { paddingBottom: 150 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TransactionCard 
              item={item} 
              index={index}
              onDelete={() => handleDelete(item.id)} 
            />
          )}
        />
        </Animated.View>
      )}

      <TouchableOpacity 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }} 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetContainer}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.knob} />
            <Text style={[styles.sheetMainTitle, { color: colors.foreground }]}>Log Transaction</Text>
            
            <View style={styles.typeRow}>
              {(["expense", "income"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { 
                    setType(t); 
                    setCategory("Other");
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.typeBtn, 
                    { 
                      backgroundColor: type === t ? (t === "income" ? colors.success : colors.destructive) : colors.secondary,
                      borderColor: type === t ? (t === "income" ? colors.success : colors.destructive) : colors.border
                    }
                  ]}
                >
                  <Text style={[styles.typeBtnText, { color: type === t ? "#fff" : colors.mutedForeground }]}>
                    {t === "income" ? "Income" : "Expense"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputBox}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>WHAT WAS IT FOR?</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Groceries, Gym, Salary" 
                placeholderTextColor={colors.mutedForeground} 
                value={label} 
                onChangeText={setLabel}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>AMOUNT (NRS )</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, fontSize: 24, fontWeight: "700" }]}
                placeholder="0.00" 
                placeholderTextColor={colors.mutedForeground} 
                value={amount} 
                onChangeText={setAmount} 
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.label}
                  onPress={() => {
                    setCategory(c.label);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.catChip, 
                    { 
                      backgroundColor: category === c.label ? colors.primary : colors.secondary,
                      borderColor: category === c.label ? colors.primary : colors.border 
                    }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={c.icon as any} 
                    size={16} 
                    color={category === c.label ? "#fff" : colors.mutedForeground} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.catChipText, { color: category === c.label ? "#fff" : colors.foreground }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function GroupTab() {
  const colors = useTheme();
  const { groups, addGroup, deleteGroup } = useApp();
  const [newGroup, setNewGroup] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  if (selectedGroup) {
    const live = groups.find((g) => g.id === selectedGroup.id) ?? selectedGroup;
    return <GroupDetailScreen group={live} onBack={() => setSelectedGroup(null)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeInDown.springify()} style={styles.groupSearchRow}>
        <TextInput
          style={[styles.groupInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Enter group name..." 
          placeholderTextColor={colors.mutedForeground} 
          value={newGroup} 
          onChangeText={setNewGroup}
          onSubmitEditing={() => {
            if (!newGroup.trim()) return;
            addGroup(newGroup.trim());
            setNewGroup("");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={() => { 
            if (!newGroup.trim()) return; 
            addGroup(newGroup.trim()); 
            setNewGroup(""); 
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
          }}
          style={[styles.groupAddBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.accent + "10" }]}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.accent} />
          </View>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No groups yet. Create one to split bills.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100)}>
              <TouchableOpacity onPress={() => setSelectedGroup(item)} activeOpacity={0.8}>
                <CrystalCard style={styles.groupCard}>
                  <View style={[styles.groupAvatar, { backgroundColor: colors.primary + "15" }]}>
                    <MaterialCommunityIcons name="account-group" size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupCardName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.groupCardMeta, { color: colors.mutedForeground }]}>
                      {item.members.length} members • {item.bills.length} bills
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <TouchableOpacity 
                    onPress={() => { 
                      Alert.alert("Delete Group", `Are you sure you want to delete "${item.name}"?`, [
                        { text: "Cancel", style: "cancel" }, 
                        { 
                          text: "Delete", 
                          style: "destructive", 
                          onPress: () => {
                            deleteGroup(item.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          } 
                        }
                      ]); 
                    }} 
                    style={styles.txDelete}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </CrystalCard>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

function GroupDetailScreen({ group, onBack }: { group: Group; onBack: () => void }) {
  const colors = useTheme();
  const { addGroupMember, addBill, getNetOwed, profile } = useApp();
  const [memberName, setMemberName] = useState("");
  const [showBillModal, setShowBillModal] = useState(false);
  const [billDesc, setBillDesc] = useState("");
  const [billTotal, setBillTotal] = useState("");
  const [billPaidBy, setBillPaidBy] = useState<string>("");
  const [splitType, setSplitType] = useState<"equal" | "percentage">("equal");
  const owed = getNetOwed(group.id);
  
  const myName = profile.name || "Me";
  const myMemberId = group.members.find(m => m.name.toLowerCase() === myName.toLowerCase())?.id;
  
  const totalGroupSpending = group.bills.reduce((sum, b) => sum + b.total, 0);
  const myTotalPaid = group.bills.filter(b => b.paidBy === myMemberId).reduce((sum, b) => sum + b.total, 0);
  
  const memberStats = group.members.map(m => {
    const paid = group.bills.filter(b => b.paidBy === m.id).reduce((sum, b) => sum + b.total, 0);
    const owedAmount = group.bills.reduce((sum, b) => {
      const share = b.splitType === "equal" 
        ? b.total / b.members.length 
        : (b.percentages?.[m.id] || 0) / 100 * b.total;
      return sum + share;
    }, 0);
    return { ...m, paid, owedAmount, balance: paid - owedAmount };
  });

  function handleAddMember() {
    if (!memberName.trim()) return;
    addGroupMember(group.id, memberName.trim());
    setMemberName("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAddBill() {
    const total = parseFloat(billTotal);
    if (!billDesc.trim() || !total || !billPaidBy) return;
    addBill(group.id, { description: billDesc.trim(), total, paidBy: billPaidBy, members: group.members, splitType });
    setBillDesc("");
    setBillTotal("");
    setShowBillModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        <Text style={[styles.backLabel, { color: colors.foreground }]}>Groups</Text>
      </TouchableOpacity>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.groupDetailTitle, { color: colors.foreground }]}>{group.name}</Text>

        {/* Summary Stats */}
        <CrystalCard style={styles.sectionCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>NRS {totalGroupSpending.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Spent</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>NRS {myTotalPaid.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>I Paid</Text>
            </View>
          </View>
        </CrystalCard>

        {/* Member Balances */}
        <CrystalCard style={styles.sectionCard}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Balances</Text>
          {memberStats.map((m) => {
            const isMe = m.id === myMemberId;
            const isPositive = m.balance >= 0;
            return (
              <View key={m.id} style={[styles.balanceRow, { backgroundColor: colors.secondary + "40" }]}>
                <View style={styles.balanceInfo}>
                  <View style={[styles.memberAvatarSmall, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.memberAvatarTextSmall, { color: colors.primary }]}>{m.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[styles.memberNameSmall, { color: colors.foreground }]}>{m.name}{isMe ? " (You)" : ""}</Text>
                    <Text style={[styles.balanceSubtext, { color: colors.mutedForeground }]}>Paid: NRS {m.paid.toLocaleString()}</Text>
                  </View>
                </View>
                <Text style={[styles.balanceAmt, { color: isPositive ? colors.success : colors.destructive }]}>
                  {isPositive ? "+" : ""}NRS {Math.abs(m.balance).toFixed(0)}
                </Text>
              </View>
            );
          })}
        </CrystalCard>

        <CrystalCard style={styles.sectionCard}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Members</Text>
          <View style={styles.membersGrid}>
            {group.members.map((m) => (
              <View key={m.id} style={styles.memberPill}>
                <View style={[styles.memberAvatarSmall, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.memberAvatarTextSmall, { color: colors.primary }]}>{m.name[0]?.toUpperCase()}</Text>
                </View>
                <Text style={[styles.memberNameSmall, { color: colors.foreground }]} numberOfLines={1}>{m.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.addMemberBox}>
            <TextInput
              style={[styles.memberInputSmall, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              value={memberName} 
              onChangeText={setMemberName} 
              placeholder="Add name..." 
              placeholderTextColor={colors.mutedForeground}
            />
            <TouchableOpacity onPress={handleAddMember} style={[styles.memberAddBtnSmall, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </CrystalCard>

        {owed.length > 0 && (
          <CrystalCard style={styles.sectionCard}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Settlements</Text>
            {owed.map((item, idx) => (
              <View key={idx} style={[styles.settleRow, { backgroundColor: colors.secondary + "40" }]}>
                <View style={styles.settleNames}>
                  <Text style={[styles.settleFrom, { color: colors.destructive }]}>{item.from}</Text>
                  <MaterialCommunityIcons name="arrow-right-thick" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.settleTo, { color: colors.success }]}>{item.to}</Text>
                </View>
                <Text style={[styles.settleAmt, { color: colors.foreground }]}>NRS {item.amount.toFixed(0)}</Text>
              </View>
            ))}
          </CrystalCard>
        )}

        <View style={styles.billsSection}>
          <View style={styles.billsHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.foreground, marginBottom: 0 }]}>Spending History</Text>
            <TouchableOpacity
              onPress={() => { 
                if (group.members.length < 2) { 
                  Alert.alert("Add Members First", "Add at least 2 members before splitting bills."); 
                  return; 
                } 
                setBillPaidBy(group.members[0]?.id ?? ""); 
                setShowBillModal(true); 
              }}
              style={[styles.addBillBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBillText}>Add Bill</Text>
            </TouchableOpacity>
          </View>
          
          {group.bills.length === 0 ? (
            <View style={styles.emptySmall}>
              <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>No bills recorded yet.</Text>
            </View>
          ) : (
            group.bills.map((bill, idx) => {
              const paidByMember = group.members.find((m) => m.id === bill.paidBy);
              const isMyPayment = bill.paidBy === myMemberId;
              return (
                <CrystalCard key={bill.id} style={styles.billRow}>
                  <View style={[styles.billIconBox, { backgroundColor: isMyPayment ? colors.success + "15" : colors.accent + "15" }]}>
                    <MaterialCommunityIcons name={isMyPayment ? "cash" : "receipt"} size={22} color={isMyPayment ? colors.success : colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.billDesc, { color: colors.foreground }]} numberOfLines={1}>{bill.description}</Text>
                    <Text style={[styles.billMeta, { color: colors.mutedForeground }]}>
                      {isMyPayment ? "You paid" : `Paid by ${paidByMember?.name ?? "Unknown"}`} • {bill.splitType} split
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.billAmt, { color: colors.foreground }]}>NRS {bill.total.toLocaleString("en-US")}</Text>
                    {isMyPayment && (
                      <View style={[styles.iPaidBadge, { backgroundColor: colors.success + "15" }]}>
                        <Text style={[styles.iPaidText, { color: colors.success }]}>I paid</Text>
                      </View>
                    )}
                  </View>
                </CrystalCard>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={showBillModal} transparent animationType="slide" onRequestClose={() => setShowBillModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowBillModal(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetContainer}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.knob} />
            <Text style={[styles.sheetMainTitle, { color: colors.foreground }]}>Split a Bill</Text>
            
            <View style={styles.inputBox}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>WHAT IS THIS FOR?</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} 
                placeholder="Dinner, Movie, Groceries" 
                placeholderTextColor={colors.mutedForeground} 
                value={billDesc} 
                onChangeText={setBillDesc} 
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>TOTAL AMOUNT (NRS )</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, fontSize: 24, fontWeight: "700" }]} 
                placeholder="0.00" 
                placeholderTextColor={colors.mutedForeground} 
                value={billTotal} 
                onChangeText={setBillTotal} 
                keyboardType="decimal-pad" 
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>WHO PAID?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {group.members.map((m) => (
                <TouchableOpacity 
                  key={m.id} 
                  onPress={() => {
                    setBillPaidBy(m.id);
                    Haptics.selectionAsync();
                  }} 
                  style={[
                    styles.catChip, 
                    { 
                      backgroundColor: billPaidBy === m.id ? colors.primary : colors.secondary,
                      borderColor: billPaidBy === m.id ? colors.primary : colors.border 
                    }
                  ]}
                >
                  <Text style={[styles.catChipText, { color: billPaidBy === m.id ? "#fff" : colors.foreground }]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.splitRow}>
              {(["equal", "percentage"] as const).map((s) => (
                <TouchableOpacity 
                  key={s} 
                  onPress={() => {
                    setSplitType(s);
                    Haptics.selectionAsync();
                  }} 
                  style={[
                    styles.splitBtn, 
                    { 
                      backgroundColor: splitType === s ? colors.primary : colors.secondary,
                      borderColor: splitType === s ? colors.primary : colors.border 
                    }
                  ]}
                >
                  <Text style={[styles.splitBtnText, { color: splitType === s ? "#fff" : colors.mutedForeground }]}>
                    {s === "equal" ? "EQUAL SPLIT" : "PERCENTAGE (%)"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleAddBill} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.addBtnText}>Log & Split Bill</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default function FinanceScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.mainHeader}>
        <Text style={[styles.mainTitle, { color: colors.foreground }]}>Wallet</Text>
        <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => {
              setActiveTab("personal");
              Haptics.selectionAsync();
            }} 
            style={[styles.tabItem, activeTab === "personal" && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === "personal" ? "#fff" : colors.mutedForeground }]}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setActiveTab("group");
              Haptics.selectionAsync();
            }} 
            style={[styles.tabItem, activeTab === "group" && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === "group" ? "#fff" : colors.mutedForeground }]}>Bill Split</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "personal" ? <PersonalTab /> : <GroupTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainHeader: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  mainTitle: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 15 },
  tabContainer: { flexDirection: "row", padding: 4, borderRadius: 16, borderWidth: 1.5 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },

  // Balance Card
  balanceCardGrad: { marginHorizontal: 16, marginVertical: 16, borderRadius: 28, overflow: "hidden", elevation: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  balanceCardContent: { padding: 24 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  balanceAmount: { color: "#fff", fontSize: 42, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 24 },
  summaryBar: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 12 },
  summaryItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  summaryIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  summaryTitle: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700" },
  summaryVal: { color: "#fff", fontSize: 13, fontWeight: "800" },
  summaryDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 15 },

  listHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  listSub: { fontSize: 12, fontWeight: "600" },
  list: { paddingHorizontal: 16 },

  txRow: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 12, gap: 10 },
  txIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txLabel: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 2 },
  txMeta: { fontSize: 11, fontFamily: "Inter_500Medium" },
  txAmt: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  txDelete: { padding: 8, opacity: 0.4 },

  fab: { position: "absolute", bottom: 100, right: 24, width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  
  // Stats & Balances
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statDivider: { width: 1, height: 40 },
  balanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, marginBottom: 8 },
  balanceInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  balanceSubtext: { fontSize: 10, fontFamily: "Inter_400Regular" },
  balanceAmt: { fontSize: 14, fontWeight: "700" },
  iPaidBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  iPaidText: { fontSize: 9, fontWeight: "700" },
  
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  sheetContainer: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "90%" },
  sheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 24, paddingTop: 12, borderWidth: 1, borderBottomWidth: 0 },
  knob: { width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(128,128,128,0.2)", alignSelf: "center", marginBottom: 20 },
  sheetMainTitle: { fontSize: 24, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 20 },
  
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: "center", borderWidth: 2 },
  typeBtnText: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  
  inputBox: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 10, letterSpacing: 1 },
  modalInput: { borderWidth: 1.5, borderRadius: 18, padding: 16, fontSize: 16, fontFamily: "Inter_500Medium" },
  
  catScroll: { marginBottom: 24 },
  catChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1.5 },
  catChipText: { fontSize: 13, fontWeight: "700" },
  
  addBtn: { padding: 18, borderRadius: 20, alignItems: "center", marginBottom: 20 },
  addBtnText: { color: "#fff", fontSize: 17, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyText: { textAlign: "center", fontSize: 16, fontFamily: "Inter_500Medium", opacity: 0.6, lineHeight: 24 },

  // Group Tabs
  groupSearchRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginVertical: 15 },
  groupInput: { flex: 1, borderWidth: 1.5, borderRadius: 18, padding: 14, fontSize: 15, fontFamily: "Inter_500Medium" },
  groupAddBtn: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", elevation: 4, backgroundColor: "#10D9A0" },
  
  groupCard: { flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 14, gap: 12 },
  groupAvatar: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  groupCardName: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_800ExtraBold", marginBottom: 4 },
  groupCardMeta: { fontSize: 12, fontWeight: "600", opacity: 0.6 },

  // Group Detail
  backBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 20, paddingBottom: 5 },
  backLabel: { fontSize: 16, fontWeight: "700" },
  groupDetailTitle: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_800ExtraBold", paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
  
  sectionCard: { marginHorizontal: 16, marginBottom: 20, padding: 20 },
  sectionHeading: { fontSize: 14, fontWeight: "800", letterSpacing: 1.5, marginBottom: 16, textTransform: "uppercase" },
  
  membersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 15 },
  memberPill: { flexDirection: "row", alignItems: "center", gap: 8, padding: 6, paddingRight: 12, backgroundColor: "rgba(128,128,128,0.1)", borderRadius: 16, width: "47%" },
  memberAvatarSmall: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  memberAvatarTextSmall: { fontSize: 14, fontWeight: "800" },
  memberNameSmall: { fontSize: 13, fontWeight: "600", flex: 1 },
  
  addMemberBox: { flexDirection: "row", gap: 10, marginTop: 10 },
  memberInputSmall: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 10, fontSize: 14 },
  memberAddBtnSmall: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  
  settleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 15, borderRadius: 18, marginBottom: 10 },
  settleNames: { flexDirection: "row", alignItems: "center", gap: 10 },
  settleFrom: { fontSize: 14, fontWeight: "800" },
  settleTo: { fontSize: 14, fontWeight: "800" },
  settleAmt: { fontSize: 16, fontWeight: "900" },
  
  billsSection: { paddingHorizontal: 20 },
  billsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  addBillBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  addBillText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  
  billRow: { flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 12, gap: 12 },
  billIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  billDesc: { fontSize: 16, fontWeight: "700" },
  billMeta: { fontSize: 11, fontWeight: "600", marginTop: 3, opacity: 0.6 },
  billAmt: { fontSize: 16, fontWeight: "900" },
  
  emptySmall: { padding: 40, alignItems: "center" },
  emptySmallText: { fontSize: 14, fontWeight: "500" },
  
  splitRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  splitBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: "center", borderWidth: 2 },
  splitBtnText: { fontSize: 11, fontWeight: "800" },
});
