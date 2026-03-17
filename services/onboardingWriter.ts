import { getDatabase, updateAppSettings, addFixedExpense, clearFixedExpenses, setMotivationFocuses } from './database';
import { getPlanById, getDefaultPlan } from '../data/plans';
import type { OnboardingData } from './onboardingContext';

export async function writeOnboardingData(data: OnboardingData): Promise<void> {
  const database = await getDatabase();
  const plan = getPlanById(data.selectedPlanId) || getDefaultPlan();

  // 1. Insert user profile
  await database.runAsync(
    'INSERT INTO user_profile (name, xp, level, streak_days, monthly_income, flexible_budget) VALUES (?, 0, 1, 0, ?, ?)',
    [data.userName, data.monthlyIncome, data.flexibleSpending]
  );

  // 2. Insert budget categories from plan
  const weeklyFlexible = data.flexibleSpending / 4.3;
  for (const cat of plan.categories) {
    const weeklyLimit = Math.round((weeklyFlexible * cat.weeklyLimitPercent) / 100 * 100) / 100;
    await database.runAsync(
      'INSERT INTO budget_categories (id, name, weekly_limit, spent, icon, color) VALUES (?, ?, ?, 0, ?, ?)',
      [cat.id, cat.name, weeklyLimit, cat.icon, cat.color]
    );
  }

  // 3. Insert fixed expenses
  await clearFixedExpenses();
  for (const expense of data.fixedExpenses) {
    await addFixedExpense(expense.name, expense.amount);
  }

  // 4. Set motivation focuses
  await setMotivationFocuses(data.motivationFocuses);

  // 5. Update app settings
  await updateAppSettings({
    onboarding_completed: 1,
    financial_persona: data.financialPersona,
    selected_plan_id: data.selectedPlanId || plan.id,
    input_preference: data.inputPreference,
  });
}
