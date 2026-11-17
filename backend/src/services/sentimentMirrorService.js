const vader = require('vader-sentiment');

// Emotional Lexicon with weighted indicators and evidence matchers
const EMOTIONAL_LEXICON = {
  Stress: {
    weight: 1.0,
    terms: ['stress', 'stressed', 'stressful', 'overwhelm', 'overwhelmed', 'burnout', 'burnt out', 'pressure', 'deadline', 'swamped', 'exhausted', 'drowning in', 'too much work', 'can\'t keep up', 'taxing']
  },
  Sadness: {
    weight: 1.0,
    terms: ['sad', 'sadness', 'crying', 'cried', 'heartbroken', 'grief', 'sorrow', 'lonely', 'alone', 'despair', 'hopeless', 'empty', 'depressed', 'gloomy', 'tears', 'hurting inside', 'down']
  },
  Anxiety: {
    weight: 1.0,
    terms: ['anxious', 'anxiety', 'panic', 'panicking', 'worried', 'worry', 'nervous', 'fear', 'afraid', 'scared', 'dread', 'racing thoughts', 'uneasy', 'on edge', 'restless', 'shaking', 'jittery']
  },
  Frustration: {
    weight: 1.0,
    terms: ['frustrated', 'frustration', 'annoyed', 'angry', 'mad', 'furious', 'irritated', 'stuck', 'unfair', 'resentful', 'fed up', 'screwed up', 'hate this', 'irritating', 'aggravated']
  },
  Happiness: {
    weight: 1.0,
    terms: ['happy', 'happiness', 'joy', 'joyful', 'grateful', 'gratitude', 'peace', 'peaceful', 'calm', 'excited', 'proud', 'accomplished', 'relaxed', 'smiling', 'blessed', 'content', 'optimistic', 'wonderful', 'inspired', 'relieved']
  }
};

// CBT Cognitive Distortion Rules & Pattern Matchers
const DISTORTION_RULES = [
  {
    pattern: 'Catastrophizing',
    name: 'Catastrophizing',
    explanation: 'Anticipating the absolute worst-case scenario and assuming an outcome will be intolerable or disastrous.',
    regexes: [
      /(everything\s+is\s+(completely\s+|totally\s+)?ruined)/i,
      /(my\s+life\s+is\s+over)/i,
      /(it'?s\s+(the\s+)?end\s+of\s+the\s+world)/i,
      /(complete(ly)?\s+disaster)/i,
      /(never\s+be\s+happy\s+again)/i,
      /(nothing\s+will\s+ever\s+be\s+okay)/i,
      /(ruined\s+my\s+whole\s+life)/i,
      /(worst\s+thing\s+that\s+could\s+ever\s+happen)/i,
      /(can'?t\s+survive\s+this)/i,
      /(i'?m\s+doomed)/i,
      /((scared|terrified|hopeless|dreading)\s+(about\s+)?(my\s+)?(future|life))/i,
      /((i\s+will|i'?ll)\s+fail\s+(all|everything))/i
    ]
  },
  {
    pattern: 'All-or-Nothing Thinking',
    name: 'All-or-Nothing Thinking',
    explanation: 'Viewing situations in polarized, black-and-white categories with no middle ground or room for nuance.',
    regexes: [
      /(i\s+am\s+a\s+complete\s+failure)/i,
      /(everything\s+i\s+do\s+fails)/i,
      /(total\s+mess)/i,
      /(everyone\s+hates\s+me)/i,
      /(nobody\s+(ever\s+)?cares(\s+about\s+me)?)/i,
      /(i\s+always\s+(mess\s+up|fail|ruin|screw\s+up))/i,
      /(i\s+never\s+(do\s+anything\s+right|succeed|get\s+it\s+right))/i,
      /(nothing\s+(ever\s+)?works)/i,
      /(either\s+.+\s+or\s+(i\s+am\s+)?nothing)/i,
      /(100%\s+my\s+fault)/i,
      /(fail(ing)?\s+all\s+(my\s+)?(subjects|classes|tests|exams|goals))/i,
      /((i\s+will|i'?ll)\s+fail\s+all)/i
    ]
  },
  {
    pattern: 'Overgeneralization',
    name: 'Overgeneralization',
    explanation: 'Taking a single negative incident or setback as an unending, permanent pattern of defeat.',
    regexes: [
      /(nothing\s+ever\s+goes\s+right)/i,
      /(every\s+single\s+time(\s+i\s+try)?)/i,
      /(this\s+always\s+happens\s+to\s+me)/i,
      /(all\s+(people|men|women|friends)\s+(always\s+)?(leave|betray|disappoint))/i,
      /(i'?ll\s+never\s+(find|achieve|pass|get\s+better))/i,
      /(just\s+the\s+story\s+of\s+my\s+life)/i,
      /(fail\s+all\s+my)/i
    ]
  },
  {
    pattern: 'Mind Reading',
    name: 'Mind Reading',
    explanation: 'Assuming you know that others are judging, disapproving of, or disliking you without direct confirmation.',
    regexes: [
      /(they\s+(all\s+)?think\s+i'?m\s+(stupid|incompetent|weird|worthless|lazy))/i,
      /(everyone\s+is\s+(secretly\s+)?judging\s+me)/i,
      /(everyone\s+is\s+laughing\s+at\s+me)/i,
      /(she\s+(secretly\s+)?thinks\s+i'?m)/i,
      /(he\s+(secretly\s+)?hates\s+me)/i,
      /(they\s+must\s+think\s+i\s+am)/i,
      /(i\s+know\s+they\s+don'?t\s+like\s+me)/i,
      /((everyone|everybody|people|they|she|he)\s+(must|probably|surely|all)?\s*think\s+(that\s+)?i'?m\s+(stupid|useless|dumb|a failure|ugly|weird|lazy|bad|incompetent))/i
    ]
  },
  {
    pattern: 'Emotional Reasoning',
    name: 'Emotional Reasoning',
    explanation: 'Assuming that intense negative feelings automatically reflect objective external truth ("I feel it, therefore it must be true").',
    regexes: [
      /(i\s+feel\s+like\s+a\s+failure(\s*,?\s*so\s+i\s+(must\s+be|am)))/i,
      /(i\s+feel\s+so\s+(worthless|hopeless|stupid)\s+(so|that)\s+there'?s\s+no\s+point)/i,
      /(because\s+i\s+feel\s+(scared|anxious)\s*,?\s*it\s+must\s+be\s+dangerous)/i,
      /(feeling\s+guilty\s+means\s+i\s+am\s+(bad|terrible))/i,
      /(i\s+just\s+feel\s+it'?s\s+hopeless\s+so\s+it\s+is)/i,
      /(i\s+feel\s+(like\s+)?i'?m\s+(useless|worthless|stupid|a failure|incapable|broken))/i
    ]
  },
  {
    pattern: 'Labeling',
    name: 'Labeling',
    explanation: 'Assigning a fixed, global, derogatory label to yourself or others based on a specific mistake or shortcoming.',
    regexes: [
      /(i'?m\s+(such\s+)?a\s+(loser|fool|idiot|failure|screwup|burden))/i,
      /(i\s+am\s+(worthless|useless|defective|broken))/i,
      /(i\s+am\s+such\s+an\s+idiot)/i,
      /(they\s+are\s+(all\s+)?(evil|monsters|garbage))/i,
      /(feel\s+like\s+i'?m\s+(useless|worthless|stupid|an idiot|a loser|a failure))/i,
      /(i'?m\s+(just\s+|completely\s+)?(useless|worthless|stupid|dumb|defective))/i
    ]
  }
];

/**
 * 1. Analyze Sentiment using VADER NLP
 */
function analyzeSentimentVader(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      label: 'Neutral',
      compound: 0,
      positive: 0,
      neutral: 1,
      negative: 0,
      intensityPercent: 0
    };
  }

  const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const compound = Number(scores.compound.toFixed(4));
  let label = 'Neutral';

  if (compound >= 0.05) {
    label = 'Positive';
  } else if (compound <= -0.05) {
    label = 'Negative';
  }

  const intensityPercent = Math.min(100, Math.round(Math.abs(compound) * 100));

  return {
    label,
    compound,
    positive: scores.pos,
    neutral: scores.neu,
    negative: scores.neg,
    intensityPercent
  };
}

/**
 * 2. Extract Emotional Themes from actual text
 */
function extractEmotionalThemes(text) {
  if (!text || typeof text !== 'string') return [];

  const lower = text.toLowerCase();
  const detected = [];

  for (const [theme, config] of Object.entries(EMOTIONAL_LEXICON)) {
    const matchedEvidence = [];
    for (const term of config.terms) {
      // Word boundary check or substring match for phrases
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(lower)) {
        matchedEvidence.push(term);
      }
    }

    if (matchedEvidence.length > 0) {
      const matchCount = matchedEvidence.length;
      let intensity = 'Mild';
      if (matchCount >= 3) intensity = 'High';
      else if (matchCount === 2) intensity = 'Moderate';

      const confidence = Number((Math.min(1.0, 0.5 + matchCount * 0.18)).toFixed(2));

      detected.push({
        theme,
        intensity,
        confidence,
        evidence: Array.from(new Set(matchedEvidence))
      });
    }
  }

  // Sort by highest confidence
  return detected.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 3. Detect Cognitive Distortions
 * Crucial rule: Does not force a label if no clear pattern is found.
 */
function detectCognitiveDistortions(text) {
  if (!text || typeof text !== 'string') return [];

  const distortions = [];

  for (const rule of DISTORTION_RULES) {
    for (const reg of rule.regexes) {
      const match = text.match(reg);
      if (match) {
        distortions.push({
          pattern: rule.name,
          explanation: rule.explanation,
          evidence: match[0]
        });
        break; // One match per category is sufficient
      }
    }
  }

  return distortions;
}

/**
 * 4. Cognitive Reframing Generator
 * Generates personalized, balanced alternative perspective + reflection question.
 * Uses Gemini API when available, or clinical evidence-grounded CBT synthesizer fallback.
 */
async function generateCognitiveReframe(text, distortions, sentiment) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() && !apiKey.includes('your_gemini_api_key')) {
    try {
      const distortionSummary = distortions.length > 0 
        ? distortions.map(d => `${d.pattern} (evidence: "${d.evidence}")`).join(', ')
        : 'General negative or stressed self-talk';

      const prompt = `You are a clinical Cognitive Behavioral Therapy (CBT) specialist assisting in an AI Sentiment Mirror.
User's Journal Entry:
"${text.slice(0, 1000)}"

Detected Thinking Pattern(s):
${distortionSummary}

Overall Sentiment: ${sentiment.label} (Compound score: ${sentiment.compound})

Generate a deeply personalized, compassionate, and balanced Cognitive Reframe based strictly on the user's actual situation and words.
Requirements:
1. "balanced_perspective": A compassionate, realistic alternative perspective that gently challenges the automatic negative thought without dismissive toxic positivity (2-4 sentences).
2. "reflection_question": A targeted, non-threatening reflection question for the user to examine their evidence or alternative possibilities.

Respond ONLY with valid JSON in this exact structure:
{
  "balanced_perspective": "...",
  "reflection_question": "..."
}`;

      const candidateModels = [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-3-flash-preview'
      ];
      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4500);

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 350,
                responseMimeType: "application/json"
              }
            })
          });
          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
              if (parsed.balanced_perspective && parsed.reflection_question) {
                return {
                  balanced_perspective: parsed.balanced_perspective.trim(),
                  reflection_question: parsed.reflection_question.trim(),
                  source: `AI-Synthesized CBT Reframe (${model})`
                };
              }
            }
          }
        } catch (mErr) {
          // Continue to next model or template fallback
        }
      }
    } catch (apiErr) {
      console.warn('Gemini reframe failed, using clinical CBT template fallback:', apiErr.message);
    }
  }

  // Clinical CBT Template Synthesizer Fallback (Tailored to actual evidence and patterns)
  return buildClinicalFallbackReframe(text, distortions, sentiment);
}

function buildClinicalFallbackReframe(text, distortions, sentiment) {
  if (distortions.length === 0) {
    if (sentiment.label === 'Positive') {
      return {
        balanced_perspective: 'Your reflections demonstrate moments of resilience and gratitude. Acknowledging what is working well reinforces self-efficacy and psychological stability.',
        reflection_question: 'What specific action or boundary helped you cultivate this grounded space today, and how can you preserve it tomorrow?',
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    }

    return {
      balanced_perspective: 'Experiencing complex feelings is a natural human response to stress. While the present challenge feels heavy, your current emotional state represents a temporary snapshot, not your permanent capacity to navigate difficulties.',
      reflection_question: 'If you stepped back from this moment, what is one compassionate, small step you could take today to care for yourself?',
      source: 'Evidence-Grounded CBT Reframing Engine'
    };
  }

  const primary = distortions[0];
  const evQuote = primary.evidence ? `"${primary.evidence}"` : 'this thought';

  switch (primary.pattern) {
    case 'Catastrophizing':
      return {
        balanced_perspective: `When your mind focuses on catastrophic outcomes like ${evQuote}, it is attempting to protect you from uncertainty by predicting the worst. In reality, setbacks are rarely all-or-nothing disasters. You have navigated difficult hurdles in the past, and realistic middle-ground solutions almost always exist.`,
        reflection_question: `What is the most likely, realistic scenario here—and what is one coping resource you can rely on if things don't go perfectly?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    case 'All-or-Nothing Thinking':
      return {
        balanced_perspective: `Thinking in terms of absolute terms like ${evQuote} overlooks the rich spectrum between absolute success and total failure. Growth and daily life happen almost entirely in the middle shades. A specific stumble does not erase your continuous effort or worth.`,
        reflection_question: `What is a more nuanced, 'both/and' way to describe this situation instead of viewing it as a complete win or loss?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    case 'Overgeneralization':
      return {
        balanced_perspective: `Concluding that ${evQuote} turns a single isolated incident into a permanent rule. One difficult day, task, or interaction does not dictate the outcome of future attempts. Each day offers fresh variables and choices.`,
        reflection_question: `Can you recall a time in the past when an initial hurdle did not prevent you from making meaningful progress later?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    case 'Mind Reading':
      return {
        balanced_perspective: `Believing that ${evQuote} assumes knowledge of other people's unspoken inner thoughts. Most people are absorbed in managing their own anxieties and responsibilities rather than judging others. Unless directly verified, our assumptions about others often project our own internal fears.`,
        reflection_question: `Do you have concrete, verifiable facts that confirm this assumption, or could there be another reason for their behavior?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    case 'Emotional Reasoning':
      return {
        balanced_perspective: `Intense feelings are real and deserve validation, but feelings are not objective facts. Saying ${evQuote} reflects your present emotional fatigue, not an immutable truth about your abilities or your future.`,
        reflection_question: `If you separated how you feel right now from what the objective facts actually show, what does the evidence say?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    case 'Labeling':
      return {
        balanced_perspective: `Assigning a harsh label like ${evQuote} reduces your multifaceted human experience down to a single moment of struggle. You are a person who experiences setbacks, not the setback itself. Self-criticism does not foster growth; realistic self-compassion does.`,
        reflection_question: `If a close friend made this exact same mistake, what words of understanding and perspective would you offer them?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
    default:
      return {
        balanced_perspective: `Notice the thought ${evQuote} without judging yourself for having it. Thoughts are mental events, not orders or objective facts. By stepping into the observer seat, you can choose how much weight to give this impression.`,
        reflection_question: `What is a calmer, more balanced perspective that gives you space to breathe and problem-solve?`,
        source: 'Evidence-Grounded CBT Reframing Engine'
      };
  }
}

/**
 * 5. Full Journal Analysis Pipeline
 */
async function analyzeJournalEntry(text) {
  const sentiment = analyzeSentimentVader(text);
  const emotions = extractEmotionalThemes(text);
  const distortions = detectCognitiveDistortions(text);
  const reframe = await generateCognitiveReframe(text, distortions, sentiment);

  return {
    sentiment,
    emotions,
    distortions,
    reframe,
    analyzed_at: new Date().toISOString()
  };
}

/**
 * 6. Trend Trajectory & Mood Prediction Engine
 * Computes forward trajectory only when >= 3 historical entries are available.
 */
function predictMoodTrajectory(journalRecords = [], moodRecords = []) {
  const combinedDataPoints = [];

  // 1. Process Journal Entries
  for (const j of journalRecords) {
    let compound = 0;
    try {
      if (j.sentiment_details) {
        const parsed = typeof j.sentiment_details === 'string' ? JSON.parse(j.sentiment_details) : j.sentiment_details;
        compound = parsed?.sentiment?.compound ?? 0;
      }
    } catch {}

    combinedDataPoints.push({
      date: j.created_at,
      timestamp: new Date(j.created_at).getTime(),
      type: 'journal',
      score: compound // Normalized -1.0 to +1.0
    });
  }

  // 2. Process Mood Records
  const moodScoreMap = {
    'Very Happy': 1.0,
    'Happy': 0.5,
    'Neutral': 0.0,
    'Sad': -0.5,
    'Very Sad': -1.0
  };

  for (const m of moodRecords) {
    const normScore = moodScoreMap[m.mood] ?? (m.mood_score ? (m.mood_score - 3) / 2 : 0);
    combinedDataPoints.push({
      date: m.created_at,
      timestamp: new Date(m.created_at).getTime(),
      type: 'mood',
      score: normScore
    });
  }

  // Sort chronologically
  combinedDataPoints.sort((a, b) => a.timestamp - b.timestamp);

  const totalPoints = combinedDataPoints.length;

  // Strict insufficient data check (< 3 entries)
  if (totalPoints < 3) {
    return {
      sufficient_data: false,
      min_required: 3,
      current_count: totalPoints,
      message: 'Insufficient historical data to estimate a trend trajectory. At least 3 journal entries or mood logs are required.',
      prediction: null
    };
  }

  // Extract scores in chronological sequence
  const scores = combinedDataPoints.map(p => p.score);
  const n = scores.length;

  // Calculate Simple Linear Regression Slope: y = mx + c
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const recentSlice = scores.slice(-5);
  const recentAvg = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;

  // Calculate Variance (Volatility)
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - (sumY / n), 2), 0) / n;
  let stabilityIndex = 'High Stability';
  if (variance > 0.45) stabilityIndex = 'High Volatility';
  else if (variance > 0.20) stabilityIndex = 'Moderate Variance';

  // Determine Trajectory Pattern
  let trajectory = 'Stable / Balanced';
  let predictedRange = '+0.0 to +0.3 (Neutral-Positive)';

  if (slope > 0.08) {
    trajectory = 'Improving / Upward';
    predictedRange = `+${Math.max(0.1, recentAvg + 0.1).toFixed(2)} to +${Math.min(1.0, recentAvg + 0.35).toFixed(2)} (Favorable Sentiment)`;
  } else if (slope < -0.08) {
    trajectory = 'Declining / Vulnerable';
    predictedRange = `${Math.max(-1.0, recentAvg - 0.35).toFixed(2)} to ${Math.min(-0.05, recentAvg - 0.1).toFixed(2)} (Cautionary Attention)`;
  } else if (stabilityIndex === 'High Volatility') {
    trajectory = 'Fluctuating / Variable';
    predictedRange = '-0.30 to +0.40 (Dynamic Cycling)';
  } else {
    trajectory = 'Stable / Balanced';
    predictedRange = `${(recentAvg - 0.15).toFixed(2)} to ${(recentAvg + 0.15).toFixed(2)} (Steady Baseline)`;
  }

  return {
    sufficient_data: true,
    min_required: 3,
    current_count: totalPoints,
    prediction: {
      trajectory,
      stability_index: stabilityIndex,
      momentum_slope: Number(slope.toFixed(3)),
      current_valence_avg: Number(recentAvg.toFixed(2)),
      projected_7d_range: predictedRange,
      data_points_analyzed: totalPoints,
      forecast_basis: 'Time-series weighted moving slope on user sentiment and mood records.',
      disclaimer: 'This trend prediction is an AI-assisted statistical trajectory estimation for personal self-awareness. It does not constitute a psychiatric forecast or clinical diagnosis.'
    }
  };
}

module.exports = {
  analyzeSentimentVader,
  extractEmotionalThemes,
  detectCognitiveDistortions,
  generateCognitiveReframe,
  analyzeJournalEntry,
  predictMoodTrajectory
};
