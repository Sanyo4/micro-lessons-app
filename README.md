# Micro Lessons — Budget Tracker

A voice-first, multi-sensory budget tracking app designed with vision impairment accessibility as a core feature. Uses on-device AI (FunctionGemma) for natural language spending input with contextual financial micro-lessons.

## Overview

Micro Lessons helps users track spending through voice or text, with:
- **On-device AI** — FunctionGemma 270M processes all input locally (no cloud, no bank APIs)
- **Multi-sensory feedback** — Haptics, tonal audio, and TTS for every budget state
- **Contextual micro-lessons** — Financial education triggered by real spending patterns
- **Gamification** — XP, levels, streaks, and challenges to build better habits
- **PIN-based local auth** — SHA-256 hashed, session-based (PIN every launch)
- **Personalised onboarding** — 8-screen flow with voice or text input paths
- **Privacy by Design** — No cloud, no bank API connections, no external data transmission

## Architecture

```
micro-lessons-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with AuthProvider + auth gate
│   ├── login.tsx                 # PIN entry screen
│   ├── (tabs)/                   # Main app (home, budget, challenges, lessons, how-it-works)
│   └── onboarding/               # 8-screen onboarding flow
│       ├── _layout.tsx           # Stack nav + OnboardingProvider
│       ├── welcome.tsx           # Name + input method
│       ├── motivation.tsx        # Swipeable goal cards
│       ├── voice-income.tsx      # Voice: monthly income
│       ├── voice-bills.tsx       # Voice: regular bills (iterative)
│       ├── voice-flexible.tsx    # Voice: flexible budget
│       ├── text-income.tsx       # Text: numpad income entry
│       ├── text-expenses.tsx     # Text: expense checklist
│       ├── text-spending.tsx     # Text: spending slider
│       ├── persona.tsx           # Communication style (beginner/learner/pro)
│       ├── plan.tsx              # Plan selection (scored by goals)
│       ├── pin-setup.tsx         # Create + confirm PIN
│       └── done.tsx              # Summary + write to DB
├── components/
│   ├── NumPad.tsx                # Reusable 3×4 numpad (PIN, income)
│   ├── OnboardingProgress.tsx    # Step dots + TTS announcement
│   ├── MotivationCard.tsx        # Swipeable goal selection card
│   ├── VoiceInput.tsx            # Mic button with pulse rings
│   ├── BudgetCard.tsx            # Category budget display
│   └── ...                       # AI response, challenges, lessons, etc.
├── services/
│   ├── database.ts               # SQLite schema, migrations, CRUD
│   ├── ai.ts                     # FunctionGemma integration + persona prompts
│   ├── authContext.tsx            # Auth state (PIN verify, session, reset)
│   ├── onboardingContext.tsx      # In-memory onboarding data accumulator
│   ├── onboardingWriter.ts       # Writes onboarding data to all DB tables
│   ├── functionExecutor.ts       # Executes AI function calls
│   ├── audioFeedback.ts          # TTS announcements
│   ├── haptics.ts                # Haptic patterns per budget state
│   └── tonalAudio.ts             # Tonal feedback
├── data/
│   ├── plans.ts                  # 8 financial plans + scoring + categories
│   ├── functionDefs.ts           # AI function schemas (dynamic categories)
│   ├── lessons.ts                # 16 micro-lesson definitions
│   └── seed.ts                   # Conditional seeding (legacy compat only)
├── utils/
│   ├── pin.ts                    # SHA-256 hashing via expo-crypto
│   ├── accessibility.ts          # Screen reader detection + announcements
│   ├── budgetState.ts            # Budget status calculation
│   └── gamification.ts           # XP, levels, challenges
└── constants/
    └── theme.ts                  # Colors (WCAG AA), spacing, typography, category fallbacks
```

## Getting Started

### Running on macOS (M Series — iOS Simulator)

M series Macs run ARM natively, which means `cactus-react-native` and all other native modules work without any special configuration.

**Prerequisites:**
- Node.js 18+
- Xcode (install from the Mac App Store)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

**Install & Run:**
```bash
cd micro-lessons-app
npm install
npx expo run:ios
```

This will:
1. Generate the `/ios` project via Expo prebuild
2. Run `pod install` to link native modules (including cactus-react-native)
3. Build and launch in the iOS Simulator

On first launch, the app downloads the FunctionGemma-270M model (~270MB) to the device. This is a one-time download that runs in the background.

**Note:** Expo Go is not supported — this app uses native modules that require a full dev build, which `expo run:ios` handles automatically.

---

### Running on Android

### Prerequisites
- Node.js 18+
- Android SDK (for Android builds)
- An Android device or emulator (not Expo Go — requires a dev build)

### Install & Run
```bash
cd micro-lessons-app
npm install
npx expo run:android
```

### Build Release APK
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

### Key Dependencies
| Package | Purpose |
|---------|---------|
| `expo` ~55.0.4 | Framework |
| `expo-router` ~55.0.3 | File-based routing |
| `expo-sqlite` ~55.0.10 | Local SQLite database |
| `expo-speech-recognition` ~3.1.1 | Voice input |
| `expo-speech` ~55.0.8 | Text-to-speech output |
| `expo-haptics` | Haptic feedback patterns |
| `expo-crypto` | SHA-256 PIN hashing |
| `cactus-react-native` ~1.7.0 | On-device FunctionGemma AI |
| `react-native-reanimated` ~4.2.2 | Animations |
| `react-native-gesture-handler` | Swipe gestures |

## Authentication

- **PIN-based, local only** — no accounts, no cloud auth
- PIN is SHA-256 hashed via `expo-crypto` before storage
- Session-based: PIN required every app launch (no persistent token)
- "Forgot PIN" triggers full app reset → back to onboarding
- Auth gate in root `_layout.tsx` redirects based on `app_settings` state:
  - No row → new user → onboarding
  - `onboarding_completed = 0` → resume onboarding
  - `onboarding_completed = 1` + not authenticated → login screen
  - Authenticated → main tabs

## Onboarding Flow

8 screens, two parallel paths (voice or text) for financial data entry:

| Step | Screen | Voice Path | Text Path |
|------|--------|-----------|----------|
| 1 | Welcome | Name + input preference | Same |
| 2 | Motivation | Swipeable goal cards (5) | Same |
| 3a | Income | Speak amount | NumPad + frequency toggle |
| 3b | Bills | Iterative "name + amount, say done" | Checklist with amount fields |
| 3c | Flexible | Speak amount (auto-calc available) | Slider £0–£1000 |
| 4 | Persona | Beginner / Learner / Pro | Same |
| 5 | Plan | 3 plans scored by goals | Same |
| 6 | PIN Setup | Create + confirm 4-digit PIN | Same |
| 7 | Done | Summary + write to DB | Same |

Data is accumulated in-memory via `OnboardingContext` and written to DB only on the final screen via `onboardingWriter.ts`.

## Database Schema

### Tables
| Table | Purpose |
|-------|---------|
| `app_settings` | PIN hash, onboarding state, persona, plan, input preference |
| `user_profile` | Name, XP, level, streak, monthly income, flexible budget |
| `budget_categories` | Category ID, name, weekly limit, spent, icon, color |
| `transactions` | Amount, category, description, timestamp |
| `fixed_expenses` | Name, amount, frequency |
| `motivation_focuses` | Focus key, selected flag |
| `completed_lessons` | Lesson ID, completion timestamp |
| `challenges` | Title, type, category, duration, XP reward, progress |

### Migrations
- `user_profile` gets `monthly_income` and `flexible_budget` columns via `ALTER TABLE` (try/catch for idempotency)

## AI System

### FunctionGemma
- **Model:** `functiongemma-270m-it` (on-device, ~270M parameters)
- **Framework:** Cactus React Native wrapper
- Downloaded on first launch, runs entirely on-device

### Function Calling
- 4 user-facing functions: `log_transaction`, `check_budget_status`, `get_spending_summary`, `navigate_to_screen`
- 5 internal functions: `detect_spending_pattern`, `get_micro_lesson`, `create_challenge`, `calculate_savings_impact`, `check_time_triggers`
- Category enums are **dynamic** — loaded from DB `budget_categories` table before each inference

### Persona-Aware Prompts
The AI system prompt includes a communication style directive based on the user's selected persona:
- **Beginner:** "Keep it simple. No financial jargon."
- **Learner:** "Explain the why behind financial concepts."
- **Pro:** "Use precise financial terminology."

### Fallback Parser
When the AI model fails to produce a function call, a keyword-based fallback parser:
1. Checks for navigation intents
2. Extracts amounts via regex
3. Matches category keywords from the selected plan + hardcoded fallbacks
4. Triggers budget checks and lessons as appropriate

## Multi-Sensory Feedback

Every budget state triggers a coordinated feedback sequence:

| State | Haptic | Tone | TTS |
|-------|--------|------|-----|
| Excellent (0–40%) | 3 light pulses, 500ms gaps | Calm | "You're doing great. X% used." |
| Good (40–60%) | 4 light pulses, 300ms gaps | Positive | "On track. X% used." |
| Warning (60–80%) | 5 medium pulses, 150ms gaps | Alert | "Heads up. X% is gone." |
| Critical (80–100%) | 8 heavy pulses, 50ms gaps | Urgent | "Careful. You've used X%." |
| Over Budget (>100%) | SOS-like pattern | Alarm | "You've gone over by £X." |

Sequence: Haptic fires first (near-instant) → Tonal cue (~1s) → TTS announcement.

## Accessibility

- **WCAG AA contrast** on all text and interactive elements
- **48px minimum touch targets** on all buttons and inputs
- **TTS announcements** on screen focus, budget state changes, onboarding steps
- **Screen reader support** — `accessibilityRole`, `accessibilityLabel`, `accessibilityState` on all interactive elements
- **`accessibilityLiveRegion="polite"`** for dynamic content
- **Extended timeouts** when screen reader is active (10s minimum)
- **High contrast mode** — primary palette designed for low vision
- `importantForAccessibility="no"` on decorative emoji

## Plans & Categories

### Plan Pool (8 plans)
| Plan | Focus Tags | Categories |
|------|-----------|-----------|
| The Paycheck Plan | budgeting, expense_tracking | Groceries, Transport, Dining Out, Personal, Fun Money |
| The Safety Net | emergency_fund, budgeting | Essentials, Transport, Emergency Fund, Discretionary |
| The Money Mentor | literacy, expense_tracking | Food & Drink, Getting Around, Social, Shopping, Health, Subscriptions |
| The Milestone Plan | goal_setting, budgeting | Goal Fund, Daily Needs, Wants, Buffer |
| The Spend Audit | expense_tracking, literacy | Coffee & Snacks, Meals, Transport, Entertainment, Impulse Buys, Other |
| The Rainy Day Builder | emergency_fund, goal_setting | Rainy Day Fund, Essentials, Social & Fun, Personal Care |
| The Full Picture | literacy, budgeting, expense_tracking | Food, Transport, Social, Shopping, Entertainment, Wellbeing |
| The Balanced Build | budgeting, goal_setting, emergency_fund | Daily Needs, Fun & Social, Future You, Flex Spending |

Plans are scored by overlap with the user's selected motivation focuses. The top 3 are presented during onboarding. Each plan's categories define the budget categories created for that user, with weekly limits calculated as `flexibleBudget × weeklyLimitPercent / 100 / 4.3`.

### Fallback Plan
**The Foundation Plan** — 4 basic categories (Food & Drink, Transport, Fun, Other) used when user skips plan selection.

## Gamification

### Level System
| Level | Title | XP Required |
|-------|-------|------------|
| 1 | Budget Beginner | 0 |
| 2 | Spending Spotter | 100 |
| 3 | Savvy Saver | 300 |
| 4 | Finance Pro | 600 |
| 5 | Money Master | 1000 |

### XP Awards
- Log transaction: 5 XP
- View lesson: 10 XP
- Accept challenge: 5 XP
- Complete challenge: 30–50 XP

## Recommended Changes

### Taxonomy / Data
All data (lessons, plans, function defs, categories) is in TypeScript files. Recommend extracting to JSON config files for easier editing by non-developers.

### Category Expansion
Plans define categories but the lesson trigger system (`data/lessons.ts`) references specific categories. Lessons should use generic trigger types (e.g., `budget_exceeded`) rather than category-specific ones to work with any plan.

### Function Definitions
`data/functionDefs.ts` category enums are now dynamic, but the fallback parser keyword map should be extended when new plans are added.

### Lesson Content
16 lessons are hardcoded. Consider a JSON-based lesson bank that maps to motivation focus areas for easier expansion.

### Persona System
Currently only affects the AI prompt. Could also adjust:
- Font sizes and information density
- Lesson complexity and terminology
- Challenge difficulty

## Reset & Data

- **Reset from How It Works screen** — "Reset App" button with confirmation dialog
- **Reset from Login screen** — "Forgot PIN?" triggers reset
- **Reset deletes:** all transactions, categories, lessons, challenges, user profile, fixed expenses, motivation focuses, and app settings
- **After reset:** user is redirected to onboarding welcome screen
- **Data lifecycle:** all data is local-only (SQLite), never transmitted externally

## How It Works

1. **You speak or type** what you spent
2. **FunctionGemma** extracts category, amount, and description using structured function calling
3. **Smart reactions cascade** — budget check, coaching trigger, challenge progress
4. **Contextual lessons appear** at the right moment with actionable challenges

## License

MIT
