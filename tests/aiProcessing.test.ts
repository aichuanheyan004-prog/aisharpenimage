import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelAiJob,
  dataUrlToBlob,
  getAiJob,
  startAiJob
} from "../src/aiProcessing";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AI browser API client", () => {
  it("starts a job without sending dimensions or workflow choices", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ id: "job_12345678", status: "queued" }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    const result = await startAiJob({
      dataUrl: "data:image/webp;base64,AAAA",
      width: 10,
      height: 10,
      bytes: 3
    }, "quality");

    expect(result.status).toBe("queued");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ image: "data:image/webp;base64,AAAA", mode: "quality" });
  });

  it("surfaces sanitized API errors and encodes job IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: "The RunPod AI worker is temporarily unavailable." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAiJob("job/id?unsafe")).rejects.toThrow(/temporarily unavailable/i);
    expect(fetchMock).toHaveBeenCalledWith("/api/ai?id=job%2Fid%3Funsafe", { signal: undefined });
  });

  it("sends cancellation as a best-effort keepalive request", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(cancelAiJob("job_12345678")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/ai?id=job_12345678", {
      method: "DELETE",
      keepalive: true
    });
  });
});

describe("AI result decoding", () => {
  it("decodes a supported image data URL", () => {
    const blob = dataUrlToBlob("data:image/webp;base64,AQID");
    expect(blob.type).toBe("image/webp");
    expect(blob.size).toBe(3);
  });

  it("rejects malformed or unsupported result data URLs", () => {
    expect(() => dataUrlToBlob("not-data")).toThrow(/invalid image/i);
    expect(() => dataUrlToBlob("data:image/gif;base64,AQID")).toThrow(/invalid image/i);
  });
});
