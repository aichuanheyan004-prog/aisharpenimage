# RunPod deployment

The AI beta uses a public derivative of RunPod's `runpod/worker-comfyui:5.8.6-base-cuda12.8.1` image and the BSD-3-Clause Real-ESRGAN `RealESRGAN_x4plus.pth` weight. The derivative force-installs PyTorch 2.7.1, torchvision 0.22.1, and torchaudio 2.7.1 from PyTorch's `cu128` wheel index, then verifies `torch.version.cuda == 12.8` during the image build. This is required because the upstream image was observed on July 30, 2026 to contain a PyTorch build that rejected a RunPod host with CUDA driver 12.8 even though the image tag names CUDA 12.8.1.

## Required endpoint settings

- GPU: 24 GB flex class first, 24 GB PRO fallback; 16 GB was removed after repeated low-supply allocation failures
- Active workers: 0
- Max workers: 1
- Idle timeout: 5 seconds
- Execution timeout: 120 seconds
- Container disk: 30 GB (the compressed image layers exceed 11 GB)
- Minimum CUDA version: 12.8
- Network volume: none
- Container image: build `runpod/Dockerfile` and pin the resulting immutable commit tag or digest; do not point production at the mutable convenience tag
- API key: server-side only; never use it in the Vite client bundle

## Vercel environment

```text
RUNPOD_API_KEY=<secret>
RUNPOD_ENDPOINT_ID=<endpoint id>
AI_RATE_LIMIT_SALT=<random secret>
AI_ALLOWED_ORIGINS=https://www.aisharpenimage.net
```

Keep RunPod auto-pay disabled, use the existing one-time USD 10 prepaid balance for the initial test, and do not recharge without a new approval. The user's operating target remains no more than USD 5 of GPU usage per month even though RunPod required a USD 10 minimum card transaction. The prepaid provider balance is the final bill ceiling; the operating target must be reviewed manually because RunPod does not expose a native monthly hard cap. The in-process IP limit is only a best-effort availability control and is not durable across Vercel instances.

At the observed July 30, 2026 Serverless prices, the selected 24 GB classes were approximately USD 0.69/hour for standard and USD 1.10/hour for PRO. The existing USD 10 balance is a cash ceiling, not a usage target or a guaranteed number of successful images. Do not enable active workers or auto-pay for the initial test, and pause the AI beta when cumulative monthly GPU usage reaches USD 5.

The Vercel proxy allows at most two outstanding jobs per runtime in addition to its best-effort daily network allowance. These counters reset and are not shared across serverless instances. They reduce ordinary queue buildup but are not a global abuse or billing control. The endpoint balance must remain prepaid-only.

## Rights and privacy

- Real-ESRGAN source and weights: <https://github.com/xinntao/Real-ESRGAN>, BSD-3-Clause.
- `RealESRGAN_x4plus.pth` v0.1.0: 67,040,989 bytes; SHA-256 `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1`, verified from the complete official release download on July 30, 2026.
- RunPod worker-comfyui: <https://github.com/runpod-workers/worker-comfyui>, AGPL-3.0. This repository keeps the deployment Dockerfile and workflow public; do not add closed modifications to the worker without an AGPL source-compliance review.
- The browser sends a resized WebP derivative, not the original file. The API strips metadata again and rejects animation and transparency.
- RunPod status results may remain available for up to 30 minutes according to its current ComfyUI Serverless guide. The site does not create public result pages or durable image storage; provider security and billing logs follow RunPod's separate practices.
