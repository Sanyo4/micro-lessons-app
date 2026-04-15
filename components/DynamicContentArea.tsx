import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { type ContentType } from '../services/functionExecutor';
import BudgetOverviewCard from './cards/BudgetOverviewCard';
import CategoryDetailCard from './cards/CategoryDetailCard';
import TransactionsCard from './cards/TransactionsCard';
import QuestLogCard from './cards/QuestLogCard';
import PetStatusCard from './cards/PetStatusCard';
import MoodHistoryCard from './cards/MoodHistoryCard';
import HelpCard from './cards/HelpCard';
import ConfirmationCard from './cards/ConfirmationCard';
import GameCard from './cards/GameCard';

// ---------- Types ----------

export interface ContentState {
  type: ContentType;
  data: unknown;
  responseText: string;
}

interface DynamicContentAreaProps {
  contentState: ContentState | null;
}

// ---------- Fallback for types without a dedicated card ----------

function TerminalTextCard({ text }: { text: string }) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  return (
    <View
      style={[
        styles.terminalCard,
        {
          backgroundColor: theme.colors.base.terminal,
          borderRadius: theme.radius.terminal,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.base.terminalText,
          fontFamily: mono,
          fontSize: 14 * fs,
          lineHeight: 22 * fs,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ---------- Card resolver ----------

function renderCard(contentState: ContentState): React.ReactNode {
  const { type, data, responseText } = contentState;

  switch (type) {
    case 'budget_overview':
      return <BudgetOverviewCard data={data as any} />;

    case 'category_detail':
      return <CategoryDetailCard data={data as any} />;

    case 'quest_log':
    case 'quest_progress':
      return <QuestLogCard data={data as any} />;

    case 'pet_status':
      return <PetStatusCard data={data as any} />;

    case 'mood_history':
      return <MoodHistoryCard data={data as any} />;

    case 'transactions':
      return <TransactionsCard data={data as any} />;

    case 'help':
      return <HelpCard data={data as any} />;

    case 'savings_projection':
      return <TerminalTextCard text={responseText} />;

    case 'confirmation':
      return <ConfirmationCard data={data as any} responseText={responseText} />;

    case 'game_needs_vs_wants':
      return <GameCard gameType="needs_vs_wants" responseText={responseText} />;

    case 'game_bnpl':
      return <GameCard gameType="bnpl" responseText={responseText} />;

    default:
      return null;
  }
}

// ---------- Main component ----------

export default function DynamicContentArea({ contentState }: DynamicContentAreaProps) {
  const reducedMotion = useTheme().accessibility.reducedMotion;

  if (!contentState || contentState.type === 'idle') {
    return null;
  }

  // Use the content type as key so the animation re-fires when the card changes.
  const animationKey = `${contentState.type}-${Date.now()}`;

  if (reducedMotion) {
    return (
      <View style={styles.wrapper}>
        {renderCard(contentState)}
      </View>
    );
  }

  return (
    <Animated.View
      key={animationKey}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
    >
      {renderCard(contentState)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  terminalCard: {
    padding: 16,
  },
});
