const SEATED_TONY = `<svg viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
  <path d="M12,17 L8,4 L16,15" fill="#d4a840"/>
  <path d="M16,14 L15,1 L22,13" fill="#d4a840"/>
  <path d="M22,13 L21,0 L27,13" fill="#d4a840"/>
  <path d="M26,15 L30,4 L30,17" fill="#d4a840"/>
  <path d="M10,19 L4,12 L13,21" fill="#d4a840"/>
  <circle cx="20" cy="19" r="8" fill="#2a2a4a"/>
  <rect x="13" y="16" width="6" height="4" rx="2" fill="#0a0a1a"/>
  <rect x="21" y="16" width="6" height="4" rx="2" fill="#0a0a1a"/>
  <line x1="19" y1="18" x2="21" y2="18" stroke="#1a1a3a" stroke-width="1.5"/>
  <rect x="17" y="27" width="6" height="4" fill="#2a2a4a"/>
  <rect x="8" y="31" width="24" height="16" rx="3" fill="#2a2a4a"/>
  <path d="M20,31 L14,31 L13,41 Z" fill="#1a1a3a"/>
  <path d="M20,31 L26,31 L27,41 Z" fill="#1a1a3a"/>
  <rect x="0" y="44" width="15" height="6" rx="3" fill="#2a2a4a"/>
  <rect x="25" y="44" width="15" height="6" rx="3" fill="#2a2a4a"/>
</svg>`;

let _sitdownTonys = [];

export function enterPhase3(frozenCount) {
  const dining = document.getElementById('dining-room');
  if (!dining) return;

  dining.innerHTML = '';
  document.body.classList.add('phase-3');

  const scene = document.createElement('div');
  scene.className = 'sitdown-scene';

  const row = document.createElement('div');
  row.className = 'sitdown-row';

  _sitdownTonys = [];
  ['left', 'center', 'right'].forEach(pos => {
    const wrapper = document.createElement('div');
    wrapper.className = 'sitdown-tony';

    if (pos === 'center' && frozenCount != null) {
      const score = document.createElement('span');
      score.className = 'shame-score';
      score.textContent = frozenCount;
      wrapper.appendChild(score);
    }

    wrapper.insertAdjacentHTML('beforeend', SEATED_TONY);
    row.appendChild(wrapper);
    _sitdownTonys.push(wrapper);
  });

  const table = document.createElement('div');
  table.className = 'sitdown-table';

  scene.appendChild(row);
  scene.appendChild(table);
  dining.appendChild(scene);
}

function setPanelZoom(cls) {
  const d = document.getElementById('dining-room');
  const k = document.getElementById('kitchen');
  ['t-zoom', 't-zoom-2'].forEach(c => { d.classList.remove(c); k.classList.remove(c); });
  if (cls) { d.classList.add(cls); k.classList.add(cls); }
}

export function runPhase3Transition(onSceneSwap) {
  const overlay = document.createElement('div');
  overlay.id = 'transition-overlay';
  document.body.appendChild(overlay);

  // frame 1: lurch (old scene)
  setPanelZoom('t-zoom');

  // frame 2: bigger + white flash
  setTimeout(() => {
    setPanelZoom('t-zoom-2');
    overlay.classList.add('t-flash');
  }, 80);

  // frame 3: blackout, drop scale (panels hidden anyway)
  setTimeout(() => {
    setPanelZoom(null);
    overlay.classList.remove('t-flash');
    overlay.classList.add('t-black');
  }, 160);

  // scene swap happens during black
  setTimeout(() => {
    onSceneSwap();
  }, 280);

  // frame 4: reveal new scene at zoom-2
  setTimeout(() => {
    setPanelZoom('t-zoom-2');
    overlay.classList.remove('t-black');
  }, 360);

  // frame 5: step zoom back
  setTimeout(() => {
    setPanelZoom('t-zoom');
  }, 440);

  // frame 6: snap to normal, clean up overlay
  setTimeout(() => {
    setPanelZoom(null);
    overlay.remove();
  }, 520);
}

export function resetPhase3State() {
  _sitdownTonys = [];
}

export function showCompletionScreen(onReset) {
  const overlay = document.createElement('div');
  overlay.id = 'completion-overlay';

  const prompt = document.createElement('button');
  prompt.className = 'completion-prompt';
  prompt.textContent = 'spaghetti game';
  overlay.appendChild(prompt);

  document.body.appendChild(overlay);

  prompt.addEventListener('pointerdown', () => {
    overlay.remove();
    onReset();
  }, { once: true });
}

export function showSpaghettiBubbles() {
  _sitdownTonys.forEach(wrapper => {
    const old = wrapper.querySelector('.sitdown-quote');
    if (old) old.remove();

    const bubble = document.createElement('span');
    bubble.className = 'sitdown-quote';
    bubble.textContent = 'spaghetti game.';
    wrapper.appendChild(bubble);

    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  });
}
