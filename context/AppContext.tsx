import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "@/lib/firebase";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import React,{
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface UserProfile {
  name: string;
  photoUri: string | null;
  progressPhotos: string[];
  bio: string;
  lastNameChangeAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  reminderTime?: string;
  completedDates: string[];
  createdAt: string;
  priority?: "high" | "medium" | "low";
}

export interface FitnessProfile {
  weight: number | null;
  height: number | null;
  goal: "lose_weight" | "build_muscle" | "stay_fit" | "endurance" | "strength" | "flexibility" | "longevity" | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "athlete" | null;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  label: string;
  category: string;
  date: string;
}

export interface GroupMember {
  id: string;
  name: string;
}

export interface Bill {
  id: string;
  description: string;
  total: number;
  paidBy: string;
  members: GroupMember[];
  splitType: "equal" | "percentage";
  percentages?: Record<string, number>;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  bills: Bill[];
}

export interface Friend {
  id: string;
  name: string;
  level: number;
  xp: number;
  rank: string;
  habitsCompleted: number;
  workoutsCompleted: number;
  goal: string;
  avatarColor: string;
  addedAt: string;
  isVerified?: boolean;
}

export interface CompletedWorkout {
  date: string;
  workoutId: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  category: "habits" | "fitness" | "finance" | "social" | "level";
  xpReward: number;
}

// ─── Store Items ────────────────────────────────────────────────────────────

export const BORDER_ITEMS = [
  { id: "border_crystal", name: "Crystal Ring", price: 300, color: "#10D9A0", description: "A shimmering crystal border for your avatar." },
  { id: "border_neon", name: "Neon Halo", price: 600, color: "#818CF8", description: "Electric neon glow around your profile picture." },
  { id: "border_gold", name: "Golden Flame", price: 900, color: "#F59E0B", description: "Crown yourself with the prestige of golden fire." },
  { id: "border_galaxy", name: "Galaxy Orbit", price: 1400, color: "#C084FC", description: "A cosmic galaxy swirling around your avatar." },
  { id: "border_crimson", name: "Crimson Elite", price: 2000, color: "#F43F5E", description: "The ultimate red crown — for champions only." },
];

export const BOOST_ITEMS = [
  { id: "boost_xp_sm", name: "XP Surge", price: 150, icon: "lightning-bolt", color: "#F59E0B", description: "Instantly earn +200 XP to level up faster.", xpBonus: 200 },
  { id: "boost_xp_md", name: "XP Megaboost", price: 400, icon: "rocket", color: "#818CF8", description: "A massive +600 XP boost to your account.", xpBonus: 600 },
  { id: "boost_xp_lg", name: "Level Rush", price: 800, icon: "star-circle", color: "#C084FC", description: "Skyrocket your progress with +1,500 XP instantly.", xpBonus: 1500 },
];

export const PROMO_CODES: Record<string, { coins: number; themes: string[]; borders: string[]; message: string }> = {
  TRACKLEY2077: {
    coins: 1000000,
    themes: ["crystal", "obsidian", "emerald", "rosegold", "sunset", "midnightpro", "cyberpunk", "deepsea", "royalvelvet", "titanium", "phantom"],
    borders: ["border_crystal", "border_neon", "border_gold", "border_galaxy", "border_crimson"],
    message: "🎉 GOD MODE ACTIVATED! All themes, all borders + 1,000,000 coins!",
  },
  COINS500: {
    coins: 500,
    themes: [],
    borders: [],
    message: "💰 500 bonus coins added to your wallet!",
  },
  TRACKLEYSTART: {
    coins: 1000,
    themes: ["obsidian"],
    borders: ["border_crystal"],
    message: "🚀 Welcome gift! 1,000 coins + Obsidian theme + Crystal Ring unlocked!",
  },
};

// ─── Ranks & Achievements ────────────────────────────────────────────────────

export const RANK_THRESHOLDS: { level: number; rank: string; color: string; icon: string; tier: string }[] = [
  { level: 1, rank: "Bronze", color: "#CD7F32", icon: "shield-outline", tier: "I" },
  { level: 5, rank: "Silver", color: "#A8A8A8", icon: "star-outline", tier: "II" },
  { level: 12, rank: "Gold", color: "#FFD700", icon: "trophy", tier: "III" },
  { level: 22, rank: "Platinum", color: "#E5E4E2", icon: "diamond", tier: "IV" },
  { level: 35, rank: "Diamond", color: "#B9F2FF", icon: "diamond", tier: "V" },
  { level: 50, rank: "Master", color: "#C084FC", icon: "crown-outline", tier: "VI" },
  { level: 75, rank: "Grandmaster", color: "#FF6B6B", icon: "medal", tier: "VII" },
];

export function getRankForLevel(level: number) {
  let current = RANK_THRESHOLDS[0];
  for (const t of RANK_THRESHOLDS) {
    if (level >= t.level) current = t;
    else break;
  }
  return current;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_habit", title: "First Step", description: "Complete your very first habit", icon: "footsteps-outline", unlockedAt: null, category: "habits", xpReward: 50 },
  { id: "habits_7", title: "Week Warrior", description: "Complete habits 7 days total", icon: "calendar-outline", unlockedAt: null, category: "habits", xpReward: 100 },
  { id: "habits_50", title: "Habit Hero", description: "Complete 50 habits in total", icon: "medal-outline", unlockedAt: null, category: "habits", xpReward: 250 },
  { id: "first_workout", title: "Fitness Initiate", description: "Complete your first workout", icon: "barbell-outline", unlockedAt: null, category: "fitness", xpReward: 50 },
  { id: "workouts_10", title: "Fitness Machine", description: "Complete 10 workouts", icon: "body-outline", unlockedAt: null, category: "fitness", xpReward: 200 },
  { id: "workouts_30", title: "Iron Will", description: "Complete 30 workouts", icon: "flash-outline", unlockedAt: null, category: "fitness", xpReward: 500 },
  { id: "first_transaction", title: "Money Mind", description: "Track your first transaction", icon: "cash-outline", unlockedAt: null, category: "finance", xpReward: 30 },
  { id: "positive_balance", title: "Wealth Builder", description: "Maintain a positive balance above ₨10,000", icon: "trending-up-outline", unlockedAt: null, category: "finance", xpReward: 150 },
  { id: "first_group", title: "Group Leader", description: "Create your first group", icon: "people-outline", unlockedAt: null, category: "social", xpReward: 50 },
  { id: "first_friend", title: "Squad Up", description: "Add your first friend", icon: "person-add-outline", unlockedAt: null, category: "social", xpReward: 75 },
  { id: "level_5", title: "Rising Star", description: "Reach Level 5", icon: "star-outline", unlockedAt: null, category: "level", xpReward: 200 },
  { id: "level_10", title: "Champion", description: "Reach Level 10", icon: "trophy-outline", unlockedAt: null, category: "level", xpReward: 500 },
  { id: "level_20", title: "Legendary", description: "Reach Level 20", icon: "infinite-outline", unlockedAt: null, category: "level", xpReward: 1000 },
];

// ─── State Interfaces ────────────────────────────────────────────────────────

interface AppState {
  profile: UserProfile;
  habits: Habit[];
  xp: number;
  level: number;
  fitnessProfile: FitnessProfile;
  completedWorkouts: CompletedWorkout[];
  transactions: Transaction[];
  groups: Group[];
  friends: Friend[];
  achievements: Achievement[];
  hasCompletedOnboarding: boolean;
  userId: string | null;
  themeId: string;
  coins: number;
  unlockedThemes: string[];
  isDemoMode: boolean;
  purchasedBorders: string[];
  avatarBorderId: string | null;
  redeemedCodes: string[];
}

interface AppContextType extends AppState {
  setProfile: (p: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addHabit: (name: string, emoji: string, reminderTime?: string) => string;
  deleteHabit: (id: string) => void;
  toggleHabitPriority: (id: string) => void;
  reorderHabits: (fromIndex: number, toIndex: number) => void;
  toggleHabit: (id: string) => void;
  setFitnessProfile: (profile: FitnessProfile) => void;
  completeWorkout: (workoutId: string) => void;
  isWorkoutCompleted: (workoutId: string) => boolean;
  addTransaction: (t: Omit<Transaction, "id" | "date">) => void;
  deleteTransaction: (id: string) => void;
  addGroup: (name: string) => void;
  deleteGroup: (groupId: string) => void;
  addGroupMember: (groupId: string, name: string) => void;
  addBill: (groupId: string, bill: Omit<Bill, "id" | "date">) => void;
  getBalance: () => number;
  getNetOwed: (groupId: string) => { from: string; to: string; amount: number }[];
  addFriend: (friend: Omit<Friend, "id" | "addedAt">) => void;
  deleteFriend: (id: string) => void;
  getTotalHabitsCompleted: () => number;
  getTotalWorkoutsCompleted: () => number;
  logout: () => Promise<void>;
  setTheme: (id: string) => void;
  earnCoins: (amount: number) => void;
  spendCoins: (amount: number, themeId: string) => boolean;
  purchaseBorder: (borderId: string, price: number) => boolean;
  selectBorder: (borderId: string | null) => void;
  activateBoost: (boostId: string, price: number, xpBonus: number) => boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  redeemCode: (code: string) => { success: boolean; message: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "@trackley_state_v5";
const XP_PER_HABIT = 30;
const XP_PER_WORKOUT = 75;
const WORKOUT_COOLDOWN = 1000;
const DEMO_USER_ID = "__demo__";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysAgoStr(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
}

export function calcLevel(xp: number) {
  return Math.floor(Math.pow(xp / 150, 0.55)) + 1;
}

export function getLevelXP(level: number) {
  if (level <= 1) return 0;
  return Math.floor(150 * Math.pow(level - 1, 1.82));
}

// ─── Default & Demo State ────────────────────────────────────────────────────

const defaultProfile: UserProfile = { name: "", photoUri: null, progressPhotos: [], bio: "" };

const defaultState: AppState = {
  profile: defaultProfile,
  habits: [],
  xp: 0,
  level: 1,
  fitnessProfile: { weight: null, height: null, goal: null, age: null, gender: null, activityLevel: null },
  completedWorkouts: [],
  transactions: [],
  groups: [],
  friends: [],
  achievements: ALL_ACHIEVEMENTS.map((a) => ({ ...a })),
  hasCompletedOnboarding: false,
  userId: null,
  themeId: "crystal",
  coins: 0,
  unlockedThemes: ["crystal", "dark", "midnight"],
  isDemoMode: false,
  purchasedBorders: [],
  avatarBorderId: null,
  redeemedCodes: [],
};

function makeDemoState(): AppState {
  const today = todayStr();
  const d1 = daysAgoStr(1);
  const d2 = daysAgoStr(2);
  const d3 = daysAgoStr(3);

  return {
    ...defaultState,
    isDemoMode: true,
    userId: DEMO_USER_ID,
    hasCompletedOnboarding: true,
    profile: { name: "Demo Champion", photoUri: null, progressPhotos: [], bio: "Demo account — explore all features of Trackley!" },
    habits: [
      { id: "dh1", name: "Morning Workout", emoji: "💪", completedDates: [today, d1, d2], createdAt: new Date().toISOString() },
      { id: "dh2", name: "Drink 8 Glasses", emoji: "💧", completedDates: [today, d1], createdAt: new Date().toISOString() },
      { id: "dh3", name: "Read 30 Mins", emoji: "📚", completedDates: [d1, d2, d3], createdAt: new Date().toISOString() },
      { id: "dh4", name: "Meditate", emoji: "🧘", completedDates: [today], createdAt: new Date().toISOString() },
      { id: "dh5", name: "Cold Shower", emoji: "🚿", completedDates: [today, d1, d2], createdAt: new Date().toISOString() },
    ],
    xp: 4200,
    level: 7,
    coins: 2500,
    fitnessProfile: { weight: 72, height: 175, goal: "build_muscle", age: 25, gender: "male", activityLevel: "moderate" },
    completedWorkouts: [
      { workoutId: "dw1", date: today },
      { workoutId: "dw2", date: d1 },
    ],
    transactions: [
      { id: "dt1", type: "income", amount: 75000, label: "Monthly Salary", category: "Salary", date: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: "dt2", type: "expense", amount: 8500, label: "Groceries", category: "Food", date: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "dt3", type: "expense", amount: 3000, label: "Gym Membership", category: "Health", date: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "dt4", type: "income", amount: 12000, label: "Freelance Project", category: "Freelance", date: new Date(Date.now() - 86400000).toISOString() },
      { id: "dt5", type: "expense", amount: 2500, label: "Streaming Services", category: "Entertainment", date: new Date().toISOString() },
    ],
    groups: [
      {
        id: "dg1",
        name: "Trip to Pokhara",
        members: [
          { id: "dm1", name: "Raj" },
          { id: "dm2", name: "Priya" },
          { id: "dm3", name: "You" },
        ],
        bills: [
          { id: "db1", description: "Hotel (2 nights)", total: 15000, paidBy: "dm1", members: [{ id: "dm1", name: "Raj" }, { id: "dm2", name: "Priya" }, { id: "dm3", name: "You" }], splitType: "equal", date: new Date().toISOString() },
          { id: "db2", description: "Dinner at Lakeside", total: 4500, paidBy: "dm3", members: [{ id: "dm1", name: "Raj" }, { id: "dm2", name: "Priya" }, { id: "dm3", name: "You" }], splitType: "equal", date: new Date().toISOString() },
        ],
      },
    ],
    friends: [
      { id: "df1", name: "Aditya Sharma", level: 8, xp: 6200, rank: "Warrior", habitsCompleted: 45, workoutsCompleted: 12, goal: "build_muscle", avatarColor: "#818CF8", addedAt: new Date().toISOString() },
      { id: "df2", name: "Sara K.", level: 5, xp: 2800, rank: "Novice", habitsCompleted: 30, workoutsCompleted: 6, goal: "lose_weight", avatarColor: "#F43F5E", addedAt: new Date().toISOString() },
      { id: "df3", name: "Rohan B.", level: 3, xp: 850, rank: "Novice", habitsCompleted: 15, workoutsCompleted: 3, goal: "stay_fit", avatarColor: "#10D9A0", addedAt: new Date().toISOString() },
    ],
    achievements: ALL_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlockedAt: ["first_habit", "habits_7", "first_workout", "first_transaction", "first_friend", "first_group", "level_5"].includes(a.id)
        ? new Date().toISOString()
        : null,
    })),
    unlockedThemes: ["crystal", "dark", "midnight"],
    themeId: "crystal",
    purchasedBorders: ["border_crystal"],
    avatarBorderId: "border_crystal",
    redeemedCodes: [],
  };
}

// ─── Achievement Checker ─────────────────────────────────────────────────────

function checkAchievements(state: AppState, achievements: Achievement[]): Achievement[] {
  const now = new Date().toISOString();
  const totalHabits = state.habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const totalWorkouts = state.completedWorkouts.length;
  const balance = state.transactions.reduce((s, t) => (t.type === "income" ? s + t.amount : s - t.amount), 0);

  return achievements.map((a) => {
    if (a.unlockedAt) return a;
    let unlock = false;
    switch (a.id) {
      case "first_habit": unlock = totalHabits >= 1; break;
      case "habits_7": unlock = totalHabits >= 7; break;
      case "habits_50": unlock = totalHabits >= 50; break;
      case "first_workout": unlock = totalWorkouts >= 1; break;
      case "workouts_10": unlock = totalWorkouts >= 10; break;
      case "workouts_30": unlock = totalWorkouts >= 30; break;
      case "first_transaction": unlock = state.transactions.length >= 1; break;
      case "positive_balance": unlock = balance >= 10000; break;
      case "first_group": unlock = state.groups.length >= 1; break;
      case "first_friend": unlock = state.friends.length >= 1; break;
      case "level_5": unlock = state.level >= 5; break;
      case "level_10": unlock = state.level >= 10; break;
      case "level_20": unlock = state.level >= 20; break;
    }
    return unlock ? { ...a, unlockedAt: now } : a;
  });
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lastActionTime, setLastActionTime] = useState<Record<string, number>>({});
  const isDemoRef = useRef(false);

  // 1. Listen to Firebase Auth Changes —— ignored while in demo mode
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user: any) => {
      if (isDemoRef.current) return;
      setCurrentUser(user);
      if (user) {
        setState((s) => ({ ...s, userId: user.uid }));
      } else {
        setState((s) => ({ ...s, userId: null }));
      }
    });
    return unsub;
  }, []);

  // 2. Load Local State (offline cache)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          const merged: AppState = {
            ...defaultState,
            ...parsed,
            profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
            fitnessProfile: { ...defaultState.fitnessProfile, ...(parsed.fitnessProfile ?? {}) },
            achievements: ALL_ACHIEVEMENTS.map((a) => {
              const saved = (parsed.achievements ?? []).find((s) => s.id === a.id);
              return saved ? { ...a, unlockedAt: saved.unlockedAt } : { ...a };
            }),
            purchasedBorders: parsed.purchasedBorders ?? [],
            avatarBorderId: parsed.avatarBorderId ?? null,
            redeemedCodes: parsed.redeemedCodes ?? [],
            isDemoMode: parsed.isDemoMode ?? false, // Keep the demo mode state as it was
          };
          setState(merged);
          if (parsed.isDemoMode) isDemoRef.current = true;
        } catch {
          setState(defaultState);
        }
      }
      setLoaded(true);
    });
  }, []);

  // 3. Sync with Firestore when logged in (real user only)
  useEffect(() => {
    if (!currentUser || isDemoRef.current) return;
    const unsub = db.collection("users").doc(currentUser.uid).onSnapshot(
      (snapshot: any) => {
        if (snapshot && snapshot.exists) {
          const data = snapshot.data() as Partial<AppState>;
          setState((s) => ({
            ...s,
            ...data,
            userId: currentUser.uid,
            achievements: data.achievements ?? s.achievements,
            purchasedBorders: data.purchasedBorders ?? s.purchasedBorders,
            avatarBorderId: data.avatarBorderId ?? s.avatarBorderId,
            redeemedCodes: data.redeemedCodes ?? s.redeemedCodes,
          }));
        }
      },
      (error: any) => console.error("Firestore Subscribe Error:", error)
    );
    return unsub;
  }, [currentUser]);

  // 4. Persistence Effect
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
      
      // Only sync to cloud if NOT in demo mode
      if (!state.isDemoMode && currentUser && !isDemoRef.current) {
        db.collection("users").doc(currentUser.uid).set(state, { merge: true })
          .catch((err: any) => console.error("Cloud Save Error:", err));
      }
    }, 1000); // Debounce saves
    return () => clearTimeout(timer);
  }, [state, loaded, currentUser]);

  const save = useCallback(
    (next: AppState | ((prev: AppState) => AppState)) => {
      setState((prev) => {
        const newState = typeof next === "function" ? next(prev) : next;
        return { ...newState, achievements: checkAchievements(newState, newState.achievements) };
      });
    },
    []
  );

  // ─── Profile ───────────────────────────────────────────────────────────────

  const setProfile = useCallback((p: Partial<UserProfile>) => {
    setState(prev => {
      const updated = { ...prev, profile: { ...prev.profile, ...p } };
      return { ...updated, achievements: checkAchievements(updated, updated.achievements) };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    save({ ...state, hasCompletedOnboarding: true });
  }, [state, save]);

  // ─── Habits ────────────────────────────────────────────────────────────────

  const addHabit = useCallback((name: string, emoji: string, reminderTime?: string): string => {
    const newId = generateId();
    save({ ...state, habits: [...state.habits, { id: newId, name, emoji, reminderTime, completedDates: [], createdAt: new Date().toISOString() }] });
    return newId;
  }, [state, save]);

  const deleteHabit = useCallback((id: string) => {
    // Cancel all scheduled reminder notifications for this habit
    try {
      Notifications.cancelScheduledNotificationAsync(`habit-${id}-0`);
      Notifications.cancelScheduledNotificationAsync(`habit-${id}-1`);
      Notifications.cancelScheduledNotificationAsync(`habit-${id}-2`);
    } catch {}
    save({ ...state, habits: state.habits.filter((h) => h.id !== id) });
  }, [state, save]);

  const toggleHabitPriority = useCallback((id: string) => {
    const habits = state.habits.map((h) => {
      if (h.id !== id) return h;
      const next = h.priority === "high" ? "medium" as const : h.priority === "medium" ? "low" as const : h.priority === "low" ? undefined : "high" as const;
      return { ...h, priority: next };
    });
    save({ ...state, habits });
  }, [state, save]);

  const reorderHabits = useCallback((fromIndex: number, toIndex: number) => {
    const sorted = [...state.habits].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aP = a.priority ? priorityOrder[a.priority] : 3;
      const bP = b.priority ? priorityOrder[b.priority] : 3;
      if (aP !== bP) return aP - bP;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    save({ ...state, habits: sorted });
  }, [state, save]);

  const toggleHabit = useCallback((id: string) => {
    const now = Date.now();
    const lastAction = lastActionTime[`habit_${id}`] || 0;
    const isSpamming = now - lastAction < 15000;
    const today = todayStr();
    let xpDelta = 0;
    let coinDelta = 0;

    const habits = state.habits.map((h) => {
      if (h.id !== id) return h;
      const alreadyDone = h.completedDates.includes(today);
      if (alreadyDone) {
        // Un-completing a habit: re-schedule its notification if it had a reminder
        return { ...h, completedDates: h.completedDates.filter((d) => d !== today) };
      } else {
        if (!isSpamming) {
          xpDelta = XP_PER_HABIT;
          coinDelta = 10;
          // Dismiss today's triggers to stop the current "snooze" loop, 
          // but we don't 'cancel' so we don't lose the recurring schedule for tomorrow.
          try {
            Notifications.dismissNotificationAsync(`habit-${id}-0`).catch(() => {});
            Notifications.dismissNotificationAsync(`habit-${id}-1`).catch(() => {});
            Notifications.dismissNotificationAsync(`habit-${id}-2`).catch(() => {});
          } catch {}
        }
        return { ...h, completedDates: [...h.completedDates, today] };
      }
    });

    if (xpDelta > 0 || coinDelta > 0) {
      setLastActionTime((prev) => ({ ...prev, [`habit_${id}`]: now }));
    }

    const newXp = state.xp + xpDelta;
    const newCoins = state.coins + coinDelta;
    save({ ...state, habits, xp: newXp, coins: newCoins, level: calcLevel(newXp) });
  }, [state, save, lastActionTime]);

  // ─── Fitness ───────────────────────────────────────────────────────────────

  const setFitnessProfile = useCallback((profile: FitnessProfile) => {
    setState(prev => ({ ...prev, fitnessProfile: profile }));
  }, []);

  const completeWorkout = useCallback((workoutId: string) => {
    const now = Date.now();
    const lastAction = lastActionTime[`workout_${workoutId}`] || 0;
    if (now - lastAction < WORKOUT_COOLDOWN) return;
    const today = todayStr();
    if (state.completedWorkouts.some((w) => w.workoutId === workoutId && w.date === today)) return;
    const newXp = state.xp + XP_PER_WORKOUT;
    const newCoins = state.coins + 50;
    setLastActionTime((prev) => ({ ...prev, [`workout_${workoutId}`]: now }));
    save({ ...state, completedWorkouts: [...state.completedWorkouts, { workoutId, date: today }], xp: newXp, coins: newCoins, level: calcLevel(newXp) });
  }, [state, save, lastActionTime]);

  const isWorkoutCompleted = useCallback((workoutId: string) => {
    const today = todayStr();
    return state.completedWorkouts.some((w) => w.workoutId === workoutId && w.date === today);
  }, [state.completedWorkouts]);

  // ─── Finance ───────────────────────────────────────────────────────────────

  const addTransaction = useCallback((t: Omit<Transaction, "id" | "date">) => {
    const tx: Transaction = { ...t, id: generateId(), date: new Date().toISOString() };
    save({ ...state, transactions: [tx, ...state.transactions] });
  }, [state, save]);

  const deleteTransaction = useCallback((id: string) => {
    save({ ...state, transactions: state.transactions.filter((t) => t.id !== id) });
  }, [state, save]);

  const getBalance = useCallback(() => {
    return state.transactions.reduce((sum, t) => (t.type === "income" ? sum + t.amount : sum - t.amount), 0);
  }, [state.transactions]);

  // ─── Groups ────────────────────────────────────────────────────────────────

  const addGroup = useCallback((name: string) => {
    save({ ...state, groups: [...state.groups, { id: generateId(), name, members: [], bills: [] }] });
  }, [state, save]);

  const deleteGroup = useCallback((groupId: string) => {
    save({ ...state, groups: state.groups.filter((g) => g.id !== groupId) });
  }, [state, save]);

  const addGroupMember = useCallback((groupId: string, name: string) => {
    const member: GroupMember = { id: generateId(), name };
    const groups = state.groups.map((g) => g.id === groupId ? { ...g, members: [...g.members, member] } : g);
    save({ ...state, groups });
  }, [state, save]);

  const addBill = useCallback((groupId: string, bill: Omit<Bill, "id" | "date">) => {
    const newBill: Bill = { ...bill, id: generateId(), date: new Date().toISOString() };
    const groups = state.groups.map((g) => g.id === groupId ? { ...g, bills: [...g.bills, newBill] } : g);
    save({ ...state, groups });
  }, [state, save]);

  const getNetOwed = useCallback((groupId: string) => {
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return [];
    const net: Record<string, Record<string, number>> = {};
    for (const bill of group.bills) {
      const shares: Record<string, number> = {};
      if (bill.splitType === "equal") {
        const each = bill.total / bill.members.length;
        for (const m of bill.members) shares[m.id] = each;
      } else {
        for (const m of bill.members) {
          const pct = (bill.percentages?.[m.id] ?? 0) / 100;
          shares[m.id] = bill.total * pct;
        }
      }
      for (const m of bill.members) {
        if (m.id === bill.paidBy) continue;
        const owes = shares[m.id] ?? 0;
        if (!net[m.id]) net[m.id] = {};
        net[m.id][bill.paidBy] = (net[m.id][bill.paidBy] ?? 0) + owes;
      }
    }
    const result: { from: string; to: string; amount: number }[] = [];
    for (const [from, toMap] of Object.entries(net)) {
      for (const [to, amount] of Object.entries(toMap)) {
        if (amount > 0.01) {
          const fromM = group.members.find((m) => m.id === from);
          const toM = group.members.find((m) => m.id === to);
          if (fromM && toM) result.push({ from: fromM.name, to: toM.name, amount });
        }
      }
    }
    return result;
  }, [state.groups]);

  // ─── Friends ───────────────────────────────────────────────────────────────

  const addFriend = useCallback((friend: Omit<Friend, "id" | "addedAt">) => {
    // Check if already friends
    if (state.friends.some(f => f.name === friend.name)) {
      Alert.alert("Already in Circle", `${friend.name} is already in your circle.`);
      return;
    }
    save({ ...state, friends: [...state.friends, { ...friend, id: generateId(), addedAt: new Date().toISOString(), isVerified: true }] });
  }, [state, save]);

  const deleteFriend = useCallback((id: string) => {
    save({ ...state, friends: state.friends.filter((f) => f.id !== id) });
  }, [state, save]);

  const getTotalHabitsCompleted = useCallback(() => {
    return state.habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  }, [state.habits]);

  const getTotalWorkoutsCompleted = useCallback(() => state.completedWorkouts.length, [state.completedWorkouts]);

  // ─── Theme & Coins ─────────────────────────────────────────────────────────

  const setTheme = useCallback((id: string) => {
    save((prev) => {
      if (prev.unlockedThemes.includes(id)) {
        return { ...prev, themeId: id };
      }
      return prev;
    });
  }, [save]);

  const earnCoins = useCallback((amount: number) => {
    save({ ...state, coins: state.coins + amount });
  }, [state, save]);

  const spendCoins = useCallback((amount: number, themeId: string): boolean => {
    let success = false;
    save((prev) => {
      if (prev.coins < amount) {
        success = false;
        return prev;
      }
      success = true;
      const unlocked = [...prev.unlockedThemes];
      if (!unlocked.includes(themeId)) unlocked.push(themeId);
      return {
        ...prev,
        coins: prev.coins - amount,
        unlockedThemes: unlocked,
        themeId: themeId,
      };
    });
    return success;
  }, [save]);

  // ─── Borders ───────────────────────────────────────────────────────────────

  const purchaseBorder = useCallback((borderId: string, price: number): boolean => {
    let success = false;
    save((prev) => {
      if (prev.purchasedBorders.includes(borderId)) {
        success = true;
        return { ...prev, avatarBorderId: borderId };
      }
      if (prev.coins < price) {
        success = false;
        return prev;
      }
      success = true;
      const newPurchasedBorders = [...prev.purchasedBorders, borderId];
      return {
        ...prev,
        coins: prev.coins - price,
        purchasedBorders: newPurchasedBorders,
        avatarBorderId: borderId,
      };
    });
    return success;
  }, [save]);

  const selectBorder = useCallback((borderId: string | null) => {
    save((prev) => ({ ...prev, avatarBorderId: borderId }));
  }, [save]);

  // ─── Boosts ────────────────────────────────────────────────────────────────

  const activateBoost = useCallback((boostId: string, price: number, xpBonus: number): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.coins < price) {
        success = false;
        return prev;
      }
      success = true;
      const newXp = prev.xp + xpBonus;
      const newCoins = prev.coins - price;
      return {
        ...prev,
        coins: newCoins,
        xp: newXp,
        level: calcLevel(newXp),
      };
    });
    return success;
  }, []);

  // ─── Promo Codes ───────────────────────────────────────────────────────────

  const redeemCode = useCallback((code: string): { success: boolean; message: string } => {
    const normalized = code.trim().toUpperCase();
    const promo = PROMO_CODES[normalized];
    if (!promo) return { success: false, message: "Invalid code. Please check and try again." };

    let result = { success: false, message: "" };

    setState((prev) => {
      if ((prev.redeemedCodes ?? []).includes(normalized)) {
        result = { success: false, message: "This code has already been redeemed on your account." };
        return prev;
      }
      const newUnlockedThemes = [...new Set([...prev.unlockedThemes, ...promo.themes])];
      const newPurchasedBorders = [...new Set([...(prev.purchasedBorders ?? []), ...promo.borders])];
      const newCoins = prev.coins + promo.coins;
      const newRedeemedCodes = [...(prev.redeemedCodes ?? []), normalized];

      result = { success: true, message: promo.message };
      return {
        ...prev,
        coins: newCoins,
        unlockedThemes: newUnlockedThemes,
        purchasedBorders: newPurchasedBorders,
        redeemedCodes: newRedeemedCodes,
      };
    });

    return result;
  }, []);

  // ─── Demo Mode ─────────────────────────────────────────────────────────────

  const enterDemoMode = useCallback(() => {
    isDemoRef.current = true;
    setState(makeDemoState());
  }, []);

  const exitDemoMode = useCallback(() => {
    isDemoRef.current = false;
    setState(defaultState);
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    if (isDemoRef.current) {
      isDemoRef.current = false;
      setState(defaultState);
      return;
    }
    try {
      await auth.signOut();
      await AsyncStorage.removeItem(STORAGE_KEY);
      setState(defaultState);
      setLastActionTime({});
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        ...state,
        setProfile,
        completeOnboarding,
        addHabit,
        deleteHabit,
        toggleHabit,
        toggleHabitPriority,
        reorderHabits,
        setFitnessProfile,
        completeWorkout,
        isWorkoutCompleted,
        addTransaction,
        deleteTransaction,
        addGroup,
        deleteGroup,
        addGroupMember,
        addBill,
        getBalance,
        getNetOwed,
        addFriend,
        deleteFriend,
        getTotalHabitsCompleted,
        getTotalWorkoutsCompleted,
        logout,
        setTheme,
        earnCoins,
        spendCoins,
        purchaseBorder,
        selectBorder,
        activateBoost,
        enterDemoMode,
        exitDemoMode,
        redeemCode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
