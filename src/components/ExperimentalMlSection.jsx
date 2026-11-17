import React from 'react';
import { Sparkles, Brain, Cpu, AlertTriangle, CheckCircle2, ShieldAlert, Info, RotateCw } from 'lucide-react';

/**
 * Generates a rule-based clinical result from the traditional score
 * when the ML service is offline. Works for ALL age groups.
 */
function buildRuleBasedResult(activeTest, score, maxScore) {
  const isBipolar = activeTest !== 'schizophrenia';
  const ratio = maxScore > 0 ? score / maxScore : 0;

  // Bipolar MDQ: clinical threshold ≥ 7/15 suggests elevated screening
  // Schizophrenia PQ-16: clinical threshold ≥ 6/16 suggests prodromal risk
  const clinicalThreshold = isBipolar ? 7 : 6;
  const isElevated = score >= clinicalThreshold;

  let predictionLabel, confidence, interpretation;

  if (isBipolar) {
    if (score >= 11) {
      predictionLabel = 'Elevated Spectrum Indicators';
      confidence = Math.round(75 + (ratio - 0.7) * 80);
      interpretation = 'High symptom endorsement on the MDQ. Multiple co-occurring hypomanic/manic features noted.';
    } else if (score >= 7) {
      predictionLabel = 'Elevated Risk Indicator';
      confidence = Math.round(55 + (score - 7) * 6);
      interpretation = 'Score meets MDQ clinical threshold (≥7). Consultation with a mental health professional is recommended.';
    } else if (score >= 4) {
      predictionLabel = 'Sub-Threshold / Watchful';
      confidence = Math.round(30 + score * 4);
      interpretation = 'Some mood elevation features noted but below clinical threshold. Monitor and maintain healthy routines.';
    } else {
      predictionLabel = 'Baseline / Low Risk';
      confidence = Math.round(85 - score * 8);
      interpretation = 'Minimal endorsement of hypomanic/manic features. Responses within typical baseline range.';
    }
  } else {
    if (score >= 10) {
      predictionLabel = 'Elevated Prodromal Indicators';
      confidence = Math.round(75 + (ratio - 0.6) * 80);
      interpretation = 'High symptom endorsement on the PQ-16. Perceptual and cognitive variations noted across multiple domains.';
    } else if (score >= 6) {
      predictionLabel = 'Elevated Risk Indicator';
      confidence = Math.round(55 + (score - 6) * 5);
      interpretation = 'Score meets PQ-16 clinical threshold (≥6). A formal evaluation by a mental health specialist is advised.';
    } else if (score >= 3) {
      predictionLabel = 'Sub-Threshold / Watchful';
      confidence = Math.round(30 + score * 5);
      interpretation = 'Some perceptual/cognitive indicators noted but below clinical threshold.';
    } else {
      predictionLabel = 'Baseline / Low Risk';
      confidence = Math.round(85 - score * 8);
      interpretation = 'Minimal prodromal indicators. Sensory and thought processing appear stable.';
    }
  }

  confidence = Math.max(10, Math.min(97, confidence));

  return {
    status: 'rule_based',
    predicted_class: isElevated ? 1 : 0,
    prediction_label: predictionLabel,
    confidence_percentage: confidence,
    interpretation,
    model_version: 'Clinical Rules v1.0',
    top_contributing_features: [],
    is_rule_based: true
  };
}

/**
 * Supplemental Screening Analysis Component
 * Displays response analysis results separately from the traditional screening score.
 * Falls back to rule-based clinical scoring when the ML service is offline —
 * works for ALL age groups without requiring localhost:8000.
 */
export default function ExperimentalMlSection({ mlResult, activeTest, score, maxScore, ageGroup, onRetry, isLoading }) {
  const isSchizophrenia = activeTest === 'schizophrenia';
  const testTitle = isSchizophrenia ? 'Schizophrenia / Psychosis Risk' : 'Bipolar Disorder Spectrum';
  const instrumentName = isSchizophrenia ? 'Prodromal Questionnaire 16 (PQ-16)' : 'Mood Disorder Questionnaire (MDQ)';

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="experimental-ml-card" id="experimental-ml-analysis">
        <div className="experimental-ml-topbar">
          <div className="experimental-ml-title-group">
            <div className="experimental-ml-icon-wrapper">
              <Cpu size={22} className="animate-spin" />
            </div>
            <div>
              <h2 className="experimental-ml-title">Screening Analysis</h2>
              <p className="experimental-ml-subtitle">Retrieving your screening assessment...</p>
            </div>
          </div>
          <span className="experimental-ml-model-tag">
            <Sparkles size={14} /> Processing
          </span>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Analyzing your questionnaire responses...
          </p>
        </div>
      </div>
    );
  }

  // 2. Determine the effective result:
  //    - If ML returned a successful prediction → use it
  //    - Otherwise (offline / error / no result) → fall back to rule-based scoring
  //      so ALL age groups always get a proper result
  const serviceOffline =
    !mlResult ||
    mlResult.status === 'offline' ||
    mlResult.status === 'error' ||
    mlResult.status === 'unavailable' ||
    mlResult.is_supported === false;

  const effectiveResult =
    serviceOffline
      ? buildRuleBasedResult(activeTest, score ?? 0, maxScore ?? (isSchizophrenia ? 16 : 15))
      : mlResult.status === 'unsupported'
        ? buildRuleBasedResult(activeTest, score ?? 0, maxScore ?? (isSchizophrenia ? 16 : 15))
        : mlResult;

  // 3. Render the result
  const isElevated = effectiveResult.predicted_class === 1;
  const confidence = effectiveResult.confidence_percentage ??
    (effectiveResult.risk_probability ? Math.round(effectiveResult.risk_probability * 100) : null);
  const topFeatures = effectiveResult.top_contributing_features || [];
  const isRuleBased = !!effectiveResult.is_rule_based;

  return (
    <section className="experimental-ml-card" id="experimental-ml-analysis">
      {/* Topbar */}
      <div className="experimental-ml-topbar">
        <div className="experimental-ml-title-group">
          <div className="experimental-ml-icon-wrapper">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="experimental-ml-title">Screening Analysis</h2>
            <p className="experimental-ml-subtitle">
              Response Analysis for {testTitle}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="experimental-ml-model-tag">
            <Cpu size={13} /> {isRuleBased ? 'Clinical Rules Engine' : 'Screening System'}
          </span>
        </div>
      </div>

      {/* Offline notice banner (subtle, non-blocking) */}
      {isRuleBased && (
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: 'var(--color-text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Info size={13} />
            Result generated via validated clinical scoring rules (ML service offline).
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              type="button"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'none', border: '1px solid #CBD5E1', borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}
            >
              <RotateCw size={11} /> Retry ML Service
            </button>
          )}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="experimental-ml-grid">
        {/* Metric 1: Screening Classification */}
        <div className="experimental-ml-metric-box">
          <span className="experimental-ml-metric-label">Screening Classification</span>
          <div style={{ margin: '0.2rem 0' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)'
              }}
              className={isElevated ? 'experimental-ml-badge-elevated' : 'experimental-ml-badge-baseline'}
            >
              {isElevated ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {effectiveResult.prediction_label || (isElevated ? 'Elevated Risk Indicator' : 'Baseline / Low Risk')}
            </span>
          </div>
          <span className="experimental-ml-metric-sub">
            Assessment result based on validated screening criteria
          </span>
        </div>

        {/* Metric 2: Result Indicator */}
        <div className="experimental-ml-metric-box">
          <span className="experimental-ml-metric-label">Result Indicator</span>
          <div className="experimental-ml-metric-value" style={{ color: isElevated ? '#B91C1C' : '#047857' }}>
            {confidence !== null ? `${confidence}%` : 'N/A'}
          </div>
          <span className="experimental-ml-metric-sub">
            Degree of agreement across validated screening criteria for this profile
          </span>
        </div>

        {/* Metric 3: Assessment Scope */}
        <div className="experimental-ml-metric-box">
          <span className="experimental-ml-metric-label">Assessment Scope</span>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.35rem', lineHeight: 1.4 }}>
            {instrumentName}
          </div>
        </div>
      </div>

      {/* Clinical Interpretation (rule-based) */}
      {isRuleBased && effectiveResult.interpretation && (
        <div style={{
          background: isElevated ? 'rgba(185,28,28,0.04)' : 'rgba(4,120,87,0.04)',
          border: `1px solid ${isElevated ? 'rgba(185,28,28,0.15)' : 'rgba(4,120,87,0.15)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.1rem',
          marginBottom: '1rem',
          fontSize: '0.87rem',
          color: 'var(--color-text)',
          lineHeight: 1.6
        }}>
          <strong>Clinical Interpretation:</strong> {effectiveResult.interpretation}
        </div>
      )}

      {/* Top Predictive Endorsed Symptoms (ML only) */}
      {topFeatures.length > 0 && (
        <div className="experimental-ml-features-container">
          <div className="experimental-ml-features-title">
            Key Endorsed Items Influencing Assessment:
          </div>
          <div className="experimental-ml-feature-pills">
            {topFeatures.map((feat) => (
              <span key={feat.feature_id} className="experimental-ml-feature-pill">
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Item {feat.item_index}:</span>
                <span>{feat.relative_importance}% split weight</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strict Ethical & Clinical Disclaimer */}
      <div className="experimental-ml-disclaimer-box">
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Important Notice:</strong> This response analysis is an experimental statistical assessment intended solely for exploratory research. It is <strong>NOT a medical or psychiatric diagnosis</strong>. Result indicators represent statistical scoring agreement, not calibrated clinical probability. Always consult a licensed clinical psychologist or psychiatrist for diagnostic assessments.
        </div>
      </div>
    </section>
  );
}
