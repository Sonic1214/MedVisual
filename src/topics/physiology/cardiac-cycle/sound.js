// Synthesised heart sounds that follow the simulation: S1 and S2 every beat,
// S3 and S4 when the settings call for them, and murmurs whose loudness
// tracks the abnormal flow through a diseased valve.

import { soundsFor } from './engine.js';

export function createSound() {
  let ctx = null, master = null, noise = null, murmurGain = null, murmurFilter = null, on = false;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    // continuous noise source for murmurs
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass'; murmurFilter.frequency.value = 300; murmurFilter.Q.value = 1.2;
    murmurGain = ctx.createGain(); murmurGain.gain.value = 0;
    noise.connect(murmurFilter).connect(murmurGain).connect(master);
    noise.start();
  }

  // a heart sound: a few damped low tones plus a soft click
  function thump(freq, dur, vol) {
    if (!ctx || !on) return;
    const now = ctx.currentTime;
    for (const [mult, amp] of [[1, 1], [2.1, 0.45], [3.3, 0.18]]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq * mult * 1.15, now);
      o.frequency.exponentialRampToValueAtTime(freq * mult, now + dur * 0.5);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(vol * amp, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g).connect(master);
      o.start(now); o.stop(now + dur + 0.02);
    }
  }

  function crossed(prev, t, at) {
    return prev <= t ? at > prev && at <= t : at > prev || at <= t;
  }

  return {
    get on() { return on; },
    async toggle() {
      init();
      if (!ctx) return false;
      on = !on;
      if (on) await ctx.resume();
      else { murmurGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02); }
      return on;
    },
    tick(result, p, t, prev, speed) {
      if (!on || !ctx || t === prev) return;
      const ev = result.events, o = result.opts;
      const extra = soundsFor(o);
      // slow motion stretches the sounds a little so they stay recognisable
      const stretch = speed < 1 ? 1.4 : 1;
      if (crossed(prev, t, ev.s1)) thump(95, 0.13 * stretch, 0.9);
      if (crossed(prev, t, ev.s2)) thump(135, 0.09 * stretch, 0.75);
      if (extra.s3 && crossed(prev, t, ev.s3)) thump(70, 0.1 * stretch, 0.45);
      if (extra.s4 && crossed(prev, t, ev.s4)) thump(75, 0.09 * stretch, 0.45);
      // murmurs
      const as = o.as * p.qav / 400, mr = p.qmr / 250, ar = p.qar / 120, ms = o.ms * p.qmv / 250;
      const m = Math.max(as, mr, ar, ms);
      const f = m === as ? 320 : m === mr ? 420 : m === ar ? 650 : 140;
      murmurFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.02);
      murmurGain.gain.setTargetAtTime(m > 0.04 ? Math.min(1, m) * 0.35 : 0, ctx.currentTime, 0.015);
    },
    stopMurmur() { if (ctx) murmurGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02); },
  };
}
