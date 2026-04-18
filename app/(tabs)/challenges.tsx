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
  getUserProfile,
  type Challenge,
  type UserProfile,
} from '../../services/database';
import { XP_AWARDS, calculateLevel, getLevelTitle, getXPForNextLevel } from '../../utils/gamification';
import { useTheme } from '../../theme';

export default function ChallengesScreen() {
  const theme = useTheme();
  const [active, setActive] = useState<Challenge[]>([]);
  const [completed, setCompleted] = useState<Challenge[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const load = useCallback(async () => {
    const [a, c, p] = await Promise.all([getActiveChallenges(), getCompletedChallenges(), getUserProfile()]);
    setActive(a);
    setCompleted(c);
    setProfile(p);
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
  const fs = theme.fontScale;

  const progressBar = (progress: number, total: number) => {
    const filled = Math.min(Math.round((progress / total) * 8), 8);
    const empty = 8 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  const getDaysLeft = (ch: Challenge) => {
    const deadline = new Date(new Date(ch.created_at).getTime() + ch.duration_days * 86400000);
    return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
  };

  // XP summary data
  const level = profile ? calculateLevel(profile.xp) : 1;
  const levelTitle = getLevelTitle(level);
  const xpProgress = profile ? getXPForNextLevel(profile.xp) : { current: 0, needed: 100, progress: 0 };
  const xpBarFilled = Math.min(Math.round(xpProgress.progress * 10), 10);
  const xpBarEmpty = 10 - xpBarFilled;

  const hasNoQuests = active.length === 0 && completed.length === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
            {'── Quest Log ──'}
          </Text>

          {/* XP/Level summary */}
          {profile && (
            <>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                {`Level ${level}: ${levelTitle}`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.7 }}>
                {`XP ${'[' + '#'.repeat(xpBarFilled) + '.'.repeat(xpBarEmpty) + ']'} ${xpProgress.current}/${xpProgress.needed}`}
              </Text>
              {completed.length > 0 && (
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5 }}>
                  {`Quests done: ${completed.length}`}
                </Text>
              )}
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.3, marginTop: 4, marginBottom: 8 }}>
                {'────────────────────────────'}
              </Text>
            </>
          )}

          {/* Active */}
          {active.length > 0 ? (
            active.map((ch) => {
              const daysLeft = getDaysLeft(ch);
              return (
                <View key={ch.id} style={styles.questBlock}>
                  <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, fontWeight: '700', marginTop: 8 }}>
                    {'* ACTIVE'}
                  </Text>
                  <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                    {`"${ch.title}"`}
                  </Text>
                  <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6 }}>
                    {ch.description}
                  </Text>
                  <Text
                    style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}
                    accessibilityLabel={`Progress: ${ch.progress} of ${ch.duration_days} days`}
                  >
                    {`Progress: ${progressBar(ch.progress, ch.duration_days)} ${ch.progress}/${ch.duration_days} days`}
                  </Text>
                  <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.7 }}>
                    {`Time left: ${daysLeft}d | Reward: +${ch.xp_reward} care points`}
                  </Text>
                  <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5, marginTop: 4 }}>
                    {ch.type === 'track_purchases'
                      ? '> hint: log spending on the home screen'
                      : `> hint: log ${ch.category} spending to progress`}
                  </Text>
                </View>
              );
            })
          ) : hasNoQuests ? (
            /* True empty state — no quests at all */
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center' }}>
                {'No quests yet!'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center', opacity: 0.7, marginTop: 12 }}>
                {'Complete lessons and log\nspending to unlock quests.'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center', opacity: 0.5, marginTop: 12 }}>
                {'Your pet will suggest new\nchallenges as you progress.'}
              </Text>
            </View>
          ) : (
            /* Has completed quests but none active — offer starter */
            <View style={styles.questBlock}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, fontWeight: '700', marginTop: 8 }}>
                {'\u25CB AVAILABLE'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                {'"Track every purchase"'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6 }}>
                {'Log each purchase for 3 days'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.7 }}>
                {'Reward: +30 care points'}
              </Text>
            </View>
          )}

          {/* Completed */}
          {completed.map((ch) => (
            <View key={ch.id} style={styles.questBlock}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, fontWeight: '700', opacity: 0.6, marginTop: 8 }}>
                {'[ok] COMPLETED'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6 }}>
                {`"${ch.title}"`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5 }}>
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
            <Text style={[styles.acceptBtnText, { color: theme.colors.interactive.primaryText, fontSize: 16 * fs }]}>
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
  termHeader: { textAlign: 'center', marginBottom: 12 },
  questBlock: { marginBottom: 12 },
  emptyState: { paddingVertical: 24 },
  acceptBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  acceptBtnText: { fontWeight: '700' },
});
