import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useScreening } from '../context/ScreeningContext';
import { getAgeLabel, getProfessionLabel } from '../data/screeningData';

export default function QuestionnairePage({ onNavigate }) {
  const {
    activeTest,
    ageGroup,
    profession,
    questions,
    currentIndex,
    setCurrentIndex,
    answers,
    recordAnswer,
    finishAssessment
  } = useScreening();


  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Local state for current question to allow fluid response
  const existingAns = answers[currentIndex];
  const [selectedChoice, setSelectedChoice] = useState(existingAns ? (existingAns.isTrue ? 'True' : 'False') : null);
  const [followUp1Rating, setFollowUp1Rating] = useState(existingAns?.followUp1 ?? 2);
  const [followUp2Rating, setFollowUp2Rating] = useState(existingAns?.followUp2 ?? 2);
  const [validationError, setValidationError] = useState('');

  // Text-To-Speech (Read Aloud) state
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakQuestion = (textToRead) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const text = textToRead || currentQ.text;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Jenny') ||
          v.name.includes('Aria')
        )
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speech when question changes or on unmount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync local state when question changes
  useEffect(() => {
    const saved = answers[currentIndex];
    if (saved) {
      setSelectedChoice(saved.isTrue ? 'True' : 'False');
      setFollowUp1Rating(saved.followUp1 ?? 2);
      setFollowUp2Rating(saved.followUp2 ?? 2);
    } else {
      setSelectedChoice(null);
      setFollowUp1Rating(2);
      setFollowUp2Rating(2);
    }
    setValidationError('');
  }, [currentIndex]);

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    setValidationError('');
    // Record immediately
    const isTrue = choice === 'True';
    recordAnswer(currentIndex, isTrue, {
      q1: isTrue ? followUp1Rating : 0,
      q2: isTrue ? followUp2Rating : 0
    });
  };

  const handleRatingChange = (qNum, val) => {
    if (qNum === 1) {
      setFollowUp1Rating(val);
      recordAnswer(currentIndex, true, { q1: val, q2: followUp2Rating });
    } else {
      setFollowUp2Rating(val);
      recordAnswer(currentIndex, true, { q1: followUp1Rating, q2: val });
    }
  };

  const handleNext = async () => {
    if (!selectedChoice) {
      setValidationError('Please select True or False before proceeding.');
      return;
    }

    // Save final for current
    const isTrue = selectedChoice === 'True';
    recordAnswer(currentIndex, isTrue, {
      q1: isTrue ? followUp1Rating : 0,
      q2: isTrue ? followUp2Rating : 0
    });

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question completed -> Finish Assessment & navigate to Result
      await finishAssessment();
      onNavigate('result');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onNavigate('screening-setup');
    }
  };

  const testTitle = activeTest === 'schizophrenia' 
    ? 'Schizophrenia Screening Test' 
    : 'Bipolar Screening Test';

  return (
    <div className="quiz-container">
      {/* Test Name Badge & Demographic Chip */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
        <span style={{ 
          display: 'inline-block',
          padding: '0.35rem 0.95rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          fontSize: '0.86rem',
          fontWeight: 700,
          letterSpacing: '0.02em'
        }}>
          {testTitle}
        </span>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.28rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: '#F1F5F9',
          color: '#475569',
          fontSize: '0.8rem',
          fontWeight: 600,
          border: '1px solid #CBD5E1'
        }}>
          <span> Dynamic Profile:</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            {getAgeLabel(ageGroup)} • {getProfessionLabel(ageGroup, profession)}
          </span>
        </div>
      </div>


      {/* Progress Meta Row */}
      <div className="quiz-header-bar">
        <span>Question {currentIndex + 1} of {totalQuestions}</span>
        <span>{progressPercent}%</span>
      </div>

      {/* Progress Track */}
      <div className="quiz-progress-track">
        <div 
          className="quiz-progress-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="quiz-card">
        {/* Question Meta & Read Aloud Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.65rem'
        }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-tint)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)'
          }}>
            {currentQ.domain || `Dimension ${currentIndex + 1}`}
          </span>

          {/* Read Aloud Button */}
          <button
            type="button"
            onClick={() => speakQuestion(currentQ.text)}
            id="btn-read-aloud"
            className={`btn-read-aloud ${isSpeaking ? 'active' : ''}`}
            title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
            aria-label={isSpeaking ? 'Stop reading question aloud' : 'Read question aloud'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.42rem 0.95rem',
              borderRadius: 'var(--radius-full)',
              border: isSpeaking ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: isSpeaking ? 'var(--color-primary)' : '#FFFFFF',
              color: isSpeaking ? '#FFFFFF' : 'var(--color-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSpeaking ? '0 0 12px rgba(117, 96, 217, 0.45)' : 'none'
            }}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={17} />
                <span>Stop Reading</span>
              </>
            ) : (
              <>
                <Volume2 size={17} />
                <span>Read Aloud</span>
              </>
            )}
          </button>
        </div>

        <h2 className="quiz-question-text">
          {currentQ.text}
        </h2>

        {/* True / False Options (Screen 7) */}
        <div className="quiz-options-group">
          {/* True Option */}
          <div 
            className={`quiz-option-item ${selectedChoice === 'True' ? 'selected' : ''}`}
            onClick={() => handleChoiceSelect('True')}
            role="button"
            tabIndex={0}
          >
            <div className="custom-radio">
              {selectedChoice === 'True' && <div className="custom-radio-dot" />}
            </div>
            <span className="quiz-option-label">True</span>
          </div>

          {/* False Option */}
          <div 
            className={`quiz-option-item ${selectedChoice === 'False' ? 'selected' : ''}`}
            onClick={() => handleChoiceSelect('False')}
            role="button"
            tabIndex={0}
          >
            <div className="custom-radio">
              {selectedChoice === 'False' && <div className="custom-radio-dot" />}
            </div>
            <span className="quiz-option-label">False</span>
          </div>
        </div>

        {/* ── FOLLOW-UP QUESTIONS (Screen 8: Triggered If True) ─────────── */}
        {selectedChoice === 'True' && (
          <div className="followup-box">
            <div className="followup-alert-badge">
              You selected True. Please answer the following questions related to this area.
            </div>

            {/* Follow-up 1 */}
            <div className="followup-question-block">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 className="followup-title" style={{ margin: 0 }}>
                  {currentQ.followUp1 || 'How frequently do you experience this?'}
                </h4>
                <button
                  type="button"
                  onClick={() => speakQuestion(currentQ.followUp1 || 'How frequently do you experience this?')}
                  title="Read follow-up aloud"
                  aria-label="Read follow-up question aloud"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem'
                  }}
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <div className="rating-scale-row">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={`q1-val-${val}`}
                    type="button"
                    className={`rating-btn ${followUp1Rating === val ? 'active' : ''}`}
                    onClick={() => handleRatingChange(1, val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="rating-labels-row">
                <span>Not at all</span>
                <span>Very much</span>
              </div>
            </div>

            {/* Follow-up 2 */}
            <div className="followup-question-block" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 className="followup-title" style={{ margin: 0 }}>
                  {currentQ.followUp2 || 'How much does this affect your daily life?'}
                </h4>
                <button
                  type="button"
                  onClick={() => speakQuestion(currentQ.followUp2 || 'How much does this affect your daily life?')}
                  title="Read follow-up aloud"
                  aria-label="Read follow-up question aloud"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem'
                  }}
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <div className="rating-scale-row">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={`q2-val-${val}`}
                    type="button"
                    className={`rating-btn ${followUp2Rating === val ? 'active' : ''}`}
                    onClick={() => handleRatingChange(2, val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="rating-labels-row">
                <span>Not at all</span>
                <span>Very much</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation alert */}
      {validationError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-danger)',
          background: 'var(--color-danger-bg)',
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="quiz-actions-row">
        <button 
          type="button" 
          className="btn btn-outline"
          onClick={handlePrevious}
          id="quiz-prev-btn"
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        <button 
          type="button" 
          className="btn btn-primary"
          onClick={handleNext}
          id="quiz-next-btn"
        >
          <span>{currentIndex === totalQuestions - 1 ? 'Submit Assessment' : 'Next'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
