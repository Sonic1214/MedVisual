import { PHASES } from './content.js';

export default {
  slug: 'cardiac-cycle',
  title: 'Cardiac cycle',
  subject: 'physiology',
  chapter: 'Cardiovascular system',
  order: 1,
  blurb: 'A beating 3D heart, a Wiggers diagram you scroll through, and a pressure–volume lab where you can push the heart into exercise, failure or valve disease.',
  description: 'Interactive cardiac cycle: 3D heart with valves and blood flow, scroll-through Wiggers diagram, heart sounds, and a pressure–volume loop simulator.',
  keywords: ['Wiggers diagram', 'pressure volume loop', 'PV loop', 'heart sounds', 'S1 S2 S3 S4', 'murmur', 'JVP a c v waves', 'dicrotic notch', 'stroke volume', 'ejection fraction', 'Frank-Starling', 'preload', 'afterload', 'contractility', 'systole', 'diastole', 'protodiastole', 'aortic stenosis', 'mitral regurgitation'],
  tags: ['3D heart', 'Simulator', 'Heart sounds'],
  sections: [
    ['lab', 'Beating 3D heart'],
    ['beat', 'Wiggers diagram, phase by phase'],
    ...PHASES.map((p) => [p.id, p.name]),
    ['pv', 'Pressure–volume loop lab'],
    ['summary', 'Phase durations and key numbers'],
  ],
  art: '<svg viewBox="0 0 100 100"><path d="M50 86 C20 66 10 48 14 32 C18 18 36 14 46 26 L50 31 L54 26 C64 14 82 18 86 32 C90 48 80 66 50 86Z" fill="var(--accent)" opacity=".9"/><path d="M14 52 H34 L39 44 L45 60 L51 30 L57 66 L62 52 H86" fill="none" stroke="var(--surface)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>',
};
