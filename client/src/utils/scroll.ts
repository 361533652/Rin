const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function smoothScrollTo(targetY: number, duration = 500) {
  const startY = window.scrollY;
  const delta = targetY - startY;
  if (delta === 0) return;
  const startTime = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + delta * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function smoothScrollToElement(el: HTMLElement, offset = -80) {
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top + offset;
  smoothScrollTo(targetY);
}
