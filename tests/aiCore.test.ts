// @vitest-environment node

import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  AI_BLEND_FACTOR,
  REAL_ESRGAN_MODEL,
  buildComfyWorkflow,
  createRunpodInput,
  extractRunpodImage,
  normalizeRunpodStatus,
  parseImageDataUrl,
  sanitizeAiInput,
  validateJobId
} from "../server/aiCore";

async function imageDataUrl(options: { format?: "png" | "jpeg"; width?: number; height?: number; alpha?: number } = {}) {
  const format = options.format ?? "png";
  const channels = options.alpha === undefined ? 3 : 4;
  const buffer = await sharp({
    create: {
      width: options.width ?? 16,
      height: options.height ?? 12,
      channels,
      background: options.alpha === undefined
        ? { r: 20, g: 40, b: 60 }
        : { r: 20, g: 40, b: 60, alpha: options.alpha }
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

  it("accepts an opaque image even when its encoding includes an alpha channel", async () => {
    const result = await sanitizeAiInput(await imageDataUrl({ alpha: 1 }));
    expect(result.dataUrl).toMatch(/^data:image\/webp;base64,/);
  });

  it("rejects transparent and over-limit images", async () => {
    await expect(sanitizeAiInput(await imageDataUrl({ alpha: 0.5 }))).rejects.toThrow(/transparent/i);
    await expect(sanitizeAiInput(await imageDataUrl({ width: 1601, height: 1 }))).rejects.toThrow(/limit/i);
  });
});

describe("RunPod contract", () => {
  it("uses a fixed allowlisted ComfyUI workflow", () => {
    const workflow = buildComfyWorkflow();
    expect(workflow["2"].inputs.model_name).toBe(REAL_ESRGAN_MODEL);
    expect(workflow["3"].inputs.image).toEqual(["1", 0]);
    expect(workflow["4"].inputs).toMatchObject({ image: ["1", 0], scale_by: 2 });
    expect(workflow["5"].inputs).toMatchObject({ blend_factor: AI_BLEND_FACTOR, blend_mode: "normal" });
    expect(workflow["6"].class_type).toBe("SaveAnimatedWEBP");
    expect(workflow["6"].inputs).toMatchObject({ images: ["5", 0], quality: 88 });
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

  it("extracts supported data URLs", () => {
    const image = "data:image/webp;base64,AAAA";
    expect(extractRunpodImage({ output: { images: [{ data: image }] } })).toBe(image);
  });

  it("normalizes RunPod's raw WebP base64 output", async () => {
    const webp = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 10, g: 20, b: 30 } }
    }).webp().toBuffer();
    const raw = webp.toString("base64");
    expect(extractRunpodImage({ output: { images: [{ data: raw }] } }))
      .toBe(`data:image/webp;base64,${raw}`);
  });

  it("rejects malformed, disguised, oversized, or missing output", () => {
    expect(() => extractRunpodImage({ output: { images: [{ data: "not-base64" }] } })).toThrow(/without/i);
    expect(() => extractRunpodImage({ output: { images: [{ data: Buffer.from("not a webp").toString("base64") }] } })).toThrow(/without/i);
    const oversized = `data:image/webp;base64,${"A".repeat(4_000_000)}`;
    expect(() => extractRunpodImage({ output: { images: [{ data: oversized }] } })).toThrow(/exceeds/i);
    expect(() => extractRunpodImage({ output: {} })).toThrow(/without/i);
  });
});
