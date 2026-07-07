# Decisions

## 2026-07-03: July 4 Declaration Demo Fixture
- Decision: Add a `declaration-demo` upload mode that uses curated glyph boxes from the provided Declaration screenshot instead of live model extraction.
- Reason: The demo needs deterministic document-sourced font generation from connected cursive without training a handwriting model.
- Impact: Demo analysis bypasses Gemini and upload quota, then reuses the existing browser-side font worker and review flow.
- Revisit: If the app adds general historical-document extraction, multi-image glyph review, or a trained segmentation model.

## 2026-06-24: Vercel Web Analytics
- Decision: Use Vercel Web Analytics through `@vercel/analytics` mounted in the App Router root layout.
- Reason: The app is deployed on Vercel and needs lightweight first-party pageview analytics without adding a separate analytics vendor.
- Impact: All app routes emit Vercel Web Analytics pageview data when analytics is enabled for the Vercel project.
- Revisit: If the app needs product funnels, custom events, self-hosted analytics, or non-Vercel deployment support.

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

## 2026-06-26: Transparent Homepage Preview Animation
- Decision: Use an animated transparent WebP for the homepage handwriting preview.
- Reason: The source video needed audio removal and frame-level keying to remove paper/grid guide lines from the letter; CSS blending cannot remove baked-in lines.
- Impact: The homepage preview remains an image asset with no audio track and sits directly on the paper grid.
- Revisit: If broader animation format fallback, higher-fidelity rotoscoping, or video playback controls become required.

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
