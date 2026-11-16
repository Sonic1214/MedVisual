// Wiggers diagram drawn as SVG from the simulated beat: pressures, LV volume,
// ECG and a phonocardiogram, with phase bands, valve events and a time cursor.

import { ecg } from '../../../lib/heartModel.js';
import { soundsFor } from './engine.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 640, L = 46, R = 12;

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// deterministic pseudo-random numbers so murmurs do not flicker
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

export function createWiggers(svg, { onScrub } = {}) {
  const P = { top: 30, h: 168 };
  const VOL = { top: 214, h: 70 };
  const E = { top: 300, h: 44 };
  const S = { top: 356, h: 28 };
  const H = 396;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = '';
  const gBands = el('g', { class: 'w-bands' }, svg);
  const gGrid = el('g', { class: 'w-grid' }, svg);
  const gEvents = el('g', { class: 'w-events' }, svg);
  const gTraces = el('g', { class: 'w-traces' }, svg);
  const gLabels = el('g', { class: 'w-labels' }, svg);
  const cursor = el('g', { class: 'w-cursor' }, svg);
  const cLine = el('line', { y1: P.top - 6, y2: S.top + S.h }, cursor);
  const dots = ['ao', 'lv', 'la', 'vol', 'ecg'].map((k) => el('circle', { r: 4.5, class: `w-dot w-${k}` }, cursor));

  let res = null, x = null, yP = null, yV = null, yE = null, bandRects = [], bandNums = [];

  function draw(result) {
    res = result;
    const rr = result.timing.rr;
    const s = result.samples;
    const m = result.metrics;
    x = (t) => L + (t / rr) * (W - L - R);
    let pMax = 140;
    for (const p of s) pMax = Math.max(pMax, p.plv + 8, p.pao + 8);
    pMax = Math.ceil(pMax / 20) * 20;
    yP = (v) => P.top + P.h - (Math.max(-5, v) / pMax) * P.h;
    const vLo = Math.min(30, Math.floor((m.esv - 10) / 10) * 10), vHi = Math.max(160, Math.ceil((m.edv + 10) / 10) * 10);
    yV = (v) => VOL.top + VOL.h - ((v - vLo) / (vHi - vLo)) * VOL.h;
    yE = (v) => E.top + E.h * 0.72 - v * E.h * 0.62;

    // phase bands
    gBands.innerHTML = '';
    bandRects = []; bandNums = [];
    result.phases.forEach(([a, b], i) => {
      bandRects.push(el('rect', { x: x(a), y: P.top - 6, width: Math.max(0, x(b) - x(a)), height: S.top + S.h - P.top + 6, class: `w-band ${i % 2 ? 'alt' : ''}` }, gBands));
      if (b - a > 0.012) bandNums.push(el('text', { x: (x(a) + x(b)) / 2, y: 16, class: 'w-num' }, gBands));
      else bandNums.push(null);
      if (bandNums[i]) bandNums[i].textContent = i + 1;
    });

    // grid + axes
    gGrid.innerHTML = '';
    for (let v = 0; v <= pMax; v += 40) {
      el('line', { x1: L, x2: W - R, y1: yP(v), y2: yP(v), class: v ? 'w-gl' : 'w-axis' }, gGrid);
      el('text', { x: L - 6, y: yP(v), class: 'w-tick' }, gGrid).textContent = v;
    }
    el('text', { x: 4, y: P.top - 14, class: 'w-unit' }, gGrid).textContent = 'mmHg';
    for (const v of [vLo, Math.round((vLo + vHi) / 2 / 10) * 10, vHi]) {
      el('line', { x1: L, x2: W - R, y1: yV(v), y2: yV(v), class: 'w-gl' }, gGrid);
      el('text', { x: L - 6, y: yV(v), class: 'w-tick' }, gGrid).textContent = v;
    }
    el('text', { x: 4, y: VOL.top - 8, class: 'w-unit' }, gGrid).textContent = 'mL';
    el('text', { x: 4, y: E.top + E.h * 0.5, class: 'w-unit' }, gGrid).textContent = 'ECG';
    el('text', { x: 4, y: S.top + S.h * 0.5, class: 'w-unit' }, gGrid).textContent = 'Sound';

    // valve events
    gEvents.innerHTML = '';
    const ev = result.events;
    [['MC', ev.mvc], ['AO', ev.avo], ['AC', ev.avc], ['MO', ev.mvo]].forEach(([lab, t]) => {
      el('line', { x1: x(t), x2: x(t), y1: P.top - 2, y2: S.top + S.h, class: 'w-ev' }, gEvents);
      el('text', { x: x(t), y: H - 2, class: 'w-evl' }, gEvents).textContent = lab;
    });

    // traces (downsampled)
    gTraces.innerHTML = '';
    const step = Math.max(1, Math.floor(s.length / 420));
    const pts = (fy) => { let d = ''; for (let i = 0; i < s.length; i += step) d += `${x(s[i].t).toFixed(1)},${fy(s[i]).toFixed(1)} `; const z = s[s.length - 1]; return d + `${x(rr).toFixed(1)},${fy(z).toFixed(1)}`; };
    el('polyline', { points: pts((p) => yP(p.pla)), class: 'w-tr w-la' }, gTraces);
    el('polyline', { points: pts((p) => yP(p.pao)), class: 'w-tr w-ao' }, gTraces);
    el('polyline', { points: pts((p) => yP(p.plv)), class: 'w-tr w-lv' }, gTraces);
    el('polyline', { points: pts((p) => yV(p.vlv)), class: 'w-tr w-vol' }, gTraces);
    let ed = '';
    for (let t = 0; t <= rr; t += rr / 500) ed += `${x(t).toFixed(1)},${yE(ecg(t, result.timing)).toFixed(1)} `;
    el('polyline', { points: ed, class: 'w-tr w-ecg' }, gTraces);
    el('path', { d: soundPath(result), class: 'w-tr w-snd' }, gTraces);

    // labels: atrial waves and trace names
    gLabels.innerHTML = '';
    const lab = (t, v, txt, cls, dy = -8) => { const e = el('text', { x: x(t), y: yP(v) + dy, class: `w-wave ${cls}` }, gLabels); e.textContent = txt; };
    const seg = (a, b, fn) => { let best = null; for (const p of s) if (p.t >= a && p.t <= b && (!best || fn(p, best))) best = p; return best; };
    const aW = seg(0, ev.mvc, (p, q) => p.pla > q.pla);
    const vW = seg(ev.avc - 0.06, ev.mvo + 0.02, (p, q) => p.pla > q.pla);
    const xW = seg(ev.avo, ev.avc, (p, q) => p.pla < q.pla);
    const yW = seg(ev.mvo, Math.min(rr, ev.mvo + 0.25), (p, q) => p.pla < q.pla);
    if (aW) lab(aW.t, aW.pla, 'a', 'w-la');
    if (vW) lab(vW.t, vW.pla, 'v', 'w-la');
    if (xW) lab(xW.t, xW.pla, 'x', 'w-la', 14);
    if (yW) lab(yW.t, yW.pla, 'y', 'w-la', 14);
    const notch = seg(ev.avc, ev.avc + 0.04, (p, q) => p.pao < q.pao);
    if (notch) { const e = el('text', { x: x(notch.t) + 6, y: yP(notch.pao) - 10, class: 'w-wave w-ao start' }, gLabels); e.textContent = 'notch'; }
    const sx = (t, txt) => { const e = el('text', { x: x(t), y: S.top - 2, class: 'w-wave w-snd' }, gLabels); e.textContent = txt; };
    sx(ev.s1, 'S1'); sx(ev.s2, 'S2');
    const extra = soundsFor(result.opts);
    if (extra.s3) sx(ev.s3, 'S3');
    if (extra.s4) sx(ev.s4, 'S4');
    const ecgLab = [['P', result.timing.pOn + 0.045, 0.2], ['QRS', result.timing.qrsOn + 0.04, 1.22], ['T', result.timing.qrsOn + 0.27 * Math.sqrt(rr / 0.8), 0.36]];
    ecgLab.forEach(([t2, tt, v]) => { const tw = ((tt % rr) + rr) % rr; const e = el('text', { x: x(tw), y: yE(v) - 3, class: 'w-wave w-ecg' }, gLabels); e.textContent = t2; });
  }

  function soundPath(result) {
    const ev = result.events, rr = result.timing.rr, s = result.samples, o = result.opts;
    const mid = S.top + S.h / 2;
    let d = `M${L} ${mid} H${W - R} `;
    const burst = (t0, amp, dur, f) => {
      let p = `M${x(t0).toFixed(1)} ${mid} `;
      for (let t = 0; t <= dur; t += 0.0025) {
        const a = amp * Math.exp(-t / (dur * 0.35)) * Math.sin(t * f * 2 * Math.PI);
        p += `L${x(Math.min(rr, t0 + t)).toFixed(1)} ${(mid - a).toFixed(1)} `;
      }
      return p;
    };
    d += burst(ev.s1, 12, 0.07, 60) + burst(ev.s2, 10, 0.05, 80);
    const extra = soundsFor(o);
    if (extra.s3) d += burst(ev.s3, 6, 0.05, 40);
    if (extra.s4) d += burst(ev.s4, 6, 0.05, 40);
    // murmurs: amplitude follows the abnormal flow
    const rnd = rng(7);
    const step = Math.max(1, Math.round(0.004 / (s[1].t - s[0].t)));
    for (let i = 0; i < s.length; i += step) {
      const p = s[i];
      const m = o.as * p.qav / 400 + p.qmr / 250 + p.qar / 120 + o.ms * p.qmv / 250;
      if (m > 0.04) {
        const a = Math.min(1, m) * 11 * (0.4 + 0.6 * rnd());
        d += `M${x(p.t).toFixed(1)} ${(mid - a).toFixed(1)} V${(mid + a).toFixed(1)} `;
      }
    }
    return d;
  }

  function setTime(t) {
    if (!res) return;
    const rr = res.timing.rr;
    t = ((t % rr) + rr) % rr;
    const s = res.samples;
    const i = Math.min(s.length - 1, Math.round(t / (s[1].t - s[0].t)));
    const p = s[i];
    const X = x(t);
    cLine.setAttribute('x1', X); cLine.setAttribute('x2', X);
    const ys = [yP(p.pao), yP(p.plv), yP(p.pla), yV(p.vlv), yE(ecg(t, res.timing))];
    dots.forEach((d, k) => { d.setAttribute('cx', X); d.setAttribute('cy', ys[k]); });
    let ph = 6;
    res.phases.forEach(([a, b], k) => { if (t >= a && t < b) ph = k; });
    bandRects.forEach((r, k) => r.classList.toggle('on', k === ph));
    bandNums.forEach((n, k) => n && n.classList.toggle('on', k === ph));
    return { p, phase: ph };
  }

  // drag to scrub
  if (onScrub) {
    let down = false;
    const toT = (e) => {
      const r = svg.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * W;
      return Math.max(0, Math.min(0.9999, (vx - L) / (W - L - R))) * res.timing.rr;
    };
    svg.addEventListener('pointerdown', (e) => { if (!res) return; down = true; svg.setPointerCapture(e.pointerId); onScrub(toT(e)); });
    svg.addEventListener('pointermove', (e) => { if (down) onScrub(toT(e)); });
    const up = () => { down = false; };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
  }

  return { draw, setTime };
}
