import React, { createContext, useContext, useState, useEffect } from 'react';
import { getQuestionsForTest } from '../data/screeningData';
import { useAuth } from './AuthContext';
import { fetchMlPrediction } from '../services/mlService';
import { 
  computeDomainScores, 
  generatePersonalizedRecommendations, 
  calculateLongitudinalComparison, 
  generatePersonalizedInsights 
} from '../utils/progressAnalytics';

const ScreeningContext = createContext(null);
const API_BASE = 'http://localhost:5000';

export const sanitizeResultRecord = (rec) => {
  if (!rec) return null;
  const isBipolar = rec.assessment_type === 'bipolar' || rec.assessment_type === 'MDQ';
  const expectedMax = isBipolar ? 15 : 16;
  
  let symptomCount = typeof rec.symptom_count === 'number' ? rec.symptom_count : null;
  let distressScore = typeof rec.distress_score === 'number' ? rec.distress_score : null;

  if (Array.isArray(rec.answers) && rec.answers.length > 0) {
    const trueAns = rec.answers.filter(a => a && (a.answer === 'True' || a.isTrue === true || a.endorsed === true));
    symptomCount = trueAns.length;
    let dist = 0;
    trueAns.forEach(a => {
      if (typeof a.followUp1 === 'number') dist += Math.max(0, Math.min(5, a.followUp1));
      if (typeof a.followUp2 === 'number') dist += Math.max(0, Math.min(5, a.followUp2));
    });
    distressScore = dist;
  } else if (symptomCount === null) {
    symptomCount = (typeof rec.score === 'number' && rec.score <= expectedMax) ? rec.score : 0;
  }

  if (distressScore === null) {
    distressScore = 0;
  }

  symptomCount = Math.max(0, Math.min(expectedMax, symptomCount));

  let category = rec.result_category || rec.category;
  if (symptomCount > 12) {
    category = 'Elevated';
  } else if (category === 'Elevated' || !category) {
    category = symptomCount >= 8 ? 'Moderate' : (symptomCount >= 4 ? 'Mild' : 'Minimal');
  }

  return {
    ...rec,
    assessment_type: isBipolar ? 'bipolar' : 'schizophrenia',
    score: symptomCount,
    maxScore: expectedMax,
    max_score: expectedMax,
    symptom_count: symptomCount,
    distress_score: distressScore,
    result_category: category,
    domain_scores: rec.domain_scores || (rec.answers ? computeDomainScores(rec.answers, isBipolar ? 'bipolar' : 'schizophrenia') : {}),
    recommendations: rec.recommendations || []
  };
};

export function ScreeningProvider({ children }) {
  const { token, user } = useAuth();
  const [activeTest, setActiveTest] = useState('schizophrenia'); // 'schizophrenia' | 'bipolar'
  const [ageGroup, setAgeGroup] = useState('19-25');
  const [profession, setProfession] = useState('student');
  const [questions, setQuestions] = useState(() => getQuestionsForTest('schizophrenia', '19-25', 'student'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [latestResult, setLatestResult] = useState(() => {
    try {
      const saved = localStorage.getItem('mindwave_latest_result');
      return saved ? sanitizeResultRecord(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Recommendation feedback map { [recommendationKey]: 'helpful' | 'somewhat_helpful' | 'not_helpful' }
  const [recommendationFeedback, setRecommendationFeedback] = useState(() => {
    try {
      const cached = localStorage.getItem('mindwave_rec_feedback');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Initialize or fetch history and feedback
  useEffect(() => {
    loadHistory();
    loadFeedback();
  }, [token, user]);

  const loadFeedback = async () => {
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/recommendations/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.feedback)) {
            const map = {};
            data.feedback.forEach(item => {
              if (item.recommendation_key) {
                map[item.recommendation_key] = item.rating;
              }
            });
            setRecommendationFeedback(prev => ({ ...prev, ...map }));
            localStorage.setItem('mindwave_rec_feedback', JSON.stringify(map));
          }
        }
      } catch (err) {
        console.warn('Could not load feedback from backend:', err);
      }
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    let records = [];

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/screenings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            records = data.map(item => ({
              id: item.id,
              assessment_type: item.assessment_type === 'PQ-16' ? 'schizophrenia' : (item.assessment_type === 'MDQ' ? 'bipolar' : item.assessment_type),
              score: item.score,
              maxScore: item.max_score || (item.assessment_type === 'bipolar' ? 15 : 16),
              max_score: item.max_score || (item.assessment_type === 'bipolar' ? 15 : 16),
              symptom_count: item.score,
              distress_score: item.distress_score || 0,
              result_category: item.result_category,
              domain_scores: item.domain_scores || {},
              ml_prediction: item.ml_prediction || null,
              recommendations: item.recommendations || [],
              date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              created_at: item.created_at,
              answers: typeof item.answers === 'string' ? JSON.parse(item.answers) : (item.answers || [])
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch screenings from backend:', err);
      }
    }

    if (records.length === 0) {
      try {
        const cached = localStorage.getItem('mindwave_screenings_history');
        if (cached) {
          records = JSON.parse(cached);
        }
      } catch {}
    }

    const sanitized = records.map(sanitizeResultRecord);
    setHistory(sanitized);
    setLoadingHistory(false);
  };

  const startTest = (testType, newAge, newProf) => {
    const targetTest = testType || activeTest;
    const targetAge = newAge || ageGroup;
    const targetProf = newProf || profession;
    setActiveTest(targetTest);
    if (newAge) setAgeGroup(newAge);
    if (newProf) setProfession(newProf);
    setQuestions(getQuestionsForTest(targetTest, targetAge, targetProf));
    setCurrentIndex(0);
    setAnswers({});
  };

  const updateSetup = (age, prof) => {
    const targetAge = age || ageGroup;
    const targetProf = prof || profession;
    setAgeGroup(targetAge);
    setProfession(targetProf);
    setQuestions(getQuestionsForTest(activeTest, targetAge, targetProf));
    setCurrentIndex(0);
    setAnswers({});
  };

  const recordAnswer = (index, isTrue, followUps = { q1: 0, q2: 0 }) => {
    const question = questions[index];
    if (!question) return;

    setAnswers(prev => ({
      ...prev,
      [index]: {
        questionNumber: index + 1,
        questionText: question.text,
        isTrue,
        followUp1: isTrue ? followUps.q1 : null,
        followUp2: isTrue ? followUps.q2 : null
      }
    }));
  };

  const submitRecommendationFeedback = async ({ assessmentId, recommendationKey, recommendationTitle, category, rating, feedbackText }) => {
    // 1. Optimistic local update
    const updatedMap = {
      ...recommendationFeedback,
      [recommendationKey]: rating
    };
    setRecommendationFeedback(updatedMap);
    localStorage.setItem('mindwave_rec_feedback', JSON.stringify(updatedMap));

    // Also update current latestResult recommendations if present
    if (latestResult && Array.isArray(latestResult.recommendations)) {
      const updatedRecs = latestResult.recommendations.map(r => {
        if (r.id === recommendationKey) {
          return { ...r, userRating: rating };
        }
        return r;
      });
      const updatedResult = { ...latestResult, recommendations: updatedRecs };
      setLatestResult(updatedResult);
      localStorage.setItem('mindwave_latest_result', JSON.stringify(updatedResult));
    }

    // 2. Persist to backend
    if (token) {
      try {
        await fetch(`${API_BASE}/api/recommendations/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            assessment_id: assessmentId || null,
            recommendation_key: recommendationKey,
            recommendation_title: recommendationTitle || recommendationKey,
            category: category || null,
            rating,
            feedback_text: feedbackText || null
          })
        });
      } catch (err) {
        console.warn('Could not sync recommendation feedback to backend:', err);
      }
    }
  };

  const finishAssessment = async () => {
    let symptomCount = 0;
    let totalDistress = 0;
    const formattedAnswers = [];

    questions.forEach((q, idx) => {
      const ans = answers[idx];
      const isTrue = ans?.isTrue === true;
      if (isTrue) {
        symptomCount += 1;
        const d1 = typeof ans.followUp1 === 'number' ? Math.max(0, Math.min(5, ans.followUp1)) : 0;
        const d2 = typeof ans.followUp2 === 'number' ? Math.max(0, Math.min(5, ans.followUp2)) : 0;
        totalDistress += (d1 + d2);
      }
      formattedAnswers.push({
        id: q.id,
        text: q.text,
        domain: q.domain || 'Clinical Symptom Dimension',
        answer: isTrue ? 'True' : (ans?.isTrue === false ? 'False' : 'Unanswered'),
        followUp1: isTrue ? (ans?.followUp1 ?? 0) : null,
        followUp2: isTrue ? (ans?.followUp2 ?? 0) : null
      });
    });

    const isBipolar = activeTest === 'bipolar';
    const maxScore = questions.length; // 16 for PQ-16, 15 for MDQ
    const primaryScore = symptomCount;

    let category = 'Minimal';
    let interpretation = '';

    if (symptomCount > 12) {
      category = 'Elevated';
      interpretation = isBipolar
        ? 'Your responses meet high clinical threshold criteria on the Mood Disorder Questionnaire (MDQ), indicating multiple co-occurring hypomanic or manic features with notable functional impact. We strongly recommend consulting a psychiatrist or licensed clinical psychologist for a formal evaluation.'
        : 'Your responses indicate an elevated likelihood of prodromal risk indicators on the Prodromal Questionnaire (PQ-16), with associated distress. A comprehensive clinical evaluation by a psychiatrist or mental health specialist is strongly advised.';
    } else if (symptomCount >= 8) {
      category = 'Moderate';
      interpretation = isBipolar
        ? 'Your responses indicate moderate endorsement of mood elevation and psychomotor activation features on the Mood Disorder Questionnaire (MDQ). Sub-threshold mood cycling or episodic energy shifts may impact daily routines, suggesting value in professional clinical consultation.'
        : 'Your responses indicate moderate likelihood of prodromal sensory or perceptual variations on the Prodromal Questionnaire (PQ-16). While not a diagnosis, exploring these patterns with a mental health professional can provide valuable clarity.';
    } else if (symptomCount >= 4) {
      category = 'Mild';
      interpretation = isBipolar
        ? 'Your responses indicate mild occasional indicators of heightened energy or mood shifts on the Mood Disorder Questionnaire (MDQ). Regular mindfulness, circadian sleep habits, and routine tracking may be beneficial.'
        : 'Your responses indicate mild occasional perceptual or cognitive indicators on the Prodromal Questionnaire (PQ-16). Routine mindfulness and healthy sleep habits may help maintain balance.';
    } else {
      category = 'Minimal';
      interpretation = isBipolar
        ? 'Your responses reflect minimal endorsement of hypomanic or manic features on the Mood Disorder Questionnaire (MDQ). Reported mood variations remain within typical baseline fluctuations.'
        : 'Your responses reflect minimal likelihood of perceptual or cognitive variations on the Prodromal Questionnaire (PQ-16). Sensory and thought processing appear stable.';
    }

    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Compute structured domain scores
    const domainScores = computeDomainScores(formattedAnswers, activeTest);

    // Generate tailored recommendations informed by past user feedback
    const tailoredRecommendations = generatePersonalizedRecommendations({
      assessmentType: activeTest,
      category,
      score: primaryScore,
      answers: formattedAnswers,
      feedbackHistory: recommendationFeedback
    });

    // Supplemental screening assessment (pass history for longitudinal context)
    let mlPrediction = null;
    try {
      mlPrediction = await fetchMlPrediction({
        assessmentType: activeTest,
        ageGroup,
        profession,
        answers: formattedAnswers,
        history
      });
    } catch {
      mlPrediction = {
        status: 'offline',
        is_supported: false,
        unsupported_reason: 'Screening assessment is currently unavailable for this questionnaire or age group.'
      };
    }

    const resultObj = {
      assessment_type: activeTest,
      date: todayStr,
      created_at: new Date().toISOString(),
      score: primaryScore,
      maxScore: maxScore,
      max_score: maxScore,
      symptom_count: symptomCount,
      distress_score: totalDistress,
      result_category: category,
      interpretation,
      age_group: ageGroup,
      profession,
      answers: formattedAnswers,
      domain_scores: domainScores,
      ml_prediction: mlPrediction,
      recommendations: tailoredRecommendations
    };

    setLatestResult(resultObj);
    localStorage.setItem('mindwave_latest_result', JSON.stringify(resultObj));

    // Save to history locally (immutable prepend)
    const newHistory = [resultObj, ...history];
    setHistory(newHistory);
    localStorage.setItem('mindwave_screenings_history', JSON.stringify(newHistory));

    // Clear session answers after completion to prevent leakage
    setAnswers({});

    // Persist to backend if token available
    if (token) {
      try {
        await fetch(`${API_BASE}/api/screenings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            assessment_type: activeTest,
            score: primaryScore,
            symptom_count: symptomCount,
            max_score: maxScore,
            distress_score: totalDistress,
            result_category: category,
            age_group: ageGroup,
            profession,
            answers: formattedAnswers,
            domain_scores: domainScores,
            ml_prediction: mlPrediction,
            recommendations: tailoredRecommendations
          })
        });
      } catch (err) {
        console.warn('Failed to sync assessment result to backend:', err);
      }
    }

    return resultObj;
  };

  const clearHistory = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/screenings/clear`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }
    setHistory([]);
    setLatestResult(null);
    setRecommendationFeedback({});
    localStorage.removeItem('mindwave_screenings_history');
    localStorage.removeItem('mindwave_latest_result');
    localStorage.removeItem('mindwave_rec_feedback');
  };

  // Helper to calculate longitudinal comparison between any two records
  const getLongitudinalComparison = (earlier, later) => {
    return calculateLongitudinalComparison(earlier, later);
  };

  // Helper to generate personalized insights from history
  const getPersonalizedInsights = () => {
    return generatePersonalizedInsights(history, Object.entries(recommendationFeedback).map(([k, r]) => ({ recommendation_key: k, rating: r })));
  };

  return (
    <ScreeningContext.Provider value={{
      activeTest,
      ageGroup,
      profession,
      questions,
      currentIndex,
      setCurrentIndex,
      answers,
      latestResult,
      history,
      loadingHistory,
      recommendationFeedback,
      submitRecommendationFeedback,
      startTest,
      updateSetup,
      recordAnswer,
      finishAssessment,
      clearHistory,
      getLongitudinalComparison,
      getPersonalizedInsights,
      loadHistory
    }}>
      {children}
    </ScreeningContext.Provider>
  );
}

export function useScreening() {
  return useContext(ScreeningContext);
}
