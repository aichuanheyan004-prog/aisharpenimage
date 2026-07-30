export const MAX_FILE_BYTES = 12 * 1024 * 1024;
export const MAX_PIXELS = 18_000_000;
export const MAX_EDGE = 6_000;

export const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

export type SharpenSettings = {
  strength: number;
  radius: number;
  denoise: number;
  outputFormat: OutputFormat;
  quality: number;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; code: "type" | "size" | "name" };

export type ProcessResult = {
  blob: Blob;
  width: number;
  height: number;
  changedPixels: number;
};

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

export function validateImageFile(file: Pick<File, "name" | "size" | "type">): ValidationResult {
  const safeName = file.name || "image";
  const extension = safeName.includes(".") ? safeName.split(".").pop()?.toLowerCase() : "";

  if (!extension || !ACCEPTED_EXTENSIONS.has(extension)) {
    return { ok: false, code: "name", reason: "Use a JPEG, PNG, or WebP file." };
  }

  if (!ACCEPTED_TYPES.has(file.type)) {
    return { ok: false, code: "type", reason: "The file MIME type is not supported." };
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return { ok: false, code: "size", reason: "Choose an image up to 12 MB." };
  }

  return { ok: true };
}

export function validateDimensions(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("The image could not be decoded.");
  }
  if (width * height > MAX_PIXELS || width > MAX_EDGE || height > MAX_EDGE) {
    throw new Error("This image is too large for browser-local processing.");
  }
}

export function sharpenImageData(input: ImageData, settings: Pick<SharpenSettings, "strength" | "denoise">): ImageData {
  const { width, height, data } = input;
  const output = new Uint8ClampedArray(data);
  const strength = Math.max(0, Math.min(2.5, settings.strength));
  const denoise = Math.max(0, Math.min(1, settings.denoise));

  if (strength === 0 && denoise === 0) {
    return new ImageData(output, width, height);
  }

  const source = new Uint8ClampedArray(data);
  let changedPixels = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = source[index + channel];
        const left = source[index - 4 + channel];
        const right = source[index + 4 + channel];
        const top = source[index - width * 4 + channel];
        const bottom = source[index + width * 4 + channel];
        const blur = (left + right + top + bottom) / 4;
        const denoised = denoise > 0 ? center * (1 - denoise * 0.18) + blur * (denoise * 0.18) : center;
        const sharpened = denoised + (denoised - blur) * strength;
        const next = clampByte(sharpened);
        if (next !== output[index + channel]) changedPixels += 1;
        output[index + channel] = next;
      }
      output[index + 3] = source[index + 3];
    }
  }

  const result = new ImageData(output, width, height);
  Object.defineProperty(result, "changedPixels", { value: changedPixels, enumerable: false });
  return result;
}

export async function decodeBitmap(file: File): Promise<ImageBitmap> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image", premultiplyAlpha: "none" });
  validateDimensions(bitmap.width, bitmap.height);
  return bitmap;
}

export async function processBitmap(bitmap: ImageBitmap, settings: SharpenSettings): Promise<ProcessResult> {
  validateDimensions(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const processed = sharpenImageData(imageData, settings);
  ctx.putImageData(processed, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => {
        if (!next) reject(new Error("The browser could not encode the output image."));
        else resolve(next);
      },
      settings.outputFormat,
      settings.outputFormat === "image/png" ? undefined : settings.quality
    );
  });

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    changedPixels: Number((processed as ImageData & { changedPixels?: number }).changedPixels ?? 0)
  };
}

export function outputExtension(format: OutputFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

export function outputName(inputName: string, format: OutputFormat): string {
  const base = (inputName || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
  return `${base}-sharpened.${outputExtension(format)}`;
}

