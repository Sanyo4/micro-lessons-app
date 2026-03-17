import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface NumPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  showDecimal?: boolean;
  disabled?: boolean;
  currentLength?: number;
  maxLength?: number;
}

const BUTTON_SIZE = 72;

export default function NumPad({
  onDigit,
  onDelete,
  showDecimal = false,
  disabled = false,
  currentLength,
  maxLength,
}: NumPadProps) {
  const handlePress = (value: string) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentLength !== undefined && maxLength !== undefined) {
      Speech.speak(`${currentLength + 1} of ${maxLength}`, { rate: 1.2 });
    }
    onDigit(value);
  };

  const handleDelete = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showDecimal ? '.' : '', '0', 'DEL'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((value) => {
            if (value === '') {
              return <View key="empty" style={styles.emptyButton} />;
            }
            if (value === 'DEL') {
              return (
                <Pressable
                  key="del"
                  style={({ pressed }) => [
                    styles.button,
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                    disabled && styles.buttonDisabled,
                  ]}
                  onPress={handleDelete}
                  accessibilityRole="button"
                  accessibilityLabel="Delete"
                  disabled={disabled}
                >
                  <Text style={[styles.buttonText, styles.deleteText]}>←</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={value}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  disabled && styles.buttonDisabled,
                ]}
                onPress={() => handlePress(value)}
                accessibilityRole="button"
                accessibilityLabel={value}
                disabled={disabled}
              >
                <Text style={styles.buttonText}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.menuBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  deleteButton: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  emptyButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  buttonText: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteText: {
    color: Colors.danger,
  },
});
