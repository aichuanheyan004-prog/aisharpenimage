import "@testing-library/jest-dom/vitest";

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = "srgb";

  constructor(data: Uint8ClampedArray, width: number, height?: number) {
    this.data = data;
    this.width = width;
    this.height = height ?? data.length / 4 / width;
  }
}

Object.defineProperty(globalThis, "ImageData", {
  value: TestImageData,
  writable: true
});
