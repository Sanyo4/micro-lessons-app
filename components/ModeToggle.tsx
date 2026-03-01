import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

type InputMode = 'voice' | 'text';

interface ModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const TOGGLE_HEIGHT = 56;
const PILL_INSET = 3;
const SPRING_CONFIG = { damping: 18, stiffness: 200 };

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const pillX = useSharedValue(0);

  const pillWidth = containerWidth > 0 ? (containerWidth - PILL_INSET * 2) / 2 : 0;

  useEffect(() => {
    if (containerWidth === 0) return;
    const target = mode === 'voice' ? PILL_INSET : PILL_INSET + pillWidth;
    pillX.value = withSpring(target, SPRING_CONFIG);
  }, [mode, containerWidth, pillWidth, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth,
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    // Set initial position without animation
    const pw = (w - PILL_INSET * 2) / 2;
    pillX.value = mode === 'voice' ? PILL_INSET : PILL_INSET + pw;
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Sliding pill indicator */}
      {containerWidth > 0 && (
        <Animated.View style={[styles.pill, pillStyle]} />
      )}

      {/* Voice option */}
      <Pressable
        style={styles.option}
        onPress={() => onModeChange('voice')}
      >
        <Text style={[styles.icon, mode === 'voice' && styles.activeText]}>
          🎙️
        </Text>
        <Text style={[styles.label, mode === 'voice' && styles.activeText]}>
          Voice
        </Text>
      </Pressable>

      {/* Text option */}
      <Pressable
        style={styles.option}
        onPress={() => onModeChange('text')}
      >
        <Text style={[styles.icon, mode === 'text' && styles.activeText]}>
          ⌨️
        </Text>
        <Text style={[styles.label, mode === 'text' && styles.activeText]}>
          Text
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: TOGGLE_HEIGHT,
    backgroundColor: Colors.menuBg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.menuBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: 0,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl - 2,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    zIndex: 1,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeText: {
    color: '#FFFFFF',
  },
});
