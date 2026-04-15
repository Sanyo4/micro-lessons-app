// Voice-first single-page layout — all interactions through pet terminal
import { useState, useCallback, useReducer, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import SuggestionChips from '../../components/MenuChips';
import VoiceControl from '../../components/VoiceControl';
import DynamicContentArea, { type ContentState } from '../../components/DynamicContentArea';
import MicroLessonModal from '../../components/MicroLessonModal';
import XPPopup from '../../components/XPPopup';
import HealthMeter from '../../components/pet/HealthMeter';
import {
  getUserProfile,
  getPetProfile,
  getPetHealth,
  createChallenge,
  updateUserXP,
  getBudgetCategories,
  getRecentTransactions,
  getActiveChallenges,
  type UserProfile,
  type PetProfile,
  type Transaction,
} from '../../services/database';
import { aiService, type AIResult, type PendingTransaction } from '../../services/ai';
import { conversationContext } from '../../services/conversationContext';
import { recalculatePetState, getCurrentPetState, type PetMood } from '../../services/petState';
import { recordEngagement } from '../../services/engagement';
import { checkEvolution } from '../../services/petEvolution';
import { getTransactionReaction, getDailyCheckInReaction } from '../../services/petReactions';
import { resolveDialogue } from '../../services/petDialogue';
import { playFullPetFeedback } from '../../services/audioFeedback';
import { XP_AWARDS } from '../../utils/gamification';
import { announceForScreenReader } from '../../utils/accessibility';
import { getSuggestionChips, type ChipState } from '../../utils/suggestionChips';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import { useTheme } from '../../theme';

// Content state reducer
type ContentAction =
  | { type: 'SET_CONTENT'; payload: ContentState }
  | { type: 'CLEAR' };

function contentReducer(state: ContentState | null, action: ContentAction): ContentState | null {
  switch (action.type) {
    case 'SET_CONTENT':
      return action.payload;
    case 'CLEAR':
      return null;
    default:
      return state;
  }
}

export default function HomeScreen() {
  const theme = useTheme();

  // Core state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [petState, setPetState] = useState<PetMood>('neutral');
  const [dialogue, setDialogue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [healthPoints, setHealthPoints] = useState(100);

  // Dynamic content
  const [contentState, dispatchContent] = useReducer(contentReducer, null);

  // Suggestion chips
  const [chips, setChips] = useState<string[]>(["how's my budget?", 'log spending', 'what can I do?']);

  // Shake-to-talk
  const [shakeTrigger, setShakeTrigger] = useState(0);
  useShakeDetector({
    onShake: () => setShakeTrigger((n) => n + 1),
    enabled: !isProcessing,
  });

  // Lesson modal (kept as modal for now)
  const [showLesson, setShowLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<AIResult['lesson']>(null);

  // XP popup
  const [xpPopup, setXpPopup] = useState<{ amount: number; visible: boolean }>({
    amount: 0,
    visible: false,
  });

  const loadData = useCallback(async () => {
    const [p, pet, hp] = await Promise.all([
      getUserProfile(),
      getPetProfile(),
      getPetHealth(),
    ]);
    setProfile(p);
    setPetProfile(pet);
    setHealthPoints(hp);
    if (pet) {
      setPetState(pet.current_state as PetMood);
    }

    // Update suggestion chips
    try {
      const cats = await getBudgetCategories();
      const txns = await getRecentTransactions(1);
      const active = await getActiveChallenges();
      const today = new Date().toDateString();
      const hasToday = txns.length > 0 && new Date(txns[0].timestamp).toDateString() === today;
      const tight = cats
        .filter((c) => c.weekly_limit > 0 && c.spent / c.weekly_limit > 0.8)
        .map((c) => c.name);

      const chipState: ChipState = {
        hasTransactionsToday: hasToday,
        tightCategories: tight,
        hasActiveQuest: active.length > 0,
        petName: pet?.name ?? 'Buddy',
      };
      setChips(getSuggestionChips(chipState));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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

    // Daily check-in with contextual hint
    (async () => {
      try {
        const state = await getCurrentPetState();
        const reaction = getDailyCheckInReaction(state);
        let text = await resolveDialogue(reaction.templateKey, reaction.slotValues);

        // Append contextual suggestion for discoverability
        const cats = await getBudgetCategories();
        const active = await getActiveChallenges();
        const txns = await getRecentTransactions(1);
        const today = new Date().toDateString();
        const hasToday = txns.length > 0 && new Date(txns[0].timestamp).toDateString() === today;

        if (!hasToday) {
          text += " Tell me what you've spent today!";
        } else if (active.length > 0) {
          text += ' Ask me about your quest progress!';
        } else {
          const tight = cats.find((c) => c.weekly_limit > 0 && c.spent / c.weekly_limit > 0.8);
          if (tight) {
            text += ` Try saying "how's my budget?"`;
          }
        }

        if (mounted) setDialogue(text);
      } catch {}
    })();

    // Check time-based triggers
    aiService.checkTimeTriggers().then((result) => {
      if (mounted && result?.lesson) {
        setCurrentLesson(result.lesson);
        setTimeout(() => { setShowLesson(true); conversationContext.startLessonOffer(); }, 1500);
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

    try {
      const result = await aiService.parseUserInput(text);

      // Handle lesson accept/dismiss from voice
      if (result.lessonAction) {
        if (result.lessonAction === 'accept') {
          await handleAcceptChallenge();
        } else {
          setShowLesson(false);
          setDialogue(result.responseText || 'No worries, maybe next time!');
        }
        setIsProcessing(false);
        return;
      }

      // Handle settings navigation
      if (result.executedFunctions[0]?.functionName === 'open_settings') {
        router.push('/settings/profile' as any);
        setIsProcessing(false);
        return;
      }

      // If conversation context intercepted and wants to execute a transaction
      if (result.pendingTransaction && result.contentType !== 'confirmation') {
        // This means the context said "execute" — run confirmed transaction
        await executeTransaction(result.pendingTransaction);
        return;
      }

      // Show content card if applicable
      if (result.contentType && result.contentType !== 'idle') {
        dispatchContent({
          type: 'SET_CONTENT',
          payload: {
            type: result.contentType,
            data: result.executedFunctions[0]?.data ?? result.pendingTransaction ?? {},
            responseText: result.responseText,
          },
        });
      } else if (result.contentType === 'idle' || (!result.contentType && !result.pendingTransaction)) {
        // Clear content on idle or generic response
        if (!result.pendingTransaction) {
          dispatchContent({ type: 'CLEAR' });
        }
      }

      // If pending transaction (confirmation flow), show the confirmation card
      if (result.pendingTransaction && result.contentType === 'confirmation') {
        const p = result.pendingTransaction;
        const projected = p.budgetLimit > 0
          ? Math.round(((p.budgetSpent + p.amount) / p.budgetLimit) * 100)
          : 0;
        dispatchContent({
          type: 'SET_CONTENT',
          payload: {
            type: 'confirmation',
            data: result.pendingTransaction,
            responseText: `\u00A3${p.amount.toFixed(2)} on ${p.categoryName}. That'll put you at ${projected}% for the week. Say yes to confirm or no to cancel.`,
          },
        });
        setDialogue(`\u00A3${p.amount.toFixed(2)} on ${p.categoryName}. Confirm?`);
      }

      // Show pet dialogue
      if (result.responseText && !result.pendingTransaction) {
        setDialogue(result.responseText);
      }

      if (result.xpEarned > 0) {
        showXPPopup(result.xpEarned);
      }

      if (result.lesson) {
        setCurrentLesson(result.lesson);
        setTimeout(() => { setShowLesson(true); conversationContext.startLessonOffer(); }, 800);
      }
    } catch {
      setDialogue("Hmm, something went wrong. Try again!");
    } finally {
      setIsProcessing(false);
      loadData(); // Refresh chips + state
    }
  };

  const executeTransaction = async (pending: PendingTransaction) => {
    try {
      const result = await aiService.executeConfirmedTransaction(pending);

      await recordEngagement('transaction_log');
      await loadData();

      // Recalculate pet state
      const stateResult = await recalculatePetState('transaction');
      setPetState(stateResult.newState);
      setHealthPoints(stateResult.newHealth);

      if (stateResult.stateChanged && petProfile) {
        playFullPetFeedback(stateResult.newState, petProfile.name);
      }

      // Pet reaction dialogue
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

      if (result.xpEarned > 0) {
        showXPPopup(result.xpEarned);
      }

      if (result.lesson) {
        setCurrentLesson(result.lesson);
        setTimeout(() => { setShowLesson(true); conversationContext.startLessonOffer(); }, 800);
      }

      // Show game card if triggered
      if (result.game) {
        dispatchContent({
          type: 'SET_CONTENT',
          payload: {
            type: result.game === 'needs_vs_wants' ? 'game_needs_vs_wants' : 'game_bnpl',
            data: {},
            responseText: result.game === 'needs_vs_wants'
              ? "I've noticed a few fun purchases lately. Let's play a quick game! Say 'start' when ready."
              : "I've spotted some BNPL purchases. Let me show you something interesting. Say 'start' when ready.",
          },
        });
      } else {
        // Clear confirmation card after successful transaction
        dispatchContent({ type: 'CLEAR' });
      }
    } catch {
      setDialogue("Something went wrong logging that. Try again!");
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
  const showChips = !contentState; // Hide chips when content card is showing

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.base.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Scrollable content area */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
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
            <PetTerminal petState={petState} petName={petName} healthPoints={healthPoints} />
          </Animated.View>

          {/* Speech Bubble */}
          {dialogue ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <SpeechBubble message={dialogue} />
            </Animated.View>
          ) : null}

          {/* Suggestion Chips — only when no content card */}
          {showChips && (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <SuggestionChips
                chips={chips}
                onChipPress={handleSend}
                disabled={isProcessing}
              />
            </Animated.View>
          )}

          {/* Dynamic Content Area */}
          <DynamicContentArea contentState={contentState} />
        </ScrollView>

        {/* Fixed Footer — Voice/Text Control */}
        <VoiceControl onSend={handleSend} isProcessing={isProcessing} shakeTrigger={shakeTrigger} />

        {/* XP Popup */}
        <XPPopup amount={xpPopup.amount} visible={xpPopup.visible} />

        {/* Lesson Modal (kept as modal for now) */}
        <MicroLessonModal
          visible={showLesson}
          lesson={currentLesson}
          onAcceptChallenge={handleAcceptChallenge}
          onDismiss={() => { setShowLesson(false); conversationContext.reset(); }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
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
});
