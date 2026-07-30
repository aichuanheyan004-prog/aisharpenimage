// @vitest-environment node

import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  REAL_ESRGAN_MODEL,
  buildComfyWorkflow,
  createRunpodInput,
  extractRunpodImage,
  normalizeRunpodStatus,
  parseImageDataUrl,
  sanitizeAiInput,
  validateJobId
} from "../server/aiCore";

async function imageDataUrl(options: { format?: "png" | "jpeg"; width?: number; height?: number; alpha?: boolean } = {}) {
  const format = options.format ?? "png";
  const channels = options.alpha ? 4 : 3;
  const buffer = await sharp({
    create: {
      width: options.width ?? 16,
      height: options.height ?? 12,
      channels,
      background: options.alpha ? { r: 20, g: 40, b: 60, alpha: 0.5 } : { r: 20, g: 40, b: 60 }
    }
  })[format]().toBuffer();
  return `data:image/${format};base64,${buffer.toString("base64")}`;
}

describe("AI input validation", () => {
  it("rejects malformed and disguised data URLs", async () => {
    expect(() => parseImageDataUrl("not-an-image")).toThrow(/valid/i);
    const jpeg = await imageDataUrl({ format: "jpeg" });
    await expect(sanitizeAiInput(jpeg.replace("image/jpeg", "image/png"))).rejects.toThrow(/MIME/i);
  });

  it("strips metadata and normalizes a valid image to WebP", async () => {
    const result = await sanitizeAiInput(await imageDataUrl({ format: "jpeg" }));
    expect(result.dataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(result).toMatchObject({ width: 16, height: 12 });
  });

  it("rejects transparent and over-limit images", async () => {
    await expect(sanitizeAiInput(await imageDataUrl({ alpha: true }))).rejects.toThrow(/transparent/i);
    await expect(sanitizeAiInput(await imageDataUrl({ width: 1601, height: 1 }))).rejects.toThrow(/limit/i);
  });
});

describe("RunPod contract", () => {
  it("uses a fixed allowlisted ComfyUI workflow", () => {
    const workflow = buildComfyWorkflow();
    expect(workflow["2"].inputs.model_name).toBe(REAL_ESRGAN_MODEL);
    expect(workflow["5"].class_type).toBe("SaveAnimatedWEBP");
    const request = createRunpodInput({ dataUrl: "data:image/webp;base64,AAAA", width: 1, height: 1 });
    expect(request.input.images).toEqual([{ name: "input.webp", image: "data:image/webp;base64,AAAA" }]);
  });

  it("normalizes statuses and validates job IDs", () => {
    expect(normalizeRunpodStatus("IN_QUEUE")).toBe("queued");
    expect(normalizeRunpodStatus("IN_PROGRESS")).toBe("processing");
    expect(normalizeRunpodStatus("COMPLETED")).toBe("completed");
    expect(validateJobId("abc12345_job")).toBe("abc12345_job");
    expect(() => validateJobId("../bad")).toThrow(/job ID/i);
  });

  it("extracts supported results and rejects oversized or missing output", () => {
    const image = "data:image/webp;base64,AAAA";
    expect(extractRunpodImage({ output: { images: [{ data: image }] } })).toBe(image);
    expect(() => extractRunpodImage({ output: {} })).toThrow(/without/i);
  });
});

