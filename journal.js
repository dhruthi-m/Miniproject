/* ==========================================================================
   MindWave Journal — Complete Frontend Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupNavbarAuthState();
  setupScreeningLinkGuards();
});

function isAuthenticated() {
  const token = localStorage.getItem('mindwave_token');
  return Boolean(token && token !== 'undefined' && token !== 'null' && token.trim() !== '');
}

/**
 * Updates navbar Login / Logout button state based on authentication
 */
function setupNavbarAuthState() {
  const loginBtn = document.getElementById('login-button');
  if (!loginBtn) return;

  if (isAuthenticated()) {
    loginBtn.textContent = 'Logout';
    loginBtn.setAttribute('href', '#logout');
    loginBtn.classList.add('btn-logout');

    loginBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('mindwave_token');
      localStorage.removeItem('mindwave_user');
      window.location.href = '/login.html';
    };
  } else {
    loginBtn.textContent = 'Login';
    loginBtn.setAttribute('href', '/login.html');
  }
}

/**
 * Intercept clicks on screening links if not authenticated
 */
function setupScreeningLinkGuards() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = (link.getAttribute('href') || '').toLowerCase();
    const isScreening = ['screening.html', 'schizophrenia-test.html', 'bipolar-test.html'].some(r => href.includes(r));

    if (isScreening && !isAuthenticated()) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `/login.html?redirect=${encodeURIComponent(link.getAttribute('href') || '/screening.html')}`;
    }
  }, true);
}

/**
 * Dark / Light mode toggle — persists to localStorage
 */
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const saved = localStorage.getItem('mindwave_theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
  }
  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('mindwave_theme', isLight ? 'light' : 'dark');
    btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    btn.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  });
}

/* ─── Data definitions ─────────────────────────────────────────── */
const EMOTIONS = [
  { emoji: '', label: 'Happy'   },
  { emoji: '', label: 'Calm'    },
  { emoji: '', label: 'Sad'     },
  { emoji: '', label: 'Angry'   },
  { emoji: '', label: 'Anxious' },
  { emoji: '', label: 'Stressed'},
  { emoji: '', label: 'Excited' },
  { emoji: '', label: 'Lonely'  },
  { emoji: '', label: 'Confused'},
  { emoji: '', label: 'Neutral' },
];

const TRIGGERS  = ['Studies','Work','Relationships','Family','Social situations','Sleep','Health & wellbeing','Personal thoughts','Major event','Nothing specific','Other'];
const PHYSICAL  = ['Relaxed','Tired','Restless','Tense','Low energy','Headache','Fast heartbeat','Difficulty concentrating','Comfortable','Other'];
const HELPED    = ['Talking to someone','Music','Exercise','Walking','Rest','Meditation','Journaling','Entertainment','Spending time with family/friends','Nothing yet','Other'];

/* ─── State ────────────────────────────────────────────────────── */
const state = {
  primaryEmotion    : null,   // { emoji, label }
  secondaryEmotions : [],     // [{ emoji, label }, …]
  intensity         : 5,
  triggers          : [],     // string[]
  triggerOther      : '',
  whatHappened      : '',
  thoughtsFeelings  : '',
  physicalFeelings  : [],
  physicalOther     : '',
  energyLevel       : 5,
  whatHelped        : [],
  helpedOther       : '',
  gratitude         : '',
};

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();
let selectedCalDay = null;

/* ─── Storage keys ─────────────────────────────────────────────── */
const EMOTION_KEY    = 'mw_emotion_entries';
const TEXT_KEY       = 'mw_text_entries';
const VOICE_KEY      = 'mw_voice_entries';
const REFLECTION_KEY = 'mw_weekly_reflection';

/* ====================================================================
   INIT
   ==================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  setupMobileNav();

  /* Journal card → panel */
  document.getElementById('btn-text-journal')   ?.addEventListener('click', () => openPanel('panel-text'));
  document.getElementById('btn-voice-journal')  ?.addEventListener('click', () => openPanel('panel-voice'));
  document.getElementById('btn-emotion-journal')?.addEventListener('click', () => openPanel('panel-emotion'));

  document.getElementById('close-text')   ?.addEventListener('click', () => closePanel('panel-text'));
  document.getElementById('close-voice')  ?.addEventListener('click', () => closePanel('panel-voice'));
  document.getElementById('close-emotion')?.addEventListener('click', () => closePanel('panel-emotion'));

  /* Text journal */
  setupTextJournal();

  /* Voice journal */
  setupVoiceJournal();

  /* Emotion journal */
  setupEmotionJournal();

  /* Always-visible sections */
  setupCalendar();
  setupFilterDropdown();
  loadReflection();

  /* Render all stored data */
  renderTextEntries();
  renderVoiceEntries();
  renderEmotionTimeline();
  renderCalendar();
  renderInsights();
});

/* ====================================================================
   NAVBAR
   ==================================================================== */
function setupNavbar() {
  const nb = document.querySelector('.navbar-header');
  if (!nb) return;
  const fn = () => nb.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', fn); fn();
}

function setupMobileNav() {
  const btn  = document.getElementById('mobile-toggle');
  const menu = document.getElementById('primary-navigation');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const o = document.body.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', o);
  });
  menu.querySelectorAll('.nav-link,.btn-login').forEach(l =>
    l.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ====================================================================
   PANEL HELPERS
   ==================================================================== */
function openPanel(id) {
  document.querySelectorAll('.journal-panel').forEach(p => {
    p.classList.remove('panel-active');
    p.setAttribute('aria-hidden', 'true');
    p.style.display = '';
  });
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display = 'block';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.classList.add('panel-active');
    panel.setAttribute('aria-hidden', 'false');
    setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }));
}

function closePanel(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.classList.remove('panel-active');
  panel.setAttribute('aria-hidden', 'true');
  setTimeout(() => { panel.style.display = ''; }, 440);
}

/* ====================================================================
   TOAST
   ==================================================================== */
function showToast(msg = 'Saved!', duration = 2800) {
  const el = document.getElementById('journal-toast');
  const ms = document.getElementById('toast-msg');
  if (!el || !ms) return;
  ms.textContent = msg;
  el.classList.add('toast-show');
  setTimeout(() => el.classList.remove('toast-show'), duration);
}

/* ====================================================================
   DATE HELPERS
   ==================================================================== */
function fmtDate(d = new Date()) {
  return d.toLocaleString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtShort(d = new Date()) {
  return d.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtDayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ====================================================================
   LOCALSTORAGE HELPERS
   ==================================================================== */
function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn(e); } }
function loadStr(key) { return localStorage.getItem(key) || ''; }
function saveStr(key, val) { localStorage.setItem(key, val); }

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ====================================================================
   TEXT JOURNAL
   ==================================================================== */
function setupTextJournal() {
  const dateEl = document.getElementById('text-journal-date');
  if (dateEl) dateEl.textContent = fmtDate();

  const ta = document.getElementById('journal-textarea');
  const cc = document.getElementById('char-count');
  ta?.addEventListener('input', () => { if (cc) cc.textContent = ta.value.length; });

  document.getElementById('save-text-entry')?.addEventListener('click', () => {
    const title = document.getElementById('journal-entry-title')?.value.trim();
    const text  = ta?.value.trim();
    if (!text) { showToast('Please write something first.'); return; }
    const entries = load(TEXT_KEY);
    entries.unshift({ id: Date.now(), title: title || 'Untitled Entry', text, date: new Date().toISOString() });
    save(TEXT_KEY, entries);
    document.getElementById('journal-entry-title').value = '';
    ta.value = ''; if (cc) cc.textContent = '0';
    renderTextEntries();
    showToast('Entry saved ');
  });

  document.getElementById('clear-text-entry')?.addEventListener('click', () => {
    document.getElementById('journal-entry-title').value = '';
    const ta = document.getElementById('journal-textarea');
    ta.value = '';
    const cc = document.getElementById('char-count');
    if (cc) cc.textContent = '0';
  });
}

function renderTextEntries() {
  const c = document.getElementById('text-entries-container');
  if (!c) return;
  const entries = load(TEXT_KEY);
  if (!entries.length) { c.innerHTML = '<p class="no-entries-msg">No entries yet. Start writing!</p>'; return; }
  c.innerHTML = entries.map(e => `
    <div class="entry-item">
      <div class="entry-item__meta">${fmtShort(new Date(e.date))}</div>
      <div class="entry-item__body">
        <div class="entry-item__title">${escHtml(e.title)}</div>
        <div class="entry-item__preview">${escHtml(e.text)}</div>
      </div>
    </div>`).join('');
}

/* ====================================================================
   VOICE JOURNAL
   ==================================================================== */
let mediaRecorder = null, audioChunks = [], timerInt = null, secs = 0;

function setupVoiceJournal() {
  document.getElementById('voice-start-btn')?.addEventListener('click', startRecording);
  document.getElementById('voice-stop-btn') ?.addEventListener('click', stopRecording);
  document.getElementById('save-voice-entry')?.addEventListener('click', saveVoiceEntry);
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) { showToast('Microphone not supported.'); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = onRecordStop;
    mediaRecorder.start();
    setRecordUI(true); startTimer();
  } catch { showToast('Mic access denied. Please allow microphone access.'); }
}

function stopRecording() {
  if (mediaRecorder?.state !== 'inactive') { mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t => t.stop()); }
  setRecordUI(false); stopTimer();
}

function onRecordStop() {
  const blob = new Blob(audioChunks, { type: 'audio/webm' });
  const url  = URL.createObjectURL(blob);
  const audio = document.getElementById('voice-audio');
  const pb    = document.getElementById('voice-playback');
  if (audio) audio.src = url;
  if (pb) pb.style.display = 'flex';
  document.getElementById('save-voice-entry')._blob = blob;
}

function saveVoiceEntry() {
  const blob = document.getElementById('save-voice-entry')?._blob;
  if (!blob) { showToast('No recording to save.'); return; }
  const reader = new FileReader();
  reader.onloadend = () => {
    const entries = load(VOICE_KEY);
    entries.unshift({ id: Date.now(), dataUrl: reader.result, duration: secs, date: new Date().toISOString() });
    save(VOICE_KEY, entries);
    renderVoiceEntries();
    document.getElementById('voice-playback').style.display = 'none';
    secs = 0; document.getElementById('voice-timer').textContent = '00:00';
    showToast('Recording saved ');
  };
  reader.readAsDataURL(blob);
}

function setRecordUI(rec) {
  document.getElementById('voice-visualizer')?.classList.toggle('recording', rec);
  document.getElementById('voice-status-dot')?.classList.toggle('dot-recording', rec);
  const st = document.getElementById('voice-status-text');
  if (st) st.textContent = rec ? 'Recording…' : 'Stopped';
  const startBtn = document.getElementById('voice-start-btn');
  const stopBtn  = document.getElementById('voice-stop-btn');
  if (startBtn) startBtn.disabled = rec;
  if (stopBtn)  stopBtn.disabled  = !rec;
}

function startTimer() { secs = 0; updateTimer(); timerInt = setInterval(() => { secs++; updateTimer(); }, 1000); }
function stopTimer()  { clearInterval(timerInt); }
function updateTimer() {
  const el = document.getElementById('voice-timer');
  if (el) el.textContent = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
}

function renderVoiceEntries() {
  const c = document.getElementById('voice-entries-container');
  if (!c) return;
  const entries = load(VOICE_KEY);
  if (!entries.length) { c.innerHTML = '<p class="no-entries-msg">No recordings yet. Tap the mic to begin!</p>'; return; }
  c.innerHTML = entries.map(e => {
    const dur = `${String(Math.floor(e.duration/60)).padStart(2,'0')}:${String(e.duration%60).padStart(2,'0')}`;
    return `<div class="entry-item">
      <div class="entry-item__meta">${fmtShort(new Date(e.date))}<br><span style="font-size:.68rem">⏱ ${dur}</span></div>
      <div class="entry-item__body">
        <div class="entry-item__title">Voice Recording</div>
        <audio controls src="${e.dataUrl}" style="width:100%;margin-top:6px;border-radius:8px;"></audio>
      </div>
    </div>`;
  }).join('');
}

/* ====================================================================
   EMOTION JOURNAL — SETUP
   ==================================================================== */
function setupEmotionJournal() {
  const dateEl = document.getElementById('emotion-journal-date');
  if (dateEl) dateEl.textContent = fmtDate();

  renderPrimaryEmotions();
  renderSecondaryEmotions();
  renderChipGroup('trigger-chips-grid', TRIGGERS, 'triggers', 'trigger-other-field', 'trigger-other-input');
  renderChipGroup('physical-chips-grid', PHYSICAL, 'physicalFeelings', 'physical-other-field', 'physical-other-input');
  renderChipGroup('helped-chips-grid', HELPED, 'whatHelped', 'helped-other-field', 'helped-other-input');

  setupSlider('intensity-slider', 'intensity-val', 'intensity', false);
  setupSlider('energy-slider', 'energy-val', 'energyLevel', true);

  document.getElementById('save-emotion-entry') ?.addEventListener('click', saveEmotionEntry);
  document.getElementById('clear-emotion-entry')?.addEventListener('click', resetEmotionForm);
}

/* Primary emotions — single select (clean modern typography, no emojis) */
function renderPrimaryEmotions() {
  const grid = document.getElementById('primary-emotion-grid');
  if (!grid) return;
  grid.innerHTML = EMOTIONS.map(em => `
    <button class="ej-primary-chip" data-label="${em.label}" aria-pressed="false" type="button">
      <span class="ej-primary-label">${em.label}</span>
    </button>`).join('');

  grid.querySelectorAll('.ej-primary-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const label = chip.dataset.label;
      const already = chip.classList.contains('selected');
      grid.querySelectorAll('.ej-primary-chip').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed','false'); });
      if (!already) {
        chip.classList.add('selected');
        chip.setAttribute('aria-pressed','true');
        const em = EMOTIONS.find(e => e.label === label);
        state.primaryEmotion = em || null;
      } else {
        state.primaryEmotion = null;
      }
    });
  });
}

/* Secondary emotions — multi select (no emojis) */
function renderSecondaryEmotions() {
  const grid = document.getElementById('secondary-emotion-grid');
  if (!grid) return;
  grid.innerHTML = EMOTIONS.map(em => `
    <button class="ej-secondary-chip" data-label="${em.label}" aria-pressed="false" type="button">
      <span>${em.label}</span>
    </button>`).join('');

  grid.querySelectorAll('.ej-secondary-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const label = chip.dataset.label;
      const on = chip.classList.toggle('selected');
      chip.setAttribute('aria-pressed', on);
      if (on) { if (!state.secondaryEmotions.find(e => e.label === label)) state.secondaryEmotions.push(EMOTIONS.find(e => e.label === label)); }
      else      { state.secondaryEmotions = state.secondaryEmotions.filter(e => e.label !== label); }
    });
  });
}

/* Generic chip group with Other support */
function renderChipGroup(gridId, items, stateKey, otherFieldId, otherInputId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = items.map(item => {
    const isOther = item === 'Other';
    return `<button class="ej-chip${isOther ? ' ej-chip--other' : ''}" data-val="${item}" aria-pressed="false" type="button">${item}</button>`;
  }).join('');

  grid.querySelectorAll('.ej-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val;
      const on  = chip.classList.toggle('selected');
      chip.setAttribute('aria-pressed', on);

      if (on) { if (!state[stateKey].includes(val)) state[stateKey].push(val); }
      else    { state[stateKey] = state[stateKey].filter(v => v !== val); }

      /* Show/hide Other field */
      if (val === 'Other') {
        const field = document.getElementById(otherFieldId);
        if (field) { field.style.display = on ? 'block' : 'none'; if (!on) { const inp = document.getElementById(otherInputId); if (inp) inp.value = ''; } }
      }
    });
  });
}

/* Slider setup */
function setupSlider(sliderId, valId, stateKey, isEnergy) {
  const slider = document.getElementById(sliderId);
  const valEl  = document.getElementById(valId);
  if (!slider) return;

  const update = () => {
    const v = Number(slider.value);
    state[stateKey] = v;
    if (valEl) valEl.textContent = v;
    const pct = ((v - 1) / 9) * 100;
    slider.style.setProperty('--slider-pct', `${pct}%`);
  };

  slider.addEventListener('input', update);
  update(); // set initial display
}

/* ====================================================================
   EMOTION JOURNAL — SAVE
   ==================================================================== */
function saveEmotionEntry() {
  if (!state.primaryEmotion) { showToast('Please select a primary emotion first.'); return; }

  const triggerOther   = document.getElementById('trigger-other-input')  ?.value.trim() || '';
  const physicalOther  = document.getElementById('physical-other-input') ?.value.trim() || '';
  const helpedOther    = document.getElementById('helped-other-input')   ?.value.trim() || '';
  const whatHappened   = document.getElementById('what-happened')        ?.value.trim() || '';
  const thoughtsFeel   = document.getElementById('thoughts-feelings')    ?.value.trim() || '';
  const gratitude      = document.getElementById('gratitude-text')       ?.value.trim() || '';

  const entry = {
    id              : Date.now(),
    date            : new Date().toISOString(),
    primaryEmotion  : state.primaryEmotion,
    secondaryEmotions: [...state.secondaryEmotions],
    intensity       : state.intensity,
    triggers        : [...state.triggers],
    triggerOther,
    whatHappened,
    thoughtsFeelings: thoughtsFeel,
    physicalFeelings: [...state.physicalFeelings],
    physicalOther,
    energyLevel     : state.energyLevel,
    whatHelped      : [...state.whatHelped],
    helpedOther,
    gratitude,
  };

  const entries = load(EMOTION_KEY);
  entries.unshift(entry);
  save(EMOTION_KEY, entries);

  resetEmotionForm();
  renderEmotionTimeline();
  renderCalendar();
  renderInsights();
  setupFilterDropdown();
  showToast(' Emotion entry saved successfully');
}

/* ====================================================================
   EMOTION JOURNAL — RESET FORM
   ==================================================================== */
function resetEmotionForm() {
  state.primaryEmotion    = null;
  state.secondaryEmotions = [];
  state.intensity         = 5;
  state.triggers          = [];
  state.physicalFeelings  = [];
  state.whatHelped        = [];
  state.energyLevel       = 5;

  document.querySelectorAll('.ej-primary-chip, .ej-secondary-chip, .ej-chip').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed','false'); });

  ['trigger-other-field','physical-other-field','helped-other-field'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  ['trigger-other-input','physical-other-input','helped-other-input',
   'what-happened','thoughts-feelings','gratitude-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const iSlider = document.getElementById('intensity-slider');
  const eSlider = document.getElementById('energy-slider');
  if (iSlider) { iSlider.value = 5; const iv = document.getElementById('intensity-val'); if (iv) iv.textContent = 5; iSlider.style.setProperty('--slider-pct','44.44%'); }
  if (eSlider) { eSlider.value = 5; const ev = document.getElementById('energy-val');   if (ev) ev.textContent = 5; eSlider.style.setProperty('--slider-pct','44.44%'); }
}

/* ====================================================================
   EMOTION TIMELINE
   ==================================================================== */
function setupFilterDropdown() {
  const sel = document.getElementById('log-filter-emotion');
  if (!sel) return;
  const entries = load(EMOTION_KEY);
  const labels  = [...new Set(entries.map(e => e.primaryEmotion?.label).filter(Boolean))];
  const current = sel.value;
  sel.innerHTML = '<option value="">All Emotions</option>' + labels.map(l => `<option value="${l}" ${l===current?'selected':''}>${l}</option>`).join('');
  sel.onchange = renderEmotionTimeline;
}

function renderEmotionTimeline() {
  const container = document.getElementById('emotion-timeline');
  if (!container) return;
  const filter  = document.getElementById('log-filter-emotion')?.value || '';
  let   entries = load(EMOTION_KEY);
  if (filter) entries = entries.filter(e => e.primaryEmotion?.label === filter);

  if (!entries.length) {
    container.innerHTML = '<p class="no-entries-msg">No entries yet. Track your first emotion above!</p>';
    return;
  }

  container.innerHTML = entries.map(e => {
    const secondary = e.secondaryEmotions?.map(s => s.label).join(', ') || '';
    const triggers  = [...(e.triggers||[])].map(t => t === 'Other' && e.triggerOther ? e.triggerOther : t).join(', ');
    const helped    = [...(e.whatHelped||[])].map(h => h === 'Other' && e.helpedOther ? e.helpedOther : h).join(', ');
    const physical  = [...(e.physicalFeelings||[])].map(p => p === 'Other' && e.physicalOther ? e.physicalOther : p).join(', ');

    return `
    <div class="ej-tl-card" id="tlcard-${e.id}">
      <div class="ej-tl-card-top" onclick="toggleTlCard(${e.id})">
        <div class="ej-tl-info">
          <div class="ej-tl-emotion">${escHtml(e.primaryEmotion?.label || 'Unknown')}</div>
          <div class="ej-tl-meta">
            <span>${fmtShort(new Date(e.date))}</span>
            ${secondary ? `<span>Also: ${escHtml(secondary)}</span>` : ''}
          </div>
          <div class="ej-tl-badges">
            <span class="ej-tl-badge ej-tl-badge--intensity">Intensity ${e.intensity}/10</span>
            <span class="ej-tl-badge ej-tl-badge--energy">Energy ${e.energyLevel}/10</span>
          </div>
        </div>
        <span class="ej-tl-expand-icon">▼</span>
        <button class="ej-tl-delete" onclick="deleteEntry(event,${e.id})" aria-label="Delete entry" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <div class="ej-tl-detail">
        <div class="ej-detail-grid">
          ${triggers     ? `<div class="ej-detail-item"><label>Triggers</label><p>${escHtml(triggers)}</p></div>` : ''}
          ${physical     ? `<div class="ej-detail-item"><label>Physical</label><p>${escHtml(physical)}</p></div>` : ''}
          ${helped       ? `<div class="ej-detail-item"><label>What Helped</label><p>${escHtml(helped)}</p></div>` : ''}
          ${e.gratitude  ? `<div class="ej-detail-item"><label>Gratitude</label><p>${escHtml(e.gratitude)}</p></div>` : ''}
          ${e.whatHappened ? `<div class="ej-detail-item" style="grid-column:1/-1"><label>What Happened</label><p>${escHtml(e.whatHappened)}</p></div>` : ''}
          ${e.thoughtsFeelings ? `<div class="ej-detail-item" style="grid-column:1/-1"><label>Thoughts & Feelings</label><p>${escHtml(e.thoughtsFeelings)}</p></div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleTlCard(id) {
  document.getElementById(`tlcard-${id}`)?.classList.toggle('expanded');
}

function deleteEntry(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this emotion entry?')) return;
  const entries = load(EMOTION_KEY).filter(en => en.id !== id);
  save(EMOTION_KEY, entries);
  renderEmotionTimeline();
  renderCalendar();
  renderInsights();
  setupFilterDropdown();
  showToast('Entry deleted');
}

/* ====================================================================
   CALENDAR
   ==================================================================== */
function setupCalendar() {
  document.getElementById('cal-prev')?.addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
  document.getElementById('cal-next')?.addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });
}

function renderCalendar() {
  const labelEl = document.getElementById('cal-month-lbl');
  const grid    = document.getElementById('cal-grid');
  if (!labelEl || !grid) return;

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  labelEl.textContent = `${monthNames[calMonth]} ${calYear}`;

  const entries    = load(EMOTION_KEY);
  const entryDays  = {};
  entries.forEach(e => {
    const key = fmtDayKey(new Date(e.date));
    if (!entryDays[key]) entryDays[key] = [];
    entryDays[key].push(e);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = fmtDayKey(new Date());

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day cal-empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const key  = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday   = key === today;
    const hasEntry  = !!entryDays[key];
    const isSelected= key === selectedCalDay;
    const classes = ['cal-day', isToday?'cal-today':'', hasEntry?'cal-has-entry':'', isSelected?'cal-selected':''].filter(Boolean).join(' ');
    html += `<div class="${classes}" onclick="onCalDayClick('${key}',${d})">${d}${hasEntry?'<div class="cal-entry-dot"></div>':''}</div>`;
  }

  grid.innerHTML = html;

  /* Re-show detail if a day was selected */
  if (selectedCalDay && entryDays[selectedCalDay]) showCalDayDetail(selectedCalDay, entryDays[selectedCalDay]);
  else { const dd = document.getElementById('cal-day-detail'); if (dd) dd.style.display = 'none'; }
}

function onCalDayClick(key, day) {
  const entries = load(EMOTION_KEY);
  const entryDays = {};
  entries.forEach(e => { const k = fmtDayKey(new Date(e.date)); if (!entryDays[k]) entryDays[k] = []; entryDays[k].push(e); });

  if (selectedCalDay === key) {
    selectedCalDay = null;
    const dd = document.getElementById('cal-day-detail');
    if (dd) dd.style.display = 'none';
    renderCalendar(); return;
  }
  selectedCalDay = key;
  renderCalendar();
  if (entryDays[key]) showCalDayDetail(key, entryDays[key]);
}

function showCalDayDetail(key, entries) {
  const dd = document.getElementById('cal-day-detail');
  if (!dd) return;
  const [y,m,d] = key.split('-');
  const label = new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});
  dd.innerHTML = `<h4>${label} — ${entries.length} ${entries.length===1?'entry':'entries'}</h4>` +
    entries.map(e => `
      <div class="cal-day-detail-entry">
        <div>
          <strong style="font-size:.85rem;color:var(--text-primary)">${escHtml(e.primaryEmotion?.label||'Unknown')}</strong>
          <span style="font-size:.73rem;color:var(--text-muted);margin-left:8px">${fmtShort(new Date(e.date))}</span>
          <div style="font-size:.73rem;color:var(--text-muted);margin-top:2px">Intensity ${e.intensity}/10 · Energy ${e.energyLevel}/10${e.triggers?.length ? ` · ${e.triggers.join(', ')}` : ''}</div>
        </div>
      </div>`).join('');
  dd.style.display = 'block';
}

/* ====================================================================
   INSIGHTS
   ==================================================================== */
function renderInsights() {
  const grid = document.getElementById('insights-grid');
  if (!grid) return;
  const entries = load(EMOTION_KEY);

  if (!entries.length) {
    grid.innerHTML = '<div class="insights-empty"><p>Save a few emotion entries to see your patterns here.</p></div>';
    return;
  }

  /* Calculations */
  const total = entries.length;
  const avgIntensity = (entries.reduce((s,e) => s + (e.intensity||5), 0) / total).toFixed(1);
  const avgEnergy    = (entries.reduce((s,e) => s + (e.energyLevel||5), 0) / total).toFixed(1);

  /* Most frequent emotion */
  const emotionCount = {};
  entries.forEach(e => { const l = e.primaryEmotion?.label; if (l) emotionCount[l] = (emotionCount[l]||0)+1; });
  const [topEmotion] = Object.entries(emotionCount).sort((a,b) => b[1]-a[1])[0] || ['—', 0];

  /* Most common trigger */
  const trigCount = {};
  entries.forEach(e => (e.triggers||[]).forEach(t => { if (t!=='Other') trigCount[t] = (trigCount[t]||0)+1; }));
  const topTrigs = Object.entries(trigCount).sort((a,b) => b[1]-a[1]);
  const topTrig  = topTrigs[0]?.[0] || 'None recorded';

  /* This week entries */
  const weekAgo = Date.now() - 7*24*60*60*1000;
  const weekEntries = entries.filter(e => new Date(e.date).getTime() > weekAgo).length;

  grid.innerHTML = `
    <div class="insight-card">
      <div class="insight-label">Most Frequent Emotion</div>
      <div class="insight-value" style="font-size:1.4rem">${escHtml(topEmotion)}</div>
      <div class="insight-sub">Appeared ${emotionCount[topEmotion]||0}× in total</div>
    </div>
    <div class="insight-card">
      <div class="insight-label">Average Intensity</div>
      <div class="insight-value">${avgIntensity}<span style="font-size:1rem;color:var(--text-muted)">/10</span></div>
      <div class="insight-bar-track"><div class="insight-bar-fill" style="width:${(avgIntensity/10)*100}%"></div></div>
    </div>
    <div class="insight-card">
      <div class="insight-label">Average Energy Level</div>
      <div class="insight-value">${avgEnergy}<span style="font-size:1rem;color:var(--text-muted)">/10</span></div>
      <div class="insight-bar-track"><div class="insight-bar-fill insight-bar-fill--energy" style="width:${(avgEnergy/10)*100}%"></div></div>
    </div>
    <div class="insight-card">
      <div class="insight-label">Total Entries</div>
      <div class="insight-value">${total}</div>
      <div class="insight-sub">${weekEntries} this week</div>
    </div>
    <div class="insight-card">
      <div class="insight-label">Most Common Trigger</div>
      <div class="insight-value" style="font-size:1.1rem">${escHtml(topTrig)}</div>
      ${topTrig !== 'None recorded' ? `<div class="insight-sub">Recorded ${trigCount[topTrig]}×</div>` : ''}
    </div>
    <div class="insight-card">
      <div class="insight-label">Emotion Variety</div>
      <div class="insight-value">${Object.keys(emotionCount).length}<span style="font-size:1rem;color:var(--text-muted)"> types</span></div>
      <div class="insight-sub">out of 10 possible emotions</div>
    </div>
  `;
}

/* ====================================================================
   WEEKLY REFLECTION
   ==================================================================== */
function loadReflection() {
  const ta = document.getElementById('weekly-reflection-text');
  if (ta) ta.value = loadStr(REFLECTION_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-reflection-btn')?.addEventListener('click', () => {
    const text = document.getElementById('weekly-reflection-text')?.value.trim() || '';
    saveStr(REFLECTION_KEY, text);
    showToast('Reflection saved ');
  });

  document.querySelectorAll('.refl-prompt-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.title = 'Click to insert this prompt into your reflection';
    card.addEventListener('click', () => {
      const ta = document.getElementById('weekly-reflection-text');
      if (ta) {
        const promptText = card.textContent.trim();
        const currentVal = ta.value.trim();
        ta.value = currentVal ? `${currentVal}\n\n${promptText}\n` : `${promptText}\n`;
        ta.focus();
        showToast('Prompt added to reflection');
      }
    });
  });
});

/* Expose to inline onclick */
window.toggleTlCard  = toggleTlCard;
window.deleteEntry   = deleteEntry;
window.onCalDayClick = onCalDayClick;
