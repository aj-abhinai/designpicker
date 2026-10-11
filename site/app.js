// Renders the design catalog. Boots in one of two modes:
// index mode (grid of designs) or design mode (single design + swaps + copy).

const { palettes, pairings, designs, poster, principles, textures } = window.DATA;
const DESIGN_ID = window.DESIGN_ID || null;
const ROOT = window.ROOT || "";

const state = { design: null, palette: null, pairing: null };

const byId = (list, id) => list.find((x) => x.id === id);
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ResizeObserver feeds each poster its own unit (--u = 1% of poster width),
// so poster typography scales with the poster, independent of viewport.
const posterObserver =
  "ResizeObserver" in window
    ? new ResizeObserver((entries) =>
        entries.forEach((e) => e.target.style.setProperty("--u", e.contentRect.width / 100 + "px"))
      )
    : null;

function mountPosters(root = document) {
  root.querySelectorAll(".poster").forEach((p) => {
    const tex = p.querySelector(".p-tex");
    if (tex) tex.style.cssText = textures[p.dataset.tex] || "";
    if (posterObserver) posterObserver.observe(p);
    else p.style.setProperty("--u", (p.clientWidth || 300) / 100 + "px");
  });
}

// Detached posters stay alive while observed, so release them before re-render.
function unobservePosters(root = document) {
  if (!posterObserver) return;
  root.querySelectorAll(".poster").forEach((p) => posterObserver.unobserve(p));
}

/* ---------- random (uniform over design x palette x pairing) ---------- */

function stateUrl(designId, paletteId, pairingId) {
  return `${ROOT}design/${designId}.html?p=${paletteId}&t=${pairingId}`;
}

// Rolls one state uniformly; re-rolls when it matches the excluded state.
function rollState(exclude) {
  let d, p, t;
  do {
    d = designs[Math.floor(Math.random() * designs.length)];
    p = palettes[Math.floor(Math.random() * palettes.length)];
    t = pairings[Math.floor(Math.random() * pairings.length)];
  } while (
    exclude &&
    d.id === exclude.designId &&
    p.id === exclude.paletteId &&
    t.id === exclude.pairingId
  );
  return { design: d, palette: p, pairing: t };
}

/* ---------- design.md ---------- */

function designMd(design, palette, pairing) {
  return `## Colors

- **Primary** (\`${palette.background}\`) — Canvas background
- **On-Primary** (\`${palette.foreground}\`) — Text and content
- **Accent** (\`${palette.accent}\`) — CTAs, highlights
- **Muted** (\`${palette.muted}\`) — Secondary text
- **Contrast** — ${palette.contrast}

## Typography

- **Headline** — ${pairing.headline} at weight ${pairing.headline_weight}
- **Body** — ${pairing.body} at weight ${pairing.body_weight}
- **Scale** — ${pairing.scale}
- **Treatment** — ${pairing.treatment}

## Layout

- Structure: ${design.layout.structure}
- Spacing: ${design.layout.spacing}
- Density: ${design.layout.density}
- Corners: ${design.layout.corners}

## Elevation
${design.elevation}

## Texture

- **${palette.texture}** — surface overlay, felt not read
${principlesSection(design)}
`.trimEnd();
}

function principlesSection(design) {
  const list = (design.principles || [])
    .map((id) => byId(principles, id))
    .filter(Boolean);
  if (!list.length) return "";
  return `
## Principles

${list.map((p) => `- **${p.name}** — ${p.rule}`).join("\n")}`;
}

/* ---------- poster rendering ---------- */

function shadowFor(design) {
  if (design.structure === "console") return "0 0 calc(var(--u)*5) color-mix(in srgb, var(--peffect) 14%, transparent)";
  if (design.structure === "swiss") return "0 calc(var(--u)*2) calc(var(--u)*5) rgba(0,0,0,.10)";
  return "none";
}

function posterVars(design, palette, pairing) {
  const radius =
    design.structure === "swiss"
      ? "calc(var(--u)*6) calc(var(--u)*6) 0 0"
      : "calc(var(--u)*0.7)";
  return [
    `--pbg:${palette.background}`,
    `--pfg:${palette.foreground}`,
    `--paccent:${palette.accent}`,
    `--pmuted:${palette.muted}`,
    `--peffect:${palette.effect}`,
    `--phl:'${pairing.headline}'`,
    `--phlw:${pairing.headline_weight}`,
    `--pbd:'${pairing.body}'`,
    `--pbdw:${pairing.body_weight}`,
    `--pradius:${radius}`,
    `--pshadow:${shadowFor(design)}`,
  ].join(";");
}

function posterHTML(design, palette, pairing) {
  const lines = poster.title_lines.map((l) => `<span>${esc(l)}</span>`).join("");
  const meta = poster.meta
    .map(([k, v]) => `<div class="p-row"><span>${esc(k)}</span><i></i><span>${esc(v)}</span></div>`)
    .join("");
  return `
  <article class="poster s-${design.structure} t-${pairing.id}" style="${posterVars(design, palette, pairing)}" data-tex="${esc(palette.texture)}" aria-label="${esc(design.name)} preview">
    <div class="p-tex"></div>
    <div class="p-head">
      <span class="p-kicker">${esc(poster.kicker)}</span>
      <span class="p-index">${esc(poster.index)}</span>
    </div>
    <h4 class="p-title">${lines}</h4>
    <p class="p-sub">${esc(poster.sub)}</p>
    <div class="p-meta">${meta}</div>
    <div class="p-foot"><span>${esc(poster.foot[0])}</span><span>${esc(poster.foot[1])}</span></div>
  </article>`;
}

/* ---------- index mode ---------- */

function bootIndex() {
  document.getElementById("count").textContent = `${designs.length} designs · ${palettes.length} palettes × ${pairings.length} pairings`;

  const grid = document.getElementById("grid");
  grid.innerHTML = designs
    .map((d, i) => {
      const palette = byId(palettes, d.palette);
      const dots = [palette.background, palette.foreground, palette.accent, palette.muted]
        .map((c) => `<span class="dot" style="background:${c}"></span>`)
        .join("");
      return `
      <a class="card" href="${ROOT}design/${d.id}.html" style="animation-delay:${Math.min(i, 8) * 90}ms">
        <div class="card-poster">${posterHTML(d, palette, byId(pairings, d.pairing))}</div>
        <div class="card-cap">
          <strong>${esc(d.name)}<span class="card-tag">${esc(d.structure)}</span></strong>
          <span class="dots">${dots}</span>
        </div>
        <p>${esc(d.description)}</p>
        <span class="card-go">view →</span>
      </a>`;
    })
    .join("");

  document.getElementById("random").addEventListener("click", () => {
    const r = rollState();
    location.href = stateUrl(r.design.id, r.palette.id, r.pairing.id);
  });

  mountPosters(grid);
}

/* ---------- design mode ---------- */

function chipHTML(list, selectedId, kind) {
  return list
    .map((item) => {
      const pressed = item.id === selectedId;
      if (kind === "palette") {
        const dots = [item.background, item.foreground, item.accent, item.muted]
          .map((c) => `<span class="dot" style="background:${c}"></span>`)
          .join("");
        return `<button class="chip" type="button" aria-pressed="${pressed}" data-kind="palette" data-id="${item.id}"><span class="dots">${dots}</span>${esc(item.name)}</button>`;
      }
      return `<button class="chip" type="button" aria-pressed="${pressed}" data-kind="pairing" data-id="${item.id}"><b style="font-family:'${item.headline}';font-weight:${item.headline_weight}">Aa</b> ${esc(item.headline)}</button>`;
    })
    .join("");
}

function renderDesign() {
  const d = state.design;
  const stage = document.getElementById("stagePoster");
  unobservePosters(stage);
  stage.innerHTML = posterHTML(d, state.palette, state.pairing);
  document.getElementById("dName").textContent = d.name;
  document.getElementById("dDesc").textContent = d.description;
  document.getElementById("paletteChips").innerHTML = chipHTML(palettes, state.palette.id, "palette");
  document.getElementById("pairingChips").innerHTML = chipHTML(pairings, state.pairing.id, "pairing");
  document.getElementById("mdPreview").textContent = designMd(d, state.palette, state.pairing);

  document.querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      if (chip.dataset.kind === "palette") state.palette = byId(palettes, chip.dataset.id);
      else state.pairing = byId(pairings, chip.dataset.id);
      renderDesign();
    })
  );

  mountPosters(stage);
}

function bootDesign() {
  document.getElementById("random").addEventListener("click", () => {
    const current = state.design
      ? { designId: DESIGN_ID, paletteId: state.palette.id, pairingId: state.pairing.id }
      : null;
    const r = rollState(current);
    location.href = stateUrl(r.design.id, r.palette.id, r.pairing.id);
  });

  state.design = byId(designs, DESIGN_ID);
  if (!state.design) {
    document.getElementById("dName").textContent = "Design not found";
    document.getElementById("dDesc").textContent = "This design no longer exists — head back to all designs.";
    return;
  }
  state.palette = byId(palettes, state.design.palette);
  state.pairing = byId(pairings, state.design.pairing);

  // Deep-linked state (?p=&t=) overrides the design defaults when valid.
  const params = new URLSearchParams(location.search);
  const linkedPalette = byId(palettes, params.get("p"));
  const linkedPairing = byId(pairings, params.get("t"));
  if (linkedPalette) state.palette = linkedPalette;
  if (linkedPairing) state.pairing = linkedPairing;

  renderDesign();

  const btn = document.getElementById("copy");
  let restoreTimer = null;
  btn.addEventListener("click", async () => {
    const md = designMd(state.design, state.palette, state.pairing);
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    btn.textContent = "Copied ✓";
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => (btn.textContent = "Copy design.md"), 1400);
  });
}

/* ---------- boot ---------- */

if (DESIGN_ID) bootDesign();
else bootIndex();
