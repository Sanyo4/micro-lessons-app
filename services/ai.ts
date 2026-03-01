import {
  CactusLM,
  type CactusLMMessage,
  type CactusLMTool,
} from 'cactus-react-native';
import { FUNCTION_DEFINITIONS, USER_FACING_FUNCTIONS } from '../data/functionDefs';
import { executeFunctionCall, type FunctionCallResult } from './functionExecutor';
import { getBudgetCategories, type BudgetCategory } from './database';

export interface AIResult {
  responseText: string;
  executedFunctions: FunctionCallResult[];
  lesson?: {
    id: string;
    title: string;
    body: string;
    insight: string;
    triggerType: string;
    xpReward: number;
    challengeTemplate: {
      title: string;
      description: string;
      type: string;
      duration_days: number;
      xp_reward: number;
    };
  } | null;
  xpEarned: number;
  navigateTo?: string | null;
}

class GemmaAIService {
  private model: CactusLM | null = null;
  private isInitialized = false;
  private isInitializing = false;

  async init(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.model = new CactusLM({
        model: 'functiongemma-270m-it',
      });

      await this.model.download({
        onProgress: (progress) => {
          onProgress?.(progress);
        },
      });

      await this.model.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  getInitStatus(): boolean {
    return this.isInitialized;
  }

  async processUserInput(userText: string): Promise<AIResult> {
    const budgetState = await getBudgetCategories();
    const budgetContext = this.buildBudgetContext(budgetState);

    // Convert our function definitions to Cactus Tool format
    const tools: CactusLMTool[] = USER_FACING_FUNCTIONS.map((fn) => ({
      name: fn.name,
      description: fn.description,
      parameters: {
        type: 'object' as const,
        properties: Object.fromEntries(
          Object.entries(fn.parameters.properties).map(([key, val]) => [
            key,
            { type: val.type, description: val.description + (val.enum ? ` (one of: ${val.enum.join(', ')})` : '') },
          ])
        ),
        required: fn.parameters.required,
      },
    }));

    const messages: CactusLMMessage[] = [
      {
        role: 'system',
        content: `You are a financial assistant for a budgeting app. Parse the user's natural language input and call the appropriate function.

When the user reports spending, call log_transaction with the category, amount, and description.
When the user asks to see their budget, lessons, or challenges, call navigate_to_screen.
When the user asks about their spending, call check_budget_status or get_spending_summary.

Current budget state:
${budgetContext}`,
      },
      {
        role: 'user',
        content: userText,
      },
    ];

    try {
      if (!this.model) throw new Error('Model not initialized');

      // Use forceTools to ensure the model always produces a function call
      const result = await this.model.complete({
        messages,
        tools,
        options: {
          temperature: 0.3,
          maxTokens: 256,
          forceTools: true,
        },
      });

      const executedFunctions: FunctionCallResult[] = [];
      let responseText = result.response || '';
      let totalXP = 0;
      let lessonResult: AIResult['lesson'] = null;
      let navigateTo: string | null = null;

      // Execute any function calls from the model
      if (result.functionCalls && result.functionCalls.length > 0) {
        for (const call of result.functionCalls) {
          // Handle navigation separately
          if (call.name === 'navigate_to_screen') {
            navigateTo = (call.arguments as Record<string, unknown>).screen as string;
            continue;
          }

          const fnResult = await executeFunctionCall({
            name: call.name,
            arguments: call.arguments as Record<string, unknown>,
          });
          executedFunctions.push(fnResult);
          totalXP += fnResult.xpEarned;

          if (fnResult.lesson) {
            lessonResult = fnResult.lesson;
          }

          if (fnResult.responseText) {
            responseText = fnResult.responseText;
          }
        }

      } else {
        // Model returned no function calls despite forceTools — use fallback
        return this.fallbackParse(userText);
      }

      // Build a friendly response if we don't have one
      if (!responseText && executedFunctions.length > 0) {
        responseText = this.buildResponseText(executedFunctions);
      }

      // If navigating, no need for response text
      if (navigateTo) {
        return {
          responseText: responseText || '',
          executedFunctions,
          lesson: lessonResult,
          xpEarned: totalXP,
          navigateTo,
        };
      }

      return {
        responseText: responseText || "I couldn't quite understand that. Try something like \"spent 5 quid on coffee\" or \"show my budget\".",
        executedFunctions,
        lesson: lessonResult,
        xpEarned: totalXP,
        navigateTo: null,
      };
    } catch (error) {
      console.error('AI processing error:', error);
      // Fallback: try to parse manually
      return this.fallbackParse(userText);
    }
  }

  async checkTimeTriggers(): Promise<AIResult | null> {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const fnResult = await executeFunctionCall({
      name: 'check_time_triggers',
      arguments: { current_day: currentDay, current_time: currentTime },
    });

    if (fnResult.success && fnResult.lesson) {
      return {
        responseText: fnResult.responseText || '',
        executedFunctions: [fnResult],
        lesson: fnResult.lesson,
        xpEarned: fnResult.xpEarned,
        navigateTo: null,
      };
    }

    return null;
  }

  private buildBudgetContext(categories: BudgetCategory[]): string {
    return categories
      .map(
        (cat) =>
          `- ${cat.name} (${cat.icon}): £${cat.spent.toFixed(2)} / £${cat.weekly_limit.toFixed(2)} ${cat.spent > cat.weekly_limit ? '⚠️ EXCEEDED' : cat.spent > cat.weekly_limit * 0.8 ? '⚠️ Near limit' : '✅ OK'}`
      )
      .join('\n');
  }

  private buildResponseText(executedFunctions: FunctionCallResult[]): string {
    const logFn = executedFunctions.find((f) => f.functionName === 'log_transaction');
    if (logFn && logFn.success) {
      const params = logFn.params as Record<string, unknown>;
      return `Got it — £${params.amount} ${params.description} logged to ${(params.category as string).charAt(0).toUpperCase() + (params.category as string).slice(1)}`;
    }
    return '';
  }

  private async fallbackParse(userText: string): Promise<AIResult> {
    // Check for navigation intents first
    const lowerText = userText.toLowerCase();
    const navKeywords: Record<string, string[]> = {
      budget: ['budget', 'budgets', 'spending', 'how much'],
      lessons: ['lesson', 'lessons', 'learn', 'teach'],
      challenges: ['challenge', 'challenges'],
    };

    for (const [screen, keywords] of Object.entries(navKeywords)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        return {
          responseText: '',
          executedFunctions: [],
          lesson: null,
          xpEarned: 0,
          navigateTo: screen,
        };
      }
    }

    // Parse spending transactions
    const amountMatch = userText.match(/(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    const categoryKeywords: Record<string, string[]> = {
      coffee: ['coffee', 'latte', 'cappuccino', 'espresso', 'flat white', 'mocha', 'cafe', 'starbucks', 'costa'],
      food: ['food', 'lunch', 'dinner', 'breakfast', 'meal', 'pizza', 'burger', 'sushi', 'groceries', 'pret', 'eat', 'ate'],
      transport: ['uber', 'taxi', 'bus', 'train', 'transport', 'fare', 'tube', 'metro', 'ride'],
      entertainment: ['cinema', 'movie', 'game', 'concert', 'show', 'ticket', 'netflix', 'spotify', 'pub', 'bar', 'drinks'],
    };

    let detectedCategory: string | null = null;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }

    if (amount && detectedCategory) {
      const executedFunctions: FunctionCallResult[] = [];
      let totalXP = 0;
      let lessonResult: AIResult['lesson'] = null;
      let responseText = '';

      const logResult = await executeFunctionCall({
        name: 'log_transaction',
        arguments: { category: detectedCategory, amount, description: userText.replace(/[0-9.,£$]+/g, '').trim() || detectedCategory },
      });
      executedFunctions.push(logResult);
      totalXP += logResult.xpEarned;
      responseText = logResult.responseText || '';

      if (logResult.success) {
        const budgetResult = await executeFunctionCall({
          name: 'check_budget_status',
          arguments: { category: detectedCategory },
        });
        executedFunctions.push(budgetResult);

        const budgetData = budgetResult.data as { exceeded?: boolean; percentage?: number } | undefined;
        if (budgetData?.exceeded) {
          const lessonFnResult = await executeFunctionCall({
            name: 'get_micro_lesson',
            arguments: { trigger_type: 'budget_exceeded', category: detectedCategory, severity: 'mild' },
          });
          executedFunctions.push(lessonFnResult);
          totalXP += lessonFnResult.xpEarned;
          if (lessonFnResult.lesson) {
            lessonResult = lessonFnResult.lesson;
          }
        }
      }

      return {
        responseText,
        executedFunctions,
        lesson: lessonResult,
        xpEarned: totalXP,
        navigateTo: null,
      };
    }

    return {
      responseText: "I couldn't quite understand that. Try something like \"spent 5 quid on coffee\" or \"show my budget\".",
      executedFunctions: [],
      lesson: null,
      xpEarned: 0,
      navigateTo: null,
    };
  }

  async destroy(): Promise<void> {
    if (this.model) {
      await this.model.destroy();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const aiService = new GemmaAIService();
