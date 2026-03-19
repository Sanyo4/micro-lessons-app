import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, AccessibilityInfo, findNodeHandle, Platform } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface LessonData {
  id: string;
  title: string;
  body: string;
  insight: string;
  triggerType: string;
  xpReward: number;
  challengeTemplate: {
    title: string;
    description: string;
    type: string;
    duration_days: number;
    xp_reward: number;
  };
}

interface MicroLessonModalProps {
  visible: boolean;
  lesson: LessonData | null | undefined;
  onAcceptChallenge: () => void;
  onDismiss: () => void;
}

export default function MicroLessonModal({
  visible,
  lesson,
  onAcceptChallenge,
  onDismiss,
}: MicroLessonModalProps) {
  const titleRef = useRef<Text>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (visible && lesson && titleRef.current) {
      const node = findNodeHandle(titleRef.current);
      if (node) {
        setTimeout(() => AccessibilityInfo.setAccessibilityFocus(node), 300);
      }
    }
  }, [visible, lesson]);

  if (!lesson) return null;

  const triggerIcon =
    lesson.triggerType === 'budget_exceeded'
      ? '⚠️'
      : lesson.triggerType === 'unusual_pattern'
        ? '🔍'
        : '⏰';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(150)}
          style={styles.modal}
        >
          {/* Header */}
          <View style={styles.handle} />
          <View style={styles.lessonHeader}>
            <Text style={styles.triggerIcon} importantForAccessibility="no">{triggerIcon}</Text>
            <Text
              ref={titleRef}
              style={styles.lessonTitle}
              accessibilityRole="header"
            >
              {lesson.title}
            </Text>
          </View>

          {/* Body */}
          <Text style={styles.lessonBody}>{lesson.body}</Text>

          {/* Insight */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Key Insight</Text>
            <Text style={styles.insightText}>{lesson.insight}</Text>
          </View>

          {/* Challenge */}
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeIcon} importantForAccessibility="no">🏆</Text>
              <Text style={styles.challengeTitle}>Challenge</Text>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>
                  +{lesson.challengeTemplate.xp_reward} XP
                </Text>
              </View>
            </View>
            <Text style={styles.challengeDescription}>
              {lesson.challengeTemplate.title}
            </Text>
            <Text style={styles.challengeDuration}>
              {lesson.challengeTemplate.duration_days} day
              {lesson.challengeTemplate.duration_days !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAcceptChallenge}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Take the challenge: ${lesson.challengeTemplate.title}, ${lesson.challengeTemplate.duration_days} days for ${lesson.challengeTemplate.xp_reward} experience points`}
            >
              <Text style={styles.acceptButtonText}>Take the Challenge</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Dismiss lesson"
            >
              <Text style={styles.dismissButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl + 10,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  triggerIcon: {
    fontSize: 28,
  },
  lessonTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  lessonBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  insightCard: {
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  insightLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  insightText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  challengeCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  challengeIcon: {
    fontSize: 18,
  },
  challengeTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  xpBadge: {
    backgroundColor: Colors.xpGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  xpBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  challengeDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  challengeDuration: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  buttons: {
    gap: Spacing.md,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});
