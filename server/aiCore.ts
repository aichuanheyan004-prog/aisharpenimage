import sharp from "sharp";

export const SERVER_AI_MAX_BYTES = 1_250_000;
export const SERVER_AI_MAX_PIXELS = 1_000_000;
export const SERVER_AI_MAX_EDGE = 1_600;
export const SERVER_AI_MAX_RESULT_CHARS = 4_000_000;
export const REAL_ESRGAN_MODEL = "RealESRGAN_x2plus.pth";
export const AI_BLEND_FACTOR = 0.85;

export type SanitizedAiInput = {
  dataUrl: string;
  width: number;
  height: number;
};

export type RunpodStatus = "queued" | "processing" | "completed" | "failed" | "canceled";

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;
const RAW_BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const JOB_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/;

export function validateJobId(value: unknown): string {
  if (typeof value !== "string" || !JOB_ID_PATTERN.test(value)) throw new Error("Invalid job ID.");
  return value;
}

export function parseImageDataUrl(value: unknown): { mime: string; bytes: Buffer } {
  if (typeof value !== "string") throw new Error("An image is required.");
  const match = DATA_URL_PATTERN.exec(value);
  if (!match) throw new Error("Use a valid JPEG, PNG, or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 16 || bytes.length > SERVER_AI_MAX_BYTES) {
    throw new Error("The prepared AI upload must be no larger than 1.25 MB.");
  }
  return { mime: match[1], bytes };
}

export async function sanitizeAiInput(value: unknown): Promise<SanitizedAiInput> {
  const { mime, bytes } = parseImageDataUrl(value);
  const image = sharp(bytes, { failOn: "warning", limitInputPixels: SERVER_AI_MAX_PIXELS });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const expectedFormat = mime === "image/jpeg" ? "jpeg" : mime.slice("image/".length);

  if (metadata.format !== expectedFormat) throw new Error("The image contents do not match the declared MIME type.");
  if (width < 1 || height < 1 || width > SERVER_AI_MAX_EDGE || height > SERVER_AI_MAX_EDGE || width * height > SERVER_AI_MAX_PIXELS) {
    throw new Error("The prepared image exceeds the AI beta pixel limit.");
  }
  if ((metadata.pages ?? 1) !== 1) throw new Error("Animated images are not supported by the AI beta.");
  if (metadata.hasAlpha) {
    const imageStats = await image.clone().stats();
    const alphaStats = imageStats.channels.at(-1);
    if (!alphaStats || alphaStats.min < 255) {
      throw new Error("Transparent images are supported only by the local sharpener for now.");
    }
  }

  const sanitized = await image.rotate().webp({ quality: 86, effort: 4 }).toBuffer();
  if (sanitized.length > SERVER_AI_MAX_BYTES) throw new Error("The sanitized AI upload is too large.");
  return {
    dataUrl: `data:image/webp;base64,${sanitized.toString("base64")}`,
    width,
    height
  };
}

export function buildComfyWorkflow() {
  return {
    "1": {
      inputs: { image: "input.webp" },
      class_type: "LoadImage",
      _meta: { title: "Load sanitized input" }
    },
    "2": {
      inputs: { model_name: REAL_ESRGAN_MODEL },
      class_type: "UpscaleModelLoader",
      _meta: { title: "Load Real-ESRGAN" }
    },
    "3": {
      inputs: { upscale_model: ["2", 0], image: ["1", 0] },
      class_type: "ImageUpscaleWithModel",
      _meta: { title: "Native AI 2x enhancement" }
    },
    "4": {
      inputs: { image: ["1", 0], upscale_method: "lanczos", scale_by: 2 },
      class_type: "ImageScaleBy",
      _meta: { title: "Faithful 2x reference" }
    },
    "5": {
      inputs: {
        image1: ["4", 0],
        image2: ["3", 0],
        blend_factor: AI_BLEND_FACTOR,
        blend_mode: "normal"
      },
      class_type: "ImageBlend",
      _meta: { title: "Reduce artifacts while retaining AI detail" }
    },
    "6": {
      inputs: {
        images: ["5", 0],
        filename_prefix: "aisharpenimage",
        fps: 1,
        lossless: false,
        quality: 88,
        method: "default"
      },
      class_type: "SaveAnimatedWEBP",
      _meta: { title: "Save compact WebP result" }
    }
  };
}

export function createRunpodInput(input: SanitizedAiInput) {
  return {
    input: {
      workflow: buildComfyWorkflow(),
      images: [{ name: "input.webp", image: input.dataUrl }]
    }
  };
}

export function normalizeRunpodStatus(value: unknown): RunpodStatus {
  const status = String(value || "").toUpperCase();
  if (status === "IN_QUEUE") return "queued";
  if (status === "IN_PROGRESS") return "processing";
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED" || status === "CANCELED" || status === "TIMED_OUT") return "canceled";
  return "failed";
}

export function extractRunpodImage(payload: unknown): string {
  const body = payload as {
    output?: {
      message?: unknown;
      images?: Array<{ data?: unknown; image?: unknown }>;
    };
  };
  const candidate = body.output?.images?.[0]?.data
    ?? body.output?.images?.[0]?.image
    ?? body.output?.message;
  if (typeof candidate !== "string") {
    throw new Error("RunPod completed the job without a supported image result.");
  }
  if (candidate.length > SERVER_AI_MAX_RESULT_CHARS) {
    throw new Error("The AI result exceeds the beta download limit. Try a smaller image.");
  }
  if (DATA_URL_PATTERN.test(candidate)) return candidate;

  if (candidate.length % 4 !== 0 || !RAW_BASE64_PATTERN.test(candidate)) {
    throw new Error("RunPod completed the job without a supported image result.");
  }
  const bytes = Buffer.from(candidate, "base64");
  const isWebp = bytes.length >= 12
    && bytes.toString("ascii", 0, 4) === "RIFF"
    && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!isWebp) {
    throw new Error("RunPod completed the job without a supported image result.");
  }
  return `data:image/webp;base64,${candidate}`;
}
