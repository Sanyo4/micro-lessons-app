// Brief 04 — Pet mood timeline screen
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getPetStateHistory, getPetProfile, type PetStateHistory, type PetProfile } from '../../services/database';
import { useTheme, type PetMood } from '../../theme';

const MOOD_SYMBOLS: Record<string, string> = {
  thriving: '*',
  happy: ':)',
  neutral: '.',
  worried: ':(',
  critical: 'x',
};

const MOOD_LABELS: Record<string, string> = {
  thriving: 'Thriving',
  happy: 'Happy',
  neutral: 'Neutral',
  worried: 'Worried',
  critical: 'Critical',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DaySummary {
  date: string;
  dayName: string;
  mood: string;
  label: string;
  symbol: string;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [history, setHistory] = useState<PetStateHistory[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getPetProfile(), getPetStateHistory(14)]).then(([p, h]) => {
        setPet(p);
        setHistory(h);
      });
    }, [])
  );

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const petName = pet?.name ?? 'Buddy';

  // Group history by date, take the last entry per day
  const dayMap = new Map<string, PetStateHistory>();
  for (const entry of history) {
    const date = entry.timestamp.split('T')[0];
    // Keep most recent entry per day (history is DESC, so first wins)
    if (!dayMap.has(date)) {
      dayMap.set(date, entry);
    }
  }

  const days: DaySummary[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const entry = dayMap.get(dateStr);
    const mood = entry?.state ?? 'neutral';
    days.push({
      date: dateStr,
      dayName: DAY_NAMES[d.getDay()],
      mood,
      label: MOOD_LABELS[mood] ?? 'Neutral',
      symbol: MOOD_SYMBOLS[mood] ?? '.',
    });
  }

  // Weekly average: count moods
  const moodCounts: Record<string, number> = {};
  for (const day of days) {
    moodCounts[day.mood] = (moodCounts[day.mood] ?? 0) + 1;
  }
  const avgMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';

  const hasData = history.length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {`── ${petName}'s Journey ──`}
          </Text>

          {!hasData ? (
            <View>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.6, textAlign: 'center' }]}>
                {'Just getting started!'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.4, textAlign: 'center' }]}>
                {'Log transactions to see your'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.4, textAlign: 'center' }]}>
                {'mood history here.'}
              </Text>
            </View>
          ) : (
            <View>
              {/* Day-by-day timeline */}
              {days.map((day) => (
                <Text
                  key={day.date}
                  style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}
                  accessibilityLabel={`${day.dayName}: ${day.label}`}
                >
                  {`${day.dayName}  ${day.symbol.padEnd(3)} ${day.label.padEnd(10)}`}
                </Text>
              ))}

              {/* Weekly summary */}
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.4, marginTop: 8 }]}>
                {'─────────────────────'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                {`This week: avg ${MOOD_LABELS[avgMood] ?? 'Neutral'}`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, gap: 16 },
  terminal: { padding: 16 },
  termHeader: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
  termText: { fontSize: 14, lineHeight: 24 },
});
