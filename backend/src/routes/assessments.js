const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// All assessment routes strictly require authentication
router.use(authenticateToken);

// Standard question labels for fallback naming
const PQ16_DEFAULT_DOMAINS = {
  1: "Anhedonia & Motivation",
  2: "Perceptual & Déjà Vu",
  3: "Olfactory / Gustatory Sensations",
  4: "Auditory Perception & Tinnitus",
  5: "Reality Testing & Confusion",
  6: "Visual Alterations & Metamorphopsia",
  7: "Social Anxiety & Interpersonal",
  8: "Visual Hallucinatory Impressions",
  9: "Thought Audibility & Loudness",
  10: "Ideas of Reference & Meaning",
  11: "Thought Interference & Agency",
  12: "Attentional Distractibility",
  13: "Verbal Auditory Hallucinations",
  14: "Paranoid Ideation & Suspiciousness",
  15: "Somatic Presence & Entity",
  16: "Somatosensory Body Experience"
};

const MDQ_DEFAULT_DOMAINS = {
  1: "Energy & Psychomotor Activation",
  2: "Sleep Efficiency & Decreased Need",
  3: "Racing Thoughts & Flight of Ideas",
  4: "Grandiosity & Inflated Self-Esteem",
  5: "Pressured Speech & Rapid Talking",
  6: "Impulsivity & Spending Patterns",
  7: "Goal-Directed Multitasking",
  8: "Irritability & Affective Reactivity",
  9: "Mood Cycling & Polarity Shifts",
  10: "Social Notice & Observable Changes",
  11: "Functional Interference in Daily Life",
  12: "Distractibility & Attention Lability",
  13: "Uncharacteristic Behavior Patterns",
  14: "Clustering & Episode Synchrony",
  15: "Emotional Control & Self-Regulation"
};

/**
 * Normalizes assessment type string to 'schizophrenia' or 'bipolar'
 */
function normalizeType(t) {
  const s = String(t || '').toLowerCase();
  if (s.includes('schiz') || s.includes('pq') || s.includes('psychosis')) return 'schizophrenia';
  if (s.includes('bipolar') || s.includes('mdq')) return 'bipolar';
  return 'schizophrenia';
}

/**
 * Computes domain-wise score breakdowns from formatted answers array
 */
function computeDomainBreakdown(answers, assType) {
  const normType = normalizeType(assType);
  const domainMap = {};

  if (!Array.isArray(answers) || answers.length === 0) {
    return {};
  }

  answers.forEach((ans, idx) => {
    const qNum = ans.id || (idx + 1);
    const domainName = ans.domain || (normType === 'schizophrenia' ? PQ16_DEFAULT_DOMAINS[qNum] : MDQ_DEFAULT_DOMAINS[qNum]) || `Dimension ${qNum}`;
    const isEndorsed = ans.answer === 'True' || ans.isTrue === true || Boolean(ans.endorsed);

    if (!domainMap[domainName]) {
      domainMap[domainName] = {
        domain: domainName,
        total_questions: 0,
        endorsed_count: 0,
        distress_sum: 0,
        items: []
      };
    }

    domainMap[domainName].total_questions += 1;
    if (isEndorsed) {
      domainMap[domainName].endorsed_count += 1;
      const d1 = typeof ans.followUp1 === 'number' ? Math.max(0, Math.min(5, ans.followUp1)) : 0;
      const d2 = typeof ans.followUp2 === 'number' ? Math.max(0, Math.min(5, ans.followUp2)) : 0;
      domainMap[domainName].distress_sum += (d1 + d2);
    }

    domainMap[domainName].items.push({
      questionNumber: qNum,
      text: ans.text || `Question ${qNum}`,
      endorsed: isEndorsed
    });
  });

  // Calculate percentages
  Object.keys(domainMap).forEach(key => {
    const d = domainMap[key];
    d.endorsement_rate = d.total_questions > 0 ? Math.round((d.endorsed_count / d.total_questions) * 100) : 0;
  });

  return domainMap;
}

// ============================================================================
// 1. GET /api/assessments/history & GET /api/assessments (or /api/screenings)
// Retrieves historical assessments strictly for authenticated user
// ============================================================================
router.get(['/history', '/'], (req, res) => {
  try {
    const userId = req.user.id;
    const typeFilter = req.query.type ? normalizeType(req.query.type) : null;

    let query = `
      SELECT id, user_id, assessment_type, age_group, occupation, occupation_other,
             score, max_score, distress_score, result_category, criteria_met,
             impairment_level, screening_summary, interpretation, domain_scores,
             ml_prediction, recommendations, raw_responses, created_at
      FROM assessments
      WHERE user_id = ?
    `;
    const params = [userId];

    if (typeFilter) {
      query += ` AND (LOWER(assessment_type) = ? OR (assessment_type = 'PQ-16' AND ? = 'schizophrenia') OR (assessment_type = 'MDQ' AND ? = 'bipolar'))`;
      params.push(typeFilter, typeFilter, typeFilter);
    }

    query += ` ORDER BY created_at DESC`;

    const rawRecords = db.prepare(query).all(...params);

    // Fetch user's recommendation feedback to attach
    const feedbackRecords = db.prepare(`
      SELECT assessment_id, recommendation_key, rating, feedback_text, updated_at
      FROM recommendation_feedback
      WHERE user_id = ?
    `).all(userId);

    const feedbackMap = {};
    feedbackRecords.forEach(fb => {
      const key = `${fb.assessment_id || 'global'}_${fb.recommendation_key}`;
      feedbackMap[key] = fb;
    });

    const parsedRecords = rawRecords.map(rec => {
      let rawAnswers = [];
      let domainScores = {};
      let mlPred = null;
      let recs = [];

      try {
        rawAnswers = rec.raw_responses ? JSON.parse(rec.raw_responses) : [];
      } catch (e) { rawAnswers = []; }

      try {
        domainScores = rec.domain_scores ? JSON.parse(rec.domain_scores) : computeDomainBreakdown(rawAnswers, rec.assessment_type);
      } catch (e) { domainScores = {}; }

      try {
        mlPred = rec.ml_prediction ? JSON.parse(rec.ml_prediction) : null;
      } catch (e) { mlPred = null; }

      try {
        recs = rec.recommendations ? JSON.parse(rec.recommendations) : [];
      } catch (e) { recs = []; }

      // Attach feedback status to recommendations
      if (Array.isArray(recs)) {
        recs = recs.map(r => {
          const fb = feedbackMap[`${rec.id}_${r.id}`] || feedbackMap[`global_${r.id}`];
          return {
            ...r,
            user_feedback: fb ? { rating: fb.rating, feedback_text: fb.feedback_text } : null
          };
        });
      }

      const formattedDate = rec.created_at
        ? new Date(rec.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Recent';

      return {
        id: rec.id,
        user_id: rec.user_id,
        assessment_type: normalizeType(rec.assessment_type),
        raw_type_name: rec.assessment_type,
        age_group: rec.age_group,
        occupation: rec.occupation,
        occupation_other: rec.occupation_other,
        score: rec.score,
        symptom_count: rec.score,
        max_score: rec.max_score || (normalizeType(rec.assessment_type) === 'bipolar' ? 15 : 16),
        distress_score: rec.distress_score || 0,
        result_category: rec.result_category || (rec.score > 12 ? 'Elevated' : (rec.score >= 8 ? 'Moderate' : (rec.score >= 4 ? 'Mild' : 'Minimal'))),
        criteria_met: rec.criteria_met,
        impairment_level: rec.impairment_level,
        screening_summary: rec.screening_summary,
        interpretation: rec.interpretation,
        domain_scores: domainScores,
        ml_prediction: mlPred,
        recommendations: recs,
        answers: rawAnswers,
        created_at: rec.created_at,
        date: formattedDate
      };
    });

    return res.json(parsedRecords);
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    return res.status(500).json({ message: 'Failed to retrieve assessment history.' });
  }
});

// ============================================================================
// 2. GET /api/assessments/:id
// Retrieves full record for a single assessment (isolated to owning user)
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const recordId = parseInt(req.params.id, 10);
    if (isNaN(recordId)) {
      return res.status(400).json({ message: 'Invalid assessment ID format.' });
    }

    const rec = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(recordId, userId);

    if (!rec) {
      return res.status(404).json({ message: 'Assessment record not found or access denied.' });
    }

    let rawAnswers = [];
    let domainScores = {};
    let mlPred = null;
    let recs = [];

    try { rawAnswers = rec.raw_responses ? JSON.parse(rec.raw_responses) : []; } catch (e) {}
    try { domainScores = rec.domain_scores ? JSON.parse(rec.domain_scores) : computeDomainBreakdown(rawAnswers, rec.assessment_type); } catch (e) {}
    try { mlPred = rec.ml_prediction ? JSON.parse(rec.ml_prediction) : null; } catch (e) {}
    try { recs = rec.recommendations ? JSON.parse(rec.recommendations) : []; } catch (e) {}

    // Attach feedback
    const feedbackRecords = db.prepare(`
      SELECT recommendation_key, rating, feedback_text, updated_at
      FROM recommendation_feedback
      WHERE user_id = ? AND (assessment_id = ? OR assessment_id IS NULL)
    `).all(userId, recordId);

    const fbMap = {};
    feedbackRecords.forEach(fb => { fbMap[fb.recommendation_key] = fb; });

    recs = recs.map(r => ({
      ...r,
      user_feedback: fbMap[r.id] ? { rating: fbMap[r.id].rating, feedback_text: fbMap[r.id].feedback_text } : null
    }));

    return res.json({
      assessment: {
        id: rec.id,
        user_id: rec.user_id,
        assessment_type: normalizeType(rec.assessment_type),
        age_group: rec.age_group,
        occupation: rec.occupation,
        score: rec.score,
        symptom_count: rec.score,
        max_score: rec.max_score || (normalizeType(rec.assessment_type) === 'bipolar' ? 15 : 16),
        distress_score: rec.distress_score || 0,
        result_category: rec.result_category,
        criteria_met: rec.criteria_met,
        screening_summary: rec.screening_summary,
        interpretation: rec.interpretation,
        domain_scores: domainScores,
        ml_prediction: mlPred,
        recommendations: recs,
        answers: rawAnswers,
        created_at: rec.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching single assessment:', error);
    return res.status(500).json({ message: 'Failed to retrieve assessment details.' });
  }
});

// ============================================================================
// 3. POST /api/assessments & POST /api/screenings
// Records a new immutable screening assessment with domain scores & recommendations
// ============================================================================
router.post(['/', ''], (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body;

    const rawType = body.assessment_type || 'schizophrenia';
    const normType = normalizeType(rawType);
    const expectedMax = normType === 'bipolar' ? 15 : 16;

    const answers = Array.isArray(body.answers) ? body.answers : [];

    // Calculate verified score from submitted answers to prevent tampering
    let trueCount = 0;
    let totalDistress = 0;

    answers.forEach(a => {
      if (a && (a.answer === 'True' || a.isTrue === true || a.endorsed === true)) {
        trueCount++;
        const d1 = typeof a.followUp1 === 'number' ? Math.max(0, Math.min(5, a.followUp1)) : 0;
        const d2 = typeof a.followUp2 === 'number' ? Math.max(0, Math.min(5, a.followUp2)) : 0;
        totalDistress += (d1 + d2);
      }
    });

    const score = answers.length > 0
      ? Math.min(expectedMax, trueCount)
      : Math.min(expectedMax, Math.max(0, parseInt(body.score ?? body.symptom_count ?? 0, 10)));

    const maxScore = body.max_score || expectedMax;
    const distressScore = answers.length > 0 ? totalDistress : (parseInt(body.distress_score ?? 0, 10) || 0);

    // Clinical threshold categories
    let resultCategory = body.result_category;
    if (score > 12) {
      resultCategory = 'Elevated';
    } else if (resultCategory === 'Elevated' || !resultCategory) {
      resultCategory = score >= 8 ? 'Moderate' : (score >= 4 ? 'Mild' : 'Minimal');
    }

    const domainScores = body.domain_scores && typeof body.domain_scores === 'object'
      ? body.domain_scores
      : computeDomainBreakdown(answers, normType);

    const mlPred = body.ml_prediction || null;
    const recommendations = Array.isArray(body.recommendations) ? body.recommendations : [];

    let screeningSummary = body.screening_summary || `${normType === 'schizophrenia' ? 'PQ-16 Psychosis' : 'MDQ Bipolar'} Screening Completed (${score}/${maxScore})`;
    let interpretation = body.interpretation || `Screening outcome classified as ${resultCategory}.`;

    const stmt = db.prepare(`
      INSERT INTO assessments (
        user_id, assessment_type, age_group, occupation, occupation_other,
        context_answers, raw_responses, score, max_score, distress_score,
        result_category, criteria_met, impairment_level, screening_summary,
        interpretation, domain_scores, ml_prediction, recommendations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      normType,
      body.age_group || '19-25',
      body.profession || body.occupation || 'student',
      body.occupation_other || null,
      body.context_answers ? JSON.stringify(body.context_answers) : null,
      JSON.stringify(answers),
      score,
      maxScore,
      distressScore,
      resultCategory,
      score >= (normType === 'schizophrenia' ? 6 : 7) ? 1 : 0,
      body.impairment_level || null,
      screeningSummary,
      interpretation,
      JSON.stringify(domainScores),
      mlPred ? JSON.stringify(mlPred) : null,
      recommendations.length > 0 ? JSON.stringify(recommendations) : null
    );

    const insertedId = Number(result.lastInsertRowid);
    const saved = db.prepare('SELECT * FROM assessments WHERE id = ?').get(insertedId);

    return res.status(201).json({
      message: 'Assessment recorded successfully into longitudinal history.',
      assessment: {
        id: saved.id,
        user_id: saved.user_id,
        assessment_type: normalizeType(saved.assessment_type),
        score: saved.score,
        symptom_count: saved.score,
        max_score: saved.max_score,
        distress_score: saved.distress_score,
        result_category: saved.result_category,
        domain_scores: domainScores,
        ml_prediction: mlPred,
        recommendations: recommendations,
        created_at: saved.created_at,
        date: new Date(saved.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      }
    });
  } catch (error) {
    console.error('Error recording assessment:', error);
    return res.status(500).json({ message: 'Internal server error while saving assessment.' });
  }
});

// ============================================================================
// 4. GET /api/assessments/compare/:id1/:id2 & /compare/latest
// Longitudinal Comparison between two assessments
// ============================================================================
router.get(['/compare/:id1/:id2', '/compare/latest'], (req, res) => {
  try {
    const userId = req.user.id;
    let id1 = req.params.id1;
    let id2 = req.params.id2;

    let rec1 = null;
    let rec2 = null;

    if (!id1 || !id2 || id1 === 'latest') {
      // Fetch latest two assessments for the user
      const latestTwo = db.prepare(`
        SELECT * FROM assessments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 2
      `).all(userId);

      if (latestTwo.length < 2) {
        return res.status(400).json({
          message: 'At least two assessment records are required for longitudinal comparison.',
          available_count: latestTwo.length
        });
      }

      rec2 = latestTwo[0]; // Current / Latest
      rec1 = latestTwo[1]; // Previous
    } else {
      rec1 = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(id1, userId);
      rec2 = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(id2, userId);

      if (!rec1 || !rec2) {
        return res.status(404).json({ message: 'One or both assessment records not found for comparison.' });
      }

      // Ensure chronological ordering: rec1 is earlier, rec2 is later
      if (new Date(rec1.created_at) > new Date(rec2.created_at)) {
        const tmp = rec1;
        rec1 = rec2;
        rec2 = tmp;
      }
    }

    // Parse answers and domain scores
    const answers1 = rec1.raw_responses ? JSON.parse(rec1.raw_responses) : [];
    const answers2 = rec2.raw_responses ? JSON.parse(rec2.raw_responses) : [];
    const domains1 = rec1.domain_scores ? JSON.parse(rec1.domain_scores) : computeDomainBreakdown(answers1, rec1.assessment_type);
    const domains2 = rec2.domain_scores ? JSON.parse(rec2.domain_scores) : computeDomainBreakdown(answers2, rec2.assessment_type);

    // Compute symptom shift breakdown
    const map1 = {};
    answers1.forEach(a => {
      const qId = a.id || a.questionNumber;
      if (qId) map1[qId] = a.answer === 'True' || a.isTrue === true || a.endorsed === true;
    });

    const map2 = {};
    answers2.forEach(a => {
      const qId = a.id || a.questionNumber;
      if (qId) map2[qId] = a.answer === 'True' || a.isTrue === true || a.endorsed === true;
    });

    const newlyEndorsed = [];
    const resolvedSymptoms = [];
    const persistentSymptoms = [];

    // Union of question IDs
    const allQIds = Array.from(new Set([...Object.keys(map1), ...Object.keys(map2)])).map(Number).sort((a, b) => a - b);

    allQIds.forEach(qId => {
      const wasTrue = map1[qId] === true;
      const isTrue = map2[qId] === true;
      const qObj = answers2.find(a => (a.id || a.questionNumber) === qId) || answers1.find(a => (a.id || a.questionNumber) === qId);
      const text = qObj ? (qObj.text || qObj.questionText || `Item ${qId}`) : `Item ${qId}`;
      const domain = qObj ? qObj.domain : null;

      if (!wasTrue && isTrue) {
        newlyEndorsed.push({ id: qId, text, domain });
      } else if (wasTrue && !isTrue) {
        resolvedSymptoms.push({ id: qId, text, domain });
      } else if (wasTrue && isTrue) {
        persistentSymptoms.push({ id: qId, text, domain });
      }
    });

    // Domain progression
    const allDomainNames = Array.from(new Set([...Object.keys(domains1), ...Object.keys(domains2)]));
    const domainProgression = allDomainNames.map(dName => {
      const d1 = domains1[dName] || { endorsed_count: 0, total_questions: 1, distress_sum: 0 };
      const d2 = domains2[dName] || { endorsed_count: 0, total_questions: 1, distress_sum: 0 };
      const deltaEndorsed = d2.endorsed_count - d1.endorsed_count;
      const deltaDistress = d2.distress_sum - d1.distress_sum;

      let trend = 'stable';
      if (deltaEndorsed > 0) trend = 'increased';
      else if (deltaEndorsed < 0) trend = 'decreased';

      return {
        domain: dName,
        previous_count: d1.endorsed_count,
        current_count: d2.endorsed_count,
        total_questions: Math.max(d1.total_questions, d2.total_questions),
        delta_endorsed: deltaEndorsed,
        previous_distress: d1.distress_sum,
        current_distress: d2.distress_sum,
        delta_distress: deltaDistress,
        trend
      };
    });

    // Time calculations
    const date1 = new Date(rec1.created_at);
    const date2 = new Date(rec2.created_at);
    const diffDays = Math.max(0, Math.round((date2 - date1) / (1000 * 60 * 60 * 24)));

    // Score deltas
    const deltaScore = rec2.score - rec1.score;
    const deltaDistress = (rec2.distress_score || 0) - (rec1.distress_score || 0);

    let scoreDirection = 'stable';
    if (deltaScore > 0) scoreDirection = 'increased';
    else if (deltaScore < 0) scoreDirection = 'decreased';

    return res.json({
      comparison: {
        assessment_type: normalizeType(rec2.assessment_type),
        days_between: diffDays,
        previous_session: {
          id: rec1.id,
          date: date1.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          score: rec1.score,
          max_score: rec1.max_score,
          distress_score: rec1.distress_score || 0,
          result_category: rec1.result_category
        },
        current_session: {
          id: rec2.id,
          date: date2.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          score: rec2.score,
          max_score: rec2.max_score,
          distress_score: rec2.distress_score || 0,
          result_category: rec2.result_category
        },
        deltas: {
          score_delta: deltaScore,
          distress_delta: deltaDistress,
          direction: scoreDirection,
          percentage_change: rec1.score > 0 ? Math.round((deltaScore / rec1.score) * 100) : (deltaScore > 0 ? 100 : 0)
        },
        symptom_shifts: {
          newly_endorsed_count: newlyEndorsed.length,
          newly_endorsed: newlyEndorsed,
          resolved_symptoms_count: resolvedSymptoms.length,
          resolved_symptoms: resolvedSymptoms,
          persistent_symptoms_count: persistentSymptoms.length,
          persistent_symptoms: persistentSymptoms
        },
        domain_progression: domainProgression,
        clinical_disclaimer: "Longitudinal comparison displays self-reported screening trends over time. Differences reflect variations in survey endorsement rather than confirmed clinical diagnosis or illness remission."
      }
    });
  } catch (error) {
    console.error('Error generating longitudinal comparison:', error);
    return res.status(500).json({ message: 'Failed to generate assessment comparison.' });
  }
});

// ============================================================================
// 5. POST /api/recommendations/feedback
// Records user feedback on well-being recommendations (helpful/somewhat/not helpful)
// ============================================================================
router.post('/recommendations/feedback', (req, res) => {
  try {
    const userId = req.user.id;
    const { assessment_id, recommendation_key, recommendation_title, category, rating, feedback_text } = req.body;

    if (!recommendation_key || !rating) {
      return res.status(400).json({ message: 'recommendation_key and rating are required.' });
    }

    const validRatings = ['helpful', 'somewhat_helpful', 'not_helpful'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ message: "Rating must be 'helpful', 'somewhat_helpful', or 'not_helpful'." });
    }

    // Check if feedback already exists for this user and recommendation
    const existing = db.prepare(`
      SELECT id FROM recommendation_feedback
      WHERE user_id = ? AND recommendation_key = ? AND (assessment_id = ? OR assessment_id IS NULL)
    `).get(userId, recommendation_key, assessment_id || null);

    if (existing) {
      db.prepare(`
        UPDATE recommendation_feedback
        SET rating = ?, feedback_text = ?, recommendation_title = ?, category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(rating, feedback_text || null, recommendation_title || recommendation_key, category || null, existing.id);
    } else {
      db.prepare(`
        INSERT INTO recommendation_feedback (
          assessment_id, user_id, recommendation_key, recommendation_title, category, rating, feedback_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        assessment_id || null,
        userId,
        recommendation_key,
        recommendation_title || recommendation_key,
        category || null,
        rating,
        feedback_text || null
      );
    }

    return res.json({
      success: true,
      message: 'Recommendation feedback recorded successfully.',
      feedback: {
        recommendation_key,
        rating,
        feedback_text
      }
    });
  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    return res.status(500).json({ message: 'Failed to record recommendation feedback.' });
  }
});

// ============================================================================
// 6. GET /api/recommendations/feedback & GET /api/recommendations/effective
// Retrieves recommendation feedback history and aggregate effectiveness
// ============================================================================
router.get('/recommendations/feedback', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT id, assessment_id, recommendation_key, recommendation_title, category, rating, feedback_text, updated_at
      FROM recommendation_feedback
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(userId);

    return res.json({ feedback: rows });
  } catch (error) {
    console.error('Error fetching recommendation feedback:', error);
    return res.status(500).json({ message: 'Failed to retrieve recommendation feedback.' });
  }
});

router.get('/recommendations/effective', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT recommendation_key, recommendation_title, category, rating, COUNT(*) as count
      FROM recommendation_feedback
      WHERE user_id = ?
      GROUP BY recommendation_key, rating
    `).all(userId);

    const summary = {};
    rows.forEach(r => {
      if (!summary[r.recommendation_key]) {
        summary[r.recommendation_key] = {
          title: r.recommendation_title,
          category: r.category,
          helpful: 0,
          somewhat_helpful: 0,
          not_helpful: 0,
          total: 0
        };
      }
      summary[r.recommendation_key][r.rating] = r.count;
      summary[r.recommendation_key].total += r.count;
    });

    const effectiveKeys = Object.keys(summary).filter(k => summary[k].helpful > summary[k].not_helpful);

    return res.json({
      summary,
      effective_recommendations: effectiveKeys
    });
  } catch (error) {
    console.error('Error fetching effective recommendations:', error);
    return res.status(500).json({ message: 'Failed to retrieve recommendation summary.' });
  }
});

// ============================================================================
// 7. GET /api/assessments/insights
// Generates personalized longitudinal insights based on history & feedback
// ============================================================================
router.get('/insights', (req, res) => {
  try {
    const userId = req.user.id;
    const records = db.prepare(`
      SELECT id, assessment_type, score, max_score, distress_score, result_category,
             raw_responses, domain_scores, created_at
      FROM assessments
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(userId);

    if (records.length === 0) {
      return res.json({
        total_assessments: 0,
        has_history: false,
        message: 'No previous assessments recorded. Complete your first assessment to unlock personalized longitudinal insights.'
      });
    }

    const feedback = db.prepare(`
      SELECT recommendation_key, recommendation_title, category, rating
      FROM recommendation_feedback
      WHERE user_id = ?
    `).all(userId);

    // Analyze trajectory
    const scores = records.map(r => r.score);
    const firstScore = scores[0];
    const latestScore = scores[scores.length - 1];
    const deltaOverall = latestScore - firstScore;

    let overallTrend = 'stable';
    if (deltaOverall < -1) overallTrend = 'decreasing';
    else if (deltaOverall > 1) overallTrend = 'increasing';

    // Track recurring symptoms
    const symptomFrequency = {};
    const symptomDetails = {};

    records.forEach(r => {
      try {
        const answers = r.raw_responses ? JSON.parse(r.raw_responses) : [];
        answers.forEach(a => {
          const isTrue = a.answer === 'True' || a.isTrue === true || a.endorsed === true;
          if (isTrue) {
            const key = a.id || a.questionNumber;
            symptomFrequency[key] = (symptomFrequency[key] || 0) + 1;
            if (!symptomDetails[key]) {
              symptomDetails[key] = {
                id: key,
                text: a.text || a.questionText || `Item ${key}`,
                domain: a.domain || 'Clinical Dimension'
              };
            }
          }
        });
      } catch (e) {}
    });

    const recurringSymptoms = Object.keys(symptomFrequency)
      .filter(k => symptomFrequency[k] >= 2)
      .map(k => ({
        ...symptomDetails[k],
        occurrences: symptomFrequency[k],
        percentage_of_sessions: Math.round((symptomFrequency[k] / records.length) * 100)
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    // Identify domains requiring attention (most frequently endorsed or highest distress)
    const domainTotals = {};
    records.forEach(r => {
      try {
        const domains = r.domain_scores ? JSON.parse(r.domain_scores) : {};
        Object.keys(domains).forEach(dName => {
          if (!domainTotals[dName]) domainTotals[dName] = { endorsed: 0, distress: 0 };
          domainTotals[dName].endorsed += domains[dName].endorsed_count || 0;
          domainTotals[dName].distress += domains[dName].distress_sum || 0;
        });
      } catch (e) {}
    });

    const attentionAreas = Object.keys(domainTotals)
      .map(name => ({
        domain: name,
        total_endorsed: domainTotals[name].endorsed,
        total_distress: domainTotals[name].distress
      }))
      .filter(d => d.total_endorsed > 0)
      .sort((a, b) => b.total_endorsed - a.total_endorsed)
      .slice(0, 3);

    // Helpful recommendations identified
    const helpfulRecs = feedback.filter(f => f.rating === 'helpful').map(f => f.recommendation_title || f.recommendation_key);

    // Formulate personalized human-readable narratives
    const narrativeInsights = [];

    if (records.length === 1) {
      narrativeInsights.push({
        type: 'baseline',
        title: 'Initial Assessment Baseline Established',
        description: `Your initial screening established a baseline score of ${records[0].score} (${records[0].result_category} category). As you complete follow-up assessments over time, this hub will trace shifts in specific domains and symptom frequency.`
      });
    } else {
      if (overallTrend === 'decreasing') {
        narrativeInsights.push({
          type: 'trajectory',
          title: 'Decreasing Endorsement Trajectory',
          description: `Across ${records.length} assessments, your endorsed symptom count changed from ${firstScore} to ${latestScore}. You are recognizing fewer active experiences in recent self-reports.`
        });
      } else if (overallTrend === 'increasing') {
        narrativeInsights.push({
          type: 'trajectory',
          title: 'Increased Endorsement Pattern Observed',
          description: `Your symptom endorsement count increased from ${firstScore} to ${latestScore}. Discussing these sensations with a healthcare provider or counselor can provide tailored coping strategies.`
        });
      } else {
        narrativeInsights.push({
          type: 'trajectory',
          title: 'Consistent Response Pattern',
          description: `Your screening responses have remained relatively stable across ${records.length} assessment sessions (averaging ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)} endorsed items).`
        });
      }
    }

    if (recurringSymptoms.length > 0) {
      narrativeInsights.push({
        type: 'recurring',
        title: `${recurringSymptoms.length} Persistent Symptom Pattern${recurringSymptoms.length > 1 ? 's' : ''}`,
        description: `Experiences such as "${recurringSymptoms[0].text}" appeared in ${recurringSymptoms[0].occurrences} of your ${records.length} screenings, suggesting this is a stable focal point to monitor.`
      });
    }

    if (helpfulRecs.length > 0) {
      narrativeInsights.push({
        type: 'recommendation_synergy',
        title: 'Recommendation Feedback Synergy',
        description: `You noted that practices like "${helpfulRecs[0]}" were helpful. Maintaining consistent application of strategies you personally find beneficial supports daily mental well-being.`
      });
    }

    return res.json({
      has_history: true,
      total_assessments: records.length,
      first_session_date: new Date(records[0].created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      latest_session_date: new Date(records[records.length - 1].created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      overall_trend: overallTrend,
      recurring_symptoms: recurringSymptoms,
      attention_areas: attentionAreas,
      helpful_recommendations: helpfulRecs,
      narrative_insights: narrativeInsights,
      clinical_disclaimer: "These observations represent automated self-assessment response trends. They do not constitute a psychiatric diagnosis, clinical prognosis, or treatment plan."
    });
  } catch (error) {
    console.error('Error generating personalized insights:', error);
    return res.status(500).json({ message: 'Failed to generate personalized insights.' });
  }
});

// Legacy backward-compatibility routes
router.post('/pq16/submit', (req, res) => {
  req.body.assessment_type = 'schizophrenia';
  req.body.answers = req.body.responses ? req.body.responses.map((r, i) => ({
    id: i + 1,
    text: r.questionText || `Question ${i + 1}`,
    answer: r.endorsed ? 'True' : 'False',
    followUp1: r.distress || 0
  })) : [];
  return router.handle(req, res);
});

router.post('/mdq/submit', (req, res) => {
  req.body.assessment_type = 'bipolar';
  req.body.answers = req.body.part1_responses ? req.body.part1_responses.map((r, i) => ({
    id: i + 1,
    text: `MDQ Question ${i + 1}`,
    answer: r ? 'True' : 'False'
  })) : [];
  return router.handle(req, res);
});

// Clear history endpoint for privacy management
router.delete('/clear', (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare('DELETE FROM assessments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM recommendation_feedback WHERE user_id = ?').run(userId);
    return res.json({ success: true, message: 'All personal screening history and recommendation feedback cleared.' });
  } catch (err) {
    console.error('Error clearing history:', err);
    return res.status(500).json({ message: 'Failed to clear assessment history.' });
  }
});

module.exports = router;
