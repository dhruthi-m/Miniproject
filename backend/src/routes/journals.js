const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const {
  analyzeSentimentVader,
  extractEmotionalThemes,
  detectCognitiveDistortions,
  generateCognitiveReframe,
  analyzeJournalEntry,
  predictMoodTrajectory
} = require('../services/sentimentMirrorService');

router.use(authenticateToken);

// GET /api/journals - Fetch all user journal records
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const records = db.prepare('SELECT * FROM journal_records WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    const formatted = records.map(r => ({
      ...r,
      sentiment_details: r.sentiment_details ? JSON.parse(r.sentiment_details) : null
    }));

    return res.json({ journals: formatted });
  } catch (error) {
    console.error('Error fetching journals:', error);
    return res.status(500).json({ message: 'Failed to retrieve journal entries.' });
  }
});

// GET /api/journals/trends - Historical trends, cross-screening correlation, and trajectory prediction
router.get('/trends', (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user journal records
    const journals = db.prepare(`
      SELECT id, title, entry_text, sentiment_label, sentiment_details, created_at, updated_at
      FROM journal_records
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(userId);

    const parsedJournals = journals.map(j => {
      let details = null;
      try {
        details = j.sentiment_details ? JSON.parse(j.sentiment_details) : null;
      } catch {}
      return {
        id: j.id,
        title: j.title,
        date: j.created_at,
        sentiment_label: j.sentiment_label,
        compound_score: details?.sentiment?.compound ?? 0,
        emotions: details?.emotions || [],
        distortions: details?.distortions || [],
        reframe: details?.reframe || null
      };
    });

    // 2. Fetch user mood records
    const moods = db.prepare(`
      SELECT id, mood, mood_score, note, sentiment_label, sentiment_details, created_at
      FROM mood_records
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(userId);

    // 3. Fetch user psychiatric assessments (PQ-16 & MDQ)
    const assessments = db.prepare(`
      SELECT id, assessment_type, score, max_score, distress_score, result_category, criteria_met, impairment_level, created_at
      FROM assessments
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(userId);

    const pq16Assessments = assessments
      .filter(a => {
        const t = (a.assessment_type || '').toLowerCase();
        return t.includes('pq') || t.includes('schiz') || t.includes('psychosis');
      })
      .map(a => ({
        id: a.id,
        type: 'PQ-16 (Psychosis Risk Screen)',
        score: a.score,
        max_score: a.max_score || 16,
        distress_score: a.distress_score || 0,
        result_category: a.result_category || 'Assessed',
        date: a.created_at
      }));

    const mdqAssessments = assessments
      .filter(a => {
        const t = (a.assessment_type || '').toLowerCase();
        return t.includes('mdq') || t.includes('bipolar');
      })
      .map(a => ({
        id: a.id,
        type: 'MDQ (Bipolar Spectrum Screen)',
        score: a.score,
        max_score: 13,
        criteria_met: Boolean(a.criteria_met),
        impairment_level: a.impairment_level || 'Assessed',
        date: a.created_at
      }));

    // 4. Compute Mood & Sentiment Trajectory Prediction
    const predictionReport = predictMoodTrajectory(journals, moods);

    return res.json({
      summary: {
        total_journals: journals.length,
        total_mood_logs: moods.length,
        total_pq16_screens: pq16Assessments.length,
        total_mdq_screens: mdqAssessments.length
      },
      series: {
        journals: parsedJournals,
        moods: moods.map(m => ({
          id: m.id,
          mood: m.mood,
          mood_score: m.mood_score,
          note: m.note,
          date: m.created_at
        })),
        pq16: pq16Assessments,
        mdq: mdqAssessments
      },
      prediction: predictionReport,
      correlation_disclaimer: 'Clinical Note: PQ-16, MDQ, and journal sentiment examine separate psychological axes. Scores are maintained independently; observed statistical correlations do not indicate medical causation or diagnostic certainty.'
    });
  } catch (error) {
    console.error('Error computing journal trends:', error);
    return res.status(500).json({ message: 'Failed to compute mood trends and screening correlations.' });
  }
});

// POST /api/journals/analyze-preview - Dynamic live mirror preview before saving
router.post('/analyze-preview', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Journal text cannot be empty for analysis.' });
    }

    const analysis = await analyzeJournalEntry(text.trim());
    return res.json({ analysis });
  } catch (error) {
    console.error('Error generating analysis preview:', error);
    return res.status(500).json({ message: 'Failed to analyze text preview.' });
  }
});

// POST /api/journals - Create new journal entry with NLP Sentiment Mirror & Cognitive Reframing
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, entry_text, entry_type, audio_url, audio_duration } = req.body;

    if (!entry_text || !entry_text.trim()) {
      return res.status(400).json({ message: 'Journal text cannot be empty.' });
    }

    const trimmedText = entry_text.trim();
    const cleanType = entry_type === 'voice' ? 'voice' : 'text';
    const cleanTitle = title && title.trim() 
      ? title.trim() 
      : (cleanType === 'voice' ? 'Voice Reflection' : 'Reflections for ' + new Date().toLocaleDateString());

    // Run complete multimodal analysis
    const analysis = await analyzeJournalEntry(trimmedText);

    const stmt = db.prepare(`
      INSERT INTO journal_records (user_id, title, entry_text, sentiment_label, sentiment_details, entry_type, audio_url, audio_duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      cleanTitle,
      trimmedText,
      analysis.sentiment.label,
      JSON.stringify(analysis),
      cleanType,
      audio_url || null,
      audio_duration || null
    );

    const saved = db.prepare('SELECT * FROM journal_records WHERE id = ?').get(Number(result.lastInsertRowid));

    return res.status(201).json({
      message: `${cleanType === 'voice' ? 'Voice' : 'Text'} journal entry saved and analyzed successfully.`,
      journal: {
        ...saved,
        sentiment_details: JSON.parse(saved.sentiment_details)
      }
    });
  } catch (error) {
    console.error('Error saving journal entry:', error);
    return res.status(500).json({ message: 'Failed to save journal entry.' });
  }
});

// PUT /api/journals/:id - Update entry and re-run sentiment & distortion analysis
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, entry_text } = req.body;

    const existing = db.prepare('SELECT * FROM journal_records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Journal entry not found or unauthorized.' });
    }

    const updatedText = entry_text !== undefined ? entry_text.trim() : existing.entry_text;
    const updatedTitle = title !== undefined ? title.trim() : existing.title;

    if (!updatedText) {
      return res.status(400).json({ message: 'Journal text cannot be empty.' });
    }

    // Dynamic re-analysis on update
    const analysis = await analyzeJournalEntry(updatedText);

    db.prepare(`
      UPDATE journal_records
      SET title = ?, entry_text = ?, sentiment_label = ?, sentiment_details = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(updatedTitle, updatedText, analysis.sentiment.label, JSON.stringify(analysis), id, userId);

    const updated = db.prepare('SELECT * FROM journal_records WHERE id = ?').get(id);

    return res.json({
      message: 'Journal entry and Sentiment Mirror updated successfully.',
      journal: {
        ...updated,
        sentiment_details: JSON.parse(updated.sentiment_details)
      }
    });
  } catch (error) {
    console.error('Error updating journal:', error);
    return res.status(500).json({ message: 'Failed to update journal entry.' });
  }
});

// DELETE /api/journals/:id - Delete entry and cascade remove its analysis
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM journal_records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Journal entry not found or unauthorized.' });
    }

    db.prepare('DELETE FROM journal_records WHERE id = ? AND user_id = ?').run(id, userId);

    return res.json({ message: 'Journal entry and associated analysis deleted successfully.' });
  } catch (error) {
    console.error('Error deleting journal:', error);
    return res.status(500).json({ message: 'Failed to delete journal entry.' });
  }
});

module.exports = router;
