export const TUTORIAL_VERSION = 1;
export const CONSENT_VERSION = 1;
export const TUTORIAL_KEY = "byokey-lab:edo-1868:tutorial-version";
export const CONSENT_KEY = "byokey-lab:edo-1868:api-consent-version";
export const IMPORTANT_URL = "https://byokey-lab.com/important/";
export const REPORT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf14ucq_SU36hxEQSsw0W5eBJ1WVp7PYjCaaEHu9GKRWyWQVw/viewform?usp=publish-editor";
export const REPORT_REASONS = ["不快・攻撃的な内容", "差別的・ヘイトに関する内容", "性的に不適切な内容", "危険・暴力的な内容", "個人情報・プライバシーに関する問題", "歴史ゲームとして著しく不適切な内容", "その他"];
export const hasCurrentConsent = version => Number(version) === CONSENT_VERSION;
export function saveConsentedKey(storage, key, consent) {
  if (!consent) throw new Error("consent_required");
  if (!key.trim()) throw new Error("key_required");
  storage.setItem(CONSENT_KEY, String(CONSENT_VERSION));
  storage.setItem("byokey-lab:edo-1868:gemini-api-key", key.trim());
}
export function redactReportText(text, key = "") {
  let value = String(text || "");
  if (key.trim()) value = value.split(key.trim()).join("[認証情報を除去]");
  return value.replace(/AIza[\w-]{20,}/g, "[認証情報を除去]");
}
// Explicit allowlist: no transcript, ledger, browser storage or device metadata.
export function reportText({ output, reason, comment, model, occurredAt }, key) {
  if (!REPORT_REASONS.includes(reason)) throw new Error("reason_required");
  return redactReportText(`1868 -江戸焦土前夜- AI出力報告\n理由: ${reason}\nモデル: ${model || "不明"}\n発生日時: ${occurredAt || "記録なし"}\n機能version: edo-onboarding-1\n\n対象のAI出力:\n${output}\n\n任意コメント:\n${comment || ""}`, key);
}
export function geminiBlockCode(body) {
  const blocked = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "IMAGE_SAFETY", "IMAGE_PROHIBITED_CONTENT", "RECITATION"]);
  const prompt = body?.promptFeedback;
  if (prompt?.blockReason && prompt.blockReason !== "BLOCK_REASON_UNSPECIFIED") return blocked.has(prompt.blockReason) ? "safety_block" : "generation_block";
  if (prompt?.safetyRatings?.some(r => r.blocked) || body?.candidates?.some(c => blocked.has(c.finishReason) || c.safetyRatings?.some(r => r.blocked))) return "safety_block";
  return null;
}
