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
  `);
}

// User Profile
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

// Budget Categories
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

// Transactions
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

// Lessons
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

// Challenges
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

// Types
export interface UserProfile {
  id: number;
  name: string;
  xp: number;
  level: number;
  streak_days: number;
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
