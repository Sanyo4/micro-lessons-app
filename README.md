# Micro Lessons

A voice-first financial literacy app that helps you track spending and learn better money habits through contextual micro-lessons, gamification, and on-device AI.

## Features

- **Voice & Text Input** — Log expenses by speaking or typing naturally ("spent 5 on coffee")
- **On-Device AI** — FunctionGemma (270M) runs entirely on your phone — no data leaves the device
- **Text-to-Speech Output** — AI responses are spoken aloud in voice mode for a fully hands-free experience
- **Contextual Micro-Lessons** — Financial literacy lessons triggered at the right moment (budget exceeded, near limit, unusual spending)
- **Gamification** — XP, levels, streaks, and challenges to build better habits
- **Budget Tracking** — Category-based spending with smart alerts and coaching
- **Privacy by Design** — No cloud, no bank API connections, no external data transmission

## Tech Stack

- **React Native** (0.83) + **Expo** (55)
- **expo-speech-recognition** — On-device speech-to-text
- **expo-speech** — Text-to-speech for AI responses
- **react-native-reanimated** — Smooth animations (sliding toggles, pulse rings, fade-ins)
- **expo-sqlite** — Local database for budgets, challenges, and user profile
- **FunctionGemma** (via cactus-react-native) — On-device LLM with structured function calling

## Getting Started

### Prerequisites

- Node.js 18+
- Android SDK (for Android builds)
- An Android device or emulator (not Expo Go — requires a dev build)

### Install

```bash
npm install
```

### Run (development)

```bash
npx expo run:android
```

### Build release APK

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

## Project Structure

```
app/                  Expo Router screens
  (tabs)/
    index.tsx         Home — voice/text toggle, input, menu chips
    budget.tsx        Budget tracker
    lessons.tsx       Micro-lessons gallery
    challenges.tsx    Active challenges
    how-it-works.tsx  How the app works guide
components/           Reusable UI components
  ModeToggle.tsx      Voice/Text segmented control
  VoiceInput.tsx      Mic button with pulse animation
  ChatInput.tsx       Text input with send button
  MenuChips.tsx       Compact navigation pills
  ConfirmationBanner  AI response display
  MicroLessonModal    Lesson + challenge modal
constants/theme.ts    Design tokens (colors, spacing, typography)
services/             AI, database, function execution
utils/                Gamification helpers
data/                 Lesson content
```

## How It Works

1. **You speak or type** what you spent
2. **FunctionGemma** extracts category, amount, and description using structured function calling
3. **Smart reactions cascade** — budget check, coaching trigger, challenge progress
4. **Contextual lessons appear** at the right moment with actionable challenges

## License

MIT
