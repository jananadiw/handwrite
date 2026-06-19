# Decisions

## 2026-06-19: Transparent Homepage Preview Video

- Decision: Prefer a VP9 WebM with keyed transparency for the homepage handwriting preview, with the original MP4 as fallback.
- Reason: CSS blending could not fully remove the opaque light video background in Chrome.
- Impact: The preview sits directly on the paper grid without a rectangular card, while browsers without WebM support still have the original MP4.
- Revisit: If Safari-grade alpha video support becomes required or the preview asset is redesigned.

## 2026-06-19: Libre Baskerville and Work Sans Pairing

- Decision: Use bold italic Libre Baskerville as the display font and Work Sans as the body/UI font.
- Reason: Work Sans keeps interface text readable while feeling warmer and more crafted beside the serif display heading.
- Impact: Tailwind `font-serif` remains decorative display type, while `font-sans` now resolves through the Google-loaded Work Sans variable.
- Revisit: If the brand display font changes or UI text needs a more neutral sans.

## 2026-06-19: Sage Paper Palette

- Decision: Use `#FAF9F7` as the app background, `#2B2622` as ink, and `#A7BC9A` as the primary action accent.
- Reason: The visual direction moved away from brick/orange toward a softer professional paper palette.
- Impact: Shared theme tokens drive the home and upload surfaces while preserving the existing grain, grid, and spotlight effects.
- Revisit: If the brand palette changes again or sage needs a darker accessible text companion.

## 2026-06-18: Paper Grain and Grid Background

- Decision: Use CSS-generated paper grain with a subtle 32px app grid on shared `paper-grid` surfaces.
- Reason: The home background should feel like paper without depending on a texture asset, while keeping each spotlight letter aligned to one visible square.
- Impact: Home and upload pages inherit the grain/grid stack; the home spotlight letter cells share the same grid size.
- Revisit: If the background distracts from upload guidance or the grid needs route-specific contrast.

## 2026-06-18: App Background Color

- Decision: Use `#F3F1EB` as the app-wide background color.
- Reason: The application background should use the requested warmer paper tone consistently.
- Impact: Superseded by the 2026-06-19 sage paper palette.
- Revisit: Superseded.

## 2026-06-16: Libre Baskerville and Avenir Font Pairing

- Decision: Use bold italic Libre Baskerville as the display font and Avenir Next Pro as the body/UI font.
- Reason: Libre Baskerville is closer to the requested serif direction while Avenir keeps smaller interface text readable.
- Impact: Tailwind `font-serif` is decorative display type, while `font-sans` keeps smaller text readable.
- Revisit: If the brand display font changes or more font weights are added.

## 2026-06-11: Automatic Glyph Preprocessing

- Decision: Clean and normalize glyph masks automatically before browser-side tracing.
- Reason: User handwriting samples vary in size, stroke thickness, and stray ink around letters.
- Impact: Generated uppercase glyphs target cap height, lowercase glyphs target x-height, and detached noise is filtered before tracing.
- Revisit: If users need manual per-letter cleanup controls or a guided writing template.

## 2026-06-04: Vellum & Indigo Design System

- Decision: Use Tailwind theme tokens for the Vellum & Indigo palette, with Cormorant Garamond for display/type previews and DM Sans for functional UI.
- Reason: The site now has a broader brand system instead of a single styled header.
- Impact: Page styling should use Tailwind token classes rather than ad hoc CSS.
- Revisit: If a component library or multiple brand themes are introduced.

## 2026-06-08: Stateless Gemini Analysis Route

- Decision: Use stateless Next.js API routes for Gemini calls, with `GEMINI_API_KEY` accessed only through a server env abstraction.
- Reason: The app needs an app-owned key without exposing it in browser code, while avoiding accounts, saved uploads, or a database.
- Impact: Core extraction starts with validated Gemini analysis JSON; deterministic browser-side tracing remains a later step.
- Revisit: If the app switches to user-provided API keys or adds persistent storage.

## 2026-06-08: Preview Only After Font Generation

- Decision: Show a font preview only after a downloadable font has been generated.
- Reason: A pre-generation raster crop preview can imply the font is ready when the app has only completed photo analysis.
- Impact: Analysis-only states show feedback; review and preview appear only when a generated `.ttf` Blob exists.
- Revisit: When generated font data and a download action exist.

## 2026-06-08: Browser-Side Font Generation

- Decision: Generate the first `.ttf` in the browser from Gemini letter boxes using raster tracing and OpenType serialization.
- Reason: The app can keep uploads stateless while producing a real downloadable font without adding persistent backend storage.
- Impact: The first generated font supports traced detected letters with simple metrics; fidelity improvements should focus on detection, cleanup, and glyph normalization.
- Revisit: If font generation needs server-only dependencies, persistent jobs, or higher-fidelity vectorization.

## 2026-06-09: Worker-Based Font Generation

- Decision: Run browser-side font generation in a Web Worker after Gemini analysis completes.
- Reason: Raster tracing and OpenType serialization can block the main UI thread on slower devices.
- Impact: Upload state, analysis, and download handling stay in React while glyph tracing and `.ttf` serialization run off-thread.
- Revisit: If Worker browser support, tracing dependencies, or generation performance require a backend job.

## 2026-06-09: Uppercase and Lowercase Glyph Extraction

- Decision: Detect and trace both uppercase and lowercase handwritten glyphs when present.
- Reason: Users naturally write paired samples like `Aa`, and synthesized lowercase does not preserve handwriting style.
- Impact: Font generation targets 52 glyphs, using uppercase-derived lowercase only as a fallback.
- Revisit: If the app adds guided templates or supports punctuation/numbers.

## 2026-06-08: Paper Grain Page Background

- Decision: Replace the page grid background with a CSS-generated paper grain texture.
- Reason: The app should feel closer to photographed writing paper while keeping the existing Vellum & Indigo palette.
- Impact: Superseded; `paper-grid` remains as the shared page shell class but no longer applies texture.
- Revisit: Superseded by the 2026-06-18 paper grain and grid background decision.
