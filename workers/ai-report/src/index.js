const ALLOWED_REASONS = new Set(["Inappropriate", "Harmful", "Incorrect", "Other"]);
const MAX_BODY_BYTES = 20_000;
const MAX_MESSAGE_LENGTH = 8_000;
const MAX_COMMENT_LENGTH = 1_000;
const MAX_PROVIDER_LENGTH = 120;
const REPORT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 10;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/v1/ai-reports") {
      return json({ error: "not_found" }, 404);
    }
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
    }
    if (!env.RATE_LIMIT_SALT) {
      console.error(JSON.stringify({ event: "missing_rate_limit_salt" }));
      return json({ error: "service_unavailable" }, 503);
    }

    try {
      const contentLength = Number(request.headers.get("content-length") || "0");
      if (contentLength > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);
      const bodyBytes = await request.arrayBuffer();
      if (bodyBytes.byteLength > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);
      const payload = JSON.parse(new TextDecoder().decode(bodyBytes));
      const report = validateReport(payload);
      const now = Date.now();
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ipHash = await sha256Hex(`${env.RATE_LIMIT_SALT}:${ip}`);
      const windowStart = Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS;
      const currentRate = await env.DB.prepare(
        "SELECT request_count FROM report_rate_limits WHERE ip_hash = ?1 AND window_start = ?2"
      ).bind(ipHash, windowStart).first();
      if ((currentRate?.request_count || 0) >= RATE_LIMIT) {
        return json({ error: "rate_limited" }, 429, { "Retry-After": "3600" });
      }

      const reportId = crypto.randomUUID();
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO report_rate_limits (ip_hash, window_start, request_count)
           VALUES (?1, ?2, 1)
           ON CONFLICT(ip_hash, window_start)
           DO UPDATE SET request_count = request_count + 1`
        ).bind(ipHash, windowStart),
        env.DB.prepare(
          `INSERT INTO ai_content_reports (
             id, created_at, expires_at, app_version, provider, model, reason,
             coach_message, preceding_user_message, comment
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        ).bind(
          reportId,
          now,
          now + REPORT_RETENTION_MS,
          report.appVersion,
          report.provider,
          report.model,
          report.reason,
          report.coachMessage,
          report.precedingUserMessage,
          report.comment
        )
      ]);
      console.log(JSON.stringify({ event: "ai_report_accepted", reportId }));
      return json({ id: reportId, status: "accepted" }, 202);
    } catch (error) {
      if (error instanceof ValidationError) {
        return json({ error: "invalid_request", detail: error.message }, 400);
      }
      console.error(JSON.stringify({
        event: "ai_report_error",
        message: error instanceof Error ? error.message : "unknown"
      }));
      return json({ error: "internal_error" }, 500);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      env.DB.batch([
        env.DB.prepare("DELETE FROM ai_content_reports WHERE expires_at <= ?1").bind(Date.now()),
        env.DB.prepare("DELETE FROM report_rate_limits WHERE window_start < ?1")
          .bind(Date.now() - 24 * 60 * 60 * 1000)
      ])
    );
  }
};

function validateReport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("JSON object is required.");
  }
  if (payload.schemaVersion !== 1) throw new ValidationError("Unsupported schemaVersion.");
  if (!ALLOWED_REASONS.has(payload.reason)) throw new ValidationError("Invalid reason.");
  return {
    appVersion: requiredString(payload.appVersion, "appVersion", 40),
    provider: requiredString(payload.provider, "provider", MAX_PROVIDER_LENGTH),
    model: requiredString(payload.model, "model", MAX_PROVIDER_LENGTH),
    reason: payload.reason,
    coachMessage: requiredString(payload.coachMessage, "coachMessage", MAX_MESSAGE_LENGTH),
    precedingUserMessage: optionalString(
      payload.precedingUserMessage,
      "precedingUserMessage",
      MAX_MESSAGE_LENGTH
    ),
    comment: optionalString(payload.comment, "comment", MAX_COMMENT_LENGTH) || ""
  };
}

function requiredString(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required.`);
  }
  if (value.length > maxLength) throw new ValidationError(`${field} is too long.`);
  return value.trim();
}

function optionalString(value, field, maxLength) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string.`);
  if (value.length > maxLength) throw new ValidationError(`${field} is too long.`);
  return value.trim() || null;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

class ValidationError extends Error {}
