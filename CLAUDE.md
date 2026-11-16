# MedVisual: notes for Claude

## Project

Public website of interactive visual explainers for medicine (subjects → chapters → topics, one interactive page per topic). The owner is a medical student who supplies topics and documents; Claude designs and builds. The owner's definition of the site may grow into a one-stop shop for all of medicine.

- Stack: Astro (static output), three.js for 3D, Pagefind for full-text search. No backend.
- Hosting: Vercel, building from GitHub `Sonic1214/MedVisual`. `main` is production; other branches get preview URLs.

## How the owner works

- Uses Claude Code in the browser. Also keeps a desktop folder in sync, so **always send the owner the files they need (a zip of the repo source) at the end of each piece of work**, as well as pushing.
- **Before starting a new piece of work, lay out the ways it could be done and what else could be built, and recommend one.**
- Wants lots of creativity: each topic should use a different kind of interaction (3D, simulation, scrollytelling, drag and drop, cases, games), not one repeated template.
- Subjects will change: keep everything data-driven (`src/data/subjects.js`, per-topic `meta.js`).
- No warning or disclaimer banners on pages.
- **Never add quizzes, MCQs, flashcards or other self-test features unless the owner explicitly asks for them.** (An earlier quiz request was sent by mistake and was removed.)
- Build only what the owner asked for; offer extra features as options instead of adding them.
- Strong on medicine, new to web tooling: explain steps simply, one or two at a time.

## Git

- The owner (GitHub user Sonic1214) is the only author. Commit as `Shreyas Pillai <sonicboltsixtynine@gmail.com>` (set in this repo's git config) for both author and committer, with commit signing turned off (this environment otherwise signs with its own key).
- **Never add Co-Authored-By, Claude-Session or any other attribution lines to commits or pull requests**, and never credit Claude or anyone else, unless the owner explicitly asks.
- Work on `main` only when the owner asks; otherwise use a branch and ask before merging.

## Conventions

- Each topic lives in `src/topics/<subject>/<topic>/` with `meta.js` + `Page.astro` + its own JS/CSS. Page-specific CSS is global but prefixed with the page root class (e.g. `.cc`, `.bp-root`).
- Reusable pieces go in `src/components/` (e.g. `Header.astro`).
- Every page must work at 390px wide in light and dark, with no horizontal scroll. Render-test with Playwright (`--use-angle=swiftshader` for WebGL) before pushing.
- Heavy libraries (three.js) are imported dynamically so other pages stay light.
- Pin exact dependency versions. Check licences before using outside images or 3D models.
- Medical content from general knowledge must be flagged to the owner for checking.
