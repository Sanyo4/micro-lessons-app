import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ChatInput from '../../components/ChatInput';
import ConfirmationBanner from '../../components/ConfirmationBanner';
import type { BannerType } from '../../components/ConfirmationBanner';
import MicroLessonModal from '../../components/MicroLessonModal';
import XPPopup from '../../components/XPPopup';
import ModeToggle from '../../components/ModeToggle';
import VoiceInput from '../../components/VoiceInput';
import MenuChips from '../../components/MenuChips';
import {
  getUserProfile,
  createChallenge,
  updateUserXP,
  type UserProfile,
} from '../../services/database';
import { aiService, type AIResult } from '../../services/ai';
import { XP_AWARDS, getXPForNextLevel, getLevelTitle } from '../../utils/gamification';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import * as Speech from 'expo-speech';

type InputMode = 'voice' | 'text';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const inputModeRef = useRef<InputMode>('text');

  const handleModeChange = useCallback((mode: InputMode) => {
    Speech.stop();
    setInputMode(mode);
    inputModeRef.current = mode;
  }, []);

  // Banner
  const [banner, setBanner] = useState<{
    message: string;
    type: BannerType;
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  // Lesson modal
  const [showLesson, setShowLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<AIResult['lesson']>(null);

  // XP popup
  const [xpPopup, setXpPopup] = useState<{ amount: number; visible: boolean }>({
    amount: 0,
    visible: false,
  });

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => keyboardListener.remove();
  }, []);

  const loadProfile = useCallback(async () => {
    const p = await getUserProfile();
    setProfile(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // Init AI on first mount
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (!aiService.getInitStatus()) {
        aiService
          .init((progress) => {
            if (mounted) setModelLoadProgress(progress);
          })
          .then(() => {
            if (mounted) setIsModelReady(true);
          })
          .catch(() => {
            if (mounted) setIsModelReady(true);
          });

        aiService.checkTimeTriggers().then((result) => {
          if (mounted && result?.lesson) {
            setCurrentLesson(result.lesson);
            setTimeout(() => setShowLesson(true), 1000);
          }
        }).catch(() => {});
      } else {
        setIsModelReady(true);
      }
      return () => { mounted = false; };
    }, [])
  );

  const speak = useCallback((text: string) => {
    if (inputModeRef.current !== 'voice') return;
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.95 });
  }, []);

  const showBanner = (message: string, type: BannerType) => {
    setBanner({ message, type, visible: true });
    speak(message);
  };

  const showXPPopup = (amount: number) => {
    setXpPopup({ amount, visible: true });
    setTimeout(() => setXpPopup({ amount: 0, visible: false }), 1500);
  };

  const handleSend = async (text: string) => {
    setIsProcessing(true);

    try {
      const result = await aiService.processUserInput(text);

      // Handle navigation
      if (result.navigateTo) {
        const routeMap: Record<string, string> = {
          budget: '/budget',
          lessons: '/lessons',
          challenges: '/challenges',
          home: '/',
          'how-it-works': '/how-it-works',
        };
        const route = routeMap[result.navigateTo];
        if (route && route !== '/') {
          router.navigate(route as '/budget' | '/lessons' | '/challenges' | '/how-it-works');
        }
        setIsProcessing(false);
        return;
      }

      // Refresh profile after processing
      await loadProfile();

      const hasExceeded = result.executedFunctions.some(
        (f) => f.functionName === 'check_budget_status' && (f.data as { exceeded?: boolean })?.exceeded
      );
      const bannerType: BannerType = hasExceeded ? 'warning' : result.executedFunctions.length > 0 ? 'success' : 'info';

      showBanner(result.responseText, bannerType);

      if (result.xpEarned > 0) {
        showXPPopup(result.xpEarned);
      }

      if (result.lesson) {
        setCurrentLesson(result.lesson);
        setTimeout(() => setShowLesson(true), 800);
      }
    } catch {
      showBanner("Something went wrong. Try again!", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptChallenge = async () => {
    if (!currentLesson?.challengeTemplate) return;

    const template = currentLesson.challengeTemplate;
    await createChallenge({
      title: template.title,
      description: template.description,
      type: template.type,
      category: currentLesson.triggerType === 'budget_exceeded' ? 'coffee' : 'general',
      duration_days: template.duration_days,
      xp_reward: template.xp_reward,
    });

    await updateUserXP(XP_AWARDS.ACCEPT_CHALLENGE);
    showXPPopup(XP_AWARDS.ACCEPT_CHALLENGE);
    setShowLesson(false);
    showBanner(
      `Challenge accepted! "${template.title}" — ${template.duration_days} days for +${template.xp_reward} XP`,
      'success'
    );
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const xpInfo = profile ? getXPForNextLevel(profile.xp) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Title block */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.titleBlock}>
            <Text style={styles.appTitle}>MICRO{'\n'}LESSONS</Text>
            <View style={styles.titleDivider} />
            {!isModelReady && (
              <Text style={styles.loadingText}>
                Loading AI... {Math.round(modelLoadProgress * 100)}%
              </Text>
            )}
          </Animated.View>

          {/* 2. Greeting */}
          <Text style={styles.greeting}>
            {greeting}, {profile?.name ?? 'there'}
          </Text>

          {/* 3. Voice/Text Toggle — hero element */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <ModeToggle mode={inputMode} onModeChange={handleModeChange} />
          </Animated.View>

          {/* 4. Input Area — conditional */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {inputMode === 'voice' ? (
              <VoiceInput
                onTranscript={handleSend}
                isProcessing={isProcessing}
              />
            ) : (
              <ChatInput
                onSend={handleSend}
                isProcessing={isProcessing}
                embedded
                prominent
              />
            )}
          </Animated.View>

          {/* 5. Confirmation Banner */}
          <ConfirmationBanner
            message={banner.message}
            type={banner.type}
            visible={banner.visible}
            onDismiss={() => setBanner((b) => ({ ...b, visible: false }))}
          />

          {/* 6. Menu Chips */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <MenuChips />
          </Animated.View>

          {/* 7. Level/XP/Streak Row */}
          {profile && (
            <View style={styles.levelRow}>
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>Lv {profile.level}</Text>
              </View>
              {xpInfo && (
                <Text style={styles.xpText}>
                  {xpInfo.current}/{xpInfo.needed} XP
                </Text>
              )}
              {profile.streak_days > 0 && (
                <Text style={styles.streakText}>🔥 {profile.streak_days}</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* XP Popup */}
        <XPPopup amount={xpPopup.amount} visible={xpPopup.visible} />

        {/* Micro Lesson Modal */}
        <MicroLessonModal
          visible={showLesson}
          lesson={currentLesson}
          onAcceptChallenge={handleAcceptChallenge}
          onDismiss={() => setShowLesson(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.lg,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 8,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 34,
  },
  titleDivider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.primary,
    marginTop: Spacing.md,
    borderRadius: 1,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  levelPill: {
    backgroundColor: Colors.levelPurple,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  levelText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  streakText: {
    fontSize: FontSize.sm,
  },
});
