# Design Picker

A catalog of visual Designs for AI-generated posters, slides, and HyperFrames compositions. Browse live previews, tweak colors and type, and copy `design.md` into any agent or project.

## Language

**Design**:
A named, composed visual recipe — palette, typography, layout, elevation, texture — with no content of its own. The thing stored, previewed, tweaked, and emitted.
_Avoid_: theme, style, moodboard, template

**design.md**:
The markdown serialization of a Design (Colors / Typography / Layout / Elevation / Texture) that the copy button places on the clipboard.
_Avoid_: style sheet, snippet, config

**Palette**:
A named color profile — background, foreground, accent, muted — plus its surface texture and contrast facts. Swappable within a Design.
_Avoid_: color scheme, colors

**Pairing**:
A named headline/body font combination with its type treatment. Swappable within a Design.
_Avoid_: font set, typography

**Preview**:
The live poster rendered from a Design's tokens; how a Design is judged before use.
_Avoid_: thumbnail, screenshot

**Catalog**:
The stored collection of Designs shipped with the tool.
_Avoid_: library, gallery

**Principles**:
The core design rules (one accent, contrast ≥ 4.5:1, no pure black/white, …) each Design commits to; emitted as the `## Principles` section of design.md.
_Avoid_: rules, constraints, guidelines

**Texture**:
A surface overlay (scanlines, halftone, grain, …) owned by the Palette, applied at low opacity so it is felt, never read.
_Avoid_: pattern, filter, effect
