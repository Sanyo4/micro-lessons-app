import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { Colors, Spacing, FontSize } from '../constants/theme';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  useEffect(() => {
    Speech.speak(`Step ${currentStep} of ${totalSteps}`, { rate: 1.0 });
  }, [currentStep, totalSteps]);

  return (
    <View style={styles.container} accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}>
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentStep ? styles.dotCompleted : styles.dotIncomplete,
              i === currentStep - 1 && styles.dotCurrent,
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
  },
  dotIncomplete: {
    backgroundColor: Colors.border,
  },
  dotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
