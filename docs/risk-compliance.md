# Risk And Abuse Record

Date: July 30, 2026

Feature/data/content: browser-local image sharpening tool and informational guide.

Legitimate user and authorized task: users edit images they own, created, licensed, or are otherwise authorized to process.

Potential harms: misleading AI restoration claims, copyright misuse, deceptive editing, processing sensitive personal images, future GPU/API cost abuse, large-file browser memory failure.

Rights/source/terms: UI, text, sample image, favicon, and OG image are original. No competitor images or article text are reused.

Personal/sensitive data flow: current tool processes images locally with Canvas. No image upload, account, public result page, or image analytics. Hosting logs may contain ordinary request metadata.

Public/indexable behavior: only finished informational/tool pages are indexable. User inputs and outputs are never public or indexable.

Platform/payment/ad dependencies: none at MVP. Vercel hosting and GitHub repository only. No paid AI model, ComfyUI server, object storage, or payment processor is connected.

Controls: 12 MB file cap, 18 MP/6000 edge cap, MIME and extension validation, no server upload, no hidden fingerprinting, privacy and terms pages, no unsupported deblur/upscale/face-restoration claims.

Residual risk: browser MIME can still differ from decode reality, so decode errors are handled. Users may still interpret the domain as AI-powered; the page explicitly says the free tool is local sharpening, not true detail recovery.

Outcome: allow with controls.

Recheck trigger: adding ComfyUI, GPU, external API, payments, analytics beyond anonymous aggregate events, public galleries, accounts, batch processing, or ads.
