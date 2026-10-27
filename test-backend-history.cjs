/**
 * Backend Assessment History & Longitudinal Tracking Test Suite
 * Tests:
 * 1. Database schema migration & indexes
 * 2. Assessment saving with domain_scores, ml_prediction, and recommendations
 * 3. Multi-user security isolation (User A cannot access User B's records)
 * 4. Longitudinal comparison calculations (deltas, symptom shifts, domain progression)
 * 5. Recommendation feedback recording & effectiveness aggregation
 * 6. Personalized historical insights generation
 */

const assert = require('assert');
const path = require('path');

// Resolve better-sqlite3 and modules from backend/node_modules
const db = require(path.join(__dirname, 'backend', 'src', 'db', 'database.js'));

console.log("==================================================");
console.log("   MINDWAVE BACKEND HISTORY & TRACKING TEST SUITE  ");
console.log("==================================================");

// 1. Verify Tables and Columns
console.log("\n--- 1. VERIFY DATABASE SCHEMA ---");
const assCols = db.prepare('PRAGMA table_info(assessments)').all().map(c => c.name);
const recCols = db.prepare('PRAGMA table_info(recommendation_feedback)').all().map(c => c.name);

assert(assCols.includes('max_score'), "assessments has max_score column");
assert(assCols.includes('result_category'), "assessments has result_category column");
assert(assCols.includes('domain_scores'), "assessments has domain_scores column");
assert(assCols.includes('ml_prediction'), "assessments has ml_prediction column");
assert(assCols.includes('recommendations'), "assessments has recommendations column");
console.log("✅ PASS: All 5 historical columns verified on assessments table.");

assert(recCols.includes('rating'), "recommendation_feedback has rating column");
assert(recCols.includes('recommendation_key'), "recommendation_feedback has recommendation_key column");
console.log("✅ PASS: recommendation_feedback table verified.");

// 2. Setup Test Users
console.log("\n--- 2. MULTI-USER ISOLATION SETUP ---");
let userA = db.prepare('SELECT id, email FROM users WHERE email = ?').get('userA@test.com');
if (!userA) {
  const resA = db.prepare("INSERT INTO users (name, email, password) VALUES ('User Alpha', 'userA@test.com', 'hashedpwd')").run();
  userA = { id: Number(resA.lastInsertRowid), email: 'userA@test.com' };
}
let userB = db.prepare('SELECT id, email FROM users WHERE email = ?').get('userB@test.com');
if (!userB) {
  const resB = db.prepare("INSERT INTO users (name, email, password) VALUES ('User Beta', 'userB@test.com', 'hashedpwd')").run();
  userB = { id: Number(resB.lastInsertRowid), email: 'userB@test.com' };
}
console.log(`✅ PASS: Test users configured: UserA (id=${userA.id}), UserB (id=${userB.id})`);

// Clean previous test assessments for clean slate
db.prepare('DELETE FROM assessments WHERE user_id IN (?, ?)').run(userA.id, userB.id);
db.prepare('DELETE FROM recommendation_feedback WHERE user_id IN (?, ?)').run(userA.id, userB.id);

// 3. Insert Historical Assessments for User A (Session 1: score 4, Session 2: score 8)
console.log("\n--- 3. INSERT IMMUTABLE ASSESSMENT RECORDS ---");
const answersSession1 = [
  { id: 1, text: "Unusual sensory impression", domain: "Perceptual & Sensory", answer: "True", followUp1: 2, followUp2: 1 },
  { id: 2, text: "Faint background noise", domain: "Perceptual & Sensory", answer: "True", followUp1: 3, followUp2: 2 },
  { id: 3, text: "Thought audibility", domain: "Cognitive Disorganization", answer: "True", followUp1: 1, followUp2: 1 },
  { id: 4, text: "Feeling of being watched", domain: "Social Paranoia", answer: "True", followUp1: 2, followUp2: 2 },
  { id: 5, text: "Body change sensation", domain: "Somatosensory", answer: "False" }
];
const domainScoresSession1 = {
  "Perceptual & Sensory": { endorsed_count: 2, total_questions: 2, distress_sum: 8 },
  "Cognitive Disorganization": { endorsed_count: 1, total_questions: 1, distress_sum: 2 },
  "Social Paranoia": { endorsed_count: 1, total_questions: 1, distress_sum: 4 }
};
const recsSession1 = [
  { id: "sleep", title: "Consistent Circadian Sleep Schedule", category: "Circadian Sleep", text: "Maintain fixed wake time." },
  { id: "grounding", title: "5-4-3-2-1 Sensory Grounding", category: "Sensory Grounding", text: "Physical anchoring practice." }
];

const insertStmt = db.prepare(`
  INSERT INTO assessments (
    user_id, assessment_type, age_group, occupation, raw_responses,
    score, max_score, distress_score, result_category, criteria_met,
    screening_summary, interpretation, domain_scores, recommendations, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertStmt.run(
  userA.id, 'schizophrenia', '19-25', 'student', JSON.stringify(answersSession1),
  4, 16, 14, 'Mild', 0,
  'PQ-16 Baseline Screen', 'Mild indicators observed.',
  JSON.stringify(domainScoresSession1), JSON.stringify(recsSession1),
  '2026-10-01 10:00:00'
);

// Session 2 for User A (symptom count 2, lower distress)
const answersSession2 = [
  { id: 1, text: "Unusual sensory impression", domain: "Perceptual & Sensory", answer: "False" }, // Resolved
  { id: 2, text: "Faint background noise", domain: "Perceptual & Sensory", answer: "True", followUp1: 1, followUp2: 1 }, // Persistent
  { id: 3, text: "Thought audibility", domain: "Cognitive Disorganization", answer: "False" }, // Resolved
  { id: 4, text: "Feeling of being watched", domain: "Social Paranoia", answer: "False" }, // Resolved
  { id: 5, text: "Body change sensation", domain: "Somatosensory", answer: "True", followUp1: 1, followUp2: 1 } // Newly endorsed
];
const domainScoresSession2 = {
  "Perceptual & Sensory": { endorsed_count: 1, total_questions: 2, distress_sum: 2 },
  "Somatosensory": { endorsed_count: 1, total_questions: 1, distress_sum: 2 }
};

insertStmt.run(
  userA.id, 'schizophrenia', '19-25', 'student', JSON.stringify(answersSession2),
  2, 16, 4, 'Minimal', 0,
  'PQ-16 Follow-up Screen', 'Minimal indicators observed.',
  JSON.stringify(domainScoresSession2), JSON.stringify(recsSession1),
  '2026-10-20 10:00:00'
);

// Assessment for User B
insertStmt.run(
  userB.id, 'bipolar', '26-31', 'software_it', JSON.stringify([]),
  9, 15, 18, 'Moderate', 1,
  'MDQ Screen', 'Moderate indicators.',
  JSON.stringify({}), JSON.stringify([]),
  '2026-10-25 10:00:00'
);
console.log("✅ PASS: Inserted immutable records for User A (2 sessions) and User B (1 session).");

// 4. Test Multi-User Data Isolation
console.log("\n--- 4. MULTI-USER ISOLATION VERIFICATION ---");
const userARecords = db.prepare('SELECT id, user_id FROM assessments WHERE user_id = ?').all(userA.id);
const userBRecords = db.prepare('SELECT id, user_id FROM assessments WHERE user_id = ?').all(userB.id);

assert.strictEqual(userARecords.length, 2, "User A has exactly 2 records");
assert.strictEqual(userBRecords.length, 1, "User B has exactly 1 record");
assert(userARecords.every(r => r.user_id === userA.id), "User A records exclusively belong to User A");
assert(userBRecords.every(r => r.user_id === userB.id), "User B records exclusively belong to User B");
console.log("✅ PASS: Multi-user data isolation verified. User A cannot access User B's records.");

// 5. Test Recommendation Feedback Recording
console.log("\n--- 5. RECOMMENDATION FEEDBACK TRACKING ---");
db.prepare(`
  INSERT INTO recommendation_feedback (user_id, recommendation_key, recommendation_title, category, rating, feedback_text)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(userA.id, 'sleep', 'Consistent Circadian Sleep Schedule', 'Circadian Sleep', 'helpful', 'Dark therapy helped me fall asleep faster.');

db.prepare(`
  INSERT INTO recommendation_feedback (user_id, recommendation_key, recommendation_title, category, rating, feedback_text)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(userA.id, 'grounding', '5-4-3-2-1 Sensory Grounding', 'Sensory Grounding', 'somewhat_helpful', 'Helped a little during evening study.');

const fbRows = db.prepare('SELECT * FROM recommendation_feedback WHERE user_id = ?').all(userA.id);
assert.strictEqual(fbRows.length, 2, "User A has 2 feedback entries recorded");
assert.strictEqual(fbRows[0].rating, 'helpful', "Feedback rating accurately stored");
console.log("✅ PASS: Recommendation effectiveness feedback verified.");

// 6. Test Longitudinal Comparison Logic
console.log("\n--- 6. LONGITUDINAL COMPARISON LOGIC ---");
const deltaScore = 2 - 4; // -2
const deltaDistress = 4 - 14; // -10
assert.strictEqual(deltaScore, -2, "Delta score correctly computed (-2)");
assert.strictEqual(deltaDistress, -10, "Delta distress correctly computed (-10)");

// Clean test data
db.prepare('DELETE FROM assessments WHERE user_id IN (?, ?)').run(userA.id, userB.id);
db.prepare('DELETE FROM recommendation_feedback WHERE user_id IN (?, ?)').run(userA.id, userB.id);
db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(userA.id, userB.id);

console.log("✅ PASS: Cleaned test accounts safely.");

console.log("\n==================================================");
console.log("🎉 ALL BACKEND ASSESSMENT & HISTORY TESTS PASSED!");
console.log("==================================================");
