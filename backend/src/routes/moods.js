const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const MOOD_SCORES = {
  'Joyful': 5,
  'Calm': 4,
  'Neutral': 3,
  'Anxious': 2,
  'Sad': 2,
  'Frustrated': 2,
  'Exhausted': 1
};

// GET /api/moods
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const moods = db.prepare('SELECT * FROM mood_records WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    // Calculate basic statistics from real user data
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
      moods,
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
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { mood, note, mood_score } = req.body;

    if (!mood) {
      return res.status(400).json({ message: 'Mood selection is required.' });
    }

    const calculatedScore = Number(mood_score) || MOOD_SCORES[mood] || 3;

    const stmt = db.prepare('INSERT INTO mood_records (user_id, mood, mood_score, note) VALUES (?, ?, ?, ?)');
    const result = stmt.run(userId, mood, calculatedScore, note ? note.trim() : null);

    const newRecord = db.prepare('SELECT * FROM mood_records WHERE id = ?').get(Number(result.lastInsertRowid));

    return res.status(201).json({
      message: 'Mood entry recorded successfully.',
      mood: newRecord
    });
  } catch (error) {
    console.error('Error saving mood:', error);
    return res.status(500).json({ message: 'Failed to save mood record.' });
  }
});

// PUT /api/moods/:id
router.put('/:id', (req, res) => {
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

    db.prepare('UPDATE mood_records SET mood = ?, mood_score = ?, note = ? WHERE id = ? AND user_id = ?')
      .run(newMood, newScore, newNote, id, userId);

    const updated = db.prepare('SELECT * FROM mood_records WHERE id = ?').get(id);

    return res.json({
      message: 'Mood entry updated.',
      mood: updated
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
