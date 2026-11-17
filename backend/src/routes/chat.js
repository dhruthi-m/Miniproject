const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Middleware: Optional authentication
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}

router.use(optionalAuth);

/**
 * Intelligent Clinical Rule-Based Response Engine
 * Provides immediate, concrete guidance and exercises.
 */
function generateRuleBasedReply(userMessage) {
  const msg = (userMessage || '').toLowerCase().replace(/×/g, 'x').trim();

  // 1. Crisis / Immediate Safety Check (Highest Priority)
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'end it all',
    'self harm', 'hurt myself', 'hanging', 'overdose', 'cut myself', 'emergency',
    'take my life', 'no reason to live', 'better off dead'
  ];
  if (crisisKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'crisis',
      reply: `Please know that you are not alone, your feelings are valid, and your life matters deeply. Because you may be experiencing intense distress, please connect with trained crisis counselors who can support you right now:

🆘 Immediate Crisis Helplines (Free & Confidential 24/7):
• India Tele-MANAS: 14416 or 1800-891-4416 (24/7 National)
• Kiran Mental Health Helpline: 1800-599-0019
• Vandrevala Foundation: +91 9999 666 555 (Free 24/7 counseling)
• US / Canada Suicide & Crisis Lifeline: Call or Text 988
• UK Samaritans: 116 123
• Global Crisis Directory: https://findahelpline.com

If you are in immediate danger of hurting yourself, please call your local emergency number or go to the nearest hospital emergency room. Please stay safe—there is help available this very minute.`
    };
  }

  // 2. Specific Breathing Exercise Requests (Box Breathing, 4x4, 4-7-8, Deep Breathing)
  if (
    msg.includes('box breath') || 
    msg.includes('4x4') || 
    msg.includes('4 by 4') || 
    msg.includes('square breath') || 
    (msg.includes('guide') && msg.includes('breath')) ||
    (msg.includes('breath') && (msg.includes('exercise') || msg.includes('technique') || msg.includes('how') || msg.includes('start')))
  ) {
    return {
      category: 'breathing_exercise',
      reply: `Here is your step-by-step 4×4 Box Breathing Guide.

Sit comfortably with your back upright and shoulders relaxed. Rest your hands gently on your lap.

Let's do 4 complete rounds together:
• Step 1: Inhale Slowly (4 Seconds)
Breathe in smoothly through your nose for 1... 2... 3... 4. Feel your lower belly and lungs expand completely.
• Step 2: Hold Your Breath (4 Seconds)
Keep the air gently inside without straining. Count: 1... 2... 3... 4. Feel the stillness.
• Step 3: Exhale Slowly (4 Seconds)
Release all the air through your mouth or nose in a smooth, steady stream for 1... 2... 3... 4.
• Step 4: Hold Empty (4 Seconds)
Wait calmly with your lungs empty for 1... 2... 3... 4.
• Repeat this cycle 3 more times. Notice your heart rate decelerating, your jaw relaxing, and tension draining from your shoulders with every cycle. You can practice this anytime you feel anxious, stressed, or unfocused.`
    };
  }

  // 3. Specific 5-4-3-2-1 Sensory Grounding Requests
  if (
    msg.includes('5-4-3-2-1') || 
    msg.includes('54321') || 
    msg.includes('sensory grounding') || 
    (msg.includes('grounding') && (msg.includes('exercise') || msg.includes('guide') || msg.includes('technique') || msg.includes('how')))
  ) {
    return {
      category: 'grounding_exercise',
      reply: `Here is the complete 5-4-3-2-1 Sensory Grounding Technique to anchor your nervous system right now.

Take one slow, deep breath, place both feet firmly on the floor, and follow these 5 steps:
• 5 Things You Can SEE:
Look around your environment right now. Notice 5 specific objects (e.g., the grain of wood on a table, a shadow on the wall, a pen, the color of your shoes, a light switch). Notice their colors and shapes.
• 4 Things You Can TOUCH:
Reach out or notice 4 physical sensations (e.g., the fabric of your sleeves, the solid floor under your heels, the temperature of your hands, the back of your chair supporting your posture).
• 3 Things You Can HEAR:
Close your eyes for 5 seconds and tune in to 3 background sounds (e.g., the hum of an air conditioner or fan, distant traffic outside, or the sound of your own quiet breathing).
• 2 Things You Can SMELL:
Notice 2 scents in the air (e.g., coffee, fresh air from a window, fabric softener, or the scent on your wrist). If nothing is nearby, visualize the crisp aroma of fresh pine or rain on soil.
• 1 Thing You Can TASTE:
Notice the current taste in your mouth, or take a cool sip of water and pay full attention to the sensation.

 Take a slow, gentle exhale. Grounding pulls your mind out of spiraling thoughts and anchors you safely in the physical present.`
    };
  }

  // 4. Overthinking, Racing Thoughts & Mental spiraling
  if (
    msg.includes('overthink') || 
    msg.includes('racing thought') || 
    msg.includes('can\'t stop thinking') || 
    msg.includes('cannot stop thinking') || 
    msg.includes('intrusive thought') || 
    msg.includes('mind won\'t stop') || 
    msg.includes('brain won\'t stop') || 
    msg.includes('spiraling')
  ) {
    return {
      category: 'cognitive_calm',
      reply: `Here is a proven 3-step cognitive defusion protocol to halt racing thoughts and overthinking: 

1. The "Thought Labeling" Technique:
Instead of saying "Everything will go wrong," reframe it as: "I am having the thought that everything will go wrong." This subtle shift creates psychological distance between YOU and your thoughts. Thoughts are cognitive events, not guaranteed facts.

2. The 5-Minute Brain Dump:
Grab a piece of paper or open your MindWave Journal. Set a timer for 5 minutes and write out every single intrusive thought without filtering, editing, or correcting grammar. Transferring thoughts from your working memory onto paper stops your brain from endlessly looping them.

3. The Physiological Sigh (Fastest nervous system brake):
Take a deep inhale through your nose... then immediately take a quick second 'top-off' sip of air to fully expand your alveoli... then sigh out long, slow, and vocal through your mouth. Repeat this twice. This triggers the vagus nerve and lowers your heart rate within seconds.

Remember: You do not have to believe or solve every thought your brain produces.`
    };
  }

  // 5. Sleep & Insomnia solutions
  if (
    msg.includes('sleep') || 
    msg.includes('insomnia') || 
    msg.includes('can\'t sleep') || 
    msg.includes('cannot sleep') || 
    msg.includes('awake') || 
    msg.includes('tired but') || 
    msg.includes('bedtime')
  ) {
    return {
      category: 'sleep_protocol',
      reply: `Here is the clinical Stimulus Control & Relaxation Protocol for falling asleep: 

1. The 4-7-8 Sleep Breathing Method:
• Inhale quietly through your nose for 4 counts.
• Hold your breath gently for 7 counts.
• Exhale completely through your mouth with a soft 'whoosh' sound for 8 counts.
• Repeat for 4 full cycles. The extended 8-second exhale stimulates the parasympathetic nervous system, inducing natural sleepiness.

2. The 20-Minute Bed Rule:
If you have been lying awake for more than 20 minutes, get out of bed immediately. Staying in bed while frustrated trains your brain to associate the mattress with wakefulness. Move to a chair in dim lighting, read a physical book, and only return to bed when your eyelids feel heavy.

3. Environmental Anchors:
• Room Temperature: Set your bedroom between 18°C–20°C (65°F–68°F); the body must drop core temperature by ~1°C to initiate deep sleep.
• Zero Blue Light: Avoid smartphones and laptops at least 45 minutes before bed.
• Progressive Muscle Relaxation: Tense your calf muscles for 5 seconds, release completely. Tense your thighs, release. Tense your shoulders, release. Feel the heavy sensation of release.`
    };
  }

  // 6. Bipolar, Mood Swings, Manic/Hypomanic energy
  if (
    msg.includes('bipolar') || 
    msg.includes('mood swing') || 
    msg.includes('mania') || 
    msg.includes('manic') || 
    msg.includes('hypomanic') || 
    msg.includes('hypomania') || 
    msg.includes('energy swing') || 
    msg.includes('mdq')
  ) {
    return {
      category: 'bipolar_support',
      reply: `Here is what you need to know about navigating bipolar spectrum energy and mood swings: 

1. Understanding Bipolar Fluctuations:
Bipolar patterns involve shifts between elevated phases (hypomania/mania characterized by racing thoughts, high energy, decreased sleep need, increased goal drive) and depressive phases (low energy, cognitive fog, loss of interest).

2. Critical Stabilizing Strategies (Social Rhythm Protocol):
• Strict Sleep-Wake Anchor: Wake up at the exact same time every day, regardless of how much energy you feel. Sleep deprivation is the #1 trigger for manic episodes.
• The 48-Hour Impulsive Decision Rule: If you suddenly feel inspired to make major financial purchases, launch radical projects, or change relationships during high energy, write the idea down and impose a strict 48-hour waiting period before acting.
• Mood & Energy Logging: Track your baseline daily in your MindWave Journal to spot subtle onset patterns before full episodes develop.

3. Screening & Clinical Care:
The Mood Disorder Questionnaire (MDQ) in MindWave screens for 13 core symptoms, co-occurrence, and functional impact. Effective treatments including mood stabilizers and cognitive behavioral therapy (CBT) offer high stability. Consult a psychiatrist for medical assessment.`
    };
  }

  // 7. Schizophrenia, Psychosis, Sensory Variations, Voices, Paranoia
  if (
    msg.includes('schizophrenia') || 
    msg.includes('psychosis') || 
    msg.includes('hearing voice') || 
    msg.includes('hallucination') || 
    msg.includes('paranoia') || 
    msg.includes('paranoid') || 
    msg.includes('seeing shadow') || 
    msg.includes('pq-16') || 
    msg.includes('prodromal') || 
    msg.includes('delusion') || 
    msg.includes('sensory overload')
  ) {
    return {
      category: 'schizo_support',
      reply: `Here are grounded, supportive strategies for managing unusual sensory experiences, paranoia, or psychosis indicators: 

1. Immediate Calming & Reality Anchoring:
• Soft Illumination: If you are seeing shadows or movement in peripheral vision, turn on warm, bright lighting to remove ambiguous sensory cues.
• Familiar Auditory Stimulation: If you hear faint sounds, whispers, or heightened background noises, put on familiar instrumental music, a calming podcast, or use noise-canceling headphones.
• Ground in Safety: Say out loud: "I am in my room, I am safe in this moment, and my brain is currently experiencing heightened sensory sensitivity."

2. Reduce Sensory Stimulation:
Sensory overload frequently triggers paranoia. Step away from loud rooms, crowded screens, or high-conflict environments into a quiet space. Drink a glass of cold water.

3. PQ-16 Screening Context:
The Prodromal Questionnaire-16 (PQ-16) evaluates early variations in sensory perception, ideation, and distress. Experiencing unusual perceptual phenomena is common under severe stress, sleep deprivation, or trauma. Professional support from a psychiatrist or early-intervention psychosis specialist provides clarity and effective management.`
    };
  }

  // 8. Depression, Sadness, Loneliness, Low Motivation
  if (
    msg.includes('sad') || 
    msg.includes('depress') || 
    msg.includes('lonely') || 
    msg.includes('alone') || 
    msg.includes('hopeless') || 
    msg.includes('crying') || 
    msg.includes('numb') || 
    msg.includes('worthless') || 
    msg.includes('unmotivated') || 
    msg.includes('no energy')
  ) {
    return {
      category: 'comfort',
      reply: `Here is a compassionate Behavioral Activation protocol for when you feel down, empty, or unmotivated: 

1. Lower the Activation Bar (The "5-Minute Micro-Action"):
Depression convinces you that you must feel motivated before taking action. In reality, ACTION creates motivation. Pick one absurdly small task:
• Sit up and drink one glass of water.
• Open your curtains to let in natural daylight.
• Step outside for 3 minutes.
Tell yourself: "I only need to do this for 5 minutes. If I still want to rest, I can stop."

2. Combat Rumination with External Attention:
When you are depressed, attention turns inward into a self-critical loop. Turn your attention outward: watch a documentary, tidy one small corner of your desk, or listen to nature sounds.

3. Self-Compassion Anchor:
Remind yourself: "Having low energy today does not make me a failure. My nervous system is depleted, and resting is a biological requirement."

4. Write It Out:
Use the MindWave Journal to pour out raw thoughts. Getting feelings outside your body onto paper reduces emotional intensity.`
    };
  }

  // 9. Anxiety, Panic Attack, Rapid Heartbeat
  if (
    msg.includes('anxiety') || 
    msg.includes('anxious') || 
    msg.includes('panic') || 
    msg.includes('overwhelmed') || 
    msg.includes('heart racing') || 
    msg.includes('freaking out') || 
    msg.includes('scared') || 
    msg.includes('fear')
  ) {
    return {
      category: 'anxiety_relief',
      reply: `Here is immediate physiological first-aid for anxiety and panic: 

1. The Dive Reflex (Fastest Panic Reset):
Splash ice-cold water onto your face, or hold an ice pack wrapped in a cloth against your eyes and upper cheeks for 15–20 seconds while holding your breath. This activates the mammalian dive reflex, forcing your heart rate to drop instantly.

2. Lengthen Your Exhale:
Panic occurs when oxygen/carbon dioxide balance shifts from hyperventilation.
• Inhale through your nose for 3 seconds.
• Exhale slowly through pursed lips (like blowing through a straw) for 6 seconds.
Making the exhale twice as long as the inhale triggers acetylcholine release, sending a physical signal to your brain that danger has passed.

3. Muscle De-Armoring:
Unclench your jaw. Drop your shoulders down away from your ears. Uncurl your toes. Open your palms. Releasing muscular tension signals your brain to lower adrenaline.

You are safe right now, this surge of adrenaline will metabolize within minutes, and you are going to be okay.`
    };
  }

  // 10. Academic, Exam & Workplace Burnout
  if (
    msg.includes('exam') || 
    msg.includes('study') || 
    msg.includes('work') || 
    msg.includes('college') || 
    msg.includes('deadline') || 
    msg.includes('burnout') || 
    msg.includes('job') || 
    msg.includes('career')
  ) {
    return {
      category: 'productivity_wellness',
      reply: `Here is a structured cognitive strategy to manage academic and workplace overwhelm: 

1. The Eisenhower Triage:
List everything on your plate, then separate into two categories:
• Must be done today (choose max 2 items).
• Can wait until tomorrow or later (everything else).
Focus exclusively on the top 2 items. Ignore the rest guilt-free.

2. The 25/5 Pomodoro Cycle:
Set a timer for 25 minutes. Work on ONE single task with zero multitasking. When the timer rings, take a mandatory 5-minute break away from your screen—stretch, walk, or hydrate. Repeat 4 times, then take a 20-minute break.

3. Overcoming Procrastination Paralysis:
Procrastination is an emotional regulation problem, not laziness. The dread of starting is always 10x worse than the actual work. Commit to working for just 120 seconds. Once you cross the starting threshold, inertia takes over.

4. Remember:
Your worth as a human being is never defined by your grades, work metrics, or daily productivity.`
    };
  }

  // 11. Explain Screening Assessments (PQ-16 & MDQ)
  if (
    msg.includes('difference between') || 
    msg.includes('pq-16 and mdq') || 
    msg.includes('pq16 and mdq') || 
    msg.includes('how does screening work') || 
    msg.includes('explain screening') || 
    msg.includes('what is mdq') || 
    msg.includes('what is pq-16') || 
    msg.includes('what is pq16')
  ) {
    return {
      category: 'screening_education',
      reply: `Here is the clinical difference between PQ-16 and MDQ screening in MindWave: 

1. PQ-16 (Prodromal Questionnaire-16):
• Scope: Evaluates early perceptual and unusual cognitive variations associated with the psychosis/schizophrenia spectrum.
• Items: 16 core questions assessing perceptual sensitivity, auditory/visual variations, and suspicious ideation.
• Scoring: Each endorsed item is rated for personal distress (0 to 5 scale). A score of ≥6 endorsed symptoms indicates clinical prodromal risk warranting specialist consultation.

2. MDQ (Mood Disorder Questionnaire):
• Scope: Assesses co-occurring traits associated with the bipolar disorder spectrum.
• Items: 15 questions covering 13 manic/hypomanic traits (racing thoughts, energy surges, reduced sleep), item 14 for simultaneous co-occurrence, and item 15 for functional impairment.
• Scoring: A positive screen requires ≥7 co-occurring symptoms with moderate/serious functional impact.

Both tools in MindWave use scikit-learn Random Forest machine learning models (trained on N=1,408 student cohort data from Nature Scientific Data) to provide supplemental response analysis alongside traditional scoring.`
    };
  }

  // 12. Doctor / Therapy / Finding Care
  if (
    msg.includes('therapist') || 
    msg.includes('doctor') || 
    msg.includes('psychiatrist') || 
    msg.includes('counselor') || 
    msg.includes('find care') || 
    msg.includes('hospital') || 
    msg.includes('clinic') || 
    msg.includes('therapy')
  ) {
    return {
      category: 'care_navigation',
      reply: `Here is how to access professional mental healthcare and prepare for your consultation: 

1. Use MindWave's 'Find Care' Tool:
Click the 'Find Care' tab in the top navigation. Our GPS Healthcare Radar automatically identifies verified hospitals, psychiatric facilities, and counseling clinics nearest to your location.

2. How to Prepare for Your First Session:
• Bring Your Screening Summary: Export or print your PQ-16 or MDQ screening results from the 'Result' page to give the clinician immediate baseline context.
• Key Questions to Ask:
  - "What is your working diagnostic impression of my symptoms?"
  - "Do you recommend psychotherapy (e.g. CBT, DBT), lifestyle adjustments, or medication evaluation?"
  - "What should I track between our appointments?"

3. Seeking Support is Strength:
Reaching out to a licensed psychologist or psychiatrist is the most proactive, empowering step you can take for long-term health.`
    };
  }

  // 13. Gratitude & Greetings
  if (
    msg.includes('thank') || 
    msg.includes('thanks') || 
    msg.includes('helpful') || 
    msg.includes('appreciate') || 
    msg.includes('awesome') || 
    msg.includes('great answer')
  ) {
    return {
      category: 'gratitude',
      reply: `You are very welcome!  I'm glad this was helpful for you. Remember that taking proactive steps for your mental wellbeing is something to be genuinely proud of.

I am always right here whenever you need a grounding exercise, sleep tip, screening explanation, or a supportive ear. Take gentle care of yourself!`
    };
  }

  if (
    msg === 'hi' || 
    msg === 'hello' || 
    msg === 'hey' || 
    msg === 'namaste' || 
    msg === 'good morning' || 
    msg === 'good evening' || 
    msg === 'good afternoon'
  ) {
    return {
      category: 'greeting',
      reply: `Hello! I'm your MindWave Wellness Companion.

I'm here to provide direct, practical answers and clinical self-care tools. You can ask me to:
• Guide you through a 4x4 Box Breathing or 5-4-3-2-1 Grounding exercise
• Provide actionable techniques for stopping racing thoughts or anxiety
• Give evidence-based sleep hygiene routines for insomnia
• Explain bipolar mood swings, energy shifts, or sensory variations
• Explain your PQ-16 and MDQ screening scores and findings

What can I help you with right now?`
    };
  }

  // 14. Intelligent General Fallback: Gives a substantive, multi-part answer
  return {
    category: 'general_support',
    reply: `Here is clinical guidance and practical support for what you shared: 

1. Acknowledge and Ground:
Whatever you are experiencing right now, know that emotional states are dynamic and temporary. When your mind feels full, pause and take one slow, deep belly breath with an extended exhale.

2. Actionable Self-Care Step:
• If you are experiencing tension or overthinking: Try 3 rounds of Box Breathing (Inhale 4s, Hold 4s, Exhale 4s, Hold 4s).
• If you are feeling physically restless or anxious: Drink a cold glass of water and use the 5-4-3-2-1 sensory technique to anchor yourself in your room.
• If you want to explore patterns: Use the MindWave Journal to write down what triggered this state.

3. We Can Also Explore:
Feel free to ask me for specific guidance on sleep hygiene, coping with mood swings, understanding PQ-16/MDQ screening, or finding nearby healthcare providers.

I am here to give you direct answers and support whenever you need.`
  };
}

/**
 * Google Gemini Generative AI Integration
 * When GEMINI_API_KEY is configured in backend/.env, queries run through Gemini 1.5 Flash.
 */
async function callGeminiApi(userMessage, conversationHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }

  const systemInstructionText = `You are the MindWave AI Wellness Companion, an empathetic, insightful, and conversational mental health assistant.
You talk warmly, conversationally, and naturally like an understanding human companion.
Answer ANY question the user asks—whether about emotions, anxiety, sleep, racing thoughts, daily stress, relationships, self-care routines, or psychiatric screening assessments (PQ-16, MDQ).
Always maintain conversation context from previous turns and respond to follow-ups naturally.
Keep answers clear, compassionate, and structured with short paragraphs and bullet points where helpful.
Never prescribe pharmaceutical medication or give formal medical diagnoses; advise consulting a qualified clinician for clinical decisions.`;

  // Build conversational multi-turn contents array
  const contents = [];
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    for (const h of conversationHistory.slice(-8)) {
      if (h.sender === 'user' && h.text && h.text.trim()) {
        contents.push({ role: 'user', parts: [{ text: h.text.trim() }] });
      } else if (h.sender === 'bot' && h.text && h.text.trim()) {
        contents.push({ role: 'model', parts: [{ text: h.text.trim() }] });
      }
    }
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  // Modern verified Gemini models prioritized by current active quota availability
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
      // 15-second timeout per candidate model for responsive fallback
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900
          }
        })
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          console.log(`[Gemini API] Successfully generated conversational response with model: ${model}`);
          return reply.trim();
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Gemini API] Model ${model} returned status ${res.status}:`, errText.slice(0, 160));
      }
    } catch (err) {
      console.warn(`[Gemini API] Call with ${model} failed:`, err.message);
    }
  }

  return null;
}


// GET /api/chat/history
router.get('/history', (req, res) => {
  try {
    if (!req.user) {
      return res.json({ history: [] });
    }
    const userId = req.user.id;
    const history = db.prepare(`
      SELECT id, sender, message, category, created_at
      FROM chat_records
      WHERE user_id = ?
      ORDER BY id ASC
      LIMIT 100
    `).all(userId);

    return res.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ message: 'Failed to retrieve chat history.' });
  }
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const userText = message.trim();

    // 1. Safety & Crisis Override Check (Highest Priority)
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'end it all',
      'self harm', 'hurt myself', 'hanging', 'overdose', 'cut myself', 'emergency',
      'take my life', 'no reason to live', 'better off dead'
    ];
    let botReply = null;
    let botCategory = 'general';

    if (crisisKeywords.some(kw => userText.toLowerCase().includes(kw))) {
      const crisisResult = generateRuleBasedReply(userText);
      botReply = crisisResult.reply;
      botCategory = 'crisis';
    } else {
      // 2. Try Gemini Generative AI if key is present
      const geminiReply = await callGeminiApi(userText, history);
      if (geminiReply) {
        botReply = geminiReply;
        botCategory = 'gemini_ai';
      } else {
        // 3. Fallback to our extensive clinical rule engine
        const ruleResult = generateRuleBasedReply(userText);
        botReply = ruleResult.reply;
        botCategory = ruleResult.category;
      }
    }

    // Save to database if user is authenticated
    if (req.user) {
      const insertStmt = db.prepare('INSERT INTO chat_records (user_id, sender, message, category) VALUES (?, ?, ?, ?)');
      insertStmt.run(req.user.id, 'user', userText, 'user_input');
      insertStmt.run(req.user.id, 'bot', botReply, botCategory);
    }

    return res.json({
      reply: botReply,
      category: botCategory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ message: 'Failed to process chat message.' });
  }
});

// DELETE /api/chat/clear
router.delete('/clear', (req, res) => {
  try {
    if (req.user) {
      db.prepare('DELETE FROM chat_records WHERE user_id = ?').run(req.user.id);
    }
    return res.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    return res.status(500).json({ message: 'Failed to clear chat history.' });
  }
});

module.exports = router;
