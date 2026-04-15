// Brief 04 — Challenges as Quest Log terminal view
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  getActiveChallenges,
  getCompletedChallenges,
  createChallenge,
  updateUserXP,
  type Challenge,
} from '../../services/database';
import { XP_AWARDS } from '../../utils/gamification';
import { useTheme } from '../../theme';

export default function ChallengesScreen() {
  const theme = useTheme();
  const [active, setActive] = useState<Challenge[]>([]);
  const [completed, setCompleted] = useState<Challenge[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);

  const load = useCallback(async () => {
    const [a, c] = await Promise.all([getActiveChallenges(), getCompletedChallenges()]);
    setActive(a);
    setCompleted(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAcceptStarter = async () => {
    setIsAccepting(true);
    try {
      await createChallenge({
        title: 'Track every purchase',
        description: 'Log each purchase for 3 days',
        type: 'track_purchases',
        category: 'general',
        duration_days: 3,
        xp_reward: 30,
      });
      await updateUserXP(XP_AWARDS.ACCEPT_CHALLENGE);
      await load();
    } finally {
      setIsAccepting(false);
    }
  };

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  const progressBar = (progress: number, total: number) => {
    const filled = Math.min(Math.round((progress / total) * 8), 8);
    const empty = 8 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {'── Quest Log ──'}
          </Text>

          {/* Active */}
          {active.length > 0 ? (
            active.map((ch) => (
              <View key={ch.id} style={styles.questBlock}>
                <Text style={[styles.termLabel, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                  {'* ACTIVE'}
                </Text>
                <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                  {`"${ch.title}"`}
                </Text>
                <Text
                  style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}
                  accessibilityLabel={`Progress: ${ch.progress} of ${ch.duration_days} days`}
                >
                  {`Progress: ${progressBar(ch.progress, ch.duration_days)} ${ch.progress}/${ch.duration_days} days`}
                </Text>
                <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.7 }]}>
                  {`Reward: +${ch.xp_reward} care points`}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.questBlock}>
              <Text style={[styles.termLabel, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                {'○ AVAILABLE'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                {'"Track every purchase"'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.7 }]}>
                {'Reward: +30 care points'}
              </Text>
            </View>
          )}

          {/* Completed */}
          {completed.map((ch) => (
            <View key={ch.id} style={styles.questBlock}>
              <Text style={[styles.termLabel, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.6 }]}>
                {'[ok] COMPLETED'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.6 }]}>
                {`"${ch.title}"`}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.5 }]}>
                {`+${ch.xp_reward} care points earned`}
              </Text>
            </View>
          ))}
        </View>

        {/* Accept button when no active challenges */}
        {active.length === 0 && (
          <Pressable
            onPress={handleAcceptStarter}
            disabled={isAccepting}
            accessibilityLabel="Accept starter challenge"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.acceptBtn,
              {
                backgroundColor: pressed ? theme.colors.interactive.primaryPressed : theme.colors.interactive.primary,
                borderRadius: theme.radius.xl,
                opacity: isAccepting ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.acceptBtnText, { color: theme.colors.interactive.primaryText }]}>
              {isAccepting ? 'Accepting...' : 'Accept Challenge'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, gap: 16 },
  terminal: { padding: 16 },
  termHeader: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
  termLabel: { fontSize: 14, marginTop: 8, fontWeight: '700' },
  termText: { fontSize: 14, lineHeight: 22 },
  questBlock: { marginBottom: 12 },
  acceptBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  acceptBtnText: { fontSize: 16, fontWeight: '700' },
});
