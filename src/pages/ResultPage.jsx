import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  RotateCcw, 
  LayoutDashboard, 
  FileText, 
  ChevronDown, 
  Brain, 
  BarChart2, 
  Layers, 
  Sparkles, 
  Heart, 
  ListChecks, 
  CheckCircle2, 
  AlertCircle, 
  Wind, 
  BookOpen, 
  Sun, 
  Moon, 
  Activity, 
  PhoneCall, 
  Compass, 
  Info, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Target, 
  MapPin, 
  Hospital, 
  UserCheck, 
  Navigation, 
  HelpCircle, 
  Calculator, 
  X, 
  PieChart, 
  ChevronUp,
  ThumbsUp,
  Meh,
  ThumbsDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Minus
} from 'lucide-react';
import { useScreening } from '../context/ScreeningContext';
import GpsHealthcareMap from '../components/GpsHealthcareMap';
import ExperimentalMlSection from '../components/ExperimentalMlSection';
import { fetchMlPrediction } from '../services/mlService';

export default function ResultPage({ onNavigate }) {
  const { 
    latestResult, 
    activeTest, 
    startTest, 
    history, 
    recommendationFeedback, 
    submitRecommendationFeedback 
  } = useScreening();

  // Accordion state: null (all collapsed by default) or heading index (1-6)
  const [expandedSection, setExpandedSection] = useState(null);
  const [showQuickDetails, setShowQuickDetails] = useState(false);

  // Dynamic Recommendation Guide toggles
  const [openGuides, setOpenGuides] = useState({});
  const toggleGuide = (guideKey) => {
    setOpenGuides(prev => ({ ...prev, [guideKey]: !prev[guideKey] }));
  };

  const toggleSection = (sectionId) => {
    setExpandedSection(prev => (prev === sectionId ? null : sectionId));
  };

  // Screening Assessment State
  const [mlResult, setMlResult] = useState(() => latestResult?.ml_prediction || null);
  const [mlLoading, setMlLoading] = useState(false);

  const testType = latestResult?.assessment_type || activeTest || 'schizophrenia';

  useEffect(() => {
    if (latestResult?.ml_prediction) {
      setMlResult(latestResult.ml_prediction);
    } else if (latestResult?.answers && latestResult.answers.length > 0) {
      loadMlPrediction();
    }
  }, [latestResult]);

  const loadMlPrediction = async () => {
    if (!latestResult?.answers?.length) return;
    setMlLoading(true);
    try {
      const res = await fetchMlPrediction({
        assessmentType: testType,
        ageGroup: latestResult.age_group || '19-25',
        profession: latestResult.profession || 'student',
        answers: latestResult.answers
      });
      setMlResult(res);
    } catch {
      setMlResult({
        status: 'offline',
        is_supported: false,
        unsupported_reason: 'Screening assessment is currently unavailable for this questionnaire or age group.'
      });
    } finally {
      setMlLoading(false);
    }
  };
  const isSchizophrenia = testType === 'schizophrenia';
  const isBipolar = !isSchizophrenia;
  const testName = isSchizophrenia ? 'Schizophrenia Screening' : 'Bipolar Screening';
  const frameworkName = isSchizophrenia 
    ? 'PQ-16 Prodromal Psychosis Screening Protocol' 
    : 'MDQ (Mood Disorder Questionnaire) Clinical Framework';
  const frameworkTool = isSchizophrenia ? 'Prodromal Questionnaire 16 (PQ-16)' : 'Mood Disorder Questionnaire (MDQ)';

  const completedDate = latestResult?.date || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const answers = latestResult?.answers || [];
  const totalQuestions = answers.length;
  const trueAnswers = answers.filter(a => a && a.answer === 'True');
  const falseAnswers = answers.filter(a => a && a.answer === 'False');
  const trueCount = trueAnswers.length;
  const falseCount = falseAnswers.length;

  // Dynamic maximum score derived from question count (16 for PQ-16, 15 for MDQ)
  const dynamicMaxScore = answers.length > 0 ? answers.length : (isSchizophrenia ? 16 : 15);
  const maxScore = dynamicMaxScore;

  // Follow-up ratings
  const followUpRatings = [];
  trueAnswers.forEach(a => {
    if (typeof a.followUp1 === 'number') followUpRatings.push(a.followUp1);
    if (typeof a.followUp2 === 'number') followUpRatings.push(a.followUp2);
  });
  const totalFollowUpsCompleted = followUpRatings.length;
  const avgFollowUpRating = totalFollowUpsCompleted > 0
    ? (followUpRatings.reduce((sum, r) => sum + r, 0) / totalFollowUpsCompleted).toFixed(1)
    : null;
  const totalDistressPoints = typeof latestResult?.distress_score === 'number'
    ? latestResult.distress_score
    : followUpRatings.reduce((s, r) => s + r, 0);

  // Primary screening score: number of endorsed symptoms (never exceeds maxScore)
  const score = typeof latestResult?.symptom_count === 'number'
    ? Math.min(maxScore, latestResult.symptom_count)
    : (typeof latestResult?.score === 'number' && latestResult.score <= maxScore
      ? latestResult.score
      : trueCount);

  // Result Category: Only 'Elevated' if endorsement score is more than 12
  let category = latestResult?.result_category ?? 'Minimal';
  if (score > 12) {
    category = 'Elevated';
  } else if (category === 'Elevated' || score <= 12) {
    category = score >= 8 ? 'Moderate' : (score >= 4 ? 'Mild' : 'Minimal');
  }

  const ageGroup = latestResult?.age_group || 'Not specified';
  const profession = latestResult?.profession || 'Not specified';

  // Safe display values for Section 1
  const endorsedCountDisplay = score;
  const pqDenominator = maxScore;
  const distressScoreDisplay = totalDistressPoints;
  const scoreDisplay = score;

  // Risk Score Severity: Trigger emergency GPS radar ONLY if endorsement score is strictly more than 12
  const isHighRisk = score > 12;


  // ── DATA CALCULATIONS FOR SECTION 2 (RESPONSE BREAKDOWN) ────────────────
  // Dynamic question count based directly on user's actual screening input
  const userTotalQuestions = answers.length > 0 ? answers.length : (isSchizophrenia ? 16 : 15);
  const validAnswers = answers.filter(a => a && (a.answer === 'True' || a.answer === 'False'));
  const questionsAnswered = validAnswers.length;
  const questionsUnanswered = answers.filter(a => !a || (a.answer !== 'True' && a.answer !== 'False')).length;
  const section2TrueCount = answers.filter(a => a && a.answer === 'True').length;
  const section2FalseCount = answers.filter(a => a && a.answer === 'False').length;

  const allFollowUps = [];
  answers.forEach(a => {
    if (a && a.answer === 'True') {
      if (typeof a.followUp1 === 'number') allFollowUps.push(a.followUp1);
      if (typeof a.followUp2 === 'number') allFollowUps.push(a.followUp2);
    }
  });
  const followUpsRatedCount = allFollowUps.length;
  const expectedFollowUpsCount = section2TrueCount * 2;
  const avgFollowUp = followUpsRatedCount > 0
    ? (allFollowUps.reduce((sum, r) => sum + r, 0) / followUpsRatedCount).toFixed(1)
    : null;

  const truePercent = userTotalQuestions > 0 ? Math.round((section2TrueCount / userTotalQuestions) * 100) : 0;
  const falsePercent = userTotalQuestions > 0 ? Math.round((section2FalseCount / userTotalQuestions) * 100) : 0;
  const unansweredPercent = questionsUnanswered > 0 && userTotalQuestions > 0 ? Math.round((questionsUnanswered / userTotalQuestions) * 100) : 0;

  const ratingDistribution = [0, 1, 2, 3, 4, 5].map(rating => {
    const count = allFollowUps.filter(r => r === rating).length;
    return { rating, count };
  });
  const maxRatingCount = Math.max(1, ...ratingDistribution.map(r => r.count));

  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const trueStroke = (truePercent / 100) * donutCircumference;
  const falseStroke = (falsePercent / 100) * donutCircumference;
  const unansweredStroke = (unansweredPercent / 100) * donutCircumference;

  // High distress follow-ups (rating >= 3)
  const higherRatingsList = [];
  trueAnswers.forEach(a => {
    const hasHighFrequency = typeof a.followUp1 === 'number' && a.followUp1 >= 3;
    const hasHighImpact = typeof a.followUp2 === 'number' && a.followUp2 >= 3;
    if (hasHighFrequency || hasHighImpact) {
      higherRatingsList.push({
        text: a.text,
        domain: a.domain || (isBipolar ? 'Mood Dimension' : 'Perceptual Dimension'),
        frequency: a.followUp1,
        impact: a.followUp2
      });
    }
  });

  // Endorsed unique domains
  const endorsedDomains = [...new Set(trueAnswers.map(a => a.domain).filter(Boolean))];

  // Specific clinical symptom flags for dynamic responses
  const hasSleepIssue = trueAnswers.some(a => 
    (a.domain && a.domain.toLowerCase().includes('sleep')) || 
    (a.text && a.text.toLowerCase().includes('sleep'))
  );
  const hasRacingThoughts = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('racing') || a.domain.toLowerCase().includes('speech'))) ||
    (a.text && (a.text.toLowerCase().includes('racing') || a.text.toLowerCase().includes('talkative')))
  );
  const hasHighEnergyImpulse = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('energy') || a.domain.toLowerCase().includes('impulsiv') || a.domain.toLowerCase().includes('grandiosity'))) ||
    (a.text && (a.text.toLowerCase().includes('hyper') || a.text.toLowerCase().includes('money') || a.text.toLowerCase().includes('confident') || a.text.toLowerCase().includes('ambitious')))
  );
  const hasIrritabilityOrCycles = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('irritab') || a.domain.toLowerCase().includes('cycl') || a.domain.toLowerCase().includes('polarity'))) ||
    (a.text && (a.text.toLowerCase().includes('irritab') || a.text.toLowerCase().includes('shifts')))
  );
  const hasPerceptualSensory = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('percept') || a.domain.toLowerCase().includes('sensory') || a.domain.toLowerCase().includes('auditory') || a.domain.toLowerCase().includes('visual'))) ||
    (a.text && (a.text.toLowerCase().includes('hear') || a.text.toLowerCase().includes('see') || a.text.toLowerCase().includes('sound')))
  );
  const hasIdeationalBeliefs = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('belief') || a.domain.toLowerCase().includes('presence') || a.domain.toLowerCase().includes('meaning'))) ||
    (a.text && (a.text.toLowerCase().includes('force') || a.text.toLowerCase().includes('special') || a.text.toLowerCase().includes('talk about me')))
  );

  const handleRetake = () => {
    startTest(testType);
    onNavigate('screening-setup');
  };

  const handlePrint = () => {
    window.print();
  };

  const previousSession = React.useMemo(() => {
    if (!history || history.length < 2) return null;
    return history.find(h => h.created_at !== latestResult?.created_at && (h.id !== latestResult?.id || !latestResult?.id)) || history[1];
  }, [history, latestResult]);

  const longitudinalDiff = React.useMemo(() => {
    if (!previousSession) return null;
    const prevScore = previousSession.score ?? previousSession.symptom_count ?? 0;
    const currScore = score;
    const delta = currScore - prevScore;
    const prevDistress = previousSession.distress_score ?? 0;
    const deltaDistress = totalDistressPoints - prevDistress;
    return {
      prevScore,
      prevDate: previousSession.date || 'Previous Session',
      prevCategory: previousSession.result_category || 'Assessed',
      delta,
      deltaDistress,
      direction: delta < 0 ? 'decreased' : (delta > 0 ? 'increased' : 'stable')
    };
  }, [previousSession, score, totalDistressPoints]);

  const renderRecFeedbackBar = (key, title, category) => {
    const currentRating = recommendationFeedback?.[key];
    return (
      <div 
        className="rec-feedback-bar"
        style={{
          marginTop: '0.85rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
          {currentRating ? `Rated: ${currentRating.replace('_', ' ')}` : 'Helpful strategy?'}
        </span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${currentRating === 'helpful' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.2rem 0.45rem', fontSize: '0.74rem', minHeight: 'auto' }}
            onClick={() => submitRecommendationFeedback({
              assessmentId: latestResult?.id,
              recommendationKey: key,
              recommendationTitle: title,
              category,
              rating: 'helpful'
            })}
            title="Mark as Helpful"
          >
            <ThumbsUp size={12} />
            <span>Helpful</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentRating === 'somewhat_helpful' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.2rem 0.45rem', fontSize: '0.74rem', minHeight: 'auto' }}
            onClick={() => submitRecommendationFeedback({
              assessmentId: latestResult?.id,
              recommendationKey: key,
              recommendationTitle: title,
              category,
              rating: 'somewhat_helpful'
            })}
            title="Mark as Somewhat Helpful"
          >
            <Meh size={12} />
            <span>Somewhat</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentRating === 'not_helpful' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.2rem 0.45rem', fontSize: '0.74rem', minHeight: 'auto' }}
            onClick={() => submitRecommendationFeedback({
              assessmentId: latestResult?.id,
              recommendationKey: key,
              recommendationTitle: title,
              category,
              rating: 'not_helpful'
            })}
            title="Mark as Not Helpful"
          >
            <ThumbsDown size={12} />
            <span>Not Helpful</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="result-container" style={{ maxWidth: '840px', margin: '0 auto 4rem' }}>
      {/* ── 1. TOP SECTION — ALWAYS VISIBLE ──────────────────────────────── */}
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Your Screening Result</h1>
        <p className="page-description">Here is a summary of your assessment.</p>
      </header>

      {/* Prominent Score Card Banner */}
      <div className="result-card-banner">
        <div className="result-header-left">
          <div className="feature-mini-icon-circle" style={{ width: '60px', height: '60px', margin: 0 }}>
            {isSchizophrenia ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              {testName}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              Completed on {completedDate}
            </p>
          </div>
        </div>

        {/* Actual Score & Category */}
        <div className="result-score-box">
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
            Score
          </div>
          <div className="result-score-number">
            {score} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {maxScore}</span>
          </div>
          <span className="result-score-badge">
            {category}
          </span>
        </div>
      </div>

      {/* ── LONGITUDINAL COMPARISON BANNER (if prior assessment exists) ── */}
      {longitudinalDiff && (
        <section 
          className="longitudinal-quick-banner"
          style={{
            background: 'linear-gradient(135deg, rgba(117,96,217,0.08), rgba(99,102,241,0.04))',
            border: '1px solid rgba(117,96,217,0.22)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem 1.35rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: longitudinalDiff.delta < 0 ? '#DCFCE7' : (longitudinalDiff.delta > 0 ? '#FEF3C7' : '#F1F5F9'),
              color: longitudinalDiff.delta < 0 ? '#166534' : (longitudinalDiff.delta > 0 ? '#92400E' : '#475569'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {longitudinalDiff.delta < 0 ? <ArrowDownRight size={22} /> : (longitudinalDiff.delta > 0 ? <ArrowUpRight size={22} /> : <Minus size={22} />)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.96rem', color: 'var(--color-text)' }}>
                  Longitudinal Comparison vs Previous Assessment ({longitudinalDiff.prevDate})
                </strong>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: longitudinalDiff.delta < 0 ? '#DCFCE7' : (longitudinalDiff.delta > 0 ? '#FEF3C7' : '#F1F5F9'),
                  color: longitudinalDiff.delta < 0 ? '#166534' : (longitudinalDiff.delta > 0 ? '#92400E' : '#475569')
                }}>
                  {longitudinalDiff.delta > 0 ? `+${longitudinalDiff.delta} symptoms` : (longitudinalDiff.delta < 0 ? `${longitudinalDiff.delta} symptoms` : 'Stable Score')}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                Previous screening: {longitudinalDiff.prevScore}/{maxScore} ({longitudinalDiff.prevCategory}). Distress shift: {longitudinalDiff.deltaDistress > 0 ? `+${longitudinalDiff.deltaDistress}` : longitudinalDiff.deltaDistress} pts.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate('progress')}
            id="btn-goto-progress-from-result"
          >
            <span>View Full Trends & Shifts</span>
            <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* ── PRIORITY GPS HEALTHCARE MAP (Only shown if risk score is strictly above 30 for 34) ── */}
      {isHighRisk && (
        <section style={{ marginBottom: '2.5rem' }} id="gps-healthcare-priority-card">
          <GpsHealthcareMap
            riskLevel={category}
            score={score}
            maxScore={maxScore}
            testName={testName}
            autoLocate={true}
          />
        </section>
      )}

      {/* ── SUPPLEMENTAL SCREENING ANALYSIS ── */}
      <ExperimentalMlSection
        mlResult={mlResult}
        activeTest={testType}
        score={score}
        maxScore={maxScore}
        ageGroup={ageGroup}
        onRetry={loadMlPrediction}
        isLoading={mlLoading}
      />

      {/* ── 2. SEVEN EXPANDABLE ACCORDION HEADINGS ───────────────────────────── */}
      <div className="result-accordion-group">
        
        {/* ── HEADING 1: UNDERSTANDING YOUR RESULT ───────────────────────── */}
        <div className="accordion-card">
          <button 
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleSection(1)}
            aria-expanded={expandedSection === 1}
          >
            <div className="accordion-header-left">
              <div className="accordion-icon-box">
                <Brain size={20} />
              </div>
              <span className="accordion-header-title">1. Understanding Your Result</span>
            </div>
            <ChevronDown 
              size={20} 
              className={`accordion-chevron ${expandedSection === 1 ? 'rotated' : ''}`} 
            />
          </button>

          {expandedSection === 1 && (
            <div className="accordion-body-content">
              <div className="understanding-result-content">
                
                {/* 1. About the PQ-16 Questionnaire & Screening Purpose */}
                <div className="result-section-card">
                  <div className="result-section-card-header">
                    <div className="result-card-icon-badge">
                      <BookOpen size={18} />
                    </div>
                    <h3 className="result-section-card-title">
                      {isSchizophrenia ? 'About the PQ-16 Questionnaire' : 'About the MDQ Screening'}
                    </h3>
                  </div>
                  <p className="result-card-paragraph">
                    {isSchizophrenia ? (
                      <>
                        The <strong>Prodromal Questionnaire 16 (PQ-16)</strong> is a validated self-report screening questionnaire designed to identify early perceptual, sensory, and cognitive experiences that may be prodromal indicators of psychosis risk.
                      </>
                    ) : (
                      <>
                        The <strong>Mood Disorder Questionnaire (MDQ)</strong> is a validated self-report screening tool designed to evaluate co-occurring patterns of elevated mood, heightened energy, and behavioral changes associated with bipolar spectrum conditions.
                      </>
                    )}
                  </p>
                  <p className="result-card-paragraph">
                    Its primary purpose is early screening and self-reflection. Screening tools cast a broad net to help individuals notice patterns in their thoughts and sensations that may be worth discussing with a doctor or counselor. A screening questionnaire is <strong>not a diagnostic assessment</strong> and cannot confirm schizophrenia, bipolar disorder, or any other medical condition.
                  </p>
                </div>

                {/* 2. What Your Result Means */}
                <div className="result-section-card">
                  <div className="result-section-card-header">
                    <div className="result-card-icon-badge">
                      <Brain size={18} />
                    </div>
                    <h3 className="result-section-card-title">What Your Result Means</h3>
                  </div>
                  <p className="result-card-paragraph">
                    Your assessment results place you in the <strong>{category || 'Not available'}</strong> category based on your recorded responses. During this screening, you endorsed <strong>{endorsedCountDisplay !== 'Not available' ? `${endorsedCountDisplay} of ${pqDenominator}` : 'Not available'}</strong> experiences, with a recorded distress score of <strong>{distressScoreDisplay !== 'Not available' ? distressScoreDisplay : 'Not available'}</strong>.
                  </p>
                  <p className="result-card-paragraph">
                    An endorsed item simply means you recognized experiencing that specific sensation (for example, hearing a faint noise when alone, seeing brief shadows, or feeling that your thoughts are unusually loud). Endorsing these items does not mean you have a psychiatric illness. Sensory changes and vivid thoughts frequently happen due to high stress, intense study or work pressure, severe sleep deprivation, sensory overload, physical fatigue, or significant life transitions.
                  </p>
                  <p className="result-card-paragraph">
                    This result offers a snapshot of how often these sensations have occurred recently and the degree of disruption or concern they cause in your everyday routine.
                  </p>
                </div>

                {/* 3. Actual Assessment Metrics */}
                <div className="stats-metric-grid">
                  <div className="metric-cell">
                    <span className="metric-label">Endorsed Items</span>
                    <strong className="metric-val" style={{ color: 'var(--color-primary)' }}>
                      {endorsedCountDisplay !== 'Not available' ? `${endorsedCountDisplay} / ${pqDenominator}` : 'Not available'}
                    </strong>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">Distress Score</span>
                    <strong className="metric-val">
                      {distressScoreDisplay !== 'Not available' ? distressScoreDisplay : 'Not available'}
                    </strong>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">Endorsement Rate</span>
                    <strong className="metric-val">
                      {maxScore > 0 ? `${Math.round((score / maxScore) * 100)}%` : '0%'}
                    </strong>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">Result Category</span>
                    <strong className="metric-val">
                      {category || 'Not available'}
                    </strong>
                  </div>
                </div>

                {/* Demographic Context */}
                {(ageGroup !== 'Not specified' || profession !== 'Not specified') && (
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-text-muted)',
                    padding: '0.55rem 0.9rem',
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)'
                  }}>
                    👤 Evaluation Context: Cohort <strong>{ageGroup}</strong> · Profession: <strong>{profession}</strong>
                  </div>
                )}

                {/* 4. How Your Score Was Calculated */}
                <div className="result-section-card">
                  <div className="result-section-card-header">
                    <div className="result-card-icon-badge">
                      <Calculator size={18} />
                    </div>
                    <h3 className="result-section-card-title">How Your Score Was Calculated</h3>
                  </div>
                  <p className="result-card-paragraph">
                    Your assessment score follows the validated clinical scoring rules for the {frameworkTool}:
                  </p>
                  <ul className="result-card-list">
                    <li>
                      <strong>1. Symptom Endorsement (0–{maxScore}):</strong> For each question where you responded "True", 1 symptom endorsement point was counted. Questions answered "False" received 0 points. You endorsed <strong>{score} of {maxScore}</strong> experiences.
                    </li>
                    <li>
                      <strong>2. Distress and Daily Life Impact Ratings:</strong> For each endorsed experience, two follow-up questions were answered on a 0 to 5 scale (Frequency and Daily Life Impact). The sum of these ratings across all endorsed items forms your recorded <strong>Distress Score</strong> ({distressScoreDisplay} points).
                    </li>
                    <li>
                      <strong>3. Clinical Screening Protocol:</strong> In standard clinical practice, symptom endorsement ({score} / {maxScore}) and distress levels ({distressScoreDisplay} points) are evaluated separately. {isSchizophrenia ? 'On the PQ-16, a threshold of 6 or more endorsed items indicates prodromal psychosis risk warranting formal clinical consultation.' : 'On the MDQ, endorsement of 7 or more co-occurring features with functional impact suggests value in formal clinical evaluation.'}
                    </li>
                    <li>
                      <strong>4. Category Classification:</strong> Your result category (<strong>{category}</strong>) reflects both the number of endorsed symptoms and your recorded distress level.
                    </li>
                  </ul>
                </div>

                {/* Concise Screening Disclaimer */}
                <div className="concise-disclaimer-card">
                  <Info size={18} className="disclaimer-icon" />
                  <p>
                    <strong>Screening Disclaimer:</strong> This tool is for educational self-reflection only, does not provide a diagnosis, and cannot replace a clinical evaluation by a qualified healthcare professional.
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* ── HEADING 2: RESPONSE BREAKDOWN ───────────────────────────────── */}
        <div className="accordion-card">
          <button 
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleSection(2)}
            aria-expanded={expandedSection === 2}
          >
            <div className="accordion-header-left">
              <div className="accordion-icon-box">
                <BarChart2 size={20} />
              </div>
              <span className="accordion-header-title">2. Response Breakdown</span>
            </div>
            <ChevronDown 
              size={20} 
              className={`accordion-chevron ${expandedSection === 2 ? 'rotated' : ''}`} 
            />
          </button>

          {expandedSection === 2 && (
            <div className="accordion-body-content">
              {userTotalQuestions === 0 || (questionsAnswered === 0 && answers.length === 0) ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No question responses available to break down.
                </p>
              ) : (
                <div className="response-breakdown-content">
                  
                  {/* 1. Response Overview Cards */}
                  <div>
                    <div className="stats-metric-grid">
                      <div className="metric-cell">
                        <span className="metric-label">Total Questions</span>
                        <strong className="metric-val">{userTotalQuestions}</strong>
                      </div>
                      <div className="metric-cell">
                        <span className="metric-label">True Responses</span>
                        <strong className="metric-val" style={{ color: 'var(--color-primary)' }}>{section2TrueCount}</strong>
                      </div>
                      <div className="metric-cell">
                        <span className="metric-label">False Responses</span>
                        <strong className="metric-val" style={{ color: '#64748B' }}>{section2FalseCount}</strong>
                      </div>
                      <div className="metric-cell">
                        <span className="metric-label">Follow-ups Rated</span>
                        <strong className="metric-val">{followUpsRatedCount}</strong>
                      </div>
                      <div className="metric-cell">
                        <span className="metric-label">Average Follow-up Rating</span>
                        <strong className="metric-val">
                          {avgFollowUp !== null ? (
                            <>{avgFollowUp} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ 5.0</span></>
                          ) : (
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Not available</span>
                          )}
                        </strong>
                      </div>
                      <div className="metric-cell">
                        <span className="metric-label">Symptom Endorsement Rate</span>
                        <strong className="metric-val" style={{ color: 'var(--color-primary)' }}>
                          {truePercent}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. Response Distribution (Donut Chart & Horizontal Stacked Bar) */}
                  <div className="chart-card-wrapper">
                    <div className="chart-card-header">
                      <h4 className="chart-card-title">
                        <PieChart size={18} style={{ color: 'var(--color-primary)' }} />
                        Response Distribution
                      </h4>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {questionsAnswered} of {userTotalQuestions} items recorded
                      </span>
                    </div>

                    <div className="donut-layout">
                      {/* SVG Donut Chart */}
                      <div className="donut-chart-container">
                        <svg width="130" height="130" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle
                            cx="60"
                            cy="60"
                            r={donutRadius}
                            fill="transparent"
                            stroke="#F1F5F9"
                            strokeWidth="14"
                          />
                          {section2TrueCount > 0 && (
                            <circle
                              cx="60"
                              cy="60"
                              r={donutRadius}
                              fill="transparent"
                              stroke="var(--color-primary)"
                              strokeWidth="14"
                              strokeDasharray={`${trueStroke} ${donutCircumference}`}
                              strokeDashoffset="0"
                            />
                          )}
                          {section2FalseCount > 0 && (
                            <circle
                              cx="60"
                              cy="60"
                              r={donutRadius}
                              fill="transparent"
                              stroke="#94A3B8"
                              strokeWidth="14"
                              strokeDasharray={`${falseStroke} ${donutCircumference}`}
                              strokeDashoffset={`${-trueStroke}`}
                            />
                          )}
                          {questionsUnanswered > 0 && (
                            <circle
                              cx="60"
                              cy="60"
                              r={donutRadius}
                              fill="transparent"
                              stroke="#E2E8F0"
                              strokeWidth="14"
                              strokeDasharray={`${unansweredStroke} ${donutCircumference}`}
                              strokeDashoffset={`${-(trueStroke + falseStroke)}`}
                            />
                          )}
                        </svg>
                        <div className="donut-center-text">
                          <div className="donut-center-number">{questionsAnswered}</div>
                          <div className="donut-center-label">Recorded</div>
                        </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="chart-legend-list">
                        <div className="chart-legend-item">
                          <div className="chart-legend-left">
                            <span className="legend-color-dot" style={{ background: 'var(--color-primary)' }} />
                            <span>True Responses</span>
                          </div>
                          <span className="legend-val-badge">
                            {section2TrueCount} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>({truePercent}%)</span>
                          </span>
                        </div>
                        <div className="chart-legend-item">
                          <div className="chart-legend-left">
                            <span className="legend-color-dot" style={{ background: '#94A3B8' }} />
                            <span>False Responses</span>
                          </div>
                          <span className="legend-val-badge">
                            {section2FalseCount} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>({falsePercent}%)</span>
                          </span>
                        </div>
                        {questionsUnanswered > 0 && (
                          <div className="chart-legend-item">
                            <div className="chart-legend-left">
                              <span className="legend-color-dot" style={{ background: '#E2E8F0' }} />
                              <span>Unanswered</span>
                            </div>
                            <span className="legend-val-badge">
                              {questionsUnanswered} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>({unansweredPercent}%)</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Horizontal Stacked Bar */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="horizontal-stacked-track">
                        {section2TrueCount > 0 && (
                          <div 
                            className="stacked-segment" 
                            style={{ width: `${truePercent}%`, background: 'var(--color-primary)' }} 
                            title={`True: ${section2TrueCount} (${truePercent}%)`}
                          />
                        )}
                        {section2FalseCount > 0 && (
                          <div 
                            className="stacked-segment" 
                            style={{ width: `${falsePercent}%`, background: '#94A3B8' }} 
                            title={`False: ${section2FalseCount} (${falsePercent}%)`}
                          />
                        )}
                        {questionsUnanswered > 0 && (
                          <div 
                            className="stacked-segment" 
                            style={{ width: `${unansweredPercent}%`, background: '#E2E8F0' }} 
                            title={`Unanswered: ${questionsUnanswered} (${unansweredPercent}%)`}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Follow-up Rating Distribution */}
                  <div className="chart-card-wrapper">
                    <div className="chart-card-header">
                      <h4 className="chart-card-title">
                        <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
                        Follow-up Rating Distribution
                      </h4>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {followUpsRatedCount} ratings recorded (scale: 0 to 5)
                      </span>
                    </div>

                    {followUpsRatedCount > 0 ? (
                      <div className="rating-barchart-grid">
                        {ratingDistribution.map(item => {
                          const fillPercent = maxRatingCount > 0 ? (item.count / maxRatingCount) * 100 : 0;
                          return (
                            <div key={`rating-bar-${item.rating}`} className="rating-barchart-col">
                              <span className="rating-col-count">{item.count}</span>
                              <div className="rating-bar-track">
                                <div 
                                  className="rating-bar-fill" 
                                  style={{ height: item.count > 0 ? `${Math.max(12, fillPercent)}%` : '0%' }} 
                                />
                              </div>
                              <span className="rating-col-label">Rating {item.rating}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '1.25rem', 
                        background: 'var(--color-bg)', 
                        borderRadius: 'var(--radius-md)', 
                        textAlign: 'center', 
                        color: 'var(--color-text-muted)',
                        fontSize: '0.88rem' 
                      }}>
                        No follow-up distress ratings recorded (no items were endorsed as "True").
                      </div>
                    )}
                  </div>

                  {/* 4. Completion Status */}
                  <div className="chart-card-wrapper">
                    <div className="chart-card-header">
                      <h4 className="chart-card-title">
                        <CheckCircle2 size={18} style={{ color: '#166534' }} />
                        Completion Status
                      </h4>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {isSchizophrenia ? 'PQ-16 Standard Protocol' : 'MDQ Assessment Protocol'}
                      </span>
                    </div>

                    <div className="completion-status-grid">
                      <div className="completion-metric-box">
                        <div className="completion-metric-num" style={{ color: 'var(--color-primary)' }}>
                          {questionsAnswered} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {userTotalQuestions}</span>
                        </div>
                        <div className="completion-metric-label">Questions Answered</div>
                      </div>

                      <div className="completion-metric-box">
                        <div className="completion-metric-num" style={{ color: questionsUnanswered > 0 ? '#E11D48' : '#166534' }}>
                          {questionsUnanswered}
                        </div>
                        <div className="completion-metric-label">Questions Unanswered</div>
                      </div>

                      <div className="completion-metric-box">
                        <div className="completion-metric-num" style={{ color: 'var(--color-text)' }}>
                          {expectedFollowUpsCount > 0 ? `${followUpsRatedCount} / ${expectedFollowUpsCount}` : '0 / 0'}
                        </div>
                        <div className="completion-metric-label">
                          {expectedFollowUpsCount > 0 ? 'Follow-up Ratings Completed' : 'Follow-ups (None Required)'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Quick Response Details (Compact Expandable List) */}
                  <div className="chart-card-wrapper" style={{ padding: '0.75rem 1rem' }}>
                    <button 
                      type="button" 
                      className="quick-details-toggle-btn"
                      onClick={() => setShowQuickDetails(prev => !prev)}
                      aria-expanded={showQuickDetails}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ListChecks size={18} />
                        Quick Response Details ({questionsAnswered} of {userTotalQuestions} items)
                      </span>
                      {showQuickDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {showQuickDetails && (
                      <div className="quick-details-grid">
                        {answers.map((ans, idx) => {
                          const isAnswered = ans && (ans.answer === 'True' || ans.answer === 'False');
                          const isTrue = ans?.answer === 'True';
                          const hasRatings = isTrue && (typeof ans.followUp1 === 'number' || typeof ans.followUp2 === 'number');

                          return (
                            <div key={`quick-ans-${ans.id || idx}`} className="quick-detail-card">
                              <div className="quick-detail-left">
                                <span className="quick-q-num">Q{idx + 1}</span>
                                {isAnswered ? (
                                  <span className={isTrue ? 'badge-true' : 'badge-false'} style={{ fontSize: '0.76rem', padding: '0.15rem 0.5rem' }}>
                                    {isTrue ? 'True' : 'False'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                    Unanswered
                                  </span>
                                )}
                              </div>
                              {hasRatings && (
                                <span className="quick-ratings-pill">
                                  F:{ans.followUp1}/5 · I:{ans.followUp2}/5
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* ── HEADING 3: DOMAIN-WISE RESPONSE SUMMARY ────────────────────── */}
        <div className="accordion-card">
          <button 
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleSection(3)}
            aria-expanded={expandedSection === 3}
          >
            <div className="accordion-header-left">
              <div className="accordion-icon-box">
                <Layers size={20} />
              </div>
              <span className="accordion-header-title">3. Domain-wise Response Summary</span>
            </div>
            <ChevronDown 
              size={20} 
              className={`accordion-chevron ${expandedSection === 3 ? 'rotated' : ''}`} 
            />
          </button>

          {expandedSection === 3 && (
            <div className="accordion-body-content">
              {answers.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No domain records available.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {answers.map((item, idx) => {
                    const isTrue = item.answer === 'True';
                    const domainName = item.domain || `Symptom Dimension ${idx + 1}`;
                    const hasRatings = isTrue && (item.followUp1 !== null || item.followUp2 !== null);
                    const avgRating = hasRatings 
                      ? (((item.followUp1 ?? 0) + (item.followUp2 ?? 0)) / 2).toFixed(1)
                      : null;

                    return (
                      <div key={`domain-${item.id || idx}`} className="domain-summary-row">
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.93rem', color: 'var(--color-text)' }}>
                              {domainName}
                            </span>
                            <span className={isTrue ? 'badge-true' : 'badge-false'} style={{ fontSize: '0.76rem', padding: '0.15rem 0.55rem' }}>
                              {isTrue ? 'True' : 'False'}
                            </span>
                          </div>

                          {/* Mini rating progress bar if True */}
                          {isTrue && avgRating !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
                              <div className="quiz-progress-track" style={{ flex: 1, height: '5px', margin: 0 }}>
                                <div 
                                  className="quiz-progress-fill" 
                                  style={{ width: `${(avgRating / 5) * 100}%` }} 
                                />
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                Freq: {item.followUp1 ?? 0}/5 · Impact: {item.followUp2 ?? 0}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── HEADING 4: FOLLOW-UP INSIGHTS ───────────────────────────────── */}
        <div className="accordion-card">
          <button 
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleSection(4)}
            aria-expanded={expandedSection === 4}
          >
            <div className="accordion-header-left">
              <div className="accordion-icon-box">
                <Sparkles size={20} />
              </div>
              <span className="accordion-header-title">4. Follow-up Insights</span>
            </div>
            <ChevronDown 
              size={20} 
              className={`accordion-chevron ${expandedSection === 4 ? 'rotated' : ''}`} 
            />
          </button>

          {expandedSection === 4 && (
            <div className="accordion-body-content">
              {trueCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--color-text-muted)' }}>
                  <CheckCircle2 size={32} color="var(--color-success)" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                    No Follow-up Questions Triggered
                  </p>
                  <p style={{ fontSize: '0.9rem' }}>
                    No symptoms were endorsed as True during this assessment, so no follow-up intensity ratings were collected.
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                    Follow-up ratings reflect your self-reported frequency and daily life impact on a standardized 0 to 5 scale.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {trueAnswers.map((item, idx) => (
                      <div key={`fu-${item.id || idx}`} style={{
                        padding: '1rem 1.15rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary-tint)',
                        border: '1px solid var(--color-border)'
                      }}>
                        <p style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text)', marginBottom: '0.65rem' }}>
                          "{item.text}"
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Frequency: </span>
                            <strong style={{ color: 'var(--color-primary)' }}>{item.followUp1 ?? 0} / 5</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Daily Life Impact: </span>
                            <strong style={{ color: 'var(--color-primary)' }}>{item.followUp2 ?? 0} / 5</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {higherRatingsList.length > 0 && (
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      color: '#92400E',
                      fontSize: '0.88rem',
                      lineHeight: 1.6
                    }}>
                      <strong>Observation:</strong> You indicated moderate-to-higher intensity (rating &ge; 3) in {higherRatingsList.length} area(s). These specific experiences appear to carry higher personal notice in your daily routine.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── HEADING 5: PERSONALIZED WELL-BEING RECOMMENDATIONS ─────────── */}
        <div className="accordion-card">
          <button 
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleSection(5)}
            aria-expanded={expandedSection === 5}
          >
            <div className="accordion-header-left">
              <div className="accordion-icon-box">
                <Heart size={20} />
              </div>
              <span className="accordion-header-title">5. Personalized Well-being Recommendations</span>
            </div>
            <ChevronDown 
              size={20} 
              className={`accordion-chevron ${expandedSection === 5 ? 'rotated' : ''}`} 
            />
          </button>

          {expandedSection === 5 && (
            <div className="accordion-body-content">
              {/* Higher score guidance notice */}
              {(category === 'Elevated' || category === 'Moderate') && (
                <div style={{
                  padding: '1.15rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-light)',
                  border: '1px solid rgba(117, 96, 217, 0.3)',
                  color: 'var(--color-text)',
                  marginBottom: '1.5rem',
                  lineHeight: 1.65,
                  fontSize: '0.92rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <ShieldAlert size={20} color="var(--color-primary)" />
                    <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>
                      Clinical Consultation Advisory ({category} Score):
                    </strong>
                  </div>
                  {isBipolar ? (
                    <p style={{ margin: 0 }}>
                      Your responses indicate notable mood elevation, sleep reduction, or impulsive features on the MDQ. While lifestyle stabilization supports well-being, <strong>self-care practices are not a treatment for bipolar spectrum conditions</strong>. We strongly encourage scheduling an evaluation with a psychiatrist or licensed clinical psychologist to review mood history and discuss medical or psychotherapeutic options.
                    </p>
                  ) : (
                    <p style={{ margin: 0 }}>
                      Your responses reflect sensory variations or unusual cognitive impressions on the PQ-16. While mindfulness and grounding foster emotional resilience, <strong>wellness exercises do not treat schizophrenia or clinical psychosis risk</strong>. We strongly recommend discussing these observations with a qualified psychiatrist or clinical psychologist specializing in early assessment.
                    </p>
                  )}
                  <div style={{ marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => {
                        const el = document.getElementById('gps-healthcare-priority-card') || document.getElementById('accordion-gps-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        setExpandedSection(7);
                      }}
                    >
                      <MapPin size={15} />
                      <span>Locate Nearest Hospitals & Psychiatrists via GPS</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Matching Summary Bar */}
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary-tint)',
                border: '1px solid var(--color-border)',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <Target size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <span>
                  Recommendations below have been <strong>dynamically tailored</strong> to your specific {testName} responses ({trueCount} endorsed criteria, {category} category).
                </span>
              </div>

              <div className="recommendations-grid">
                
                {/* ── CARD 1: SLEEP & CIRCADIAN PROTOCOL (Dynamic) ── */}
                <div className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="rec-card-icon">
                      <Moon size={20} />
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: hasSleepIssue ? '#FEF3C7' : '#FFFFFF',
                      color: hasSleepIssue ? '#92400E' : 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {hasSleepIssue ? '⚡ Matched to Your Sleep Responses' : '🌙 Circadian Hygiene'}
                    </span>
                  </div>

                  <h5 className="rec-card-title">
                    {isBipolar
                      ? (hasSleepIssue ? 'Circadian Stabilization & Dark Therapy' : 'Bipolar Circadian Sleep Routine')
                      : (hasSleepIssue ? 'Sensory De-escalation & Sleep Anchoring' : 'Consistent Circadian Sleep Schedule')}
                  </h5>

                  <p className="rec-card-text">
                    {isBipolar ? (
                      hasSleepIssue 
                        ? 'You reported going for days with little sleep yet feeling energized. In bipolar spectrum conditions, sleep reduction is a primary trigger for manic escalation. Enforcing circadian dark cues stabilizes brain rhythms.'
                        : 'Maintaining consistent bed and wake times buffers mood stability and prevents circadian-induced mood cycling.'
                    ) : (
                      hasSleepIssue
                        ? 'Because you reported sleep variations, evening sensory dimming reduces nighttime cognitive fatigue and perceptual vulnerability.'
                        : 'Consistent circadian sleep cycles buffer cognitive resilience and sensory processing thresholds.'
                    )}
                  </p>

                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleGuide('sleep')}
                    id="btn-rec-sleep"
                  >
                    {openGuides['sleep'] ? 'Hide Sleep Guide' : (hasSleepIssue ? 'Open Targeted Sleep Protocol' : 'Open Sleep Tips')}
                  </button>

                  {openGuides['sleep'] && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      border: '1px solid var(--color-border)'
                    }}>
                      {isBipolar ? (
                        <>
                          • <strong>Dark Therapy:</strong> Dim all room lights 2 hours before bed; blue-light blocking glasses are recommended.<br />
                          • <strong>Rest in Bed:</strong> Even if unable to sleep, rest quietly in a dark room with eyes closed to protect circadian melatonin cycles.<br />
                          • <strong>Fixed Wake Time:</strong> Wake at the exact same hour every morning, regardless of sleep duration.
                        </>
                      ) : (
                        <>
                          • <strong>Sensory Wind-Down:</strong> Eliminate screen audio/video 45 minutes before sleep; switch to soft ambient warmth.<br />
                          • <strong>Consistent Wake Anchor:</strong> Wake at a fixed hour to anchor neurotransmitter balance.<br />
                          • <strong>Cool, Quiet Sanctuary:</strong> Keep the bedroom dark and temperature at 18–20°C (65–68°F).
                        </>
                      )}
                    </div>
                  )}

                  {renderRecFeedbackBar('sleep', isBipolar ? 'Circadian Stabilization & Dark Therapy' : 'Circadian Sleep Schedule', 'Circadian Rhythm')}
                </div>

                {/* ── CARD 2: COGNITIVE DECELERATION OR SENSORY GROUNDING (Dynamic) ── */}
                <div className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="rec-card-icon">
                      {isBipolar ? <Zap size={20} /> : <Compass size={20} />}
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: (hasRacingThoughts || hasPerceptualSensory) ? '#FEF3C7' : '#FFFFFF',
                      color: (hasRacingThoughts || hasPerceptualSensory) ? '#92400E' : 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {isBipolar 
                        ? (hasRacingThoughts ? '⚡ Matched to Racing Thoughts' : '🧠 Cognitive Clarity')
                        : (hasPerceptualSensory ? '🌿 Matched to Sensory Responses' : '🧘 Grounding Habit')}
                    </span>
                  </div>

                  <h5 className="rec-card-title">
                    {isBipolar 
                      ? (hasRacingThoughts ? 'Cognitive Deceleration & Pacing' : 'Mindful Mental Pacing')
                      : (hasPerceptualSensory ? '5-4-3-2-1 Sensory Grounding' : '5-Minute Mindful Centering')}
                  </h5>

                  <p className="rec-card-text">
                    {isBipolar ? (
                      hasRacingThoughts
                        ? 'You endorsed thoughts racing faster than you could track and rapid speech. Deliberate cognitive deceleration techniques bring mental momentum back to baseline.'
                        : 'Structured thought pauses prevent mental over-stimulation and help sustain focus on single tasks.'
                    ) : (
                      hasPerceptualSensory
                        ? 'You noted heightened sensory sensitivity or unusual perceptual experiences. Sensory grounding anchors attention to concrete, verifiable physical reality.'
                        : 'A brief mindfulness exercise to anchor attention to physical sensations without judgment.'
                    )}
                  </p>

                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleGuide('grounding')}
                    id="btn-rec-grounding"
                  >
                    {openGuides['grounding'] ? 'Hide Technique' : (hasRacingThoughts || hasPerceptualSensory ? 'Open Targeted Technique' : 'Open Steps')}
                  </button>

                  {openGuides['grounding'] && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      border: '1px solid var(--color-border)'
                    }}>
                      {isBipolar ? (
                        <>
                          1. <strong>Speech Pacing:</strong> Deliberately introduce a 2-second pause before answering questions in conversation.<br />
                          2. <strong>Brain-Dump:</strong> Write rapid thoughts on a single sheet of paper for 5 minutes, then put the paper away.<br />
                          3. <strong>Single-Tab Rule:</strong> Keep only one task open on your phone or computer to counter rapid multitasking.
                        </>
                      ) : (
                        <>
                          1. <strong>5 things you can see:</strong> Name 5 distinct objects in your immediate room.<br />
                          2. <strong>4 things you can touch:</strong> Feel the texture of your shirt, the table, or your chair.<br />
                          3. <strong>3 things you can hear:</strong> Notice verifiable room sounds (e.g., fan, clock, distant traffic).<br />
                          4. <strong>2 things you can smell/taste:</strong> Savor a sip of cool water.<br />
                          5. <strong>1 slow breath:</strong> Inhale gently and acknowledge: "I am physically grounded in this room right now."
                        </>
                      )}
                    </div>
                  )}

                  {renderRecFeedbackBar('grounding', isBipolar ? 'Cognitive Deceleration & Pacing' : '5-4-3-2-1 Sensory Grounding', 'Grounding')}
                </div>

                {/* ── CARD 3: BEHAVIORAL SAFEGUARDS OR REALITY TESTING (Dynamic) ── */}
                <div className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="rec-card-icon">
                      {isBipolar ? <Clock size={20} /> : <Activity size={20} />}
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: (hasHighEnergyImpulse || hasIdeationalBeliefs) ? '#FEF3C7' : '#FFFFFF',
                      color: (hasHighEnergyImpulse || hasIdeationalBeliefs) ? '#92400E' : 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {isBipolar 
                        ? (hasHighEnergyImpulse ? '⚡ Matched to Energy & Impulsivity' : '💡 Decision Guardrails')
                        : (hasIdeationalBeliefs ? '💡 Matched to Ideational Beliefs' : '🏃 Physical Vitality')}
                    </span>
                  </div>

                  <h5 className="rec-card-title">
                    {isBipolar 
                      ? (hasHighEnergyImpulse ? 'The 48-Hour Decision Rule' : 'Structured Daily Scheduling')
                      : (hasIdeationalBeliefs ? 'Cognitive Flexibility & Peer Check-In' : 'Gentle Outdoor Walking Routine')}
                  </h5>

                  <p className="rec-card-text">
                    {isBipolar ? (
                      hasHighEnergyImpulse
                        ? 'You reported feeling unusually energetic, invincible, or spending money impulsively. Implementing structured behavioral guardrails prevents downstream complications during elevated periods.'
                        : 'Establishing structured daily routines keeps energy surges channeled constructively.'
                    ) : (
                      hasIdeationalBeliefs
                        ? 'You endorsed experiences where thoughts or events felt imbued with special meaning or external forces. Gentle curiosity and checking in with trusted peers helps maintain grounded perspectives.'
                        : 'A 20-minute daily rhythmic walk outdoors provides somatic grounding and balances nervous system tone.'
                    )}
                  </p>

                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleGuide('behavioral')}
                    id="btn-rec-behavioral"
                  >
                    {openGuides['behavioral'] ? 'Hide Guidance' : 'Open Protocol'}
                  </button>

                  {openGuides['behavioral'] && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      border: '1px solid var(--color-border)'
                    }}>
                      {isBipolar ? (
                        <>
                          • <strong>The 48-Hour Rule:</strong> When inspired to start a major project, make a big purchase, or send an intense message, write it down and wait 48 hours before acting.<br />
                          • <strong>Accountability Partner:</strong> Designate a trusted friend or family member to review major financial or career decisions.<br />
                          • <strong>Card Limits:</strong> Temporarily keep credit limits low during periods of heightened energy.
                        </>
                      ) : (
                        <>
                          • <strong>Gentle Verification:</strong> If a coincidence or thought feels charged with hidden meaning, ask a trusted friend: "Did you notice that too, or does it seem like coincidence?"<br />
                          • <strong>Stress Correlation:</strong> Notice whether unusual impressions increase after lack of sleep or heightened stress.<br />
                          • <strong>Physical Movement:</strong> Take a 15–20 minute gentle walk in open natural light to reset sensory processing.
                        </>
                      )}
                    </div>
                  )}

                  {renderRecFeedbackBar('behavioral', isBipolar ? 'The 48-Hour Decision Rule' : 'Cognitive Flexibility & Peer Check-In', 'Behavioral')}
                </div>

                {/* ── CARD 4: AUTONOMIC NERVOUS SYSTEM BREATHING ── */}
                <div className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="rec-card-icon">
                      <Wind size={20} />
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      💨 Vagal Regulation
                    </span>
                  </div>

                  <h5 className="rec-card-title">Guided 4-7-8 Breathing Pacing</h5>
                  <p className="rec-card-text">
                    A calm pacing technique to center the autonomic nervous system, activate the parasympathetic vagal brake, and reduce acute tension.
                  </p>

                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleGuide('breathing')}
                    id="btn-rec-breathing"
                  >
                    {openGuides['breathing'] ? 'Hide Breathing Guide' : 'Open Breathing Guide'}
                  </button>

                  {openGuides['breathing'] && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      border: '1px solid var(--color-border)'
                    }}>
                      1. Inhale quietly through your nose for <strong>4 seconds</strong>.<br />
                      2. Hold your breath gently for <strong>7 seconds</strong>.<br />
                      3. Exhale completely through your mouth for <strong>8 seconds</strong> with a gentle 'whoosh'.<br />
                      Repeat 4 slow cycles morning and evening.
                    </div>
                  )}

                  {renderRecFeedbackBar('breathing', 'Guided 4-7-8 Breathing Pacing', 'Vagal Regulation')}
                </div>

                {/* ── CARD 5: REFLECTIVE JOURNALING (Dynamic to Test) ── */}
                <div className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="rec-card-icon">
                      <BookOpen size={20} />
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      📝 Functional Journal
                    </span>
                  </div>

                  <h5 className="rec-card-title">
                    {isBipolar ? 'Mood & Energy Spectrum Journal' : 'Perceptual Clarity & Trigger Journal'}
                  </h5>
                  <p className="rec-card-text">
                    {isBipolar 
                      ? 'Tracking daily sleep hours, energy shifts, and irritability patterns allows you to identify hypomanic shifts days before they escalate.'
                      : 'Logging daily thoughts, sensory impressions, and stress triggers helps identify environmental patterns that heighten perceptual variations.'}
                  </p>

                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => onNavigate('journal')}
                    id="btn-rec-journal"
                  >
                    Go to My MindWave Journal
                  </button>
                </div>

                {/* ── CARD 6: CLINICAL RESOURCES & HELPLINES ── */}
                <div className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="rec-card-icon">
                      <Info size={20} />
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      📚 Verified Resources
                    </span>
                  </div>

                  <h5 className="rec-card-title">Psychoeducation & Professional Care</h5>
                  <p className="rec-card-text">
                    Access verified clinical guidelines from NIMH, WHO, and national confidential mental health support helplines.
                  </p>

                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleGuide('edu')}
                    id="btn-rec-edu"
                  >
                    {openGuides['edu'] ? 'Hide Resources' : 'View Verified Resources'}
                  </button>

                  {openGuides['edu'] && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      border: '1px solid var(--color-border)'
                    }}>
                      • <strong>NIMH Psychoeducation:</strong> Comprehensive guides on {isBipolar ? 'Bipolar Spectrum Disorders' : 'Early Psychosis Risk (Prodrome)'}.<br />
                      • <strong>Tele-MANAS:</strong> Call <strong>14416</strong> (24/7 Government of India National Mental Health Helpline).<br />
                      • <strong>KIRAN:</strong> Call <strong>1800-599-0019</strong> for confidential mental health rehabilitation.<br />
                      • <strong>Important Notice:</strong> Self-care fosters general resilience but does not treat {isBipolar ? 'bipolar disorder' : 'schizophrenia'}.
                    </div>
                  )}
                </div>

              </div>

              {/* National Helplines */}
              <div style={{
                marginTop: '1.5rem',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <PhoneCall size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Support Helplines: Tele-MANAS (14416) · KIRAN (1800-599-0019)</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>24/7 Confidential Mental Health Support</span>
              </div>
            </div>
          )}
        </div>

        {/* ── HEADING 6: DETAILED RESPONSES (Navigates to Detailed Page) ───── */}
        <div className="accordion-card">
          <button 
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleSection(6)}
            aria-expanded={expandedSection === 6}
          >
            <div className="accordion-header-left">
              <div className="accordion-icon-box">
                <ListChecks size={20} />
              </div>
              <span className="accordion-header-title">6. Detailed Responses</span>
            </div>
            <ChevronDown 
              size={20} 
              className={`accordion-chevron ${expandedSection === 6 ? 'rotated' : ''}`} 
            />
          </button>

          {expandedSection === 6 && (
            <div className="accordion-body-content" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <FileText size={36} color="var(--color-primary)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                Full Response Breakdown Table
              </h4>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                Inspect each questionnaire question alongside your True/False response and specific follow-up severity ratings.
              </p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => onNavigate('detailed-responses')}
                id="btn-accordion-view-detailed"
              >
                <span>Open Detailed Responses Table</span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>

        {/* ── HEADING 7: NEARBY HOSPITALS & GOOD PSYCHIATRISTS (Only shown if risk score is above 30 for 34) ───── */}
        {isHighRisk && (
          <div className="accordion-card" id="accordion-gps-section">
            <button 
              type="button"
              className="accordion-header-btn"
              onClick={() => toggleSection(7)}
              aria-expanded={expandedSection === 7}
            >
              <div className="accordion-header-left">
                <div className="accordion-icon-box" style={{ 
                  background: '#FEE2E2', 
                  color: '#DC2626' 
                }}>
                  <MapPin size={20} />
                </div>
                <span className="accordion-header-title">
                  7. Nearby Hospitals & Good Psychiatrists (GPS Radar)
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: '#FEE2E2',
                  color: '#DC2626',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid #FECDD3'
                }}>
                  Urgent Care Available
                </span>
              </div>
              <ChevronDown 
                size={20} 
                className={`accordion-chevron ${expandedSection === 7 ? 'rotated' : ''}`} 
              />
            </button>

            {expandedSection === 7 && (
              <div className="accordion-body-content" style={{ padding: '1.25rem 0.5rem' }}>
                <GpsHealthcareMap
                  riskLevel={category}
                  score={score}
                  maxScore={maxScore}
                  testName={testName}
                  autoLocate={true}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. BOTTOM ACTION BUTTONS ───────────────────────────────────────── */}
      <div className="result-bottom-actions-grid">
        <button 
          type="button" 
          className="btn btn-outline"
          onClick={handleRetake}
          id="btn-retake-screening"
        >
          <RotateCcw size={16} />
          <span>Retake Screening</span>
        </button>

        <button 
          type="button" 
          className="btn btn-outline"
          onClick={handlePrint}
          id="btn-download-report"
        >
          <Download size={16} />
          <span>Download Report</span>
        </button>

        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => onNavigate('detailed-responses')}
          id="btn-bottom-view-responses"
        >
          <FileText size={16} />
          <span>View Detailed Responses</span>
        </button>

        <button 
          type="button" 
          className="btn btn-outline"
          onClick={() => onNavigate('find-care')}
          id="btn-bottom-find-care"
          title="Open GPS Healthcare & Psychiatrist Locator"
        >
          <MapPin size={16} />
          <span>Nearby Care (GPS)</span>
        </button>

        <button 
          type="button" 
          className="btn btn-outline"
          onClick={() => onNavigate('dashboard')}
          id="btn-bottom-to-dashboard"
        >
          <LayoutDashboard size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
