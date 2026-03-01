import {
  addTransaction,
  updateCategorySpent,
  getBudgetCategory,
  getCategorySpendingTotal,
  getTransactionsByCategory,
  createChallenge,
  getCompletedLessons,
  markLessonCompleted,
  updateUserXP,
  getActiveChallenges,
  updateChallengeProgress,
  completeChallenge,
} from './database';
import { getLessonByTrigger, getLessonById, getPersonalityResponse, type MicroLesson } from '../data/lessons';
import { XP_AWARDS } from '../utils/gamification';

export interface ParsedFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface FunctionCallResult {
  functionName: string;
  success: boolean;
  params: Record<string, unknown>;
  data?: unknown;
  responseText?: string;
  xpEarned: number;
  lesson?: MicroLesson | null;
}

export async function executeFunctionCall(
  call: ParsedFunctionCall
): Promise<FunctionCallResult> {
  const { name, arguments: params } = call;

  switch (name) {
    case 'log_transaction':
      return handleLogTransaction(params);
    case 'check_budget_status':
      return handleCheckBudgetStatus(params);
    case 'get_spending_summary':
      return handleGetSpendingSummary(params);
    case 'detect_spending_pattern':
      return handleDetectSpendingPattern(params);
    case 'get_micro_lesson':
      return handleGetMicroLesson(params);
    case 'create_challenge':
      return handleCreateChallenge(params);
    case 'calculate_savings_impact':
      return handleCalculateSavingsImpact(params);
    case 'check_time_triggers':
      return handleCheckTimeTriggers(params);
    case 'navigate_to_screen':
      return handleNavigateToScreen(params);
    default:
      return {
        functionName: name,
        success: false,
        params,
        responseText: `Unknown function: ${name}`,
        xpEarned: 0,
      };
  }
}

async function handleLogTransaction(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const amount = params.amount as number;
  const description = params.description as string;

  try {
    // Step 1: Log the transaction
    await addTransaction(amount, category, description);
    await updateCategorySpent(category, amount);
    await updateUserXP(XP_AWARDS.LOG_TRANSACTION);

    const budgetCat = await getBudgetCategory(category);
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    let totalXP = XP_AWARDS.LOG_TRANSACTION;
    let lesson: MicroLesson | null = null;

    // Step 2: Check budget status
    const spent = budgetCat?.spent ?? 0;
    const limit = budgetCat?.weekly_limit ?? 1;
    const percentage = (spent / limit) * 100;
    const remaining = limit - spent;

    // Step 3: Trigger coaching (priority-ordered, at most ONE)
    const completedLessonRecords = await getCompletedLessons();
    const completedIds = completedLessonRecords.map((l) => l.lesson_id);

    if (percentage > 100) {
      // Priority 1: Budget exceeded
      lesson = getLessonByTrigger('budget_exceeded', category, completedIds);
    } else if (percentage > 80) {
      // Priority 2: Near limit
      lesson = getLessonByTrigger('near_limit', category, completedIds);
    }

    // Priority 3: Spending velocity (only if no lesson triggered yet)
    if (!lesson) {
      try {
        const weeklyTransactions = await getTransactionsByCategory(category, 'weekly');
        if (weeklyTransactions.length > 0) {
          const earliest = new Date(weeklyTransactions[weeklyTransactions.length - 1].timestamp);
          const now = new Date();
          const daysSinceEarliest = (now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceEarliest <= 2 && percentage > 50) {
            lesson = getLessonByTrigger('near_limit', category, completedIds);
          }
        }
      } catch {}
    }

    // Priority 4: Unusual amount (only if no lesson triggered yet)
    if (!lesson) {
      try {
        const monthlyTransactions = await getTransactionsByCategory(category, 'monthly');
        const amounts = monthlyTransactions.map((t) => t.amount);
        const average = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
        if (average > 0 && amount > average * 1.5) {
          lesson = getLessonByTrigger('unusual_pattern', category, completedIds);
        }
      } catch {}
    }

    // Mark lesson as completed and award XP if one was triggered
    if (lesson) {
      await markLessonCompleted(lesson.id);
      await updateUserXP(XP_AWARDS.VIEW_LESSON);
      totalXP += XP_AWARDS.VIEW_LESSON;
    }

    // Step 4: Update challenge progress
    let challengeCompletionText = '';
    try {
      const activeChallenges = await getActiveChallenges();
      for (const challenge of activeChallenges) {
        if (challenge.category === category || challenge.type === 'track_purchases') {
          const newProgress = challenge.progress + 1;
          await updateChallengeProgress(challenge.id, newProgress);
          if (newProgress >= challenge.duration_days) {
            await completeChallenge(challenge.id);
            await updateUserXP(challenge.xp_reward);
            totalXP += challenge.xp_reward;
            challengeCompletionText = ` Challenge "${challenge.title}" complete! +${challenge.xp_reward} XP!`;
          }
        }
      }
    } catch {}

    // Step 5: Build contextual response
    let responseText: string;
    if (percentage > 100) {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). You're £${Math.abs(remaining).toFixed(2)} over budget — let's learn something.`;
    } else if (percentage > 80) {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). Heads up — only £${remaining.toFixed(2)} left for ${category} this week.`;
    } else if (percentage > 50) {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). Getting there — £${remaining.toFixed(2)} left this week.`;
    } else {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). Cruising nicely.`;
    }

    if (challengeCompletionText) {
      responseText += challengeCompletionText;
    }

    return {
      functionName: 'log_transaction',
      success: true,
      params,
      data: { transactionId: Date.now(), budgetStatus: budgetCat, percentage },
      responseText,
      xpEarned: totalXP,
      lesson: lesson ?? null,
    };
  } catch (error) {
    return {
      functionName: 'log_transaction',
      success: false,
      params,
      responseText: 'Failed to log transaction.',
      xpEarned: 0,
    };
  }
}

async function handleCheckBudgetStatus(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;

  try {
    const budgetCat = await getBudgetCategory(category);
    if (!budgetCat) {
      return {
        functionName: 'check_budget_status',
        success: false,
        params,
        responseText: `Category "${category}" not found.`,
        xpEarned: 0,
      };
    }

    const remaining = budgetCat.weekly_limit - budgetCat.spent;
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const exceeded = remaining < 0;

    return {
      functionName: 'check_budget_status',
      success: true,
      params,
      data: {
        category: budgetCat,
        remaining,
        exceeded,
        percentage: (budgetCat.spent / budgetCat.weekly_limit) * 100,
      },
      responseText: exceeded
        ? `${categoryName} budget exceeded by £${Math.abs(remaining).toFixed(2)} (£${budgetCat.spent.toFixed(2)} / £${budgetCat.weekly_limit.toFixed(2)})`
        : `${categoryName}: £${remaining.toFixed(2)} remaining (£${budgetCat.spent.toFixed(2)} / £${budgetCat.weekly_limit.toFixed(2)})`,
      xpEarned: 0,
    };
  } catch (error) {
    return {
      functionName: 'check_budget_status',
      success: false,
      params,
      responseText: 'Failed to check budget status.',
      xpEarned: 0,
    };
  }
}

async function handleGetSpendingSummary(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const period = params.period as 'daily' | 'weekly' | 'monthly';

  try {
    const total = await getCategorySpendingTotal(category, period);
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    return {
      functionName: 'get_spending_summary',
      success: true,
      params,
      data: { total, category, period },
      responseText: `${categoryName} spending (${period}): £${total.toFixed(2)}`,
      xpEarned: 0,
    };
  } catch (error) {
    return {
      functionName: 'get_spending_summary',
      success: false,
      params,
      responseText: 'Failed to get spending summary.',
      xpEarned: 0,
    };
  }
}

async function handleDetectSpendingPattern(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const transactionAmount = params.transaction_amount as number;

  try {
    const transactions = await getTransactionsByCategory(category, 'monthly');
    const amounts = transactions.map((t) => t.amount);
    const average = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const isUnusual = transactionAmount > average * 1.5;

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    return {
      functionName: 'detect_spending_pattern',
      success: true,
      params,
      data: { average, isUnusual, transactionAmount },
      responseText: isUnusual
        ? `This £${transactionAmount.toFixed(2)} ${categoryName} purchase is unusual — your average is £${average.toFixed(2)}`
        : `This £${transactionAmount.toFixed(2)} ${categoryName} purchase is within your normal range (avg: £${average.toFixed(2)})`,
      xpEarned: 0,
    };
  } catch (error) {
    return {
      functionName: 'detect_spending_pattern',
      success: false,
      params,
      responseText: 'Failed to detect spending pattern.',
      xpEarned: 0,
    };
  }
}

async function handleGetMicroLesson(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const triggerType = params.trigger_type as string;
  const category = params.category as string | undefined;
  const severity = params.severity as string;

  try {
    const completedLessonRecords = await getCompletedLessons();
    const completedIds = completedLessonRecords.map((l) => l.lesson_id);

    const lesson = getLessonByTrigger(triggerType, category, completedIds);

    if (!lesson) {
      return {
        functionName: 'get_micro_lesson',
        success: false,
        params,
        responseText: 'No suitable lesson found.',
        xpEarned: 0,
      };
    }

    // Mark lesson as completed and award XP
    await markLessonCompleted(lesson.id);
    await updateUserXP(XP_AWARDS.VIEW_LESSON);

    const categoryName = category
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : '';
    const context = category
      ? `${categoryName} budget's looking tight.`
      : 'Your spending patterns are worth a look.';
    const personalityText = getPersonalityResponse(triggerType, context);

    return {
      functionName: 'get_micro_lesson',
      success: true,
      params,
      data: lesson,
      responseText: personalityText,
      xpEarned: XP_AWARDS.VIEW_LESSON,
      lesson,
    };
  } catch (error) {
    return {
      functionName: 'get_micro_lesson',
      success: false,
      params,
      responseText: 'Failed to get micro lesson.',
      xpEarned: 0,
    };
  }
}

async function handleCreateChallenge(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const challengeType = params.challenge_type as string;
  const category = params.category as string;
  const durationDays = params.duration_days as number;
  const xpReward = params.xp_reward as number;

  try {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    let title = '';
    let description = '';

    switch (challengeType) {
      case 'reduce_spending':
        title = `Reduce ${categoryName} spending`;
        description = `Cut back on ${category} for ${durationDays} days`;
        break;
      case 'track_purchases':
        title = `Track all ${categoryName} purchases`;
        description = `Log every ${category} purchase for ${durationDays} days`;
        break;
      case 'plan_budget':
        title = `Plan your ${categoryName} budget`;
        description = `Create a spending plan for ${category}`;
        break;
    }

    const challengeId = await createChallenge({
      title,
      description,
      type: challengeType,
      category,
      duration_days: durationDays,
      xp_reward: xpReward,
    });

    await updateUserXP(XP_AWARDS.ACCEPT_CHALLENGE);

    return {
      functionName: 'create_challenge',
      success: true,
      params,
      data: { challengeId, title, xpReward },
      responseText: `Challenge created: "${title}" — ${durationDays} days for +${xpReward} XP!`,
      xpEarned: XP_AWARDS.ACCEPT_CHALLENGE,
    };
  } catch (error) {
    return {
      functionName: 'create_challenge',
      success: false,
      params,
      responseText: 'Failed to create challenge.',
      xpEarned: 0,
    };
  }
}

async function handleCalculateSavingsImpact(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const dailyAmount = params.daily_amount as number;
  const period = params.period as string;

  let multiplier = 1;
  switch (period) {
    case 'weekly':
      multiplier = 7;
      break;
    case 'monthly':
      multiplier = 30;
      break;
    case 'yearly':
      multiplier = 365;
      break;
  }

  const savings = dailyAmount * multiplier;

  return {
    functionName: 'calculate_savings_impact',
    success: true,
    params,
    data: { dailyAmount, period, savings },
    responseText: `£${dailyAmount.toFixed(2)}/day = £${savings.toFixed(2)}/${period}`,
    xpEarned: 0,
  };
}

async function handleCheckTimeTriggers(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const currentDay = params.current_day as string;
  const currentTime = params.current_time as string;
  const hour = parseInt(currentTime.split(':')[0], 10);

  let triggerType: string | null = null;
  let responseText = '';

  // Payday trigger: 25th-28th of month or last few days
  const today = new Date();
  const dayOfMonth = today.getDate();
  if (dayOfMonth >= 25 && dayOfMonth <= 28) {
    triggerType = 'time_based';
    responseText = "Payday's coming up — let's plan your budget so your money has a job before it arrives.";
  }

  // Weekend trigger: Friday evening or Saturday/Sunday
  if (
    (currentDay === 'Friday' && hour >= 17) ||
    currentDay === 'Saturday' ||
    currentDay === 'Sunday'
  ) {
    triggerType = 'time_based';
    responseText = "It's the weekend! Remember, weekend spending tends to be 40% higher. Set a cap to enjoy yourself guilt-free.";
  }

  // Month-end trigger: last 2 days of month
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  if (dayOfMonth >= lastDay - 1) {
    triggerType = 'time_based';
    responseText = "Month's almost over — time for a quick spending review. Let's see how you did.";
  }

  if (!triggerType) {
    return {
      functionName: 'check_time_triggers',
      success: true,
      params,
      data: { triggered: false },
      responseText: '',
      xpEarned: 0,
    };
  }

  // Get a time-based lesson
  const completedLessonRecords = await getCompletedLessons();
  const completedIds = completedLessonRecords.map((l) => l.lesson_id);
  const lesson = getLessonByTrigger('time_based', undefined, completedIds);

  if (lesson) {
    await markLessonCompleted(lesson.id);
    await updateUserXP(XP_AWARDS.VIEW_LESSON);
  }

  return {
    functionName: 'check_time_triggers',
    success: true,
    params,
    data: { triggered: true, triggerType },
    responseText,
    xpEarned: lesson ? XP_AWARDS.VIEW_LESSON : 0,
    lesson: lesson ?? null,
  };
}

function handleNavigateToScreen(
  params: Record<string, unknown>
): FunctionCallResult {
  const screen = params.screen as string;
  const screenNames: Record<string, string> = {
    budget: 'My Budget',
    lessons: 'Lessons',
    challenges: 'Challenges',
    home: 'Home',
    'how-it-works': 'How It Works',
  };

  return {
    functionName: 'navigate_to_screen',
    success: true,
    params,
    data: { screen },
    responseText: '',
    xpEarned: 0,
  };
}
