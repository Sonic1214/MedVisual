// Builds the site tree (subjects -> chapters -> topics) from
// src/data/subjects.js and every src/topics/*/*/meta.js file.
// A topic is placed by the `subject` and `chapter` in its meta.js, so moving
// a topic only needs that file changed; its folder can stay where it is.

import { SUBJECTS } from '../data/subjects.js';

const metas = import.meta.glob('../topics/*/*/meta.js', { eager: true });

export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const topics = Object.entries(metas)
  .map(([path, mod]) => ({ key: path.match(/topics\/(.+)\/meta\.js$/)[1], ...mod.default }))
  .filter((t) => !t.draft)
  .map((t) => ({ ...t, chapterSlug: slugify(t.chapter || 'General') }));

export const subjects = SUBJECTS.map((s) => {
  const own = topics.filter((t) => t.subject === s.slug);
  const order = s.chapters || [];
  const names = [...new Set(own.map((t) => t.chapter || 'General'))].sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const chapters = names.map((name) => ({
    name,
    slug: slugify(name),
    topics: own.filter((t) => (t.chapter || 'General') === name).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title)),
  }));
  return { ...s, chapters, count: own.length };
});

export const subjectBySlug = Object.fromEntries(subjects.map((s) => [s.slug, s]));

export function topicUrl(t) {
  return `${t.subject}/${t.slug}/`;
}

// Small index embedded in every page so the search box answers instantly.
// Full-text results come from Pagefind after a production build.
export const searchIndex = [
  ...subjects.map((s) => ({ k: 'Subject', t: s.name, d: s.blurb, u: `${s.slug}/`, w: [s.name] })),
  ...subjects.flatMap((s) => s.chapters.map((c) => ({ k: 'Chapter', t: c.name, d: s.name, u: `${s.slug}/#${c.slug}`, w: [c.name, s.name] }))),
  ...topics.map((t) => ({
    k: 'Topic',
    t: t.title,
    d: `${subjectBySlug[t.subject]?.name ?? t.subject} · ${t.chapter}`,
    u: topicUrl(t),
    w: [t.title, t.blurb, ...(t.keywords || [])],
  })),
  ...topics.flatMap((t) => (t.sections || []).map(([id, name]) => ({ k: 'Section', t: name, d: t.title, u: `${topicUrl(t)}#${id}`, w: [name, t.title] }))),
];
