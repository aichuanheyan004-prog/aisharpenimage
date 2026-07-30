# RunPod deployment

The AI beta uses RunPod Serverless with the official `runpod/worker-comfyui:5.8.6-base` image and the BSD-3-Clause Real-ESRGAN `RealESRGAN_x4plus.pth` weight.

## Required endpoint settings

- GPU: 16 GB flex worker class
- Active workers: 0
- Max workers: 1
- Idle timeout: 5 seconds
- Execution timeout: 120 seconds
- Network volume: none
- Container image: build `runpod/Dockerfile` and pin the resulting immutable digest
- API key: server-side only; never use it in the Vite client bundle

## Vercel environment

```text
RUNPOD_API_KEY=<secret>
RUNPOD_ENDPOINT_ID=<endpoint id>
AI_RATE_LIMIT_SALT=<random secret>
AI_ALLOWED_ORIGINS=https://www.aisharpenimage.net
```

Keep RunPod auto-pay disabled, prepay no more than USD 5 for the initial test, and enable a low-balance notification. The provider balance is the hard bill ceiling; the in-process IP limit is only a best-effort availability control and is not durable across Vercel instances.

At the observed July 30, 2026 Serverless flex price of about USD 0.58 per GPU-hour for the cheapest 16 GB class, USD 5 buys at most about 8.6 billed GPU-hours before cold-start and other usage effects. This is a cash ceiling, not a guaranteed number of successful images. Do not enable active workers or auto-pay for the initial test.

The Vercel proxy allows at most two outstanding jobs per runtime in addition to its best-effort daily network allowance. These counters reset and are not shared across serverless instances. They reduce ordinary queue buildup but are not a global abuse or billing control. The endpoint balance must remain prepaid-only.

## Rights and privacy

- Real-ESRGAN source and weights: <https://github.com/xinntao/Real-ESRGAN>, BSD-3-Clause.
- `RealESRGAN_x4plus.pth` v0.1.0: 67,040,989 bytes; SHA-256 `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1`, verified from the complete official release download on July 30, 2026.
- RunPod worker-comfyui: <https://github.com/runpod-workers/worker-comfyui>, AGPL-3.0. This repository keeps the deployment Dockerfile and workflow public; do not add closed modifications to the worker without an AGPL source-compliance review.
- The browser sends a resized WebP derivative, not the original file. The API strips metadata again and rejects animation and transparency.
- RunPod status results may remain available for up to 30 minutes according to its current ComfyUI Serverless guide. The site does not create public result pages or durable image storage; provider security and billing logs follow RunPod's separate practices.
