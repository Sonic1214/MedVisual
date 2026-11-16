// Site-wide search. Instant matches come from a small index embedded in every
// page (subjects, chapters, topics, sections). Full-text matches inside pages
// come from Pagefind, which is generated during the production build.

const BASE = import.meta.env.BASE_URL;
let pagefind = null;
let pagefindTried = false;

async function loadPagefind() {
  if (pagefindTried) return pagefind;
  pagefindTried = true;
  try {
    const url = `${BASE}pagefind/pagefind.js`;
    pagefind = await import(/* @vite-ignore */ url);
    await pagefind.options({ baseUrl: BASE, excerptLength: 18 });
    pagefind.init();
  } catch (e) {
    pagefind = null; // not built yet (development) or offline
  }
  return pagefind;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function score(item, terms) {
  const title = norm(item.t);
  const words = norm(item.w.join(' '));
  let total = 0;
  for (const term of terms) {
    let s = 0;
    if (title === term) s = 12;
    else if (title.startsWith(term)) s = 9;
    else if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(title)) s = 7;
    else if (title.includes(term)) s = 5;
    else if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(words)) s = 3;
    else if (words.includes(term)) s = 1.5;
    if (!s) return 0; // every term must match
    total += s;
  }
  const kindBoost = { Topic: 1.3, Section: 1.1, Subject: 1.2, Chapter: 1 }[item.k] || 1;
  return total * kindBoost;
}

export function initSearch() {
  const dialog = document.querySelector('[data-search-dialog]');
  if (!dialog) return;
  const input = dialog.querySelector('[data-search-input]');
  const results = dialog.querySelector('[data-search-results]');
  let index = [];
  try { index = JSON.parse(document.getElementById('mv-index')?.textContent || '[]'); } catch (e) { index = []; }
  let selected = 0;
  let lastFocus = null;
  let runId = 0;

  function open(prefill = '') {
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    input.value = prefill;
    render(prefill);
    requestAnimationFrame(() => input.focus());
    loadPagefind();
  }
  function close() {
    dialog.hidden = true;
    document.documentElement.style.overflow = '';
    lastFocus?.focus?.();
  }

  function items() { return [...results.querySelectorAll('.sd-item')]; }
  function select(i) {
    const list = items();
    if (!list.length) return;
    selected = (i + list.length) % list.length;
    list.forEach((el, k) => el.setAttribute('aria-selected', k === selected ? 'true' : 'false'));
    list[selected].scrollIntoView({ block: 'nearest' });
  }

  function quick(q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return index.filter((x) => x.k === 'Topic').slice(0, 8).map((x) => ({ ...x, s: 1 }));
    return index.map((x) => ({ ...x, s: score(x, terms) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 10);
  }

  function itemHtml(x) {
    return `<a class="sd-item" role="option" href="${esc(BASE + x.u)}"><span class="sd-tag">${esc(x.k)}</span><b>${esc(x.t)}</b><small>${esc(x.d || '')}</small></a>`;
  }

  async function render(q) {
    const id = ++runId;
    const quickHits = quick(q);
    let html = '';
    if (quickHits.length) html += `<div class="sd-group">${q ? 'Best matches' : 'Topics'}</div>` + quickHits.map(itemHtml).join('');
    results.innerHTML = html || (q ? '' : '');
    selected = 0; select(0);
    if (!q.trim()) { if (!html) results.innerHTML = '<p class="sd-empty">Type to search.</p>'; return; }
    const pf = await loadPagefind();
    if (id !== runId) return;
    if (!pf) { if (!quickHits.length) results.innerHTML = `<p class="sd-empty">No matches for “${esc(q)}”.</p>`; return; }
    const res = await pf.debouncedSearch(q, {}, 180);
    if (id !== runId || !res) return;
    const seen = new Set(quickHits.map((x) => (BASE + x.u).replace(/#.*$/, '')));
    const data = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
    if (id !== runId) return;
    const full = data.filter((d) => !seen.has(d.url));
    if (full.length) {
      results.insertAdjacentHTML('beforeend', '<div class="sd-group">Inside pages</div>' + full.map((d) =>
        `<a class="sd-item" role="option" href="${esc(d.url)}"><span class="sd-tag">Text</span><b>${esc(d.meta?.title || d.url)}</b><span class="ex">${d.excerpt}</span></a>`).join(''));
    }
    if (!quickHits.length && !full.length) results.innerHTML = `<p class="sd-empty">No matches for “${esc(q)}”.</p>`;
    select(selected);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-search-open]');
    if (t) { e.preventDefault(); open(t.dataset.searchPrefill || ''); }
    if (e.target.closest('[data-search-close]')) close();
  });
  input.addEventListener('input', () => render(input.value));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); select(selected + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(selected - 1); }
    else if (e.key === 'Enter') { const el = items()[selected]; if (el) { e.preventDefault(); location.href = el.href; close(); } }
  });
  results.addEventListener('click', (e) => { if (e.target.closest('.sd-item')) close(); });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if (!dialog.hidden) return;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); open(); }
  });
}
