const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Predefined Lexicon for Rule-Based Keyword Tone Estimation
const POSITIVE_WORDS = [
  'happy', 'joy', 'grateful', 'gratitude', 'peace', 'peaceful', 'calm', 'hope', 'hopeful',
  'proud', 'accomplished', 'relaxed', 'relaxing', 'progress', 'excited', 'loved', 'love',
  'strong', 'content', 'optimistic', 'better', 'healing', 'smile', 'laugh', 'energy',
  'thriving', 'blessed', 'serene', 'comfort', 'uplifted', 'wonderful', 'inspired', 'confident'
];

const NEGATIVE_WORDS = [
  'sad', 'anxious', 'anxiety', 'stress', 'stressed', 'stressful', 'overwhelmed', 'depressed',
  'depression', 'fear', 'hopeless', 'angry', 'frustrated', 'exhausted', 'tired', 'crying',
  'lonely', 'alone', 'hurt', 'pain', 'guilt', 'worthless', 'panic', 'dread', 'terrible',
  'miserable', 'grief', 'helpless', 'down', 'fatigue', 'worried', 'nervous', 'burnout'
];

function analyzeJournalSentiment(text) {
  if (!text || typeof text !== 'string') {
    return {
      label: 'Neutral / Uncertain',
      details: { positiveCount: 0, negativeCount: 0, positiveMatches: [], negativeMatches: [] }
    };
  }

  const cleanWords = text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const matchedPositive = [];
  const matchedNegative = [];

  cleanWords.forEach(word => {
    if (POSITIVE_WORDS.includes(word)) {
      matchedPositive.push(word);
    }
    if (NEGATIVE_WORDS.includes(word)) {
      matchedNegative.push(word);
    }
  });

  const posCount = matchedPositive.length;
  const negCount = matchedNegative.length;

  let label = 'Neutral / Uncertain';

  if (posCount > 0 && negCount === 0) {
    label = 'Positive Tone';
  } else if (negCount > 0 && posCount === 0) {
    label = 'Negative Tone';
  } else if (posCount > 0 && negCount > 0) {
    if (posCount >= 2 * negCount) {
      label = 'Predominantly Positive Tone';
    } else if (negCount >= 2 * posCount) {
      label = 'Predominantly Negative Tone';
    } else {
      label = 'Mixed Tone';
    }
  }

  return {
    label,
    details: {
      positiveCount: posCount,
      negativeCount: negCount,
      positiveMatches: Array.from(new Set(matchedPositive)),
      negativeMatches: Array.from(new Set(matchedNegative)),
      method: 'Predefined keyword frequency matching. This is a basic pattern estimate, not an indicator of clinical mental health.'
    }
  };
}

// GET /api/journals
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

// POST /api/journals
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { title, entry_text } = req.body;

    if (!entry_text || !entry_text.trim()) {
      return res.status(400).json({ message: 'Journal text cannot be empty.' });
    }

    const trimmedText = entry_text.trim();
    const cleanTitle = title ? title.trim() : 'Reflections for ' + new Date().toLocaleDateString();

    const analysis = analyzeJournalSentiment(trimmedText);

    const stmt = db.prepare(`
      INSERT INTO journal_records (user_id, title, entry_text, sentiment_label, sentiment_details)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      cleanTitle,
      trimmedText,
      analysis.label,
      JSON.stringify(analysis.details)
    );

    const saved = db.prepare('SELECT * FROM journal_records WHERE id = ?').get(Number(result.lastInsertRowid));

    return res.status(201).json({
      message: 'Journal entry saved successfully.',
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

// PUT /api/journals/:id
router.put('/:id', (req, res) => {
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

    const analysis = analyzeJournalSentiment(updatedText);

    db.prepare(`
      UPDATE journal_records
      SET title = ?, entry_text = ?, sentiment_label = ?, sentiment_details = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(updatedTitle, updatedText, analysis.label, JSON.stringify(analysis.details), id, userId);

    const updated = db.prepare('SELECT * FROM journal_records WHERE id = ?').get(id);

    return res.json({
      message: 'Journal entry updated.',
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

// DELETE /api/journals/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM journal_records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Journal entry not found or unauthorized.' });
    }

    db.prepare('DELETE FROM journal_records WHERE id = ? AND user_id = ?').run(id, userId);

    return res.json({ message: 'Journal entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting journal:', error);
    return res.status(500).json({ message: 'Failed to delete journal entry.' });
  }
});

module.exports = router;
