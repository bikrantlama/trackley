# Trackley — Your Lifestyle OS 🚀

> A premium React Native lifestyle companion that turns daily habits into an epic journey. Track habits, finances, fitness, and friendships — all gamified with XP, levels, and ranks.

[![Made with Expo](https://img.shields.io/badge/Made%20with-Expo-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-21.x-FFCA28?logo=firebase)](https://firebase.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

### 🎮 Gamification Engine
- **XP & Leveling** — Exponential scaling algorithm. Every habit, workout, and achievement earns XP.
- **7 Rank Tiers** — Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- **Coin Economy** — Earn coins, spend them in the in-app store on exclusive themes and avatar borders
- **13 Achievements** — Auto-unlocked milestones across habits, fitness, finance, and social

### 🔥 Habit Tracking
- **Real consecutive streak counters** — 🔥 fire badges for unbroken daily chains
- **Smart notifications** — 3-stage daily reminder sequence (on time, +5 min, +10 min snooze)
- **Priority system** — High / Medium / Low priority with color-coded cards
- **Quick-add presets** in onboarding — 12 curated beginner habits

### 💰 Finance Tracker
- **Income & expense logging** with 10 categories
- **Spending breakdown bar** — color-coded category visualization
- **Group bill splitting** — equal or percentage-based splits with net-owed calculations
- **Real-time balance** and transaction history

### 💪 Fitness Module
- **BMI tracker** with category labels (Underweight / Normal / Overweight / Obese)
- **Workout library** with completion tracking
- **Fitness goal selection** — 6 goals (Lose Weight, Build Muscle, Stay Fit, Endurance, Flexibility, Longevity)
- **Step counter** via device pedometer

### 👥 Social & Leaderboard
- **Friends system** — add friends by code, view their stats
- **Live leaderboard** — ranked by XP with rank badges
- **Verified profiles**

### 🎨 Design System
- **Glassmorphism** UI with blur, transparency, and crystal-card components
- **10+ unlockable themes** — Crystal, Obsidian, Emerald, Rose Gold, Midnight Pro, Cyberpunk, Deep Sea, Royal Velvet, Titanium, Phantom
- **5 avatar borders** — from Crystal Ring to Crimson Elite
- **Haptic feedback** throughout the entire experience
- **Dark mode** native from the ground up

### 🔐 Auth & Data
- **Firebase Authentication** — email/password
- **Firestore cloud sync** — real-time, cross-device
- **AsyncStorage offline cache** — works without internet
- **Demo Mode** — explore everything without signing up

---

## 📱 Screens

| Screen | Description |
|---|---|
| **Onboarding** | 3-step animated setup: name → goal → first habits |
| **Dashboard** | Stats overview, habit list with streaks, BMI, coin counter |
| **Habits** | Full habit management with streaks, priorities, animated XP bar |
| **Finance** | Transaction log, spending breakdown, group splitting |
| **Fitness** | Workout library, BMI, step count, fitness goal |
| **Achievements** | Milestone gallery with XP earned vs total |
| **Friends** | Leaderboard, friend search, add by code |
| **Store** | Themes, avatar borders, XP boosts |
| **Profile** | Settings, theme picker, progress photos |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81 + Expo 54 |
| **Language** | TypeScript 5.9 |
| **Navigation** | Expo Router (file-based, same as Next.js) |
| **Animations** | React Native Reanimated 4 + Animated API |
| **State** | React Context API (`AppContext`) |
| **Backend** | Firebase Auth + Cloud Firestore |
| **Offline** | AsyncStorage with cloud sync |
| **Styling** | StyleSheet + Custom design tokens |
| **Icons** | Expo Vector Icons (Ionicons + Material Community Icons) |
| **Fonts** | Inter (via `@expo-google-fonts/inter`) |
| **Build** | Expo Application Services (EAS) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/eas/) for production builds

### 1. Clone & Install

```bash
git clone https://github.com/bikrantlama/trackley.git
cd trackley
npm install
```

### 2. Configure Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Email/Password Authentication**
3. Create a **Cloud Firestore** database
4. Download config files:
   - `google-services.json` → project root (Android)
   - `GoogleService-Info.plist` → project root (iOS)

### 3. Run Development

```bash
npm run dev
# or: npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your phone.

---

## 🏗️ Building for Production

### Preview Build (test on real device, no store)

```bash
# Android APK (sideload)
eas build --profile preview --platform android

# iOS (requires Apple Developer account)
eas build --profile preview --platform ios
```

### Production Build (App Store / Play Store)

```bash
# Both platforms
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### OTA Updates (no new app version needed)

```bash
eas update --channel production --message "Fix: onboarding flow"
```

---

## 📁 Project Structure

```
trackley/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation screens
│   │   ├── index.tsx       # Dashboard
│   │   ├── habits.tsx      # Habits tab
│   │   ├── finance.tsx     # Finance tab
│   │   ├── fitness.tsx     # Fitness tab
│   │   └── ...
│   ├── auth.tsx            # Login / Register
│   ├── onboarding.tsx      # 3-step onboarding
│   └── _layout.tsx         # Root layout & routing
├── features/               # Feature-specific components
│   ├── habits/
│   ├── finance/
│   ├── fitness/
│   ├── achievements/
│   ├── social/
│   └── profile/
├── components/             # Shared UI components
│   ├── CrystalCard.tsx     # Glassmorphism card
│   ├── TrackleyLogo.tsx    # App logo
│   └── ErrorBoundary.tsx
├── context/
│   └── AppContext.tsx      # Global state + all business logic
├── constants/
│   └── themes.ts           # 10+ color themes
├── hooks/
│   └── useTheme.ts         # Active theme hook
└── lib/
    └── firebase.ts         # Firebase client config
```

---

## 🔒 Security

- All Firestore reads/writes are authenticated — rules reject unauthenticated access
- No sensitive keys are committed — Firebase config files are in `.gitignore`
- Demo mode uses a sandboxed local state — no cloud writes

---

## 🗺️ Roadmap

- [ ] Apple Watch companion app
- [ ] Widget support (iOS WidgetKit / Android Glance)
- [ ] Workout history charts
- [ ] Monthly budget caps with spending alerts
- [ ] Social habit challenges between friends
- [ ] Web dashboard at trackley.app

---

## 👨‍💻 Author

**Bikrant Lama**
- GitHub: [@bikrantlama](https://github.com/bikrantlama)

---

## 📄 License

MIT © 2025 Bikrant Lama. See [LICENSE](LICENSE) for details.
