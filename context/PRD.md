
## overview
Handwrite is a web app that converts a user's own letterforms into a downloadable .ttf font file. Users can draw letters in the browser or upload a photo of letters written on paper, then preview and download a working font.

## goals
1. Working end-to-end flow: draw or upload → glyph extraction → font preview → .ttf download
2. AI glyph extraction accurate enough for everyday handwriting
3. Free to use with user's own API key
4. Deployed and publicly accessible on Vercel
5. No account, no backend, no database

## Out of Scope

1. Kerning editor or manual glyph adjustment
2. Accounts, saved fonts, or font history
3. Payments or monetisation
4. Mobile / iOS native app
5. Support for cursive or connected handwriting
6. Custom punctuation or extended character sets

## Step	User action	App behaviour

1. Lands on app ->	Explains the private, template-free service and offers draw or upload paths.
2. Draws letters ->	Captures strokes from a finger, stylus, mouse, or trackpad without a printed template.
3. Uploads photo ->	Accepts common image formats. Silently converts HEIC → JPEG, resizes to max 2000px.
4. Clicks generate ->	Builds drawn letters locally or calls /api/extract for an uploaded photo. The key never leaves the server.
5. Sees preview ->	A–Z rendered on canvas using the captured glyph paths.
6. Downloads font ->	.ttf file downloaded via browser. No account needed.

## Constraints & Known Limits

- AI glyph tracing is approximate — complex curves and serifs will need manual adjustment in v2
- Cursive / connected handwriting not supported in v1
- API image limit: 5MB — handled automatically by canvas resize
- HEIC images auto-converted in browser before API call
- No offline support

## Success Metrics
- End-to-end flow works for a clean photo of printed handwriting
- Font renders correctly on canvas and downloads as a valid .ttf
- No API key visible in browser devtools or network tab
- Deployed to a public Vercel URL
- Instruction card reduces bad uploads
