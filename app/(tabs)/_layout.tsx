import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="challenges" options={{ title: 'Challenges' }} />
      <Tabs.Screen name="lessons" options={{ title: 'Lessons' }} />
      <Tabs.Screen name="how-it-works" options={{ title: 'How It Works' }} />
    </Tabs>
  );
}
