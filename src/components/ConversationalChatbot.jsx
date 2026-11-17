import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ShieldAlert, 
  ArrowDownCircle, 
  Activity 
} from 'lucide-react';
import { sendChatMessage, fetchChatHistory, clearChatHistory } from '../services/chatService';

const QUICK_PROMPTS = [
  { label: '5-4-3-2-1 Grounding', text: 'Guide me through a 5-4-3-2-1 sensory grounding exercise.' },
  { label: 'Box Breathing', text: 'Can you guide me through a 4x4 Box Breathing exercise?' },
  { label: 'Sleep Hygiene', text: 'I am struggling to fall asleep. What techniques can help me sleep?' },
  { label: 'Energy & Mood Swings', text: 'I have intense swings in energy and mood. What can help stabilize them?' },
  { label: 'Sensory Overload', text: 'I feel overwhelmed by unusual sensory experiences and rapid thoughts.' },
  { label: 'Explain PQ-16 & MDQ', text: 'Can you explain the difference between PQ-16 and MDQ screening?' },
  { label: 'Crisis Helplines', text: 'What crisis helplines and immediate support resources are available?' }
];

export default function ConversationalChatbot({ defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem('mindwave_chat_local');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: "Hello! I'm your MindWave Wellness Companion.\n\nI'm here to offer a safe, judgment-free space to help you decompress, navigate anxious thoughts, practice grounding exercises, or understand your screening assessments.\n\nHow are you feeling right now?",
        category: 'greeting',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto');
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem('mindwave_chat_local', JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages, isTyping]);

  // Load backend history on mount if available
  useEffect(() => {
    const loadHistory = async () => {
      const history = await fetchChatHistory();
      if (Array.isArray(history) && history.length > 0) {
        const formatted = history.map((item, idx) => ({
          id: item.id || `hist-${idx}`,
          sender: item.sender || (item.user_id ? 'user' : 'bot'),
          text: item.message,
          category: item.category || 'general',
          timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        setMessages(formatted);
      }
    };
    loadHistory();
  }, []);

  // Text-To-Speech SpeechSynthesis
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!voiceEnabled) return;

    // Strip emojis and markdown formatting for cleaner speech
    const clean = text
      .replace(/[•\*\#\_\[\]\(\)\{\}]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text Recognition
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please try Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Send Message Handler
  const handleSend = async (customText = null) => {
    const textToSend = (customText !== null ? customText : inputMessage).trim();
    if (!textToSend) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(textToSend, messages.slice(-8));
      const botMsg = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: response.reply || "I am here with you. How can I help you today?",
        category: response.category || 'general',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (voiceEnabled) {
        speakText(botMsg.text);
      }

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear your conversation history?')) {
      await clearChatHistory();
      setMessages([
        {
          id: 'welcome-cleared',
          sender: 'bot',
          text: "Chat cleared. I'm ready whenever you'd like to talk.",
          category: 'greeting',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      localStorage.removeItem('mindwave_chat_local');
    }
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* ------ FLOATING COMPANION LAUNCHER BUTTON ------------------------------------------------------------------------------ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-floating-trigger"
          aria-label="Open MindWave Chatbot Companion"
          title="Chat with MindWave Companion"
        >
          <div className="chatbot-trigger-icon-pulse">
            <MessageSquare size={24} />
          </div>
          <span className="chatbot-trigger-label">Companion</span>
          {hasUnread && <span className="chatbot-unread-dot" />}
        </button>
      )}

      {/* ------ CHAT WINDOW CONTAINER --------------------------------------------------------------------------------------------------------------------------- */}
      {isOpen && (
        <div 
          className={`chatbot-window-container ${isExpanded ? 'chatbot-expanded' : ''}`}
          role="dialog"
          aria-label="MindWave AI Companion Chat"
        >
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-circle">
                <Bot size={20} />
                <span className="chatbot-online-dot" title="Online" />
              </div>
              <div>
                <h3 className="chatbot-header-title">MindWave Companion</h3>
                <p className="chatbot-header-status">
                  <span className="status-indicator"></span> Always Active Support
                </p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              {/* Voice Read Aloud Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (voiceEnabled) {
                    window.speechSynthesis?.cancel();
                  }
                  setVoiceEnabled(!voiceEnabled);
                }}
                className={`chatbot-icon-btn ${voiceEnabled ? 'active-voice' : ''}`}
                title={voiceEnabled ? 'Mute Speech' : 'Read Aloud Responses'}
                aria-label="Toggle text to speech"
              >
                {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              {/* Clear History */}
              <button
                type="button"
                onClick={handleClearChat}
                className="chatbot-icon-btn"
                title="Clear Conversation"
                aria-label="Clear Conversation"
              >
                <RotateCcw size={16} />
              </button>

              {/* Expand / Minimize Window */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="chatbot-icon-btn"
                title={isExpanded ? 'Collapse Size' : 'Expand View'}
                aria-label="Toggle Expand"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis?.cancel();
                }}
                className="chatbot-icon-btn chatbot-close-btn"
                title="Close Chat"
                aria-label="Close Chat"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Quick Prompt Carousel */}
          <div className="chatbot-quick-prompts">
            <div className="chatbot-quick-prompts-scroll">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  className="chatbot-prompt-chip"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Stream */}
          <div className="chatbot-messages-area">
            {messages.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return (
                <div 
                  key={m.id || idx} 
                  className={`chatbot-message-row ${isBot ? 'bot-row' : 'user-row'}`}
                >
                  {isBot && (
                    <div className="chatbot-msg-avatar">
                      <Sparkles size={14} />
                    </div>
                  )}

                  <div className={`chatbot-msg-bubble ${isBot ? 'bot-bubble' : 'user-bubble'} ${m.category === 'crisis' ? 'crisis-highlight' : ''}`}>
                    {/* Category Tag for Bot */}
                    {isBot && m.category && m.category !== 'general' && (
                      <span className={`chatbot-category-tag tag-${m.category}`}>
                        {m.category.replace('_', ' ')}
                      </span>
                    )}

                    <div className="chatbot-msg-text">
                      {m.text.split('\n').map((line, lIdx) => {
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <React.Fragment key={lIdx}>
                            {parts.map((part, pIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                              }
                              return part;
                            })}
                            {lIdx !== m.text.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div className="chatbot-msg-footer">
                      <span className="chatbot-msg-time">{m.timestamp}</span>

                      {isBot && (
                        <div className="chatbot-bubble-actions">
                          <button
                            type="button"
                            onClick={() => copyMessage(m.text, idx)}
                            className="chatbot-micro-btn"
                            title="Copy text"
                          >
                            {copiedIndex === idx ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => speakText(m.text)}
                            className="chatbot-micro-btn"
                            title="Listen"
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="chatbot-user-avatar">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chatbot-message-row bot-row">
                <div className="chatbot-msg-avatar">
                  <Sparkles size={14} />
                </div>
                <div className="chatbot-msg-bubble bot-bubble chatbot-typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <footer className="chatbot-input-container">
            <div className="chatbot-input-wrapper">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything or share how you're feeling..."
                rows={1}
                className="chatbot-textarea"
              />

              {/* Mic Voice Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`chatbot-input-icon-btn ${isListening ? 'listening-pulse' : ''}`}
                title={isListening ? 'Stop listening' : 'Speak message'}
                aria-label="Voice input"
              >
                {isListening ? <MicOff size={18} color="#EF4444" /> : <Mic size={18} />}
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim()}
                className="chatbot-send-btn"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Ethical Mental Health Disclaimer */}
            <div className="chatbot-disclaimer-footnote">
              <ShieldAlert size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                MindWave Companion is an AI wellness assistant and does not replace medical or psychological care.
              </span>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

