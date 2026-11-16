// Light / dark toggle. Remembers the choice on this device only.
export function initTheme() {
  const root = document.documentElement;
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  const current = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('mv-theme', next); } catch (e) { /* storage blocked */ }
    window.dispatchEvent(new CustomEvent('mv-theme', { detail: next }));
  });
}
