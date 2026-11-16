// Pressure–volume loop with end-systolic and end-diastolic pressure–volume
// relations, a faint reference loop for comparison, and a moving dot.

import { CONST } from '../../../lib/heartModel.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 420, H = 340, L = 44, B = 36, T = 14, R = 14;

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

export function createPV(svg) {
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let res = null, sx = null, sy = null;
  const g = el('g', {}, svg);
  const dot = el('circle', { r: 6, class: 'pv-dot' }, svg);

  function loopPath(r) {
    let d = '';
    const s = r.samples;
    const step = Math.max(1, Math.floor(s.length / 300));
    for (let i = 0; i < s.length; i += step) d += `${i ? 'L' : 'M'}${sx(s[i].vlv).toFixed(1)} ${sy(s[i].plv).toFixed(1)} `;
    return d + 'Z';
  }

  function draw(result, baseline) {
    res = result;
    const both = [result, baseline];
    let vMax = 180, pMax = 160;
    for (const r of both) { vMax = Math.max(vMax, r.metrics.edv + 25); pMax = Math.max(pMax, r.metrics.peakLV + 20); }
    vMax = Math.ceil(vMax / 20) * 20; pMax = Math.ceil(pMax / 20) * 20;
    sx = (v) => L + (v / vMax) * (W - L - R);
    sy = (p) => T + (H - T - B) - (Math.max(0, Math.min(p, pMax)) / pMax) * (H - T - B);
    g.innerHTML = '';
    // grid
    for (let v = 0; v <= vMax; v += 40) {
      el('line', { x1: sx(v), x2: sx(v), y1: T, y2: H - B, class: 'pv-gl' }, g);
      el('text', { x: sx(v), y: H - B + 16, class: 'pv-tick mid' }, g).textContent = v;
    }
    for (let p = 0; p <= pMax; p += 40) {
      el('line', { x1: L, x2: W - R, y1: sy(p), y2: sy(p), class: 'pv-gl' }, g);
      el('text', { x: L - 6, y: sy(p), class: 'pv-tick end' }, g).textContent = p;
    }
    el('text', { x: (L + W - R) / 2, y: H - 4, class: 'pv-ax mid' }, g).textContent = 'LV volume (mL)';
    el('text', { x: 12, y: (T + H - B) / 2, class: 'pv-ax mid', transform: `rotate(-90 12 ${(T + H - B) / 2})` }, g).textContent = 'LV pressure (mmHg)';

    const o = result.opts;
    // end-diastolic pressure–volume relation
    let d = '';
    for (let v = CONST.v0LV; v <= vMax; v += 2) {
      const p = CONST.p0LV * (Math.exp(CONST.lamLV * o.compliance * (v - CONST.v0LV)) - 1);
      if (p > pMax) break;
      d += `${d ? 'L' : 'M'}${sx(v).toFixed(1)} ${sy(p).toFixed(1)} `;
    }
    el('path', { d, class: 'pv-edpvr' }, g);
    // end-systolic pressure–volume relation
    const emax = CONST.emaxLV * o.contractility;
    const vTop = Math.min(vMax, CONST.v0LV + pMax / emax);
    el('line', { x1: sx(CONST.v0LV), y1: sy(0), x2: sx(vTop), y2: sy(emax * (vTop - CONST.v0LV)), class: 'pv-espvr' }, g);
    const lx = Math.min(vTop, CONST.v0LV + (pMax * 0.82) / emax);
    el('text', { x: sx(lx) + 6, y: sy(emax * (lx - CONST.v0LV)), class: 'pv-rel' }, g).textContent = 'ESPVR';
    el('text', { x: sx(vMax) - 4, y: sy(CONST.p0LV * (Math.exp(CONST.lamLV * o.compliance * (Math.min(vMax, 150) - CONST.v0LV)) - 1)) - 8, class: 'pv-rel end' }, g).textContent = 'EDPVR';

    // reference loop, then current loop
    if (baseline !== result) el('path', { d: loopPath(baseline), class: 'pv-base' }, g);
    el('path', { d: loopPath(result), class: 'pv-loop' }, g);

    // corner events
    const s = result.samples, ev = result.events;
    const at = (t) => s[Math.min(s.length - 1, Math.round(t / (s[1].t - s[0].t)))];
    [['MC', ev.mvc, 8, 16], ['AO', ev.avo, 8, -6], ['AC', ev.avc, -8, -8], ['MO', ev.mvo, -8, 16]].forEach(([lab, t, dx, dy]) => {
      const p = at(t);
      el('circle', { cx: sx(p.vlv), cy: sy(p.plv), r: 3.5, class: 'pv-ev' }, g);
      el('text', { x: sx(p.vlv) + dx, y: sy(p.plv) + dy, class: `pv-evl ${dx < 0 ? 'end' : ''}` }, g).textContent = lab;
    });
    // stroke volume bracket
    const yb = H - B - 8;
    el('line', { x1: sx(result.metrics.esv), x2: sx(result.metrics.edv), y1: yb, y2: yb, class: 'pv-sv' }, g);
    el('text', { x: (sx(result.metrics.esv) + sx(result.metrics.edv)) / 2, y: yb - 6, class: 'pv-svl mid' }, g).textContent = 'stroke volume';
  }

  function setTime(p) {
    if (!sx) return;
    dot.setAttribute('cx', sx(p.vlv));
    dot.setAttribute('cy', sy(p.plv));
  }
  return { draw, setTime };
}
