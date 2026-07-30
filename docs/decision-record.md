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

### 3. RunPod Serverless GPU / ComfyUI

Decision: test small, authorized by the user on July 30, 2026 with the existing one-time USD 10 prepaid balance after RunPod's live billing UI required that minimum card transaction. The user later confirmed the current balance may be used without an additional top-up; auto-pay remains disabled. Do not use a paid closed-model API.

The beta uses RunPod Serverless, a public derivative of the AGPL-3.0 `worker-comfyui` image with PyTorch pinned to the official `cu128` wheel channel, and the BSD-3-Clause `RealESRGAN_x4plus.pth` model. The upstream CUDA 12.8.1-tagged image was directly observed on July 30, 2026 to fail GPU preflight on a CUDA 12.8 RunPod host because its installed PyTorch build required a newer driver. The derivative verifies `torch.version.cuda == 12.8` during CI and keeps the deployment source public. The browser creates an approximately 1 MP WebP derivative; the Vercel API decodes it with `sharp`, verifies actual type and dimensions, rejects animation/transparency, rotates from EXIF, strips metadata, and submits only a fixed workflow. Real-ESRGAN performs model-assisted 4x super-resolution and ComfyUI downsamples to a practical 2x WebP. This is not face restoration, forensic recovery, or true motion deblur.

RunPod's current Serverless API provides `/run`, `/status/{jobId}`, and `/cancel/{jobId}`. Serverless scales to zero and bills by execution time. One flex worker, zero active workers with FlashBoot, max workers one, and a 300-second execution timeout constrain concurrency while avoiding the observed full cold-start timeout. The site does not retry failed submissions automatically, preventing duplicate GPU charges.

Controls: 1.25 MB prepared upload, 1 MP and 1600 px edge server limits, real MIME decode, image-bomb limit, metadata removal, 300-second client timeout and cancellation, fixed workflow/model allowlist, one-worker queue, origin allowlist, best-effort hashed-IP allowance, no image-content logs, no public outputs, no durable site storage, and a prepaid provider balance as the cost breaker. Browser fingerprinting is not used. The in-memory Vercel rate limit is not durable and is not treated as the billing boundary.

## Cost And Payment Decision

MVP payment decision: no user login, no checkout, no ads at launch. Local Sharpen remains free and has no marginal inference cost. AI 2x is a small free beta funded only by a manually prepaid RunPod balance.

RunPod pricing check: official RunPod pages observed July 30, 2026 showed approximately USD 0.58/hour for the 16 GB class, USD 0.69/hour for the 24 GB standard class, and USD 1.10/hour for the 24 GB PRO fallback, billed per millisecond in the live endpoint UI. The live billing page also showed a USD 10 minimum card transaction and Auto-Pay disabled. RunPod does not provide a native monthly hard limit, so the setup is: use only the existing prepaid balance, keep auto-pay disabled, use zero active workers, cap concurrency at one, enable no-extra-cost FlashBoot to pause idle workers, use a 300-second execution/client timeout, and never recharge without a new user confirmation. The balance is a cash ceiling, not a guaranteed number of successful images.

Illustrative compute-only scenarios at the selected USD 0.69/hour standard 24 GB rate: 20 billed seconds is about USD 0.0038 per job, 60 seconds about USD 0.0115, and the full 300-second timeout about USD 0.0575. The USD 1.10/hour PRO fallback would cost about USD 0.0917 for 300 seconds. The first verified sample executed for 26.59 seconds on an RTX A4500; at USD 0.58/hour that is approximately USD 0.0043 of compute before any other charges. These estimates exclude failed work, cold-start behavior, data transfer, tax, and future price changes. Measure actual billed seconds and completed outputs before setting any free allowance, and require a new user approval for any later top-up.

Vercel's current request and response payload limit is 4.5 MB. The client reduces inputs before upload, the API caps request data, and output is a quality-82 WebP capped below that boundary. The best-effort per-IP/runtime limiter helps availability but cannot resist distributed proxies or guarantee quota consistency across serverless instances. The prepaid balance remains the only reliable bill ceiling.

Future paid features, only after separate approval: batch processing, huge images, 4x/high-quality models, GPU fast queue, private history, API, commercial workflows, and ad-free/priority use. Before payments: Stripe terms, refunds, tax, privacy, customer support, GPU/storage/bandwidth cost, fraud/chargeback handling, and stop thresholds.

## MVP Acceptance Criteria

- Homepage starts with a working tool.
- JPEG/PNG/WebP input, 12 MB and 18 MP limits.
- Drag/drop, choose, paste, example image.
- Before/after comparison, zoom, sharpness, light denoise, output format, apply, cancel, reset, download.
- Local mode accurately states that selected images are not uploaded. AI mode uploads only a resized derivative after explicit action.
- AI 2x uses the fixed Real-ESRGAN workflow, provides queued/running/failed/canceled states, and falls back to Local Sharpen when unavailable.
- AI inputs are capped at about 1 MP; animated and transparent images are rejected from AI mode and remain eligible for local processing where supported.
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
- RunPod Serverless overview, pricing, billing, account limits, and ComfyUI Serverless guide, checked July 30, 2026.
- RunPod `worker-comfyui` release 5.8.6 and AGPL-3.0 license.
- Real-ESRGAN release `v0.1.0`, `RealESRGAN_x4plus.pth`, BSD-3-Clause license.
- Vercel Functions request/response body limit documentation, checked July 30, 2026.

Official source URLs:

- <https://docs.runpod.io/serverless/overview>
- <https://www.runpod.io/pricing>
- <https://docs.runpod.io/serverless/workers/comfyui>
- <https://github.com/runpod-workers/worker-comfyui/releases/tag/5.8.6>
- <https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.1.0>
- <https://vercel.com/docs/functions/limitations>

## Launch Metrics

- Search: impressions, clicks, non-brand queries, selected canonical, sitemap status.
- Product: tool start, valid file, success, error reason, cancel, download, output format, device class.
- Risk/cost: RunPod billed seconds, failed/canceled jobs, balance remaining, 429/5xx rate, proxy abuse signals, and average GPU seconds per completed image. Do not record image contents or filenames.

## Expansion And Stop Thresholds

7-day review: production status, errors, GSC sitemap processing, mobile failures, download completion, privacy copy alignment.  
30-day review: query mix, pages with impressions, local versus AI completion/download rates, average GPU seconds, cost per completed image, proxy abuse, and demand for higher limits.
Pause AI immediately if the prepaid balance is exhausted, provider spend differs from expected billing, failure rate exceeds 20% over 20 jobs, median completed-job cost exceeds USD 0.05, prohibited-use complaints appear, or provider retention/privacy behavior cannot be verified. Keep Local Sharpen available. Do not add payments until a separate Stripe/refund/tax/privacy/support/fraud and GPU/storage/bandwidth review is approved.
