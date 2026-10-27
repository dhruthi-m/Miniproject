import React, { useMemo } from 'react';
import { 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Settings, 
  MapPin, 
  ShieldAlert,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useScreening } from '../context/ScreeningContext';

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const { startTest, latestResult, history, loadingHistory } = useScreening();

  // Dynamic formatted date e.g. "Thu, 22 Oct 2026"
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const handleStartTest = (testType) => {
    startTest(testType);
    onNavigate('screening-setup');
  };

  // Only show high-risk clinical advisory banner if score is strictly above 12 (Elevated threshold)
  const isRecentHighRisk = (latestResult?.score ?? 0) > 12;

  // Longitudinal quick comparison: Compare latest assessment with previous
  const comparisonSummary = useMemo(() => {
    if (!history || history.length < 2) return null;
    const current = history[0];
    const previous = history[1];

    const sCurr = current.score ?? current.symptom_count ?? 0;
    const sPrev = previous.score ?? previous.symptom_count ?? 0;
    const delta = sCurr - sPrev;

    let direction = 'stable';
    if (delta < 0) direction = 'decreased';
    else if (delta > 0) direction = 'increased';

    return {
      current,
      previous,
      delta,
      direction
    };
  }, [history]);

  return (
    <div className="dashboard-wrap">
      {/* ── TOP HEADER SECTION ─────────────────────────────────────────── */}
      <section className="dashboard-top-row">
        <div>
          <h1 className="dashboard-heading">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Ananya'}!
          </h1>
          <p className="dashboard-subtext">
            Track your psychological screening history, understand symptom shifts over time, and explore personalized well-being recommendations.
          </p>
        </div>

        {/* Top-Right Date Indicator Badge */}
        <div className="date-indicator-badge">
          <Calendar size={16} color="var(--color-primary)" />
          <span>{formattedToday}</span>
        </div>
      </section>

      {/* ── HIGH RISK CLINICAL ADVISORY BANNER (If recent score is Elevated) ── */}
      {isRecentHighRisk && (
        <section 
          className="risk-clinical-advisory-banner" 
          style={{ cursor: 'pointer', marginBottom: '2rem' }}
          onClick={() => onNavigate('find-care')}
        >
          <div className="advisory-icon-wrapper">
            <ShieldAlert size={24} className="advisory-icon-pulse" />
          </div>
          <div className="advisory-content" style={{ flex: 1 }}>
            <div className="advisory-badge-row">
              <span className="advisory-risk-tag">⚠️ {latestResult.result_category} Risk Advisory</span>
              <span className="advisory-sub-tag">GPS Healthcare Radar Available</span>
            </div>
            <h3 className="advisory-title" style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>
              Nearby Mental Health Support & Specialists Recommended
            </h3>
            <p className="advisory-description" style={{ fontSize: '0.86rem' }}>
              Your recent screening showed {latestResult.result_category.toLowerCase()} indicators ({latestResult.assessment_type === 'bipolar' ? 'Bipolar MDQ' : 'PQ-16 Prodromal'}). Enable GPS to locate verified psychiatrists and clinical centers near you.
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'center', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <MapPin size={15} />
            <span>Open GPS Map</span>
          </button>
        </section>
      )}

      {/* ── SECTION: DIAGNOSIS HISTORY & LONGITUDINAL PROGRESS OVERVIEW ──── */}
      <section className="dashboard-history-section" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <TrendingUp size={22} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Diagnosis History & My Progress
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Track how your symptom responses, domain scores, and well-being strategies have changed over time.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => onNavigate('progress')}
            id="btn-view-all-progress"
          >
            <span>Full Longitudinal Progress Hub</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dynamic State: 0 Sessions, 1 Session (Baseline), 2+ Sessions (Longitudinal Trend) */}
        {loadingHistory ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Loading historical assessment records...</p>
          </div>
        ) : history.length === 0 ? (
          /* Graceful Empty State */
          <div className="card" style={{
            padding: '2.25rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,247,250,0.8))',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <Clock size={40} color="var(--color-primary)" style={{ opacity: 0.5, margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
              No Historical Assessments Yet
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '520px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
              Complete your first psychological screening to establish your baseline. MindWave will automatically track your responses over time, compare domain changes, and adapt future recommendations.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleStartTest('schizophrenia')}
              >
                Start Schizophrenia Screening (PQ-16)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleStartTest('bipolar')}
              >
                Start Bipolar Screening (MDQ)
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Quick Longitudinal Comparison Banner if 2+ sessions */}
            {comparisonSummary && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(117,96,217,0.08), rgba(99,102,241,0.04))',
                border: '1px solid rgba(117,96,217,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem 1.35rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: comparisonSummary.delta < 0 ? '#DCFCE7' : (comparisonSummary.delta > 0 ? '#FEF3C7' : '#F1F5F9'),
                    color: comparisonSummary.delta < 0 ? '#166534' : (comparisonSummary.delta > 0 ? '#92400E' : '#475569'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {comparisonSummary.delta < 0 ? <ArrowDownRight size={22} /> : (comparisonSummary.delta > 0 ? <ArrowUpRight size={22} /> : <Minus size={22} />)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--color-text)' }}>
                        Latest vs Preceding Screening
                      </strong>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        background: comparisonSummary.delta < 0 ? '#DCFCE7' : (comparisonSummary.delta > 0 ? '#FEF3C7' : '#F1F5F9'),
                        color: comparisonSummary.delta < 0 ? '#166534' : (comparisonSummary.delta > 0 ? '#92400E' : '#475569')
                      }}>
                        {comparisonSummary.delta > 0 ? `+${comparisonSummary.delta} symptoms` : (comparisonSummary.delta < 0 ? `${comparisonSummary.delta} symptoms` : 'Stable Score')}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                      {comparisonSummary.current.date} ({comparisonSummary.current.score}/{comparisonSummary.current.max_score || 16}) vs {comparisonSummary.previous.date} ({comparisonSummary.previous.score}/{comparisonSummary.previous.max_score || 16}) · Category: {comparisonSummary.current.result_category}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onNavigate('progress')}
                >
                  View Symptom Shifts
                </button>
              </div>
            )}

            {/* Assessment History Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {history.slice(0, 3).map((rec, idx) => {
                const isSchiz = rec.assessment_type === 'schizophrenia';
                const testTitle = isSchiz ? 'Schizophrenia (PQ-16)' : 'Bipolar (MDQ)';
                const categoryColor = rec.result_category === 'Elevated'
                  ? '#DC2626'
                  : (rec.result_category === 'Moderate' ? '#D97706' : (rec.result_category === 'Mild' ? '#2563EB' : '#16A34A'));

                return (
                  <div
                    key={`hist-${rec.id || idx}`}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: '1px solid var(--color-border)'
                    }}
                    onClick={() => onNavigate('progress')}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                            {idx === 0 ? '✨ Most Recent' : `Session ${history.length - idx}`}
                          </span>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.15rem' }}>
                            {testTitle}
                          </h4>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: `${categoryColor}15`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}30`
                        }}>
                          {rec.result_category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {rec.score}
                        </span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                          / {rec.max_score || (isSchiz ? 16 : 15)} symptoms
                        </span>
                        {typeof rec.distress_score === 'number' && rec.distress_score > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                            Distress: {rec.distress_score} pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                      fontSize: '0.82rem',
                      color: 'var(--color-text-muted)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} />
                        {rec.date || 'Recent'}
                      </span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── MAIN SECTION: TWO LARGE SCREENING CARDS SIDE BY SIDE ────────── */}
      <section className="dashboard-screenings-grid">
        {/* Card 1: Schizophrenia Screening */}
        <article className="screening-primary-card">
          <div className="screening-icon-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
            </svg>
          </div>
          <h2 className="screening-card-title">Schizophrenia Screening</h2>
          <p className="screening-card-desc">
            Based on the validated 16-item Prodromal Questionnaire (PQ-16).
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => handleStartTest('schizophrenia')}
            id="dash-start-schiz-btn"
          >
            <span>Start Screening</span>
            <ArrowRight size={17} />
          </button>
        </article>

        {/* Card 2: Bipolar Screening */}
        <article className="screening-primary-card">
          <div className="screening-icon-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="screening-card-title">Bipolar Screening</h2>
          <p className="screening-card-desc">
            Based on the validated Mood Disorder Questionnaire (MDQ).
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => handleStartTest('bipolar')}
            id="dash-start-bipolar-btn"
          >
            <span>Start Screening</span>
            <ArrowRight size={17} />
          </button>
        </article>
      </section>

      {/* ── BELOW SCREENING CARDS: QUICK ACCESS CARDS ────────────────────── */}
      <section className="dashboard-quick-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* 1. My Journal */}
        <div 
          className="quick-card"
          onClick={() => onNavigate('journal')}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card-icon-wrap">
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
          <h3 className="quick-card-title">My Journal</h3>
          <p className="quick-card-desc">Reflect your thoughts.</p>
        </div>

        {/* 2. My Progress & History */}
        <div 
          className="quick-card"
          onClick={() => onNavigate('progress')}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card-icon-wrap" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <h3 className="quick-card-title">My Progress</h3>
          <p className="quick-card-desc">Trends & History.</p>
        </div>

        {/* 3. Reports */}
        <div 
          className="quick-card"
          onClick={() => onNavigate('reports')}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card-icon-wrap">
            <FileText size={22} strokeWidth={2.2} />
          </div>
          <h3 className="quick-card-title">Reports</h3>
          <p className="quick-card-desc">Download summary.</p>
        </div>

        {/* 4. Find Nearby Care (GPS) */}
        <div 
          className="quick-card"
          onClick={() => onNavigate('find-care')}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card-icon-wrap">
            <MapPin size={22} strokeWidth={2.2} />
          </div>
          <h3 className="quick-card-title">Nearby Care</h3>
          <p className="quick-card-desc">Hospitals & Doctors.</p>
        </div>

        {/* 5. Settings */}
        <div 
          className="quick-card"
          onClick={() => onNavigate('settings')}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card-icon-wrap">
            <Settings size={22} strokeWidth={2.2} />
          </div>
          <h3 className="quick-card-title">Settings</h3>
          <p className="quick-card-desc">Manage account.</p>
        </div>
      </section>
    </div>
  );
}
