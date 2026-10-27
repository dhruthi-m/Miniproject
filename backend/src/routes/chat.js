const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Rule-based response engine (Strictly keyword and rule based, no machine learning)
function generateRuleBasedReply(userMessage) {
  const msg = (userMessage || '').toLowerCase();

  // 1. Crisis / Immediate Safety Check (Highest Priority)
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'end it all',
    'self harm', 'hurt myself', 'hanging', 'overdose', 'cut myself', 'emergency'
  ];
  if (crisisKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'crisis',
      reply: `Please know that you are not alone and your life matters deeply. Because you may be experiencing severe distress, please reach out to trusted emergency or crisis services immediately:

• India National Tele-MANAS Helpline: 14416 or 1800-891-4416 (24/7, Toll-Free)
• Kiran Mental Health Helpline: 1800-599-0019
• Vandrevala Foundation: +91 9999 666 555 (24/7 free counseling)
• US / Canada Suicide & Crisis Lifeline: Call or Text 988
• UK National Health Service / Samaritans: 116 123 or Call 111

If you are in immediate physical danger, please contact your nearest hospital emergency department or emergency services right now. Support is available right this moment.`
    };
  }

  // 2. Greetings
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy'];
  if (greetings.some(kw => msg.startsWith(kw) || msg === kw)) {
    return {
      category: 'greeting',
      reply: `Hello! I am your MindWave supportive companion. I use predefined wellness guidelines to help you navigate grounding exercises, sleep tips, study/work pacing, or understanding your screening tools.

How can I support your wellbeing today? You can ask me about:
• Grounding & breathing exercises
• Managing study or work stress
• Improving sleep routines
• Explanations of PQ-16 and MDQ screening
• Finding professional support resources`
    };
  }

  // 3. Grounding / Anxiety / Panic / Stress
  const anxietyKeywords = ['anxious', 'anxiety', 'panic', 'overwhelmed', 'nervous', 'scared', 'freaking out', 'stress', 'tense', 'racing thoughts'];
  if (anxietyKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'grounding',
      reply: `I hear that you're feeling stressed or overwhelmed. Let's take a pause together. Try the 5-4-3-2-1 Grounding Technique right now:

1. Look around and name 5 things you can see (e.g., your desk, a window, a pen).
2. Acknowledge 4 things you can physically feel (e.g., your feet on the floor, the chair supporting your back).
3. Listen for 3 sounds you can hear (e.g., a fan, distant traffic, your own breath).
4. Identify 2 things you can smell or like the smell of.
5. Notice 1 thing you can taste or take a slow sip of cool water.

You can also use our interactive Box Breathing guide in the Wellness section: Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, and pause for 4 seconds.`
    };
  }

  // 4. Low mood / Sadness / Loneliness
  const sadnessKeywords = ['sad', 'crying', 'depressed', 'lonely', 'alone', 'hopeless', 'empty', 'heartbroken', 'down', 'miserable'];
  if (sadnessKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'comfort',
      reply: `I am sorry to hear that you are going through a heavy moment. It is completely okay to feel down, and you do not have to pressure yourself to fix everything at once.

Some gentle steps you can take right now:
• Drink a glass of water and wrap yourself in a comfortable blanket.
• Put your thoughts into words in your MindWave Journal—getting feelings out of your head onto the page can often bring relief.
• If you feel up to it, reach out to a trusted friend or family member just to say hello.
• Remember that feelings are temporary states and seeking guidance from a counselor or mental health professional is a sign of strength, not weakness.`
    };
  }

  // 5. Sleep troubles
  const sleepKeywords = ['sleep', 'insomnia', 'can\'t sleep', 'nightmare', 'exhausted', 'tired', 'awake', 'bedtime'];
  if (sleepKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'sleep',
      reply: `Sleep difficulties can deeply affect your mood and concentration. Here are proven sleep hygiene practices:

• Screen Curfew: Turn off phones, tablets, and laptops at least 30 to 45 minutes before bedtime.
• Dim the lights in your room to signal melatonin production.
• Progressive Muscle Relaxation: Tense your toes for 5 seconds, then release. Move upward through your calves, thighs, shoulders, and jaw.
• If you have been tossing and turning for more than 20 minutes, get out of bed and do a quiet, low-light activity (like reading a physical book) until you feel drowsy.`
    };
  }

  // 6. Work & Academic pressure
  const workKeywords = ['work', 'study', 'exam', 'college', 'assignment', 'boss', 'job', 'deadline', 'grades', 'burnout'];
  if (workKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'productivity_wellness',
      reply: `Academic and professional pressure can feel intense. Let's break the cycle of overwhelm:

• Focus on the very next 20 minutes instead of the entire project.
• Try the Pomodoro rhythm: 25 minutes of focused single-tasking, followed by a strict 5-minute break away from your screen.
• Prioritize your top 1–2 crucial items for today; everything else can wait until tomorrow.
• Take time to acknowledge what you have already accomplished today, even small tasks.`
    };
  }

  // 7. Screening questionnaires (PQ-16 & MDQ)
  const screeningKeywords = ['pq-16', 'mdq', 'bipolar', 'schizophrenia', 'psychosis', 'screening', 'test', 'questionnaire'];
  if (screeningKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'screening_info',
      reply: `MindWave provides two validated, separate screening modules:

1. PQ-16 (Prodromal Questionnaire-16): Assesses perceptual and unusual cognitive experiences associated with the psychosis spectrum, along with personal distress ratings.
2. MDQ (Mood Disorder Questionnaire): Assesses elevated mood periods, co-occurrence, and functional impairment associated with the bipolar spectrum.

Important Reminder: These instruments are self-screening tools designed to increase awareness. They do NOT provide a clinical diagnosis. Always consult a qualified psychiatrist or clinical psychologist for an accurate evaluation.`
    };
  }

  // 8. Professional help inquiry
  const doctorKeywords = ['doctor', 'therapist', 'counselor', 'psychiatrist', 'psychologist', 'help', 'appointment'];
  if (doctorKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'professional_info',
      reply: `Reaching out to a mental health professional is one of the most proactive steps you can take for your wellbeing. 

You can check our dedicated 'Professional Support' page for a curated directory of verified institutional helplines, guidelines on what to ask during your first therapy consultation, and local support resources.`
    };
  }

  // 9. Default Fallback
  return {
    category: 'general',
    reply: `Thank you for sharing that with me. As a supportive wellness assistant, I am here to provide structured self-care techniques, grounding exercises, and mental health guidance.

Would you like to:
1. Try a guided 4-7-8 or Box Breathing exercise?
2. Log your current state in the Mood Tracker?
3. Reflect on your day in the Personal Journal?
4. Learn more about the PQ-16 or MDQ screening tools?`
  };
}

// GET /api/chat/history
router.get('/history', (req, res) => {
  try {
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
router.post('/message', (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const userText = message.trim();

    // 1. Save user message
    const insertStmt = db.prepare('INSERT INTO chat_records (user_id, sender, message, category) VALUES (?, ?, ?, ?)');
    insertStmt.run(userId, 'user', userText, 'user_input');

    // 2. Generate rule-based response
    const botResult = generateRuleBasedReply(userText);

    // 3. Save bot response
    const botStmt = insertStmt.run(userId, 'bot', botResult.reply, botResult.category);

    return res.json({
      reply: botResult.reply,
      category: botResult.category,
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
    const userId = req.user.id;
    db.prepare('DELETE FROM chat_records WHERE user_id = ?').run(userId);
    return res.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    return res.status(500).json({ message: 'Failed to clear chat history.' });
  }
});

module.exports = router;
