import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  label: string;
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

export interface CompletedWorkout {
  date: string;
  workoutId: string;
}

interface AppState {
  habits: Habit[];
  xp: number;
  level: number;
  fitnessProfile: FitnessProfile;
  completedWorkouts: CompletedWorkout[];
  transactions: Transaction[];
  groups: Group[];
}

interface AppContextType extends AppState {
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
  getNetOwed: (
    groupId: string
  ) => { from: string; to: string; amount: number }[];
}

const STORAGE_KEY = "@trackley_state_v2";

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

const defaultState: AppState = {
  habits: [],
  xp: 0,
  level: 1,
  fitnessProfile: { weight: null, height: null, goal: null },
  completedWorkouts: [],
  transactions: [],
  groups: [],
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AppState;
          setState({ ...defaultState, ...parsed });
        } catch {
          setState(defaultState);
        }
      }
      setLoaded(true);
    });
  }, []);

  const save = useCallback((next: AppState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

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
          for (const m of bill.members) {
            shares[m.id] = each;
          }
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
            const fromMember = group.members.find((m) => m.id === from);
            const toMember = group.members.find((m) => m.id === to);
            if (fromMember && toMember) {
              result.push({
                from: fromMember.name,
                to: toMember.name,
                amount,
              });
            }
          }
        }
      }
      return result;
    },
    [state.groups]
  );

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        ...state,
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
