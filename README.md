# Design Picker

Browse visual Designs, tweak palette/type, copy `design.md` into any agent or project.
Static site: Python at build time, vanilla HTML/CSS/JS at runtime.

## Run

```sh
python build.py                 # generates dist/
python -m http.server -d dist   # open http://localhost:8000
```

(Opening `dist/index.html` directly works too; clipboard needs `localhost` or HTTPS.)

## Deploy

`dist/` is a plain static folder — drop it on Cloudflare Pages (build command `python build.py`, output dir `dist`) or any free static host.

## Structure

- `data/designs.py` — the catalog: palettes, type pairings, designs, sample poster content
- `build.py` — computes contrast facts, injects data, emits `dist/`
- `site/` — page shell, styles, runtime logic
- `CONTEXT.md` — domain glossary
- `.agents/docs/adr/` — architectural decisions
