// The list of subjects shown on the home page, in display order.
// To rename, reorder, add or remove a subject, edit this file only.
//   slug     - used in the web address, e.g. /physiology/
//   name     - shown to readers
//   blurb    - one line under the name
//   chapters - optional display order of chapters; topics name their chapter
//              in their own meta.js, and any chapter not listed here is
//              added after these, in alphabetical order.

export const SUBJECTS = [
  { slug: 'anatomy', name: 'Anatomy', blurb: 'Structure of the body, region by region.', chapters: ['Upper limb', 'Lower limb', 'Thorax', 'Abdomen', 'Head and neck', 'Neuroanatomy'] },
  { slug: 'psychiatry', name: 'Psychiatry', blurb: 'Mind, behaviour and mental disorders.' },
  { slug: 'biochemistry', name: 'Biochemistry', blurb: 'Molecules, metabolism and pathways.' },
  { slug: 'dermatology', name: 'Dermatology', blurb: 'Skin, hair and nails.' },
  { slug: 'opds', name: 'OPDs', blurb: 'Outpatient approach to common complaints.' },
  { slug: 'community-medicine', name: 'Community Medicine', blurb: 'Epidemiology, public health and prevention.' },
  { slug: 'physiology', name: 'Physiology', blurb: 'How the body works, system by system.', chapters: ['Cardiovascular system', 'Respiratory system', 'Renal physiology', 'Nerve and muscle', 'Endocrine', 'Blood'] },
  { slug: 'ophthalmology', name: 'Ophthalmology', blurb: 'The eye and the visual pathway.' },
  { slug: 'pediatrics', name: 'Pediatrics', blurb: 'Growth, development and childhood illness.' },
  { slug: 'obstetrics-gynecology', name: 'Obstetrics and Gynecology', blurb: 'Pregnancy, labour and women’s health.' },
  { slug: 'clinical-postings', name: 'Clinical Postings', blurb: 'Bedside skills and case work-ups.' },
  { slug: 'surgery', name: 'Surgery and allied subjects', blurb: 'Surgical anatomy, conditions and procedures.' },
  { slug: 'radiology', name: 'Radiology', blurb: 'Reading X-rays, CT, MRI and ultrasound.' },
  { slug: 'forensic-medicine', name: 'Forensic Medicine', blurb: 'Injuries, death and medical law.' },
  { slug: 'anesthesiology', name: 'Anesthesiology', blurb: 'Airway, drugs and perioperative care.' },
  { slug: 'microbiology', name: 'Microbiology', blurb: 'Bacteria, viruses, fungi and parasites.' },
  { slug: 'pathology', name: 'Pathology', blurb: 'Mechanisms and appearances of disease.' },
  { slug: 'pharmacology', name: 'Pharmacology', blurb: 'How drugs act and what they do.' },
  { slug: 'ent', name: 'ENT', blurb: 'Ear, nose and throat.' },
];
