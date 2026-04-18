// Brief 05 — Push notification scheduling with pet-voiced messages
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getPetProfile } from './database';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request notification permissions */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/** Schedule all recurring pet notifications */
export async function scheduleAllNotifications(): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Cancel existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const pet = await getPetProfile();
  const petName = pet?.name ?? 'Buddy';

  // Morning greeting — 9am daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${petName} says good morning!`,
      body: "Ready to start the day? Let's check in on our budget together!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  // Evening reminder — 8pm daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${petName} is waiting for you`,
      body: "Don't forget to log today's spending before bed!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

/** Send a one-time milestone notification */
export async function sendMilestoneNotification(
  milestoneType: 'streak' | 'level_up' | 'challenge_complete',
  value: string,
): Promise<void> {
  const pet = await getPetProfile();
  const petName = pet?.name ?? 'Buddy';

  let title = '';
  let body = '';

  switch (milestoneType) {
    case 'streak':
      title = `${petName} is celebrating!`;
      body = `${value}-day streak! We're building an amazing habit together!`;
      break;
    case 'level_up':
      title = `${petName} leveled up!`;
      body = `We just hit Level ${value}! ${petName} feels like they're evolving!`;
      break;
    case 'challenge_complete':
      title = `Challenge complete!`;
      body = `${petName} is so proud — we finished the "${value}" challenge!`;
      break;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // Fire immediately
  });
}

/** Schedule an idle nudge for 2 days from now */
export async function scheduleIdleNudge(): Promise<void> {
  const pet = await getPetProfile();
  const petName = pet?.name ?? 'Buddy';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${petName} misses you!`,
      body: "It's been a while since we logged any spending. Come check in!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2 * 24 * 60 * 60, // 2 days
    },
  });
}
