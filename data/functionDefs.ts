export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// Dynamic user-facing functions: category enums come from DB
export function getUserFacingFunctions(categoryIds: string[]): FunctionDefinition[] {
  return [
    {
      name: 'log_transaction',
      description: 'Log a new spending transaction from the user\'s natural language input',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category',
            enum: categoryIds,
          },
          amount: {
            type: 'number',
            description: 'Amount spent in GBP',
          },
          description: {
            type: 'string',
            description: 'Brief description of the purchase',
          },
        },
        required: ['category', 'amount', 'description'],
      },
    },
    {
      name: 'check_budget_status',
      description: 'Check current budget status for a category, returns remaining or exceeded amount',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category to check',
            enum: categoryIds,
          },
        },
        required: ['category'],
      },
    },
    {
      name: 'get_spending_summary',
      description: 'Get total spending in a category for a given time period',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category',
            enum: categoryIds,
          },
          period: {
            type: 'string',
            description: 'Time period for the summary',
            enum: ['daily', 'weekly', 'monthly'],
          },
        },
        required: ['category', 'period'],
      },
    },
    {
      name: 'navigate_to_screen',
      description: 'Navigate the user to a different screen in the app. Use when the user asks to see their budget, lessons, challenges, or go home.',
      parameters: {
        type: 'object',
        properties: {
          screen: {
            type: 'string',
            description: 'Screen to navigate to',
            enum: ['budget', 'lessons', 'challenges', 'home', 'how-it-works'],
          },
        },
        required: ['screen'],
      },
    },
  ];
}

// Static fallback for backward compat
const DEFAULT_CATEGORIES = ['coffee', 'food', 'transport', 'entertainment'];
export const USER_FACING_FUNCTIONS: FunctionDefinition[] = getUserFacingFunctions(DEFAULT_CATEGORIES);

// Internal functions: called by orchestration code, never sent to the AI model
export function getInternalFunctions(categoryIds: string[]): FunctionDefinition[] {
  return [
    {
      name: 'detect_spending_pattern',
      description: 'Analyze if a transaction is unusual compared to the user\'s normal spending in that category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category',
            enum: categoryIds,
          },
          transaction_amount: {
            type: 'number',
            description: 'Amount of the transaction to analyze',
          },
        },
        required: ['category', 'transaction_amount'],
      },
    },
    {
      name: 'get_micro_lesson',
      description: 'Select an appropriate financial micro-lesson based on trigger type and spending context',
      parameters: {
        type: 'object',
        properties: {
          trigger_type: {
            type: 'string',
            description: 'What triggered the lesson',
            enum: ['budget_exceeded', 'unusual_pattern', 'time_based'],
          },
          category: {
            type: 'string',
            description: 'Related budget category',
            enum: categoryIds,
          },
          severity: {
            type: 'string',
            description: 'How severe the financial concern is',
            enum: ['mild', 'moderate', 'severe'],
          },
        },
        required: ['trigger_type', 'category', 'severity'],
      },
    },
    {
      name: 'create_challenge',
      description: 'Create a spending challenge for the user to help improve their financial habits',
      parameters: {
        type: 'object',
        properties: {
          challenge_type: {
            type: 'string',
            description: 'Type of challenge',
            enum: ['reduce_spending', 'track_purchases', 'plan_budget'],
          },
          category: {
            type: 'string',
            description: 'Budget category for the challenge',
            enum: categoryIds,
          },
          duration_days: {
            type: 'number',
            description: 'Duration of the challenge in days',
          },
          xp_reward: {
            type: 'number',
            description: 'XP reward for completing the challenge',
          },
        },
        required: ['challenge_type', 'category', 'duration_days', 'xp_reward'],
      },
    },
    {
      name: 'calculate_savings_impact',
      description: 'Calculate the long-term savings if the user reduces spending by a certain daily amount',
      parameters: {
        type: 'object',
        properties: {
          daily_amount: {
            type: 'number',
            description: 'Amount saved per day in GBP',
          },
          period: {
            type: 'string',
            description: 'Period to project savings over',
            enum: ['weekly', 'monthly', 'yearly'],
          },
        },
        required: ['daily_amount', 'period'],
      },
    },
    {
      name: 'check_time_triggers',
      description: 'Check if any time-based financial events should fire such as payday reminders, weekend alerts, or month-end reviews',
      parameters: {
        type: 'object',
        properties: {
          current_day: {
            type: 'string',
            description: 'Current day of the week (e.g. Monday, Friday)',
          },
          current_time: {
            type: 'string',
            description: 'Current time in HH:MM format',
          },
        },
        required: ['current_day', 'current_time'],
      },
    },
  ];
}

export const INTERNAL_FUNCTIONS: FunctionDefinition[] = getInternalFunctions(DEFAULT_CATEGORIES);

// Full array for backward compatibility
export const FUNCTION_DEFINITIONS: FunctionDefinition[] = [
  ...USER_FACING_FUNCTIONS,
  ...INTERNAL_FUNCTIONS,
];

export function formatFunctionDefsForPrompt(): string {
  return FUNCTION_DEFINITIONS.map((fn) => {
    const params = Object.entries(fn.parameters.properties)
      .map(([key, val]) => {
        let paramStr = `    ${key}: ${val.type} — ${val.description}`;
        if (val.enum) {
          paramStr += ` (one of: ${val.enum.join(', ')})`;
        }
        return paramStr;
      })
      .join('\n');

    return `Function: ${fn.name}\nDescription: ${fn.description}\nParameters:\n${params}\nRequired: ${fn.parameters.required.join(', ')}`;
  }).join('\n\n');
}
