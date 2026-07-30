// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import handler from "../api/ai";

type ResponseState = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
};

function mockResponse() {
  const state: ResponseState = { statusCode: 200, body: undefined, headers: {} };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(value: unknown) {
      state.body = value;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
    }
  };
  return { response, state };
}

function request(method: string, origin = "https://www.aisharpenimage.net") {
  return { method, body: {}, query: {}, headers: { origin }, socket: { remoteAddress: "127.0.0.1" } };
}

afterEach(() => {
  delete process.env.RUNPOD_API_KEY;
  delete process.env.RUNPOD_ENDPOINT_ID;
  delete process.env.AI_ALLOWED_ORIGINS;
});

describe("AI API deployment guardrails", () => {
  it("returns a clear 503 while RunPod credentials are absent", async () => {
    const { response, state } = mockResponse();
    await handler(request("POST"), response);
    expect(state.statusCode).toBe(503);
    expect(state.body).toEqual({ error: "The limited AI beta is not configured yet. Use Local Sharpen for now." });
    expect(state.headers["Cache-Control"]).toBe("no-store");
  });

  it("rejects unsupported methods before checking provider configuration", async () => {
    const { response, state } = mockResponse();
    await handler(request("PUT"), response);
    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe("GET, POST, DELETE");
  });

  it("rejects requests from an unapproved browser origin", async () => {
    const { response, state } = mockResponse();
    await handler(request("POST", "https://example.com"), response);
    expect(state.statusCode).toBe(403);
  });
});
