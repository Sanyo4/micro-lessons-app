// On-device AI via Cactus (FunctionGemma) — no cloud dependency
import {
  CactusLM,
  type CactusLMMessage,
  type CactusLMTool,
} from 'cactus-react-native';

import { getUserFacingFunctions } from '../data/functionDefs';
import { executeFunctionCall, type FunctionCallResult, type ContentType } from './functionExecutor';
import { getBudgetCategories, getBudgetCategory, getAppSettings, type BudgetCategory } from './database';
import { getPlanById } from '../data/plans';
import { conversationContext, type ContextResult } from './conversationContext';

export interface PendingTransaction {
  amount: number;
  category: string;
  categoryName: string;
  description: string;
  budgetSpent: number;
  budgetLimit: number;
}

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
  contentType?: ContentType;
  pendingTransaction?: PendingTransaction | null;
  game?: string | null;
  lessonAction?: 'accept' | 'dismiss';
}

const PERSONA_PROMPTS: Record<string, string> = {
  beginner: 'Communication style: Keep it simple. No financial jargon. Use plain everyday language.',
  learner: 'Communication style: Explain the why behind financial concepts. Use some terminology but always explain it.',
  pro: 'Communication style: Use precise financial terminology. Reference ISA rates, APR, compound interest when relevant.',
};

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

  /**
   * Phase 1: Parse user input and identify function calls.
   * Executes non-transaction functions immediately.
   * Defers log_transaction for user confirmation.
   */
  async parseUserInput(userText: string): Promise<AIResult> {
    // Check conversation context first (confirmation, games)
    const contextResult = conversationContext.intercept(userText);
    if (contextResult.handled) {
      return this.contextResultToAIResult(contextResult);
    }

    const budgetState = await getBudgetCategories();
    const categoryIds = budgetState.map((c) => c.id);
    const budgetContext = this.buildBudgetContext(budgetState);

    const settings = await getAppSettings();
    const personaPrompt = PERSONA_PROMPTS[settings?.financial_persona || 'beginner'] || PERSONA_PROMPTS.beginner;

    const userFunctions = getUserFacingFunctions(categoryIds);

    const tools: CactusLMTool[] = userFunctions.map((fn) => ({
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
When the user asks about their overall budget, call get_budget_overview.
When the user asks about a specific category, call get_category_detail or check_budget_status.
When the user wants to change a budget limit, call adjust_budget_limit.
When the user asks what they spent recently, call get_recent_transactions.
When the user asks about quests or challenges, call get_quest_log.
When the user wants to start a challenge, call accept_challenge.
When the user asks about their pet, call check_pet_status.
When the user asks about mood history, call get_mood_history.
When the user asks about savings potential, call get_savings_projection.
When the user asks for help or what they can do, call get_help.

${personaPrompt}

Current budget state:
${budgetContext}`,
      },
      {
        role: 'user',
        content: userText,
      },
    ];

    try {
      if (!this.isInitialized || !this.model) throw new Error('Model not initialized');

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
      let contentType: ContentType | undefined;
      let pendingTransaction: PendingTransaction | null = null;

      if (result.functionCalls && result.functionCalls.length > 0) {
        for (const call of result.functionCalls) {
          // Defer log_transaction for confirmation
          if (call.name === 'log_transaction') {
            const args = call.arguments as Record<string, unknown>;
            const category = args.category as string;
            const amount = args.amount as number;
            const description = args.description as string || category;

            // Look up budget info for the confirmation sheet
            const budgetCat = await getBudgetCategory(category);
            const catName = budgetState.find(c => c.id === category)?.name || category;

            pendingTransaction = {
              amount,
              category,
              categoryName: catName,
              description,
              budgetSpent: budgetCat?.spent ?? 0,
              budgetLimit: budgetCat?.weekly_limit ?? 0,
            };
            continue;
          }

          // Execute non-transaction functions immediately
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
          if (fnResult.contentType) {
            contentType = fnResult.contentType;
          }
        }
      } else {
        return this.fallbackParse(userText);
      }

      if (!responseText && executedFunctions.length > 0) {
        responseText = this.buildResponseText(executedFunctions);
      }

      // If there's a pending transaction, start the confirmation flow
      if (pendingTransaction) {
        conversationContext.startConfirmation(pendingTransaction);
        contentType = 'confirmation';
      }

      return {
        responseText: responseText || '',
        executedFunctions,
        lesson: lessonResult,
        xpEarned: totalXP,
        contentType,
        pendingTransaction,
      };
    } catch (error) {
      console.error('AI processing error:', error);
      return this.fallbackParse(userText);
    }
  }

  /**
   * Phase 2: Execute a confirmed transaction.
   * Called after user confirms in the ConfirmationSheet.
   */
  async executeConfirmedTransaction(pending: PendingTransaction): Promise<AIResult> {
    const fnResult = await executeFunctionCall({
      name: 'log_transaction',
      arguments: {
        category: pending.category,
        amount: pending.amount,
        description: pending.description,
      },
    });

    // Start game flow if triggered
    if (fnResult.game) {
      conversationContext.startGame(fnResult.game as 'needs_vs_wants' | 'bnpl');
    }

    return {
      responseText: fnResult.responseText || `Logged \u00A3${pending.amount.toFixed(2)} to ${pending.categoryName}`,
      executedFunctions: [fnResult],
      lesson: fnResult.lesson || null,
      xpEarned: fnResult.xpEarned,
      contentType: fnResult.game ? (fnResult.game === 'needs_vs_wants' ? 'game_needs_vs_wants' : 'game_bnpl') : undefined,
      game: fnResult.game || null,
    };
  }

  /**
   * Legacy method — calls parseUserInput for backward compatibility.
   * @deprecated Use parseUserInput + executeConfirmedTransaction instead.
   */
  async processUserInput(userText: string): Promise<AIResult> {
    return this.parseUserInput(userText);
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
      };
    }

    return null;
  }

  private contextResultToAIResult(ctx: ContextResult): AIResult {
    return {
      responseText: ctx.responseText || '',
      executedFunctions: [],
      lesson: null,
      xpEarned: ctx.xpEarned || 0,
      contentType: ctx.contentType,
      pendingTransaction: ctx.executeTransaction || null,
      game: ctx.gameState?.type || null,
      lessonAction: ctx.lessonAction,
    };
  }

  private buildBudgetContext(categories: BudgetCategory[]): string {
    return categories
      .map(
        (cat) =>
          `- ${cat.name} (${cat.icon}): \u00A3${cat.spent.toFixed(2)} / \u00A3${cat.weekly_limit.toFixed(2)} ${cat.spent > cat.weekly_limit ? '\u26A0\uFE0F EXCEEDED' : cat.spent > cat.weekly_limit * 0.8 ? '\u26A0\uFE0F Near limit' : '\u2705 OK'}`
      )
      .join('\n');
  }

  private buildResponseText(executedFunctions: FunctionCallResult[]): string {
    const logFn = executedFunctions.find((f) => f.functionName === 'log_transaction');
    if (logFn && logFn.success) {
      const params = logFn.params as Record<string, unknown>;
      return `Got it \u2014 \u00A3${params.amount} ${params.description} logged to ${(params.category as string).charAt(0).toUpperCase() + (params.category as string).slice(1)}`;
    }
    return '';
  }

  private async fallbackParse(userText: string): Promise<AIResult> {
    const lowerText = userText.toLowerCase();

    // Fallback: check for adjust/increase/decrease + category first (before generic "budget")
    const adjustKeywords = ['adjust', 'change limit', 'increase', 'decrease', 'raise', 'lower'];
    if (adjustKeywords.some((kw) => lowerText.includes(kw))) {
      const cats = await getBudgetCategories();
      const matchedCat = cats.find((c) => lowerText.includes(c.name.toLowerCase()) || lowerText.includes(c.id.toLowerCase()));
      if (matchedCat) {
        const direction = lowerText.includes('increase') || lowerText.includes('raise') || lowerText.includes('more')
          ? 'increase'
          : lowerText.includes('decrease') || lowerText.includes('lower') || lowerText.includes('less') || lowerText.includes('reduce')
            ? 'decrease'
            : undefined;
        const amountMatch = lowerText.match(/(?:by\s+)?(\d+(?:\.\d{1,2})?)/);
        const args: Record<string, unknown> = { category: matchedCat.id };
        if (direction) args.direction = direction;
        if (amountMatch) args.amount = parseFloat(amountMatch[1]);

        const fnResult = await executeFunctionCall({ name: 'adjust_budget_limit', arguments: args });
        return {
          responseText: fnResult.responseText || '',
          executedFunctions: [fnResult],
          lesson: null,
          xpEarned: fnResult.xpEarned,
          contentType: fnResult.contentType,
        };
      }
    }

    // Fallback function routing via keywords
    // Order matters — more specific phrases must come before generic ones
    const functionKeywords: Array<{ fn: string; args: Record<string, unknown>; keywords: string[] }> = [
      { fn: 'get_help', args: {}, keywords: ['help', 'what can i do', 'what can i say'] },
      { fn: 'open_settings', args: {}, keywords: ['settings', 'open settings', 'preferences', 'edit name', 'rename'] },
      { fn: 'accept_challenge', args: {}, keywords: ['start a challenge', 'accept challenge', 'new quest', 'start quest', 'start challenge'] },
      { fn: 'get_budget_overview', args: {}, keywords: ['budget', 'budgets', 'how much left', 'overview'] },
      { fn: 'get_quest_log', args: {}, keywords: ['quest log', 'quests', 'quest progress', 'challenges', 'my challenges', 'show quests'] },
      { fn: 'check_pet_status', args: {}, keywords: ['how is buddy', "how's buddy", 'pet status', 'how are you'] },
      { fn: 'get_recent_transactions', args: {}, keywords: ['recent', 'last transactions', 'what did i spend', 'history'] },
      { fn: 'get_mood_history', args: {}, keywords: ['mood history', 'mood', 'how has buddy been'] },
    ];

    for (const route of functionKeywords) {
      if (route.keywords.some((kw) => lowerText.includes(kw))) {
        const fnResult = await executeFunctionCall({ name: route.fn, arguments: route.args });
        return {
          responseText: fnResult.responseText || '',
          executedFunctions: [fnResult],
          lesson: null,
          xpEarned: fnResult.xpEarned,
          contentType: fnResult.contentType,
        };
      }
    }

    // Build keyword map from DB categories + plan categories
    const categories = await getBudgetCategories();
    const settings = await getAppSettings();
    const plan = settings?.selected_plan_id ? getPlanById(settings.selected_plan_id) : null;

    const categoryKeywords: Record<string, string[]> = {};
    for (const cat of categories) {
      categoryKeywords[cat.id] = [cat.name.toLowerCase()];
    }
    if (plan) {
      for (const planCat of plan.categories) {
        if (categoryKeywords[planCat.id]) {
          categoryKeywords[planCat.id] = [...new Set([...categoryKeywords[planCat.id], ...planCat.keywords])];
        }
      }
    }

    const fallbackKeywords: Record<string, string[]> = {
      coffee: ['coffee', 'latte', 'cappuccino', 'espresso', 'flat white', 'mocha', 'cafe', 'starbucks', 'costa'],
      food: ['food', 'lunch', 'dinner', 'breakfast', 'meal', 'pizza', 'burger', 'sushi', 'groceries', 'pret', 'eat', 'ate'],
      transport: ['uber', 'taxi', 'bus', 'train', 'transport', 'fare', 'tube', 'metro', 'ride', 'petrol'],
      entertainment: ['cinema', 'movie', 'game', 'concert', 'show', 'ticket', 'netflix', 'spotify', 'pub', 'bar', 'drinks'],
      groceries: ['groceries', 'supermarket', 'tesco', 'aldi', 'lidl', 'sainsburys'],
      dining: ['restaurant', 'dining', 'takeaway', 'nandos'],
      shopping: ['clothes', 'shoes', 'amazon', 'shopping', 'online'],
      social: ['pub', 'bar', 'drinks', 'party'],
    };
    for (const [id, kws] of Object.entries(fallbackKeywords)) {
      if (categoryKeywords[id]) {
        categoryKeywords[id] = [...new Set([...categoryKeywords[id], ...kws])];
      }
    }

    // Parse spending transactions
    const amountMatch = userText.match(/(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    let detectedCategory: string | null = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }

    if (amount && detectedCategory) {
      // Defer for confirmation instead of executing immediately
      const budgetCat = await getBudgetCategory(detectedCategory);
      const catName = categories.find(c => c.id === detectedCategory)?.name || detectedCategory;
      const description = userText.replace(/[0-9.,£$]+/g, '').trim() || detectedCategory;

      const pending: PendingTransaction = {
        amount,
        category: detectedCategory,
        categoryName: catName,
        description,
        budgetSpent: budgetCat?.spent ?? 0,
        budgetLimit: budgetCat?.weekly_limit ?? 0,
      };
      conversationContext.startConfirmation(pending);

      return {
        responseText: '',
        executedFunctions: [],
        lesson: null,
        xpEarned: 0,
        contentType: 'confirmation',
        pendingTransaction: pending,
      };
    }

    return {
      responseText: "I couldn't quite understand that. Try saying \"spent 5 on coffee\", \"how's my budget\", or \"help\".",
      executedFunctions: [],
      lesson: null,
      xpEarned: 0,
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
