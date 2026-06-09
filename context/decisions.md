# Decisions

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

## 2026-06-08: Paper Grain Page Background

- Decision: Replace the page grid background with a CSS-generated paper grain texture.
- Reason: The app should feel closer to photographed writing paper while keeping the existing Vellum & Indigo palette.
- Impact: Shared page shells should continue using the `paper-grid` class for the textured background.
- Revisit: If the app introduces image-based textures or multiple visual themes.
