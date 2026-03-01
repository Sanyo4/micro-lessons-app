import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="lessons" />
      <Tabs.Screen name="how-it-works" />
    </Tabs>
  );
}
