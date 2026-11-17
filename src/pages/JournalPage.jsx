import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Volume2
} from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { clientAnalyzeText } from '../utils/sentimentMirrorClient';
import SentimentMirrorCard from '../components/SentimentMirrorCard';
import MoodTrendsSection from '../components/MoodTrendsSection';

export default function JournalPage() {
  const { entries, addMoodEntry, addTextEntry, updateTextEntry, addVoiceEntry, deleteEntry, analyzePreview } = useJournal();

  // Active Tab: 'mood' | 'text' | 'voice' | 'trends'
  const [activeTab, setActiveTab] = useState('mood');

  // Mood Journal state
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [moodNote, setMoodNote] = useState('');

  // Text Journal state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  // Voice Journal state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Live Mirror Preview state
  const [livePreview, setLivePreview] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Expanded entries in history
  const [expandedEntries, setExpandedEntries] = useState({});

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Search & History state
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleEntryExpansion = (id) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Determine active text for live preview depending on current active tab
  const activeInputText = activeTab === 'text' 
    ? textContent 
    : (activeTab === 'mood' ? moodNote : voiceTranscript);

  // Debounced live mirror preview generator as user types or speaks
  useEffect(() => {
    if (!activeInputText.trim() || !showLivePreview) {
      if (!activeInputText.trim()) setLivePreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const preview = await analyzePreview(activeInputText.trim());
        setLivePreview(preview);
      } catch (err) {
        console.warn('Live preview failed:', err);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [activeInputText, activeTab, showLivePreview, analyzePreview]);

  // ── MOOD FORM SUBMIT (Analyzes Mood + Note) ───────────────────────────
  const handleSaveMood = async (e) => {
    e.preventDefault();
    const saved = await addMoodEntry(selectedMood, moodNote);
    setMoodNote('');
    setLivePreview(null);
    setFeedbackNotice('Mood entry saved with Multimodal Sentiment Mirror analysis!');
    if (saved?.id) {
      setExpandedEntries(prev => ({ ...prev, [saved.id]: true }));
    }
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  // ── TEXT FORM SUBMIT ──────────────────────────────────────────────────
  const handleSaveText = async (e) => {
    e.preventDefault();
    if (!textContent.trim()) {
      alert('Please write something in your journal entry.');
      return;
    }
    const saved = await addTextEntry(textTitle.trim() || 'My Thoughts', textContent.trim());
    setTextTitle('');
    setTextContent('');
    setLivePreview(null);
    setShowLivePreview(false);
    setFeedbackNotice('Text journal entry saved with Multimodal Sentiment Mirror analysis!');
    if (saved?.id) {
      setExpandedEntries(prev => ({ ...prev, [saved.id]: true }));
    }
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  // ── VOICE RECORDING & LIVE SPEECH-TO-TEXT ─────────────────────────────
  const startRecording = async () => {
    setMicError('');
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    // Initialize Web Speech Recognition for live spoken sentiment analysis
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
          setVoiceTranscript(fullTranscript.trim());
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition error:', e.error);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition not available:', e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 300) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error:', err);
      setMicError('Microphone permission denied. Using voice simulation mode.');
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setAudioBlob(new Blob(['simulated voice content'], { type: 'audio/wav' }));
      setAudioUrl('#simulated-voice');
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch(e => console.warn(e));
      setIsPlaying(true);
    }
  };

  const handleSaveVoice = async () => {
    const durStr = formatTime(recordingSeconds);
    const transcriptToAnalyze = voiceTranscript.trim() || 'Spoken reflection recorded on ' + new Date().toLocaleDateString();

    const saved = await addVoiceEntry(audioBlob, durStr, transcriptToAnalyze);
    setAudioBlob(null);
    setAudioUrl(null);
    setVoiceTranscript('');
    setRecordingSeconds(0);
    setLivePreview(null);
    setFeedbackNotice('Voice journal recording and Sentiment Mirror saved successfully!');
    if (saved?.id) {
      setExpandedEntries(prev => ({ ...prev, [saved.id]: true }));
    }
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  // ── EDIT ENTRY HANDLERS ──────────────────────────────────────────────
  const handleStartEdit = (entry) => {
    setEditingEntry(entry);
    setEditTitle(entry.title || '');
    setEditContent(entry.note || '');
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      alert('Content cannot be empty.');
      return;
    }
    setIsUpdating(true);
    await updateTextEntry(editingEntry.id, editTitle.trim(), editContent.trim());
    setIsUpdating(false);
    setEditingEntry(null);
    setFeedbackNotice('Entry updated and Sentiment Mirror re-analyzed!');
    setTimeout(() => setFeedbackNotice(''), 3000);
  };

  // Filtered past entries
  const filteredEntries = entries.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title?.toLowerCase().includes(q) ||
      e.note?.toLowerCase().includes(q) ||
      e.mood?.toLowerCase().includes(q) ||
      e.sentiment_label?.toLowerCase().includes(q) ||
      e.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="journal-page-wrap" style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title">My Journal & AI Sentiment Mirror</h1>
        <p className="page-description">
          A reflective space to analyze sentiment, cognitive thinking patterns, and emotional themes across your Mood, Text, and Voice journals.
        </p>
      </header>

      {/* ── TABS (All 3 Journal Types + Trends) ───────────────────────────── */}
      <div className="journal-tabs-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button 
          className={`journal-tab-btn ${activeTab === 'mood' ? 'active' : ''}`}
          onClick={() => setActiveTab('mood')}
          id="tab-mood-journal"
        >
          Mood Journal
        </button>
        <button 
          className={`journal-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
          id="tab-text-journal"
        >
          Text Journal
        </button>
        <button 
          className={`journal-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
          id="tab-voice-journal"
        >
          Voice Journal
        </button>
        <button 
          className={`journal-tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
          id="tab-sentiment-trends"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <TrendingUp size={15} />
          <span>Sentiment & Trends</span>
        </button>
      </div>

      {/* Feedback Notification */}
      {feedbackNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          fontWeight: 600,
          fontSize: '0.92rem',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* ── TAB 1: MOOD JOURNAL WITH SENTIMENT MIRROR ─────────────────────── */}
      {activeTab === 'mood' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              How are you feeling today?
            </h3>
            <button
              type="button"
              onClick={() => setShowLivePreview(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                color: showLivePreview ? '#4F46E5' : '#6B7280',
                background: showLivePreview ? '#EEF2FF' : '#F3F4F6',
                border: '1px solid',
                borderColor: showLivePreview ? '#C7D2FE' : '#E5E7EB',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Sparkles size={14} />
              <span>{showLivePreview ? 'Hide Live Mirror' : 'Live Sentiment Mirror'}</span>
            </button>
          </div>

          <div className="mood-picker-row">
            {[
              { id: 'Very Sad', label: 'Very Sad', icon: '' },
              { id: 'Sad', label: 'Sad', icon: '' },
              { id: 'Neutral', label: 'Neutral', icon: '' },
              { id: 'Happy', label: 'Happy', icon: '' },
              { id: 'Very Happy', label: 'Very Happy', icon: '' }
            ].map((m) => (
              <div 
                key={m.id}
                className={`mood-option-item ${selectedMood === m.id ? 'selected' : ''}`}
                onClick={() => setSelectedMood(m.id)}
                role="button"
                tabIndex={0}
              >
                <div className="mood-emoji-wrap">{m.icon}</div>
                <span className="mood-label-text">{m.label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveMood}>
            <div className="form-group">
              <label className="form-label">Add reflection note (analyzed for sentiment & cognitive patterns):</label>
              <textarea 
                className="form-input"
                rows={3}
                placeholder="What prompted this feeling? Describe your thoughts, challenges, or gratitude..."
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Live Sentiment Mirror Preview */}
            {showLivePreview && (
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                {isPreviewLoading && (
                  <div style={{ fontSize: '0.8rem', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={14} className="spin-animation" />
                    <span>Analyzing mood sentiment...</span>
                  </div>
                )}
                {livePreview && (
                  <SentimentMirrorCard analysis={livePreview} compact={true} showDisclaimer={false} />
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                id="btn-save-mood-entry"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Sparkles size={16} />
                <span>Save & Analyze Mood</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: TEXT JOURNAL WITH SENTIMENT MIRROR ─────────────────────── */}
      {activeTab === 'text' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Write your thoughts
            </h3>

            <button
              type="button"
              onClick={() => setShowLivePreview(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                color: showLivePreview ? '#4F46E5' : '#6B7280',
                background: showLivePreview ? '#EEF2FF' : '#F3F4F6',
                border: '1px solid',
                borderColor: showLivePreview ? '#C7D2FE' : '#E5E7EB',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Sparkles size={14} />
              <span>{showLivePreview ? 'Hide Live Mirror' : 'Enable Live Sentiment Mirror'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveText}>
            <div className="form-group">
              <label className="form-label" htmlFor="text-journal-title">Title (optional)</label>
              <input 
                id="text-journal-title"
                type="text"
                className="form-input"
                placeholder="Give a title to your entry"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <textarea 
                className="form-input"
                rows={5}
                placeholder="What's on your mind today? Write freely about how you're feeling, challenges you face, or reflections..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Live Sentiment Mirror Preview */}
            {showLivePreview && (
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                {isPreviewLoading && (
                  <div style={{ fontSize: '0.8rem', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={14} className="spin-animation" />
                    <span>Analyzing sentiment and cognitive patterns...</span>
                  </div>
                )}
                {livePreview && (
                  <SentimentMirrorCard analysis={livePreview} compact={true} showDisclaimer={false} />
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                id="btn-save-text-entry"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Sparkles size={16} />
                <span>Save & Analyze Entry</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: VOICE JOURNAL WITH REAL SPEECH RECOGNITION & MIRROR ────── */}
      {activeTab === 'voice' && (
        <div className="card voice-recorder-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Record & Transcribe Spoken Reflection
            </h3>

            <button
              type="button"
              onClick={() => setShowLivePreview(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                color: showLivePreview ? '#4F46E5' : '#6B7280',
                background: showLivePreview ? '#EEF2FF' : '#F3F4F6',
                border: '1px solid',
                borderColor: showLivePreview ? '#C7D2FE' : '#E5E7EB',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Sparkles size={14} />
              <span>{showLivePreview ? 'Hide Live Mirror' : 'Live Sentiment Mirror'}</span>
            </button>
          </div>

          <div className={`voice-mic-circle ${isRecording ? 'recording' : ''}`}>
            <Mic size={40} />
          </div>

          <div className="recording-timer">
            {formatTime(recordingSeconds)} / 05:00
          </div>

          {micError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-warning)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} />
              <span>{micError}</span>
            </div>
          )}

          {audioUrl && (
            <audio 
              ref={audioPlayerRef} 
              src={audioUrl} 
              onEnded={() => setIsPlaying(false)} 
            />
          )}

          <div className="voice-controls-row">
            {!isRecording ? (
              <button 
                type="button" 
                className="btn"
                style={{ background: '#EF4444', color: '#fff' }}
                onClick={startRecording}
                id="btn-voice-record"
              >
                <Mic size={16} />
                <span>Record Voice</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={stopRecording}
                id="btn-voice-stop"
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            )}

            <button 
              type="button" 
              className="btn btn-outline"
              disabled={!audioBlob || isRecording}
              onClick={togglePlayback}
              id="btn-voice-play"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          {/* Real-Time Live Speech-To-Text Transcription Box */}
          <div style={{ width: '100%', marginTop: '1.5rem', textAlign: 'left' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Volume2 size={14} color="#6366F1" />
              <span>Spoken Thoughts Transcription (Editable before saving):</span>
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder={isRecording ? 'Listening and transcribing your speech in real time...' : 'Speak into your microphone, or type your spoken reflection notes here to run Sentiment Analysis...'}
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Live Sentiment Mirror Preview for Voice */}
          {showLivePreview && voiceTranscript.trim() && (
            <div style={{ width: '100%', marginTop: '1rem', textAlign: 'left' }}>
              {livePreview && (
                <SentimentMirrorCard analysis={livePreview} compact={true} showDisclaimer={false} />
              )}
            </div>
          )}

          {(audioBlob || voiceTranscript.trim()) && !isRecording && (
            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveVoice}
                id="btn-save-voice-entry"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Sparkles size={16} />
                <span>Save Voice Entry & Analyze</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: SENTIMENT MIRROR & TRENDS ─────────────────────────────── */}
      {activeTab === 'trends' && (
        <MoodTrendsSection />
      )}

      {/* ── JOURNAL HISTORY (ALL 3 TYPES WITH SENTIMENT MIRROR) ─────────── */}
      <section className="history-section" style={{ marginTop: '2.5rem' }}>
        <div className="history-header-row">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
            Past Entries & Multimodal Sentiment Mirrors
          </h2>

          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              className="history-search-input"
              placeholder="Search entries or emotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
            <p>No journal entries found. Begin by sharing your mood, writing a thought, or recording an audio reflection above.</p>
          </div>
        ) : (
          <div className="history-list">
            {filteredEntries.map((entry) => {
              const isMood = entry.type === 'mood';
              const isVoice = entry.type === 'voice';
              const isExpanded = !!expandedEntries[entry.id];

              // Analysis payload: from backend or client-computed fallback
              const textContentForMirror = entry.note || (isMood ? `I am feeling ${entry.mood} today.` : '');
              const analysis = entry.sentiment_details || (textContentForMirror ? clientAnalyzeText(textContentForMirror) : null);
              const sentimentLabel = entry.sentiment_label || analysis?.sentiment?.label || (isMood ? (entry.mood === 'Happy' || entry.mood === 'Very Happy' ? 'Positive' : entry.mood === 'Sad' || entry.mood === 'Very Sad' ? 'Negative' : 'Neutral') : 'Neutral');

              let iconEmoji = '';
              let typeLabel = 'Text Journal';
              if (isMood) {
                typeLabel = 'Mood Journal';
                if (entry.mood === 'Happy' || entry.mood === 'Very Happy') iconEmoji = '';
                else if (entry.mood === 'Sad' || entry.mood === 'Very Sad') iconEmoji = '';
                else iconEmoji = '';
              } else if (isVoice) {
                typeLabel = 'Voice Journal';
                iconEmoji = '️';
              }

              return (
                <div key={entry.id} className="history-item-card" style={{ display: 'block', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div className="history-item-icon">
                        {iconEmoji}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 className="history-item-title" style={{ margin: 0 }}>
                            {entry.title}
                          </h4>
                          {sentimentLabel && (
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: sentimentLabel === 'Positive' ? '#DCFCE7' : sentimentLabel === 'Negative' ? '#FEE2E2' : '#F1F5F9',
                              color: sentimentLabel === 'Positive' ? '#166534' : sentimentLabel === 'Negative' ? '#991B1B' : '#475569'
                            }}>
                              {sentimentLabel} Sentiment
                            </span>
                          )}
                        </div>

                        <p className="history-item-meta" style={{ marginTop: '0.2rem' }}>
                          {typeLabel} · {entry.date} {entry.duration ? `(${entry.duration})` : ''}
                        </p>

                        {/* Note / Transcription */}
                        {entry.note && (
                          <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', marginTop: '0.5rem', maxWidth: '580px', lineHeight: '1.5' }}>
                            {entry.note}
                          </p>
                        )}

                        {/* Audio preview if voice entry */}
                        {isVoice && entry.audioUrl && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <audio controls src={entry.audioUrl} style={{ height: '32px', width: '240px' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="history-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button 
                        className="icon-btn"
                        onClick={() => handleStartEdit(entry)}
                        title="Edit entry note & re-analyze"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this journal entry and its analysis?')) {
                            deleteEntry(entry.id);
                          }
                        }}
                        title="Delete entry"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Sentiment Mirror Accordion Button — Available for ALL 3 Types */}
                  {analysis && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                      <button
                        type="button"
                        onClick={() => toggleEntryExpansion(entry.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '0.25rem 0'
                        }}
                      >
                        <Sparkles size={14} />
                        <span>{isExpanded ? 'Hide Sentiment Mirror & CBT Reframe' : `View ${typeLabel} Sentiment Mirror & Cognitive Reframe`}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <SentimentMirrorCard analysis={analysis} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── EDIT ENTRY MODAL ────────────────────────────────────────────── */}
      {editingEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                Edit Journal Entry
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Journal Content / Reflection Note</label>
              <textarea 
                className="form-input" 
                rows={5} 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setEditingEntry(null)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveEdit}
                disabled={isUpdating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={16} />
                <span>{isUpdating ? 'Re-analyzing...' : 'Save & Re-analyze'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
