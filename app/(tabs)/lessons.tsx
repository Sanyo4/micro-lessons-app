// Brief 04 — Lessons as terminal directory listing
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getCompletedLessons, type CompletedLesson } from '../../services/database';
import { MICRO_LESSONS } from '../../data/lessons';
import { useTheme } from '../../theme';

export default function LessonsScreen() {
  const theme = useTheme();
  const [completedRecords, setCompletedRecords] = useState<CompletedLesson[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCompletedLessons().then(setCompletedRecords);
    }, [])
  );

  const completedIds = new Set(completedRecords.map(r => r.lesson_id));
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  // Find a suggested lesson (first uncompleted)
  const suggested = MICRO_LESSONS.find(l => !completedIds.has(l.id));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {'── Lessons ──'}
          </Text>

          {/* Suggested */}
          {suggested && (
            <View style={styles.section}>
              <Text style={[styles.termLabel, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                {'SUGGESTED FOR YOU'}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                {`> ${suggested.title}`}
              </Text>
              <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.7 }]}>
                {`  "${suggested.insight}"`}
              </Text>
            </View>
          )}

          {/* All Lessons */}
          <View style={styles.section}>
            <Text style={[styles.termLabel, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
              {'ALL LESSONS'}
            </Text>
            {MICRO_LESSONS.map((lesson) => {
              const isDone = completedIds.has(lesson.id);
              const marker = isDone ? '[x]' : '[ ]';
              return (
                <Pressable
                  key={lesson.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${lesson.title}, ${isDone ? 'completed' : 'not completed'}`}
                >
                  <Text
                    style={[
                      styles.termText,
                      {
                        color: theme.colors.base.terminalText,
                        fontFamily: mono,
                        opacity: isDone ? 0.6 : 1,
                      },
                    ]}
                  >
                    {`${marker} ${lesson.title}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Progress */}
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.5, marginTop: 8, textAlign: 'center' }]}>
            {`${completedRecords.length}/${MICRO_LESSONS.length} completed`}
          </Text>
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
  termLabel: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  termText: { fontSize: 14, lineHeight: 24 },
  section: { marginBottom: 8 },
});
