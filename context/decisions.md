# Decisions

## 2026-06-23: Phase-Specific Upload Flow
- Decision: The upload page renders one focused phase at a time: the upload call-to-action comes first before selection, the example image is optional supporting content, processing uses dedicated progress panels, and font review appears only after generation.
- Reason: The prior stacked layout kept obsolete upload content visible and made later steps harder to understand.
- Impact: Re-upload is handled through explicit change-photo and upload-another-photo actions instead of keeping the initial upload UI on every phase. After generation, upload-another-photo warns that the current `.ttf` will be lost unless downloaded.
- Revisit: If the flow adds multi-photo uploads, persistent saved fonts, or a guided correction stage.

## 2026-06-23: Production Upload Quota
- Decision: Cap valid analysis uploads at three per client IP using Redis-backed counters in production.
- Reason: The app uses an app-owned Gemini key and needs a simple abuse guard before public launch.
- Impact: Production requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` or compatible Vercel KV REST env vars.
- Revisit: If user accounts, paid tiers, reset windows, or more nuanced anti-abuse controls are added.

## 2026-06-19: Current Visual System
- Decision: Use a sage paper palette, CSS paper grain/grid, Libre Baskerville display type, and Work Sans UI type.
- Reason: The app should feel warm and handwriting-focused without sacrificing interface readability.
- Impact: Home and upload surfaces should use shared theme tokens and `paper-grid` instead of ad hoc colors or backgrounds.
- Revisit: If the brand direction or accessibility requirements change.

## 2026-06-19: Transparent Homepage Preview Video
- Decision: Prefer a VP9 WebM with keyed transparency for the homepage handwriting preview, with the original MP4 as fallback.
- Reason: CSS blending could not fully remove the opaque light video background in Chrome.
- Impact: The preview sits directly on the paper grid while browsers without WebM support still have the original MP4.
- Revisit: If Safari-grade alpha video support becomes required or the preview asset is redesigned.

## 2026-06-08: Stateless Gemini Analysis Route
- Decision: Use stateless Next.js API routes for Gemini calls, with `GEMINI_API_KEY` accessed only through a server env abstraction.
- Reason: The app needs an app-owned key without exposing it in browser code, while avoiding accounts, saved uploads, or a database.
- Impact: Core extraction starts with validated Gemini analysis JSON; uploads and generated fonts are not persisted.
- Revisit: If the app switches to user-provided API keys or adds persistent storage.

## 2026-06-09: Browser-Side Worker Font Generation
- Decision: Generate `.ttf` files in a Web Worker from Gemini glyph boxes, including uppercase and lowercase glyphs when present.
- Reason: The app can stay stateless while keeping expensive cleanup, tracing, and OpenType serialization off the main UI thread.
- Impact: Font generation targets 52 glyphs, using uppercase-derived lowercase only as a fallback.
- Revisit: If generation needs backend jobs, persistent storage, guided templates, or punctuation/number support.
