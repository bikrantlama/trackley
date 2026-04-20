import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useApp, BORDER_ITEMS, BOOST_ITEMS } from "@/context/AppContext";
import { THEMES } from "@/constants/themes";
import { useTheme } from "@/hooks/useTheme";
import { CrystalCard } from "@/components/CrystalCard";

const { width } = Dimensions.get("window");

const THEME_STORE_ITEMS = [
  { id: "obsidian", price: 500, description: "Cyberpunk neon vibes for late-night productivity." },
  { id: "emerald", price: 800, description: "Deep forest greens and emerald accents for focus." },
  { id: "rosegold", price: 1000, description: "An elegant, warm palette for a sophisticated touch." },
  { id: "sunset", price: 1200, description: "Vibrant orange and deep reds. Energetic and bold." },
  { id: "galaxy", price: 1800, description: "A deep cosmos of purple, blue and starlight accents." },
  { id: "aurora", price: 2200, description: "The Northern Lights captured in your daily dashboard." },
  { id: "midnightpro", price: 2500, description: "The ultimate OLED black experience. Peak premium." },
  { id: "royalvelvet", price: 3000, description: "A prestigious theme for the elite. Purple and Gold." },
  { id: "liquidglass", price: 100000, description: "Apple-inspired Liquid Glass. The ultimate premium aesthetic. Transcendent clarity.", premium: true },
];

type StoreTab = "themes" | "borders" | "boosts" | "redeem";

function CoinHeader({ coins }: { coins: number }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.headerTag, { color: colors.primary }]}>PREMIUM</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Wallet</Text>
        </View>
        <View style={[styles.coinBadge, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5 }]}>
          <MaterialCommunityIcons name="database" size={18} color="#F59E0B" />
          <Text style={[styles.coinCount, { color: colors.foreground }]}>{coins.toLocaleString()}</Text>
          <Text style={[styles.coinLabel, { color: colors.mutedForeground }]}>coins</Text>
        </View>
      </View>
    </View>
  );
}

function TabBar({ active, onSelect }: { active: StoreTab; onSelect: (t: StoreTab) => void }) {
  const colors = useTheme();
  const tabs: { id: StoreTab; label: string; icon: string }[] = [
    { id: "themes", label: "Themes", icon: "palette" },
    { id: "borders", label: "Borders", icon: "circle-outline" },
    { id: "boosts", label: "Boosts", icon: "lightning-bolt" },
    { id: "redeem", label: "Redeem", icon: "gift" },
  ];
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t.id}
          onPress={() => { onSelect(t.id); Haptics.selectionAsync(); }}
          style={[styles.tabItem, active === t.id && { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons
            name={t.icon as any}
            size={14}
            color={active === t.id ? "#fff" : colors.mutedForeground}
          />
          <Text style={[styles.tabText, { color: active === t.id ? "#fff" : colors.mutedForeground }]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Themes Tab ──────────────────────────────────────────────────────────────

function ThemesTab() {
  const colors = useTheme();
  const { coins, unlockedThemes, spendCoins, themeId, setTheme } = useApp();

  function handleTheme(itemId: string, price: number) {
    if (unlockedThemes.includes(itemId)) {
      setTheme(itemId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (coins < price) {
      Alert.alert("Not Enough Coins", `You need ${(price - coins).toLocaleString()} more coins.`);
      return;
    }
    Alert.alert("Unlock Theme", `Unlock this theme for ${price} coins?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlock",
        onPress: () => {
          const ok = spendCoins(price, itemId);
          if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  return (
    <View style={{ gap: 14 }}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Theme Packs</Text>
      <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
        Completely transform the look and feel of your entire app.
      </Text>
      {THEME_STORE_ITEMS.map((item, index) => {
        const theme = THEMES[item.id];
        if (!theme) return null;
        const isUnlocked = unlockedThemes.includes(item.id);
        const isSelected = themeId === item.id;
        const isPremium = item.premium;

        return (
          <Animated.View key={item.id} entering={FadeInDown.delay(index * 80).springify()}>
            <TouchableOpacity onPress={() => handleTheme(item.id, item.price)} activeOpacity={0.88}>
              <CrystalCard style={[styles.itemCard, isSelected && { borderColor: colors.primary, borderWidth: 2 }, isPremium && styles.premiumItemCard]}>
                {isPremium && (
                  <View style={[styles.premiumBadge]}>
                    <LinearGradient
                      colors={["#FFD700", "#BF9843", "#8B6914"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.premiumBadgeGrad}
                    >
                      <MaterialCommunityIcons name="star-circle" size={12} color="#FFFFFF" />
                      <Text style={styles.premiumBadgeText}>ULTRA PREMIUM</Text>
                    </LinearGradient>
                  </View>
                )}
                <View style={[styles.themePreview, isPremium && styles.premiumThemePreview]}>
                  {isPremium ? (
                    <>
                      <LinearGradient
                        colors={["rgba(255,255,255,0.6)", "rgba(245,245,247,0.3)", "rgba(255,255,255,0.5)"]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <View style={[styles.liquidGlassStrip, { backgroundColor: "#007AFF" }]} />
                      <View style={[styles.liquidGlassStrip, { backgroundColor: "#5856D6", width: "65%" }]} />
                      <View style={[styles.liquidGlassStrip, { backgroundColor: "rgba(120,120,128,0.15)", width: "40%" }]} />
                    </>
                  ) : (
                    <>
                      <View style={[styles.themeStrip, { backgroundColor: theme.colors.primary }]} />
                      <View style={[styles.themeStrip, { backgroundColor: theme.colors.accent, width: "65%" }]} />
                      <View style={[styles.themeStrip, { backgroundColor: theme.colors.secondary, width: "40%" }]} />
                    </>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[styles.itemName, { color: colors.foreground }]}>{theme.name}</Text>
                      {isPremium && <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" />}
                    </View>
                    {isSelected ? (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary + "20" }]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>Active</Text>
                      </View>
                    ) : isUnlocked ? (
                      <View style={[styles.ownedBadge, { backgroundColor: colors.success + "15" }]}>
                        <Text style={[styles.badgeText, { color: colors.success }]}>Owned</Text>
                      </View>
                    ) : (
                      <View style={[styles.priceTag, isPremium && styles.premiumPriceTag]}>
                        <MaterialCommunityIcons name="database" size={13} color={isPremium ? "#FFD700" : "#F59E0B"} />
                        <Text style={[styles.priceText, { color: isPremium ? "#FFD700" : "#F59E0B" }]}>{item.price.toLocaleString()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                  {isUnlocked && !isSelected && (
                    <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to apply</Text>
                  )}
                  {isPremium && !isUnlocked && (
                    <Text style={[styles.premiumHint, { color: "#BF9843" }]}>The ultimate status symbol</Text>
                  )}
                </View>
              </CrystalCard>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Borders Tab ─────────────────────────────────────────────────────────────

function BordersTab() {
  const colors = useTheme();
  const { coins, purchasedBorders, avatarBorderId, purchaseBorder, selectBorder } = useApp();

  function handleBorder(borderId: string, price: number) {
    const owned = purchasedBorders.includes(borderId);
    if (owned && avatarBorderId === borderId) {
      // Deselect
      selectBorder(null);
      Haptics.selectionAsync();
      return;
    }
    if (owned) {
      selectBorder(borderId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (coins < price) {
      Alert.alert("Not Enough Coins", `You need ${(price - coins).toLocaleString()} more coins.`);
      return;
    }
    Alert.alert("Unlock Border", `Unlock this avatar border for ${price} coins?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlock & Apply",
        onPress: () => {
          const ok = purchaseBorder(borderId, price);
          if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  return (
    <View style={{ gap: 14 }}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Avatar Borders</Text>
      <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
        Add a premium ring around your profile avatar to stand out in the leaderboard.
      </Text>
      {BORDER_ITEMS.map((item, index) => {
        const owned = purchasedBorders.includes(item.id);
        const isActive = avatarBorderId === item.id;

        return (
          <Animated.View key={item.id} entering={FadeInDown.delay(index * 80).springify()}>
            <TouchableOpacity onPress={() => handleBorder(item.id, item.price)} activeOpacity={0.88}>
              <CrystalCard style={[styles.itemCard, isActive && { borderColor: item.color, borderWidth: 2 }]}>
                {/* Avatar Preview */}
                <View style={[styles.borderPreview, { borderColor: item.color, backgroundColor: item.color + "10" }]}>
                  <View style={[styles.borderInner, { backgroundColor: item.color + "20" }]}>
                    <MaterialCommunityIcons name="account" size={24} color={item.color} />
                  </View>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    {isActive ? (
                      <View style={[styles.activeBadge, { backgroundColor: item.color + "20" }]}>
                        <Ionicons name="checkmark-circle" size={14} color={item.color} />
                        <Text style={[styles.badgeText, { color: item.color }]}>Active</Text>
                      </View>
                    ) : owned ? (
                      <View style={[styles.ownedBadge, { backgroundColor: colors.success + "15" }]}>
                        <Text style={[styles.badgeText, { color: colors.success }]}>Owned</Text>
                      </View>
                    ) : (
                      <View style={styles.priceTag}>
                        <MaterialCommunityIcons name="database" size={13} color="#F59E0B" />
                        <Text style={[styles.priceText, { color: "#F59E0B" }]}>{item.price}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                  {owned && !isActive && (
                    <Text style={[styles.tapHint, { color: item.color }]}>Tap to apply →</Text>
                  )}
                  {isActive && (
                    <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap to remove</Text>
                  )}
                </View>
              </CrystalCard>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Boosts Tab ──────────────────────────────────────────────────────────────

function BoostsTab() {
  const colors = useTheme();
  const { coins, activateBoost, level } = useApp();

  function handleBoost(boostId: string, price: number, xpBonus: number, name: string) {
    if (coins < price) {
      Alert.alert("Not Enough Coins", `You need ${(price - coins).toLocaleString()} more coins for this boost.`);
      return;
    }
    Alert.alert(
      `⚡ ${name}`,
      `Spend ${price} coins to instantly receive +${xpBonus.toLocaleString()} XP?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate!",
          onPress: () => {
            const ok = activateBoost(boostId, price, xpBonus);
            if (ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("🚀 Boost Activated!", `+${xpBonus.toLocaleString()} XP added to your account! Keep grinding!`);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>XP Boosts</Text>
      <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
        Convert your earned coins into instant XP to level up faster. No limits.
      </Text>

      {/* How to earn coins info */}
      <CrystalCard style={styles.earnCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.earnTitle, { color: colors.foreground }]}>How to Earn Coins</Text>
          <Text style={[styles.earnDesc, { color: colors.mutedForeground }]}>
            ✓ Complete a habit → +10 coins{"\n"}
            ✓ Finish a workout → +50 coins{"\n"}
            ✓ Redeem promo codes → bonus coins
          </Text>
        </View>
      </CrystalCard>

      {BOOST_ITEMS.map((item, index) => {
        const canAfford = coins >= item.price;
        return (
          <Animated.View key={item.id} entering={FadeInUp.delay(index * 100).springify()}>
            <TouchableOpacity onPress={() => handleBoost(item.id, item.price, item.xpBonus, item.name)} activeOpacity={0.88}>
              <CrystalCard style={styles.boostCard}>
                <LinearGradient
                  colors={[item.color + "20", "transparent"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={[styles.boostIcon, { backgroundColor: item.color + "20" }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={30} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.boostName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.boostXP, { color: item.color }]}>+{item.xpBonus.toLocaleString()} XP</Text>
                  <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                </View>
                <View style={[styles.boostPriceBox, { backgroundColor: canAfford ? item.color + "20" : "rgba(128,128,128,0.1)", borderColor: canAfford ? item.color + "40" : "rgba(128,128,128,0.2)" }]}>
                  <MaterialCommunityIcons name="database" size={14} color={canAfford ? "#F59E0B" : colors.mutedForeground} />
                  <Text style={[styles.boostPrice, { color: canAfford ? "#F59E0B" : colors.mutedForeground }]}>
                    {item.price}
                  </Text>
                </View>
              </CrystalCard>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Redeem Tab ──────────────────────────────────────────────────────────────

function RedeemTab() {
  const colors = useTheme();
  const { redeemCode, isDemoMode } = useApp();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    if (!code.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const res = redeemCode(code.trim());
    setResult(res);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCode("");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setLoading(false);
  }

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Redeem a Code</Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          Enter a promo code to unlock themes, borders, or get bonus coins.
        </Text>
      </View>

      <CrystalCard style={styles.redeemCard}>
        <View style={styles.redeemIconRow}>
          <View style={[styles.redeemIconBox, { backgroundColor: colors.primary + "15" }]}>
            <MaterialCommunityIcons name="gift-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.redeemCardTitle, { color: colors.foreground }]}>Enter Promo Code</Text>
          <Text style={[styles.redeemCardDesc, { color: colors.mutedForeground }]}>
            Codes unlock premium content and coin rewards.
          </Text>
        </View>

        <View style={[styles.codeInputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.codeInput, { color: colors.foreground }]}
            value={code}
            onChangeText={(t) => { setCode(t.toUpperCase()); setResult(null); }}
            placeholder="ENTER PROMO CODE"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {code.length > 0 && (
            <TouchableOpacity onPress={() => { setCode(""); setResult(null); }}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {result && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[
              styles.resultBox,
              {
                backgroundColor: result.success ? colors.success + "12" : colors.destructive + "12",
                borderColor: result.success ? colors.success + "30" : colors.destructive + "30",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={result.success ? "check-circle" : "close-circle"}
              size={20}
              color={result.success ? colors.success : colors.destructive}
            />
            <Text style={[styles.resultText, { color: result.success ? colors.success : colors.destructive }]}>
              {result.message}
            </Text>
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={handleRedeem}
          disabled={loading || !code.trim()}
          style={[styles.redeemBtn, { opacity: !code.trim() ? 0.5 : 1 }]}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#818CF8", "#10D9A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.redeemBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="gift" size={18} color="#fff" />
                <Text style={styles.redeemBtnText}>Redeem Code</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </CrystalCard>

      {isDemoMode && (
        <CrystalCard style={styles.hintCard}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.hintTitle, { color: colors.foreground }]}>Dev Hint</Text>
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              Try the code <Text style={{ color: "#10D9A0", fontWeight: "700" }}>TRACKLEY2077</Text> to unlock literally everything!
            </Text>
          </View>
        </CrystalCard>
      )}

      {/* Info about available codes */}
      <View style={{ gap: 10 }}>
        <Text style={[styles.subsectionTitle, { color: colors.mutedForeground }]}>WHERE TO FIND CODES</Text>
        {[
          { icon: "instagram", text: "Follow @trackley on social media for exclusive drops" },
          { icon: "trophy-outline", text: "Reach top 3 in the leaderboard for seasonal rewards" },
          { icon: "email-outline", text: "Subscribe to the newsletter for monthly codes" },
        ].map((tip, i) => (
          <CrystalCard key={i} style={styles.tipCard}>
            <MaterialCommunityIcons name={tip.icon as any} size={18} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.foreground }]}>{tip.text}</Text>
          </CrystalCard>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StoreScreen() {
  const colors = useTheme();
  const { coins } = useApp();
  const [activeTab, setActiveTab] = useState<StoreTab>("themes");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CoinHeader coins={coins} />
      <View style={styles.tabWrapper}>
        <TabBar active={activeTab} onSelect={setActiveTab} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "themes" && <ThemesTab />}
        {activeTab === "borders" && <BordersTab />}
        {activeTab === "boosts" && <BoostsTab />}
        {activeTab === "redeem" && <RedeemTab />}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerInfoText, { color: colors.mutedForeground }]}>
            Premium features and items are permanent unlocks.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTag: { fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: "800", fontFamily: "Inter_700Bold" },
  coinBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderRadius: 20 },
  coinCount: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  coinLabel: { fontSize: 12, fontWeight: "500" },
  // Tabs
  tabWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  tabBar: { flexDirection: "row", padding: 4, borderRadius: 18, borderWidth: 1.5, gap: 2 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 14, gap: 5 },
  tabText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  // Scroll
  scrollContent: { padding: 16, gap: 14, paddingBottom: 120 },
  // Section
  sectionTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  subsectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  // Item Card
  itemCard: { padding: 14, flexDirection: "row", gap: 14, alignItems: "center" },
  premiumItemCard: { 
    padding: 16, 
    flexDirection: "row", 
    gap: 14, 
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(191, 152, 67, 0.4)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  itemInfo: { flex: 1, gap: 4 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  itemDesc: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  tapHint: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  // Premium elements
  premiumBadge: { position: "absolute", top: -8, right: 12, zIndex: 10 },
  premiumBadgeGrad: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { fontSize: 9, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1 },
  premiumPriceTag: { backgroundColor: "rgba(191, 152, 67, 0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  premiumHint: { fontSize: 10, fontWeight: "700", marginTop: 2, letterSpacing: 0.5 },
  // Theme preview
  themePreview: { width: 56, height: 76, borderRadius: 12, padding: 8, gap: 6, justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  premiumThemePreview: { 
    width: 56, 
    height: 76, 
    borderRadius: 12, 
    padding: 8, 
    gap: 6, 
    justifyContent: "center", 
    borderWidth: 1.5, 
    borderColor: "rgba(0,122,255,0.3)",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  liquidGlassStrip: { height: 5, borderRadius: 2.5, width: "100%" },
  themeStrip: { height: 5, borderRadius: 2.5, width: "100%" },
  // Border preview
  borderPreview: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  borderInner: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  // Badges
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ownedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  priceTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceText: { fontSize: 14, fontWeight: "700" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  // Boost card
  boostCard: { padding: 16, flexDirection: "row", gap: 14, alignItems: "center", overflow: "hidden" },
  boostIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  boostName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  boostXP: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  boostPriceBox: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  boostPrice: { fontSize: 14, fontWeight: "700" },
  // Earn card
  earnCard: { padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  earnTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  earnDesc: { fontSize: 12, lineHeight: 20, fontFamily: "Inter_400Regular" },
  // Redeem
  redeemCard: { padding: 22, gap: 18 },
  redeemIconRow: { alignItems: "center", gap: 10 },
  redeemIconBox: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  redeemCardTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  redeemCardDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, opacity: 0.7 },
  codeInputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 12 },
  codeInput: { flex: 1, fontSize: 18, fontWeight: "700", letterSpacing: 2 },
  resultBox: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 14, gap: 10, borderWidth: 1 },
  resultText: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  redeemBtn: { borderRadius: 16, overflow: "hidden" },
  redeemBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  redeemBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  // Hint card (demo)
  hintCard: { padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  hintTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  hintText: { fontSize: 12, lineHeight: 18 },
  // Tip card
  tipCard: { padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  footerInfo: { marginTop: 24, alignItems: "center", paddingBottom: 20 },
  footerInfoText: { fontSize: 11, fontStyle: "italic", opacity: 0.6 },
});
