const FILL_DURATION = 2000;
const BOWL_BOTTOM = 60;
const BOWL_HEIGHT = 34;

let holdStart = null;
let frameId = null;
let locked = false;

export function init(onFull, onInteract) {
  const bowl = document.getElementById('bowl-svg');
  const fill = document.getElementById('bowl-fill');
  const prompt = document.getElementById('bowl-prompt');

  if (!bowl || !fill) {
    console.error('scoop: missing elements', { bowl, fill });
    return;
  }

  bowl.addEventListener('contextmenu', e => e.preventDefault());

  bowl.addEventListener('pointerdown', e => {
    if (locked) return;
    e.preventDefault();
    bowl.setPointerCapture(e.pointerId);
    if (onInteract) onInteract();
    if (prompt) prompt.textContent = 'spaghetti game';
    holdStart = performance.now();
    tick();
  });

  bowl.addEventListener('pointerup', reset);
  bowl.addEventListener('pointercancel', reset);

  function tick() {
    if (holdStart === null) return;

    const progress = Math.min((performance.now() - holdStart) / FILL_DURATION, 1);
    const h = progress * BOWL_HEIGHT;
    fill.setAttribute('y', BOWL_BOTTOM - h);
    fill.setAttribute('height', h);

    if (progress >= 1) {
      reset();
      locked = true;
      onFull(() => { locked = false; });
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  function reset() {
    holdStart = null;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    fill.setAttribute('y', BOWL_BOTTOM);
    fill.setAttribute('height', 0);
    if (prompt) prompt.textContent = 'ADD SAUCE TO THE SPAGHETTI';
  }
}
