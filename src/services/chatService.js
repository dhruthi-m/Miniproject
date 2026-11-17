/**
 * MindWave Conversational Chat Service
 * Handles API calls to backend /api/chat with resilient local fallback.
 */

const API_BASE = 'http://localhost:5000/api/chat';

export async function sendChatMessage(message, history = []) {
  const token = localStorage.getItem('mindwave_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, history })
    });

    if (res.ok) {
      return await res.json();
    }
    throw new Error('Backend responded with error');
  } catch (err) {
    console.warn('Backend chat unreachable, utilizing client fallback engine:', err);
    return generateClientFallbackReply(message);
  }
}

export async function fetchChatHistory() {
  const token = localStorage.getItem('mindwave_token');
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (err) {
    console.warn('Could not fetch chat history from server:', err);
  }
  return [];
}

export async function clearChatHistory() {
  const token = localStorage.getItem('mindwave_token');
  if (!token) return true;

  try {
    const res = await fetch(`${API_BASE}/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not clear server chat history:', err);
    return false;
  }
}

// Client-side fallback with direct, substantive answers
function generateClientFallbackReply(userMessage) {
  const msg = (userMessage || '').toLowerCase().replace(/×/g, 'x');

  // Crisis
  if (['suicide', 'die', 'kill', 'end my life', 'hurt myself', 'emergency'].some(kw => msg.includes(kw))) {
    return {
      reply: `Please know you are not alone, your life is precious, and help is available right now:
• Tele-MANAS (India 24/7 National): 14416 or 1800-891-4416
• Kiran Mental Health: 1800-599-0019
• US & Canada Suicide & Crisis Lifeline: Dial 988
• UK Samaritans: 116 123
If in immediate danger, please contact local emergency medical services immediately.`,
      category: "crisis",
      timestamp: new Date().toISOString()
    };
  }

  // Box Breathing
  if (msg.includes('box breath') || msg.includes('4x4') || msg.includes('breath')) {
    return {
      reply: `Here is your complete 4×4 Box Breathing Guide.

Sit comfortably with relaxed shoulders. Let's do 4 rounds:
• Step 1: Inhale Slowly (4 Seconds)
Breathe in deeply through your nose: 1... 2... 3... 4. Feel your lower belly expand.
• Step 2: Hold Gently (4 Seconds)
Hold the breath calmly: 1... 2... 3... 4.
• Step 3: Exhale Slowly (4 Seconds)
Release all air smoothly through your mouth: 1... 2... 3... 4.
• Step 4: Hold Empty (4 Seconds)
Rest with your lungs empty: 1... 2... 3... 4.
• Repeat this cycle 3 more times. Notice how your heart rate slows down and tension leaves your body.`,
      category: "breathing_exercise",
      timestamp: new Date().toISOString()
    };
  }

  // Grounding 5-4-3-2-1
  if (msg.includes('5-4-3-2-1') || msg.includes('grounding') || msg.includes('ground')) {
    return {
      reply: `Here is your complete 5-4-3-2-1 Sensory Grounding Exercise: 
• 5 Things You See: Look around and name 5 specific objects (table, pen, wall color, shoes, window).
• 4 Things You Touch: Notice 4 textures (your clothes fabric, the solid floor, chair back, temperature of hands).
• 3 Things You Hear: Listen for 3 background sounds (fan hum, distant cars, your quiet breath).
• 2 Things You Smell: Notice 2 scents around you, or visualize fresh lavender.
• 1 Thing You Taste: Focus on the current taste in your mouth, or take a sip of cool water.

Take a slow exhale. You are safe in the physical present.`,
      category: "grounding_exercise",
      timestamp: new Date().toISOString()
    };
  }

  // Sleep
  if (msg.includes('sleep') || msg.includes('insomnia') || msg.includes('tired')) {
    return {
      reply: `Here is the clinical Stimulus Control & Sleep Routine: 
1. The 4-7-8 Breath: Inhale 4s, hold 7s, exhale slowly 8s. Repeat 4 times to activate natural sleepiness.
2. The 20-Minute Rule: If awake for >20 mins, get out of bed, sit in dim light, and read a physical book until sleepy.
3. Zero Blue Light: Turn off phone/laptop screens 45 minutes before sleep.
4. Cool Room: Maintain room between 18°C–20°C (65°F–68°F) for deep REM sleep.`,
      category: "sleep_protocol",
      timestamp: new Date().toISOString()
    };
  }

  // Default Answer
  return {
    reply: `Here is clinical guidance for your mental wellbeing: 

1. Acknowledge and Ground: Emotional states are temporary waves. Take a slow, deep breath with a longer exhale to calm your nervous system.
2. Direct Self-Care Step:
• For racing thoughts: Write out a 5-minute brain dump in your MindWave Journal.
• For stress: Try 4 rounds of Box Breathing (Inhale 4s, Hold 4s, Exhale 4s, Hold 4s).
• For low energy: Drink a glass of water, step into natural sunlight, and focus on just one small 5-minute task.

I am here to give you direct answers and exercises whenever you need!`,
    category: "general_support",
    timestamp: new Date().toISOString()
  };
}
