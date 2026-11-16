// Wires the cardiac cycle page together: one simulated beat, shared by the
// 3D heart, live readouts, scroll-driven Wiggers diagram, PV loop lab,
// summary table and heart sounds.

import { createModel, createClock, sampleAt, phaseAt, PHASE_NAMES } from './engine.js';
import { createWiggers } from './wiggers.js';
import { createPV } from './pvloop.js';
import { createSound } from './sound.js';
import { SCENARIOS } from './content.js';
import { DEFAULTS } from '../../../lib/heartModel.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmtS = (s) => `${(Math.round(s * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} s`;
const LESIONS = ['as', 'ar', 'ms', 'mr'];

export function initCardiac() {
  const root = $('.cc');
  if (!root) return;
  const model = createModel();
  const clock = createClock(model);
  const sound = createSound();
  window.__mv = { model, clock }; // handy for debugging in the browser console

  // ---------- phase rails ----------
  function buildRail(el, result) {
    el.innerHTML = '';
    result.phases.forEach(([a, b], i) => {
      const d = document.createElement('div');
      d.className = `seg-p${i >= 1 && i <= 3 ? ' sys' : ''}`;
      d.style.flex = `${Math.max(0.0001, b - a)} 1 0`;
      d.textContent = b - a > result.timing.rr * 0.045 ? String(i + 1) : '';
      d.title = PHASE_NAMES[i];
      d.dataset.i = i;
      el.appendChild(d);
    });
    const mark = document.createElement('span');
    mark.className = 'mark';
    el.appendChild(mark);
  }
  function setRail(el, t, result) {
    const segs = el.querySelectorAll('.seg-p');
    const ph = phaseAt(result, t);
    segs.forEach((s, i) => s.classList.toggle('on', i === ph));
    const mark = el.querySelector('.mark');
    if (mark) mark.style.left = `${(t / result.timing.rr) * 100}%`;
    el.setAttribute('aria-valuenow', String(Math.round((t / result.timing.rr) * 100)));
    el.setAttribute('aria-valuetext', `${PHASE_NAMES[ph]}, ${Math.round(t * 1000)} ms`);
  }
  const labRail = $('[data-rail="lab"]');
  const scRail = $('[data-rail="scrolly"]');

  // lab rail: drag to scrub
  {
    let down = false;
    const toT = (e) => { const r = labRail.getBoundingClientRect(); return Math.max(0, Math.min(0.9999, (e.clientX - r.left) / r.width)) * model.result.timing.rr; };
    labRail.addEventListener('pointerdown', (e) => { down = true; labRail.setPointerCapture(e.pointerId); setPlaying(false); clock.seek(toT(e)); });
    labRail.addEventListener('pointermove', (e) => { if (down) clock.seek(toT(e)); });
    labRail.addEventListener('pointerup', () => { down = false; });
    labRail.addEventListener('pointercancel', () => { down = false; });
    labRail.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.05 : 0.01;
      if (e.key === 'ArrowRight') { e.preventDefault(); setPlaying(false); clock.seek(clock.t + step); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setPlaying(false); clock.seek(clock.t - step); }
    });
  }

  // ---------- 3D heart ----------
  const stage = $('[data-stage]');
  const msg = $('[data-stage-msg]');
  let heart = null;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  import('./heart3d.js').then(({ createHeart3D }) => {
    heart = createHeart3D(stage);
    if (!heart) { msg.textContent = 'Your browser could not start 3D graphics. The diagrams below still work.'; return; }
    msg.hidden = true;
    heart.setInteractive(!coarse);
    if (coarse) $('[data-stage-hint]').textContent = 'Tap Rotate, then drag';
  }).catch(() => { msg.textContent = 'The 3D heart could not load. The diagrams below still work.'; });

  const rotBtn = $('[data-rotate]');
  rotBtn.addEventListener('click', () => {
    const on = rotBtn.getAttribute('aria-pressed') !== 'true';
    rotBtn.setAttribute('aria-pressed', String(on));
    rotBtn.querySelector('.rot-label').textContent = on ? 'Done' : 'Rotate';
    heart?.setInteractive(on);
    $('[data-stage-hint]').textContent = on ? 'Drag to turn · tap Done to scroll again' : 'Tap Rotate, then drag';
  });

  // ---------- controls ----------
  const playBtn = $('[data-play]');
  function setPlaying(v) {
    clock.playing = v;
    playBtn.setAttribute('aria-pressed', String(v));
    $('[data-play-label]').textContent = v ? 'Pause' : 'Play';
    if (!v) sound.stopMurmur();
  }
  playBtn.addEventListener('click', () => setPlaying(!clock.playing));
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);

  $$('[data-speed]').forEach((b) => b.addEventListener('click', () => {
    clock.speed = Number(b.dataset.speed);
    $$('[data-speed]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (!clock.playing) setPlaying(true);
  }));
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
    heart?.setMode(b.dataset.view);
    $$('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  const labBtn = $('[data-labels]');
  labBtn.addEventListener('click', () => {
    const on = labBtn.getAttribute('aria-pressed') !== 'true';
    labBtn.setAttribute('aria-pressed', String(on));
    heart?.setLabels(on);
  });
  const sndBtn = $('[data-sound]');
  sndBtn.addEventListener('click', async () => {
    const on = await sound.toggle();
    sndBtn.setAttribute('aria-pressed', String(on));
    if (on && !clock.playing) setPlaying(true);
  });

  // ---------- parameter sliders (shared between lab and PV sections) ----------
  const fill = (inp) => { const p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100; inp.style.setProperty('--fill', `${p}%`); };
  let pending = null;
  function queue(p) {
    pending = { ...(pending || {}), ...p };
    requestAnimationFrame(() => { if (pending) { const q = pending; pending = null; model.set(q); } });
  }
  $$('[data-param]').forEach((inp) => {
    fill(inp);
    inp.addEventListener('input', () => {
      fill(inp);
      markScenario(null);
      queue({ [inp.dataset.param]: Number(inp.value) });
    });
  });
  function syncInputs(params) {
    $$('[data-param]').forEach((inp) => {
      const v = params[inp.dataset.param];
      if (document.activeElement !== inp || Number(inp.value) !== v) inp.value = v;
      fill(inp);
    });
    $$('[data-out]').forEach((o) => {
      const k = o.dataset.out;
      o.textContent = k === 'hr' ? String(Math.round(params.hr)) : Number(params[k]).toFixed(2);
    });
    const lesion = LESIONS.find((k) => params[k] > 0) || 'none';
    $$('[data-lesion]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lesion === lesion)));
    const sevWrap = $('[data-sev-wrap]');
    sevWrap.hidden = lesion === 'none';
    if (lesion !== 'none') { const s = $('[data-sev]'); s.value = params[lesion]; fill(s); $('[data-sev-out]').textContent = String(Math.round(params[lesion] * 100)); }
  }

  // valve lesions
  $$('[data-lesion]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.lesion;
    const sev = Number($('[data-sev]').value) || 0.5;
    const p = Object.fromEntries(LESIONS.map((x) => [x, 0]));
    if (k !== 'none') p[k] = sev;
    markScenario(null);
    model.set(p);
  }));
  $('[data-sev]').addEventListener('input', (e) => {
    const k = LESIONS.find((x) => model.params[x] > 0);
    fill(e.target);
    if (k) { markScenario(null); queue({ [k]: Number(e.target.value) }); }
  });

  // scenarios
  const note = $('[data-scen-note]');
  function markScenario(id) {
    $$('[data-scenario]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scenario === id)));
    if (!id) note.textContent = 'Custom settings. The faint dashed loop is the healthy heart at rest.';
  }
  $$('[data-scenario]').forEach((b) => b.addEventListener('click', () => {
    const s = SCENARIOS.find((x) => x.id === b.dataset.scenario);
    model.set({ ...DEFAULTS, ...s.p });
    markScenario(s.id);
    note.textContent = s.note;
  }));
  $('[data-reset]', $('#pv')).addEventListener('click', () => {
    model.set({ ...DEFAULTS });
    markScenario('rest');
    note.textContent = SCENARIOS[0].note;
  });

  // ---------- PV loop ----------
  const pv = createPV($('[data-pv]'));
  function updateMetrics(r) {
    const m = r.metrics, b = model.baseline.metrics;
    const set = (k, v) => { const e = $(`[data-m="${k}"]`); if (e) e.textContent = v; };
    set('sv', Math.round(m.sv));
    set('ef', Math.round(m.ef * 100));
    set('co', m.co.toFixed(1));
    set('bp', `${Math.round(m.sbp)}/${Math.round(m.dbp)}`);
    set('vols', `${Math.round(m.edv)}/${Math.round(m.esv)}`);
    set('edp', Math.round(m.edp));
    const delta = (k, d, unit, good = 0) => {
      const e = $(`[data-d="${k}"]`); if (!e) return;
      const r1 = Math.round(d * 10) / 10;
      if (Math.abs(r1) < (unit === 'L/min' ? 0.2 : 1.5) || r === model.baseline) { e.textContent = ''; e.className = ''; return; }
      e.textContent = `${r1 > 0 ? '▲' : '▼'} ${Math.abs(unit === 'L/min' ? r1 : Math.round(r1))} ${unit}`;
      e.className = good === 0 ? '' : (r1 > 0) === (good > 0) ? 'up' : 'down';
    };
    delta('sv', m.sv - b.sv, 'mL', 1);
    delta('ef', (m.ef - b.ef) * 100, '%', 1);
    delta('co', m.co - b.co, 'L/min', 1);
    delta('bp', m.map - b.map, 'mmHg mean');
    delta('vols', m.edv - b.edv, 'mL EDV');
    delta('edp', m.edp - b.edp, 'mmHg', -1);
    if (m.fwdSv < m.sv - 2) {
      const e = $('[data-d="sv"]');
      e.textContent = `${Math.round(m.fwdSv)} mL forward`;
      e.className = 'down';
    }
  }

  // ---------- durations in text ----------
  function updateDurations(r) {
    r.phases.forEach(([a, b], i) => {
      $$(`[data-dur="${i}"], [data-dur-row="${i}"]`).forEach((e) => { e.textContent = fmtS(b - a); });
    });
    const sys = $('[data-sys]'), dia = $('[data-dia]');
    if (sys) sys.textContent = fmtS(r.metrics.sysTime);
    if (dia) dia.textContent = fmtS(r.metrics.diaTime);
  }

  // ---------- scrollytelling ----------
  let scT = 0;
  const wig = createWiggers($('[data-wiggers]'), {
    onScrub: (t) => { scT = t; scrubbed = true; renderScrolly(); },
  });
  let scrubbed = false;
  const steps = $$('[data-step]');
  const scFig = $('[data-sc-fig]');
  function renderScrolly() {
    const r = model.result;
    const out = wig.setTime(scT);
    setRail(scRail, scT, r);
    if (!out) return;
    const { p, phase } = out;
    $('[data-sc="phase"]').textContent = `${phase + 1}. ${PHASE_NAMES[phase]}`;
    $('[data-sc="plv"]').textContent = Math.round(p.plv);
    $('[data-sc="pao"]').textContent = Math.round(p.pao);
    $('[data-sc="pla"]').textContent = Math.round(p.pla);
    $('[data-sc="vlv"]').textContent = Math.round(p.vlv);
  }
  function onScroll() {
    const r = model.result;
    const figBottom = scFig.getBoundingClientRect().bottom;
    const wide = window.innerWidth >= 960;
    const anchor = wide ? window.innerHeight * 0.5 : figBottom + (window.innerHeight - figBottom) * 0.4;
    let active = null;
    for (const s of steps) {
      const b = s.getBoundingClientRect();
      if (anchor >= b.top && anchor < b.bottom + 24) { active = s; break; }
    }
    steps.forEach((s) => s.classList.toggle('on', s === active));
    if (!active) return;
    const i = Number(active.dataset.step);
    if (i < 0 || i > 6) return;
    const b = active.getBoundingClientRect();
    const prog = Math.max(0, Math.min(0.999, (anchor - b.top) / b.height));
    const [a, e] = r.phases[i];
    scT = a + (e - a) * (0.04 + prog * 0.92);
    scrubbed = false;
    renderScrolly();
  }
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  scRail.addEventListener('click', (e) => {
    const seg = e.target.closest('.seg-p');
    if (seg) document.getElementById(steps[Number(seg.dataset.i) + 1].id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ---------- model change ----------
  function onModel(r) {
    buildRail(labRail, r);
    buildRail(scRail, r);
    wig.draw(r);
    pv.draw(r, model.baseline);
    updateMetrics(r);
    updateDurations(r);
    syncInputs(model.params);
    if (scT >= r.timing.rr) scT = r.timing.rr * 0.5;
    renderScrolly();
    if (!scrubbed) onScroll();
  }
  model.on(onModel);
  onModel(model.result);

  // ---------- live loop ----------
  const liveEls = Object.fromEntries($$('[data-live]').map((e) => [e.dataset.live, e]));
  const mvChip = $('[data-valve="mv"]'), avChip = $('[data-valve="av"]');
  let lastPhase = -1;
  clock.on((t, prev) => {
    const r = model.result;
    const p = sampleAt(r, t);
    let dt = t - prev;
    if (dt < -r.timing.rr / 2) dt += r.timing.rr;
    heart?.update(p, dt, model.params);
    pv.setTime(p);
    setRail(labRail, t, r);
    const ph = phaseAt(r, t);
    if (ph !== lastPhase) {
      lastPhase = ph;
      liveEls.num.textContent = String(ph + 1);
      liveEls.phase.textContent = PHASE_NAMES[ph];
    }
    liveEls.plv.textContent = Math.round(p.plv);
    liveEls.pao.textContent = Math.round(p.pao);
    liveEls.pla.textContent = Math.round(p.pla);
    liveEls.vlv.textContent = Math.round(p.vlv);
    mvChip.classList.toggle('open', p.qmv > 0.5);
    avChip.classList.toggle('open', p.qav > 0.5);
    sound.tick(r, p, t, prev, clock.speed);
  });

  // only animate while the 3D lab or PV lab is on screen
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }
    clock.setVisible(seen.size > 0 && !document.hidden);
    if (!seen.size) sound.stopMurmur();
  }, { rootMargin: '80px' });
  io.observe($('#lab'));
  io.observe($('#pv'));
  document.addEventListener('visibilitychange', () => clock.setVisible(seen.size > 0 && !document.hidden));
}
