const MIN_INTERVAL = 2000;
const MAX_INTERVAL = 5000;

export const TRANSFORMED_TONY = {
  id: 'tony-transformed',
  caption: 'tony can feel it. the marinara runs deep.',
  entranceFrom: 'fade',
  durationMs: 6000,
  permanent: true,
  sprite: `<svg viewBox="0 0 40 80" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="52" rx="18" ry="30" fill="none" stroke="#d4a840" stroke-width="1.5"/>
    <line x1="4" y1="34" x2="-1" y2="20" stroke="#d4a840" stroke-width="1.5"/>
    <line x1="36" y1="34" x2="41" y2="20" stroke="#d4a840" stroke-width="1.5"/>
    <line x1="2" y1="52" x2="-3" y2="48" stroke="#d4a840" stroke-width="1.5"/>
    <line x1="38" y1="52" x2="43" y2="48" stroke="#d4a840" stroke-width="1.5"/>
    <path d="M13,17 L8,3 L16,15" fill="#d4a840"/>
    <path d="M17,14 L15,0 L22,13" fill="#d4a840"/>
    <path d="M22,13 L21,-2 L27,13" fill="#d4a840"/>
    <path d="M26,15 L30,3 L30,17" fill="#d4a840"/>
    <path d="M11,19 L4,12 L13,21" fill="#d4a840"/>
    <circle cx="20" cy="18" r="7" fill="#2a2a4a"/>
    <g transform="translate(30,3) rotate(35)">
      <rect x="-5" y="2" width="12" height="3" rx="1" fill="#1a1a3a"/>
      <rect x="-2" y="-2" width="7" height="5" rx="2" fill="#1a1a3a"/>
    </g>
    <path d="M7,26 L5,52 L35,52 L33,26 Z" fill="#2a2a4a"/>
    <path d="M20,28 L13,26 L11,38 Z" fill="#1a1a3a"/>
    <path d="M20,28 L27,26 L29,38 Z" fill="#1a1a3a"/>
    <path d="M19,28 L20,42 L21,28 Z" fill="#8b0000"/>
    <rect x="0" y="30" width="10" height="5" rx="2" fill="#2a2a4a" transform="rotate(-20 5 32)"/>
    <rect x="30" y="30" width="10" height="5" rx="2" fill="#2a2a4a" transform="rotate(20 35 32)"/>
    <rect x="-3" y="25" width="5" height="5" rx="1" fill="#2a2a4a"/>
    <rect x="38" y="25" width="5" height="5" rx="1" fill="#2a2a4a"/>
    <rect x="11" y="52" width="7" height="22" rx="3" fill="#2a2a4a" transform="rotate(-10 14 52)"/>
    <rect x="22" y="52" width="7" height="22" rx="3" fill="#2a2a4a" transform="rotate(10 26 52)"/>
    <ellipse cx="9" cy="73" rx="7" ry="3" fill="#1a1a3a"/>
    <ellipse cx="31" cy="73" rx="7" ry="3" fill="#1a1a3a"/>
  </svg>`,
};

export const EVENTS = [];

let nextForcedEvent = null;
let scheduleTimerId = null;
let _runEvent = null;
let tonyActive = false;
let tonyTickRate = 2000;
let _tonyCounterInterval = null;
let _tonyCounter = null;
let _tonyCount = 0;
let _tonyCaption = null;

export function queueForced(def) {
  if (def.permanent) {
    showPermanentTony(def);
    return;
  }
  nextForcedEvent = def;
  if (_runEvent) {
    clearTimeout(scheduleTimerId);
    scheduleTimerId = setTimeout(_runEvent, 80);
  }
}

function startTonyTick() {
  clearInterval(_tonyCounterInterval);
  _tonyCounterInterval = setInterval(() => {
    _tonyCount++;
    _tonyCounter.textContent = _tonyCount;
    _tonyCounter.classList.remove('counter-tick');
    void _tonyCounter.offsetWidth;
    _tonyCounter.classList.add('counter-tick');
  }, tonyTickRate);
}

function showPermanentTony(def) {
  if (tonyActive) return;
  tonyActive = true;

  const container = document.getElementById('dining-room');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'tony-permanent';

  _tonyCounter = document.createElement('div');
  _tonyCounter.id = 'tony-counter';
  _tonyCounter.textContent = '0';

  wrapper.appendChild(_tonyCounter);
  wrapper.insertAdjacentHTML('beforeend', def.sprite);

  _tonyCaption = document.createElement('span');
  _tonyCaption.className = 'dining-event__caption';
  _tonyCaption.textContent = def.caption;
  wrapper.appendChild(_tonyCaption);

  container.appendChild(wrapper);

  wrapper.getBoundingClientRect();
  wrapper.classList.add('is-visible');

  startTonyTick();
}

export function isTonyActive() {
  return tonyActive;
}

export function escalateTony() {
  tonyTickRate = Math.max(500, tonyTickRate - 400);
  startTonyTick();
}

export function updateTonyCaption(isActive) {
  if (!_tonyCaption) return;
  _tonyCaption.textContent = isActive ? 'spaghetti game.' : 'ADD SAUCE TO THE SPAGHETTI.';
}

export function getTonyCount() { return _tonyCount; }

export function stopTonyTick() {
  clearInterval(_tonyCounterInterval);
  _tonyCounterInterval = null;
}

export function resetEventsState() {
  clearTimeout(scheduleTimerId);
  scheduleTimerId = null;
  clearInterval(_tonyCounterInterval);
  _tonyCounterInterval = null;
  tonyActive = false;
  tonyTickRate = 2000;
  _tonyCount = 0;
  _tonyCounter = null;
  _tonyCaption = null;
  nextForcedEvent = null;
  _runEvent = null; // marks any live closures as stale
}

export function initEvents() {
  const container = document.getElementById('dining-room');
  if (!container) { console.error('events: #dining-room not found'); return; }

  let busy = false;

  function scheduleNext() {
    if (runEvent !== _runEvent) return; // stale closure after reset — do not reschedule
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    scheduleTimerId = setTimeout(runEvent, delay);
  }

  function runEvent() {
    if (busy) { scheduleNext(); return; }

    const def = nextForcedEvent || (EVENTS.length ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null);
    nextForcedEvent = null;
    if (!def) { scheduleNext(); return; }

    busy = true;
    const el = document.createElement('div');
    el.className = `dining-event dining-event--${def.entranceFrom}`;
    el.innerHTML = `${def.sprite}<span class="dining-event__caption">${def.caption}</span>`;
    container.appendChild(el);

    // Force reflow so the browser registers the off-screen initial state
    // before .is-visible is added — without this the transition never fires.
    el.getBoundingClientRect();
    el.classList.add('is-visible');

    setTimeout(() => {
      el.classList.remove('is-visible');
      el.classList.add('is-exiting');
      waitForTransition(el, def.entranceFrom, () => {
        el.remove();
        busy = false;
        scheduleNext();
      });
    }, def.durationMs);
  }

  _runEvent = runEvent;
  scheduleNext();
}

function waitForTransition(el, entranceFrom, onDone) {
  const watchProp = entranceFrom === 'fade' ? 'opacity' : 'transform';
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    el.removeEventListener('transitionend', handler);
    onDone();
  }

  function handler(e) {
    if (e.target !== el) return;
    if (e.propertyName !== watchProp) return;
    finish();
  }

  el.addEventListener('transitionend', handler);
  // Fallback: transitionend won't fire if prefers-reduced-motion suppresses
  // transitions or if the element leaves the DOM early.
  setTimeout(finish, 800);
}
