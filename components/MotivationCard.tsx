import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface MotivationCardProps {
  title: string;
  icon: string;
  onSelect: () => void;
  onSkip: () => void;
}

const SWIPE_THRESHOLD = 80;

export default function MotivationCard({ title, icon, onSelect, onSkip }: MotivationCardProps) {
  const translateX = useSharedValue(0);
  const bgColor = useSharedValue('transparent');

  const doSelect = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect();
  };

  const doSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      if (e.translationX > SWIPE_THRESHOLD / 2) {
        bgColor.value = 'rgba(30, 132, 73, 0.15)';
      } else if (e.translationX < -SWIPE_THRESHOLD / 2) {
        bgColor.value = 'rgba(192, 57, 43, 0.15)';
      } else {
        bgColor.value = 'transparent';
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(300, { duration: 200 });
        runOnJS(doSelect)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-300, { duration: 200 });
        runOnJS(doSkip)();
      } else {
        translateX.value = withSpring(0);
        bgColor.value = 'transparent';
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
  }));

  return (
    <Animated.View style={[styles.bgContainer, bgStyle]}>
      <View style={styles.hintContainer}>
        <Text style={styles.hintLeft}>← Skip</Text>
        <Text style={styles.hintRight}>Select →</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.icon} importantForAccessibility="no">{icon}</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.actionButton, styles.skipButton]}
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel={`Skip ${title}`}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.selectButton]}
              onPress={() => doSelect()}
              accessibilityRole="button"
              accessibilityLabel={`Select ${title}`}
            >
              <Text style={styles.selectButtonText}>Select</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  hintLeft: {
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  hintRight: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  card: {
    backgroundColor: Colors.surfaceSolid,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.lg,
    minHeight: 200,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: Colors.menuBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectButton: {
    backgroundColor: Colors.primary,
  },
  skipButtonText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectButtonText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
