// Brief 04 — Tab navigator with 5 visible tabs, pastel styling
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.base.surface,
          borderTopColor: theme.colors.base.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.colors.interactive.primary,
        tabBarInactiveTintColor: theme.colors.base.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon label="~" color={color} />,
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <TabIcon label="$" color={color} />,
          tabBarAccessibilityLabel: 'Budget tab',
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color }) => <TabIcon label="*" color={color} />,
          tabBarAccessibilityLabel: 'Challenges tab',
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          tabBarIcon: ({ color }) => <TabIcon label="#" color={color} />,
          tabBarAccessibilityLabel: 'Lessons tab',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabIcon label="@" color={color} />,
          tabBarAccessibilityLabel: 'History tab',
        }}
      />
    </Tabs>
  );
}

function TabIcon({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
});
