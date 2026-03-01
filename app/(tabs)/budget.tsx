import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import BudgetCard from '../../components/BudgetCard';
import BudgetPlanCard from '../../components/BudgetPlanCard';
import { getBudgetCategories, updateCategoryLimit, type BudgetCategory } from '../../services/database';
import { generateBudgetPlan, type BudgetSuggestion } from '../../services/budgetPlanner';
import { Colors, Spacing, FontSize, BorderRadius, CategoryIcons } from '../../constants/theme';

export default function BudgetScreen() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [planSuggestions, setPlanSuggestions] = useState<BudgetSuggestion[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBudgetCategories().then(setCategories);
    }, [])
  );

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const suggestions = await generateBudgetPlan();
      setPlanSuggestions(suggestions);
      setShowPlan(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyLimit = async (categoryId: string, newLimit: number) => {
    await updateCategoryLimit(categoryId, newLimit);
    const updated = await getBudgetCategories();
    setCategories(updated);
    setPlanSuggestions((prev) => prev.filter((s) => s.categoryId !== categoryId));
    if (planSuggestions.length <= 1) {
      setShowPlan(false);
    }
  };

  const handleApplyAll = async () => {
    for (const suggestion of planSuggestions) {
      if (suggestion.status !== 'keep') {
        await updateCategoryLimit(suggestion.categoryId, suggestion.suggestedLimit);
      }
    }
    const updated = await getBudgetCategories();
    setCategories(updated);
    setPlanSuggestions([]);
    setShowPlan(false);
  };

  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalLimit = categories.reduce((sum, c) => sum + c.weekly_limit, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/')} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Budget</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Weekly Total</Text>
          <Text style={[styles.summaryAmount, totalSpent > totalLimit && styles.summaryExceeded]}>
            £{totalSpent.toFixed(0)} / £{totalLimit.toFixed(0)}
          </Text>
          <View style={styles.summaryBar}>
            <View
              style={[
                styles.summaryBarFill,
                {
                  width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%`,
                  backgroundColor: totalSpent > totalLimit ? Colors.danger : Colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Category Cards */}
        <View style={styles.grid}>
          {categories.map((cat) => (
            <BudgetCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              icon={CategoryIcons[cat.id] ?? cat.icon}
              spent={cat.spent}
              limit={cat.weekly_limit}
            />
          ))}
        </View>

        {/* Smart Plan */}
        <TouchableOpacity
          style={styles.planButton}
          onPress={handleGeneratePlan}
          activeOpacity={0.7}
          disabled={isGenerating}
        >
          <Text style={styles.planButtonText}>
            {isGenerating ? 'Generating...' : 'Generate Smart Plan'}
          </Text>
        </TouchableOpacity>

        {showPlan && planSuggestions.length > 0 && (
          <View style={styles.planSection}>
            <Text style={styles.planTitle}>Budget Suggestions</Text>
            {planSuggestions.map((suggestion) => (
              <BudgetPlanCard
                key={suggestion.categoryId}
                suggestion={suggestion}
                onApply={handleApplyLimit}
              />
            ))}
            {planSuggestions.some((s) => s.status !== 'keep') && (
              <TouchableOpacity
                style={styles.applyAllButton}
                onPress={handleApplyAll}
                activeOpacity={0.7}
              >
                <Text style={styles.applyAllButtonText}>Apply All Suggestions</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: 16,
    padding: Spacing.xl,
    gap: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryExceeded: {
    color: Colors.danger,
  },
  summaryBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  planButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  planButtonText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planSection: {
    gap: Spacing.md,
  },
  planTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  applyAllButton: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  applyAllButtonText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
