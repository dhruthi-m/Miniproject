
import React, { useState, useEffect } from 'react';
import {
  AGE_GROUPS,
  OCCUPATIONS_BY_AGE,
  getAdaptiveQuestions,
  getContextualQuestionText,
  calculateAssessmentScores
} from './adaptiveScreeningEngine';
import { useSpeech } from './useSpeech';
import SchizophreniaDashboard from './SchizophreniaDashboard';
import BipolarDashboard from './BipolarDashboard';

/**
 * AdaptiveQuestionnaire Component
 * 
 * MindWave Age- and Profession-Aware Screening Engine.
 * Features:
 * - Age groups from 6 to 50+ ('6-12', '13-17', '18-25', '26-39', '40-49', '50+')
 * - Profession selection + Dedicated input to add any custom profession
 * - Both Age and Profession displayed together on the initial setup screen
 * - Dynamic domain branching:
 *     - If answered "No", skips follow-ups and moves to next domain question
 *     - If answered "Yes", dynamically asks 2-3 follow-up questions in the same domain
 * 
 * @param {string} assessmentType 'bipolar' | 'schizophrenia'
 * @param {Function} onBackToMenu Callback to return to screening directory
 */
export default function AdaptiveQuestionnaire({
  assessmentType = 'bipolar',
  onBackToMenu
}) {
  const { speak, stop, isSpeaking } = useSpeech();
  const storagePrefix = `mindwave_${assessmentType}`;

  // Stages: 'setup' | 'quiz' | 'results'
  const [stage, setStage] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'results') {
        const recordRaw = localStorage.getItem(`${storagePrefix}_record`);
        if (recordRaw || localStorage.getItem(`${storagePrefix}_taken`) === 'true') {
          return 'results';
        }
      }
    } catch (e) { }
    return 'setup';
  });

  const [selectedAge, setSelectedAge] = useState(
    () => localStorage.getItem(`${storagePrefix}_age`) || '18-25'
  );
  const [selectedOccupation, setSelectedOccupation] = useState(
    () => localStorage.getItem(`${storagePrefix}_occupation_id`) || 'software_it'
  );
  const [customProfession, setCustomProfession] = useState(
    () => localStorage.getItem(`${storagePrefix}_custom_profession`) || ''
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // Active question set based on selected age
  const [questions, setQuestions] = useState(() => getAdaptiveQuestions(assessmentType, selectedAge));

  // Structured answers array
  const [answers, setAnswers] = useState(() => {
    try {
      const recordRaw = localStorage.getItem(`${storagePrefix}_record`);
      if (recordRaw) {
        const rec = JSON.parse(recordRaw);
        if (Array.isArray(rec.answers) && rec.answers.length > 0) {
          return rec.answers;
        }
      }
      const ansRaw = localStorage.getItem(`${storagePrefix}_answers`);
      if (ansRaw) {
        const parsed = JSON.parse(ansRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }

    return questions.map((q, idx) => ({
      id: idx + 1,
      name: q.domain || `Symptom Dimension ${idx + 1}`,
      question_id: q.id,
      question: q.text,
      category: q.category,
      domain: q.domain,
      contextType: q.contextType,
      answer: null, // null | 'Yes' | 'No'
      follow_up_question_id: q.followUp ? q.followUp.id : null,
      follow_up_question: q.followUp ? q.followUp.text : null,
      follow_up_answer: null, // null | 'Yes' | 'No'
      context_question_id: `${q.id}_context`,
      context_question: getContextualQuestionText(q.contextType, selectedOccupation, customProfession),
      context_answer: null, // null | 'Yes' | 'No'
      context_category: customProfession || selectedOccupation,
      distress_level: null, // null | 0..5
      symptom: null, // boolean
      distress: null, // integer
      timestamp: Date.now()
    }));
  });

  const [calculatedScores, setCalculatedScores] = useState(() => {
    try {
      const recordRaw = localStorage.getItem(`${storagePrefix}_record`);
      if (recordRaw) {
        const rec = JSON.parse(recordRaw);
        return {
          symptomCount: rec.symptom_count ?? (parseInt(localStorage.getItem(`${storagePrefix}_symptomCount`)) || 0),
          schizSymptoms: rec.schiz_symptoms ?? 0,
          bipolarSymptoms: rec.bipolar_symptoms ?? 0,
          totalDistress: rec.total_distress ?? (parseInt(localStorage.getItem(`${storagePrefix}_totalExtent`)) || 0)
        };
      }
    } catch (e) { }
    return {
      symptomCount: parseInt(localStorage.getItem(`${storagePrefix}_symptomCount`)) || 0,
      schizSymptoms: 0,
      bipolarSymptoms: 0,
      totalDistress: parseInt(localStorage.getItem(`${storagePrefix}_totalExtent`)) || 0
    };
  });

  const availableOccupations = OCCUPATIONS_BY_AGE[selectedAge] || OCCUPATIONS_BY_AGE['18-25'];

  // Keep occupation selection valid when age changes
  useEffect(() => {
    const validOccs = OCCUPATIONS_BY_AGE[selectedAge] || [];
    if (selectedOccupation !== 'custom' && !validOccs.some(occ => occ.id === selectedOccupation)) {
      if (validOccs.length > 0) {
        setSelectedOccupation(validOccs[0].id);
      }
    }
  }, [selectedAge]);

  const assessmentHeaderTag = {
    bipolar: 'BIPOLAR DISORDER SCREENING',
    schizophrenia: 'SCHIZOPHRENIA SCREENING'
  }[assessmentType] || 'CLINICAL SCREENING';

  const currentAgeMeta = AGE_GROUPS.find(g => g.id === selectedAge) || AGE_GROUPS[2];

  const effectiveProfessionLabel = customProfession.trim()
    ? customProfession.trim()
    : (availableOccupations.find(o => o.id === selectedOccupation)?.label || 'General / Professional');

  // ──────────────────────────────────────────────────────────────────────────
  // Setup Actions
  // ──────────────────────────────────────────────────────────────────────────
  const handleSelectAge = (ageId) => {
    setSelectedAge(ageId);
    localStorage.setItem(`${storagePrefix}_age`, ageId);
  };

  const handleSelectOccupation = (occId) => {
    setSelectedOccupation(occId);
    setCustomProfession('');
    localStorage.setItem(`${storagePrefix}_occupation_id`, occId);
    localStorage.removeItem(`${storagePrefix}_custom_profession`);
  };

  const handleCustomProfessionChange = (val) => {
    setCustomProfession(val);
    setSelectedOccupation('custom');
    localStorage.setItem(`${storagePrefix}_occupation_id`, 'custom');
    localStorage.setItem(`${storagePrefix}_custom_profession`, val);
  };

  const handleStartScreening = () => {
    const newQuestions = getAdaptiveQuestions(assessmentType, selectedAge);
    setQuestions(newQuestions);
    setAnswers(
      newQuestions.map((q, idx) => ({
        id: idx + 1,
        name: q.domain || `Symptom Dimension ${idx + 1}`,
        question_id: q.id,
        question: q.text,
        category: q.category,
        domain: q.domain,
        contextType: q.contextType,
        answer: null,
        follow_up_question_id: q.followUp ? q.followUp.id : null,
        follow_up_question: q.followUp ? q.followUp.text : null,
        follow_up_answer: null,
        context_question_id: `${q.id}_context`,
        context_question: getContextualQuestionText(q.contextType, selectedOccupation, customProfession),
        context_answer: null,
        context_category: effectiveProfessionLabel,
        distress_level: null,
        symptom: null,
        distress: null,
        timestamp: Date.now()
      }))
    );
    setCurrentIndex(0);
    setStage('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Questionnaire Answering Handlers (Dynamic Branching)
  // ──────────────────────────────────────────────────────────────────────────
  const currentQ = questions[currentIndex] || questions[0];
  const currentAns = answers[currentIndex] || {};

  // Primary Answer: Yes or No
  const handlePrimaryAnswer = (val) => {
    const isYes = val === 'Yes' || val === 'True';
    const updated = [...answers];
    updated[currentIndex] = {
      ...updated[currentIndex],
      answer: isYes ? 'Yes' : 'No',
      symptom: isYes,
      // If "No", automatically set follow-ups to negative and distress to 0
      follow_up_answer: isYes ? updated[currentIndex].follow_up_answer : 'No',
      context_answer: isYes ? updated[currentIndex].context_answer : 'No',
      distress_level: isYes ? updated[currentIndex].distress_level : 0,
      distress: isYes ? updated[currentIndex].distress : 0,
      timestamp: Date.now()
    };
    setAnswers(updated);
  };

  // Follow-up 1: Clinical Probe in same domain (Yes / No)
  const handleFollowUpAnswer = (val) => {
    const isYes = val === 'Yes' || val === 'True';
    const updated = [...answers];
    updated[currentIndex] = {
      ...updated[currentIndex],
      follow_up_answer: isYes ? 'Yes' : 'No',
      timestamp: Date.now()
    };
    setAnswers(updated);
  };

  // Follow-up 2: Contextual Profession Impact in same domain (Yes / No)
  const handleContextAnswer = (val) => {
    const isYes = val === 'Yes' || val === 'True';
    const updated = [...answers];
    updated[currentIndex] = {
      ...updated[currentIndex],
      context_answer: isYes ? 'Yes' : 'No',
      timestamp: Date.now()
    };
    setAnswers(updated);
  };

  // Follow-up 3: Distress / Severity Score (0 to 5)
  const handleDistressSelect = (score) => {
    const updated = [...answers];
    updated[currentIndex] = {
      ...updated[currentIndex],
      distress_level: score,
      distress: score,
      timestamp: Date.now()
    };
    setAnswers(updated);
  };

  // Branching validation:
  // - If "No": user can immediately proceed to Next Question
  // - If "Yes": user must answer the 2-3 domain follow-ups
  const isPrimaryAnswered = currentAns.answer !== null;
  const isYesAnswered = currentAns.answer === 'Yes';
  const hasFollowUpProbe = !!currentQ.followUp;

  const isFollowUpProbeDone = !hasFollowUpProbe || currentAns.follow_up_answer !== null;
  const isContextDone = currentAns.context_answer !== null;
  const isDistressDone = currentAns.distress_level !== null;

  const isNextDisabled = !isPrimaryAnswered || (isYesAnswered && (!isFollowUpProbeDone || !isContextDone || !isDistressDone));

  const handleNext = () => {
    stop();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const scores = calculateAssessmentScores(answers, assessmentType);
      setCalculatedScores(scores);

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const nowTimestamp = Date.now();

      const assessmentRecord = {
        age_group: selectedAge,
        occupation: effectiveProfessionLabel,
        occupation_id: selectedOccupation,
        custom_profession: customProfession,
        assessment_type: assessmentType,
        symptom_count: scores.symptomCount,
        schiz_symptoms: scores.schizSymptoms,
        bipolar_symptoms: scores.bipolarSymptoms,
        total_distress: scores.totalDistress,
        timestamp: nowTimestamp,
        date: dateStr,
        answers: answers
      };

      localStorage.setItem(`${storagePrefix}_taken`, 'true');
      localStorage.setItem(`${storagePrefix}_age`, selectedAge);
      localStorage.setItem(`${storagePrefix}_occupation`, effectiveProfessionLabel);
      localStorage.setItem(`${storagePrefix}_symptomCount`, scores.symptomCount.toString());
      localStorage.setItem(`${storagePrefix}_totalExtent`, scores.totalDistress.toString());
      localStorage.setItem(`${storagePrefix}_date`, dateStr);
      localStorage.setItem(`${storagePrefix}_answers`, JSON.stringify(answers));
      localStorage.setItem(`${storagePrefix}_record`, JSON.stringify(assessmentRecord));

      // Append to persistent assessment history
      try {
        const histKey = `${storagePrefix}_history`;
        const existingHist = JSON.parse(localStorage.getItem(histKey) || '[]');
        existingHist.unshift(assessmentRecord);
        localStorage.setItem(histKey, JSON.stringify(existingHist.slice(0, 50)));

        const globalHist = JSON.parse(localStorage.getItem('mindwave_all_screenings') || '[]');
        globalHist.unshift(assessmentRecord);
        localStorage.setItem('mindwave_all_screenings', JSON.stringify(globalHist.slice(0, 100)));
      } catch (err) {
        console.warn('Could not update local history list', err);
      }

      // Sync with backend if logged in
      const authToken = localStorage.getItem('mindwave_token');
      if (authToken) {
        fetch('http://localhost:5000/api/screenings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            assessment_type: assessmentType,
            symptom_count: scores.symptomCount,
            distress_score: scores.totalDistress,
            result_category: scores.symptomCount >= 6 ? 'Elevated Monitoring Recommended' : 'Low Likelihood / Baseline',
            age_group: selectedAge,
            profession: effectiveProfessionLabel,
            answers: answers
          })
        }).catch(e => console.warn('Backend screening sync skipped:', e));
      }

      setStage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    stop();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRetake = () => {
    stop();
    setCurrentIndex(0);
    setStage('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: RESULTS DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'results') {
    if (assessmentType === 'schizophrenia') {
      return (
        <SchizophreniaDashboard
          symptomsCount={calculatedScores.symptomCount}
          severityScore={calculatedScores.totalDistress}
          answers={answers}
          onRetake={handleRetake}
          onHome={() => { window.location.href = '/'; }}
          patientName={`Participant (${currentAgeMeta.label})`}
        />
      );
    }
    return (
      <BipolarDashboard
        symptomsCount={calculatedScores.symptomCount}
        severityScore={calculatedScores.totalDistress}
        answers={answers}
        onRetake={handleRetake}
        onHome={() => { window.location.href = '/'; }}
        patientName={`Participant (${currentAgeMeta.label})`}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: UNIFIED SETUP SCREEN (Vertically Spacious Layout)
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-[2.5rem] p-8 sm:p-12 md:p-16 border border-slate-800/90 bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 text-left transition-all animate-fadeIn">

        {/* Top Header & Meta: Protocol, Demographic Tag, Step */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-purple-400 uppercase">
                {assessmentHeaderTag}
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/40 text-cyan-400 border border-cyan-500/40">
                <span className="w-1.5 h-1.5 rounded-xs bg-cyan-400"></span>
                <span>Demographic & Context Calibration</span>
              </span>
            </div>

            <span className="text-xs sm:text-sm font-medium text-slate-400 font-mono">
              Setup 1 of 1
            </span>
          </div>

          {/* Sleek Progress Bar (Cyan to Lavender Gradient) */}
          <div className="w-full h-1.5 sm:h-2 bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 transition-all duration-300 rounded-full w-full"
            ></div>
          </div>
        </div>

        {/* Heading Prompt */}
        <div className="my-1 flex flex-col gap-3">
          <h2 className="text-2xl sm:text-4xl font-bold text-white leading-snug tracking-tight">
            Select your age group and profession to personalize your questions.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            Clinical language, sensory criteria, and occupational follow-up questions will dynamically calibrate to your background.
          </p>
        </div>

        {/* VERTICALLY STACKED SPACIOUS DROPDOWN CARDS */}
        <div className="flex flex-col gap-6 sm:gap-7 my-2">

          {/* CARD 1: AGE GROUP DROPDOWN (Full Width & Spacious) */}
          <div className="p-7 sm:p-8 rounded-3xl bg-[#131d2e] border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="age-dropdown" className="text-sm sm:text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 text-xs font-black inline-flex items-center justify-center">1</span>
                <span>Select Age Group</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                Calibrated from 6 to 50+ years
              </span>
            </div>

            <div className="relative mt-1">
              <select
                id="age-dropdown"
                value={selectedAge}
                onChange={(e) => handleSelectAge(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-700/80 hover:border-cyan-400 focus:border-cyan-400 text-white font-medium text-base sm:text-lg rounded-2xl px-6 py-4 sm:py-5 appearance-none cursor-pointer focus:outline-none transition-all shadow-inner"
              >
                {AGE_GROUPS.map((group) => (
                  <option key={group.id} value={group.id} className="bg-slate-900 text-white py-3">
                    {group.title} ({group.label}) — {group.badge}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 font-mono">
              <span className="text-cyan-400 font-semibold">Active Tier:</span>
              <span className="text-white font-bold">{currentAgeMeta.title} ({currentAgeMeta.label})</span>
              <span className="text-slate-500 hidden sm:inline">· {currentAgeMeta.badge}</span>
            </div>
          </div>

          {/* CARD 2: PROFESSION DROPDOWN (Full Width & Spacious) */}
          <div className="p-7 sm:p-8 rounded-3xl bg-[#131d2e] border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="profession-dropdown" className="text-sm sm:text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 text-xs font-black inline-flex items-center justify-center">2</span>
                <span>Select Profession</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                Workplace & Routine Context
              </span>
            </div>

            <div className="relative mt-1">
              <select
                id="profession-dropdown"
                value={selectedOccupation}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setSelectedOccupation('custom');
                  } else {
                    handleSelectOccupation(val);
                  }
                }}
                className="w-full bg-slate-900 border-2 border-slate-700/80 hover:border-cyan-400 focus:border-cyan-400 text-white font-medium text-base sm:text-lg rounded-2xl px-6 py-4 sm:py-5 appearance-none cursor-pointer focus:outline-none transition-all shadow-inner"
              >
                <optgroup label={`Recommended for ${currentAgeMeta.label}`} className="bg-slate-900 text-slate-300 font-bold">
                  {availableOccupations.map((occ) => (
                    <option key={occ.id} value={occ.id} className="bg-slate-900 text-white py-3 font-normal">
                      {occ.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Custom Profession" className="bg-slate-900 text-cyan-400 font-bold">
                  <option value="custom" className="bg-slate-900 text-cyan-300 font-semibold py-3">
                    + Add / Type Custom Profession...
                  </option>
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {selectedOccupation === 'custom' ? (
              <div className="mt-2 flex flex-col gap-2 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 animate-fadeIn">
                <label className="text-xs sm:text-sm font-semibold text-cyan-300">
                  Type your custom profession / role:
                </label>
                <input
                  type="text"
                  value={customProfession}
                  onChange={(e) => handleCustomProfessionChange(e.target.value)}
                  placeholder="e.g. Civil Engineer, Doctor, Pilot, Artist, Dentist, Entrepreneur..."
                  className="w-full bg-slate-900 border-2 border-cyan-400 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  autoFocus
                />
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center justify-between font-mono">
                <span>Active: <strong className="text-white">{effectiveProfessionLabel}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedOccupation('custom')}
                  className="text-cyan-400 hover:text-cyan-300 underline text-xs font-sans cursor-pointer"
                >
                  Type custom instead
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full h-px bg-slate-800/80 my-4"></div>

        {/* Bottom Navigation Buttons: Matching Reference Screenshot Back and Next */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            type="button"
            onClick={onBackToMenu || (() => { window.location.href = '/screening.html'; })}
            className="rounded-full px-8 py-3.5 font-bold text-sm sm:text-base border border-slate-700/80 bg-[#131d2e] text-white hover:bg-slate-800 hover:border-slate-500 cursor-pointer transition-all flex items-center gap-2"
          >
            <span>← Back</span>
          </button>

          <button
            type="button"
            onClick={handleStartScreening}
            className="rounded-full px-10 py-4 font-black text-sm sm:text-base bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.7)] cursor-pointer transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <span>Next →</span>
          </button>
        </div>

      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: DYNAMIC BRANCHING QUESTIONNAIRE (Matching Reference Screenshot)
  // ──────────────────────────────────────────────────────────────────────────
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-[2.2rem] p-7 sm:p-11 md:p-14 border border-slate-800/90 bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex flex-col gap-6 text-left transition-all animate-fadeIn">

      {/* Top Header & Meta: Protocol, Demographic Tag, Question Count */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-purple-400 uppercase">
              {assessmentHeaderTag}
            </span>
            <button
              type="button"
              onClick={() => setStage('setup')}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/40 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-900/40 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-xs bg-cyan-400"></span>
              <span>{currentAgeMeta.title} ({currentAgeMeta.label})</span>
              <span className="text-slate-400">({effectiveProfessionLabel})</span>
              <span className="text-cyan-400">▾ Change</span>
            </button>
          </div>

          <span className="text-xs sm:text-sm font-medium text-slate-400 font-mono">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Sleek Progress Bar (Cyan to Lavender Gradient) */}
        <div className="w-full h-1.5 sm:h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Main Question Heading with Speaker Audio Button */}
      <div className="mt-4 flex items-start justify-between gap-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug tracking-tight">
          {currentQ.text}
        </h2>

        <button
          type="button"
          onClick={() => {
            if (isSpeaking) {
              stop();
            } else {
              speak(currentQ.text);
            }
          }}
          aria-label="Listen to question"
          title={isSpeaking ? 'Stop voice' : 'Listen to question'}
          className={`shrink-0 w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${isSpeaking
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-400 hover:border-cyan-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      </div>

      {/* PRIMARY ANSWER SELECTION: TRUE / FALSE (Wide Rectangular Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
        <button
          type="button"
          onClick={() => handlePrimaryAnswer('Yes')}
          className={`py-6 px-8 rounded-2xl font-bold text-xl sm:text-2xl transition-all duration-200 border cursor-pointer flex items-center justify-center gap-2 ${currentAns.answer === 'Yes'
              ? 'bg-slate-800/90 text-cyan-300 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)] ring-2 ring-cyan-400/50'
              : 'bg-[#131d2e] hover:bg-slate-800/70 text-slate-300 hover:text-white border-slate-800/90'
            }`}
        >
          <span>True</span>
        </button>

        <button
          type="button"
          onClick={() => handlePrimaryAnswer('No')}
          className={`py-6 px-8 rounded-2xl font-bold text-xl sm:text-2xl transition-all duration-200 border cursor-pointer flex items-center justify-center gap-2 ${currentAns.answer === 'No'
              ? 'bg-slate-800/90 text-white border-slate-500 shadow-lg ring-2 ring-slate-500/50'
              : 'bg-[#131d2e] hover:bg-slate-800/70 text-slate-300 hover:text-white border-slate-800/90'
            }`}
        >
          <span>False</span>
        </button>
      </div>

      {/* BRANCH A: USER ANSWERED "NO" (False) -> Skip follow-ups and advance */}
      {currentAns.answer === 'No' && (
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-300 animate-fadeIn">
          <span className="flex items-center gap-2 text-cyan-400 font-medium">
            <span></span> No disruption noted in this domain. Click <strong>Next →</strong> to proceed.
          </span>
        </div>
      )}

      {/* BRANCH B: USER ANSWERED "YES" (True) -> EXPAND IN-DEPTH 2-3 DOMAIN FOLLOW-UPS */}
      {currentAns.answer === 'Yes' && (
        <div className="flex flex-col gap-6 p-6 sm:p-7 rounded-2xl bg-slate-950/70 border border-cyan-500/30 shadow-inner animate-fadeIn mt-2">

          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-3">
            <span></span> In-Depth Domain Calibration ({currentQ.domain})
          </div>

          {/* Follow-up 1: Clinical Nuance Probe */}
          {currentQ.followUp && (
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-slate-200">
                1. Clinical Specifics: <span className="font-normal text-slate-300">{currentQ.followUp.text}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleFollowUpAnswer('Yes')}
                  className={`py-3 px-5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${currentAns.follow_up_answer === 'Yes'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-[#131d2e] text-slate-300 border-slate-700/80 hover:text-white'
                    }`}
                >
                  Yes (True)
                </button>
                <button
                  type="button"
                  onClick={() => handleFollowUpAnswer('No')}
                  className={`py-3 px-5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${currentAns.follow_up_answer === 'No'
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-[#131d2e] text-slate-300 border-slate-700/80 hover:text-white'
                    }`}
                >
                  No (False)
                </button>
              </div>
            </div>
          )}

          {/* Follow-up 2: Contextual Profession Impact */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold text-slate-200">
              2. Professional / Routine Impact ({effectiveProfessionLabel}):{' '}
              <span className="font-normal text-slate-300">
                {getContextualQuestionText(currentQ.contextType, selectedOccupation, customProfession)}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleContextAnswer('Yes')}
                className={`py-3 px-5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${currentAns.context_answer === 'Yes'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-[#131d2e] text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
              >
                Yes, Affected Work/Routine
              </button>
              <button
                type="button"
                onClick={() => handleContextAnswer('No')}
                className={`py-3 px-5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${currentAns.context_answer === 'No'
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-[#131d2e] text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
              >
                No, Did Not Affect
              </button>
            </div>
          </div>

          {/* Follow-up 3: Distress & Severity Rating (0 to 5) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold text-slate-200">
              3. Distress / Disruption Level: How much did this experience bother or distress you?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { score: 0, label: '0: None' },
                { score: 1, label: '1: Mild' },
                { score: 2, label: '2: Moderate' },
                { score: 3, label: '3: Significant' },
                { score: 4, label: '4: Severe' },
                { score: 5, label: '5: Extreme' }
              ].map((item) => (
                <button
                  key={item.score}
                  type="button"
                  onClick={() => handleDistressSelect(item.score)}
                  className={`py-2.5 px-1 text-center rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${currentAns.distress_level === item.score
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-105'
                      : 'bg-[#131d2e] text-slate-300 border-slate-700/80 hover:text-white hover:border-slate-500'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Subtle Horizontal Divider */}
      <div className="w-full h-px bg-slate-800/80 mt-6 mb-2"></div>

      {/* Bottom Navigation Buttons: Back & Next Pill Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`rounded-full px-8 py-3.5 font-bold text-sm sm:text-base border transition-all flex items-center gap-2 ${currentIndex === 0
              ? 'opacity-30 border-slate-800 text-slate-600 bg-slate-900/50 cursor-not-allowed'
              : 'bg-[#131d2e] border-slate-700/80 text-white hover:bg-slate-800 hover:border-slate-500 cursor-pointer'
            }`}
        >
          <span>← Back</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`rounded-full px-9 py-3.5 font-black text-sm sm:text-base transition-all duration-200 flex items-center gap-2 ${isNextDisabled
              ? 'opacity-30 bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
              : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.7)] cursor-pointer hover:scale-[1.02]'
            }`}
        >
          <span>{currentIndex === questions.length - 1 ? 'View Insights →' : 'Next →'}</span>
        </button>
      </div>

    </div>
  );
}
