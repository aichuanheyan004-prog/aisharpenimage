import { describe, expect, it, vi } from "vitest";
import {
  MAX_FILE_BYTES,
  outputName,
  sharpenImageData,
  validateDimensions,
  validateImageFile
} from "../src/imageProcessing";

function fileLike(name: string, type: string, size = 1024): File {
  return { name, type, size } as File;
}

describe("validateImageFile", () => {
  it("accepts JPEG, PNG, and WebP", () => {
    expect(validateImageFile(fileLike("photo.jpg", "image/jpeg")).ok).toBe(true);
    expect(validateImageFile(fileLike("graphic.png", "image/png")).ok).toBe(true);
    expect(validateImageFile(fileLike("render.webp", "image/webp")).ok).toBe(true);
  });

  it("rejects disguised or unsupported files", () => {
    expect(validateImageFile(fileLike("photo.jpg", "text/plain"))).toMatchObject({ ok: false, code: "type" });
    expect(validateImageFile(fileLike("photo.gif", "image/gif"))).toMatchObject({ ok: false, code: "name" });
    expect(validateImageFile(fileLike("no-extension", "image/png"))).toMatchObject({ ok: false, code: "name" });
  });

  it("rejects empty or oversize files", () => {
    expect(validateImageFile(fileLike("empty.png", "image/png", 0))).toMatchObject({ ok: false, code: "size" });
    expect(validateImageFile(fileLike("huge.png", "image/png", MAX_FILE_BYTES + 1))).toMatchObject({ ok: false, code: "size" });
  });
});

describe("validateDimensions", () => {
  it("allows ordinary dimensions and rejects image bombs", () => {
    expect(() => validateDimensions(1200, 800)).not.toThrow();
    expect(() => validateDimensions(7000, 800)).toThrow(/too large/i);
    expect(() => validateDimensions(5000, 5000)).toThrow(/too large/i);
    expect(() => validateDimensions(0, 500)).toThrow(/could not be decoded/i);
  });
});

describe("sharpenImageData", () => {
  it("preserves transparent alpha and modifies color channels", () => {
    const data = new Uint8ClampedArray([
      10, 10, 10, 0, 20, 20, 20, 128, 30, 30, 30, 255,
      40, 40, 40, 255, 120, 120, 120, 77, 60, 60, 60, 255,
      70, 70, 70, 255, 80, 80, 80, 255, 90, 90, 90, 255
    ]);
    const result = sharpenImageData(new ImageData(data, 3, 3), { strength: 1, denoise: 0 });
    expect(result.data[4 * 4 + 3]).toBe(77);
    expect(Array.from(result.data.slice(4 * 4, 4 * 4 + 3))).not.toEqual([120, 120, 120]);
  });

  it("returns unchanged pixels when settings are zero", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(120);
    const result = sharpenImageData(new ImageData(data, 4, 4), { strength: 0, denoise: 0 });
    expect(Array.from(result.data)).toEqual(Array.from(data));
  });
});

describe("outputName", () => {
  it("sanitizes long and special filenames", () => {
    expect(outputName("my weird/photo final!!.png", "image/webp")).toBe("my-weird-photo-final-sharpened.webp");
    expect(outputName("透明 图像.png", "image/png")).toBe("image-sharpened.png");
  });
});

describe("object URL lifecycle", () => {
  it("has browser APIs available to mock cleanup tests", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const url = URL.createObjectURL(new Blob(["x"]));
    URL.revokeObjectURL(url);
    expect(create).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:test");
    create.mockRestore();
    revoke.mockRestore();
  });
});
