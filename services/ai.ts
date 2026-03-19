// import {
//   CactusLM,
//   type CactusLMMessage,
//   type CactusLMTool,
// } from 'cactus-react-native';

// --- HuggingFace Inference API (dev mode replacement for Cactus on-device) ---
const HF_API_URL = 'https://api-inference.huggingface.co/models/google/functiongemma-270m-it/v1/chat/completions';
const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY ?? '';

type CactusLMMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type CactusLMTool = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

import { getUserFacingFunctions } from '../data/functionDefs';
import { executeFunctionCall, type FunctionCallResult } from './functionExecutor';
import { getBudgetCategories, getAppSettings, type BudgetCategory } from './database';
import { getPlanById } from '../data/plans';

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

const PERSONA_PROMPTS: Record<string, string> = {
  beginner: 'Communication style: Keep it simple. No financial jargon. Use plain everyday language.',
  learner: 'Communication style: Explain the why behind financial concepts. Use some terminology but always explain it.',
  pro: 'Communication style: Use precise financial terminology. Reference ISA rates, APR, compound interest when relevant.',
};

class GemmaAIService {
  // private model: CactusLM | null = null;  // cactus on-device model
  private isInitialized = false;
  private isInitializing = false;

  async init(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    // --- HuggingFace API: no download/init needed ---
    onProgress?.(1);
    this.isInitialized = true;
    this.isInitializing = false;

    // --- Cactus on-device init (commented out) ---
    // try {
    //   this.model = new CactusLM({
    //     model: 'functiongemma-270m-it',
    //   });
    //   await this.model.download({
    //     onProgress: (progress) => {
    //       onProgress?.(progress);
    //     },
    //   });
    //   await this.model.init();
    //   this.isInitialized = true;
    // } catch (error) {
    //   console.error('Failed to initialize AI model:', error);
    //   throw error;
    // } finally {
    //   this.isInitializing = false;
    // }
  }

  getInitStatus(): boolean {
    return this.isInitialized;
  }

  async processUserInput(userText: string): Promise<AIResult> {
    const budgetState = await getBudgetCategories();
    const categoryIds = budgetState.map((c) => c.id);
    const budgetContext = this.buildBudgetContext(budgetState);

    // Load persona for system prompt
    const settings = await getAppSettings();
    const personaPrompt = PERSONA_PROMPTS[settings?.financial_persona || 'beginner'] || PERSONA_PROMPTS.beginner;

    // Get dynamic function defs based on actual categories
    const userFunctions = getUserFacingFunctions(categoryIds);

    // Convert our function definitions to Cactus Tool format
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
When the user asks to see their budget, lessons, or challenges, call navigate_to_screen.
When the user asks about their spending, call check_budget_status or get_spending_summary.

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
      if (!this.isInitialized) throw new Error('Model not initialized');

      // --- HuggingFace Inference API call ---
      if (!HF_API_KEY) console.warn('[AI] HF_API_KEY is empty — check .env.local has EXPO_PUBLIC_HF_API_KEY set');

      const hfRes = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          tools: tools.map((t) => ({ type: 'function', function: t })),
          tool_choice: 'required', // equivalent to cactus forceTools: true
          temperature: 0.3,
          max_tokens: 256,
        }),
      });

      if (!hfRes.ok) {
        const errText = await hfRes.text();
        console.error(`[AI] HF API error ${hfRes.status}:`, errText);
        throw new Error(`HF API ${hfRes.status}: ${errText}`);
      }

      const hfData = await hfRes.json();
      console.log('[AI] HF response:', JSON.stringify(hfData).slice(0, 300));
      const hfMessage = hfData.choices?.[0]?.message;
      const result = {
        response: hfMessage?.content ?? '',
        functionCalls: hfMessage?.tool_calls?.map((tc: { function: { name: string; arguments: string } }) => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })) ?? [],
      };

      // --- Cactus on-device completion (commented out) ---
      // const result = await this.model.complete({
      //   messages,
      //   tools,
      //   options: {
      //     temperature: 0.3,
      //     maxTokens: 256,
      //     forceTools: true,
      //   },
      // });

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

    // Build keyword map from DB categories + plan categories
    const categories = await getBudgetCategories();
    const settings = await getAppSettings();
    const plan = settings?.selected_plan_id ? getPlanById(settings.selected_plan_id) : null;

    const categoryKeywords: Record<string, string[]> = {};
    for (const cat of categories) {
      // Start with category name as keyword
      categoryKeywords[cat.id] = [cat.name.toLowerCase()];
    }
    // Add plan keywords if available
    if (plan) {
      for (const planCat of plan.categories) {
        if (categoryKeywords[planCat.id]) {
          categoryKeywords[planCat.id] = [...new Set([...categoryKeywords[planCat.id], ...planCat.keywords])];
        }
      }
    }

    // Fallback hardcoded keywords for common categories
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
    // --- HuggingFace API: nothing to tear down ---
    this.isInitialized = false;

    // --- Cactus on-device teardown (commented out) ---
    // if (this.model) {
    //   await this.model.destroy();
    //   this.model = null;
    //   this.isInitialized = false;
    // }
  }
}

// Singleton instance
export const aiService = new GemmaAIService();
