# MedVisual

Interactive visual explainers for medical students: 3D models, simulations and step-by-step diagrams, one topic per page, organised by subject.

## Run it on a computer

You need Node.js 22.23 or newer.

```bash
npm install
npm run dev      # live preview at http://localhost:4321
npm run build    # production site in dist/ (includes the search index)
```

## Hosting

Vercel builds the site automatically from this repository (`vercel.json` holds the settings). Every push to `main` goes live; every other branch gets its own preview link.

## Where things live

| Path | What it is |
| --- | --- |
| `src/data/subjects.js` | The subject list. Rename, reorder, add or remove subjects here. |
| `src/topics/<subject>/<topic>/meta.js` | A topic's title, subject, chapter, search keywords and card art. Change `subject` or `chapter` to move it. |
| `src/topics/<subject>/<topic>/Page.astro` | The topic page itself, plus its own scripts and styles in the same folder. |
| `src/styles/global.css` | Colours, fonts and shared styles for the whole site (light and dark). |
| `src/components/` | Shared pieces such as the header with search. |
| `src/lib/heartModel.js` | The heart simulation used by the cardiac cycle page. |

## Adding a topic

1. Copy an existing topic folder into `src/topics/<subject>/<new-topic>/`.
2. Edit `meta.js` (slug, title, subject, chapter, blurb, keywords).
3. Build the page in `Page.astro`.

It appears on its subject page, in search and on the home page automatically.
