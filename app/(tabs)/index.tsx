// Brief 04 — Pet-centric home screen
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import ChatInput from '../../components/ChatInput';
import VoiceInput from '../../components/VoiceInput';
import MicroLessonModal from '../../components/MicroLessonModal';
import XPPopup from '../../components/XPPopup';
import {
  getUserProfile,
  getPetProfile,
  createChallenge,
  updateUserXP,
  getBudgetCategories,
  type UserProfile,
  type PetProfile,
} from '../../services/database';
import { aiService, type AIResult } from '../../services/ai';
import { recalculatePetState, getCurrentPetState, type PetMood } from '../../services/petState';
import { recordEngagement } from '../../services/engagement';
import { checkEvolution } from '../../services/petEvolution';
import { getTransactionReaction, getDailyCheckInReaction } from '../../services/petReactions';
import { resolveDialogue } from '../../services/petDialogue';
import { playFullPetFeedback } from '../../services/audioFeedback';
import { XP_AWARDS } from '../../utils/gamification';
import { announceForScreenReader } from '../../utils/accessibility';
import { useTheme } from '../../theme';

export default function HomeScreen() {
  const theme = useTheme();

  // Core state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [petState, setPetState] = useState<PetMood>('neutral');
  const [dialogue, setDialogue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [showTransactionSheet, setShowTransactionSheet] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');

  // Lesson modal
  const [showLesson, setShowLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<AIResult['lesson']>(null);

  // XP popup
  const [xpPopup, setXpPopup] = useState<{ amount: number; visible: boolean }>({
    amount: 0,
    visible: false,
  });

  const loadData = useCallback(async () => {
    const [p, pet] = await Promise.all([getUserProfile(), getPetProfile()]);
    setProfile(p);
    setPetProfile(pet);
    if (pet) {
      setPetState(pet.current_state as PetMood);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Init AI on first mount
  useEffect(() => {
    let mounted = true;
    if (!aiService.getInitStatus()) {
      aiService
        .init()
        .then(() => { if (mounted) setIsModelReady(true); })
        .catch(() => { if (mounted) setIsModelReady(true); });
    } else {
      setIsModelReady(true);
    }

    // Daily check-in dialogue
    (async () => {
      try {
        const state = await getCurrentPetState();
        const reaction = getDailyCheckInReaction(state);
        const text = await resolveDialogue(reaction.templateKey, reaction.slotValues);
        if (mounted) setDialogue(text);
      } catch {}
    })();

    // Check time-based triggers
    aiService.checkTimeTriggers().then((result) => {
      if (mounted && result?.lesson) {
        setCurrentLesson(result.lesson);
        setTimeout(() => setShowLesson(true), 1500);
      }
    }).catch(() => {});

    // Check evolution
    checkEvolution().catch(() => {});

    return () => { mounted = false; };
  }, []);

  const showXPPopup = (amount: number) => {
    setXpPopup({ amount, visible: true });
    announceForScreenReader(`Earned ${amount} care points`);
    setTimeout(() => setXpPopup({ amount: 0, visible: false }), 1500);
  };

  const handleSend = async (text: string) => {
    setIsProcessing(true);
    setShowTransactionSheet(false);

    try {
      const result = await aiService.processUserInput(text);

      // Handle navigation
      if (result.navigateTo) {
        const routeMap: Record<string, string> = {
          budget: '/budget',
          lessons: '/lessons',
          challenges: '/challenges',
          home: '/',
          history: '/history',
        };
        const route = routeMap[result.navigateTo];
        if (route && route !== '/') {
          router.navigate(route as '/budget' | '/lessons' | '/challenges' | '/history');
        }
        setIsProcessing(false);
        return;
      }

      // Refresh profile
      await loadData();

      // Handle transaction — wire pet reactions
      const hasTransaction = result.executedFunctions.some(f => f.functionName === 'log_transaction');
      if (hasTransaction) {
        // Record engagement
        await recordEngagement('transaction_log');

        // Recalculate pet state
        const stateResult = await recalculatePetState('transaction');
        setPetState(stateResult.newState);

        // Fire multi-sensory feedback on state change
        if (stateResult.stateChanged && petProfile) {
          playFullPetFeedback(stateResult.newState, petProfile.name);
        }

        // Generate pet reaction dialogue
        const logFn = result.executedFunctions.find(f => f.functionName === 'log_transaction');
        if (logFn?.success) {
          const data = logFn.data as { percentage?: number; budgetStatus?: { spent: number; weekly_limit: number } } | undefined;
          const percentage = data?.percentage ?? 0;
          const budgetStatus = data?.budgetStatus;
          const remaining = budgetStatus ? budgetStatus.weekly_limit - budgetStatus.spent : 0;
          const category = (logFn.params as Record<string, unknown>).category as string;
          const amount = (logFn.params as Record<string, unknown>).amount as number;

          const reaction = getTransactionReaction(category, amount, remaining, percentage);
          const dialogueText = await resolveDialogue(reaction.templateKey, reaction.slotValues);
          setDialogue(dialogueText);
        }
      } else if (result.responseText) {
        setDialogue(result.responseText);
      }

      if (result.xpEarned > 0) {
        showXPPopup(result.xpEarned);
      }

      if (result.lesson) {
        setCurrentLesson(result.lesson);
        setTimeout(() => setShowLesson(true), 800);
      }
    } catch {
      setDialogue("Hmm, something went wrong. Try again!");
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
    setDialogue(`Challenge accepted! "${template.title}" — let's do this!`);
  };

  const petName = petProfile?.name ?? 'Buddy';
  const stateColor = theme.colors.petStates[petState];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.base.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.container, { padding: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Settings gear */}
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/settings/profile' as any)}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Text style={[styles.settingsIcon, { color: theme.colors.base.textSecondary }]}>
              {'[=]'}
            </Text>
          </Pressable>

          {/* AI loading indicator */}
          {!isModelReady && (
            <Text style={[styles.loadingText, { color: theme.colors.base.textSecondary }]}>
              Loading AI...
            </Text>
          )}

          {/* Pet Terminal */}
          <Animated.View entering={FadeIn.duration(600)}>
            <PetTerminal petState={petState} petName={petName} />
          </Animated.View>

          {/* Speech Bubble */}
          {dialogue ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <SpeechBubble message={dialogue} />
            </Animated.View>
          ) : null}

          {/* Primary CTA: Log Spending */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Pressable
              onPress={() => setShowTransactionSheet(true)}
              disabled={isProcessing}
              accessibilityLabel="Log spending"
              accessibilityRole="button"
              accessibilityHint="Open the transaction input"
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: pressed ? theme.colors.interactive.primaryPressed : theme.colors.interactive.primary,
                  borderRadius: theme.radius.xl,
                  borderBottomWidth: pressed ? 0 : 3,
                  borderBottomColor: theme.colors.interactive.primaryPressed,
                  opacity: isProcessing ? 0.6 : 1,
                },
                pressed ? theme.shadows.pressed : theme.shadows.md,
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.interactive.primaryText }]}>
                Log Spending
              </Text>
            </Pressable>
          </Animated.View>

          {/* Secondary Buttons */}
          <View style={styles.secondaryRow}>
            <Pressable
              onPress={() => router.navigate('/budget')}
              accessibilityLabel="View budget"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary,
                  borderRadius: theme.radius.xl,
                  borderBottomWidth: pressed ? 0 : 2,
                  borderBottomColor: theme.colors.interactive.secondaryPressed,
                },
                pressed ? theme.shadows.pressed : theme.shadows.sm,
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.interactive.secondaryText }]}>
                Budget
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.navigate('/challenges')}
              accessibilityLabel="View challenges"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary,
                  borderRadius: theme.radius.xl,
                  borderBottomWidth: pressed ? 0 : 2,
                  borderBottomColor: theme.colors.interactive.secondaryPressed,
                },
                pressed ? theme.shadows.pressed : theme.shadows.sm,
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.interactive.secondaryText }]}>
                Challenges
              </Text>
            </Pressable>
          </View>

          {/* Status Bar */}
          <Pressable
            onPress={() => router.navigate('/history')}
            accessibilityLabel={`Status: ${stateColor.label}. ${profile?.streak_days ?? 0} day streak. Tap for history.`}
            style={[styles.statusBar, { borderColor: theme.colors.base.border }]}
          >
            <View style={[styles.statusDot, { backgroundColor: stateColor.medium }]} />
            <Text style={[styles.statusText, { color: theme.colors.base.textSecondary }]}>
              {stateColor.label}
            </Text>
            <Text style={[styles.statusSeparator, { color: theme.colors.base.border }]}>
              {' · '}
            </Text>
            <Text style={[styles.statusText, { color: theme.colors.base.textSecondary }]}>
              Streak: {profile?.streak_days ?? 0}d
            </Text>
          </Pressable>
        </ScrollView>

        {/* Transaction Input Bottom Sheet */}
        <Modal
          visible={showTransactionSheet}
          animationType="slide"
          transparent
          onRequestClose={() => setShowTransactionSheet(false)}
        >
          <Pressable style={styles.sheetOverlay} onPress={() => setShowTransactionSheet(false)}>
            <Pressable style={styles.sheetBlockTap} onPress={() => {}}>
              <Animated.View
                entering={SlideInDown.duration(300)}
                exiting={SlideOutDown.duration(200)}
                style={[
                  styles.sheet,
                  {
                    backgroundColor: theme.colors.base.background,
                    borderTopLeftRadius: theme.radius.lg,
                    borderTopRightRadius: theme.radius.lg,
                  },
                  theme.shadows.lg,
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.colors.base.border }]} />
                <Text
                  style={[styles.sheetTitle, {
                    color: theme.colors.base.textPrimary,
                    fontFamily: theme.fontsLoaded ? theme.fonts.heading : undefined,
                  }]}
                >
                  Log a transaction
                </Text>
                <Text style={[styles.sheetHint, { color: theme.colors.base.textSecondary }]}>
                  Say or type what you spent:
                </Text>

                {/* Input mode toggle */}
                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => setInputMode('text')}
                    accessibilityRole="button"
                    accessibilityLabel="Text input mode"
                    style={[
                      styles.modeTab,
                      {
                        backgroundColor: inputMode === 'text' ? theme.colors.interactive.primary : 'transparent',
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    <Text style={{ color: inputMode === 'text' ? theme.colors.interactive.primaryText : theme.colors.base.textSecondary, fontSize: theme.typeScale.bodyLarge }}>
                      Text
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setInputMode('voice')}
                    accessibilityRole="button"
                    accessibilityLabel="Voice input mode"
                    style={[
                      styles.modeTab,
                      {
                        backgroundColor: inputMode === 'voice' ? theme.colors.interactive.primary : 'transparent',
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    <Text style={{ color: inputMode === 'voice' ? theme.colors.interactive.primaryText : theme.colors.base.textSecondary, fontSize: theme.typeScale.bodyLarge }}>
                      Voice
                    </Text>
                  </Pressable>
                </View>

                {inputMode === 'voice' ? (
                  <VoiceInput onTranscript={handleSend} isProcessing={isProcessing} />
                ) : (
                  <ChatInput onSend={handleSend} isProcessing={isProcessing} embedded prominent />
                )}
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* XP Popup */}
        <XPPopup amount={xpPopup.amount} visible={xpPopup.visible} />

        {/* Lesson Modal */}
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
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    gap: 16,
  },
  settingsButton: {
    alignSelf: 'flex-end',
    padding: 8,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18, fontWeight: '600' },
  loadingText: { textAlign: 'center', fontSize: 14 },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: { fontSize: 14 },
  statusSeparator: { fontSize: 14 },
  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetBlockTap: {},
  sheet: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
});
