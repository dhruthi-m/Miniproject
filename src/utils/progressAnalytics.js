/**
 * MindWave Progress & Longitudinal Analytics Utility
 * Provides client-side and offline-resilient domain analysis,
 * recommendation generation with feedback adaptation, longitudinal comparisons,
 * and personalized historical insights.
 */

export const PQ16_DOMAIN_CLUSTERS = {
  1: { cluster: "Affective & Motivational", label: "Anhedonia / Reduced Interest" },
  2: { cluster: "Perceptual Variations", label: "Déjà Vu & Sensory Vividness" },
  3: { cluster: "Perceptual Variations", label: "Olfactory & Gustatory Variations" },
  4: { cluster: "Perceptual Variations", label: "Auditory Perception & Tinnitus" },
  5: { cluster: "Cognitive Disorganization", label: "Reality Testing & Confusion" },
  6: { cluster: "Perceptual Variations", label: "Visual Metamorphopsia" },
  7: { cluster: "Interpersonal & Affective", label: "Social Anxiety & Unease" },
  8: { cluster: "Perceptual Variations", label: "Visual Hallucinatory Impressions" },
  9: { cluster: "Cognitive Disorganization", label: "Thought Audibility & Loudness" },
  10: { cluster: "Unusual Beliefs & Ideation", label: "Ideas of Reference & Meaning" },
  11: { cluster: "Unusual Beliefs & Ideation", label: "Thought Interference & Agency" },
  12: { cluster: "Cognitive Disorganization", label: "Attentional Distractibility" },
  13: { cluster: "Perceptual Variations", label: "Verbal Auditory Hallucinations" },
  14: { cluster: "Interpersonal & Affective", label: "Paranoid Ideation & Suspiciousness" },
  15: { cluster: "Unusual Beliefs & Ideation", label: "Somatic Presence & Entity" },
  16: { cluster: "Somatosensory Dimension", label: "Body Image & Somatosensory" }
};

export const MDQ_DOMAIN_CLUSTERS = {
  1: { cluster: "Energy & Activation", label: "Hyper-Energy & Activation" },
  2: { cluster: "Circadian & Sleep", label: "Decreased Need for Sleep" },
  3: { cluster: "Cognitive Acceleration", label: "Racing Thoughts & Flight of Ideas" },
  4: { cluster: "Self-Appraisal", label: "Grandiosity & Inflated Confidence" },
  5: { cluster: "Cognitive Acceleration", label: "Pressured Speech & Talkativeness" },
  6: { cluster: "Impulse & Behavioral", label: "Impulsivity & Excessive Spending" },
  7: { cluster: "Energy & Activation", label: "Goal-Directed Multitasking" },
  8: { cluster: "Affective Reactivity", label: "Irritability & Conflict" },
  9: { cluster: "Affective Reactivity", label: "Mood Cycling & Polarity Shifts" },
  10: { cluster: "Social Visibility", label: "Social Notice & Behavioral Change" },
  11: { cluster: "Functional Impact", label: "Interference in Daily Routines" },
  12: { cluster: "Cognitive Acceleration", label: "Distractibility & Lability" },
  13: { cluster: "Impulse & Behavioral", label: "Uncharacteristic Risk-Taking" },
  14: { cluster: "Synchrony & Timing", label: "Episode Clustering & Synchrony" },
  15: { cluster: "Functional Impact", label: "Emotional Self-Regulation" }
};

/**
 * Computes domain-wise score breakdowns from questionnaire responses
 */
export function computeDomainScores(answers = [], assessmentType = 'schizophrenia') {
  const isSchiz = (assessmentType || '').toLowerCase().includes('schiz') || (assessmentType || '').includes('pq');
  const clusterDefs = isSchiz ? PQ16_DOMAIN_CLUSTERS : MDQ_DOMAIN_CLUSTERS;
  const domainMap = {};

  answers.forEach((ans, idx) => {
    const qNum = ans.id || (idx + 1);
    const clusterMeta = clusterDefs[qNum] || { cluster: ans.domain || 'Clinical Dimension', label: `Item ${qNum}` };
    const clusterName = clusterMeta.cluster;
    const isEndorsed = ans.answer === 'True' || ans.isTrue === true || ans.endorsed === true;

    if (!domainMap[clusterName]) {
      domainMap[clusterName] = {
        name: clusterName,
        total: 0,
        endorsed: 0,
        distressSum: 0,
        items: []
      };
    }

    domainMap[clusterName].total += 1;
    if (isEndorsed) {
      domainMap[clusterName].endorsed += 1;
      const d1 = typeof ans.followUp1 === 'number' ? Math.max(0, Math.min(5, ans.followUp1)) : 0;
      const d2 = typeof ans.followUp2 === 'number' ? Math.max(0, Math.min(5, ans.followUp2)) : 0;
      domainMap[clusterName].distressSum += (d1 + d2);
    }

    domainMap[clusterName].items.push({
      id: qNum,
      text: ans.text || clusterMeta.label,
      endorsed: isEndorsed
    });
  });

  return Object.values(domainMap).map(d => ({
    ...d,
    percentage: d.total > 0 ? Math.round((d.endorsed / d.total) * 100) : 0,
    avgDistress: d.endorsed > 0 ? (d.distressSum / (d.endorsed * 2)).toFixed(1) : '0.0'
  }));
}

/**
 * Generates tailored recommendations adapted with historical user feedback
 */
export function generatePersonalizedRecommendations({
  assessmentType = 'schizophrenia',
  category = 'Minimal',
  score = 0,
  answers = [],
  feedbackHistory = {}
}) {
  const isSchiz = (assessmentType || '').toLowerCase().includes('schiz') || (assessmentType || '').includes('pq');
  const trueAnswers = answers.filter(a => a && (a.answer === 'True' || a.isTrue === true || a.endorsed === true));

  // Specific symptom indicators
  const hasSleepIssue = trueAnswers.some(a => 
    (a.domain && a.domain.toLowerCase().includes('sleep')) || 
    (a.text && a.text.toLowerCase().includes('sleep')) ||
    a.id === 2
  );
  const hasRacingThoughts = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('racing') || a.domain.toLowerCase().includes('speech'))) ||
    (a.text && (a.text.toLowerCase().includes('racing') || a.text.toLowerCase().includes('talkative'))) ||
    a.id === 3 || a.id === 5
  );
  const hasHighEnergyImpulse = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('energy') || a.domain.toLowerCase().includes('impulsiv') || a.domain.toLowerCase().includes('grandiosity'))) ||
    (a.text && (a.text.toLowerCase().includes('hyper') || a.text.toLowerCase().includes('money') || a.text.toLowerCase().includes('confident'))) ||
    a.id === 1 || a.id === 4 || a.id === 6
  );
  const hasPerceptualSensory = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('percept') || a.domain.toLowerCase().includes('sensory') || a.domain.toLowerCase().includes('auditory') || a.domain.toLowerCase().includes('visual'))) ||
    (a.text && (a.text.toLowerCase().includes('hear') || a.text.toLowerCase().includes('see') || a.text.toLowerCase().includes('sound'))) ||
    [2, 3, 4, 6, 8, 9, 13].includes(a.id)
  );
  const hasIdeationalBeliefs = trueAnswers.some(a => 
    (a.domain && (a.domain.toLowerCase().includes('belief') || a.domain.toLowerCase().includes('presence') || a.domain.toLowerCase().includes('meaning'))) ||
    (a.text && (a.text.toLowerCase().includes('force') || a.text.toLowerCase().includes('special') || a.text.toLowerCase().includes('talk about me'))) ||
    [5, 10, 11, 14, 15].includes(a.id)
  );

  // Check past ratings from feedbackHistory (e.g. feedbackHistory['sleep'] = 'helpful')
  const sleepFeedback = feedbackHistory['sleep'] || null;
  const groundingFeedback = feedbackHistory['grounding'] || null;
  const behavioralFeedback = feedbackHistory['behavioral'] || null;
  const breathingFeedback = feedbackHistory['breathing'] || null;

  const recommendations = [];

  // 1. Sleep Recommendation
  let sleepTitle = !isSchiz
    ? (hasSleepIssue ? 'Circadian Stabilization & Dark Therapy' : 'Bipolar Circadian Sleep Routine')
    : (hasSleepIssue ? 'Sensory De-escalation & Sleep Anchoring' : 'Consistent Circadian Sleep Schedule');
  let sleepBadge = sleepFeedback === 'helpful'
    ? '⭐ User Verified Helpful'
    : (hasSleepIssue ? '⚡ Matched to Your Sleep Responses' : '🌙 Circadian Hygiene');
  let sleepText = !isSchiz
    ? (hasSleepIssue 
        ? 'You reported periods of little sleep with elevated energy. In bipolar spectrum conditions, sleep reduction is a primary trigger for manic escalation. Enforcing circadian dark cues stabilizes brain rhythms.'
        : 'Maintaining regular bed and wake times protects mood stability and buffers against circadian-induced cycling.')
    : (hasSleepIssue
        ? 'Evening sensory dimming reduces nighttime cognitive fatigue and perceptual vulnerability.'
        : 'Consistent circadian sleep cycles buffer cognitive resilience and sensory processing thresholds.');

  if (sleepFeedback === 'helpful') {
    sleepText += ' (Based on your positive feedback, continue prioritizing dark cues and fixed morning wake anchors.)';
  } else if (sleepFeedback === 'not_helpful') {
    sleepTitle = 'Alternative: Stimulus Control Sleep Routine';
    sleepBadge = '🔄 Adapted Based on Feedback';
    sleepText = 'Because you previously found dark therapy alone less helpful, we emphasize stimulus control: leave bed if awake after 20 minutes to break sleep-frustration associations.';
  }

  recommendations.push({
    id: 'sleep',
    title: sleepTitle,
    category: 'Circadian Sleep',
    badgeText: sleepBadge,
    text: sleepText,
    isFeedbackHelpful: sleepFeedback === 'helpful',
    userRating: sleepFeedback,
    guides: !isSchiz ? [
      "Dark Therapy: Dim ambient lighting 2 hours before target sleep time.",
      "Rest in Bed: Keep eyes rested in quiet darkness even if sleep is delayed.",
      "Fixed Wake Anchor: Wake at the exact same hour daily regardless of sleep duration."
    ] : [
      "Sensory Wind-Down: Switch off digital media 45 minutes before sleep.",
      "Fixed Wake Anchor: Anchor neurotransmitter balance with regular morning light.",
      "Quiet Sleep Sanctuary: Keep the sleeping environment dark, cool, and ventilated."
    ]
  });

  // 2. Cognitive Pacing / Sensory Grounding Recommendation
  let groundTitle = !isSchiz
    ? (hasPerceptualSensory || hasRacingThoughts ? '5-4-3-2-1 Sensory Grounding Practice' : 'Mindful Mental Pacing')
    : (hasRacingThoughts ? 'Cognitive Deceleration & Thought Pacing' : 'Mindful Mental Pacing');
  let groundBadge = groundingFeedback === 'helpful'
    ? '⭐ User Verified Helpful'
    : (hasPerceptualSensory ? '🌿 Matched to Sensory Responses' : '🧘 Grounding Habit');
  let groundText = !isSchiz
    ? (hasPerceptualSensory
        ? 'You noted heightened sensory variations. Concrete grounding exercises anchor attention to physical reality.'
        : 'A structured mindfulness habit to center mental focus and reduce fatigue.')
    : (hasRacingThoughts
        ? 'You endorsed thoughts racing faster than usual. Structured thought pauses prevent mental over-acceleration.'
        : 'Brief mental pauses prevent cognitive over-stimulation.');

  if (groundingFeedback === 'helpful') {
    groundText += ' (You marked this practice helpful in a prior session—maintain regular repetition during stressful phases.)';
  } else if (groundingFeedback === 'not_helpful') {
    groundTitle = 'Alternative: Somatosensory Box Breathing Grounding';
    groundBadge = '🔄 Adapted Based on Feedback';
    groundText = 'Adapted for active physical engagement: use tactile pressure on the palms and structured box breathing instead of passive observation.';
  }

  recommendations.push({
    id: 'grounding',
    title: groundTitle,
    category: 'Sensory Grounding',
    badgeText: groundBadge,
    text: groundText,
    isFeedbackHelpful: groundingFeedback === 'helpful',
    userRating: groundingFeedback,
    guides: [
      "Notice 5 visible objects in your room.",
      "Notice 4 physical textures you can touch.",
      "Notice 3 ambient room sounds.",
      "Take 2 slow, balanced breaths.",
      "Affirm: 'I am grounded in this present room right now.'"
    ]
  });

  // 3. Behavioral Safeguards / Reality Testing
  let behavTitle = !isSchiz
    ? (hasIdeationalBeliefs ? 'Cognitive Flexibility & Peer Reality-Checking' : 'Gentle Daily Walking Routine')
    : (hasHighEnergyImpulse ? 'The 48-Hour Decision Rule & Financial Guardrails' : 'Structured Daily Scheduling');
  let behavBadge = behavioralFeedback === 'helpful'
    ? '⭐ User Verified Helpful'
    : (hasHighEnergyImpulse ? '⚡ Matched to Impulsivity' : '💡 Decision Guardrails');
  let behavText = !isSchiz
    ? (hasIdeationalBeliefs
        ? 'When thoughts or coincidences feel imbued with intense hidden meaning, checking in with trusted peers maintains perspective.'
        : 'A 20-minute rhythmic walk in daylight grounds nervous system tone.')
    : (hasHighEnergyImpulse
        ? 'You endorsed energy surges or impulsive spending. Structured 48-hour delays safeguard against regretful commitments.'
        : 'Daily schedules keep active energy channeled constructively.');

  if (behavioralFeedback === 'helpful') {
    behavText += ' (You found this behavioral rule effective in earlier reviews—keep your designated accountability partner active.)';
  } else if (behavioralFeedback === 'not_helpful') {
    behavTitle = 'Alternative: Micro-Pacing & Sensory Pause Routine';
    behavBadge = '🔄 Adapted Based on Feedback';
    behavText = 'Because multi-day delays felt restrictive in prior practice, we suggest micro-pacing: introduce a 15-minute physical walk before high-consequence decisions rather than rigid multi-day holds.';
  }

  recommendations.push({
    id: 'behavioral',
    title: behavTitle,
    category: 'Behavioral Safeguards',
    badgeText: behavBadge,
    text: behavText,
    isFeedbackHelpful: behavioralFeedback === 'helpful',
    userRating: behavioralFeedback,
    guides: !isSchiz ? [
      "The 48-Hour Delay: Wait two days before acting on sudden major purchases or life changes.",
      "Trusted Sounding Board: Review decisions with a close family member or mentor.",
      "Card Guardrails: Keep daily transaction limits conservative during high-energy periods."
    ] : [
      "Curious Non-Judgment: Observe unusual impressions without immediately accepting them as literal facts.",
      "Peer Check: Ask a trusted confidant if they notice what you are experiencing.",
      "Stress Reset: Notice whether sensations spike during exams, deadlines, or lack of sleep."
    ]
  });

  // 4. Autonomic Breathing / Vagal Regulation
  let breathTitle = 'Guided 4-7-8 Breathing Pacing';
  let breathBadge = breathingFeedback === 'helpful' ? '⭐ User Verified Helpful' : '💨 Vagal Regulation';
  let breathText = breathingFeedback === 'helpful'
    ? 'A verified helpful technique for you: Inhale quietly for 4 seconds, hold gently for 7, exhale smoothly for 8 seconds to activate your parasympathetic vagal brake.'
    : 'A calming pacing technique to reduce autonomic sympathetic overdrive, lower physical heart rate variability stress, and center the nervous system.';

  if (breathingFeedback === 'not_helpful') {
    breathTitle = 'Alternative: Physiological Sigh Pacing';
    breathBadge = '🔄 Adapted Based on Feedback';
    breathText = 'Because extended breath holding felt uncomfortable, try the double-inhalation physiological sigh: two quick nasal inhales followed by one long, slow mouth exhalation.';
  }

  recommendations.push({
    id: 'breathing',
    title: breathTitle,
    category: 'Autonomic Regulation',
    badgeText: breathBadge,
    text: breathText,
    isFeedbackHelpful: breathingFeedback === 'helpful',
    userRating: breathingFeedback,
    guides: [
      "Empty lungs completely with a gentle whoosh.",
      "Inhale silently through the nose for 4 counts.",
      "Hold the breath comfortably for 7 counts.",
      "Exhale audibly through the mouth for 8 counts.",
      "Repeat the cycle 4 times consecutively."
    ]
  });

  return recommendations;
}

/**
 * Calculates longitudinal comparison between two historical screening records
 */
export function calculateLongitudinalComparison(earlierRecord, laterRecord) {
  if (!earlierRecord || !laterRecord) return null;

  const s1 = typeof earlierRecord.score === 'number' ? earlierRecord.score : (earlierRecord.symptom_count ?? 0);
  const s2 = typeof laterRecord.score === 'number' ? laterRecord.score : (laterRecord.symptom_count ?? 0);
  const deltaScore = s2 - s1;

  const d1 = earlierRecord.distress_score ?? 0;
  const d2 = laterRecord.distress_score ?? 0;
  const deltaDistress = d2 - d1;

  let scoreDirection = 'stable';
  if (deltaScore < 0) scoreDirection = 'decreased';
  else if (deltaScore > 0) scoreDirection = 'increased';

  const answers1 = Array.isArray(earlierRecord.answers) ? earlierRecord.answers : [];
  const answers2 = Array.isArray(laterRecord.answers) ? laterRecord.answers : [];

  const map1 = {};
  answers1.forEach(a => {
    const id = a.id || a.questionNumber;
    if (id) map1[id] = a.answer === 'True' || a.isTrue === true || a.endorsed === true;
  });

  const map2 = {};
  answers2.forEach(a => {
    const id = a.id || a.questionNumber;
    if (id) map2[id] = a.answer === 'True' || a.isTrue === true || a.endorsed === true;
  });

  const newlyEndorsed = [];
  const resolvedSymptoms = [];
  const persistentSymptoms = [];

  const allIds = Array.from(new Set([...Object.keys(map1), ...Object.keys(map2)])).map(Number).sort((a, b) => a - b);

  allIds.forEach(id => {
    const wasTrue = map1[id] === true;
    const isTrue = map2[id] === true;
    const qObj = answers2.find(a => (a.id || a.questionNumber) === id) || answers1.find(a => (a.id || a.questionNumber) === id);
    const text = qObj ? (qObj.text || qObj.questionText || `Question ${id}`) : `Question ${id}`;
    const domain = qObj ? qObj.domain : null;

    if (!wasTrue && isTrue) {
      newlyEndorsed.push({ id, text, domain });
    } else if (wasTrue && !isTrue) {
      resolvedSymptoms.push({ id, text, domain });
    } else if (wasTrue && isTrue) {
      persistentSymptoms.push({ id, text, domain });
    }
  });

  // Calculate elapsed days
  const date1 = new Date(earlierRecord.date || earlierRecord.created_at || Date.now());
  const date2 = new Date(laterRecord.date || laterRecord.created_at || Date.now());
  const daysElapsed = Math.max(0, Math.round((date2 - date1) / (1000 * 60 * 60 * 24)));

  return {
    assessmentType: laterRecord.assessment_type || earlierRecord.assessment_type || 'schizophrenia',
    daysElapsed,
    earlier: {
      date: earlierRecord.date || 'Previous',
      score: s1,
      maxScore: earlierRecord.max_score || earlierRecord.maxScore || 16,
      distressScore: d1,
      category: earlierRecord.result_category || earlierRecord.category || 'Minimal'
    },
    later: {
      date: laterRecord.date || 'Current',
      score: s2,
      maxScore: laterRecord.max_score || laterRecord.maxScore || 16,
      distressScore: d2,
      category: laterRecord.result_category || laterRecord.category || 'Minimal'
    },
    previousScore: s1,
    currentScore: s2,
    previousDistress: d1,
    currentDistress: d2,
    deltaScore,
    deltaDistress,
    scoreDirection,
    percentageChange: s1 > 0 ? Math.round((deltaScore / s1) * 100) : (deltaScore > 0 ? 100 : 0),
    symptomShifts: {
      newlyEndorsed,
      resolvedSymptoms,
      persistentSymptoms,
      newCount: newlyEndorsed.length,
      resolvedCount: resolvedSymptoms.length,
      persistentCount: persistentSymptoms.length
    },
    clinicalDisclaimer: "Longitudinal comparison displays self-reported screening trends over time. Differences reflect variations in survey endorsement rather than confirmed clinical diagnosis or illness remission."
  };
}

/**
 * Generates personalized longitudinal insights based on all history sessions and recommendation feedback
 */
export function generatePersonalizedInsights(history = [], feedback = []) {
  if (!history || history.length === 0) {
    return {
      hasHistory: false,
      totalAssessments: 0,
      narrativeInsights: []
    };
  }

  // Sort chronologically ascending
  const sorted = [...history].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
  const count = sorted.length;
  const firstSession = sorted[0];
  const latestSession = sorted[sorted.length - 1];

  const firstScore = firstSession.score ?? firstSession.symptom_count ?? 0;
  const latestScore = latestSession.score ?? latestSession.symptom_count ?? 0;
  const delta = latestScore - firstScore;

  let trend = 'stable';
  if (delta < -1) trend = 'decreasing';
  else if (delta > 1) trend = 'increasing';

  // Analyze recurring symptoms
  const symptomFreq = {};
  const symptomObjMap = {};

  sorted.forEach(rec => {
    const answers = Array.isArray(rec.answers) ? rec.answers : [];
    answers.forEach(a => {
      if (a && (a.answer === 'True' || a.isTrue === true || a.endorsed === true)) {
        const id = a.id || a.questionNumber;
        symptomFreq[id] = (symptomFreq[id] || 0) + 1;
        if (!symptomObjMap[id]) {
          symptomObjMap[id] = {
            id,
            text: a.text || a.questionText || `Item ${id}`,
            domain: a.domain || 'Clinical Dimension'
          };
        }
      }
    });
  });

  const recurringList = Object.keys(symptomFreq)
    .filter(k => symptomFreq[k] >= 2)
    .map(k => ({
      ...symptomObjMap[k],
      count: symptomFreq[k],
      percentage: Math.round((symptomFreq[k] / count) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Identify helpful recommendations (accepts both array or map object)
  const feedbackArray = Array.isArray(feedback)
    ? feedback
    : (feedback && typeof feedback === 'object'
        ? Object.entries(feedback).map(([k, v]) => (typeof v === 'object' ? v : { recommendation_key: k, rating: v }))
        : []);

  const helpfulList = feedbackArray
    .filter(f => f && (f.rating === 'helpful' || f.userRating === 'helpful'))
    .map(f => f.recommendation_title || f.recommendation_key || 'Self-regulation practice');

  const narrativeInsights = [];

  if (count === 1) {
    narrativeInsights.push({
      type: 'baseline',
      category: 'Baseline',
      title: 'Initial Assessment Baseline Established',
      description: `Your initial screening established a baseline endorsement score of ${firstScore}/${firstSession.max_score || 16} (${firstSession.result_category || 'Assessed'}). Completing future assessments at periodic intervals will construct an interactive longitudinal trend map.`
    });
  } else {
    if (trend === 'decreasing') {
      narrativeInsights.push({
        type: 'trajectory',
        category: 'Trajectory',
        title: 'Decreasing Symptom Endorsement Trend',
        description: `Across your ${count} assessments, your endorsed symptom count changed from ${firstScore} to ${latestScore} (-${Math.abs(delta)} points). You are reporting fewer active sensations in recent screenings.`
      });
    } else if (trend === 'increasing') {
      narrativeInsights.push({
        type: 'trajectory',
        category: 'Trajectory',
        title: 'Increased Symptom Endorsement Observed',
        description: `Your endorsed symptom count shifted from ${firstScore} to ${latestScore} (+${delta} points). Consider discussing these sensations with a healthcare provider or licensed counselor for personalized guidance.`
      });
    } else {
      narrativeInsights.push({
        type: 'trajectory',
        category: 'Trajectory',
        title: 'Stable Screening Pattern Over Time',
        description: `Your self-reported screening scores have remained relatively steady across ${count} sessions (latest: ${latestScore}), indicating a consistent self-reflection baseline.`
      });
    }

    if (recurringList.length > 0) {
      narrativeInsights.push({
        type: 'recurring',
        category: 'Recurring Patterns',
        title: `${recurringList.length} Persistent Symptom Dimension${recurringList.length > 1 ? 's' : ''}`,
        description: `Sensations like "${recurringList[0].text}" were endorsed in ${recurringList[0].count} of your ${count} screenings (${recurringList[0].percentage}% consistency), identifying this as a primary focal area.`
      });
    }

    if (helpfulList.length > 0) {
      narrativeInsights.push({
        type: 'recommendation_synergy',
        category: 'Strategy Synergy',
        title: 'Self-Care Strategy Alignment',
        description: `You recorded that protocols such as "${helpfulList[0]}" were helpful. Maintaining consistent application of strategies you find personally effective supports daily resilience.`
      });
    }
  }

  return {
    hasHistory: true,
    totalAssessments: count,
    overallTrend: trend,
    firstSessionDate: firstSession.date || 'First Session',
    latestSessionDate: latestSession.date || 'Latest Session',
    recurringSymptoms: recurringList,
    helpfulRecommendations: helpfulList,
    narrativeInsights,
    insights: narrativeInsights,
    clinicalDisclaimer: "These observations represent automated self-assessment response trends. They do not constitute a psychiatric diagnosis, clinical prognosis, or treatment plan."
  };
}
