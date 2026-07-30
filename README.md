# AI Sharpen Image

Image sharpening site for https://www.aisharpenimage.net/ with two explicit modes:

- Local Sharpen: browser-local Canvas processing with no image upload.
- AI 2x beta: a resized derivative goes through one of two fixed Real-ESRGAN ComfyUI workflows on RunPod Serverless. High Quality is the default; Fast uses a lighter native 2x pass.

The cloud beta has no end-user payment flow. Its infrastructure exposure is capped by the existing one-time USD 10 RunPod prepaid balance, with auto-pay disabled and no additional recharge authorized. See `docs/decision-record.md`, `docs/risk-compliance.md`, and `runpod/README.md` before deployment.

## Local development

```bash
npm install
npm run dev
```

Vite does not emulate the Vercel `/api/ai` function. Local frontend testing therefore shows a safe AI-service failure unless the Vercel development runtime is used with server-side environment variables. Never put RunPod credentials in a `VITE_*` variable.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
node C:/Users/chunk/.codex/skills/gefei-site-builder/scripts/audit_static_site.mjs dist
```
