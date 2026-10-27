const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'mindwave.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables and run non-destructive schema migrations
function initializeDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_type TEXT NOT NULL, -- 'PQ-16', 'MDQ', 'schizophrenia', 'bipolar'
      age_group TEXT NOT NULL,
      occupation TEXT NOT NULL,
      occupation_other TEXT,
      context_answers TEXT, -- JSON string
      raw_responses TEXT NOT NULL, -- JSON string of detailed questionnaire items
      score INTEGER NOT NULL,
      max_score INTEGER DEFAULT 16,
      distress_score INTEGER DEFAULT 0,
      result_category TEXT, -- 'Minimal', 'Mild', 'Moderate', 'Elevated'
      criteria_met INTEGER DEFAULT 0,
      impairment_level TEXT,
      screening_summary TEXT NOT NULL,
      interpretation TEXT NOT NULL,
      domain_scores TEXT, -- JSON string of domain-wise breakdown
      ml_prediction TEXT, -- JSON string of ML prediction outputs
      recommendations TEXT, -- JSON string of tailored recommendations given
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendation_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER,
      user_id INTEGER NOT NULL,
      recommendation_key TEXT NOT NULL,
      recommendation_title TEXT NOT NULL,
      category TEXT,
      rating TEXT NOT NULL CHECK(rating IN ('helpful', 'somewhat_helpful', 'not_helpful')),
      feedback_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mood_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mood TEXT NOT NULL,
      mood_score INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      entry_text TEXT NOT NULL,
      sentiment_label TEXT NOT NULL,
      sentiment_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender TEXT NOT NULL, -- 'user' or 'bot'
      message TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_type_user ON assessments(user_id, assessment_type);
    CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON recommendation_feedback(user_id);
    CREATE INDEX IF NOT EXISTS idx_rec_feedback_assessment ON recommendation_feedback(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_moods_user ON mood_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_journals_user ON journal_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_chats_user ON chat_records(user_id);
  `;

  db.exec(schema);

  // Safe migration: Add any missing columns to existing assessments table without altering old records
  try {
    const existingCols = db.prepare('PRAGMA table_info(assessments)').all().map(c => c.name);
    
    if (!existingCols.includes('max_score')) {
      db.prepare('ALTER TABLE assessments ADD COLUMN max_score INTEGER DEFAULT 16').run();
    }
    if (!existingCols.includes('result_category')) {
      db.prepare('ALTER TABLE assessments ADD COLUMN result_category TEXT').run();
    }
    if (!existingCols.includes('domain_scores')) {
      db.prepare('ALTER TABLE assessments ADD COLUMN domain_scores TEXT').run();
    }
    if (!existingCols.includes('ml_prediction')) {
      db.prepare('ALTER TABLE assessments ADD COLUMN ml_prediction TEXT').run();
    }
    if (!existingCols.includes('recommendations')) {
      db.prepare('ALTER TABLE assessments ADD COLUMN recommendations TEXT').run();
    }
  } catch (err) {
    console.warn('Note on table migration:', err.message);
  }

  console.log('MindWave Relational Database successfully initialized with historical tracking and recommendation feedback tables.');
}

initializeDatabase();

module.exports = db;
