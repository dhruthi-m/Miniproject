const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/dashboard/summary
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Latest PQ-16 assessment
    const latestPq16 = db.prepare(`
      SELECT id, assessment_type, score, distress_score, criteria_met, screening_summary, created_at
      FROM assessments
      WHERE user_id = ? AND assessment_type = 'PQ-16'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    // 2. Latest MDQ assessment
    const latestMdq = db.prepare(`
      SELECT id, assessment_type, score, impairment_level, criteria_met, screening_summary, created_at
      FROM assessments
      WHERE user_id = ? AND assessment_type = 'MDQ'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    // 3. Assessment counts
    const totalAssessments = db.prepare('SELECT COUNT(*) as count FROM assessments WHERE user_id = ?').get(userId).count;

    // 4. Recent moods (latest 7)
    const recentMoods = db.prepare(`
      SELECT id, mood, mood_score, note, created_at
      FROM mood_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 7
    `).all(userId);

    const totalMoodLogs = db.prepare('SELECT COUNT(*) as count FROM mood_records WHERE user_id = ?').get(userId).count;

    // 5. Recent journal entries (latest 3)
    const recentJournals = db.prepare(`
      SELECT id, title, entry_text, sentiment_label, created_at
      FROM journal_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 3
    `).all(userId);

    const totalJournals = db.prepare('SELECT COUNT(*) as count FROM journal_records WHERE user_id = ?').get(userId).count;

    // 6. Dynamic Wellness Recommendations based on real user activity
    const suggestions = [];

    if (totalAssessments === 0) {
      suggestions.push({
        id: 'start-screen',
        title: 'Complete a Preliminary Screening',
        description: 'Choose between the PQ-16 (psychosis-risk screener) or MDQ (bipolar-spectrum screener) to reflect on your cognitive and emotional experiences.',
        actionLabel: 'Select Assessment',
        actionPath: '/assessments'
      });
    }

    if (totalMoodLogs === 0) {
      suggestions.push({
        id: 'track-mood',
        title: 'Log Today\'s Mood',
        description: 'Tracking how you feel over time helps build self-awareness and reveals emotional patterns.',
        actionLabel: 'Log Current Mood',
        actionPath: '/moods'
      });
    } else {
      suggestions.push({
        id: 'box-breathing',
        title: '2-Minute Box Breathing',
        description: 'Practice 4-4-4-4 paced respiration to calm your sympathetic nervous system and center your attention.',
        actionLabel: 'Start Exercise',
        actionPath: '/wellness'
      });
    }

    if (totalJournals === 0) {
      suggestions.push({
        id: 'first-journal',
        title: 'Start a Mindful Journal Entry',
        description: 'Express your thoughts freely in your private journal with transparent keyword pattern insights.',
        actionLabel: 'Write Entry',
        actionPath: '/journal'
      });
    } else {
      suggestions.push({
        id: '54321-grounding',
        title: '5-4-3-2-1 Sensory Grounding',
        description: 'Engage your five senses to ground yourself when thoughts feel busy or overwhelming.',
        actionLabel: 'View Exercise',
        actionPath: '/wellness'
      });
    }

    return res.json({
      user: req.user,
      stats: {
        totalAssessments,
        totalMoodLogs,
        totalJournals
      },
      latestPq16: latestPq16 || null,
      latestMdq: latestMdq || null,
      recentMoods,
      recentJournals,
      suggestions
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ message: 'Failed to retrieve dashboard summary.' });
  }
});

module.exports = router;
