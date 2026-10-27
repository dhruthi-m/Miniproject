-- ==============================================================
-- MINDWAVE: PSYCHOLOGICAL RESPONSE ANALYZER
-- Relational Database Schema (MySQL & SQLite Compatible)
-- Features: User Authentication, Historical Assessments,
-- Longitudinal Tracking & Recommendation Effectiveness
-- ==============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- For MySQL: id INT AUTO_INCREMENT PRIMARY KEY
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Assessment Records Table (Immutable Historical Screening Log)
-- Stores separately validated PQ-16 and MDQ assessment outcomes along with
-- longitudinal domain scores, ML prediction outputs, and delivered recommendations
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- For MySQL: id INT AUTO_INCREMENT PRIMARY KEY
  user_id INT NOT NULL,
  assessment_type VARCHAR(50) NOT NULL, -- 'PQ-16', 'MDQ', 'schizophrenia', 'bipolar'
  age_group VARCHAR(50) NOT NULL,
  occupation VARCHAR(100) NOT NULL,
  occupation_other VARCHAR(255),
  context_answers TEXT, -- JSON formatted contextual questions (routine, academic/work)
  raw_responses TEXT NOT NULL, -- JSON detailed responses and distress ratings
  score INT NOT NULL, -- Endorsed count (PQ-16: 0-16, MDQ: 0-15)
  max_score INT DEFAULT 16,
  distress_score INT DEFAULT 0, -- Sum of follow-up frequency/impact ratings
  result_category VARCHAR(50), -- 'Minimal', 'Mild', 'Moderate', 'Elevated'
  criteria_met TINYINT(1) DEFAULT 0, -- 1 if screening threshold met, 0 otherwise
  impairment_level VARCHAR(50), -- MDQ impairment (No problem, Minor, Moderate, Serious)
  screening_summary VARCHAR(255) NOT NULL,
  interpretation TEXT NOT NULL,
  domain_scores TEXT, -- JSON string of domain-wise score breakdown
  ml_prediction TEXT, -- JSON string of Random Forest ML inference output
  recommendations TEXT, -- JSON string of personalized recommendations provided at assessment time
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Recommendation Effectiveness Feedback Table
-- Tracks whether specific well-being recommendations were helpful, somewhat helpful, or not helpful
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- For MySQL: id INT AUTO_INCREMENT PRIMARY KEY
  assessment_id INT,
  user_id INT NOT NULL,
  recommendation_key VARCHAR(100) NOT NULL, -- e.g. 'sleep', 'grounding', 'behavioral', 'breathing'
  recommendation_title VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'Circadian Sleep', 'Sensory Grounding', 'Cognitive Deceleration', etc.
  rating VARCHAR(50) NOT NULL, -- 'helpful', 'somewhat_helpful', 'not_helpful'
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE SET NULL
);

-- 4. Mood Records Table
CREATE TABLE IF NOT EXISTS mood_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- For MySQL: id INT AUTO_INCREMENT PRIMARY KEY
  user_id INT NOT NULL,
  mood VARCHAR(50) NOT NULL,
  mood_score INT NOT NULL, -- 1 to 5 scale for trend charts
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Journal Records Table
CREATE TABLE IF NOT EXISTS journal_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- For MySQL: id INT AUTO_INCREMENT PRIMARY KEY
  user_id INT NOT NULL,
  title VARCHAR(255),
  entry_text TEXT NOT NULL,
  sentiment_label VARCHAR(50) NOT NULL, -- 'Positive Tone', 'Negative Tone', 'Mixed Tone', 'Neutral / Uncertain'
  sentiment_details TEXT, -- JSON breakdown of word frequencies
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Supportive Chatbot Records Table
CREATE TABLE IF NOT EXISTS chat_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- For MySQL: id INT AUTO_INCREMENT PRIMARY KEY
  user_id INT NOT NULL,
  sender VARCHAR(20) NOT NULL, -- 'user' or 'bot'
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance and multi-user data isolation
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type_user ON assessments(user_id, assessment_type);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_assessment ON recommendation_feedback(assessment_id);
CREATE INDEX IF NOT EXISTS idx_moods_user ON mood_records(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_user ON journal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chat_records(user_id);
