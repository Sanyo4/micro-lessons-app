import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

const MENU_ITEMS = [
  { key: 'budget', icon: '📊', label: 'Budget', route: '/budget' as const },
  { key: 'lessons', icon: '📚', label: 'Lessons', route: '/lessons' as const },
  { key: 'challenges', icon: '🏆', label: 'Challenges', route: '/challenges' as const },
  { key: 'how-it-works', icon: '🧠', label: 'How It Works', route: '/how-it-works' as const },
];

export default function MenuChips() {
  return (
    <View style={styles.container}>
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.chip}
          onPress={() => router.navigate(item.route)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.menuBg,
    borderWidth: 1,
    borderColor: Colors.menuBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
});
