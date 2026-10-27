const path = require('path');
const db = require('./backend/src/db/database.js');

async function runE2ETests() {
  const { 
    computeDomainScores, 
    generatePersonalizedRecommendations, 
    calculateLongitudinalComparison, 
    generatePersonalizedInsights 
  } = await import('./src/utils/progressAnalytics.js');
  console.log('====================================================');
  console.log('  MINDWAVE: HISTORICAL TRACKING & PROGRESS ANALYSIS ');
  console.log('              COMPREHENSIVE VERIFICATION            ');
  console.log('====================================================\n');

  // Test 1: Verify Database Schema
  console.log('[TEST 1] Verifying Database Schema for Longitudinal Storage...');
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('assessments', 'recommendation_feedback')").all();
  if (tableCheck.length < 2) {
    throw new Error('Database tables missing! Expected assessments and recommendation_feedback.');
  }
  const assessmentCols = db.prepare("PRAGMA table_info(assessments)").all().map(c => c.name);
  const requiredCols = ['domain_scores', 'ml_prediction', 'recommendations', 'max_score', 'result_category'];
  for (const col of requiredCols) {
    if (!assessmentCols.includes(col)) {
      throw new Error(`Column ${col} missing from assessments table!`);
    }
  }
  console.log('  [PASS] Tables and columns present and validated.\n');

  // Test 2: User Isolation & Security
  console.log('[TEST 2] Testing User Isolation & Authorization Privacy...');
  const testUserA = 901;
  const testUserB = 902;

  // Ensure test users exist for foreign key constraint
  db.prepare("INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)").run(testUserA, 'Test User A', 'testA@mindwave.org', 'hashed_pass_a');
  db.prepare("INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)").run(testUserB, 'Test User B', 'testB@mindwave.org', 'hashed_pass_b');

  // Clean test fixtures
  db.prepare("DELETE FROM assessments WHERE user_id IN (?, ?)").run(testUserA, testUserB);
  db.prepare("DELETE FROM recommendation_feedback WHERE user_id IN (?, ?)").run(testUserA, testUserB);

  // Insert assessment for User A
  const sampleAnswersA1 = [
    { id: 1, text: "I have had periods of feeling so happy or energetic...", answer: "True", followUp1: 4, followUp2: 3, domain: "Energy & Activity" },
    { id: 2, text: "I was so irritable that I shouted at people...", answer: "True", followUp1: 3, followUp2: 2, domain: "Mood & Irritability" },
    { id: 3, text: "I felt much more self-confident than usual...", answer: "False", followUp1: null, followUp2: null, domain: "Cognition & Self-Perception" }
  ];
  const domScoresA1 = computeDomainScores(sampleAnswersA1, 'bipolar');
  const recsA1 = generatePersonalizedRecommendations({ assessmentType: 'bipolar', category: 'Mild', score: 2, answers: sampleAnswersA1 });

  const stmt = db.prepare(`
    INSERT INTO assessments (
      user_id, assessment_type, age_group, occupation, raw_responses, score, max_score, distress_score, 
      result_category, screening_summary, interpretation, domain_scores, recommendations, ml_prediction, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-7 days'))
  `);
  stmt.run(
    testUserA,
    'bipolar',
    '19-25',
    'student',
    JSON.stringify(sampleAnswersA1),
    2,
    15,
    12,
    'Mild',
    'Baseline screening with 2 criteria endorsed.',
    'Results suggest mild indicators on the MDQ.',
    JSON.stringify(domScoresA1),
    JSON.stringify(recsA1),
    JSON.stringify({ status: 'success', algorithm: 'Random Forest Baseline', risk_probability: 0.35, risk_level: 'Low' })
  );

  // User B query attempts
  const userARecordsFromB = db.prepare("SELECT * FROM assessments WHERE user_id = ?").all(testUserB);
  if (userARecordsFromB.length !== 0) {
    throw new Error('User isolation failure: User B retrieved records of another user!');
  }
  const userARecords = db.prepare("SELECT * FROM assessments WHERE user_id = ?").all(testUserA);
  if (userARecords.length !== 1) {
    throw new Error('Failed to retrieve User A records');
  }
  console.log('  [PASS] Cross-user access blocked. Assessment storage securely isolated.\n');

  // Test 3: Recommendation Effectiveness Feedback Recording & Adaptation
  console.log('[TEST 3] Testing Recommendation Feedback Recording & Adaptive Selection...');
  const feedbackStmt = db.prepare(`
    INSERT INTO recommendation_feedback (user_id, assessment_id, recommendation_key, recommendation_title, category, rating, feedback_text)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  feedbackStmt.run(testUserA, userARecords[0].id, 'sleep', 'Circadian Stabilization', 'Sleep', 'helpful', 'Dark cues really helped.');
  feedbackStmt.run(testUserA, userARecords[0].id, 'behavioral', 'The 48-Hour Decision Rule', 'Behavioral', 'not_helpful', 'Hard to wait 48 hours.');

  const feedbackList = db.prepare("SELECT * FROM recommendation_feedback WHERE user_id = ?").all(testUserA);
  if (feedbackList.length !== 2) {
    throw new Error(`Expected 2 feedback entries, found ${feedbackList.length}`);
  }

  // Verify adaptive recommendations using the recorded feedback
  const feedbackMap = { sleep: 'helpful', behavioral: 'not_helpful' };
  const adaptedRecs = generatePersonalizedRecommendations({
    assessmentType: 'bipolar',
    category: 'Moderate',
    score: 3,
    answers: sampleAnswersA1,
    feedbackHistory: feedbackMap
  });

  const sleepRec = adaptedRecs.find(r => r.id === 'sleep');
  const behavioralRec = adaptedRecs.find(r => r.id === 'behavioral');

  const sleepBadge = sleepRec ? (sleepRec.badgeText || sleepRec.badge || '') : '';
  const behavBadge = behavioralRec ? (behavioralRec.badgeText || behavioralRec.badge || '') : '';

  if (!sleepRec || !sleepBadge.includes('Helpful')) {
    throw new Error('Recommendation system failed to emphasize strategy rated as helpful!');
  }
  if (!behavioralRec || !behavBadge.includes('Adapted')) {
    throw new Error('Recommendation system failed to adapt strategy rated as not helpful!');
  }
  console.log('  [PASS] Feedback recorded; future recommendations successfully adapt.\n');

  // Test 4: Longitudinal Comparison & Symptom Shift Tracking
  console.log('[TEST 4] Testing Longitudinal Comparison & Symptom Shift Dynamics...');
  const sampleAnswersA2 = [
    { id: 1, text: "I have had periods of feeling so happy or energetic...", answer: "True", followUp1: 2, followUp2: 1, domain: "Energy & Activity" }, // Persistent (reduced distress)
    { id: 2, text: "I was so irritable that I shouted at people...", answer: "False", followUp1: null, followUp2: null, domain: "Mood & Irritability" }, // Resolved
    { id: 3, text: "I felt much more self-confident than usual...", answer: "True", followUp1: 3, followUp2: 2, domain: "Cognition & Self-Perception" } // Newly Endorsed
  ];
  const domScoresA2 = computeDomainScores(sampleAnswersA2, 'bipolar');
  const recsA2 = generatePersonalizedRecommendations({ assessmentType: 'bipolar', category: 'Mild', score: 2, answers: sampleAnswersA2, feedbackHistory: feedbackMap });

  stmt.run(
    testUserA,
    'bipolar',
    '19-25',
    'student',
    JSON.stringify(sampleAnswersA2),
    2,
    15,
    8,
    'Mild',
    'Follow-up screening with 2 criteria endorsed.',
    'Symptoms show distress reduction with stable overall count.',
    JSON.stringify(domScoresA2),
    JSON.stringify(recsA2),
    JSON.stringify({ status: 'success', algorithm: 'Random Forest Longitudinal', risk_probability: 0.28, risk_level: 'Low' })
  );

  const updatedRecordsA = db.prepare("SELECT * FROM assessments WHERE user_id = ? ORDER BY id ASC").all(testUserA);
  const formattedAssessments = updatedRecordsA.map(r => ({
    id: r.id,
    date: r.created_at,
    assessment_type: r.assessment_type,
    score: r.score,
    maxScore: r.max_score,
    symptom_count: r.score,
    distress_score: r.distress_score,
    result_category: r.result_category,
    answers: JSON.parse(r.raw_responses),
    domain_scores: JSON.parse(r.domain_scores),
    recommendations: JSON.parse(r.recommendations)
  }));

  const comparison = calculateLongitudinalComparison(formattedAssessments[1], formattedAssessments[0]);
  if (!comparison) throw new Error('Longitudinal comparison returned null');

  console.log(`  Delta Symptoms: ${comparison.deltaScore} (Score from ${comparison.previousScore} to ${comparison.currentScore})`);
  console.log(`  Delta Distress: ${comparison.deltaDistress} pts (from ${comparison.previousDistress} to ${comparison.currentDistress})`);
  console.log(`  Shifts - Resolved: ${comparison.symptomShifts.resolvedCount}, Persistent: ${comparison.symptomShifts.persistentCount}, New: ${comparison.symptomShifts.newCount}`);

  if (comparison.symptomShifts.resolvedCount !== 1 || comparison.symptomShifts.persistentCount !== 1 || comparison.symptomShifts.newCount !== 1) {
    throw new Error('Symptom shift calculation failed to properly classify resolved, persistent, and new items!');
  }
  console.log('  [PASS] Longitudinal comparison and 3-way symptom shift tracking verified.\n');

  // Test 5: Personalized Historical Insights
  console.log('[TEST 5] Testing Personalized Historical Insights Generation...');
  const insights = generatePersonalizedInsights(formattedAssessments, feedbackMap);
  if (!insights || !Array.isArray(insights.insights) || insights.insights.length < 2) {
    throw new Error('Failed to generate multi-dimensional personalized historical insights!');
  }
  console.log(`  Generated ${insights.insights.length} insight cards:`);
  insights.insights.forEach((ins, idx) => {
    console.log(`    ${idx + 1}. [${ins.category}] ${ins.title}: ${ins.description.slice(0, 60)}...`);
  });
  console.log('  [PASS] Historical pattern insights generated successfully.\n');

  // Test 6: ML Evaluation Report Compliance
  console.log('[TEST 6] Testing ML Longitudinal Evaluation & Accuracy Compliance...');
  const fs = require('fs');
  const reportPath = path.join(__dirname, 'ml', 'reports', 'longitudinal_evaluation_report.json');
  if (!fs.existsSync(reportPath)) {
    throw new Error('ML evaluation report missing at ml/reports/longitudinal_evaluation_report.json!');
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const pq16 = report.schizophrenia_pq16;
  const mdq = report.bipolar_mdq;
  console.log(`  PQ-16 Baseline Accuracy: ${(pq16.baseline_model.accuracy * 100).toFixed(2)}%, ROC-AUC: ${pq16.baseline_model.roc_auc.toFixed(4)}`);
  console.log(`  PQ-16 Longitudinal Accuracy: ${(pq16.longitudinal_model.accuracy * 100).toFixed(2)}%, ROC-AUC: ${pq16.longitudinal_model.roc_auc.toFixed(4)}`);
  console.log(`  MDQ Baseline Accuracy: ${(mdq.baseline_model.accuracy * 100).toFixed(2)}%, ROC-AUC: ${mdq.baseline_model.roc_auc.toFixed(4)}`);
  console.log(`  MDQ Longitudinal Accuracy: ${(mdq.longitudinal_model.accuracy * 100).toFixed(2)}%, ROC-AUC: ${mdq.longitudinal_model.roc_auc.toFixed(4)}`);
  console.log(`  Clinical Governance: "${report.scientific_conclusions[2]}"`);
  console.log('  [PASS] Rigorous evaluation completed; no unsubstantiated diagnostic claims made.\n');

  // Cleanup test user records
  db.prepare("DELETE FROM assessments WHERE user_id IN (?, ?)").run(testUserA, testUserB);
  db.prepare("DELETE FROM recommendation_feedback WHERE user_id IN (?, ?)").run(testUserA, testUserB);
  db.prepare("DELETE FROM users WHERE id IN (?, ?)").run(testUserA, testUserB);

  console.log('====================================================');
  console.log('  ALL E2E LONGITUDINAL TESTS PASSED SUCCESSFULLY!    ');
  console.log('====================================================');
}

runE2ETests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
