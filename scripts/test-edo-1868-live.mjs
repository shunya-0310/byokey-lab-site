import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  INITIAL_STATE,
  determineGovernmentOutcome,
  evaluateMessage,
  evaluateSettlement,
  requestKatsuResponse,
} from "../src/games/edo1868.js";

const apiKey = process.env.GEMINI_API_KEY?.trim();
const model = process.env.EDO_1868_GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured. This live suite never reads browser storage; set the secret in the Codex process environment.");
}

const opening = {
  role: "katsu",
  text: "おう、西郷さん。山岡から手紙は受け取った。駿府から夜通しだったろう、まずは座りな。……道中、春の雨には難儀しなかったか。こうして顔を合わせるのは久しぶりだな。さて、明日は軍が動く。互いに抱えたものを、腹を割って話そうじゃないか。",
};

const report = { generatedAt: new Date().toISOString(), model, scenarios: [] };

async function playScenario(name, playerLines, assertions) {
  let state = { ...INITIAL_STATE };
  const messages = [opening];
  const usage = { input: 0, output: 0, cached: 0 };

  for (const text of playerLines) {
    const result = await requestKatsuResponse({ apiKey, model, messages: [...messages, { role: "saigo", text }], state });
    state = evaluateMessage(text, state, result.semantic, result.spokenResponse, result.events).state;
    messages.push({ role: "saigo", text }, { role: "katsu", text: result.spokenResponse });
    usage.input += result.usage.input;
    usage.output += result.usage.output;
    usage.cached += result.usage.cached;
  }

  const settlement = evaluateSettlement(state, messages);
  report.scenarios.push({
    name,
    settlementResult: settlement.settlementResult,
    blocking: settlement.blocking,
    issues: state.issues,
    governmentOutcome: determineGovernmentOutcome(state),
    usage,
    messages,
  });
  assertions({ state, settlement, messages, usage });
  console.log(`${name}: ${settlement.settlementResult}; blocking=${settlement.blocking.join(",") || "none"}; tokens=${usage.input}/${usage.output}/${usage.cached}`);
  return { state, settlement, messages, usage };
}

// A cooperative route based on the reported regression. The live model must
// preserve package confirmation (including Yoshinobu) in the canonical ledger.
const cooperative = await playScenario("cooperative-package", [
  "江戸を焼くために来たのではない。総攻撃は止め、江戸城は無血で明け渡してもらいたい。その間は双方の兵を統制し、市中の秩序は旧幕府と新政府で共同して守る。江戸の民の安全を第一に、略奪と放火は双方の軍令で禁じる。",
  "徳川宗家は駿府七十万石への移封を朝廷に上申し、家名は残す。慶喜公は水戸で謹慎とし、恭順を守る限り命を奪わない。私はこの方針を新政府軍の参謀として書面に署名し、大総督府へ直ちに上申する。",
  "旧幕臣には新政府の警察・外国警備・海軍で職を用意し、当面の扶持を支給する。配置と監督は勝さんと新政府の役人が共同で決め、生活を失わせない。",
  "武器は反乱を防ぐため段階的に回収する。ただし治安維持に必要な者には新政府の指揮と監督のもと必要な装備を持たせる。軍艦は勝さんの知見で秩序立てて新政府へ引き渡す手順を整えてほしい。",
  "ここまでの江戸城、徳川家、慶喜公、旧幕臣、武器、軍艦、江戸市民の安全、無血移行、市中秩序の条件を一つの書面にまとめよう。私は新政府軍の統制と朝廷への上申に責任を持つ。",
], ({ state, settlement }) => {
  assert.ok(["tentatively_agreed", "agreed"].includes(state.issues.yoshinobu), "Yoshinobu must be recorded when Katsu accepts the written package");
  assert.ok(["tentatively_agreed", "agreed"].includes(state.issues.edo_castle), "Castle must not disappear from the written package");
  assert.ok(!settlement.blocking.includes("yoshinobu"), "Settlement may not re-request Yoshinobu after his accepted written guarantee");
  assert.ok(!settlement.blocking.includes("edo_castle"), "Settlement may not re-request the already accepted castle");
  assert.equal(settlement.settlementResult, "ACCEPTED", "The fully specified cooperative route must reach Katsu's package acceptance");
  const repeatedSettlement = evaluateSettlement(settlement.state, []);
  assert.equal(repeatedSettlement.settlementResult, "ACCEPTED", "A repeated settlement check must not reopen a written agreement");
  assert.deepEqual(repeatedSettlement.blocking, [], "A repeated settlement check must not invent a missing issue");
});

assert.equal(determineGovernmentOutcome({ ...cooperative.state, governmentAcceptance: 80, promiseCredibility: 80 }) !== "empty_promises", true, "A credible agreement must reach a non-empty-promise ending route");
assert.equal(determineGovernmentOutcome({ ...cooperative.state, governmentAcceptance: 10, promiseCredibility: 10 }), "empty_promises", "A Katsu agreement and the government outcome remain separate phases");

await playScenario("credible-government-agreement", [
  "総攻撃は停止し、江戸城は無血で明け渡してもらいたい。ただし城門の開放は双方の将兵が暴発せぬよう、明朝に勝さんと私の連署した書面を示してから行う。市中では略奪と放火を双方の軍令で禁じ、江戸の民を守る。",
  "徳川宗家は家名を残し、慶喜公は水戸で謹慎とする。旧幕臣は新政府の警察・外国警備・海軍に登用し、当面の扶持を支給する。ただし反乱を防ぐため武器は段階的に新政府へ引き渡し、治安維持に必要な者だけを共同監督のもとで配置する。",
  "軍艦は勝さんの知見で一覧を作り、海軍に登用する旧臣とともに新政府へ移管する。私は大総督府の参謀としてこの全条項に署名し、今夜のうちに朝廷へ上申して新政府軍の統制を命じる。",
  "江戸城、徳川家、慶喜公、旧幕臣、武器、軍艦、市民の安全、無血移行、市中秩序を一枚の約定にする。この履行を私の名で引き受ける。",
], ({ state, settlement }) => {
  assert.equal(settlement.settlementResult, "ACCEPTED", "The credible route must gain Katsu's package acceptance");
  assert.notEqual(determineGovernmentOutcome(state), "empty_promises", "A concrete, authority-backed promise must reach a successful government outcome");
});

await playScenario("hardline-breakdown", [
  "城をすぐ渡せ。従わぬなら江戸を焼き払う。",
  "条件は認めぬ。武器も軍艦もすべて今すぐ渡せ。",
  "これ以上は話さぬ。抵抗するなら攻め滅ぼす。",
], ({ settlement }) => {
  assert.equal(settlement.settlementResult, "BREAKDOWN", "Repeated military threats must produce a breakdown route");
});

const reportDirectory = path.resolve("test-results");
await mkdir(reportDirectory, { recursive: true });
await writeFile(path.join(reportDirectory, "edo-1868-live-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("Edo 1868 live negotiation suite passed");
