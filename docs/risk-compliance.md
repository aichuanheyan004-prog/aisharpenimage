# Risk And Abuse Record

Date: July 30, 2026

Feature/data/content: browser-local image sharpening, optional RunPod AI 2x enhancement, and an informational guide.

Legitimate user and authorized task: users edit images they own, created, licensed, or are otherwise authorized to process.

Potential harms: misleading AI restoration claims, copyright misuse, deceptive editing, sensitive personal-image uploads, GPU cost abuse, proxy/bot abuse, prohibited content, provider retention uncertainty, and browser memory failure.

Rights/source/terms: UI, text, sample image, favicon, and OG image are original. No competitor images or article text are reused.

Personal/sensitive data flow: Local Sharpen processes images only in browser memory. AI 2x creates an approximately 1 MP WebP derivative and uploads it only after explicit action to a Vercel function and RunPod. The API strips metadata and does not intentionally log image content or filename. Job IDs, status, runtime, IP address, user agent, security, and billing metadata may appear in provider logs. RunPod may use an available infrastructure region. Status results may remain retrievable for up to 30 minutes; provider security/billing logs follow separate retention practices.

Public/indexable behavior: only finished informational/tool pages are indexable. User inputs and outputs are never public or indexable.

Platform/payment/ad dependencies: Vercel and RunPod Serverless. ComfyUI and Real-ESRGAN are open source; GPU execution is paid infrastructure. There is no object store, end-user payment processor, account, subscription, or ad network.

Controls: local 12 MB/18 MP limits; AI derivative 1.25 MB/1 MP/1600 edge limits; actual MIME decode; image-bomb protection; reject animation and alpha for AI; EXIF rotation and metadata stripping; only two fixed server-built model workflows (`quality` and `fast`); quality-86 WebP response margin; origin allowlist; 300-second timeout/cancel; no automatic retry; zero active workers with FlashBoot; max one flex worker; at most two outstanding jobs per Vercel runtime; best-effort salted IP hash allowance; no hidden fingerprinting; no public result pages; no durable site image storage; privacy/terms disclosures; no deblur, face-restoration, or truthful-detail-recovery claims.

Cost and abuse boundary: RunPod has no native monthly hard cap and its live billing UI required a USD 10 minimum card transaction. Use only that existing prepaid balance, keep auto-pay disabled, and allow the balance to reach zero. The balance is the final spend breaker. Vercel memory rate limiting is instance-local and can be bypassed by distributed clients, so it is only a secondary availability control. No future recharge occurs without user approval.

Content boundary: users must have rights to process an image. No public gallery or result URL is created. The fixed general-purpose enhancement workflow does not intentionally specialize in sexual or illegal content, but a small beta without a moderation service cannot guarantee detection. Immediately suspend cloud mode on credible prohibited-content abuse; Local Sharpen remains browser-only.

Residual risk: distributed proxy abuse can consume the USD 10 balance; cold starts and failed jobs reduce useful capacity; provider infrastructure region and log retention are not controlled by this site; model output can invent plausible details; and users can still submit sensitive or unauthorized images despite terms. These risks are bounded by low prepaid exposure, explicit upload consent, strict input limits, no public storage, honest claims, and the ability to disable AI mode independently.

Outcome: allow with controls.

Recheck trigger: any RunPod price/retention/API change, recharge above USD 10, paid plans, a durable database/rate limiter, object storage, face restoration, true deblur, public galleries, accounts, batch processing, analytics beyond anonymous aggregate events, or ads.
