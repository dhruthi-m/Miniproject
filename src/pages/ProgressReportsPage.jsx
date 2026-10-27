import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  TrendingUp, 
  Clock, 
  Layers, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Activity, 
  ThumbsUp, 
  Meh, 
  ThumbsDown, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Info, 
  ShieldAlert,
  ArrowRight,
  Minus,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { useScreening } from '../context/ScreeningContext';
import { 
  computeDomainScores, 
  calculateLongitudinalComparison, 
  generatePersonalizedInsights 
} from '../utils/progressAnalytics';

export default function ProgressReportsPage({ onNavigate }) {
  const { 
    history, 
    loadingHistory, 
    recommendationFeedback, 
    submitRecommendationFeedback, 
    startTest 
  } = useScreening();

  // Active Hub Tab: 'trends' | 'history' | 'recommendations' | 'insights'
  const [activeTab, setActiveTab] = useState('trends');
  // History Filter: 'all' | 'schizophrenia' | 'bipolar'
  const [filterType, setFilterType] = useState('all');
  // Expanded assessment card index for detail view
  const [expandedCardId, setExpandedCardId] = useState(null);
  // Feedback comment modal or state for recommendations
  const [feedbackNotes, setFeedbackNotes] = useState({});
  // Comparison session selection (defaults to index 0: latest, index 1: previous)
  const [compareIdx1, setCompareIdx1] = useState(0);
  const [compareIdx2, setCompareIdx2] = useState(1);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (filterType === 'all') return history;
    return history.filter(h => h.assessment_type === filterType);
  }, [history, filterType]);

  // Chronologically ascending history for trend charts
  const chronologicalHistory = useMemo(() => {
    return [...filteredHistory].reverse();
  }, [filteredHistory]);

  // Chart data for score and distress trajectory
  const scoreTrendData = useMemo(() => {
    return chronologicalHistory.map((item, idx) => ({
      sessionName: `#${idx + 1} (${item.date || 'Session'})`,
      date: item.date || `Session ${idx + 1}`,
      score: item.score ?? item.symptom_count ?? 0,
      maxScore: item.max_score || (item.assessment_type === 'bipolar' ? 15 : 16),
      distress: item.distress_score || 0,
      category: item.result_category || 'Assessed',
      type: item.assessment_type === 'bipolar' ? 'MDQ' : 'PQ-16'
    }));
  }, [chronologicalHistory]);

  // Domain progression chart data
  const domainComparisonData = useMemo(() => {
    if (chronologicalHistory.length === 0) return [];
    const latestRec = chronologicalHistory[chronologicalHistory.length - 1];
    const prevRec = chronologicalHistory.length > 1 ? chronologicalHistory[chronologicalHistory.length - 2] : null;

    const domainsLatest = Array.isArray(latestRec.domain_scores)
      ? latestRec.domain_scores
      : computeDomainScores(latestRec.answers || [], latestRec.assessment_type);

    const domainsPrev = prevRec
      ? (Array.isArray(prevRec.domain_scores) ? prevRec.domain_scores : computeDomainScores(prevRec.answers || [], prevRec.assessment_type))
      : [];

    return domainsLatest.map(d => {
      const matchPrev = domainsPrev.find(p => p.name === d.name);
      return {
        domain: d.name.length > 20 ? d.name.substring(0, 18) + '…' : d.name,
        fullDomain: d.name,
        latestEndorsed: d.endorsed,
        previousEndorsed: matchPrev ? matchPrev.endorsed : 0,
        total: d.total
      };
    });
  }, [chronologicalHistory]);

  // Longitudinal comparison pair
  const activeComparison = useMemo(() => {
    if (filteredHistory.length < 2) return null;
    const sessionLater = filteredHistory[compareIdx1] || filteredHistory[0];
    const sessionEarlier = filteredHistory[compareIdx2] || filteredHistory[1];
    if (!sessionLater || !sessionEarlier) return null;
    return calculateLongitudinalComparison(sessionEarlier, sessionLater);
  }, [filteredHistory, compareIdx1, compareIdx2]);

  // Personalized insights
  const personalizedInsights = useMemo(() => {
    const fbList = Object.entries(recommendationFeedback).map(([k, r]) => ({ recommendation_key: k, rating: r }));
    return generatePersonalizedInsights(history, fbList);
  }, [history, recommendationFeedback]);

  // Handle recommendation feedback submit
  const handleRatingClick = (recKey, title, category, rating) => {
    const text = feedbackNotes[recKey] || '';
    submitRecommendationFeedback({
      recommendationKey: recKey,
      recommendationTitle: title,
      category,
      rating,
      feedbackText: text
    });
  };

  const handlePrintSession = (record) => {
    window.print();
  };

  return (
    <div className="progress-page-wrap" style={{ maxWidth: '1060px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <TrendingUp size={26} color="var(--color-primary)" />
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.8rem' }}>
              Diagnosis History & Progress Tracking
            </h1>
          </div>
          <p className="page-description" style={{ margin: 0 }}>
            Review past screening assessments, track symptom shifts longitudinally, and record recommendation effectiveness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => onNavigate('dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => onNavigate('screening-select')}
          >
            <span>Take New Screening</span>
          </button>
        </div>
      </header>

      {/* ── CLINICAL NOTICE BANNER ───────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(117,96,217,0.06), rgba(99,102,241,0.03))',
        border: '1px solid rgba(117,96,217,0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.86rem',
        lineHeight: 1.55,
        color: 'var(--color-text)'
      }}>
        <Info size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Clinical Note:</strong> MindWave is a psychological screening and reflection platform, not a substitute for clinical diagnosis. Score differences over time reflect variations in self-reported symptom endorsement rather than confirmed clinical changes.
        </span>
      </div>

      {/* ── MAIN TAB NAVIGATION ──────────────────────────────────────────── */}
      <nav 
        role="tablist" 
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'trends'}
          onClick={() => setActiveTab('trends')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'trends' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'trends' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'trends' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Activity size={18} />
          <span>Longitudinal Trends & Charts</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'history' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'history' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={18} />
          <span>Assessment History ({history.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recommendations'}
          onClick={() => setActiveTab('recommendations')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'recommendations' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'recommendations' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'recommendations' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Heart size={18} />
          <span>Recommendation Effectiveness</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'insights' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'insights' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'insights' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={18} />
          <span>Personalized Insights</span>
        </button>
      </nav>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      {loadingHistory ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading assessment history...</p>
        </div>
      ) : history.length === 0 ? (
        /* Zero Assessment Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
          <FileText size={54} color="var(--color-primary)" style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            No Assessment History Recorded Yet
          </h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
            Complete your first screening test to view interactive score trends, track symptom response changes over time, and evaluate recommendation effectiveness.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                startTest('schizophrenia');
                onNavigate('screening-setup');
              }}
            >
              Start Schizophrenia Screening (PQ-16)
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => {
                startTest('bipolar');
                onNavigate('screening-setup');
              }}
            >
              Start Bipolar Screening (MDQ)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: LONGITUDINAL TRENDS & INTERACTIVE COMPARISONS               */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'trends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* 1. Score Trajectory Timeline Chart */}
              <div className="card" style={{ padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                      Symptom Endorsement Trajectory Over Time
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                      Tracks the number of endorsed experiences and distress scores across completed assessment sessions.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Filter:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: '#FFFFFF',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}
                    >
                      <option value="all">All Assessments ({history.length})</option>
                      <option value="schizophrenia">PQ-16 Schizophrenia</option>
                      <option value="bipolar">MDQ Bipolar</option>
                    </select>
                  </div>
                </div>

                <div style={{ width: '100%', height: 280, marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} domain={[0, 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#FFFFFF', 
                          borderRadius: '8px', 
                          border: '1px solid #CBD5E1', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Endorsed Symptoms" 
                        stroke="var(--color-primary)" 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: 'var(--color-primary)' }} 
                        activeDot={{ r: 7 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="distress" 
                        name="Distress Points" 
                        stroke="#F59E0B" 
                        strokeWidth={2} 
                        strokeDasharray="4 4" 
                        dot={{ r: 4, fill: '#F59E0B' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Side-by-Side Current vs Previous Assessment Comparison */}
              {activeComparison ? (
                <div className="card" style={{ padding: '1.5rem 1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                        Longitudinal Session Comparison
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                        Direct comparison between two assessment sessions separated by {activeComparison.daysElapsed} day(s).
                      </p>
                    </div>

                    {/* Session Selector Dropdowns */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Compare:</label>
                      <select
                        value={compareIdx2}
                        onChange={(e) => setCompareIdx2(Number(e.target.value))}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}
                      >
                        {filteredHistory.map((h, i) => (
                          <option key={`earlier-${i}`} value={i} disabled={i === compareIdx1}>
                            {h.date} ({h.score} pts)
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>vs</span>
                      <select
                        value={compareIdx1}
                        onChange={(e) => setCompareIdx1(Number(e.target.value))}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}
                      >
                        {filteredHistory.map((h, i) => (
                          <option key={`later-${i}`} value={i} disabled={i === compareIdx2}>
                            {h.date} ({h.score} pts - {i === 0 ? 'Latest' : `Session ${filteredHistory.length - i}`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Summary Comparison Metric Blocks */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    {/* Earlier Session Box */}
                    <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Session 1 ({activeComparison.earlier.date})
                      </span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.2rem' }}>
                        {activeComparison.earlier.score} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {activeComparison.earlier.maxScore}</span>
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        Category: {activeComparison.earlier.category}
                      </span>
                    </div>

                    {/* Later Session Box */}
                    <div style={{ padding: '1rem', background: 'var(--color-primary-tint)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Session 2 ({activeComparison.later.date})
                      </span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                        {activeComparison.later.score} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {activeComparison.later.maxScore}</span>
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        Category: {activeComparison.later.category}
                      </span>
                    </div>

                    {/* Delta Metric Box */}
                    <div style={{ 
                      padding: '1rem', 
                      background: activeComparison.deltaScore < 0 ? '#DCFCE7' : (activeComparison.deltaScore > 0 ? '#FEF3C7' : '#F1F5F9'), 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--color-border)' 
                    }}>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        color: activeComparison.deltaScore < 0 ? '#166534' : (activeComparison.deltaScore > 0 ? '#92400E' : '#475569'), 
                        textTransform: 'uppercase', 
                        fontWeight: 600 
                      }}>
                        Net Score Shift
                      </span>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 800, 
                        color: activeComparison.deltaScore < 0 ? '#166534' : (activeComparison.deltaScore > 0 ? '#92400E' : '#475569'), 
                        marginTop: '0.2rem' 
                      }}>
                        {activeComparison.deltaScore > 0 ? `+${activeComparison.deltaScore}` : activeComparison.deltaScore}
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, marginLeft: '0.35rem' }}>
                          ({activeComparison.percentageChange > 0 ? `+${activeComparison.percentageChange}%` : `${activeComparison.percentageChange}%`})
                        </span>
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                        Distress shift: {activeComparison.deltaDistress > 0 ? `+${activeComparison.deltaDistress}` : activeComparison.deltaDistress} pts
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Symptom Shift Breakdown */}
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.85rem' }}>
                    Symptom-Level Shift Breakdown
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem'
                  }}>
                    {/* Column A: Resolved / Unendorsed */}
                    <div style={{
                      padding: '0.95rem',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                        <CheckCircle2 size={16} />
                        <span>Resolved Symptoms ({activeComparison.symptomShifts.resolvedCount})</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#15803D', marginBottom: '0.65rem' }}>
                        Endorsed previously, but unendorsed in current assessment.
                      </p>
                      {activeComparison.symptomShifts.resolvedCount === 0 ? (
                        <span style={{ fontSize: '0.82rem', color: '#65A30D', fontStyle: 'italic' }}>None observed</span>
                      ) : (
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', color: '#14532D', lineHeight: 1.5 }}>
                          {activeComparison.symptomShifts.resolvedSymptoms.map(item => (
                            <li key={`res-${item.id}`} style={{ marginBottom: '0.35rem' }}>
                              "{item.text}"
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Column B: Persistent Symptoms */}
                    <div style={{
                      padding: '0.95rem',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400E', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                        <Activity size={16} />
                        <span>Persistent Symptoms ({activeComparison.symptomShifts.persistentCount})</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#B45309', marginBottom: '0.65rem' }}>
                        Endorsed in both assessment sessions.
                      </p>
                      {activeComparison.symptomShifts.persistentCount === 0 ? (
                        <span style={{ fontSize: '0.82rem', color: '#D97706', fontStyle: 'italic' }}>None recurrent</span>
                      ) : (
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5 }}>
                          {activeComparison.symptomShifts.persistentSymptoms.map(item => (
                            <li key={`per-${item.id}`} style={{ marginBottom: '0.35rem' }}>
                              "{item.text}"
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Column C: Newly Endorsed */}
                    <div style={{
                      padding: '0.95rem',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991B1B', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={16} />
                        <span>Newly Endorsed ({activeComparison.symptomShifts.newCount})</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#B91C1C', marginBottom: '0.65rem' }}>
                        Appeared in recent assessment, not noted previously.
                      </p>
                      {activeComparison.symptomShifts.newCount === 0 ? (
                        <span style={{ fontSize: '0.82rem', color: '#DC2626', fontStyle: 'italic' }}>No new symptoms</span>
                      ) : (
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                          {activeComparison.symptomShifts.newlyEndorsed.map(item => (
                            <li key={`new-${item.id}`} style={{ marginBottom: '0.35rem' }}>
                              "{item.text}"
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '1.75rem', textAlign: 'center', background: '#F8FAFC' }}>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                    Complete at least two screening assessments to unlock side-by-side symptom shift tracking.
                  </p>
                </div>
              )}

              {/* 3. Domain Progression Multi-Bar Chart */}
              {domainComparisonData.length > 0 && (
                <div className="card" style={{ padding: '1.5rem 1.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                    Clinical Domain Score Breakdown
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                    Comparing symptom endorsement counts across psychological dimensions between recent screenings.
                  </p>

                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={domainComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="domain" stroke="#64748B" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                        <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                        <Tooltip 
                          formatter={(val, name) => [val, name === 'latestEndorsed' ? 'Latest Session' : 'Previous Session']}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDomain || label}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="latestEndorsed" name="Latest Assessment" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="previousEndorsed" name="Previous Assessment" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: DETAILED DIAGNOSIS HISTORY CARDS                            */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Filter controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Showing {filteredHistory.length} recorded session(s)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilterType('all')}
                  >
                    All Types
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterType === 'schizophrenia' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilterType('schizophrenia')}
                  >
                    Schizophrenia (PQ-16)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterType === 'bipolar' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilterType('bipolar')}
                  >
                    Bipolar (MDQ)
                  </button>
                </div>
              </div>

              {/* Assessment Cards List */}
              {filteredHistory.map((rec, idx) => {
                const isExpanded = expandedCardId === (rec.id || idx);
                const isSchiz = rec.assessment_type === 'schizophrenia';
                const testName = isSchiz ? 'Schizophrenia Screening (PQ-16)' : 'Bipolar Screening (MDQ)';
                const answers = rec.answers || [];
                const domainScores = Array.isArray(rec.domain_scores) 
                  ? rec.domain_scores 
                  : computeDomainScores(answers, rec.assessment_type);

                const recsList = rec.recommendations || [];

                return (
                  <div 
                    key={`hist-card-${rec.id || idx}`}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      border: isExpanded ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>
                          {isSchiz ? 'PQ' : 'MDQ'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                              {testName}
                            </h3>
                            {idx === 0 && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }}>
                                Current
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                            Completed on {rec.date || 'Recent'} · Age Group: {rec.age_group || '19-25'}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {rec.score} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {rec.max_score || (isSchiz ? 16 : 15)}</span>
                          </div>
                          <span className="result-score-badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                            {rec.result_category || 'Assessed'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.45rem 0.65rem' }}
                          onClick={() => setExpandedCardId(isExpanded ? null : (rec.id || idx))}
                          aria-expanded={isExpanded}
                          title={isExpanded ? 'Collapse assessment details' : 'Expand assessment details'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Drill-Down Details */}
                    {isExpanded && (
                      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                        
                        {/* 1. Clinical Interpretation Summary */}
                        <div style={{
                          padding: '0.85rem 1rem',
                          background: 'var(--color-primary-tint)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '1.25rem',
                          fontSize: '0.88rem',
                          lineHeight: 1.55
                        }}>
                          <strong>Assessment Summary:</strong> {rec.interpretation || rec.screening_summary || 'Screening assessment successfully logged into immutable user history.'}
                        </div>

                        {/* 2. Domain-Wise Breakdown */}
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.65rem' }}>
                          Domain-Wise Response Scores
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '0.75rem',
                          marginBottom: '1.5rem'
                        }}>
                          {domainScores.map((dom, dIdx) => (
                            <div key={`d-${dIdx}`} style={{
                              padding: '0.75rem',
                              background: '#F8FAFC',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              fontSize: '0.84rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                                <span>{dom.name}</span>
                                <span style={{ color: dom.endorsed > 0 ? 'var(--color-primary)' : '#64748B' }}>
                                  {dom.endorsed} / {dom.total}
                                </span>
                              </div>
                              <div className="quiz-progress-track" style={{ height: '4px', margin: 0 }}>
                                <div className="quiz-progress-fill" style={{ width: `${(dom.endorsed / dom.total) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 3. ML Model Output (if available) */}
                        {rec.ml_prediction && rec.ml_prediction.status === 'success' && (
                          <div style={{
                            padding: '1rem',
                            background: '#FFFFFF',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            marginBottom: '1.5rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <Sparkles size={16} color="var(--color-primary)" />
                              <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                Secondary Random Forest ML Analysis ({rec.ml_prediction.algorithm || 'Random Forest'})
                              </strong>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                              Predicted Class: <strong>{rec.ml_prediction.prediction_label}</strong> · Risk Probability: <strong>{((rec.ml_prediction.risk_probability || 0) * 100).toFixed(1)}%</strong> ({rec.ml_prediction.risk_level} Risk)
                            </p>
                          </div>
                        )}

                        {/* 4. Recommendations Delivered at Assessment Time */}
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.65rem' }}>
                          Delivered Recommendations & Feedback
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                          {recsList.map((recItem, rIdx) => {
                            const currentRating = recommendationFeedback[recItem.id] || recItem.userRating || null;

                            return (
                              <div key={`rec-card-${rIdx}`} style={{
                                padding: '0.9rem 1rem',
                                background: '#FFFFFF',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem'
                              }}>
                                <div style={{ flex: 1, minWidth: '220px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                      {recItem.title}
                                    </strong>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
                                      {recItem.category || 'Well-Being Strategy'}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                                    {recItem.text}
                                  </p>
                                </div>

                                {/* Interactive Rating Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${currentRating === 'helpful' ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                                    onClick={() => handleRatingClick(recItem.id, recItem.title, recItem.category, 'helpful')}
                                    title="Mark as Helpful"
                                  >
                                    <ThumbsUp size={12} />
                                    <span>Helpful</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${currentRating === 'somewhat_helpful' ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                                    onClick={() => handleRatingClick(recItem.id, recItem.title, recItem.category, 'somewhat_helpful')}
                                    title="Mark as Somewhat Helpful"
                                  >
                                    <Meh size={12} />
                                    <span>Somewhat</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${currentRating === 'not_helpful' ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                                    onClick={() => handleRatingClick(recItem.id, recItem.title, recItem.category, 'not_helpful')}
                                    title="Mark as Not Helpful"
                                  >
                                    <ThumbsDown size={12} />
                                    <span>Not Helpful</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handlePrintSession(rec)}
                          >
                            <Printer size={14} />
                            <span>Print Assessment Record</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: RECOMMENDATION EFFECTIVENESS TRACKING                       */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'recommendations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                  Recommendation Effectiveness & Adaptive Learning
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Record whether previous recommendations were helpful in your daily routine. MindWave uses this feedback alongside subsequent assessment results to refine future suggestions (e.g. reinforcing strategies you find effective, or providing alternative protocols).
                </p>
              </div>

              {/* Core Protocols Feedback List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  {
                    id: 'sleep',
                    title: 'Circadian Stabilization & Dark Therapy Protocol',
                    category: 'Circadian Sleep Hygiene',
                    description: 'Enforcing fixed morning wake anchors and dimming lights 2 hours prior to sleep to buffer neurological rhythms.',
                    icon: '🌙'
                  },
                  {
                    id: 'grounding',
                    title: '5-4-3-2-1 Sensory Reality Grounding',
                    category: 'Cognitive Grounding',
                    description: 'Anchoring conscious attention to verifiable room sensations (sight, touch, sound, breath) during sensory vividness.',
                    icon: '🌿'
                  },
                  {
                    id: 'behavioral',
                    title: 'The 48-Hour Decision Rule & Peer Verification',
                    category: 'Behavioral Guardrails',
                    description: 'Structured delay before major purchases or commitments during heightened energy periods, with trusted peer feedback.',
                    icon: '💡'
                  },
                  {
                    id: 'breathing',
                    title: 'Guided 4-7-8 Autonomic Vagal Pacing',
                    category: 'Nervous System Regulation',
                    description: 'Slow rhythmic inhalation, breath retention, and extended exhale to center autonomic nervous system tone.',
                    icon: '💨'
                  }
                ].map(rec => {
                  const currentRating = recommendationFeedback[rec.id] || null;

                  return (
                    <div 
                      key={`feedback-block-${rec.id}`}
                      className="card"
                      style={{ padding: '1.25rem 1.5rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.3rem' }}>{rec.icon}</span>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                              {rec.title}
                            </h4>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                            Category: {rec.category}
                          </span>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                            {rec.description}
                          </p>
                        </div>

                        {/* Rating Buttons */}
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                            How helpful was this for you?
                          </span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${currentRating === 'helpful' ? 'btn-primary' : 'btn-outline'}`}
                              onClick={() => handleRatingClick(rec.id, rec.title, rec.category, 'helpful')}
                            >
                              <ThumbsUp size={14} />
                              <span>Helpful</span>
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${currentRating === 'somewhat_helpful' ? 'btn-primary' : 'btn-outline'}`}
                              onClick={() => handleRatingClick(rec.id, rec.title, rec.category, 'somewhat_helpful')}
                            >
                              <Meh size={14} />
                              <span>Somewhat</span>
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${currentRating === 'not_helpful' ? 'btn-primary' : 'btn-outline'}`}
                              onClick={() => handleRatingClick(rec.id, rec.title, rec.category, 'not_helpful')}
                            >
                              <ThumbsDown size={14} />
                              <span>Not Helpful</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Feedback status confirmation */}
                      {currentRating && (
                        <div style={{
                          marginTop: '0.85rem',
                          padding: '0.5rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: currentRating === 'helpful' ? '#DCFCE7' : (currentRating === 'somewhat_helpful' ? '#FEF3C7' : '#F1F5F9'),
                          color: currentRating === 'helpful' ? '#166534' : (currentRating === 'somewhat_helpful' ? '#92400E' : '#475569'),
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <CheckCircle2 size={14} />
                          <span>
                            Feedback recorded as <strong>{currentRating.replace('_', ' ')}</strong>. Future recommendations will adapt to emphasize or adjust this protocol.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: PERSONALIZED HISTORICAL INSIGHTS                            */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={22} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    Personalized Longitudinal Insights
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Generated by analyzing your complete assessment history across {personalizedInsights.totalAssessments} screening session(s) rather than treating each screening in isolation.
                </p>
              </div>

              {/* Narrative Insights Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {personalizedInsights.narrativeInsights.map((insight, iIdx) => (
                  <div 
                    key={`ins-${iIdx}`}
                    className="card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderLeft: '4px solid var(--color-primary)'
                    }}
                  >
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                      {insight.title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recurring Symptom Patterns Table */}
              {personalizedInsights.recurringSymptoms.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                    Recurring Symptom Tracking
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Specific sensations or experiences endorsed across multiple screening assessments.
                  </p>

                  <div className="table-card">
                    <table className="answers-table">
                      <thead>
                        <tr>
                          <th>Symptom Dimension</th>
                          <th>Endorsement Frequency</th>
                          <th>Consistency Rate</th>
                          <th>Suggested Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personalizedInsights.recurringSymptoms.map((sym, sIdx) => (
                          <tr key={`rec-sym-${sIdx}`}>
                            <td style={{ fontWeight: 600 }}>
                              "{sym.text}"
                              <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                                Domain: {sym.domain}
                              </span>
                            </td>
                            <td>
                              <strong>{sym.count}</strong> / {personalizedInsights.totalAssessments} sessions
                            </td>
                            <td>
                              <span className="result-score-badge" style={{ fontSize: '0.74rem' }}>
                                {sym.percentage}%
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                              Focal point for healthcare discussion
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Clinical Transparency Alert */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#F8FAFC',
                border: '1px solid var(--color-border)',
                fontSize: '0.84rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6
              }}>
                <strong>Clinical Transparency:</strong> {personalizedInsights.clinicalDisclaimer}
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
