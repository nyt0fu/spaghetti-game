import { queueForced, isTonyActive, escalateTony, TRANSFORMED_TONY } from './events.js';

const MIN_INTERVAL = 6667;
const MAX_INTERVAL = 15000;
const MAX_ACTIVE = 2;
const IGNORE_THRESHOLD = 3;
const DEMAND_TIMEOUT_MS = 10000;

function rollVigAmount() {
  const r = Math.random();
  if (r < 0.05) return Math.floor(Math.random() * 10) + 1;
  if (r < 0.10) return Math.floor(Math.random() * 501) + 1000;
  return Math.floor(Math.random() * 501) + 200;
}

const PHONE_SPRITE = `<svg viewBox="0 0 32 60" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="2" width="16" height="56" rx="8" fill="#2a2a4a"/>
  <rect x="7" y="5" width="10" height="4" rx="2" fill="#1a1a3a"/>
  <rect x="7" y="51" width="10" height="4" rx="2" fill="#1a1a3a"/>
  <path d="M22,14 Q30,30 22,46" stroke="#4a4a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M25,8 Q36,30 25,52" stroke="#3a3a6a" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const VIG_SPRITE = `<svg viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="24" width="44" height="12" rx="6" fill="#2a2a4a"/>
  <rect x="10" y="6" width="8" height="22" rx="4" fill="#2a2a4a"/>
  <rect x="22" y="2" width="8" height="26" rx="4" fill="#2a2a4a"/>
  <rect x="34" y="2" width="8" height="26" rx="4" fill="#2a2a4a"/>
  <rect x="44" y="8" width="8" height="20" rx="4" fill="#2a2a4a"/>
  <rect x="4" y="34" width="52" height="14" rx="3" fill="#2a2a4a"/>
  <rect x="4" y="34" width="52" height="5" rx="2" fill="#3a3a5a"/>
</svg>`;

const EYE_SPRITE = `<svg viewBox="0 0 50 30" xmlns="http://www.w3.org/2000/svg">
  <path d="M10,8 Q25,2 40,8" stroke="#2a2a4a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M5,18 Q25,4 45,18 Q25,32 5,18 Z" fill="#2a2a4a"/>
  <circle cx="25" cy="18" r="7" fill="#1a1a3a"/>
  <circle cx="25" cy="18" r="3.5" fill="#0a0a1a"/>
</svg>`;

const DEMANDS = [
  {
    id: 'phone',
    sprite: PHONE_SPRITE,
    entrance: 'pop',
    quotes: [
      'you never call anymore.',
      "it's me. you know who.",
      'just checking in.',
      'we should talk.',
      "don't make me come down there.",
    ],
    consequences: [
      { id: 'phone-c1', caption: 'the phone rings. nobody answers.', entranceFrom: 'fade', durationMs: 4000, sprite: PHONE_SPRITE },
      { id: 'phone-c2', caption: 'it keeps ringing.', entranceFrom: 'fade', durationMs: 4000, sprite: PHONE_SPRITE },
      { id: 'phone-c3', caption: 'the phone stopped ringing.', entranceFrom: 'fade', durationMs: 4000, sprite: PHONE_SPRITE },
    ],
  },
  {
    id: 'vig',
    sprite: VIG_SPRITE,
    entrance: 'slide-right',
    quotes: null,
    consequences: [
      { id: 'vig-c1', caption: 'the hand lingers.', entranceFrom: 'fade', durationMs: 4000, sprite: EYE_SPRITE },
      { id: 'vig-c2', caption: 'the hand returns.', entranceFrom: 'fade', durationMs: 4000, sprite: EYE_SPRITE },
      { id: 'vig-c3', caption: 'they noticed.', entranceFrom: 'fade', durationMs: 4000, sprite: EYE_SPRITE },
    ],
  },
];

let active = [];
let phoneIgnores = 0;
let vigIgnores = 0;
let vigTabTotal = 0;
let _onVigChange = null;
let _scheduleTimerId = null;

export function getVigTotal() { return vigTabTotal; }

export function addVig(amount) {
  updateVigTab(amount);
}

export function subtractVig(amount) {
  vigTabTotal = Math.max(0, vigTabTotal - amount);
  const tab = document.getElementById('vig-tab');
  if (tab) tab.textContent = `Owed: $${vigTabTotal}`;
  if (_onVigChange) _onVigChange(vigTabTotal);
}

export function initDemands(onVigChange) {
  _onVigChange = onVigChange || null;
  updateVigTab(0);
  scheduleDemand();
}

export function restartDemands(onVigChange) {
  clearTimeout(_scheduleTimerId);
  _scheduleTimerId = null;
  [...active].forEach(entry => { clearTimeout(entry.timerId); entry.el.remove(); });
  active = [];
  phoneIgnores = 0;
  vigIgnores = 0;
  vigTabTotal = 0;
  _onVigChange = onVigChange || null;
  updateVigTab(0);
  scheduleDemand();
}

function scheduleDemand() {
  const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  _scheduleTimerId = setTimeout(tryShowDemand, delay);
}

export function haltDemands() {
  clearTimeout(_scheduleTimerId);
  _scheduleTimerId = null;
  [...active].forEach(entry => {
    clearTimeout(entry.timerId);
    entry.el.style.pointerEvents = 'none';
    removeDemand(entry.el);
  });
  active = [];
}

function tryShowDemand() {
  if (active.length < MAX_ACTIVE) {
    const def = DEMANDS[Math.floor(Math.random() * DEMANDS.length)];
    showDemand(def);
  }
  scheduleDemand();
}

function showDemand(def) {
  const container = document.getElementById('kitchen-stage');
  if (!container) return;

  const amount = def.id === 'vig' ? rollVigAmount() : null;

  const el = document.createElement('div');
  el.className = `demand demand--${def.id}`;

  const label = amount !== null
    ? `<span class="demand__label">$${amount}</span>`
    : '';

  el.innerHTML = `${def.sprite}${label}`;
  container.appendChild(el);

  el.getBoundingClientRect();
  el.classList.add('is-visible');

  const entry = { el, def, amount, timerId: null };
  active.push(entry);

  entry.timerId = setTimeout(() => handleIgnore(entry), DEMAND_TIMEOUT_MS);

  el.addEventListener('pointerdown', e => {
    e.stopPropagation();
    clearTimeout(entry.timerId);
    active = active.filter(a => a !== entry);
    handleClick(entry);
  });
}

function handleClick({ el, def, amount }) {
  if (def.id === 'phone') {
    const quote = def.quotes[Math.floor(Math.random() * def.quotes.length)];
    const quoteEl = document.createElement('span');
    quoteEl.className = 'demand__quote';
    quoteEl.textContent = `"${quote}"`;
    el.appendChild(quoteEl);
    setTimeout(() => removeDemand(el), 1500);
  } else {
    updateVigTab(amount);
    removeDemand(el);
  }
}

function handleIgnore(entry) {
  active = active.filter(a => a !== entry);
  const { el, def } = entry;
  removeDemand(el);

  if (def.id === 'phone') {
    phoneIgnores++;
    const c = def.consequences[Math.min(phoneIgnores - 1, def.consequences.length - 1)];
    queueForced(c);
  } else {
    vigIgnores++;
    const c = def.consequences[Math.min(vigIgnores - 1, def.consequences.length - 1)];
    queueForced(c);
  }

  checkThreshold();
}

function checkThreshold() {
  if (phoneIgnores >= IGNORE_THRESHOLD && vigIgnores >= IGNORE_THRESHOLD) {
    phoneIgnores = 0;
    vigIgnores = 0;
    if (isTonyActive()) {
      escalateTony();
    } else {
      queueForced(TRANSFORMED_TONY);
    }
  }
}

function removeDemand(el) {
  el.classList.remove('is-visible');
  setTimeout(() => el.remove(), 400);
}

function updateVigTab(amount) {
  vigTabTotal += amount;
  const tab = document.getElementById('vig-tab');
  if (tab) tab.textContent = `Owed: $${vigTabTotal}`;
  if (_onVigChange) _onVigChange(vigTabTotal);
}
