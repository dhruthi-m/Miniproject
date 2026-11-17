import React, { useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  RefreshCw,
  Compass,
  FileText,
  BarChart2
} from 'lucide-react';
import { useJournal } from '../context/JournalContext';

export default function MoodTrendsSection() {
  const { trendsData, loadingTrends, fetchTrends, entries } = useJournal();

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const summary = trendsData?.summary || {
    total_journals: entries.filter(e => e.type === 'text').length,
    total_mood_logs: entries.filter(e => e.type === 'mood').length,
    total_pq16_screens: 0,
    total_mdq_screens: 0
  };

  const series = trendsData?.series || { journals: [], moods: [], pq16: [], mdq: [] };
  const prediction = trendsData?.prediction;

  // Total historical data points (journals + moods)
  const totalDataPoints = (summary.total_journals || 0) + (summary.total_mood_logs || 0);

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── HEADER CARD ────────────────────────────────────────────────────── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        color: '#fff',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <TrendingUp size={22} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Mood & Sentiment Trajectory Radar
              </h2>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', maxWidth: '600px' }}>
              Correlating daily journal NLP valence with your mood tracking and standardized clinical assessments (PQ-16 & MDQ).
            </p>
          </div>

          <button 
            type="button" 
            onClick={fetchTrends}
            disabled={loadingTrends}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={loadingTrends ? 'spin-animation' : ''} />
            <span>{loadingTrends ? 'Updating...' : 'Refresh Trends'}</span>
          </button>
        </div>

        {/* Aggregate Telemetry Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.74rem', opacity: 0.85, display: 'block' }}>Journal Entries</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.total_journals}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.74rem', opacity: 0.85, display: 'block' }}>Mood Logs</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.total_mood_logs}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.74rem', opacity: 0.85, display: 'block' }}>PQ-16 Screens</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.total_pq16_screens}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.74rem', opacity: 0.85, display: 'block' }}>MDQ Screens</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.total_mdq_screens}</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: MOOD PREDICTION ENGINE (Requirement 5) ─────────────── */}
      <div className="card" style={{ border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={20} color="#6366F1" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
            AI Forward Mood Trajectory Prediction
          </h3>
        </div>

        {/* Insufficient Data Guard */}
        {!prediction?.sufficient_data ? (
          <div style={{
            padding: '1.25rem',
            borderRadius: '10px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#92400E'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              <AlertCircle size={18} color="#D97706" />
              <span>Insufficient Historical Data for Trajectory Estimation</span>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.86rem', lineHeight: '1.5' }}>
              {prediction?.message || 'To calculate a responsible and statistically sound forward mood trend, at least 3 historical journal entries or mood logs are required.'}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              background: '#FEF3C7',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#B45309'
            }}>
              <span>Progress: {totalDataPoints} / 3 entries recorded</span>
            </div>
          </div>
        ) : (
          /* Sufficient Data Available: Present Transparent Prediction */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}>
              {/* Trajectory Direction */}
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Trajectory Direction
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', marginTop: '0.25rem' }}>
                  {prediction.prediction.trajectory}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Slope: {prediction.prediction.momentum_slope > 0 ? `+${prediction.prediction.momentum_slope}` : prediction.prediction.momentum_slope}
                </span>
              </div>

              {/* Projected 7-Day Range */}
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Projected 7-Day Sentiment
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E40AF', marginTop: '0.25rem' }}>
                  {prediction.prediction.projected_7d_range}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#3B82F6' }}>
                  Valence Avg: {prediction.prediction.current_valence_avg}
                </span>
              </div>

              {/* Stability Index */}
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#FAF5FF',
                border: '1px solid #E9D5FF'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#7E22CE', fontWeight: 700, textTransform: 'uppercase' }}>
                  Affective Stability
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6B21A8', marginTop: '0.25rem' }}>
                  {prediction.prediction.stability_index}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#A855F7' }}>
                  {prediction.prediction.data_points_analyzed} data points evaluated
                </span>
              </div>
            </div>

            {/* Prediction Transparency & Clinical Guard */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#F1F5F9',
              fontSize: '0.8rem',
              color: '#475569'
            }}>
              <ShieldCheck size={16} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Mathematical Time-Series Estimation:</strong> {prediction.prediction.forecast_basis} {prediction.prediction.disclaimer}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: CROSS-SCREENING CORRELATION (Requirement 4) ────────── */}
      <div className="card" style={{ border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Activity size={20} color="#059669" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
            Cross-Screening Timeline Correlation
          </h3>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          Tracking your journal sentiment variations alongside your standardized PQ-16 and MDQ clinical questionnaire dates.
        </p>

        {/* Screening Streams Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {/* Column A: Journal Sentiment Timeline */}
          <div style={{
            padding: '1rem',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '0.75rem' }}>
              <FileText size={16} color="#6366F1" />
              <span>Daily Journal Sentiment Log</span>
            </div>

            {series.journals && series.journals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
                {series.journals.map((j, i) => (
                  <div key={i} style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <strong style={{ color: '#0F172A' }}>{j.title}</strong>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: j.sentiment_label === 'Positive' ? '#DCFCE7' : j.sentiment_label === 'Negative' ? '#FEE2E2' : '#F1F5F9',
                        color: j.sentiment_label === 'Positive' ? '#166534' : j.sentiment_label === 'Negative' ? '#991B1B' : '#475569'
                      }}>
                        {j.sentiment_label} ({j.compound_score?.toFixed(2)})
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', color: '#64748B', fontSize: '0.72rem' }}>
                      <span>{new Date(j.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      {j.distortions?.length > 0 && (
                        <span style={{ color: '#D97706', fontWeight: 600 }}>· {j.distortions.length} thinking pattern detected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
                No text journal entries saved yet.
              </p>
            )}
          </div>

          {/* Column B: PQ-16 & MDQ Screenings */}
          <div style={{
            padding: '1rem',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '0.75rem' }}>
              <BarChart2 size={16} color="#059669" />
              <span>Standardized Screening Scores</span>
            </div>

            {(series.pq16?.length > 0 || series.mdq?.length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
                {/* PQ-16 list */}
                {series.pq16?.map((s, i) => (
                  <div key={`pq-${i}`} style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#166534' }}>PQ-16 Prodromal Screen</strong>
                      <span style={{ fontWeight: 800, color: '#15803D' }}>{s.score} / {s.max_score}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#166534', opacity: 0.85, marginTop: '0.2rem' }}>
                      Category: {s.result_category} · Distress: {s.distress_score} · {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}

                {/* MDQ list */}
                {series.mdq?.map((s, i) => (
                  <div key={`mdq-${i}`} style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#6B21A8' }}>MDQ Bipolar Spectrum Screen</strong>
                      <span style={{ fontWeight: 800, color: '#7E22CE' }}>{s.score} / 13</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6B21A8', opacity: 0.85, marginTop: '0.2rem' }}>
                      Criteria Met: {s.criteria_met ? 'Yes' : 'No'} · Impairment: {s.impairment_level} · {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
                No PQ-16 or MDQ screenings completed yet. Complete a screening in the Questionnaire tab to correlate here.
              </p>
            )}
          </div>
        </div>

        {/* Correlation Disclaimer Note (Strict Requirement 4) */}
        <div style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          fontSize: '0.78rem',
          color: '#991B1B',
          lineHeight: '1.4'
        }}>
          <strong>Critical Statistical Disclaimer:</strong> {trendsData?.correlation_disclaimer || 'PQ-16 (psychosis risk), MDQ (bipolar spectrum), and daily journal sentiment measure distinct psychological axes. Scores are maintained independently; correlation does not imply causation.'}
        </div>
      </div>
    </div>
  );
}

