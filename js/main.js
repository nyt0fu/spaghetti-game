import { init as initScoop } from './scoop.js';
import { initEvents, queueForced, TRANSFORMED_TONY, isTonyActive, updateTonyCaption, getTonyCount, stopTonyTick, resetEventsState } from './events.js';
import { initDemands, subtractVig, addVig, haltDemands, restartDemands } from './demands.js';
import { getPhase, setPhase } from './state.js';
import { enterPhase3, showSpaghettiBubbles, runPhase3Transition, showCompletionScreen, resetPhase3State } from './phase3.js';

const IDLE_TIMEOUT = 5000;
let idleTimer = null;

function onInteract() {
  if (getPhase() >= 2) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => queueForced(TRANSFORMED_TONY), IDLE_TIMEOUT);
}

initScoop((unlock) => {
  unlock();
  if (getPhase() === 1) {
    addVig(Math.floor(Math.random() * 99) + 1);
  }
  if (getPhase() === 3) {
    subtractVig(200);
    // subtractVig fires onVigChange which may advance to Phase 4 — only show
    // bubbles if still in Phase 3 (i.e. total didn't hit zero on this fill)
    if (getPhase() === 3) showSpaghettiBubbles();
  }
}, onInteract);

initEvents();
initDemands(onVigChange);

// start idle timer on load — player has 5s before Tony stirs
onInteract();

function onVigChange(total) {
  const phase = getPhase();
  if (phase < 2 && total >= 1500) enterPhase2();
  if (phase < 3 && total >= 3500) triggerPhase3();
  if (phase === 3 && total <= 0)  triggerPhase4();
}

function enterPhase2() {
  setPhase(2);
  if (!isTonyActive()) queueForced(TRANSFORMED_TONY);
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);
}

function triggerPhase3() {
  stopTonyTick();
  const frozenCount = getTonyCount();
  setPhase(3);
  haltDemands();
  runPhase3Transition(() => enterPhase3(frozenCount));
}

function triggerPhase4() {
  setPhase(4);
  showCompletionScreen(performReset);
}

function performReset() {
  setPhase(1);

  // DOM cleanup
  document.body.classList.remove('phase-3');
  document.getElementById('dining-room').innerHTML = '';
  document.querySelectorAll('.demand').forEach(el => el.remove());
  const staleOverlay = document.getElementById('transition-overlay');
  if (staleOverlay) staleOverlay.remove();

  // Remove Phase 2 global pointer listeners
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('pointerup', onPointerUp);
  document.removeEventListener('pointercancel', onPointerUp);

  // Reset all module state
  resetEventsState();
  resetPhase3State();

  // Restart schedulers
  initEvents();
  restartDemands(onVigChange);

  // Restart idle timer
  clearTimeout(idleTimer);
  idleTimer = null;
  onInteract();
}

function onPointerDown() {
  if (getPhase() !== 2) return;
  updateTonyCaption(true);
}

function onPointerUp() {
  if (getPhase() !== 2) return;
  updateTonyCaption(false);
}
