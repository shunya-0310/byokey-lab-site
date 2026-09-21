import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.EDO_1868_REVIEW_MODEL?.trim();
if (!apiKey || !model) {
  throw new Error("OPENAI_API_KEY and EDO_1868_REVIEW_MODEL are required for the independent gameplay review.");
}

const reportPath = path.resolve("test-results", "edo-1868-live-report.json");
const report = JSON.parse(await readFile(reportPath, "utf8"));
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "critical_issues", "findings"],
  properties: {
    verdict: { type: "string", enum: ["pass", "needs_review", "fail"] },
    critical_issues: { type: "array", items: { type: "string" }, maxItems: 6 },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scenario", "severity", "finding"],
        properties: {
          scenario: { type: "string" },
          severity: { type: "string", enum: ["info", "warning", "critical"] },
          finding: { type: "string" },
        },
      },
      maxItems: 12,
    },
  },
};
const instructions = `You are an independent game design reviewer. Review only the supplied Edo 1868 live-test report. Do not invent missing turns. A critical issue exists if: (1) an issue Katsu explicitly accepted is later requested again without an explicit reversal, (2) the cooperative written-package route fails to reach Katsu settlement acceptance, (3) the hardline route does not break down, or (4) Katsu ignores the player's immediately preceding question or offer. Prefer a warning for merely stylistic concerns. Return Japanese JSON matching the schema.`;
const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model,
    store: false,
    instructions,
    input: JSON.stringify(report),
    text: { format: { type: "json_schema", name: "edo_1868_gameplay_review", strict: true, schema } },
    max_output_tokens: 900,
  }),
});
const body = await response.json();
if (!response.ok) throw new Error(body?.error?.message || "OpenAI gameplay review failed.");
const review = JSON.parse(body.output_text || "");
assert.ok(["pass", "needs_review", "fail"].includes(review.verdict), "Reviewer returned an invalid verdict");
console.log(JSON.stringify(review, null, 2));
if (review.verdict === "fail" || review.critical_issues.length > 0) {
  throw new Error("Independent gameplay review found critical issues.");
}
