// Voice-first single-page layout — tab bar hidden, only index screen active
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none', height: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      {/* Kept for expo-router file discovery — tab bar is hidden */}
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="challenges" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
