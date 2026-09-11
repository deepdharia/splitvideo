# SplitVideo

**Split, trim and crop videos online — fast and simple.**

Production-ready browser-based video utility for splitvideo.in.

## Features

- Upload / drag-and-drop video
- Preview with play/pause and timeline
- Precise start/end selection (drag + manual input)
- Trim selected section
- Split into multiple clips with custom cut points
- Crop with common aspect ratios (16:9, 9:16, 1:1, 4:5, 4:3)
- Client-side processing with ffmpeg.wasm (no server upload)
- Mobile-first responsive UI
- SEO pages, blog, FAQ, privacy & terms
- Cloudflare Pages ready

## Tech stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- React Router
- @ffmpeg/ffmpeg (WebAssembly)
- Lucide icons

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

> **Important**: SharedArrayBuffer / ffmpeg.wasm requires these headers (already set in vite.config for dev):
> - Cross-Origin-Opener-Policy: same-origin
> - Cross-Origin-Embedder-Policy: require-corp

## Build & Deploy (Cloudflare Pages)

```bash
npm run build
```

Deploy the `dist` folder to Cloudflare Pages.

### Cloudflare Pages settings

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

For production, add the COOP/COEP headers via `_headers` file (included) or Cloudflare Transform Rules.

## Privacy

All video processing runs in the user’s browser. Files are not uploaded to any server.
