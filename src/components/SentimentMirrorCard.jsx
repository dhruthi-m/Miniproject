import React from 'react';
import { 
  Sparkles, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  HeartHandshake, 
  Activity, 
  Lightbulb,
  AlertTriangle,
  Smile
} from 'lucide-react';

export default function SentimentMirrorCard({ analysis, compact = false, showDisclaimer = true }) {
  if (!analysis) return null;

  const { sentiment, emotions = [], distortions = [], reframe } = analysis;

  const sentimentLabel = sentiment?.label || 'Neutral';
  const compoundScore = typeof sentiment?.compound === 'number' ? sentiment.compound.toFixed(2) : '0.00';
  const intensity = sentiment?.intensityPercent ?? 0;

  let badgeColor = '#475569';
  let badgeBg = '#F1F5F9';
  let badgeBorder = '#CBD5E1';
  if (sentimentLabel === 'Positive') {
    badgeColor = '#047857';
    badgeBg = '#ECFDF5';
    badgeBorder = '#A7F3D0';
  } else if (sentimentLabel === 'Negative') {
    badgeColor = '#B91C1C';
    badgeBg = '#FEF2F2';
    badgeBorder = '#FECACA';
  }

  const hasDistortions = distortions && distortions.length > 0;

  return (
    <div style={{
      marginTop: '1.25rem',
      padding: compact ? '1.1rem' : '1.5rem',
      borderRadius: '16px',
      background: '#FFFFFF',
      border: '1.5px solid #E2E8F0',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* ── TOP BANNER: SENTIMENT & SCORE SUMMARY ────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingBottom: '1rem',
        borderBottom: '1.5px dashed #E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'block' }}>
              Psychological Sentiment & CBT Analysis
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
              Three-layer evaluation: Emotional Themes · Thought Distortions · Balanced Reframes
            </span>
          </div>
        </div>

        {/* Global Sentiment Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          background: badgeBg,
          color: badgeColor,
          fontWeight: 700,
          fontSize: '0.85rem',
          border: `1.5px solid ${badgeBorder}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: badgeColor,
            display: 'inline-block'
          }} />
          <span>{sentimentLabel} Sentiment</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>({compoundScore})</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: EMOTIONAL THEMES (PURPLE / MAGENTA THEMED BOX)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        borderRadius: '12px',
        border: '1.5px solid #DDD6FE',
        borderLeft: '5px solid #8B5CF6',
        background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)',
        padding: '1.1rem',
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.05)'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Activity size={15} />
            </div>
            <div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#7C3AED',
                display: 'block'
              }}>
                Layer 1: Affective Tone
              </span>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#4C1D95' }}>
                Identified Emotional Themes
              </h4>
            </div>
          </div>

          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            background: '#EDE9FE',
            color: '#6D28D9'
          }}>
            {emotions.length} Theme{emotions.length === 1 ? '' : 's'} Detected
          </span>
        </div>

        {/* Emotion Tags */}
        {emotions && emotions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            {emotions.map((emo, idx) => {
              let emoBg = '#EDE9FE';
              let emoBorder = '#DDD6FE';
              let emoColor = '#6D28D9';
              if (emo.theme === 'Stress' || emo.theme === 'Anxiety') {
                emoBg = '#FEF3C7';
                emoBorder = '#FDE68A';
                emoColor = '#B45309';
              } else if (emo.theme === 'Sadness') {
                emoBg = '#E0F2FE';
                emoBorder = '#BAE6FD';
                emoColor = '#0369A1';
              } else if (emo.theme === 'Frustration') {
                emoBg = '#FFE4E6';
                emoBorder = '#FECDD3';
                emoColor = '#BE123C';
              } else if (emo.theme === 'Happiness') {
                emoBg = '#DCFCE7';
                emoBorder = '#BBF7D0';
                emoColor = '#15803D';
              }

              return (
                <div key={idx} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  background: emoBg,
                  border: `1.5px solid ${emoBorder}`,
                  color: emoColor,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <span>{emo.theme}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(255, 255, 255, 0.65)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    {emo.intensity}
                  </span>
                  {emo.evidence && emo.evidence.length > 0 && (
                    <span style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 500, fontStyle: 'italic' }}>
                      &ldquo;{emo.evidence.slice(0, 2).join(', ')}&rdquo;
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            fontSize: '0.84rem',
            color: '#6B7280',
            fontStyle: 'italic',
            background: '#F9FAFB',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            No dominant high-intensity emotional themes detected in this entry. Thoughts appear emotionally steady.
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: COGNITIVE DISTORTIONS (AMBER / EMERALD THEMED BOX)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        borderRadius: '12px',
        border: `1.5px solid ${hasDistortions ? '#FDE68A' : '#BBF7D0'}`,
        borderLeft: `5px solid ${hasDistortions ? '#F59E0B' : '#10B981'}`,
        background: hasDistortions ? 'linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%)' : 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
        padding: '1.1rem',
        boxShadow: hasDistortions ? '0 2px 8px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(16, 185, 129, 0.08)'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: hasDistortions ? '#F59E0B' : '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              {hasDistortions ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: hasDistortions ? '#D97706' : '#059669',
                display: 'block'
              }}>
                Layer 2: Cognitive Pattern Check
              </span>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: hasDistortions ? '#78350F' : '#065F46' }}>
                Cognitive Distortions (CBT Thinking Habits)
              </h4>
            </div>
          </div>

          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            background: hasDistortions ? '#FEF3C7' : '#DCFCE7',
            color: hasDistortions ? '#92400E' : '#166534'
          }}>
            {hasDistortions ? `${distortions.length} Distortion Pattern${distortions.length === 1 ? '' : 's'}` : 'Balanced Thinking'}
          </span>
        </div>

        {/* Distortion Callouts or Balanced State */}
        {hasDistortions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {distortions.map((dist, idx) => (
              <div key={idx} style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1.5px solid #FDE68A',
                boxShadow: '0 1px 4px rgba(217, 119, 6, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, color: '#92400E', fontSize: '0.92rem' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#D97706'
                    }} />
                    <span>{dist.pattern}</span>
                  </div>
                  {dist.evidence && (
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: '#FEF3C7',
                      color: '#B45309',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '5px',
                      border: '1px solid #FDE68A'
                    }}>
                      In text: &ldquo;{dist.evidence}&rdquo;
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, color: '#78350F', fontSize: '0.84rem', lineHeight: '1.45' }}>
                  {dist.explanation}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: '#FFFFFF',
            border: '1.5px solid #BBF7D0',
            color: '#166534',
            fontSize: '0.86rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
            <span>No cognitive distortions detected. Your entry reflects a balanced, realistic, and grounded thought structure.</span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: COGNITIVE REFRAME (OCEAN BLUE / INDIGO THEMED BOX)
      ══════════════════════════════════════════════════════════════════════ */}
      {reframe && (
        <div style={{
          borderRadius: '12px',
          border: '1.5px solid #BFDBFE',
          borderLeft: '5px solid #2563EB',
          background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
          padding: '1.1rem',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
        }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Lightbulb size={15} />
              </div>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#2563EB',
                  display: 'block'
                }}>
                  Layer 3: CBT Therapeutic Reframe
                </span>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#1E3A8A' }}>
                  Cognitive Reframe & Reflection Prompt
                </h4>
              </div>
            </div>

            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              background: '#DBEAFE',
              color: '#1D4ED8'
            }}>
              Personalized Alternative
            </span>
          </div>

          {/* Balanced Perspective Box */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            padding: '0.9rem 1rem',
            border: '1.5px solid #BFDBFE',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#2563EB',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <HeartHandshake size={14} />
              <span>Balanced Alternative Perspective</span>
            </div>
            <p style={{ margin: 0, color: '#1E293B', fontSize: '0.88rem', lineHeight: '1.55', fontWeight: 500 }}>
              {reframe.balanced_perspective}
            </p>
          </div>

          {/* Reflection Question Box */}
          {reframe.reflection_question && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: '#1E3A8A',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(30, 58, 138, 0.15)'
            }}>
              <HelpCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#93C5FD' }} />
              <div>
                <span style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#93C5FD',
                  marginBottom: '0.2rem'
                }}>
                  Self-Reflection Prompt
                </span>
                <span style={{ fontSize: '0.88rem', lineHeight: '1.45', fontWeight: 600 }}>
                  {reframe.reflection_question}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PRIVACY & CLINICAL DISCLAIMER ───────────────────────────────── */}
      {showDisclaimer && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          color: '#64748B',
          fontSize: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px dashed #E2E8F0'
        }}>
          <ShieldCheck size={14} style={{ flexShrink: 0, color: '#94A3B8' }} />
          <span>
            <strong>Reflective CBT Tool:</strong> AI-assisted thinking pattern estimation is private and non-diagnostic. It provides personal insight and does not replace professional psychiatric or clinical healthcare.
          </span>
        </div>
      )}
    </div>
  );
}
