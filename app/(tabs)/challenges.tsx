import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import ChallengeCard from '../../components/ChallengeCard';
import {
  getActiveChallenges,
  getCompletedChallenges,
  createChallenge,
  updateUserXP,
  type Challenge,
} from '../../services/database';
import { XP_AWARDS } from '../../utils/gamification';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function ChallengesScreen() {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);

  const loadChallenges = useCallback(async () => {
    const [active, completed] = await Promise.all([
      getActiveChallenges(),
      getCompletedChallenges(),
    ]);
    setActiveChallenges(active);
    setCompletedChallenges(completed);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

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
      await loadChallenges();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/')} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Active Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active ({activeChallenges.length})
          </Text>
          {activeChallenges.length === 0 && completedChallenges.length === 0 ? (
            <View style={styles.starterCard}>
              <Text style={styles.starterIcon}>🎯</Text>
              <Text style={styles.starterTitle}>Track every purchase</Text>
              <Text style={styles.starterDescription}>Log each purchase for 3 days to build the habit. You'll earn XP and unlock insights!</Text>
              <View style={styles.starterReward}>
                <Text style={styles.starterRewardText}>+30 XP</Text>
              </View>
              <TouchableOpacity
                style={styles.starterButton}
                onPress={handleAcceptStarter}
                disabled={isAccepting}
                activeOpacity={0.7}
              >
                <Text style={styles.starterButtonText}>
                  {isAccepting ? 'Accepting...' : 'Accept Challenge'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : activeChallenges.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No active challenges</Text>
              <Text style={styles.emptyText}>
                Log some spending to unlock challenges!
              </Text>
            </View>
          ) : (
            <View style={styles.challengeList}>
              {activeChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  category={challenge.category}
                  durationDays={challenge.duration_days}
                  xpReward={challenge.xp_reward}
                  progress={challenge.progress}
                  completed={false}
                />
              ))}
            </View>
          )}
        </View>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Completed ({completedChallenges.length})
            </Text>
            <View style={styles.challengeList}>
              {completedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  category={challenge.category}
                  durationDays={challenge.duration_days}
                  xpReward={challenge.xp_reward}
                  progress={challenge.duration_days}
                  completed={true}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  challengeList: {
    gap: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  starterCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  starterIcon: {
    fontSize: 48,
  },
  starterTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  starterDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  starterReward: {
    backgroundColor: Colors.xpGold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  starterRewardText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  starterButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  starterButtonText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
