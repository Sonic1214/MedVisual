// Shared state for the cardiac cycle page: the simulated beat, the settings
// that produced it, and a playback clock that the 3D heart, live readouts,
// PV loop and heart sounds all follow.

import { simulate, DEFAULTS, ecg } from '../../../lib/heartModel.js';

export const PHASE_NAMES = ['Atrial systole', 'Isovolumetric contraction', 'Rapid ejection', 'Reduced ejection', 'Isovolumetric relaxation', 'Rapid filling', 'Diastasis'];

export function createModel() {
  let params = { ...DEFAULTS };
  let result = simulate(params);
  const baseline = result;
  const subs = new Set();
  return {
    get params() { return params; },
    get result() { return result; },
    baseline,
    set(p) {
      params = { ...params, ...p };
      result = simulate(params);
      subs.forEach((f) => f(result));
    },
    reset() { this.set({ ...DEFAULTS }); },
    on(f) { subs.add(f); return () => subs.delete(f); },
  };
}

/** Interpolated sample at time t (seconds into the beat). */
export function sampleAt(result, t) {
  const s = result.samples;
  const dt = s[1].t - s[0].t;
  const rr = result.timing.rr;
  t = ((t % rr) + rr) % rr;
  const f = t / dt;
  const i = Math.min(s.length - 2, Math.floor(f));
  const a = s[i], b = s[i + 1], k = Math.min(1, f - i);
  const out = {};
  for (const key in a) out[key] = a[key] + (b[key] - a[key]) * k;
  out.t = t;
  out.ecg = ecg(t, result.timing);
  return out;
}

export function phaseAt(result, t) {
  const rr = result.timing.rr;
  t = ((t % rr) + rr) % rr;
  for (let i = 0; i < result.phases.length; i++) {
    const [a, b] = result.phases[i];
    if (t >= a && t < b) return i;
  }
  return 6;
}

/** Which extra sounds and murmurs this beat would produce. */
export function soundsFor(params) {
  return {
    s3: (params.contractility <= 0.7 && params.preload >= 1.25) || params.mr >= 0.3 || params.ar >= 0.4,
    s4: params.compliance >= 1.35 || params.as >= 0.7 || params.afterload >= 1.5,
  };
}

/** Playback clock. Calls tick(t, dtBeat) each animation frame while playing. */
export function createClock(model) {
  let t = 0, playing = true, speed = 1, last = 0, raf = 0;
  const subs = new Set();
  let visible = true;
  function frame(now) {
    raf = 0;
    const dtReal = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const prev = t;
    if (playing) t = (t + dtReal * speed) % model.result.timing.rr;
    subs.forEach((f) => f(t, prev));
    if (visible) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } }
  model.on(() => { t = Math.min(t, model.result.timing.rr - 1e-3); });
  return {
    get t() { return t; },
    get playing() { return playing; },
    get speed() { return speed; },
    set playing(v) { playing = v; kick(); },
    set speed(v) { speed = v; },
    seek(v) { const rr = model.result.timing.rr; t = ((v % rr) + rr) % rr; kick(); },
    setVisible(v) { visible = v; if (v) kick(); },
    on(f) { subs.add(f); kick(); return () => subs.delete(f); },
  };
}
