import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const FLOW_STEPS = [
  {
    number: '1',
    title: 'Speak or type what you spent',
    description: 'Use voice or text — "5 quid on a flat white" or "spent 12 pounds on lunch". Toggle your input mode on the home screen.',
    icon: '🎙️',
  },
  {
    number: '2',
    title: 'FunctionGemma understands',
    description: 'The on-device AI extracts category, amount, and description using structured function calling',
    icon: '🧠',
  },
  {
    number: '3',
    title: 'Smart reactions cascade',
    description: 'Budget check, coaching trigger, challenge progress — all automatic, all instant',
    icon: '⚡',
  },
  {
    number: '4',
    title: 'You learn as you go',
    description: 'Contextual micro-lessons appear at the right moment — when they matter most',
    icon: '📚',
  },
];

const TRIGGER_EXAMPLES = [
  {
    trigger: 'Budget exceeded',
    icon: '⚠️',
    lesson: 'The Latte Factor',
    challenge: 'Skip coffee shops for 3 days',
    color: '#C0392B',
  },
  {
    trigger: 'Near limit (80%)',
    icon: '🟡',
    lesson: 'The Yellow Light',
    challenge: 'Pause before purchases for 2 days',
    color: '#D4A017',
  },
  {
    trigger: 'Unusual spending',
    icon: '🔍',
    lesson: 'Emotional Spending',
    challenge: 'Log mood with purchases',
    color: '#8B5CF6',
  },
  {
    trigger: 'Time-based',
    icon: '⏰',
    lesson: 'Weekend Warrior',
    challenge: 'Set a weekend spending cap',
    color: '#0D9488',
  },
];

const INPUT_MODES = [
  { icon: '🎙️', title: 'Voice Mode', text: 'Tap the mic and speak naturally — "spent 5 on coffee". Speech is converted to text on-device and processed instantly.' },
  { icon: '⌨️', title: 'Text Mode', text: 'Type your expenses the traditional way. Same natural language processing, just typed instead of spoken.' },
];

const COACHING_FEATURES = [
  { icon: '🎯', text: 'Near-limit warnings before you go over' },
  { icon: '🏃', text: 'Spending velocity alerts for fast burns' },
  { icon: '⏰', text: 'Time-based nudges on weekends & payday' },
  { icon: '🏆', text: 'Challenges that track progress & award XP' },
];

const PRIVACY_POINTS = [
  { icon: '📱', text: 'All AI runs on-device — nothing leaves your phone' },
  { icon: '🚫', text: 'No bank API connections required' },
  { icon: '🔒', text: 'No financial data transmitted externally' },
  { icon: '🛡️', text: 'No credentials or passwords stored' },
];

export default function HowItWorksScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/')} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: FunctionGemma On-Device AI */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧠</Text>
            <Text style={styles.sectionTitle}>FunctionGemma On-Device AI</Text>
          </View>
          <Text style={styles.sectionBody}>
            All AI processing happens on your device using Google's FunctionGemma (270M-it). No data leaves your phone. No cloud. No bank connections.
          </Text>
          <View style={styles.flowDiagram}>
            <View style={styles.flowNode}>
              <Text style={styles.flowNodeIcon}>🎙️ ⌨️</Text>
              <Text style={styles.flowNodeLabel}>Voice / Text</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowNode}>
              <Text style={styles.flowNodeIcon}>🧠</Text>
              <Text style={styles.flowNodeLabel}>FunctionGemma</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowNode}>
              <Text style={styles.flowNodeIcon}>⚡</Text>
              <Text style={styles.flowNodeLabel}>Action</Text>
            </View>
          </View>
        </Animated.View>

        {/* Section 2: Voice & Text Input */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎙️</Text>
            <Text style={styles.sectionTitle}>Voice & Text Input</Text>
          </View>
          <Text style={styles.sectionBody}>
            Switch between voice and text input using the toggle on the home screen. Voice-first design makes logging expenses as easy as talking.
          </Text>
          {INPUT_MODES.map((mode) => (
            <View key={mode.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{mode.icon}</Text>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.featureText}>{mode.text}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Section 3: How It Works */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚙️</Text>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>
          {FLOW_STEPS.map((step) => (
            <View key={step.number} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.icon} {step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Section 4: Contextual Micro-Lessons */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📖</Text>
            <Text style={styles.sectionTitle}>Contextual Micro-Lessons</Text>
          </View>
          <Text style={styles.sectionBody}>
            Lessons appear when they matter most — not randomly. Each trigger type teaches you something different and offers a challenge to build better habits.
          </Text>
          {TRIGGER_EXAMPLES.map((example) => (
            <View key={example.trigger} style={styles.triggerCard}>
              <View style={styles.triggerHeader}>
                <Text style={styles.triggerIcon}>{example.icon}</Text>
                <Text style={styles.triggerLabel}>{example.trigger}</Text>
              </View>
              <View style={styles.triggerFlow}>
                <View style={styles.triggerStep}>
                  <Text style={styles.triggerStepLabel}>Lesson</Text>
                  <Text style={styles.triggerStepValue}>{example.lesson}</Text>
                </View>
                <Text style={styles.triggerArrow}>→</Text>
                <View style={styles.triggerStep}>
                  <Text style={styles.triggerStepLabel}>Challenge</Text>
                  <Text style={styles.triggerStepValue}>{example.challenge}</Text>
                </View>
                <Text style={styles.triggerArrow}>→</Text>
                <View style={styles.triggerStep}>
                  <Text style={styles.triggerStepLabel}>Reward</Text>
                  <Text style={[styles.triggerStepValue, styles.xpText]}>+XP</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Section 5: Proactive Coaching */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>Proactive Coaching</Text>
          </View>
          <Text style={styles.sectionBody}>
            The system doesn't wait for you to ask — it coaches you proactively based on your spending patterns and timing.
          </Text>
          {COACHING_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Section 6: Privacy by Design */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔒</Text>
            <Text style={styles.sectionTitle}>Privacy by Design</Text>
          </View>
          {PRIVACY_POINTS.map((point, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{point.icon}</Text>
              <Text style={styles.featureText}>{point.text}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.menuBg,
    borderWidth: 1,
    borderColor: Colors.menuBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Flow diagram
  flowDiagram: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  flowNode: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flowNodeIcon: {
    fontSize: 24,
  },
  flowNodeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  flowArrow: {
    fontSize: FontSize.xl,
    color: Colors.primary,
    fontWeight: '700',
  },
  // Steps
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Trigger examples
  triggerCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  triggerIcon: {
    fontSize: 18,
  },
  triggerLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  triggerFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  triggerStep: {
    flex: 1,
    alignItems: 'center',
  },
  triggerStepLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  triggerStepValue: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  triggerArrow: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  xpText: {
    color: Colors.xpGold,
    fontWeight: '700',
  },
  // Features & Privacy
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
