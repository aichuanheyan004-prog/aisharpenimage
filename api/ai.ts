import { createHash } from "node:crypto";
import {
  createRunpodInput,
  extractRunpodImage,
  normalizeRunpodStatus,
  parseAiQualityMode,
  sanitizeAiInput,
  validateJobId
} from "../server/aiCore.js";

type ApiRequest = {
  method?: string;
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

type ApiResponse = {
  status(code: number): ApiResponse;
  json(value: unknown): void;
  setHeader(name: string, value: string): void;
};

type RateEntry = { date: string; count: number };

const dailyRateLimit = new Map<string, RateEntry>();
const DAILY_REQUESTS_PER_RUNTIME = 2;
const outstandingJobs = new Map<string, number>();
const MAX_OUTSTANDING_JOBS_PER_RUNTIME = 2;
const OUTSTANDING_JOB_TTL_MS = 10 * 60 * 1_000;

function pruneOutstandingJobs(now = Date.now()) {
  for (const [id, startedAt] of outstandingJobs) {
    if (now - startedAt > OUTSTANDING_JOB_TTL_MS) outstandingJobs.delete(id);
  }
}

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

function runpodUrl(path: string): string {
  return `https://api.runpod.ai/v2/${encodeURIComponent(env("RUNPOD_ENDPOINT_ID"))}${path}`;
}

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function clientRateKey(request: ApiRequest): string {
  const forwarded = firstHeader(request.headers["x-forwarded-for"]).split(",")[0]?.trim();
  const address = forwarded || request.socket?.remoteAddress || "unknown";
  const date = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${env("AI_RATE_LIMIT_SALT")}:${date}:${address}`).digest("hex");
}

function checkRateLimit(request: ApiRequest): boolean {
  const key = clientRateKey(request);
  const date = new Date().toISOString().slice(0, 10);
  const current = dailyRateLimit.get(key);
  if (!current || current.date !== date) {
    dailyRateLimit.set(key, { date, count: 1 });
    return true;
  }
  if (current.count >= DAILY_REQUESTS_PER_RUNTIME) return false;
  current.count += 1;
  return true;
}

function originAllowed(request: ApiRequest): boolean {
  const origin = firstHeader(request.headers.origin);
  if (!origin) return true;
  const configured = env("AI_ALLOWED_ORIGINS")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = configured.length > 0
    ? configured
    : [
        "https://www.aisharpenimage.net",
        "https://aisharpenimage.vercel.app",
        "http://127.0.0.1:5176",
        "http://localhost:5176"
      ];
  return allowed.includes(origin);
}

async function runpodRequest(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(runpodUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${env("RUNPOD_API_KEY")}`,
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`RunPod service request failed (${response.status}).`);
  }
  return body;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (!originAllowed(request)) {
    response.status(403).json({ error: "This request origin is not allowed." });
    return;
  }
  if (!request.method || !["GET", "POST", "DELETE"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST, DELETE");
    response.status(405).json({ error: "Method not allowed." });
    return;
  }
  if (!env("RUNPOD_API_KEY") || !env("RUNPOD_ENDPOINT_ID")) {
    response.status(503).json({ error: "AI enhancement is temporarily unavailable. Use Local Sharpen for now." });
    return;
  }

  try {
    if (request.method === "POST") {
      const body = request.body as { image?: unknown; mode?: unknown } | undefined;
      const input = await sanitizeAiInput(body?.image);
      const mode = parseAiQualityMode(body?.mode);
      pruneOutstandingJobs();
      if (outstandingJobs.size >= MAX_OUTSTANDING_JOBS_PER_RUNTIME) {
        response.setHeader("Retry-After", "30");
        response.status(503).json({ error: "AI enhancement is busy. Try Local Sharpen or return later." });
        return;
      }
      if (!checkRateLimit(request)) {
        response.setHeader("Retry-After", "86400");
        response.status(429).json({ error: "This network has reached today's complimentary AI allowance." });
        return;
      }
      const result = await runpodRequest("/run", {
        method: "POST",
        body: JSON.stringify(createRunpodInput(input, mode))
      }) as { id?: unknown; status?: unknown };
      const id = validateJobId(result.id);
      outstandingJobs.set(id, Date.now());
      response.status(202).json({ id, status: normalizeRunpodStatus(result.status) });
      return;
    }

    const rawId = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    const id = validateJobId(rawId);

    if (request.method === "GET") {
      const result = await runpodRequest(`/status/${encodeURIComponent(id)}`) as { status?: unknown; error?: unknown };
      const status = normalizeRunpodStatus(result.status);
      if (status === "completed") {
        outstandingJobs.delete(id);
        response.status(200).json({ id, status, resultDataUrl: extractRunpodImage(result) });
        return;
      }
      if (status === "failed" || status === "canceled") outstandingJobs.delete(id);
      const error = status === "failed" ? String(result.error || "The AI job failed.") : undefined;
      response.status(200).json({ id, status, error });
      return;
    }

    if (request.method === "DELETE") {
      try {
        await runpodRequest(`/cancel/${encodeURIComponent(id)}`, { method: "POST" });
      } finally {
        outstandingJobs.delete(id);
      }
      response.status(200).json({ id, status: "canceled" });
      return;
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI service could not complete the request.";
    const clientError = /required|valid|match|limit|large|transparent|animated|job ID|input buffer|corrupt|unsupported/i.test(message);
    response.status(clientError ? 400 : 502).json({
      error: clientError ? message : "The cloud AI worker is temporarily unavailable. No automatic retry was made."
    });
  }
}
