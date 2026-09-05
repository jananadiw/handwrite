# HandWrite

[![HandWrite preview](./public/handwrite-preview.png)](./public/handwrite-preview.mov)

[Watch the HandWrite preview](./public/handwrite-preview.mov)

HandWrite turns your own letterforms into a downloadable TrueType font. Draw letters with a finger, stylus, or trackpad, or upload a clear photo of handwritten letters. The app builds a `.ttf` file in the browser for review and download, without an account or saved uploads.

## What It Does

- Lets you draw letters directly in the browser without a printed template.
- Accepts phone photos, including common formats such as JPEG, PNG, WEBP, HEIC, and HEIF.
- Normalizes uploads to JPEG before analysis.
- Uses a stateless Next.js API route to ask Gemini for alphabet glyph locations.
- Generates the font in a Web Worker so tracing and OpenType serialization do not block the upload UI.
- Supports uppercase and lowercase glyph extraction when both are present.
- Shows a font preview only after a real `.ttf` has been generated.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Bun
- Gemini API through `@google/genai`
- `opentype.js` for font creation
- `imagetracerjs` for raster-to-vector tracing

## Getting Started

Install dependencies:

```bash
bun install
```

Create `.env.local` and add a Gemini API key:

```bash
GEMINI_API_KEY=your_api_key_here
```

For production, configure Redis-backed upload limiting with either Upstash Redis
or Vercel KV-compatible REST variables:

```bash
UPSTASH_REDIS_REST_URL=your_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token
```

Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
bun run dev      # Start the local development server
bun run build    # Create a production build
bun run start    # Start the production server
bun run lint     # Run ESLint
bun run test     # Run Bun tests with the project test setup
```

## Project Structure

```text
src/app/
  page.tsx                    Home page
  home-spotlight.tsx          Pointer-following background letter reveal
  draw/                       Direct drawing and font-generation UI
  upload/                     Upload, analysis, generation, and review UI
  api/extract/analyze/        Stateless Gemini analysis route

src/lib/extraction/           Gemini response schemas and extraction constants
src/lib/font/                 Glyph tracing, font generation, and worker code
src/lib/images/               Upload normalization helpers
src/lib/server/               Server-only environment helpers
src/test/                     Test setup
```

Project references:

- [Product requirements](./context/PRD.md)
- [Source map](./context/TREE.md)
- [Durable project decisions](./context/decisions.md)

## How The Flow Works

1. The user chooses to draw letters in the browser or upload a photo.
2. The drawing path records the user's strokes and sends them straight to font generation.
3. The photo path normalizes the image to JPEG and sends it to `/api/extract/analyze` for Gemini glyph detection.
4. The browser starts a Web Worker to trace the captured glyphs and build a `.ttf`.
5. The UI displays the generated font preview and download action.

## Notes

- The app does not persist uploads or generated fonts.
- `GEMINI_API_KEY` stays on the server and is never exposed to browser code.
- Production analysis uploads are capped at three valid photos per client IP.
- Font fidelity depends on the photo: clear lighting, dark ink, and separated letters produce better glyphs.
