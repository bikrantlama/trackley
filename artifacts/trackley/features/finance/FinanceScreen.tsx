import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
} from "react-native";

import { useApp, type Group } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const EXPENSE_CATEGORIES = ["Food", "Transport", "Health", "Education", "Entertainment", "Bills", "Shopping", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Business", "Gift", "Investment", "Other"];

function PersonalTab() {
  const colors = useColors();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete", "Remove this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  }

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Net Balance</Text>
        <Text style={[styles.balanceAmount, { color: balance >= 0 ? colors.success : colors.destructive }]}>
          {balance >= 0 ? "+" : ""}₨{Math.abs(balance).toLocaleString("ne-NP")}
        </Text>
        <View style={styles.inOutRow}>
          <View style={styles.inOutItem}>
            <Ionicons name="arrow-down-circle" size={14} color={colors.success} />
            <Text style={[styles.inOutLabel, { color: colors.mutedForeground }]}>Income</Text>
            <Text style={[styles.inOutVal, { color: colors.success }]}>
              ₨{totalIncome.toLocaleString("ne-NP")}
            </Text>
          </View>
          <View style={[styles.inOutDivider, { backgroundColor: colors.border }]} />
          <View style={styles.inOutItem}>
            <Ionicons name="arrow-up-circle" size={14} color={colors.destructive} />
            <Text style={[styles.inOutLabel, { color: colors.mutedForeground }]}>Spent</Text>
            <Text style={[styles.inOutVal, { color: colors.destructive }]}>
              ₨{totalExpense.toLocaleString("ne-NP")}
            </Text>
          </View>
        </View>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bank-outline" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.txIcon, { backgroundColor: item.type === "income" ? colors.success + "20" : colors.destructive + "20" }]}>
                <Ionicons name={item.type === "income" ? "arrow-down-circle" : "arrow-up-circle"} size={20} color={item.type === "income" ? colors.success : colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txLabel, { color: colors.foreground }]} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.txMeta, { color: colors.mutedForeground }]}>
                  {item.category} · {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.txAmt, { color: item.type === "income" ? colors.success : colors.destructive }]}>
                {item.type === "income" ? "+" : "-"}₨{item.amount.toLocaleString("ne-NP")}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 40 }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Transaction</Text>
            <View style={styles.typeRow}>
              {(["expense", "income"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setType(t); setCategory("Other"); }}
                  style={[styles.typeBtn, { backgroundColor: type === t ? (t === "income" ? colors.success + "25" : colors.destructive + "25") : colors.secondary, borderColor: type === t ? (t === "income" ? colors.success : colors.destructive) : "transparent" }]}
                >
                  <Text style={[styles.typeBtnText, { color: type === t ? (t === "income" ? colors.success : colors.destructive) : colors.mutedForeground }]}>
                    {t === "income" ? "Income" : "Expense"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Label..." placeholderTextColor={colors.mutedForeground} value={label} onChangeText={setLabel}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Amount (₨)" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
            />
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.catChip, { backgroundColor: category === c ? colors.primary + "25" : colors.secondary, borderColor: category === c ? colors.primary : "transparent" }]}
                >
                  <Text style={[styles.catChipText, { color: category === c ? colors.primary : colors.mutedForeground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function GroupDetailScreen({ group, onBack }: { group: Group; onBack: () => void }) {
  const colors = useColors();
  const { addGroupMember, addBill, getNetOwed } = useApp();
  const [memberName, setMemberName] = useState("");
  const [showBillModal, setShowBillModal] = useState(false);
  const [billDesc, setBillDesc] = useState("");
  const [billTotal, setBillTotal] = useState("");
  const [billPaidBy, setBillPaidBy] = useState<string>("");
  const [splitType, setSplitType] = useState<"equal" | "percentage">("equal");
  const owed = getNetOwed(group.id);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        <Text style={[styles.backLabel, { color: colors.foreground }]}>Groups</Text>
      </TouchableOpacity>
      <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Members</Text>
        {group.members.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.memberAvatarText, { color: colors.primary }]}>{m.name[0]?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.memberName, { color: colors.foreground }]}>{m.name}</Text>
          </View>
        ))}
        <View style={styles.addMemberRow}>
          <TextInput
            style={[styles.memberInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
            value={memberName} onChangeText={setMemberName} placeholder="Add member..." placeholderTextColor={colors.mutedForeground}
          />
          <TouchableOpacity onPress={handleAddMember} style={[styles.memberAddBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {owed.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Who Owes Whom</Text>
          {owed.map((item, idx) => (
            <View key={idx} style={[styles.owedRow, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.owedFrom, { color: colors.destructive }]}>{item.from}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
              <Text style={[styles.owedTo, { color: colors.success }]}>{item.to}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.owedAmt, { color: colors.warning }]}>₨{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.billsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bills</Text>
          <TouchableOpacity
            onPress={() => { if (group.members.length < 2) { Alert.alert("Need members", "Add at least 2 members first."); return; } setBillPaidBy(group.members[0]?.id ?? ""); setShowBillModal(true); }}
            style={[styles.addBillBtn, { backgroundColor: colors.primary + "20" }]}
          >
            <Text style={[styles.addBillText, { color: colors.primary }]}>+ Add Bill</Text>
          </TouchableOpacity>
        </View>
        {group.bills.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No bills yet</Text>
        ) : (
          group.bills.map((bill) => {
            const paidByMember = group.members.find((m) => m.id === bill.paidBy);
            return (
              <View key={bill.id} style={[styles.billRow, { backgroundColor: colors.secondary }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.billDesc, { color: colors.foreground }]} numberOfLines={1}>{bill.description}</Text>
                  <Text style={[styles.billMeta, { color: colors.mutedForeground }]}>Paid by {paidByMember?.name ?? "?"} · {bill.splitType}</Text>
                </View>
                <Text style={[styles.billAmt, { color: colors.warning }]}>₨{bill.total.toLocaleString("ne-NP")}</Text>
              </View>
            );
          })
        )}
      </View>

      <Modal visible={showBillModal} transparent animationType="slide" onRequestClose={() => setShowBillModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowBillModal(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: 40 }]}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Bill</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} placeholder="Description..." placeholderTextColor={colors.mutedForeground} value={billDesc} onChangeText={setBillDesc} />
          <TextInput style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]} placeholder="Total (₨)" placeholderTextColor={colors.mutedForeground} value={billTotal} onChangeText={setBillTotal} keyboardType="decimal-pad" />
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Paid by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {group.members.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => setBillPaidBy(m.id)} style={[styles.catChip, { backgroundColor: billPaidBy === m.id ? colors.primary + "30" : colors.secondary, borderColor: billPaidBy === m.id ? colors.primary : "transparent" }]}>
                <Text style={{ color: billPaidBy === m.id ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.typeRow}>
            {(["equal", "percentage"] as const).map((s) => (
              <TouchableOpacity key={s} onPress={() => setSplitType(s)} style={[styles.typeBtn, { backgroundColor: splitType === s ? colors.primary + "25" : colors.secondary, borderColor: splitType === s ? colors.primary : "transparent" }]}>
                <Text style={[styles.typeBtnText, { color: splitType === s ? colors.primary : colors.mutedForeground }]}>{s === "equal" ? "Split Equal" : "By %"}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleAddBill} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.addBtnText}>Add Bill</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

function GroupsTab() {
  const colors = useColors();
  const { groups, addGroup, deleteGroup } = useApp();
  const [newGroup, setNewGroup] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  if (selectedGroup) {
    const live = groups.find((g) => g.id === selectedGroup.id) ?? selectedGroup;
    return <GroupDetailScreen group={live} onBack={() => setSelectedGroup(null)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.newGroupRow}>
        <TextInput
          style={[styles.memberInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, flex: 1 }]}
          placeholder="New group name..." placeholderTextColor={colors.mutedForeground} value={newGroup} onChangeText={setNewGroup}
        />
        <TouchableOpacity
          onPress={() => { if (!newGroup.trim()) return; addGroup(newGroup.trim()); setNewGroup(""); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.memberAddBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {groups.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="account-group-outline" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No groups yet. Create one to split bills.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedGroup(item)} style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} activeOpacity={0.8}>
              <View style={[styles.groupAvatar, { backgroundColor: colors.primary + "20" }]}>
                <MaterialCommunityIcons name="account-group" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupCardName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.groupCardMeta, { color: colors.mutedForeground }]}>{item.members.length} members · {item.bills.length} bills</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              <TouchableOpacity onPress={() => { Alert.alert("Delete Group", `Delete "${item.name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteGroup(item.id) }]); }} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

export default function FinanceScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"personal" | "groups">("personal");
  const TABS = [{ key: "personal" as const, label: "Personal" }, { key: "groups" as const, label: "Group Split" }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tabItem, { backgroundColor: activeTab === t.key ? colors.primary : "transparent", borderRadius: 12 }]}>
            <Text style={[styles.tabLabel, { color: activeTab === t.key ? "#fff" : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === "personal" ? <PersonalTab /> : <GroupsTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: "row", margin: 16, marginBottom: 8, padding: 4, borderRadius: 16, borderWidth: 1 },
  tabItem: { flex: 1, padding: 10, alignItems: "center" },
  tabLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  balanceCard: { margin: 16, marginTop: 8, padding: 20, borderRadius: 20, borderWidth: 1 },
  balanceLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4, textAlign: "center" },
  balanceAmount: { fontSize: 38, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 14 },
  inOutRow: { flexDirection: "row", justifyContent: "space-around" },
  inOutItem: { alignItems: "center", gap: 2 },
  inOutLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  inOutVal: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  inOutDivider: { width: 1, height: 36 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  txRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, marginBottom: 8, gap: 10 },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txLabel: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 2 },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txAmt: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  fab: { position: "absolute", bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#818CF8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1 },
  sheetTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 16 },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  typeBtnText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 12 },
  inputLabel: { fontSize: 12, marginBottom: 6, fontFamily: "Inter_400Regular" },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  catChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  addBtn: { padding: 13, borderRadius: 12, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular" },
  newGroupRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  memberInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  memberAddBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  groupCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, marginBottom: 10, gap: 12 },
  groupAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  groupCardName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  groupCardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 16, paddingBottom: 8 },
  backLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  groupName: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 12 },
  section: { margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 18, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 12 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  memberAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  memberName: { fontSize: 14, fontFamily: "Inter_400Regular" },
  addMemberRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  owedRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, marginBottom: 8 },
  owedFrom: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  owedTo: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  owedAmt: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  billsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  addBillBtn: { padding: 6, borderRadius: 8, paddingHorizontal: 10 },
  addBillText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  billRow: { flexDirection: "row", alignItems: "center", padding: 10, marginBottom: 8, borderRadius: 10, gap: 8 },
  billDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  billMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  billAmt: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
