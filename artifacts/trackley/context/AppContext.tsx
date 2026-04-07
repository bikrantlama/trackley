import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface UserProfile {
  name: string;
  photoUri: string | null;
  progressPhotos: string[];
  bio: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  completedDates: string[];
  createdAt: string;
}

export interface FitnessProfile {
  weight: number | null;
  height: number | null;
  goal: "lose_weight" | "build_muscle" | "stay_fit" | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | null;
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

export const RANK_THRESHOLDS: { level: number; rank: string; color: string; icon: string }[] = [
  { level: 1, rank: "Recruit", color: "#6060A0", icon: "shield-outline" },
  { level: 3, rank: "Novice", color: "#10D9A0", icon: "star-outline" },
  { level: 6, rank: "Warrior", color: "#818CF8", icon: "flame-outline" },
  { level: 10, rank: "Champion", color: "#F59E0B", icon: "trophy-outline" },
  { level: 15, rank: "Elite", color: "#00D9F5", icon: "diamond-outline" },
  { level: 20, rank: "Legend", color: "#F43F5E", icon: "skull-outline" },
  { level: 30, rank: "Immortal", color: "#C084FC", icon: "infinite-outline" },
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
  {
    id: "first_habit",
    title: "First Step",
    description: "Complete your very first habit",
    icon: "footsteps-outline",
    unlockedAt: null,
    category: "habits",
    xpReward: 50,
  },
  {
    id: "habits_7",
    title: "Week Warrior",
    description: "Complete habits 7 days total",
    icon: "calendar-outline",
    unlockedAt: null,
    category: "habits",
    xpReward: 100,
  },
  {
    id: "habits_50",
    title: "Habit Hero",
    description: "Complete 50 habits in total",
    icon: "medal-outline",
    unlockedAt: null,
    category: "habits",
    xpReward: 250,
  },
  {
    id: "first_workout",
    title: "Fitness Initiate",
    description: "Complete your first workout",
    icon: "barbell-outline",
    unlockedAt: null,
    category: "fitness",
    xpReward: 50,
  },
  {
    id: "workouts_10",
    title: "Fitness Machine",
    description: "Complete 10 workouts",
    icon: "body-outline",
    unlockedAt: null,
    category: "fitness",
    xpReward: 200,
  },
  {
    id: "workouts_30",
    title: "Iron Will",
    description: "Complete 30 workouts",
    icon: "flash-outline",
    unlockedAt: null,
    category: "fitness",
    xpReward: 500,
  },
  {
    id: "first_transaction",
    title: "Money Mind",
    description: "Track your first transaction",
    icon: "cash-outline",
    unlockedAt: null,
    category: "finance",
    xpReward: 30,
  },
  {
    id: "positive_balance",
    title: "Wealth Builder",
    description: "Maintain a positive balance above ₨10,000",
    icon: "trending-up-outline",
    unlockedAt: null,
    category: "finance",
    xpReward: 150,
  },
  {
    id: "first_group",
    title: "Group Leader",
    description: "Create your first group",
    icon: "people-outline",
    unlockedAt: null,
    category: "social",
    xpReward: 50,
  },
  {
    id: "first_friend",
    title: "Squad Up",
    description: "Add your first friend",
    icon: "person-add-outline",
    unlockedAt: null,
    category: "social",
    xpReward: 75,
  },
  {
    id: "level_5",
    title: "Rising Star",
    description: "Reach Level 5",
    icon: "star-outline",
    unlockedAt: null,
    category: "level",
    xpReward: 200,
  },
  {
    id: "level_10",
    title: "Champion",
    description: "Reach Level 10",
    icon: "trophy-outline",
    unlockedAt: null,
    category: "level",
    xpReward: 500,
  },
  {
    id: "level_20",
    title: "Legendary",
    description: "Reach Level 20",
    icon: "infinite-outline",
    unlockedAt: null,
    category: "level",
    xpReward: 1000,
  },
];

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
}

interface AppContextType extends AppState {
  setProfile: (p: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addHabit: (name: string, emoji: string) => void;
  deleteHabit: (id: string) => void;
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
}

const STORAGE_KEY = "@trackley_state_v4";
const XP_PER_HABIT = 25;
const XP_PER_WORKOUT = 50;
const XP_PER_LEVEL = 300;

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function calcLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

const defaultProfile: UserProfile = {
  name: "",
  photoUri: null,
  progressPhotos: [],
  bio: "",
};

const defaultState: AppState = {
  profile: defaultProfile,
  habits: [],
  xp: 0,
  level: 1,
  fitnessProfile: {
    weight: null,
    height: null,
    goal: null,
    age: null,
    gender: null,
    activityLevel: null,
  },
  completedWorkouts: [],
  transactions: [],
  groups: [],
  friends: [],
  achievements: ALL_ACHIEVEMENTS.map((a) => ({ ...a })),
  hasCompletedOnboarding: false,
};

const AppContext = createContext<AppContextType | null>(null);

function checkAchievements(
  state: AppState,
  achievements: Achievement[]
): Achievement[] {
  const now = new Date().toISOString();
  const totalHabits = state.habits.reduce(
    (sum, h) => sum + h.completedDates.length,
    0
  );
  const totalWorkouts = state.completedWorkouts.length;
  const balance = state.transactions.reduce(
    (s, t) => (t.type === "income" ? s + t.amount : s - t.amount),
    0
  );

  return achievements.map((a) => {
    if (a.unlockedAt) return a;
    let unlock = false;
    switch (a.id) {
      case "first_habit":
        unlock = totalHabits >= 1;
        break;
      case "habits_7":
        unlock = totalHabits >= 7;
        break;
      case "habits_50":
        unlock = totalHabits >= 50;
        break;
      case "first_workout":
        unlock = totalWorkouts >= 1;
        break;
      case "workouts_10":
        unlock = totalWorkouts >= 10;
        break;
      case "workouts_30":
        unlock = totalWorkouts >= 30;
        break;
      case "first_transaction":
        unlock = state.transactions.length >= 1;
        break;
      case "positive_balance":
        unlock = balance >= 10000;
        break;
      case "first_group":
        unlock = state.groups.length >= 1;
        break;
      case "first_friend":
        unlock = state.friends.length >= 1;
        break;
      case "level_5":
        unlock = state.level >= 5;
        break;
      case "level_10":
        unlock = state.level >= 10;
        break;
      case "level_20":
        unlock = state.level >= 20;
        break;
    }
    return unlock ? { ...a, unlockedAt: now } : a;
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          const merged: AppState = {
            ...defaultState,
            ...parsed,
            profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
            fitnessProfile: {
              ...defaultState.fitnessProfile,
              ...(parsed.fitnessProfile ?? {}),
            },
            achievements: ALL_ACHIEVEMENTS.map((a) => {
              const saved = (parsed.achievements ?? []).find(
                (s) => s.id === a.id
              );
              return saved ? { ...a, unlockedAt: saved.unlockedAt } : { ...a };
            }),
          };
          setState(merged);
        } catch {
          setState(defaultState);
        }
      }
      setLoaded(true);
    });
  }, []);

  const save = useCallback((next: AppState) => {
    const withAchievements = {
      ...next,
      achievements: checkAchievements(next, next.achievements),
    };
    setState(withAchievements);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withAchievements)).catch(
      () => {}
    );
  }, []);

  const setProfile = useCallback(
    (p: Partial<UserProfile>) => {
      save({ ...state, profile: { ...state.profile, ...p } });
    },
    [state, save]
  );

  const completeOnboarding = useCallback(() => {
    save({ ...state, hasCompletedOnboarding: true });
  }, [state, save]);

  const addHabit = useCallback(
    (name: string, emoji: string) => {
      const newHabit: Habit = {
        id: generateId(),
        name,
        emoji,
        completedDates: [],
        createdAt: new Date().toISOString(),
      };
      save({ ...state, habits: [...state.habits, newHabit] });
    },
    [state, save]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      save({ ...state, habits: state.habits.filter((h) => h.id !== id) });
    },
    [state, save]
  );

  const toggleHabit = useCallback(
    (id: string) => {
      const today = todayStr();
      let xpDelta = 0;
      const habits = state.habits.map((h) => {
        if (h.id !== id) return h;
        const alreadyDone = h.completedDates.includes(today);
        if (alreadyDone) {
          xpDelta -= XP_PER_HABIT;
          return {
            ...h,
            completedDates: h.completedDates.filter((d) => d !== today),
          };
        } else {
          xpDelta += XP_PER_HABIT;
          return { ...h, completedDates: [...h.completedDates, today] };
        }
      });
      const newXp = Math.max(0, state.xp + xpDelta);
      save({ ...state, habits, xp: newXp, level: calcLevel(newXp) });
    },
    [state, save]
  );

  const setFitnessProfile = useCallback(
    (profile: FitnessProfile) => {
      save({ ...state, fitnessProfile: profile });
    },
    [state, save]
  );

  const completeWorkout = useCallback(
    (workoutId: string) => {
      const today = todayStr();
      const alreadyDone = state.completedWorkouts.some(
        (w) => w.workoutId === workoutId && w.date === today
      );
      if (alreadyDone) return;
      const newXp = state.xp + XP_PER_WORKOUT;
      save({
        ...state,
        completedWorkouts: [
          ...state.completedWorkouts,
          { workoutId, date: today },
        ],
        xp: newXp,
        level: calcLevel(newXp),
      });
    },
    [state, save]
  );

  const isWorkoutCompleted = useCallback(
    (workoutId: string) => {
      const today = todayStr();
      return state.completedWorkouts.some(
        (w) => w.workoutId === workoutId && w.date === today
      );
    },
    [state.completedWorkouts]
  );

  const addTransaction = useCallback(
    (t: Omit<Transaction, "id" | "date">) => {
      const tx: Transaction = {
        ...t,
        id: generateId(),
        date: new Date().toISOString(),
      };
      save({ ...state, transactions: [tx, ...state.transactions] });
    },
    [state, save]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      save({
        ...state,
        transactions: state.transactions.filter((t) => t.id !== id),
      });
    },
    [state, save]
  );

  const addGroup = useCallback(
    (name: string) => {
      const group: Group = {
        id: generateId(),
        name,
        members: [],
        bills: [],
      };
      save({ ...state, groups: [...state.groups, group] });
    },
    [state, save]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      save({
        ...state,
        groups: state.groups.filter((g) => g.id !== groupId),
      });
    },
    [state, save]
  );

  const addGroupMember = useCallback(
    (groupId: string, name: string) => {
      const member: GroupMember = { id: generateId(), name };
      const groups = state.groups.map((g) =>
        g.id === groupId ? { ...g, members: [...g.members, member] } : g
      );
      save({ ...state, groups });
    },
    [state, save]
  );

  const addBill = useCallback(
    (groupId: string, bill: Omit<Bill, "id" | "date">) => {
      const newBill: Bill = {
        ...bill,
        id: generateId(),
        date: new Date().toISOString(),
      };
      const groups = state.groups.map((g) =>
        g.id === groupId ? { ...g, bills: [...g.bills, newBill] } : g
      );
      save({ ...state, groups });
    },
    [state, save]
  );

  const getBalance = useCallback(() => {
    return state.transactions.reduce((sum, t) => {
      return t.type === "income" ? sum + t.amount : sum - t.amount;
    }, 0);
  }, [state.transactions]);

  const getNetOwed = useCallback(
    (groupId: string) => {
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
            if (fromM && toM)
              result.push({ from: fromM.name, to: toM.name, amount });
          }
        }
      }
      return result;
    },
    [state.groups]
  );

  const addFriend = useCallback(
    (friend: Omit<Friend, "id" | "addedAt">) => {
      const newFriend: Friend = {
        ...friend,
        id: generateId(),
        addedAt: new Date().toISOString(),
      };
      save({ ...state, friends: [...state.friends, newFriend] });
    },
    [state, save]
  );

  const deleteFriend = useCallback(
    (id: string) => {
      save({ ...state, friends: state.friends.filter((f) => f.id !== id) });
    },
    [state, save]
  );

  const getTotalHabitsCompleted = useCallback(() => {
    return state.habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  }, [state.habits]);

  const getTotalWorkoutsCompleted = useCallback(() => {
    return state.completedWorkouts.length;
  }, [state.completedWorkouts]);

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
