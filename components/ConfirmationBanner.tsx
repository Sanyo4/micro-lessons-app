import { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

export type BannerType = 'success' | 'warning' | 'info' | 'error';

interface ConfirmationBannerProps {
  message: string;
  type: BannerType;
  visible: boolean;
  onDismiss: () => void;
}

const BORDER_COLORS: Record<BannerType, string> = {
  success: Colors.success,
  warning: Colors.warning,
  info: Colors.primary,
  error: Colors.danger,
};

const BG_COLORS: Record<BannerType, string> = {
  success: Colors.successLight,
  warning: Colors.warningLight,
  info: Colors.aiBubble,
  error: Colors.dangerLight,
};

export default function ConfirmationBanner({
  message,
  type,
  visible,
  onDismiss,
}: ConfirmationBannerProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOut.duration(200)}
    >
      <TouchableOpacity
        style={[
          styles.container,
          { borderLeftColor: BORDER_COLORS[type], backgroundColor: BG_COLORS[type] },
        ]}
        onPress={onDismiss}
        activeOpacity={0.8}
      >
        <Text style={styles.message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
});
