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
