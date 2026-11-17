const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeJournalEntry } = require('../services/sentimentMirrorService');

router.use(authenticateToken);

const MOOD_SCORES = {
  'Very Happy': 5,
  'Joyful': 5,
  'Happy': 4,
  'Calm': 4,
  'Neutral': 3,
  'Anxious': 2,
  'Sad': 2,
  'Frustrated': 2,
  'Very Sad': 1,
  'Exhausted': 1
};

// GET /api/moods
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const moods = db.prepare('SELECT * FROM mood_records WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    const formattedMoods = moods.map(m => ({
      ...m,
      sentiment_details: m.sentiment_details ? JSON.parse(m.sentiment_details) : null
    }));

    const total = moods.length;
    let avgScore = 0;
    const frequency = {};

    if (total > 0) {
      const sum = moods.reduce((acc, m) => acc + (m.mood_score || 3), 0);
      avgScore = Number((sum / total).toFixed(1));
      moods.forEach(m => {
        frequency[m.mood] = (frequency[m.mood] || 0) + 1;
      });
    }

    return res.json({
      moods: formattedMoods,
      stats: {
        totalEntries: total,
        averageScore: avgScore,
        frequency
      }
    });
  } catch (error) {
    console.error('Error fetching moods:', error);
    return res.status(500).json({ message: 'Failed to retrieve mood records.' });
  }
});

// POST /api/moods
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood, note, mood_score } = req.body;

    if (!mood) {
      return res.status(400).json({ message: 'Mood selection is required.' });
    }

    const calculatedScore = Number(mood_score) || MOOD_SCORES[mood] || 3;
    const cleanNote = note ? note.trim() : null;

    // Multimodal Sentiment Mirror analysis for mood entries
    const textToAnalyze = cleanNote || `I am feeling ${mood} today.`;
    const analysis = await analyzeJournalEntry(textToAnalyze);

    const stmt = db.prepare(`
      INSERT INTO mood_records (user_id, mood, mood_score, note, sentiment_label, sentiment_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      mood,
      calculatedScore,
      cleanNote,
      analysis.sentiment.label,
      JSON.stringify(analysis)
    );

    const newRecord = db.prepare('SELECT * FROM mood_records WHERE id = ?').get(Number(result.lastInsertRowid));

    return res.status(201).json({
      message: 'Mood entry recorded and analyzed successfully.',
      mood: {
        ...newRecord,
        sentiment_details: JSON.parse(newRecord.sentiment_details)
      }
    });
  } catch (error) {
    console.error('Error saving mood:', error);
    return res.status(500).json({ message: 'Failed to save mood record.' });
  }
});

// PUT /api/moods/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { mood, note, mood_score } = req.body;

    const existing = db.prepare('SELECT * FROM mood_records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Mood record not found or unauthorized.' });
    }

    const newMood = mood || existing.mood;
    const newScore = mood_score !== undefined ? Number(mood_score) : (MOOD_SCORES[newMood] || existing.mood_score);
    const newNote = note !== undefined ? (note ? note.trim() : null) : existing.note;

    // Re-run analysis on update
    const textToAnalyze = newNote || `I am feeling ${newMood} today.`;
    const analysis = await analyzeJournalEntry(textToAnalyze);

    db.prepare(`
      UPDATE mood_records
      SET mood = ?, mood_score = ?, note = ?, sentiment_label = ?, sentiment_details = ?
      WHERE id = ? AND user_id = ?
    `).run(newMood, newScore, newNote, analysis.sentiment.label, JSON.stringify(analysis), id, userId);

    const updated = db.prepare('SELECT * FROM mood_records WHERE id = ?').get(id);

    return res.json({
      message: 'Mood entry and Sentiment Mirror updated.',
      mood: {
        ...updated,
        sentiment_details: JSON.parse(updated.sentiment_details)
      }
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    return res.status(500).json({ message: 'Failed to update mood record.' });
  }
});

// DELETE /api/moods/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM mood_records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Mood record not found or unauthorized.' });
    }

    db.prepare('DELETE FROM mood_records WHERE id = ? AND user_id = ?').run(id, userId);

    return res.json({ message: 'Mood record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting mood:', error);
    return res.status(500).json({ message: 'Failed to delete mood record.' });
  }
});

module.exports = router;
