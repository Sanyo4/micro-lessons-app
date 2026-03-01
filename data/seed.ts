import * as SQLite from 'expo-sqlite';

export async function seedDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if already seeded
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_profile'
  );
  if (existing && existing.count > 0) return;

  await database.execAsync(`
    INSERT INTO user_profile (name, xp, level, streak_days)
    VALUES ('Sanay', 45, 1, 3);

    INSERT INTO budget_categories (id, name, weekly_limit, spent, icon, color)
    VALUES
      ('coffee', 'Coffee', 20.0, 17.0, '☕', '#92400E'),
      ('food', 'Food', 80.0, 45.0, '🍕', '#1E40AF'),
      ('transport', 'Transport', 40.0, 22.0, '🚌', '#3730A3'),
      ('entertainment', 'Entertainment', 30.0, 10.0, '🎬', '#9D174D');

    INSERT INTO transactions (amount, category_id, description, timestamp)
    VALUES
      (4.50, 'coffee', 'Morning latte', datetime('now', '-6 days')),
      (3.80, 'coffee', 'Afternoon cappuccino', datetime('now', '-5 days')),
      (4.20, 'coffee', 'Flat white', datetime('now', '-3 days')),
      (4.50, 'coffee', 'Oat milk latte', datetime('now', '-1 day')),
      (12.00, 'food', 'Lunch at Pret', datetime('now', '-5 days')),
      (8.50, 'food', 'Groceries', datetime('now', '-4 days')),
      (15.00, 'food', 'Dinner takeaway', datetime('now', '-2 days')),
      (9.50, 'food', 'Meal deal + snacks', datetime('now', '-1 day')),
      (2.80, 'transport', 'Bus fare', datetime('now', '-6 days')),
      (12.50, 'transport', 'Uber to campus', datetime('now', '-3 days')),
      (6.70, 'transport', 'Train ticket', datetime('now', '-1 day')),
      (10.00, 'entertainment', 'Cinema ticket', datetime('now', '-4 days'));
  `);
}
