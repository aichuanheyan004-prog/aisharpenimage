import { ChangeEvent, DragEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  FileImage,
  ImageIcon,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X
} from "lucide-react";
import {
  OutputFormat,
  SharpenSettings,
  decodeBitmap,
  outputName,
  processBitmap,
  validateImageFile
} from "./imageProcessing";
import { createSampleFile } from "./sampleImage";
import { useObjectUrl } from "./useObjectUrl";

type ResultState = {
  blob: Blob;
  width: number;
  height: number;
  changedPixels: number;
  name: string;
};

const defaultSettings: SharpenSettings = {
  strength: 1.15,
  radius: 1,
  denoise: 0.2,
  outputFormat: "image/png",
  quality: 0.92
};

const page = () => window.location.pathname.replace(/\/$/, "") || "/";

export function App() {
  const route = page();
  if (route === "/privacy") return <StaticShell><Privacy /></StaticShell>;
  if (route === "/terms") return <StaticShell><Terms /></StaticShell>;
  if (route === "/guide") return <StaticShell><Guide /></StaticShell>;
  if (route !== "/") return <StaticShell><NotFound /></StaticShell>;
  return <Home />;
}

function Home() {
  const [settings, setSettings] = useState(defaultSettings);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceBlob, setSourceBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [status, setStatus] = useState("Drop, paste, or choose an image to begin.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState(50);
  const [zoom, setZoom] = useState(1);
  const abortRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sourceUrl = useObjectUrl(sourceBlob);
  const resultUrl = useObjectUrl(result?.blob ?? null);

  const resultMeta = useMemo(() => {
    if (!result) return "No output yet";
    return `${result.width} x ${result.height}px, ${Math.round(result.blob.size / 1024)} KB`;
  }, [result]);

  async function handleFile(file: File) {
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setError(validation.reason);
      setStatus("Unsupported input.");
      return;
    }

    const runId = abortRef.current + 1;
    abortRef.current = runId;
    setBusy(true);
    setError("");
    setStatus("Decoding image in this browser...");
    setSourceFile(file);
    setSourceBlob(file);
    setResult(null);

    try {
      const bitmap = await decodeBitmap(file);
      if (abortRef.current !== runId) return;
      setStatus("Sharpening pixels locally...");
      const processed = await processBitmap(bitmap, settings);
      bitmap.close();
      if (abortRef.current !== runId) return;
      setResult({ ...processed, name: outputName(file.name, settings.outputFormat) });
      setStatus("Ready. Compare the result and download when it looks right.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The image could not be processed.");
      setStatus("Processing failed.");
    } finally {
      if (abortRef.current === runId) setBusy(false);
    }
  }

  function cancelWork() {
    abortRef.current += 1;
    setBusy(false);
    setStatus("Canceled.");
  }

  function resetAll() {
    abortRef.current += 1;
    setSourceFile(null);
    setSourceBlob(null);
    setResult(null);
    setError("");
    setBusy(false);
    setCompare(50);
    setZoom(1);
    setSettings(defaultSettings);
    setStatus("Drop, paste, or choose an image to begin.");
  }

  async function reprocess(nextSettings = settings) {
    if (!sourceFile) return;
    setSettings(nextSettings);
    await handleFile(sourceFile);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (file) void handleFile(file);
  }

  async function loadSample() {
    await handleFile(createSampleFile());
  }

  function updateSetting<K extends keyof SharpenSettings>(key: K, value: SharpenSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
  }

  function handleKeyDrop(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className="app-shell" onPaste={onPaste}>
      <Header />
      <main>
        <section className="tool-layout" aria-labelledby="home-title">
          <div className="workspace">
            <div className="title-row">
              <div>
                <p className="eyebrow">Private browser tool</p>
                <h1 id="home-title">AI Sharpen Image Online</h1>
                <p className="intro">
                  Sharpen soft photos and graphics in your browser. The free tool uses local edge contrast and light denoise processing; it does not upload images or claim to recover details that are not in the file.
                </p>
              </div>
              <div className="privacy-badge"><ShieldCheck size={18} /> No upload for this tool</div>
            </div>

            <div
              className="dropzone"
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={handleKeyDrop}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
              aria-label="Choose, drop, or paste a JPEG, PNG, or WebP image"
            >
              <input ref={inputRef} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} />
              <Upload size={28} />
              <strong>Drop, paste, or choose an image</strong>
              <span>JPEG, PNG, or WebP up to 12 MB and 18 megapixels</span>
            </div>

            <div className="status-line" role="status" aria-live="polite">
              {error ? <AlertCircle size={18} /> : <ImageIcon size={18} />}
              <span>{error || status}</span>
            </div>

            <div className="preview-frame" style={{ ["--compare" as string]: `${compare}%`, ["--zoom" as string]: String(zoom) }}>
              {sourceUrl && resultUrl ? (
                <div className="compare-stage">
                  <img src={sourceUrl} alt="Original uploaded preview" className="preview-img original" />
                  <img src={resultUrl} alt="Sharpened output preview" className="preview-img processed" />
                  <div className="compare-line" />
                </div>
              ) : sourceUrl ? (
                <img src={sourceUrl} alt="Original uploaded preview" className="single-preview" />
              ) : (
                <div className="empty-preview">
                  <FileImage size={44} />
                  <p>Your image preview appears here.</p>
                </div>
              )}
            </div>

            <label className="control compact">
              <span>Before / after</span>
              <input type="range" min="0" max="100" value={compare} onChange={(event) => setCompare(Number(event.target.value))} disabled={!result} />
            </label>
          </div>

          <aside className="controls" aria-label="Sharpening controls">
            <div className="panel-title">
              <Sparkles size={18} />
              <h2>Adjust</h2>
            </div>
            <label className="control">
              <span>Sharpness</span>
              <input data-testid="sharpness-slider" type="range" min="0" max="2.5" step="0.05" value={settings.strength} onChange={(event) => updateSetting("strength", Number(event.target.value))} />
              <output>{settings.strength.toFixed(2)}</output>
            </label>
            <label className="control">
              <span>Light denoise</span>
              <input data-testid="denoise-slider" type="range" min="0" max="1" step="0.05" value={settings.denoise} onChange={(event) => updateSetting("denoise", Number(event.target.value))} />
              <output>{settings.denoise.toFixed(2)}</output>
            </label>
            <label className="control">
              <span>Preview zoom</span>
              <input data-testid="zoom-slider" type="range" min="0.5" max="2.5" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              <output>{Math.round(zoom * 100)}%</output>
            </label>
            <label className="select-label">
              <span>Output</span>
              <select value={settings.outputFormat} onChange={(event) => updateSetting("outputFormat", event.target.value as OutputFormat)}>
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
              </select>
            </label>
            <div className="button-grid">
              <button className="primary" type="button" onClick={() => void reprocess()} disabled={!sourceFile || busy}>
                <RefreshCcw size={17} /> Apply
              </button>
              <button type="button" onClick={loadSample} disabled={busy}>
                <ImageIcon size={17} /> Example
              </button>
              <button type="button" onClick={cancelWork} disabled={!busy}>
                <X size={17} /> Cancel
              </button>
              <button type="button" onClick={resetAll}>
                <RotateCcw size={17} /> Reset
              </button>
            </div>
            <a className={`download ${resultUrl ? "" : "disabled"}`} href={resultUrl || undefined} download={result?.name}>
              <Download size={18} /> Download
            </a>
            <dl className="facts">
              <div><dt>Input</dt><dd>{sourceFile ? `${sourceFile.name} (${Math.round(sourceFile.size / 1024)} KB)` : "None"}</dd></div>
              <div><dt>Output</dt><dd>{resultMeta}</dd></div>
              <div><dt>Privacy</dt><dd>Processed locally in this browser.</dd></div>
            </dl>
          </aside>
        </section>

        <section className="content-band">
          <div>
            <h2>What this sharpener can and cannot do</h2>
            <p>
              Sharpening increases local edge contrast. It can make slightly soft product photos, scans, screenshots, and AI images look crisper, but it cannot reveal truthful detail that was never captured. Light denoise can reduce speckle before sharpening, although too much denoise may remove texture.
            </p>
          </div>
          <div>
            <h2>When to use a stronger AI workflow</h2>
            <p>
              Real deblurring, face restoration, and super-resolution require a suitable model. A future ComfyUI or GPU workflow may be useful for larger or harder images, but it needs cost controls, upload privacy terms, rate limits, and a clear paid/free boundary before launch.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="AI Sharpen Image home"><span>AI</span> Sharpen Image</a>
      <nav aria-label="Main navigation">
        <a href="/guide">Guide</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 AI Sharpen Image</span>
      <a href="/sitemap.xml">Sitemap</a>
    </footer>
  );
}

function StaticShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="static-page">{children}</main>
      <Footer />
    </div>
  );
}

function Guide() {
  return (
    <article>
      <p className="eyebrow">Image Sharpening Guide</p>
      <h1>How image sharpening, denoise, deblur, and upscaling differ</h1>
      <p>
        Sharpening is not the same as restoring a blurred photograph. A sharpener boosts contrast around existing edges. Denoise smooths random speckle. Deblur estimates motion or focus blur. Super-resolution creates a larger image with model-assisted detail. Each method has a different risk of artifacts.
      </p>
      <h2>Sharpening</h2>
      <p>
        Traditional sharpening, including unsharp-mask style processing, compares each pixel with nearby pixels and increases edge contrast. It is fast and private in the browser, but strong settings can create halos, jagged edges, crunchy skin texture, and stronger JPEG artifacts.
      </p>
      <h2>Denoise</h2>
      <p>
        Denoise can help before sharpening because sharpening also amplifies noise. The tradeoff is texture loss: fabric, hair, paper grain, and product surfaces may look waxy if smoothing is too aggressive.
      </p>
      <h2>Deblur and face restoration</h2>
      <p>
        True motion deblur, focus correction, and face restoration use specialized models or heavier algorithms. They may produce convincing output, but the output is still an estimate. Do not use it as forensic proof or as a promise that the original scene has been recovered exactly.
      </p>
      <h2>Super-resolution and printing</h2>
      <p>
        Upscaling increases pixel dimensions. It helps when a small image must be printed or placed in a larger design, but output quality depends on source quality, scale factor, model, and print size. Upscaling a noisy or compressed image can also enlarge defects.
      </p>
      <h2>Best workflow</h2>
      <ol>
        <li>Start with the largest original file you own or are authorized to edit.</li>
        <li>Use light denoise only when noise is visible.</li>
        <li>Increase sharpness until edges look clearer, then back off before halos appear.</li>
        <li>Export PNG for transparent graphics, JPEG for photos, and WebP when web delivery matters.</li>
      </ol>
      <p>
        This site keeps the free sharpener local to your browser. If server-side AI restoration is added later, the page will state the model route, upload purpose, retention period, and cost boundary before you use it.
      </p>
    </article>
  );
}

function Privacy() {
  return (
    <article>
      <p className="eyebrow">Privacy</p>
      <h1>Privacy Policy</h1>
      <p>Last updated: July 30, 2026.</p>
      <p>
        The current free image sharpener runs in your browser. Selected images are decoded and processed locally with Canvas APIs. They are not uploaded to our server by this tool.
      </p>
      <h2>What we collect</h2>
      <p>
        We do not collect image files, image contents, filenames, or generated outputs. Standard hosting logs may include IP address, user agent, requested URL, timestamp, and error status for security and reliability.
      </p>
      <h2>Storage</h2>
      <p>
        The tool creates temporary browser object URLs for preview and download. They are revoked when you replace the image, reset the tool, or leave the page. We do not create public result pages.
      </p>
      <h2>Future server-side AI</h2>
      <p>
        If a ComfyUI, GPU, or external AI API feature is added, this policy will be updated before launch with upload purpose, provider, region where known, retention period, deletion mechanism, limits, and paid/free terms.
      </p>
    </article>
  );
}

function Terms() {
  return (
    <article>
      <p className="eyebrow">Terms</p>
      <h1>Terms of Use</h1>
      <p>Use this tool only for images you own, created, licensed, or are otherwise authorized to edit.</p>
      <h2>No forensic guarantee</h2>
      <p>
        Sharpening changes pixel contrast and may create artifacts. Results are provided as an editing aid, not as evidence that missing details were recovered truthfully.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not use the site to infringe copyright, impersonate people, harass others, create deceptive identity documents, or process illegal content. The current browser-local tool has no account, storage, or public posting feature.
      </p>
      <h2>Availability</h2>
      <p>
        Browser memory, file size, image dimensions, and device performance can affect output. The site is provided without warranty and may change as the product is tested.
      </p>
    </article>
  );
}

function NotFound() {
  return (
    <article>
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist. Return to the image sharpener or open the guide.</p>
      <p><a className="text-link" href="/">Open the sharpener</a></p>
    </article>
  );
}
