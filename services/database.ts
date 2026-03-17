import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('microlessons.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      weekly_limit REAL NOT NULL,
      spent REAL DEFAULT 0,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES budget_categories(id)
    );

    CREATE TABLE IF NOT EXISTS completed_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      xp_reward INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin_hash TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      input_preference TEXT DEFAULT 'voice',
      financial_persona TEXT DEFAULT 'beginner',
      selected_plan_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT DEFAULT 'monthly'
    );

    CREATE TABLE IF NOT EXISTS motivation_focuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      focus_key TEXT NOT NULL UNIQUE,
      selected INTEGER DEFAULT 0
    );
  `);

  // Migrate user_profile: add columns if missing
  try {
    await database.execAsync('ALTER TABLE user_profile ADD COLUMN monthly_income REAL DEFAULT 0');
  } catch (_) { /* column already exists */ }
  try {
    await database.execAsync('ALTER TABLE user_profile ADD COLUMN flexible_budget REAL DEFAULT 0');
  } catch (_) { /* column already exists */ }
}

// ========== App Settings ==========

export async function getAppSettings(): Promise<AppSettings | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<AppSettings>('SELECT * FROM app_settings WHERE id = 1');
  return result ?? null;
}

export async function createAppSettings(pinHash: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO app_settings (id, pin_hash, onboarding_completed, input_preference, financial_persona, selected_plan_id, created_at) VALUES (1, ?, 0, ?, ?, ?, ?)',
    [pinHash, 'voice', 'beginner', null, new Date().toISOString()]
  );
}

export async function updateAppSettings(partial: Partial<Omit<AppSettings, 'id' | 'created_at'>>): Promise<void> {
  const database = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (partial.pin_hash !== undefined) { sets.push('pin_hash = ?'); values.push(partial.pin_hash ?? null); }
  if (partial.onboarding_completed !== undefined) { sets.push('onboarding_completed = ?'); values.push(partial.onboarding_completed); }
  if (partial.input_preference !== undefined) { sets.push('input_preference = ?'); values.push(partial.input_preference); }
  if (partial.financial_persona !== undefined) { sets.push('financial_persona = ?'); values.push(partial.financial_persona); }
  if (partial.selected_plan_id !== undefined) { sets.push('selected_plan_id = ?'); values.push(partial.selected_plan_id ?? null); }
  if (sets.length === 0) return;
  await database.runAsync(`UPDATE app_settings SET ${sets.join(', ')} WHERE id = 1`, values);
}

export async function verifyPin(inputHash: string): Promise<boolean> {
  const settings = await getAppSettings();
  if (!settings?.pin_hash) return false;
  return settings.pin_hash === inputHash;
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const settings = await getAppSettings();
  return settings?.onboarding_completed === 1;
}

// ========== Fixed Expenses ==========

export async function getFixedExpenses(): Promise<FixedExpense[]> {
  const database = await getDatabase();
  return database.getAllAsync<FixedExpense>('SELECT * FROM fixed_expenses ORDER BY id');
}

export async function addFixedExpense(name: string, amount: number, frequency: string = 'monthly'): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO fixed_expenses (name, amount, frequency) VALUES (?, ?, ?)',
    [name, amount, frequency]
  );
}

export async function clearFixedExpenses(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM fixed_expenses');
}

// ========== Motivation Focuses ==========

export async function getMotivationFocuses(): Promise<{ focus_key: string; selected: number }[]> {
  const database = await getDatabase();
  return database.getAllAsync<{ focus_key: string; selected: number }>('SELECT focus_key, selected FROM motivation_focuses');
}

export async function setMotivationFocuses(keys: string[]): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM motivation_focuses');
  for (const key of keys) {
    await database.runAsync(
      'INSERT INTO motivation_focuses (focus_key, selected) VALUES (?, 1)',
      [key]
    );
  }
}

// ========== User Profile ==========

export async function getUserProfile(): Promise<UserProfile | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<UserProfile>('SELECT * FROM user_profile LIMIT 1');
  return result ?? null;
}

export async function updateUserXP(xpToAdd: number): Promise<UserProfile> {
  const database = await getDatabase();
  await database.runAsync('UPDATE user_profile SET xp = xp + ? WHERE id = 1', [xpToAdd]);
  const profile = await getUserProfile();
  return profile!;
}

export async function updateUserLevel(level: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE user_profile SET level = ? WHERE id = 1', [level]);
}

export async function updateUserProfile(partial: Partial<Omit<UserProfile, 'id'>>): Promise<void> {
  const database = await getDatabase();
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (partial.name !== undefined) { sets.push('name = ?'); values.push(partial.name); }
  if (partial.xp !== undefined) { sets.push('xp = ?'); values.push(partial.xp); }
  if (partial.level !== undefined) { sets.push('level = ?'); values.push(partial.level); }
  if (partial.streak_days !== undefined) { sets.push('streak_days = ?'); values.push(partial.streak_days); }
  if (partial.monthly_income !== undefined) { sets.push('monthly_income = ?'); values.push(partial.monthly_income); }
  if (partial.flexible_budget !== undefined) { sets.push('flexible_budget = ?'); values.push(partial.flexible_budget); }
  if (sets.length === 0) return;
  await database.runAsync(`UPDATE user_profile SET ${sets.join(', ')} WHERE id = 1`, values);
}

// ========== Budget Categories ==========

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  const database = await getDatabase();
  return database.getAllAsync<BudgetCategory>('SELECT * FROM budget_categories ORDER BY name');
}

export async function getBudgetCategory(categoryId: string): Promise<BudgetCategory | null> {
  const database = await getDatabase();
  return database.getFirstAsync<BudgetCategory>(
    'SELECT * FROM budget_categories WHERE id = ?',
    [categoryId]
  );
}

export async function updateCategorySpent(categoryId: string, amount: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE budget_categories SET spent = spent + ? WHERE id = ?',
    [amount, categoryId]
  );
}

// ========== Transactions ==========

export async function addTransaction(
  amount: number,
  categoryId: string,
  description: string
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO transactions (amount, category_id, description, timestamp) VALUES (?, ?, ?, ?)',
    [amount, categoryId, description, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  const database = await getDatabase();
  return database.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
}

export async function getTransactionsByCategory(
  categoryId: string,
  period?: 'daily' | 'weekly' | 'monthly'
): Promise<Transaction[]> {
  const database = await getDatabase();
  let dateFilter = '';
  if (period === 'daily') {
    dateFilter = "AND timestamp >= datetime('now', '-1 day')";
  } else if (period === 'weekly') {
    dateFilter = "AND timestamp >= datetime('now', '-7 days')";
  } else if (period === 'monthly') {
    dateFilter = "AND timestamp >= datetime('now', '-30 days')";
  }

  return database.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE category_id = ? ${dateFilter} ORDER BY timestamp DESC`,
    [categoryId]
  );
}

export async function getCategorySpendingTotal(
  categoryId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<number> {
  const database = await getDatabase();
  let dateFilter = '';
  if (period === 'daily') {
    dateFilter = "AND timestamp >= datetime('now', '-1 day')";
  } else if (period === 'weekly') {
    dateFilter = "AND timestamp >= datetime('now', '-7 days')";
  } else if (period === 'monthly') {
    dateFilter = "AND timestamp >= datetime('now', '-30 days')";
  }

  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id = ? ${dateFilter}`,
    [categoryId]
  );
  return result?.total ?? 0;
}

// ========== Lessons ==========

export async function markLessonCompleted(lessonId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO completed_lessons (lesson_id, completed_at) VALUES (?, ?)',
    [lessonId, new Date().toISOString()]
  );
}

export async function getCompletedLessons(): Promise<CompletedLesson[]> {
  const database = await getDatabase();
  return database.getAllAsync<CompletedLesson>(
    'SELECT * FROM completed_lessons ORDER BY completed_at DESC'
  );
}

export async function isLessonCompleted(lessonId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM completed_lessons WHERE lesson_id = ?',
    [lessonId]
  );
  return (result?.count ?? 0) > 0;
}

// ========== Challenges ==========

export async function createChallenge(challenge: Omit<Challenge, 'id' | 'progress' | 'active' | 'completed' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO challenges (title, description, type, category, duration_days, xp_reward, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [challenge.title, challenge.description, challenge.type, challenge.category, challenge.duration_days, challenge.xp_reward, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const database = await getDatabase();
  return database.getAllAsync<Challenge>(
    'SELECT * FROM challenges WHERE active = 1 AND completed = 0 ORDER BY created_at DESC'
  );
}

export async function getCompletedChallenges(): Promise<Challenge[]> {
  const database = await getDatabase();
  return database.getAllAsync<Challenge>(
    'SELECT * FROM challenges WHERE completed = 1 ORDER BY created_at DESC'
  );
}

export async function updateChallengeProgress(challengeId: number, progress: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE challenges SET progress = ? WHERE id = ?',
    [progress, challengeId]
  );
}

export async function completeChallenge(challengeId: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE challenges SET completed = 1, active = 0 WHERE id = ?',
    [challengeId]
  );
}

export async function updateCategoryLimit(categoryId: string, newLimit: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE budget_categories SET weekly_limit = ? WHERE id = ?', [newLimit, categoryId]);
}

// ========== Reset ==========

export async function resetApp(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM completed_lessons;
    DELETE FROM challenges;
    DELETE FROM budget_categories;
    DELETE FROM user_profile;
    DELETE FROM fixed_expenses;
    DELETE FROM motivation_focuses;
    DELETE FROM app_settings;
  `);
}

// ========== Types ==========

export interface UserProfile {
  id: number;
  name: string;
  xp: number;
  level: number;
  streak_days: number;
  monthly_income: number;
  flexible_budget: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  weekly_limit: number;
  spent: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: number;
  amount: number;
  category_id: string;
  description: string;
  timestamp: string;
}

export interface CompletedLesson {
  id: number;
  lesson_id: string;
  completed_at: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  duration_days: number;
  xp_reward: number;
  progress: number;
  active: number;
  completed: number;
  created_at: string;
}

export interface AppSettings {
  id: number;
  pin_hash: string | null;
  onboarding_completed: number;
  input_preference: string;
  financial_persona: string;
  selected_plan_id: string | null;
  created_at: string;
}

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  frequency: string;
}
