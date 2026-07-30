# AI Sharpen Image Decision Record

Date checked: July 30, 2026  
Target market: United States, English, desktop and mobile web  
Verdict: test small

## Historical Attachment Notes

The two user-provided screenshots are treated only as historical third-party clues. They suggested the keyword cluster `ai sharpen image`, `image enhancer`, `image sharpener`, competitors such as ImgUpscaler/PicWish-like tools, an exact-match domain direction, and a ComfyUI/API workflow idea. They are not used as current 2026 facts, and no article copy, screenshots, or design was copied.

## Current SERP Evidence

Browser check: Google Search, `hl=en`, `gl=us`, `pws=0`, July 30, 2026. Results can vary by device, location, personalization, and time.

Observed queries:

- `ai sharpen image`: tool/product intent with Topaz Labs, Picsart, Imagen, Canva, NoteGPT, Adobe, ImgUpscaler; ads, images, videos.
- `sharpen image`: online tool intent with PineTools, Picsart, Adobe Express, Canva, imageonline; ads, images, videos.
- `image sharpener`: same tool intent; PineTools, Adobe Express, Canva, Picsart, Imagen, Topaz, ImgUpscaler.
- `sharpen blurry image`: mixed sharpen/unblur tool intent; Canva, Adobe, PineTools, Picsart, Topaz, PicWish, YouTube.
- `AI image enhancer`: broader AI enhance/upscale intent; Picsart, AirBrush, Adobe, Krea, Canva, Upscale.media, PicWish.
- `unblur image`: stronger deblur intent; unblurimage.ai, Picsart, Canva, Adobe, ImageUpscaler, Topaz, Imagen, TinyWow.
- `image upscaler`: separate upscaling intent; imageupscaler.com, ImgUpscaler, Adobe Firefly, Canva, Cloudinary, Stockphotos.

Conclusion: the homepage should serve the central online sharpener task. `AI image enhancer`, `unblur image`, and `image upscaler` should not become independent landing pages until the product truly provides those model-backed functions. The guide can explain the difference and link back to the tool.

## User Task

Photography users, designers, ecommerce sellers, old-photo scanners, AI image users, and general users need to make a slightly soft image look clearer using a private, fast web tool and understand when sharpening is not enough.

## Competitor Gaps

Large tools rank well but often mix sharpening, enhancement, unblur, and upscaling language. A small site can compete first on a narrower promise: immediate tool, no login, browser-local privacy, honest limits, and a practical guide.

## Technical Route Comparison

### 1. Browser-local traditional sharpening

Decision: build for MVP.

Pros: no upload, no account, no inference bill, no GPU queue, no payment-abuse surface, fast enough for ordinary images, easy to test. Canvas pixel manipulation is well-established in browsers through APIs such as `getImageData()` and `putImageData()` per MDN documentation.  
Cons: this is not true AI deblur, face restoration, or super-resolution. It must not claim to recover true missing detail.

Quality boundary: use terms such as sharpening, local edge contrast, light denoise. Do not claim forensic restoration or real deblurring.

### 2. Browser-side ML inference

Decision: postpone.

Possible stack: ONNX Runtime Web/WebGPU/WASM plus a legally usable quantized super-resolution or deblur model. Package checks found ONNX Runtime Web available under MIT, but the real risk is model license, model size, first-load time, WebGPU availability, mobile memory, CDN bandwidth, and output consistency. This route needs a separate model-license and browser-performance spike before any claim.

### 3. Server GPU / ComfyUI / external API

Decision: plan only; do not launch without user budget approval.

ComfyUI can accept workflow JSON in API format and queue prompts through routes such as `/prompt`, according to current ComfyUI documentation. This could enable true AI upscaling/deblur later without paying a closed paid AI image model if self-hosted or rented GPU economics work. It still creates GPU, storage, upload, queue, abuse, privacy, and support cost.

Required controls before launch: file size and pixel caps, MIME decode validation, image-bomb defense, EXIF/metadata policy, timeout, per-IP/device/account limits, queue cap, signed short-lived URLs, minimum retention, deletion policy, no duplicate billing on failure, monthly budget breaker, alerts, bot/proxy abuse controls, NSFW/illegal-content boundary, and logs that do not store image contents. Browser fingerprinting may only be one privacy-disclosed signal, not the only defense.

## Cost And Payment Decision

MVP payment decision: no login, no payment, no ads at launch.

Reason: the selected MVP has zero marginal inference cost, no server upload/storage, and no billable AI abuse surface. Lower startup friction is more valuable than charging early. Track GSC impressions, task starts, valid completions, failure reasons, downloads, device/browser compatibility, and real quality feedback first.

Future paid features, only after separate approval: batch processing, huge images, 4x/high-quality models, GPU fast queue, private history, API, commercial workflows, and ad-free/priority use. Before payments: Stripe terms, refunds, tax, privacy, customer support, GPU/storage/bandwidth cost, fraud/chargeback handling, and stop thresholds.

## MVP Acceptance Criteria

- Homepage starts with a working tool.
- JPEG/PNG/WebP input, 12 MB and 18 MP limits.
- Drag/drop, choose, paste, example image.
- Before/after comparison, zoom, sharpness, light denoise, output format, apply, cancel, reset, download.
- Local processing statement is accurate: selected images are not uploaded by the free tool.
- Transparent PNG alpha is preserved.
- Broken or disguised files fail cleanly.
- Desktop and 390px mobile layout has no horizontal overflow.
- Indexable URLs: `/`, `/guide`, `/privacy`, `/terms`; real 404 is noindex.
- No fake reviews, ratings, user counts, or unsupported AI claims.

## URL Plan

| URL | Intent | Index |
| --- | --- | --- |
| `/` | AI sharpen image / image sharpener / sharpen image online | yes, self-canonical |
| `/guide` | explain sharpening, denoise, deblur, upscaling limits | yes, self-canonical |
| `/privacy` | processing/privacy terms | yes, self-canonical |
| `/terms` | authorized use and limitations | yes, self-canonical |
| `/404.html` | missing pages | noindex |

No independent `unblur image`, `AI image enhancer`, `photo sharpener`, or `image upscaler` pages at launch because they either share the homepage intent or require stronger model-backed functionality.

## Sources Checked

- Google SERP browser inspection, United States English parameters, July 30, 2026.
- MDN Canvas APIs: `getImageData()`, `putImageData()`, `createImageBitmap()`.
- Google Search Central: canonical URLs and structured data guidelines.
- Vercel project configuration: `vercel.json`, redirects, headers, clean URLs.
- ComfyUI documentation: workflows as API-format JSON and prompt queue routes.

## Launch Metrics

- Search: impressions, clicks, non-brand queries, selected canonical, sitemap status.
- Product: tool start, valid file, success, error reason, cancel, download, output format, device class.
- Risk/cost: no server image storage or model cost in MVP.

## Expansion And Stop Thresholds

7-day review: production status, errors, GSC sitemap processing, mobile failures, download completion, privacy copy alignment.  
30-day review: query mix, pages with impressions, task completion, requests for real AI deblur/upscale, and whether ComfyUI/GPU cost modeling justifies a paid beta.  
Stop or redesign if users expect true AI restoration and the free tool disappoints, if mobile memory failures dominate, or if search impressions cluster around unblur/upscale terms the current product does not honestly satisfy.
