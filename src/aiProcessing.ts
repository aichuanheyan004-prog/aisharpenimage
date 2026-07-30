export const AI_SOURCE_MAX_PIXELS = 1_000_000;
export const AI_SOURCE_MAX_EDGE = 1_600;
export const AI_UPLOAD_MAX_BYTES = 1_250_000;
export const AI_POLL_INTERVAL_MS = 1_500;
export const AI_POLL_TIMEOUT_MS = 300_000;

export type AiJobStatus = "queued" | "processing" | "completed" | "failed" | "canceled";

export type PreparedAiUpload = {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
};

export type AiJobResponse = {
  id: string;
  status: AiJobStatus;
};

export type AiStatusResponse = {
  id: string;
  status: AiJobStatus;
  resultDataUrl?: string;
  error?: string;
};

type ApiErrorBody = {
  error?: string;
};

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The browser could not prepare the AI upload.")),
      "image/webp",
      quality
    );
  });
}

export function blobToDataUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => {
      reader.abort();
      reject(new DOMException("Canceled", "AbortError"));
    };

    if (signal?.aborted) {
      abort();
      return;
    }

    signal?.addEventListener("abort", abort, { once: true });
    reader.onerror = () => reject(new Error("The browser could not read the prepared image."));
    reader.onload = () => resolve(String(reader.result));
    reader.onloadend = () => signal?.removeEventListener("abort", abort);
    reader.readAsDataURL(blob);
  });
}

export async function prepareAiUpload(file: File, signal?: AbortSignal): Promise<PreparedAiUpload> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image", premultiplyAlpha: "none" });
  try {
    if (signal?.aborted) throw new DOMException("Canceled", "AbortError");

    const pixelScale = Math.min(1, Math.sqrt(AI_SOURCE_MAX_PIXELS / (bitmap.width * bitmap.height)));
    const edgeScale = Math.min(1, AI_SOURCE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const scale = Math.min(pixelScale, edgeScale);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available in this browser.");
    context.drawImage(bitmap, 0, 0, width, height);

    let prepared = await canvasToBlob(canvas, 0.86);
    if (prepared.size > AI_UPLOAD_MAX_BYTES) prepared = await canvasToBlob(canvas, 0.72);
    if (prepared.size > AI_UPLOAD_MAX_BYTES) {
      throw new Error("This image is too complex for AI processing. Try the local sharpener.");
    }

    return {
      dataUrl: await blobToDataUrl(prepared, signal),
      width,
      height,
      bytes: prepared.size
    };
  } finally {
    bitmap.close();
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as ApiErrorBody & T;
  if (!response.ok) throw new Error(body.error || "The AI service could not complete the request.");
  return body;
}

export async function startAiJob(prepared: PreparedAiUpload, signal?: AbortSignal): Promise<AiJobResponse> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: prepared.dataUrl }),
    signal
  });
  return parseApiResponse<AiJobResponse>(response);
}

export async function getAiJob(jobId: string, signal?: AbortSignal): Promise<AiStatusResponse> {
  const response = await fetch(`/api/ai?id=${encodeURIComponent(jobId)}`, { signal });
  return parseApiResponse<AiStatusResponse>(response);
}

export async function cancelAiJob(jobId: string): Promise<void> {
  await fetch(`/api/ai?id=${encodeURIComponent(jobId)}`, { method: "DELETE", keepalive: true }).catch(() => undefined);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("The AI service returned an invalid image.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] });
}
