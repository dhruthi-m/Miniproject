import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { clientAnalyzeText } from '../utils/sentimentMirrorClient';

const JournalContext = createContext(null);
const API_BASE = 'http://localhost:5000';

export function JournalProvider({ children }) {
  const { token } = useAuth();
  const [trendsData, setTrendsData] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(false);

  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('mindwave_journal_entries');
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default reference entries matching all 3 types with sentiment mirrors
    return [
      {
        id: 'ref-1',
        type: 'mood',
        title: 'Happy Day',
        mood: 'Happy',
        note: 'Feeling positive and productive today after morning meditation.',
        date: '20 Aug 2024',
        timestamp: Date.now() - 86400000 * 2,
        sentiment_label: 'Positive',
        sentiment_details: {
          sentiment: { label: 'Positive', compound: 0.62, intensityPercent: 62 },
          emotions: [{ theme: 'Happiness', intensity: 'Moderate', confidence: 0.82, evidence: ['positive', 'meditation'] }],
          distortions: [],
          reframe: {
            balanced_perspective: 'Acknowledging what is working well reinforces self-efficacy and psychological stability.',
            reflection_question: 'What helped you maintain this grounded state today?'
          }
        }
      },
      {
        id: 'ref-2',
        type: 'text',
        title: 'Overcoming mid-week stress',
        note: 'Had so many assignments due today, but taking it one step at a time helped me stay calm.',
        date: '18 Aug 2024',
        timestamp: Date.now() - 86400000 * 4,
        sentiment_label: 'Positive',
        sentiment_details: {
          sentiment: { label: 'Positive', compound: 0.45, intensityPercent: 45 },
          emotions: [{ theme: 'Stress', intensity: 'Mild', confidence: 0.65, evidence: ['assignments'] }, { theme: 'Happiness', intensity: 'Mild', confidence: 0.68, evidence: ['calm'] }],
          distortions: [],
          reframe: {
            balanced_perspective: 'Breaking large tasks into smaller micro-steps builds momentum and relieves anxiety.',
            reflection_question: 'Which micro-step was most helpful?'
          }
        }
      },
      {
        id: 'ref-3',
        type: 'voice',
        title: 'Recorded thoughts',
        note: 'Voice reflection on daily stress and positive milestones.',
        duration: '01:24',
        date: '15 Aug 2024',
        timestamp: Date.now() - 86400000 * 7,
        sentiment_label: 'Positive',
        sentiment_details: {
          sentiment: { label: 'Positive', compound: 0.40, intensityPercent: 40 },
          emotions: [{ theme: 'Happiness', intensity: 'Mild', confidence: 0.65, evidence: ['positive milestones'] }],
          distortions: [],
          reframe: {
            balanced_perspective: 'Reflecting on milestones reinforces self-worth and steady progress.',
            reflection_question: 'What positive milestone gave you the biggest boost of encouragement?'
          }
        }
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mindwave_journal_entries', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  // Sync all entries (text, mood, voice) from backend if logged in
  const syncWithBackend = useCallback(async () => {
    if (!token) return;

    try {
      // 1. Fetch backend journals (text & voice)
      const jRes = await fetch(`${API_BASE}/api/journals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let backendJournals = [];
      if (jRes.ok) {
        const jData = await jRes.json();
        if (Array.isArray(jData.journals)) {
          backendJournals = jData.journals.map(j => ({
            id: `journal-${j.id}`,
            backendId: j.id,
            type: j.entry_type === 'voice' ? 'voice' : 'text',
            title: j.title,
            note: j.entry_text,
            audioUrl: j.audio_url,
            duration: j.audio_duration,
            sentiment_label: j.sentiment_label,
            sentiment_details: j.sentiment_details,
            date: j.created_at ? new Date(j.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            timestamp: new Date(j.created_at).getTime()
          }));
        }
      }

      // 2. Fetch backend moods
      const mRes = await fetch(`${API_BASE}/api/moods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let backendMoods = [];
      if (mRes.ok) {
        const mData = await mRes.json();
        const moodList = Array.isArray(mData) ? mData : (mData.moods || []);
        backendMoods = moodList.map(m => {
          let sDetails = m.sentiment_details;
          if (typeof sDetails === 'string') {
            try { sDetails = JSON.parse(sDetails); } catch {}
          }
          return {
            id: `mood-${m.id}`,
            backendId: m.id,
            type: 'mood',
            title: `${m.mood} Mood`,
            mood: m.mood,
            note: m.note || '',
            sentiment_label: m.sentiment_label || (m.note ? clientAnalyzeText(m.note).sentiment.label : 'Neutral'),
            sentiment_details: sDetails || (m.note ? clientAnalyzeText(m.note) : null),
            date: m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            timestamp: new Date(m.created_at).getTime()
          };
        });
      }

      if (backendJournals.length > 0 || backendMoods.length > 0) {
        setEntries(prev => {
          // Keep non-synced local entries if any
          const localOnly = prev.filter(e => !e.backendId);
          return [...backendJournals, ...backendMoods, ...localOnly].sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    } catch (err) {
      console.warn('Backend sync failed:', err);
    }
  }, [token]);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Fetch Trends, Cross-Screening Correlations, and Mood Prediction
  const fetchTrends = useCallback(async () => {
    if (!token) {
      const count = entries.length;
      if (count < 3) {
        setTrendsData({
          summary: {
            total_journals: entries.filter(e => e.type === 'text').length,
            total_mood_logs: entries.filter(e => e.type === 'mood').length,
            total_pq16_screens: 0,
            total_mdq_screens: 0
          },
          series: { journals: [], moods: [], pq16: [], mdq: [] },
          prediction: {
            sufficient_data: false,
            min_required: 3,
            current_count: count,
            message: 'Insufficient historical data to estimate a trend trajectory. At least 3 journal entries or mood logs are required.'
          },
          correlation_disclaimer: 'Clinical Note: PQ-16, MDQ, and journal sentiment examine separate psychological axes.'
        });
      }
      return;
    }

    setLoadingTrends(true);
    try {
      const res = await fetch(`${API_BASE}/api/journals/trends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrendsData(data);
      }
    } catch (err) {
      console.warn('Error loading trends from API:', err);
    } finally {
      setLoadingTrends(false);
    }
  }, [token, entries]);

  // Instant preview analysis (dynamic as user types in any journal)
  const analyzePreview = async (text) => {
    if (!text || !text.trim()) return null;

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/journals/analyze-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          const data = await res.json();
          return data.analysis;
        }
      } catch (err) {
        console.warn('Preview API error, using client analyzer:', err);
      }
    }

    return clientAnalyzeText(text);
  };

  // 1. ADD MOOD ENTRY (With Multimodal Sentiment Mirror Analysis)
  const addMoodEntry = async (mood, note = '') => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const textToAnalyze = note.trim() || `I am feeling ${mood} today.`;

    let analysisDetails = clientAnalyzeText(textToAnalyze);

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/moods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ mood, note: note.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          const saved = data.mood;
          const entryWithBackend = {
            id: `mood-${saved.id}`,
            backendId: saved.id,
            type: 'mood',
            title: `${saved.mood} Mood`,
            mood: saved.mood,
            note: saved.note || '',
            sentiment_label: saved.sentiment_label || analysisDetails.sentiment.label,
            sentiment_details: saved.sentiment_details || analysisDetails,
            date: todayStr,
            timestamp: Date.now()
          };
          setEntries(prev => [entryWithBackend, ...prev]);
          fetchTrends();
          return entryWithBackend;
        }
      } catch (err) {
        console.warn('Backend mood sync failed, saving locally:', err);
      }
    }

    const localEntry = {
      id: `entry-${Date.now()}`,
      type: 'mood',
      title: `${mood} Mood`,
      mood,
      note: note.trim(),
      sentiment_label: analysisDetails.sentiment.label,
      sentiment_details: analysisDetails,
      date: todayStr,
      timestamp: Date.now()
    };

    setEntries(prev => [localEntry, ...prev]);
    return localEntry;
  };

  // 2. ADD TEXT ENTRY (With Multimodal Sentiment Mirror Analysis)
  const addTextEntry = async (title, note) => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let analysisDetails = clientAnalyzeText(note);

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/journals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, entry_text: note, entry_type: 'text' })
        });

        if (res.ok) {
          const data = await res.json();
          const savedJournal = data.journal;
          const entryWithBackend = {
            id: `journal-${savedJournal.id}`,
            backendId: savedJournal.id,
            type: 'text',
            title: savedJournal.title,
            note: savedJournal.entry_text,
            sentiment_label: savedJournal.sentiment_label,
            sentiment_details: savedJournal.sentiment_details,
            date: todayStr,
            timestamp: Date.now()
          };

          setEntries(prev => [entryWithBackend, ...prev]);
          fetchTrends();
          return entryWithBackend;
        }
      } catch (err) {
        console.warn('Backend journal creation failed, saving locally:', err);
      }
    }

    const localEntry = {
      id: `entry-${Date.now()}`,
      type: 'text',
      title: title || 'Journal Entry',
      note,
      sentiment_label: analysisDetails.sentiment.label,
      sentiment_details: analysisDetails,
      date: todayStr,
      timestamp: Date.now()
    };

    setEntries(prev => [localEntry, ...prev]);
    return localEntry;
  };

  // 3. ADD VOICE ENTRY (With Voice Transcription & Sentiment Mirror Analysis)
  const addVoiceEntry = async (audioBlob, durationStr, voiceTranscript = '') => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let audioUrl = '';
    if (audioBlob) {
      try {
        audioUrl = URL.createObjectURL(audioBlob);
      } catch {}
    }

    const cleanText = voiceTranscript.trim() || 'Spoken reflection recorded on ' + todayStr;
    const analysisDetails = clientAnalyzeText(cleanText);

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/journals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: 'Voice Reflection',
            entry_text: cleanText,
            entry_type: 'voice',
            audio_url: audioUrl,
            audio_duration: durationStr || '00:30'
          })
        });

        if (res.ok) {
          const data = await res.json();
          const savedJournal = data.journal;
          const entryWithBackend = {
            id: `journal-${savedJournal.id}`,
            backendId: savedJournal.id,
            type: 'voice',
            title: savedJournal.title,
            note: savedJournal.entry_text,
            duration: savedJournal.audio_duration || durationStr || '00:30',
            audioUrl: savedJournal.audio_url || audioUrl,
            sentiment_label: savedJournal.sentiment_label,
            sentiment_details: savedJournal.sentiment_details,
            date: todayStr,
            timestamp: Date.now()
          };
          setEntries(prev => [entryWithBackend, ...prev]);
          fetchTrends();
          return entryWithBackend;
        }
      } catch (err) {
        console.warn('Backend voice journal save failed, saving locally:', err);
      }
    }

    const localEntry = {
      id: `entry-${Date.now()}`,
      type: 'voice',
      title: 'Voice Reflection',
      note: cleanText,
      duration: durationStr || '00:30',
      audioUrl,
      sentiment_label: analysisDetails.sentiment.label,
      sentiment_details: analysisDetails,
      date: todayStr,
      timestamp: Date.now()
    };

    setEntries(prev => [localEntry, ...prev]);
    return localEntry;
  };

  const updateTextEntry = async (id, title, note) => {
    const target = entries.find(e => e.id === id);
    if (target?.backendId && token) {
      try {
        const endpoint = target.type === 'mood' ? `${API_BASE}/api/moods/${target.backendId}` : `${API_BASE}/api/journals/${target.backendId}`;
        const payload = target.type === 'mood' ? { note, mood: target.mood } : { title, entry_text: note };

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const updated = data.journal || data.mood;
          setEntries(prev => prev.map(e => e.id === id ? {
            ...e,
            title: updated.title || e.title,
            note: updated.entry_text || updated.note,
            sentiment_label: updated.sentiment_label,
            sentiment_details: updated.sentiment_details,
            updated_at: updated.updated_at
          } : e));
          fetchTrends();
          return;
        }
      } catch (err) {
        console.warn('Backend update failed:', err);
      }
    }

    const analysis = clientAnalyzeText(note);
    setEntries(prev => prev.map(e => e.id === id ? {
      ...e,
      title: title || e.title,
      note,
      sentiment_label: analysis.sentiment.label,
      sentiment_details: analysis
    } : e));
  };

  const deleteEntry = async (id) => {
    const target = entries.find(e => e.id === id);
    if (target?.backendId && token) {
      try {
        const endpoint = target.type === 'mood' ? `${API_BASE}/api/moods/${target.backendId}` : `${API_BASE}/api/journals/${target.backendId}`;
        await fetch(endpoint, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTrends();
      } catch (err) {
        console.warn('Backend delete failed:', err);
      }
    }
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <JournalContext.Provider value={{
      entries,
      trendsData,
      loadingTrends,
      fetchTrends,
      analyzePreview,
      addMoodEntry,
      addTextEntry,
      updateTextEntry,
      addVoiceEntry,
      deleteEntry
    }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  return useContext(JournalContext);
}
