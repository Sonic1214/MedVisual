// Lumped-parameter model of the left heart and systemic arteries.
// LV and LA are time-varying elastances (active + passive exponential curve),
// valves are one-way (with optional leak for regurgitation), the aortic valve
// carries inertance so ejection continues by momentum, and the arteries are a
// 4-element windkessel (proximal compliance, inertance, distal compliance,
// peripheral resistance). Everything is in mL, mmHg and seconds.

export const DEFAULTS = {
  hr: 75,
  contractility: 1, // multiplier on LV end-systolic elastance
  preload: 1, // multiplier on pulmonary venous (filling) pressure
  afterload: 1, // multiplier on systemic vascular resistance
  compliance: 1, // multiplier on LV passive stiffness (higher = stiffer)
  as: 0, // aortic stenosis severity 0..1
  ms: 0, // mitral stenosis severity 0..1
  ar: 0, // aortic regurgitation severity 0..1
  mr: 0, // mitral regurgitation severity 0..1
};

export const CONST = {
  emaxLV: 2.4, v0LV: 12, p0LV: 0.42, lamLV: 0.027,
  emaxLA: 0.28, v0LA: 6, p0LA: 0.55, lamLA: 0.055,
  ppv: 10.5, rpv: 0.045, // pulmonary veins (pressure source + resistance)
  rmv: 0.0045, lmv: 0.00008, // mitral valve
  rav: 0.0035, lav: 0.00012, // aortic valve
  c1: 0.09, rc: 0.03, r12: 0.06, l12: 0.0016, c2: 1.45, rs: 1.02, pven: 4,
};

// double-hill ventricular activation (Stergiopulos et al.), normalised to peak 1
const DH = (() => {
  const f = (t) => { const a = (t / 0.269) ** 1.32, b = (t / 0.452) ** 27.4; return (a / (1 + a)) * (1 / (1 + b)); };
  let m = 0; for (let t = 0; t < 1; t += 0.0005) m = Math.max(m, f(t));
  return (t) => f(t) / m;
})();
function vact(t, T) { return t <= 0 ? 0 : DH(t / T.vScale); }

// cosine activation: 0 -> 1 over tp, back to 0 over tr
function act(t, tp, tr) {
  if (t < 0) return 0;
  if (t < tp) return 0.5 * (1 - Math.cos(Math.PI * t / tp));
  if (t < tp + tr) return 0.5 * (1 + Math.cos(Math.PI * (t - tp) / tr));
  return 0;
}

export function timing(hr) {
  const rr = 60 / hr;
  const s = Math.sqrt(rr / 0.8);
  return {
    rr,
    aOn: 0, aTp: 0.075, aTr: 0.075, // atrial contraction starts at t = 0
    pOn: -0.06, pDur: 0.09, // P wave
    qrsOn: 0.08 + 0.0 * s, // PR interval about 0.14 s
    vOn: 0.093, vScale: 0.8 * s, // ventricular activation (double-hill time scale)
  };
}

/** Simulate to steady state and return one beat sampled every dt. */
export function simulate(opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const T = timing(o.hr);
  const rr = T.rr;
  const emax = CONST.emaxLV * o.contractility;
  const lam = CONST.lamLV * o.compliance;
  const ppv = CONST.ppv * o.preload;
  const rs = CONST.rs * o.afterload;
  const rav = CONST.rav + o.as * o.as * 0.09; // stenosis raises resistance steeply
  const rmv = CONST.rmv + o.ms * o.ms * 0.06;
  const rar = o.ar > 0 ? 0.6 / (o.ar * o.ar * 8) : Infinity; // regurgitant path
  const rmr = o.mr > 0 ? 0.6 / (o.mr * o.mr * 8) : Infinity;

  const dt = 0.0002;
  let vlv = 120, vla = 55, v1 = CONST.c1 * 90, v2 = CONST.c2 * 85, qav = 0, qmv = 0, q12 = 80, qnet = 0;
  const beats = 10;
  const nPer = Math.round(rr / dt);
  const out = [];
  const keep = 2; // sample every keep*dt
  for (let b = 0; b < beats; b++) {
    const last = b === beats - 1;
    for (let i = 0; i < nPer; i++) {
      const t = i * dt;
      const ev = vact(t - T.vOn, T) + vact(t - T.vOn + rr, T);
      const ea = act(t - T.aOn, T.aTp, T.aTr) + act(t - T.aOn - rr, T.aTp, T.aTr);
      const pedLV = CONST.p0LV * (Math.exp(lam * (vlv - CONST.v0LV)) - 1);
      const plv = ev * emax * (vlv - CONST.v0LV) + (1 - ev) * pedLV;
      const pedLA = CONST.p0LA * (Math.exp(CONST.lamLA * (vla - CONST.v0LA)) - 1);
      const pla = ea * CONST.emaxLA * (vla - CONST.v0LA) + (1 - ea) * pedLA;
      const p1 = v1 / CONST.c1 + CONST.rc * qnet, p2 = v2 / CONST.c2; // rc: viscous wall damping

      // mitral valve with inertance; closes when forward flow stops
      if (qmv > 0 || pla > plv) {
        qmv += dt * (pla - plv - rmv * qmv) / CONST.lmv;
        if (qmv < 0) qmv = 0;
      }
      // aortic valve with inertance
      if (qav > 0 || plv > p1) {
        qav += dt * (plv - p1 - rav * qav) / CONST.lav;
        if (qav < 0) qav = 0;
      }
      const qar = p1 > plv ? (p1 - plv) / rar : 0; // leak back into LV
      const qmr = plv > pla ? (plv - pla) / rmr : 0; // leak back into LA
      const qpv = (ppv - pla) / CONST.rpv;
      q12 += dt * (p1 - p2 - CONST.r12 * q12) / CONST.l12;
      const qs = (p2 - CONST.pven) / rs;

      if (last && i % keep === 0) {
        out.push({ t, plv, pla, pao: p1, vlv, vla, qmv, qav, qar, qmr, qpv, q12, ev, ea });
      }
      vlv += dt * (qmv + qar - qav - qmr);
      vla += dt * (qpv + qmr - qmv);
      qnet = qav - qar - q12;
      v1 += dt * qnet;
      v2 += dt * (q12 - qs);
    }
  }
  return analyse(out, T, o);
}

function analyse(s, T, o) {
  const n = s.length;
  const dtS = s[1].t - s[0].t;
  let iMVC = -1, iAVO = -1, iAVC = -1, iMVO = -1, iPk = -1, iCross = -1, iRF = -1;
  const iV = s.findIndex((x) => x.t >= T.vOn);
  for (let i = iV; i < n; i++) if (s[i].qmv === 0) { iMVC = i; break; }
  for (let i = Math.max(iMVC, 0); i < n; i++) if (s[i].qav > 0) { iAVO = i; break; }
  for (let i = iAVO + 1; i < n; i++) if (s[i].qav === 0) { iAVC = i; break; }
  for (let i = iAVC + 1; i < n; i++) if (s[i].qmv > 0) { iMVO = i; break; }
  let pk = -1;
  for (let i = iAVO; i < iAVC; i++) if (s[i].plv > pk) { pk = s[i].plv; iPk = i; }
  // rapid ejection ends once about 70% of the stroke volume has left
  const vStart = s[iAVO].vlv, vEnd = s[iAVC].vlv;
  for (let i = iAVO; i < iAVC; i++) if (vStart - s[i].vlv >= 0.7 * (vStart - vEnd)) { iCross = i; break; }
  let eMax = 0, iE = iMVO;
  for (let i = iMVO; i < n; i++) { if (s[i].qmv > eMax) { eMax = s[i].qmv; iE = i; } if (s[i].qmv < eMax * 0.5 && i > iE) break; }
  for (let i = iE; i < n; i++) if (s[i].qmv < eMax * 0.2) { iRF = i; break; }
  if (iRF < 0) iRF = n - 1;
  // S3 at the sharpest deceleration of early inflow; S4 at peak atrial inflow
  let iS3 = iE, dMin = 0;
  for (let i = iE; i < Math.min(n - 1, iE + Math.round(0.12 / dtS)); i++) {
    const d = s[i + 1].qmv - s[i].qmv; if (d < dMin) { dMin = d; iS3 = i; }
  }
  let iS4 = 0, aMax = -1;
  for (let i = 0; i < iMVC; i++) if (s[i].qmv > aMax) { aMax = s[i].qmv; iS4 = i; }

  const t = (i) => s[i].t;
  const rr = T.rr;
  const edv = s[iMVC].vlv, esv = s[iAVC].vlv;
  let sysMax = -1, diaMin = 1e9, sum = 0, fwd = 0;
  for (const x of s) { sysMax = Math.max(sysMax, x.pao); diaMin = Math.min(diaMin, x.pao); sum += x.pao; fwd += x.qav * dtS; }
  let vMax = -1, vMin = 1e9, back = 0; for (const x of s) { vMax = Math.max(vMax, x.vlv); vMin = Math.min(vMin, x.vlv); back += x.qar * dtS; }
  fwd -= back; // net forward flow per beat
  const sv = vMax - vMin; // total stroke volume (includes regurgitant part)
  const ev = {
    mvc: t(iMVC), avo: t(iAVO), peak: t(iPk), rapidEjEnd: iCross > 0 ? t(iCross) : t(iPk), avc: t(iAVC), mvo: t(iMVO), rfEnd: t(iRF), end: rr,
    s1: t(iMVC), s2: t(iAVC), s3: t(iS3), s4: t(iS4),
  };
  const phases = [
    [0, ev.mvc], [ev.mvc, ev.avo], [ev.avo, ev.rapidEjEnd], [ev.rapidEjEnd, ev.avc], [ev.avc, ev.mvo], [ev.mvo, Math.min(ev.rfEnd, rr)], [Math.min(ev.rfEnd, rr), rr],
  ];
  return {
    samples: s, timing: T, events: ev, phases, opts: o,
    metrics: {
      hr: o.hr, rr, edv: vMax, esv: vMin, sv, fwdSv: fwd, ef: sv / vMax, co: fwd * o.hr / 1000,
      sbp: sysMax, dbp: diaMin, map: sum / s.length, edp: s[iMVC].plv, peakLV: pk,
      laMean: s.reduce((a, x) => a + x.pla, 0) / s.length,
      sysTime: ev.avc - ev.mvc, diaTime: rr - (ev.avc - ev.mvc),
    },
  };
}

// Synthetic ECG (mV) at cycle time t; wraps around the cycle.
export function ecg(t, T) {
  const rr = T.rr, s = Math.sqrt(rr / 0.8);
  const g = (x, mu, sd, a) => a * Math.exp(-0.5 * ((x - mu) / sd) ** 2);
  let v = 0;
  for (const k of [-1, 0, 1]) {
    const x = t - k * rr;
    v += g(x, T.pOn + 0.045, 0.02, 0.15); // P
    v += g(x, T.qrsOn + 0.02, 0.006, -0.12); // Q
    v += g(x, T.qrsOn + 0.04, 0.009, 1.15); // R
    v += g(x, T.qrsOn + 0.058, 0.008, -0.28); // S
    v += g(x, T.qrsOn + 0.27 * s, 0.045 * s, 0.3); // T
  }
  return v;
}
