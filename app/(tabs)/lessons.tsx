import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getCompletedLessons, type CompletedLesson } from '../../services/database';
import { MICRO_LESSONS, getLessonById } from '../../data/lessons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function LessonsScreen() {
  const [completedLessonRecords, setCompletedLessonRecords] = useState<CompletedLesson[]>([]);

  const loadLessons = useCallback(async () => {
    const records = await getCompletedLessons();
    setCompletedLessonRecords(records);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLessons();
    }, [loadLessons])
  );

  const completedIds = new Set(completedLessonRecords.map((r) => r.lesson_id));
  const unlockedLessons = MICRO_LESSONS.filter((l) => completedIds.has(l.id));
  const lockedLessons = MICRO_LESSONS.filter((l) => !completedIds.has(l.id));

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'budget_exceeded': return '⚠️';
      case 'near_limit': return '🟡';
      case 'unusual_pattern': return '🔍';
      case 'time_based': return '⏰';
      default: return '📖';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/')} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lessons</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{unlockedLessons.length} of {MICRO_LESSONS.length} Unlocked</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(unlockedLessons.length / MICRO_LESSONS.length) * 100}%` }]} />
          </View>
        </View>

        {/* Locked Lessons */}
        {lockedLessons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Locked ({lockedLessons.length})
            </Text>
            <View style={styles.lessonList}>
              {lockedLessons.map((lesson) => (
                <View key={lesson.id} style={styles.lockedCard}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <View style={styles.lockedText}>
                    <Text style={styles.lockedTitle}>{lesson.title}</Text>
                    <Text style={styles.lockedHint}>
                      {lesson.triggerType === 'budget_exceeded'
                        ? 'Log spending that exceeds a budget'
                        : lesson.triggerType === 'near_limit'
                          ? 'Get close to a budget limit'
                          : lesson.triggerType === 'unusual_pattern'
                            ? 'Make an unusual purchase'
                            : 'Check in on weekends or payday'}
                    </Text>
                  </View>
                  <View style={styles.lockedXp}>
                    <Text style={styles.lockedXpText}>
                      +{lesson.xpReward} XP
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completed / Unlocked Lessons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Unlocked ({unlockedLessons.length}/{MICRO_LESSONS.length})
          </Text>
          {unlockedLessons.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No lessons yet</Text>
              <Text style={styles.emptyText}>
                Keep logging your spending to unlock contextual lessons!
              </Text>
            </View>
          ) : (
            <View style={styles.lessonList}>
              {unlockedLessons.map((lesson) => {
                const record = completedLessonRecords.find(
                  (r) => r.lesson_id === lesson.id
                );
                return (
                  <Animated.View
                    key={lesson.id}
                    entering={FadeIn.duration(300)}
                    style={styles.lessonCard}
                  >
                    <View style={styles.lessonHeader}>
                      <Text style={styles.lessonIcon}>
                        {getTriggerIcon(lesson.triggerType)}
                      </Text>
                      <View style={styles.lessonHeaderText}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        {record && (
                          <Text style={styles.lessonDate}>
                            {new Date(record.completed_at).toLocaleDateString(
                              'en-GB',
                              { day: 'numeric', month: 'short' }
                            )}
                          </Text>
                        )}
                      </View>
                      <View style={styles.xpEarned}>
                        <Text style={styles.xpEarnedText}>
                          +{lesson.xpReward} XP
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.lessonInsight}>{lesson.insight}</Text>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
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
  lessonList: {
    gap: Spacing.md,
  },
  lessonCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  lessonIcon: {
    fontSize: 22,
  },
  lessonHeaderText: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
  },
  lessonDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  xpEarned: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  xpEarnedText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  lessonInsight: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingLeft: 38,
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
  lockedCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    opacity: 0.85,
  },
  lockedIcon: {
    fontSize: 22,
  },
  lockedText: {
    flex: 1,
  },
  lockedTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  lockedHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lockedXp: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  lockedXpText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  progressCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  progressTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});
