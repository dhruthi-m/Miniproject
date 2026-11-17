// Client-Side Fallback & Instant Preview Analyzer for MindWave Sentiment Mirror

const EMOTIONAL_KEYWORDS = {
  Stress: ['stress', 'stressed', 'stressful', 'overwhelm', 'overwhelmed', 'burnout', 'burnt out', 'pressure', 'deadline', 'exhausted', 'swamped'],
  Sadness: ['sad', 'sadness', 'crying', 'cried', 'heartbroken', 'grief', 'sorrow', 'lonely', 'alone', 'despair', 'hopeless', 'empty', 'depressed', 'down'],
  Anxiety: ['anxious', 'anxiety', 'panic', 'panicking', 'worried', 'worry', 'nervous', 'fear', 'afraid', 'scared', 'dread', 'racing thoughts', 'uneasy', 'on edge'],
  Frustration: ['frustrated', 'frustration', 'annoyed', 'angry', 'mad', 'furious', 'irritated', 'stuck', 'unfair', 'resentful', 'fed up', 'hate this'],
  Happiness: ['happy', 'happiness', 'joy', 'grateful', 'gratitude', 'peace', 'peaceful', 'calm', 'excited', 'proud', 'accomplished', 'relaxed', 'smiling', 'blessed', 'content', 'optimistic']
};

const DISTORTION_PATTERNS = [
  {
    pattern: 'Catastrophizing',
    explanation: 'Anticipating the absolute worst-case scenario and assuming an outcome will be intolerable or disastrous.',
    regexes: [
      /(everything\s+is\s+(completely\s+|totally\s+)?ruined)/i,
      /(my\s+life\s+is\s+over)/i,
      /(it'?s\s+(the\s+)?end\s+of\s+the\s+world)/i,
      /(complete(ly)?\s+disaster)/i,
      /(never\s+be\s+happy\s+again)/i,
      /(nothing\s+will\s+ever\s+be\s+okay)/i,
      /(ruined\s+my\s+whole\s+life)/i,
      /(can'?t\s+survive\s+this)/i,
      /((scared|terrified|hopeless|dreading)\s+(about\s+)?(my\s+)?(future|life))/i,
      /((i\s+will|i'?ll)\s+fail\s+(all|everything))/i
    ]
  },
  {
    pattern: 'All-or-Nothing Thinking',
    explanation: 'Viewing situations in polarized, black-and-white categories with no middle ground or room for nuance.',
    regexes: [
      /(i\s+am\s+a\s+complete\s+failure)/i,
      /(everything\s+i\s+do\s+fails)/i,
      /(total\s+mess)/i,
      /(everyone\s+hates\s+me)/i,
      /(nobody\s+(ever\s+)?cares)/i,
      /(i\s+always\s+(mess\s+up|fail|ruin|screw\s+up))/i,
      /(i\s+never\s+(do\s+anything\s+right|succeed|get\s+it\s+right))/i,
      /(nothing\s+(ever\s+)?works)/i,
      /(100%\s+my\s+fault)/i,
      /(fail(ing)?\s+all\s+(my\s+)?(subjects|classes|tests|exams|goals))/i,
      /((i\s+will|i'?ll)\s+fail\s+all)/i
    ]
  },
  {
    pattern: 'Overgeneralization',
    explanation: 'Taking a single negative incident or setback as an unending, permanent pattern of defeat.',
    regexes: [
      /(nothing\s+ever\s+goes\s+right)/i,
      /(every\s+single\s+time)/i,
      /(this\s+always\s+happens\s+to\s+me)/i,
      /(i'?ll\s+never\s+(find|achieve|pass|get\s+better))/i,
      /(fail\s+all\s+my)/i
    ]
  },
  {
    pattern: 'Mind Reading',
    explanation: 'Assuming you know that others are judging, disapproving of, or disliking you without direct confirmation.',
    regexes: [
      /(they\s+(all\s+)?think\s+i'?m\s+(stupid|incompetent|weird|worthless))/i,
      /(everyone\s+is\s+(secretly\s+)?judging\s+me)/i,
      /(she\s+thinks\s+i'?m)/i,
      /(he\s+hates\s+me)/i,
      /(i\s+know\s+they\s+don'?t\s+like\s+me)/i,
      /((everyone|everybody|people|they|she|he)\s+(must|probably|surely|all)?\s*think\s+(that\s+)?i'?m\s+(stupid|useless|dumb|a failure|ugly|weird|lazy|bad|incompetent))/i
    ]
  },
  {
    pattern: 'Emotional Reasoning',
    explanation: 'Assuming that intense negative feelings automatically reflect objective external truth ("I feel it, therefore it must be true").',
    regexes: [
      /(i\s+feel\s+like\s+a\s+failure(\s*,?\s*so\s+i\s+(must\s+be|am)))/i,
      /(i\s+feel\s+so\s+(worthless|hopeless|stupid)\s+(so|that)\s+there'?s\s+no\s+point)/i,
      /(feeling\s+guilty\s+means\s+i\s+am\s+(bad|terrible))/i,
      /(i\s+feel\s+(like\s+)?i'?m\s+(useless|worthless|stupid|a failure|incapable|broken))/i
    ]
  },
  {
    pattern: 'Labeling',
    explanation: 'Assigning a fixed, global, derogatory label to yourself or others based on a specific mistake or shortcoming.',
    regexes: [
      /(i'?m\s+(such\s+)?a\s+(loser|fool|idiot|failure|screwup))/i,
      /(i\s+am\s+(worthless|useless|defective))/i,
      /(i\s+am\s+such\s+an\s+idiot)/i,
      /(feel\s+like\s+i'?m\s+(useless|worthless|stupid|an idiot|a loser|a failure))/i,
      /(i'?m\s+(just\s+|completely\s+)?(useless|worthless|stupid|dumb|defective))/i
    ]
  }
];

export function clientAnalyzeText(text) {
  if (!text || !text.trim()) {
    return {
      sentiment: { label: 'Neutral', compound: 0, intensityPercent: 0 },
      emotions: [],
      distortions: [],
      reframe: null
    };
  }

  const lower = text.toLowerCase();

  // Basic polarity calculation
  const posWords = ['happy', 'glad', 'great', 'good', 'peaceful', 'calm', 'proud', 'love', 'grateful', 'excited', 'wonderful', 'joy', 'healing', 'relaxed'];
  const negWords = ['sad', 'anxious', 'stress', 'stressed', 'terrible', 'depressed', 'panic', 'hate', 'awful', 'angry', 'fail', 'failed', 'ruined', 'hopeless', 'idiot', 'loser'];

  let posCount = 0;
  let negCount = 0;
  posWords.forEach(w => { if (lower.includes(w)) posCount++; });
  negWords.forEach(w => { if (lower.includes(w)) negCount++; });

  let compound = 0;
  let label = 'Neutral';
  if (posCount > negCount) {
    compound = Math.min(0.9, 0.2 + posCount * 0.2);
    label = 'Positive';
  } else if (negCount > posCount) {
    compound = Math.max(-0.9, -0.2 - negCount * 0.2);
    label = 'Negative';
  }

  // Detect emotions
  const emotions = [];
  for (const [theme, words] of Object.entries(EMOTIONAL_KEYWORDS)) {
    const matched = words.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(lower));
    if (matched.length > 0) {
      emotions.push({
        theme,
        intensity: matched.length >= 3 ? 'High' : matched.length === 2 ? 'Moderate' : 'Mild',
        confidence: Math.min(1.0, 0.5 + matched.length * 0.2),
        evidence: matched
      });
    }
  }

  // Detect distortions (DO NOT force when not present)
  const distortions = [];
  for (const item of DISTORTION_PATTERNS) {
    for (const reg of item.regexes) {
      const match = text.match(reg);
      if (match) {
        distortions.push({
          pattern: item.pattern,
          explanation: item.explanation,
          evidence: match[0]
        });
        break;
      }
    }
  }

  // Build reframe
  let reframe = null;
  if (distortions.length > 0) {
    const d = distortions[0];
    reframe = {
      balanced_perspective: `Notice that thinking "${d.evidence}" views an entire situation through a high-pressure filter. In reality, setbacks are specific events rather than permanent definitions of your worth.`,
      reflection_question: `What is one piece of evidence that contradicts this absolute thought?`,
      source: 'MindWave CBT Mirror'
    };
  } else if (label === 'Negative') {
    reframe = {
      balanced_perspective: `This feels heavy right now, but your present emotional fatigue is a temporary state, not a permanent reality.`,
      reflection_question: `What is one gentle, comforting step you can take right now to lower the pressure?`,
      source: 'MindWave CBT Mirror'
    };
  } else {
    reframe = {
      balanced_perspective: `Acknowledging what is balanced and steady reinforces emotional clarity and resilience.`,
      reflection_question: `How can you carry this grounded feeling into the rest of your day?`,
      source: 'MindWave CBT Mirror'
    };
  }

  return {
    sentiment: {
      label,
      compound,
      intensityPercent: Math.round(Math.abs(compound) * 100)
    },
    emotions,
    distortions,
    reframe
  };
}

