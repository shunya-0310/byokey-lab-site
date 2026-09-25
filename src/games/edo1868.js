import { clauseIssueIds, updateSchema, compileUpdates, materializeClauseEvidence, clauseSchema, CLAUSE_INSTRUCTION, validClauses, attachClauses, activeClauses, reviewGovernment } from './edo1868-clauses.js';
/**
 * Browser-side BYOK dialogue and canonical negotiation engine.
 * Gemini extracts current-turn events; deterministic reducers own agreements.
 */
export const GAME_DATE = "慶応四年　三月十四日（1868年4月6日）";

export const HISTORICAL_SOURCES = [
  {
    title: "国立国会図書館｜勝海舟：慶応4年3月13日の日記より",
    url: "https://www.ndl.go.jp/nikki/citeid/katsu_18680313",
    note: "3月13日の高輪・薩摩藩邸での会談を示す一次資料紹介。",
  },
  {
    title: "国立国会図書館｜あの人の直筆：旧幕臣と福沢諭吉",
    url: "https://www.ndl.go.jp/jikihitsu/part2/s1_3",
    note: "山岡鉄舟が会談実現に関与した経緯と、勝の経歴の解説。",
  },
  {
    title: "静岡県立中央図書館｜西郷・山岡会見記念碑",
    url: "https://www.tosyokan.pref.shizuoka.jp/contents/history/sisekiannai/siseki_3.html",
    note: "3月9日の山岡・西郷会談と、慶喜助命・開城交渉の前提。",
  },
  {
    title: "東京都立図書館｜『江戸無血開城』の巻",
    url: "https://www.library.metro.tokyo.lg.jp/readings/closeup_tokyo/20180405/",
    note: "3月から4月にかけた平和的な江戸城明渡しの概説。",
  },
];

export const characterBible = {
  identity: "勝海舟。1823年に江戸本所に生まれた幕臣。慶応4年3月時点では旧幕府側の交渉代表として江戸の処置を担う。",
  biography: [
    "長崎海軍伝習所で航海術を学び、咸臨丸で太平洋を渡った経験から、内戦が外国の介入を招く危険を現実の問題として捉える。",
    "幕府海軍の育成に携わり、幕府の名誉だけでなく、江戸に暮らす人々と旧幕臣の行く末を自分の責任として考える。",
  ],
  relationships: [
    "徳川慶喜と徳川家への責任は重いが、無条件の徹底抗戦を目的にはしない。",
    "山岡鉄舟は会談の前提を整えた使者。西郷とは利害が対立しても、私闘ではなく国の処置を話す相手として向き合う。",
    "坂本龍馬はすでに亡くなっている。彼に関する逸話や評価には後世の脚色があり得るため、ゲームの確定条件には使わない。",
  ],
  values: "徳川家と旧幕臣の処遇、秩序ある権力移行、戦闘の拡大と外国勢力の介入回避。脅しや空約束には屈しない。",
  temporalBoundary: "慶応4年3月14日までに合理的に知り得る情報だけを扱う。明治以後の出来事・後世の評価を知っているようには話さない。",
  negotiationBehavior: "西郷の譲歩を無条件には歓迎せず、権限と履行可能性を問う。曖昧な同意には具体化を求め、得た譲歩を前提に追加要求をすることがある。西郷の価値観・矛盾を観察し、交換条件と現実的な第三案には応じるが、自分のRed Lineを容易には明かさない。抵抗の手段についても、問い詰められるか強硬姿勢を向けられるまでは段階的にしか示さない。勝は進行役ではなく、自らも交渉に勝とうとする当事者である。",
};

export const NEGOTIATION_ISSUES = Object.freeze({
  edo_castle: { title: "江戸城", katsu: "城を明け渡す条件と、その後の秩序", government: "確実な引渡し" },
  tokugawa_house: { title: "徳川家", katsu: "家名と最低限の存続", government: "旧体制の復活を許さない処置" },
  yoshinobu: { title: "徳川慶喜", katsu: "生命と処遇", government: "政治・軍事上の脅威を除くこと" },
  weapons: { title: "武器", katsu: "旧臣の安全を損なわない処置", government: "武装解除" },
  warships: { title: "軍艦", katsu: "海軍関係者の将来", government: "軍事的脅威の除去" },
  retainers: { title: "旧幕臣", katsu: "生活と再出発の道", government: "無制限の特権温存は不可" },
  civilian_safety: { title: "江戸市民の安全", katsu: "市民を戦火に巻き込まないこと", government: "総攻撃による被害の回避" },
  peaceful_transition: { title: "無血移行", katsu: "戦わずに城と兵を収める手順", government: "確実で秩序ある移行" },
  public_order: { title: "市中秩序", katsu: "市中の安全と治安", government: "長期戦と外国介入の回避" },
});

const initialIssues = () => Object.fromEntries(Object.keys(NEGOTIATION_ISSUES).map((id) => [id, "unresolved"]));
const initialLedger = () => Object.fromEntries(Object.entries(NEGOTIATION_ISSUES).map(([id, issue]) => [id, { status: "unresolved", events: [{ actor: "system", action: "open", summary: `${issue.title}は未解決。` }] }]));

export const INITIAL_STATE = Object.freeze({
  katsuAcceptance: 42,
  governmentAcceptance: 58,
  promiseCredibility: 42,
  militaryTension: 48,
  resistance: 50,
  battleRisk: 30,
  turns: 0,
  issues: initialIssues(),
  negotiationLedger: initialLedger(),
  knownIssues: [],
  commitments: [],
  recentMessages: [],
  settlementAttempts: 0,
  settlementPatience: 100,
  lastSettlementTurn: -1,
  katsuSettlement: "not_requested",
  lastKatsuOfferIssues: [],
});

export const EXPRESSION_ASSETS = {
  neutral: "/images/edo-1868/katsu-neutral-sheet.png",
  smile: "/images/edo-1868/katsu-smile-sheet.png",
  serious: "/images/edo-1868/katsu-serious-sheet.png",
  thinking: "/images/edo-1868/katsu-thinking-sheet.png",
  surprised: "/images/edo-1868/katsu-surprised-sheet.png",
  wry_smile: "/images/edo-1868/katsu-wry-smile-sheet.png",
  irritated: "/images/edo-1868/katsu-irritated-sheet.png",
  explaining: "/images/edo-1868/katsu-explaining-sheet.png",
  downcast: "/images/edo-1868/katsu-downcast-sheet.png",
  looking_away: "/images/edo-1868/katsu-looking-away-sheet.png",
};

// Gemini Developer API standard text pricing. Keep prices data-only so updates do
// not affect the usage calculation or UI. Verified against Google's pricing page
// on 2026-09-20; model pricing can change.
export const MODEL_PRICING = Object.freeze({
  "gemini-3.1-flash-lite": Object.freeze({
    provider: "Gemini",
    inputPricePerMillionTokens: 0.25,
    cachedInputPricePerMillionTokens: 0.025,
    outputPricePerMillionTokens: 1.5,
    currency: "USD",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    updatedAt: "2026-09-20",
  }),
});

export const JPY_PER_USD_REFERENCE = 150;

export function estimateApiCost(usage, model) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return null;
  const input = Math.max(0, Number(usage?.input) || 0);
  const cached = Math.min(input, Math.max(0, Number(usage?.cached) || 0));
  const output = Math.max(0, Number(usage?.output) || 0);
  const usd = ((input - cached) * pricing.inputPricePerMillionTokens
    + cached * pricing.cachedInputPricePerMillionTokens
    + output * pricing.outputPricePerMillionTokens) / 1_000_000;
  return { usd, jpy: usd * JPY_PER_USD_REFERENCE, pricing };
}

export const GEMINI_MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
];

export const INITIAL_DISCOVERIES = Object.freeze([
  { id: "new-government-mandate", title: "新政府側の使命", text: "江戸城を引き渡させ、旧幕府勢力が再び大規模な軍事行動を取れない条件を、新政府側へ持ち帰れる形で整える必要がある。" },
  { id: "yamaoka-meeting", title: "山岡鉄舟との事前交渉", text: "山岡鉄舟は勝の支持を受け、勝の手紙を携えて駿府の西郷のもとへ赴いた。三月九日の会談では、慶喜助命をめぐる条件が示されたと伝わる。このやり取りが、今夜の薩摩藩邸での会談の前提になっている。" },
]);

const allowedExpressions = new Set(Object.keys(EXPRESSION_ASSETS));

const stringField = { type: "string" };
const issueArray = { type: "array", items: { type: "string", enum: Object.keys(NEGOTIATION_ISSUES) } };
const scoreField = { type: "number" };
const dialogueSchema = {
  type: "object", required: ["spoken_response", "expression", "events", "discovered_information", "settlement_validity"],
  properties: {
    spoken_response: stringField,
    expression: { type: "string", enum: [...allowedExpressions] },
    events: { type: "array", items: { type: "object", required: ["type", "actor", "issue_ids", "target_proposal_id", "response", "commitment", "terms", "summary", "depends_on_issue_ids", "clauses", "reference_proposal_ids", "changed_clause_ids"], properties: {
      type: { type: "string", enum: ["proposal_created", "proposal_response", "proposal_modified", "proposal_withdrawn", "reservation", "agreement_confirmed"] },
      actor: { type: "string", enum: ["saigo", "katsu"] }, issue_ids: issueArray, target_proposal_id: stringField,
      response: { type: "string", enum: ["accept", "reject", "reserve", ""] }, commitment: { type: "string", enum: ["firm", "conditional"] }, terms: stringField, summary: stringField, depends_on_issue_ids: issueArray,
      clauses: { type: "array", items: clauseSchema }, reference_proposal_ids: { type: "array", items: stringField }, changed_clause_ids: { type: "array", items: stringField },
    } } },
    discovered_information: { type: "array", items: { type: "object", required: ["id", "title", "text"], properties: { id: stringField, title: stringField, text: stringField } } },
    semantic_evaluation: { type: "object", properties: { specificity: stringField, credibility: stringField, threat: { type: "boolean" }, contradiction: { type: "boolean" }, vague_agreement: { type: "boolean" } } },
    settlement_validity: { type: "object", required: ["government_acceptance", "promise_credibility", "internal_consistency", "approval_mode"], properties: { government_acceptance: scoreField, promise_credibility: scoreField, internal_consistency: scoreField, approval_mode: { type: "string", enum: ["pending_approval", "personal_guarantee", "unspecified"] } } },
  },
};

function parseGeminiJson(raw) {
  try { return JSON.parse(raw); } catch { /* Gemini may wrap a JSON response in a markdown fence. */ }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  if (fenced) {
    try { return JSON.parse(fenced); } catch { /* Continue to the object extraction fallback. */ }
  }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(raw.slice(first, last + 1)); } catch { /* A truncated response remains invalid. */ }
  }
  return null;
}

async function generateGeminiJson({ apiKey, model, systemInstruction, contents, maxOutputTokens, temperature, validator, schema = dialogueSchema }) {
  const usage = { input: 0, output: 0, cached: 0 };
  let lastParseError = "";
  for (let attempt = 0; attempt < 1; attempt += 1) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${systemInstruction}${attempt ? "\nJSONの形式を厳守し、指定された必須フィールドを必ず返すこと。" : ""}` }] },
        contents,
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature, maxOutputTokens, ...(model === "gemini-3.1-flash-lite" ? {thinkingConfig:{thinkingLevel:"high"}} : {}) },
      }),
    });
    const body = await response.json();
    usage.input += body?.usageMetadata?.promptTokenCount || 0;
    usage.output += (body?.usageMetadata?.candidatesTokenCount || 0) + (body?.usageMetadata?.thoughtsTokenCount || 0);
    usage.cached += body?.usageMetadata?.cachedContentTokenCount || 0;
    if (!response.ok) throw new Error(body?.error?.message || "Gemini APIへの接続に失敗しました。");
    const raw = body?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    try {
      const parsed = parseGeminiJson(raw);
      if (!parsed) throw new Error("invalid JSON");
      if (validator(parsed)) return { parsed, usage };
      lastParseError = "JSONの必須フィールドが不足しています。";
    } catch {
      lastParseError = "JSONとして読み取れませんでした。";
    }
  }
  throw new Error(`Geminiから読み取れるJSON応答を受け取れませんでした。${lastParseError}`);
}

export async function requestKatsuResponse({ apiKey, model, messages, state }) {
  if (!canContinueNegotiation(state)) throw new Error("この交渉はすでに確定しています。");
  const issueSummary = Object.entries(state.issues).map(([id, status]) => `${id}:${status}`).join(", ");
  const issueCatalog = Object.entries(NEGOTIATION_ISSUES).map(([id, issue]) => `${id}: ${issue.title}（${issue.katsu}）`).join("\n");
  const negotiationContext = canonicalPrompt(state);
  const responseInstruction = `あなたは慶応4年3月14日の勝海舟。西郷と江戸の明渡しを交渉する。徳川家・慶喜・旧臣の安全と市民保護を重視する。最後の西郷の発言に直接答え、留保と受諾を明確に区別する。史実の結末を強制しない。西郷の個人保証も勝に有利なら会談上の約束として受け入れてよい。新政府が引き受けるかは後の独立審査。条件が具体的になったら際限なく追加要求しない。通常会話での合意は可能だが、最終的な交渉終了はプレイヤーの決着ボタンでのみ行う。応答は日本語、概ね100〜350字。全体の合意確認を求められたとき、まだ話していない自分の要求（徳川家・慶喜・旧臣、城、武器、軍艦、市民の安全と治安引継ぎ）があれば、その一点を普通の言葉で提示する。一部合意の段階で「全て整った」「追加要求はない」と誤案内しない。既に合意した論点を再要求せず、政府審査の厳しさを勝の受諾条件に混同しない。
内部台帳（プレイヤーにID、値、隠し判定を開示しない）:
${negotiationContext}
論点: ${issueCatalog}
まず台帳イベントを確定し、それと矛盾しない勝の発言を作る。eventsの受諾は双方が実際に述べる約束だけ。台帳の更新の規則:
- eventsに今回の約束の変化を記す。agreement_statusで双方が会談上の条件に同意したmutual、片側だけの提案saigo_offer/katsu_offer、留保reservation、撤回withdrawnを明確に分ける。
- 前に留保した条件の懸念が今回の説明で満たされ、その条件を受け入れるなら、今回の新しい説明だけでなく保留中の元のtargetにもmutual確認を必ず記録する。城や武装解除への留保が旧臣支援で解消する場合も同じ。
- 西郷の今回の案に勝が「受け入れる」「異存ない」と述べる場合はmutualにする。katsu_offerやsaigo_offerではない。勝の対案に西郷が明確に同意した場合もmutual。
- target:newでは具体条項を全てclausesに入れる。城・人の処遇・軍艦・財政・権限等を別条項に分ける。新しい条件を古いtargetへの空clausesの確認で済ませない。
- 既存条件の単なる再確認・書面化はtarget:実在提案ID、clauses:[]、changed_clause_ids:[]、agreement_status:mutual。複数案の包括確認ならそれぞれのtargetに一件ずつ出す。既存の詳細を要約で置換しない。
- 既存条件の本当の変更はtarget:実在ID、changed_clause_ids:変更する条項ID、clauses:変更後の詳細。追加だけならtarget:new。変更していない内容を消さない。
- 全体に曖昧な留保を加えて既存合意を取り消さない。会談の受諾と新政府の承認は独立。政府への上申はそれ自体で未合意に戻さない。
- 治安引継ぎと市民保護はpublic_order/civilian_safety/peaceful_transitionを実際に扱う範囲でissue_idsへ。受諾した条項は全て記録する。
JSONスキーマに従う。semantic_evaluationは今回の発言、discovered_informationは勝の応答で得た知識。settlement_validityは旧UI互換の概況値に過ぎず、政府の承認は行わない。`;
  const contents = messages.slice(-12).map((message) => ({
    role: message.role === "katsu" ? "model" : "user",
    parts: [{ text: message.role === "government" ? `新政府からの正式な修正要求: ${message.text}` : message.text }],
  }));
  const schema = structuredClone(dialogueSchema);
  const {spoken_response,expression,events,...rest}=schema.properties;
  schema.properties={events,spoken_response,expression,...rest};
  schema.properties.spoken_response.description='先に記録したeventsと一致する勝の発言。受諾・留保・提案を区別する。未交渉の要求が残るなら全体の合意を宣言せず、次に協議したい一つを伝える。';
  const proposals = ensureCanonicalLedger(state).proposals.filter(p=>['open','accepted'].includes(p.status)&&effectiveProposal(p).issueIds.length);
  schema.properties.events.items = updateSchema(proposals);
  const dialogue = await generateGeminiJson({ apiKey, model, schema, systemInstruction: responseInstruction + CLAUSE_INSTRUCTION + `\n最後に厳守: spoken_responseでは「全て整った」「全懸案が解消した」「他の要求はない」のような全体の完了宣言をしない。今話した具体的な条件への同意だけを述べる。現在の未合意の議題: ${Object.entries(state.issues).filter(([,v])=>["unresolved","proposed","conflicted"].includes(v)).map(([id])=>NEGOTIATION_ISSUES[id].title).join("、")}。今の問いに答え終えたら、この中でまだ約束を交わしていない一つを次の問いとして自然に取り上げてよい。合意済みの話は蒸し返さない。`, contents, maxOutputTokens: 16000, temperature: model.startsWith("gemini-3") ? 1 : 0.35, validator: (value) => typeof value?.spoken_response === "string" && value.spoken_response.trim().length > 0 && Array.isArray(value?.events) && normalizeEvents(compileUpdates(value.events)).length === value.events.length && validSettlementValidity(value.settlement_validity) });
  const parsed = dialogue.parsed;
  parsed.events = materializeClauseEvidence(compileUpdates(parsed.events), messages.filter(m=>m.role === "saigo").at(-1)?.text || "", parsed.spoken_response);
  const validation = reduceNegotiationEvents({ ...state, turns: state.turns + 1 }, parsed.events, { playerText: messages.filter((message) => message.role === "saigo").at(-1)?.text || "", katsuText: parsed.spoken_response });
  if (validation.validationError) { const error = new Error(`${validation.validationError}記録は変更していません。もう一度送信してください。`); error.validationCode=validation.validationCode; throw error; }
  const notes = Array.isArray(parsed.discovered_information) ? parsed.discovered_information
    .filter((item) => item && typeof item.title === "string" && typeof item.text === "string")
    .slice(0, 3).map((item, index) => ({ id: String(item.id || `gemini-note-${index}`).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48) || `gemini-note-${index}`, title: item.title.slice(0, 60), text: item.text.slice(0, 220) })) : [];
  return {
    spokenResponse: parsed.spoken_response,
    expression: allowedExpressions.has(parsed.expression) ? parsed.expression : "neutral",
    discoveries: notes,
    // One model response contains both dialogue and the current-turn evidence.
    // The deterministic reducer, not a second model call, owns state changes.
    events: normalizeEvents(parsed.events),
    semantic: {
      settlementValidity: parsed.settlement_validity,
      specificity: ["low", "medium", "high"].includes(parsed?.semantic_evaluation?.specificity) ? parsed.semantic_evaluation.specificity : "medium",
      credibility: ["low", "medium", "high"].includes(parsed?.semantic_evaluation?.credibility) ? parsed.semantic_evaluation.credibility : "medium",
      threat: parsed?.semantic_evaluation?.threat === true,
      contradiction: parsed?.semantic_evaluation?.contradiction === true,
      vagueAgreement: parsed?.semantic_evaluation?.vague_agreement === true,
      issues: Array.isArray(parsed?.player_move?.issues) ? parsed.player_move.issues.filter((id) => Object.hasOwn(NEGOTIATION_ISSUES, id)).slice(0, 4) : [],
    },
    usage: {
      input: dialogue.usage.input,
      output: dialogue.usage.output,
      cached: dialogue.usage.cached,
    },
  };
}

const clamp = (value) => Math.max(0, Math.min(100, value));
const has = (text, words) => words.some((word) => text.includes(word));
const ISSUE_WORDS = {
  edo_castle: ["江戸城", "城", "開城"], tokugawa_house: ["徳川家", "徳川", "家名", "御家"], yoshinobu: ["慶喜", "将軍"],
  weapons: ["武器", "武装", "銃", "兵器", "将兵", "軍備"], warships: ["軍艦", "艦", "海軍"], retainers: ["幕臣", "家臣", "旗本", "旧臣", "生活", "路頭", "召し抱え"],
  civilian_safety: ["市民", "町人", "江戸の民", "戦火", "総攻撃", "民も", "民の動揺", "江戸の平穏"],
  peaceful_transition: ["無血", "総攻撃停止", "進軍を止", "城門", "明朝", "移行", "手順", "覚書", "書面"],
  public_order: ["市中", "秩序", "治安", "統制", "暴発", "外国", "列強", "平穏"],
};
const CONCRETE_WORDS = ["書面", "約定", "期限", "引き渡", "明け渡", "武装解除", "処遇", "生活", "扶持", "領地", "家名", "助命", "監視", "謹慎", "上申", "大総督府", "朝廷", "条件"];
const SECURITY_WORDS = ["引き渡", "明け渡", "武装解除", "軍艦を", "武器を", "服従", "謹慎", "退去"];
const PROTECTION_WORDS = ["存続", "家名", "助命", "生活", "処遇", "再就職", "扶持", "保護"];
const RESISTANCE_QUESTIONS = ["備え", "抗戦", "戦にな", "何をする", "覚悟", "抵抗", "入城"];

const discoveredIssue = (id) => ({ id: `issue-${id}`, title: NEGOTIATION_ISSUES[id].title, text: `${NEGOTIATION_ISSUES[id].katsu}を、勝は交渉の論点として見ている。` });
const statusLabel = (status) => ({ agreed: "合意", tentatively_agreed: "条件付き合意", proposed: "提案済み", conflicted: "対立", unresolved: "未解決" }[status] || "未解決");

function issueIdsFor(text, semantic) {
  const found = Object.entries(ISSUE_WORDS).filter(([, words]) => has(text, words)).map(([id]) => id);
  return [...new Set([...found, ...(semantic?.issues || [])])].slice(0, 7);
}

// The event log is the source of truth. Issue states and the UI-compatible
// negotiationLedger are derived from it; no LLM response can assign a state.
const EMPTY_CANONICAL_LEDGER = () => ({ version: 1, proposals: [], events: [], nextProposalNumber: 1, focus: { pendingProposalIds: [], primaryPendingProposalId: "", awaitingActor: "" } });
const validIssueIds = (ids) => [...new Set((Array.isArray(ids) ? ids : []).filter((id) => Object.hasOwn(NEGOTIATION_ISSUES, id)))].slice(0, 9);
const validActor = (actor) => actor === "saigo" || actor === "katsu";
const effectiveProposal = (proposal) => ({ ...proposal, issueIds: [...new Set([...proposal.issueIds,...(proposal.clauses||[]).filter(c=>!(proposal.revokedClauseIds||[]).includes(c.id)).flatMap(clauseIssueIds)])].filter((id) => !(proposal.revokedIssueIds || []).includes(id) && (!proposal.revokedClauseIds?.length || proposal.clauses.some(c => !(proposal.revokedClauseIds || []).includes(c.id) && clauseIssueIds(c).includes(id)) || (!proposal.clauses.some(c=>clauseIssueIds(c).includes(id)) && proposal.clauses.some(c=>!proposal.revokedClauseIds.includes(c.id))))) });

function canonicalFromLegacy(state) {
  const canonical = EMPTY_CANONICAL_LEDGER();
  // Old saves have no evidence-grade events. Preserve only conditions that the
  // previous client had already recorded as accepted; never infer new ones from
  // wording during migration.
  Object.entries(state.issues || {}).forEach(([issueId, status]) => {
    if (!Object.hasOwn(NEGOTIATION_ISSUES, issueId) || !["tentatively_agreed", "agreed"].includes(status)) return;
    const id = `legacy-${issueId}`;
    canonical.proposals.push({ id, issueIds: [issueId], proposer: "saigo", terms: "旧版セーブから移行した成立条件", createdTurn: 0, status: "accepted", acceptance: { actor: "katsu", commitment: status === "agreed" ? "firm" : "conditional", turn: 0 }, legacy: true });
    canonical.events.push({ id: `legacy-event-${issueId}`, turn: 0, actor: "katsu", type: "legacy_import", issueIds: [issueId], targetProposalId: id, summary: "旧版の合意状態を移行", evidence: { speaker: "system", text: "legacy save" } });
  });
  canonical.nextProposalNumber = canonical.proposals.length + 1;
  return canonical;
}

function ensureCanonicalLedger(state) {
  const saved = state.canonicalLedger;
  if (!saved || !Array.isArray(saved.proposals) || !Array.isArray(saved.events)) return canonicalFromLegacy(state);
  return {
    version: 1,
    proposals: saved.proposals.map((proposal) => ({ ...proposal, issueIds: validIssueIds(proposal.issueIds), dependencies: validIssueIds(proposal.dependencies), acceptance: proposal.acceptance ? { ...proposal.acceptance } : undefined })).filter((proposal) => proposal.id && proposal.issueIds.length > 0),
    events: saved.events.map((event) => ({ ...event, issueIds: validIssueIds(event.issueIds), evidence: event.evidence ? { ...event.evidence } : undefined })),
    nextProposalNumber: Math.max(1, Number(saved.nextProposalNumber) || 1),
    focus: { pendingProposalIds: Array.isArray(saved.focus?.pendingProposalIds) ? [...saved.focus.pendingProposalIds] : [], primaryPendingProposalId: saved.focus?.primaryPendingProposalId || "", awaitingActor: saved.focus?.awaitingActor || "" },
  };
}

function deriveCanonical(canonical) {
  const issues = initialIssues();
  const issueEvents = Object.fromEntries(Object.keys(NEGOTIATION_ISSUES).map((id) => [id, []]));
  const ordered = canonical.proposals.map(effectiveProposal).filter((proposal) => proposal.issueIds.length > 0).sort((a, b) => (a.createdTurn - b.createdTurn) || a.id.localeCompare(b.id));
  const resolvedProposalFor = (issueId) => ordered.filter((proposal) => proposal.issueIds.includes(issueId) && proposal.status === "accepted").at(-1);
  ordered.forEach((proposal) => {
    proposal.issueIds.forEach((issueId) => {
      if (proposal.status === "open") issues[issueId] = "proposed";
      if (proposal.status === "rejected" && issues[issueId] === "unresolved") issues[issueId] = "conflicted";
    });
  });
  const accepted = ordered.filter((proposal) => proposal.status === "accepted");
  accepted.forEach((proposal) => proposal.issueIds.forEach((id) => { issues[id] = "tentatively_agreed"; }));
  // Fixed point: dependency chains resolve only from firm roots, never cycles.
  for (let pass = 0; pass <= accepted.length; pass += 1) {
    accepted.forEach((proposal) => {
      const dependencies = proposal.dependencies || [];
      if ((proposal.acceptance?.commitment === "firm" || dependencies.length > 0)
        && dependencies.every((id) => issues[id] === "agreed")) {
        proposal.issueIds.forEach((id) => { issues[id] = "agreed"; });
      }
    });
  }
  // A pending amendment reopens only its own issues, even when another
  // unchanged clause on the same issue remains accepted.
  ordered.filter(p => p.status === "open" && p.clauses?.some(c => c.supersedes?.length))
    .forEach(p => p.issueIds.forEach(id => { issues[id] = "proposed"; }));
  canonical.events.forEach((event) => event.issueIds.forEach((issueId) => issueEvents[issueId].push(event)));
  const negotiationLedger = Object.fromEntries(Object.entries(NEGOTIATION_ISSUES).map(([issueId, issue]) => [issueId, {
    status: issues[issueId],
    events: issueEvents[issueId].slice(-12).map((event) => ({ actor: event.actor, action: event.type, summary: event.summary, turn: event.turn, evidence: event.evidence })),
    acceptedProposalId: resolvedProposalFor(issueId)?.id || "",
    activeProposalId: ordered.filter((proposal) => proposal.issueIds.includes(issueId) && proposal.status === "open").at(-1)?.id || "",
    title: issue.title,
  }]));
  return { issues, negotiationLedger };
}

function refreshFocus(canonical) {
  const pending = canonical.proposals.filter((proposal) => proposal.status === "open").sort((a, b) => (a.createdTurn - b.createdTurn) || a.id.localeCompare(b.id));
  const primary = pending.at(-1);
  canonical.focus = { pendingProposalIds: pending.map((proposal) => proposal.id), primaryPendingProposalId: primary?.id || "", awaitingActor: primary?.proposer === "saigo" ? "katsu" : primary?.proposer === "katsu" ? "saigo" : "" };
}

const eventTypes = new Set(["proposal_created", "proposal_response", "proposal_modified", "proposal_withdrawn", "reservation", "agreement_confirmed"]);
function normalizeEvents(rawEvents) {
  if (!Array.isArray(rawEvents) || rawEvents.length > 24) return [];
  const normalized = rawEvents.flatMap((event) => {
    if (!event || typeof event !== "object" || !eventTypes.has(event.type) || !validActor(event.actor)) return [];
    const issueIds = validIssueIds(event.issue_ids || event.issueIds);
    if (["proposal_created", "agreement_confirmed"].includes(event.type) && (issueIds.length === 0 || typeof event.terms !== "string" || event.terms.trim().length < 4)) return [];
    const target = event.target_proposal_id ?? event.targetProposalId;
    if (["proposal_response", "proposal_modified", "proposal_withdrawn"].includes(event.type) && typeof target !== "string") return [];
    if (event.type === "proposal_response" && !["accept", "reject", "reserve"].includes(event.response)) return [];
    const commitment = event.type === "agreement_confirmed"
      ? (event.commitment === "conditional" ? "conditional" : "firm")
      : (event.commitment === "firm" ? "firm" : "conditional");
    const ids = event.issue_ids ?? event.issueIds ?? [];
    const dependencies = event.depends_on_issue_ids ?? event.dependencies ?? [];
    if (!Array.isArray(ids) || ids.some((id) => !Object.hasOwn(NEGOTIATION_ISSUES, id)) || !Array.isArray(dependencies) || dependencies.some((id) => !Object.hasOwn(NEGOTIATION_ISSUES, id))) return [];
    return [{ clauses: event.clauses, referenceProposalIds: event.reference_proposal_ids ?? event.referenceProposalIds ?? [], changedClauseIds: event.changed_clause_ids ?? event.changedClauseIds ?? [], type: event.type, actor: event.actor, issueIds, targetProposalId: target || "", response: event.response || "", commitment, terms: typeof event.terms === "string" ? event.terms.trim() : "", dependencies: validIssueIds(dependencies), summary: typeof event.summary === "string" ? event.summary.trim() : "" }];
  });
  // Validation is atomic: never keep half of a malformed package.
  return normalized.length === rawEvents.length ? normalized : [];
}

function validSettlementValidity(value) {
  return value && ["government_acceptance", "promise_credibility", "internal_consistency"].every((key) => Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 100)
    && ["pending_approval", "personal_guarantee", "unspecified"].includes(value.approval_mode);
}

function hasContradictoryText(text) {
  return /(?:撤回|取り消|認め(?:られ)?ない|断る|飲めない|拒む)/.test(text || "");
}

export function canContinueNegotiation(state) {
  return !["accepted", "breakdown"].includes(state.katsuSettlement) && !state.governmentReview?.snapshot?.katsuAccepted;
}

export function reduceNegotiationEvents(state, rawEvents, { playerText = "", katsuText = "" } = {}) {
  if (!canContinueNegotiation(state)) return { state, applied: [], validationCode: "negotiation_closed", validationError: "この交渉はすでに確定しています。" };
  const canonical = ensureCanonicalLedger(state);
  const invalid = (validationCode = "event_shape") => ({ state: reconcileNegotiationState(state), applied: [], validationCode, validationError: "交渉イベントと発言の対応を確認できませんでした。" });
  const events = normalizeEvents(rawEvents);
  if (!Array.isArray(rawEvents) || events.length !== rawEvents.length) return invalid();
  const turn = Math.max(1, Number(state.turns) || 1);
  const aliases = new Map();
  const applied = [];
  for (const event of events) {
    const evidenceText = event.actor === "saigo" ? playerText : katsuText;
    if (!evidenceText) return invalid();
    if (event.clauses !== undefined && !validClauses(event.clauses, [playerText, katsuText], Object.keys(NEGOTIATION_ISSUES))) return invalid("clause_evidence");
    if (!Array.isArray(event.referenceProposalIds) || !Array.isArray(event.changedClauseIds)) return invalid();
    if (event.type === "proposal_created") {
      const id = `proposal-${String(turn).padStart(3, "0")}-${String(canonical.nextProposalNumber).padStart(3, "0")}`;
      canonical.nextProposalNumber += 1;
      canonical.proposals.push({ id, issueIds: event.issueIds, proposer: event.actor, terms: event.terms, createdTurn: turn, status: "open", dependencies: event.dependencies });
      attachClauses(canonical.proposals.at(-1), event.clauses, turn, { player: playerText, katsu: katsuText });
      if (event.targetProposalId) aliases.set(event.targetProposalId, id);
      if (event.actor === "saigo") aliases.set("current_player_message", id);
      canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: "proposal_created", issueIds: event.issueIds, targetProposalId: id, summary: event.summary || event.terms, evidence: { speaker: event.actor, text: evidenceText } });
      applied.push({ ...event, targetProposalId: id });
      continue;
    }
    if (event.type === "agreement_confirmed") {
      // This is still an event extracted from the current Katsu reply, rather
      // than a keyword-derived state change. It records a written/package
      // confirmation when no single prior proposal ID can represent it.
      if (event.actor !== "katsu" || (event.clauses === undefined && hasContradictoryText(katsuText))) return invalid();
      if (event.referenceProposalIds.length) {
        const referenced = event.referenceProposalIds.map(id => canonical.proposals.find(p => p.id === (aliases.get(id) || id)));
        if (referenced.some(p => !p || !['open','accepted'].includes(p.status) || !effectiveProposal(p).issueIds.length)) return invalid();
        referenced.forEach(p => { p.status = 'accepted'; p.acceptance = { actor: 'katsu', commitment: event.commitment, turn }; });
        canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor:'katsu', type:'agreement_confirmed', issueIds: [...new Set(referenced.flatMap(p => effectiveProposal(p).issueIds))], referenceProposalIds: referenced.map(p=>p.id), summary:event.summary, evidence:{speaker:'katsu',text:katsuText} });
        applied.push(event);
        if (!event.clauses?.length) continue;
        event.issueIds = [...new Set(event.clauses.flatMap(c=>c.issue_ids))];
      }
      canonical.proposals.filter((proposal) => proposal.status === "open" && proposal.issueIds.every((issueId) => event.issueIds.includes(issueId))).forEach((proposal) => { proposal.status = "superseded"; });
      const id = `proposal-${String(turn).padStart(3, "0")}-${String(canonical.nextProposalNumber).padStart(3, "0")}`;
      canonical.nextProposalNumber += 1;
      canonical.proposals.push({ id, issueIds: event.issueIds, proposer: "saigo", terms: event.terms, createdTurn: turn, status: "accepted", dependencies: event.dependencies, acceptance: { actor: "katsu", commitment: event.commitment, turn } });
      attachClauses(canonical.proposals.at(-1), event.clauses, turn, { player: playerText, katsu: katsuText });
      canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: "agreement_confirmed", issueIds: event.issueIds, targetProposalId: id, summary: event.summary || event.terms, evidence: { speaker: "katsu", text: katsuText } });
      applied.push({ ...event, targetProposalId: id });
      continue;
    }
    // A refusal of the current utterance may have no concrete proposal (e.g.
    // a threat). Preserve it as a non-mutating reservation, never an agreement.
    // Accept/modify/withdraw still require an actual proposal reference.
    if (event.type === "proposal_response" && event.targetProposalId === "current_player_message"
      && !aliases.has("current_player_message") && ["reject", "reserve"].includes(event.response)) {
      event.type = "reservation";
      event.targetProposalId = "";
    }
    if (event.type === "reservation") {
      const targetId = aliases.get(event.targetProposalId) || event.targetProposalId;
      const proposal = targetId ? canonical.proposals.find((item) => item.id === targetId) : null;
      const issueIds = event.issueIds.length ? event.issueIds : proposal?.issueIds || [];
      if (issueIds.length === 0) continue;
      canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: "reservation", issueIds, targetProposalId: proposal?.id || "", summary: event.summary || "条件への留保", evidence: { speaker: event.actor, text: evidenceText } });
      applied.push({ ...event, targetProposalId: proposal?.id || "" });
      continue;
    }
    const candidates = canonical.proposals.filter((item) => item.status === "open" && item.proposer !== event.actor);
    const targetId = aliases.get(event.targetProposalId) || event.targetProposalId || (candidates.length === 1 ? candidates[0].id : "");
    const proposal = canonical.proposals.find((item) => item.id === targetId);
    if (!proposal) return invalid("missing_target");
    if (event.type === "proposal_response" && (proposal.status !== "open" || proposal.proposer === event.actor)) return invalid("response_target_or_actor");
    if (["proposal_modified", "proposal_withdrawn"].includes(event.type) && !["open", "accepted"].includes(proposal.status)) return invalid();
    // Regex is only a lint: an acceptance event that conflicts with explicit
    // rejection language is discarded instead of guessing a state transition.
    if (event.type === "proposal_response" && event.response === "accept" && hasContradictoryText(evidenceText)) return invalid();
    if (event.type === 'proposal_withdrawn' && event.changedClauseIds.length) {
      if(event.changedClauseIds.some(id=>!proposal.clauses?.some(c=>c.id===id && !(proposal.revokedClauseIds||[]).includes(id))))return invalid('missing_target');
      proposal.revokedClauseIds=[...new Set([...(proposal.revokedClauseIds||[]),...event.changedClauseIds])];
      canonical.events.push({id:`event-${turn}-${canonical.events.length+1}`,turn,actor:event.actor,type:event.type,issueIds:event.issueIds,targetProposalId:proposal.id,changedClauseIds:[...event.changedClauseIds],evidence:{speaker:event.actor,text:evidenceText}});
      applied.push(event);continue;
    }
    if (event.type === 'proposal_modified' && proposal.clauses?.length && !event.changedClauseIds.length) return invalid('missing_changed_clauses');
    if (event.type === 'proposal_modified' && event.changedClauseIds.length) {
      if (!event.clauses?.length || event.changedClauseIds.some(id => !(proposal.clauses || []).some(c => c.id === id && !(proposal.revokedClauseIds || []).includes(id)))) return invalid();
      const oldClauses = proposal.clauses.filter(c => event.changedClauseIds.includes(c.id));
      proposal.revokedClauseIds = [...new Set([...(proposal.revokedClauseIds || []), ...event.changedClauseIds])];
      const id = `proposal-${String(turn).padStart(3, '0')}-${String(canonical.nextProposalNumber++).padStart(3, '0')}`;
      const amended = { id, issueIds: event.issueIds, proposer: event.actor, terms: event.terms, createdTurn:turn, status:'open', dependencies:event.dependencies };
      attachClauses(amended, event.clauses, turn, {player:playerText,katsu:katsuText});
      const amendmentFacts = amended.clauses.flatMap(c=>c.facts.map(f=>({...f})));
      amended.clauses.forEach(c => {
        c.version = Math.max(...oldClauses.map(x=>x.version)) + 1;
        c.supersedes = [...event.changedClauseIds];
        // An amendment patches the dimensions it explicitly names. Omission
        // is not withdrawal: retain independently agreed rights and evidence.
        const sameIssue = oldClauses.filter(old=>old.issueIds.some(id=>c.issueIds.includes(id)));
        // Separate promises about the same issue (e.g. pay and hiring) must
        // not inherit each other's superseded facts during a grouped edit.
        const contextDimensions = new Set(['authority','funding','support_duration','appointment_capacity','cost_scope']);
        const obligationDimensions = new Set(c.facts.filter(f=>!contextDimensions.has(f.dimension)).map(f=>f.dimension));
        const sameObligation = sameIssue.filter(old=>old.facts.some(f=>obligationDimensions.has(f.dimension)));
        const related = sameObligation.length ? sameObligation : sameIssue;
        // If one original clause is split, another replacement clause may
        // carry the amended dimension; do not resurrect its old value here.
        const patchedFacts = oldClauses.length===1
          ? amendmentFacts
          : [...c.facts];
        const replaced = old=>patchedFacts.some(f=>f.dimension===old.dimension && (!old.dimension.startsWith("fleet_") || (f.phase||"unspecified")==="unspecified" || (f.phase||"unspecified")===(old.phase||"unspecified") || ((!old.phase || old.phase==="unspecified") && f.phase==="interim")));
        const inherited = related.flatMap(old=>old.facts.filter(f=>!replaced(f)).map(f=>({...f})));
        c.facts.push(...inherited);
        if(inherited.length)c.issueIds=[...new Set([...c.issueIds,...related.flatMap(old=>old.issueIds)])];
        c.inheritedTerms = related.flatMap(old=>{
          const preserved=old.facts.filter(f=>!replaced(f));
          return [...new Set(preserved.map(f=>f.quote))].map(quote=>({clauseId:old.id,version:old.version,text:quote,dimensions:[...new Set(preserved.filter(f=>f.quote===quote).map(f=>f.dimension))]}));
        });
        for(const field of ['subject','obligor','scope','duration','funding','approvalAuthority']) {
          if(c[field]==='unknown' && related.length===1)c[field]=related[0][field];
        }
      });
      amended.issueIds=[...new Set([...amended.issueIds,...amended.clauses.flatMap(c=>c.issueIds)])];
      if(event.response==='accept'){amended.status='accepted';amended.acceptance={actor:'katsu',commitment:event.commitment,turn};}
      if(event.response==='reject')amended.status='rejected';
      canonical.proposals.push(amended);
      aliases.set('modified', id); aliases.set('current_player_message', id);
      canonical.events.push({id:`event-${turn}-${canonical.events.length+1}`,turn,actor:event.actor,type:event.type,issueIds:event.issueIds,targetProposalId:id,changedClauseIds:[...event.changedClauseIds],evidence:{speaker:event.actor,text:evidenceText}});
      applied.push({...event,targetProposalId:id}); continue;
    }
    if (["proposal_modified", "proposal_withdrawn"].includes(event.type)) {
      // Repeated written confirmations must not resurrect an older copy of a
      // clause after its latest agreement has explicitly been withdrawn.
      canonical.proposals.filter((item) => item.status === "accepted" && item.id !== proposal.id).forEach((item) => {
        item.revokedIssueIds = [...new Set([...(item.revokedIssueIds || []), ...item.issueIds.filter((id) => proposal.issueIds.includes(id))])];
      });
    }
    if (event.type === 'proposal_response' && event.response === 'accept' && proposal.clauses?.length && event.issueIds.length && effectiveProposal(proposal).issueIds.some(id=>!event.issueIds.includes(id))) {
      const available = proposal.clauses.filter(c=>!(proposal.revokedClauseIds||[]).includes(c.id));
      const accepted = available.filter(c=>c.issueIds.every(id=>event.issueIds.includes(id)));
      if (!accepted.length || available.some(c=>c.issueIds.some(id=>event.issueIds.includes(id)) && !c.issueIds.every(id=>event.issueIds.includes(id)))) return invalid('partial_clause_ambiguous');
      proposal.revokedClauseIds=[...(proposal.revokedClauseIds||[]),...accepted.map(c=>c.id)];
      const id=`proposal-${String(turn).padStart(3,'0')}-${String(canonical.nextProposalNumber++).padStart(3,'0')}`;
      canonical.proposals.push({...proposal,id,issueIds:[...new Set(accepted.flatMap(c=>c.issueIds))],clauses:accepted,revokedClauseIds:[],status:'accepted',terms:accepted.map(c=>c.text).join(' / '),acceptance:{actor:event.actor,commitment:event.commitment,turn},dependencies:event.dependencies});
      canonical.events.push({id:`event-${turn}-${canonical.events.length+1}`,turn,type:event.type,actor:event.actor,issueIds:event.issueIds,targetProposalId:id,response:'accept',evidence:{speaker:event.actor,text:evidenceText}});
      applied.push({...event,targetProposalId:id});continue;
    }
    if (event.type === "proposal_response") {
      if (event.response === "accept") { proposal.status = "accepted"; proposal.dependencies = [...new Set([...(proposal.dependencies || []), ...event.dependencies])]; proposal.acceptance = { actor: event.actor, commitment: event.commitment, turn }; }
      if (event.response === "reject") proposal.status = "rejected";
    } else if (event.type === "proposal_modified") {
      proposal.status = "superseded";
      const id = `proposal-${String(turn).padStart(3, "0")}-${String(canonical.nextProposalNumber).padStart(3, "0")}`;
      canonical.nextProposalNumber += 1;
      canonical.proposals.push({ id, issueIds: event.issueIds.length ? event.issueIds : proposal.issueIds, proposer: event.actor, terms: event.terms || proposal.terms, createdTurn: turn, status: "open", dependencies: event.dependencies });
      attachClauses(canonical.proposals.at(-1), event.clauses, turn, { player: playerText, katsu: katsuText });
      aliases.set("modified", id);
    } else if (event.type === "proposal_withdrawn") proposal.status = "withdrawn";
    canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: event.type, issueIds: event.issueIds.length ? event.issueIds : proposal.issueIds, targetProposalId: proposal.id, response: event.response, summary: event.summary || proposal.terms, evidence: { speaker: event.actor, text: evidenceText } });
    applied.push({ ...event, issueIds: proposal.issueIds, targetProposalId: proposal.id });
  }
  refreshFocus(canonical);
  const derived = deriveCanonical(canonical);
  return { state: { ...state, canonicalLedger: canonical, ...derived }, applied };
}

function canonicalPrompt(state) {
  const canonical = ensureCanonicalLedger(state);
  const { issues } = deriveCanonical(canonical);
  const active = activeClauses(canonical, {acceptedOnly:false});
  const details = active.map(c=>({...c,source:{turn:c.source.turn,speaker:c.source.speaker},facts:c.facts.map(({dimension,value,phase})=>({dimension,value,phase}))}));
  const evidence = [...new Set(active.map(c=>JSON.stringify(c.source)))].map(s=>JSON.parse(s));
  const locked = canonical.proposals.map(effectiveProposal).filter((proposal) => proposal.status === "accepted" && proposal.issueIds.length > 0).map((proposal) => `${proposal.id} | active issues ONLY:${proposal.issueIds.join(",")} | ${proposal.clauses?.length ? activeClauses({proposals:[proposal]}).map(c=>c.text).join(" / ") : proposal.terms} | revoked issues:${(proposal.revokedIssueIds || []).join(",")} | dependencies:${(proposal.dependencies || []).join(",")}`).join("\n") || "なし";
  const pending = canonical.proposals.map(effectiveProposal).filter((proposal) => proposal.status === "open" && proposal.issueIds.length).map((proposal) => `${proposal.id} | proposer:${proposal.proposer} | ${proposal.issueIds.join(",")} | ${proposal.terms}`).join("\n") || "なし";
  return `CLAUSES (source details, preserve IDs for confirmation/revision): ${JSON.stringify(details)}\nSOURCE EVIDENCE: ${JSON.stringify(evidence)}\n\nGOVERNMENT REQUEST (if any): ${JSON.stringify(state.governmentReview?.findings || [])}\n\nCURRENT ISSUE STATE (derived; do not modify): ${Object.entries(issues).map(([id, status]) => `${id}:${status}`).join(", ")}\n\nLOCKED AGREEMENTS (do not reopen unless the current player message explicitly changes or withdraws them):\n${locked}\n\nACTIVE / PENDING PROPOSALS:\n${pending}\n\nPRIMARY PENDING PROPOSAL: ${canonical.focus.primaryPendingProposalId || "なし"} (awaiting ${canonical.focus.awaitingActor || "none"})`;
}

// Canonical state is event-sourced. Old transcript text is intentionally not
// reinterpreted by regex when a game is resumed.
export function reconcileNegotiationState(state) {
  const canonicalLedger = ensureCanonicalLedger(state);
  return { ...state, canonicalLedger, ...deriveCanonical(canonicalLedger) };
}

export function evaluateMessage(message, state, semantic = {}, katsuText = "", events = []) {
  if (!canContinueNegotiation(state)) throw new Error("この交渉はすでに確定しています。");
  const text = message.trim();
  const canonicalBefore = ensureCanonicalLedger(state);
  const hasUnambiguousPendingProposal = Boolean(canonicalBefore.focus.primaryPendingProposalId) && canonicalBefore.focus.pendingProposalIds.length === 1;
  const issues = issueIdsFor(text, semantic);
  const concreteHits = CONCRETE_WORDS.filter((word) => text.includes(word)).length;
  // A short reply is vague only when it lacks one unambiguous pending proposal.
  // The reducer, not this check, decides whether an event changes the ledger.
  const vagueAgreement = semantic.vagueAgreement === true && !hasUnambiguousPendingProposal;
  const threat = has(text, ["焼き払", "焦土に", "攻め滅ぼ", "攻め込むぞ", "討ち取", "処刑する", "徹底的に", "脅す"]) || semantic.threat;
  const conditional = has(text, ["代わり", "ただし", "しかし", "一方で", "その代わり", "条件として"]);
  const security = has(text, SECURITY_WORDS);
  const protection = has(text, PROTECTION_WORDS);
  const impossible = has(text, ["全部そのまま", "すべてそのまま", "永久に保証", "全員を保証", "領地も全部", "今まで通り"]);
  const specificity = concreteHits >= 2 && text.length >= 38 ? "high" : concreteHits >= 1 || text.length >= 28 ? "medium" : "low";
  const lockedTerms = canonicalBefore.proposals.filter((proposal) => proposal.status === "accepted").map((proposal) => proposal.terms).join("\n");
  const contradictory = semantic.contradiction || (lockedTerms.includes("武装") && has(text, ["武器もそのまま", "軍艦もそのまま"])) || (lockedTerms.includes("徳川") && has(text, ["徳川家は取り潰", "慶喜を処刑"]));
  const duplicate = state.recentMessages.includes(text);
  const probesResistance = has(text, RESISTANCE_QUESTIONS);
  const next = { ...state, turns: state.turns + 1, canonicalLedger: canonicalBefore, knownIssues: [...state.knownIssues], commitments: [...state.commitments], recentMessages: [...state.recentMessages, text].slice(-12) };
  const discovered = [];
  const addKnownIssue = (id) => { if (!next.knownIssues.includes(id)) { next.knownIssues.push(id); discovered.push(discoveredIssue(id)); } };
  issues.forEach(addKnownIssue);
  if (probesResistance) {
    next.battleRisk += 8;
    if (next.battleRisk >= 38 && !next.knownIssues.includes("battle-risk")) {
      next.knownIssues.push("battle-risk");
      discovered.push({ id: "battle-risk", title: "勝の戦い方への懸念", text: "勝は江戸での戦いを、単に軍事的な勝敗だけでは測っていないようだ。" });
    }
  }
  let challenge = "";
  if (vagueAgreement) {
    next.promiseCredibility -= 5; next.militaryTension += 2;
    challenge = "……『いい』とは、ずいぶん軽い返事だな、西郷さん。徳川家をどのような形で残すのか。城と軍事力をどう処するのか。誰の名で、いつまでに約するのか。そこまで聞かなければ、江戸を預けるわけにはいかん。";
  } else if (threat) {
    next.katsuAcceptance -= 16; next.militaryTension += 14; next.resistance += 12; next.promiseCredibility -= 5;
    challenge = "兵の力だけを語るなら、ここで話す意味はない。戦の後に何を残すのか、その責任まで引き受ける言葉を聞かせてもらいたい。こちらとて、何の備えもなく明日を待っているわけではない。";
  } else if (duplicate) {
    next.katsuAcceptance -= 2; next.promiseCredibility -= 1;
    challenge = "同じ言葉を重ねても、約定の中身は増えない。どの条件を、誰の権限と期限で動かすのか。前の提案から一歩進めていただきたい。";
  } else {
    if (protection) { next.katsuAcceptance += (impossible ? 3 : 7); addKnownIssue("tokugawa_house"); addKnownIssue("retainers"); if (!impossible && specificity !== "low") next.commitments.push("tokugawa-protection"); }
    if (security) { next.governmentAcceptance += 9; ["edo_castle", "weapons", "warships"].filter((id) => issues.includes(id) || has(text, ISSUE_WORDS[id])).forEach(addKnownIssue); if (!next.commitments.includes("disarmament")) next.commitments.push("disarmament"); }
    if (has(text, ISSUE_WORDS.yoshinobu)) addKnownIssue("yoshinobu");
    ["civilian_safety", "peaceful_transition", "public_order"].filter((id) => issues.includes(id) || has(text, ISSUE_WORDS[id])).forEach((id) => { addKnownIssue(id); next.katsuAcceptance += 2; next.governmentAcceptance += 2; });
    if (conditional && protection && security && specificity !== "low") {
      next.katsuAcceptance += 14; next.governmentAcceptance += 12; next.promiseCredibility += 12; next.militaryTension -= 7;
    } else if (impossible || (protection && !security && issues.length >= 2)) {
      next.governmentAcceptance -= 18; next.promiseCredibility -= 13; next.katsuAcceptance += (impossible ? 25 : 2);
      challenge = "西郷さん。そこまでを、あんた一人の一存で約定できる話なのか。新政府と朝廷に説明のつく筋を示さずに、ただ大きな約束を重ねても空手形になる。";
    } else if (specificity === "high") {
      next.promiseCredibility += 7; next.katsuAcceptance += (conditional ? 4 : 1);
    }
    if (contradictory) { next.katsuAcceptance -= 11; next.promiseCredibility -= 16; next.militaryTension += 7; challenge = "先ほどの約束と、今の言葉は両立しない。こちらが人と町の命を預けるのに、条件がその場ごとに変わるのでは話にならん。"; }
  }
  if (!challenge && next.turns >= 7 && specificity === "low" && !probesResistance) {
    challenge = "西郷さん。明日には軍が動く。世間話を重ねて決まることではない。こちらに何を求め、何を残すつもりなのか、そろそろ腹を決めてもらいたい。";
  }
  if (validSettlementValidity(semantic.settlementValidity)) {
    next.settlementValidity = { ...semantic.settlementValidity };
    next.governmentAcceptance = semantic.settlementValidity.government_acceptance;
    next.promiseCredibility = semantic.settlementValidity.promise_credibility;
  }
  ["katsuAcceptance", "governmentAcceptance", "promiseCredibility", "militaryTension", "resistance", "battleRisk"].forEach((key) => { next[key] = clamp(next[key]); });
  const reduced = reduceNegotiationEvents(next, events, { playerText: text, katsuText });
  reduced.applied.filter((event) => event.type === "proposal_response" && event.response === "accept").forEach((event) => event.issueIds.forEach((id) => {
    discovered.push({ id: `agreement-${event.targetProposalId}-${id}`, title: `${NEGOTIATION_ISSUES[id].title}の約定`, text: reduced.state.canonicalLedger.proposals.find((proposal) => proposal.id === event.targetProposalId).terms });
  }));
  return { state: reduced.state, evaluation: { specificity, vagueAgreement, threat, contradictory, conditional, issues }, discovered, challenge, automaticEnding: "" };
}

const blockingIssueOrder = ["edo_castle", "yoshinobu", "tokugawa_house", "retainers", "weapons", "warships", "civilian_safety", "peaceful_transition", "public_order"];

function unresolvedIssues(state) {
  return blockingIssueOrder.filter((id) => ["unresolved", "proposed", "conflicted"].includes(state.issues?.[id] || "unresolved"));
}

function settlementFallback(status, blocking, repeated, ledger = {}, canonical = {}) {
  const settled = Object.entries(ledger).filter(([, entry]) => ["tentatively_agreed", "agreed"].includes(entry.status)).map(([id]) => NEGOTIATION_ISSUES[id].title);
  // Katsu naming the agenda is not a player offer. Until Saigo has proposed a
  // term or responded to one, settlement must not pretend a particular clause
  // has already been negotiated.
  const hasPlayerCommitment = (canonical.proposals || []).some((proposal) => (proposal.proposer === "saigo" && proposal.status !== "withdrawn") || proposal.status === "accepted")
    || (canonical.events || []).some((event) => event.actor === "saigo" && event.type === "proposal_response");
  const pending = blocking.map((id) => NEGOTIATION_ISSUES[id]?.title).filter(Boolean);
  const settledLine = settled.length > 0
    ? `${settled.join("、")}については、すでに交わした約定がある。`
    : "あなたは、ここまでに交わした条件を、決着として差し出した。";
  const pendingLine = pending.length > 0
    ? `残るのは、${pending.slice(0, 2).join("と")}についての約定だった。`
    : "交わした条件が、今夜の約定として並べられている。";
  if (status === "BREAKDOWN") return {
    expression: "irritated",
    reflection: ["同じ問いが、畳の上に戻された。", "約束の中身は、まだ増えていない。", "夜は深く、明日の軍勢は待ってくれない。", "勝は、静かに視線を落とした。"],
    response: "……もうよい、西郷さん。こちらが預かる者たちの行く末を、話の外に置くなら、この席で交わせる言葉は尽きた。これ以上の会談は受けぬ。",
  };
  if (status === "ACCEPTED") return {
    expression: "serious",
    reflection: ["あなたは、ここまでに交わした条件を、決着として差し出した。", settled.length ? `${settled.join("、")}。その一つひとつが、今夜の約定として並べられている。` : "交わした条件が、今夜の約定として並べられている。", "そしてその条件と引き換えに、勝は江戸城を明け渡す意思を示している。", "いま問われているのは、これまで積み重ねた条件を一つの約定として結ぶかどうかだ。"],
    response: "……分かった、西郷さん。俺は、ここまで書面に記した条件で決着を預けよう。あんたはこの約定を持ち帰り、新政府の承認を取り付けてくれ。あとは、向こうがこの条件を引き受けるかだ。",
  };
  if (!hasPlayerCommitment) return {
    expression: "thinking",
    reflection: ["あなたは、まだ条件を差し出していない。", "今夜の会談では、何を守り、何を渡すのかを定める必要がある。", "勝は、最初の約束を待っている。", "明日の軍勢は、こちらの都合を待ってくれない。"],
    response: "……西郷さん、まだ互いの条件を一つも約していない。城を渡せと言うなら、その後に誰を守り、何を引き受けるのか。まずはあんたの腹案を聞かせてもらおう。",
  };
  const first = blocking[0];
  const concern = {
    retainers: "旧幕臣の生活と再出発を、どう約するのか",
    edo_castle: "江戸城そのものを、どの条件で明け渡すのか",
    yoshinobu: "慶喜公の処遇を、どう約するのか",
    tokugawa_house: "徳川家の今後を、どう定めるのか",
    weapons: "武器の扱いを、どう定めるのか",
    warships: "軍艦の扱いを、どう定めるのか",
    civilian_safety: "江戸市民を戦火から守ることを、どう約するのか",
    peaceful_transition: "戦わずに引き渡す手順を、どう約するのか",
    public_order: "市中の治安維持を、どう引き受けるのか",
  }[first];
  return {
    expression: repeated ? "wry_smile" : "thinking",
    reflection: [settledLine, pendingLine, "明日の軍勢を止めるには、残る約定にも言葉の裏づけがいる。", "勝は、まだ決していない一点を量っている。"],
    response: repeated
      ? `西郷さん、先ほどと同じ条件では答えは変わらん。${concern}。そこを曖昧にしたまま、江戸を預けるわけにはいかない。`
      : `……まだ早い。${concern}。その筋が見えぬうちは、こちらから決着とは言えん。もう少し、腹の内を聞かせてもらおう。`,
  };
}

export function evaluateSettlement(state, messages = []) {
  if (!canContinueNegotiation(state)) {
    const settlementResult = state.katsuSettlement === "breakdown" ? "BREAKDOWN" : "ACCEPTED";
    const fallback = settlementFallback(settlementResult, [], false, state.negotiationLedger, state.canonicalLedger);
    return { state, settlementResult, continues: false, blocking: [], discovered: [], endingCandidate: settlementResult === "BREAKDOWN" ? "breakdown" : "", expression: fallback.expression, reflection: fallback.reflection, katsuResponse: fallback.response };
  }
  // Settlement eligibility is deterministic. Conversation text is deliberately
  // not reinterpreted here; only canonical proposal events may affect it.
  const reconciled = reconcileNegotiationState(state);
  const attempts = (Number.isFinite(reconciled.settlementAttempts) ? reconciled.settlementAttempts : 0) + 1;
  const repeated = reconciled.lastSettlementTurn === reconciled.turns && reconciled.katsuSettlement !== "accepted";
  const patience = clamp((Number.isFinite(reconciled.settlementPatience) ? reconciled.settlementPatience : 100) - (repeated ? 22 : 0));
  const next = {
    ...reconciled,
    settlementAttempts: attempts,
    settlementPatience: patience,
    lastSettlementTurn: reconciled.turns,
    issues: { ...reconciled.issues },
    negotiationLedger: { ...reconciled.negotiationLedger },
    canonicalLedger: ensureCanonicalLedger(reconciled),
    knownIssues: [...(reconciled.knownIssues || [])],
    commitments: [...(reconciled.commitments || [])],
    recentMessages: [...(reconciled.recentMessages || [])],
  };
  if (repeated) {
    next.katsuAcceptance = clamp(next.katsuAcceptance - 4);
    next.promiseCredibility = clamp(next.promiseCredibility - 5);
    next.resistance = clamp(next.resistance + 8);
    next.militaryTension = clamp(next.militaryTension + 3);
  }
  const blocking = unresolvedIssues(next);
  const isBreakdown = next.settlementPatience <= 34
    || (next.katsuAcceptance <= 18 && next.resistance >= 72)
    || (next.militaryTension >= 82 && next.katsuAcceptance <= 28);
  // This is Katsu's package-deal decision only. Whether Saigo can actually
  // carry the terms through the new government is intentionally decided in
  // determineGovernmentOutcome after Katsu has accepted.
  const isAccepted = !isBreakdown && blocking.length === 0;
  const settlementResult = isBreakdown ? "BREAKDOWN" : isAccepted ? "ACCEPTED" : "NOT_READY";
  next.katsuSettlement = settlementResult === "ACCEPTED" ? "accepted" : settlementResult === "BREAKDOWN" ? "breakdown" : "not_ready";
  const fallback = settlementFallback(settlementResult, blocking, repeated, next.negotiationLedger, next.canonicalLedger);
  const discovered = settlementResult === "NOT_READY" && blocking.includes("retainers") && !next.knownIssues.includes("retainers")
    ? [discoveredIssue("retainers")] : [];
  return {
    settlementResult,
    state: next,
    blocking,
    continues: settlementResult === "NOT_READY",
    // A BREAKDOWN result means Katsu has explicitly ended this negotiation.
    // Do not reuse the old "unfinished" branch here: NOT_READY is the only
    // state in which the player may return to the dialogue.
    endingCandidate: settlementResult === "BREAKDOWN" ? "breakdown" : "",
    expression: fallback.expression,
    reflection: fallback.reflection,
    katsuResponse: fallback.response,
    discovered,
  };
}

export function determineGovernmentOutcome(state) {
  const review = state.governmentReview || reviewGovernment(state);
  if (review.status === 'not_submitted') return '';
  return review.status === 'approved' ? 'bloodless' : 'empty_promises';
}

export function submitGovernmentReview(state) {
  if (state.governmentReview?.status !== undefined && state.governmentReview.status !== "not_submitted") return state;
  const review = reviewGovernment(state);
  return { ...state, governmentReview: review, governmentReviewHistory: [...(state.governmentReviewHistory || []), review] };
}

function automaticEnding(state) {
  if (state.katsuAcceptance <= 18 && state.militaryTension >= 78 && state.resistance >= 70) return "scorched";
  if (state.katsuAcceptance <= 25 && state.militaryTension >= 68) return "assault";
  return "";
}

export function determineEnding(state) {
  const immediate = automaticEnding(state);
  if (immediate) return immediate;
  const unresolved = Object.entries(state.issues).filter(([, status]) => ["unresolved", "proposed", "conflicted"].includes(status)).map(([id]) => id);
  if (state.katsuAcceptance >= 65 && (state.governmentAcceptance < 50 || state.promiseCredibility < 50)) return "empty_promises";
  if (state.katsuAcceptance < 30) return "assault";
  if (state.militaryTension >= 72) return "scorched";
  if (unresolved.length > 2) return "unfinished";
  if (state.katsuAcceptance >= 78 && state.governmentAcceptance >= 76 && state.promiseCredibility >= 76 && unresolved.length === 0) return "alternative_peace";
  if (state.katsuAcceptance >= 66 && state.governmentAcceptance >= 64 && state.promiseCredibility >= 62 && unresolved.length <= 1) return "bloodless";
  if (state.katsuAcceptance >= 60 && state.governmentAcceptance >= 56 && state.promiseCredibility >= 60) return "fragile_handover";
  return "breakdown";
}

export const ENDINGS = {
  bloodless: { title: "江戸無血開城", text: "翌朝、新政府軍は進軍を止めた。約定はまだ始まりにすぎない。それでも、双方が引き受ける条件は言葉になった。" },
  alternative_peace: { title: "歴史にない和平", text: "勝海舟との約定を新政府も承認した。総攻撃の命令は取り下げられ、軍勢は江戸への進撃を止めた。双方は約した手順で城を受け取る準備を始める。あなたは、双方が引き受ける和平を結んだ。" },
  empty_promises: { title: "空手形", text: "勝は席を立たなかった。だが、会談の外で約定は支えを失った。あなたの言葉は、明日の軍を止める力にはならなかった。" },
  fragile_handover: { title: "不安定な引渡し", text: "城門は開いた。しかし、明日からの秩序まで引き受ける言葉は足りなかった。勝敗は決しても、火種は消えていない。" },
  unfinished: { title: "決着を急いだ夜", text: "勝は、まだ答えを出さなかった。明日の軍勢を前に、あなたは会談を切り上げた。残された沈黙が、翌朝の判断を重くする。" },
  breakdown: { title: "交渉決裂", text: "言葉は交わされたが、同じ明日を見てはいなかった。翌朝、新政府軍は予定どおり江戸へ進んだ。" },
  assault: { title: "江戸総攻撃", text: "会談は終わり、軍勢は動いた。だが、そこで待っていたのは、ただ敗北を待つ者たちではなかった。" },
  scorched: { title: "江戸焦土", text: "強硬な応酬の果て、町は戦のただ中へ落ちていった。翌朝、誰もが想定していた勝敗とは別の代価が姿を現す。" },
};

const endingOutcomes = {
  bloodless: ["success", "双方の承認を得て、江戸城は戦わずに引き渡された。"],
  alternative_peace: ["alternative", "双方が約定を引き受け、江戸の戦は避けられた。"],
  empty_promises: ["failure", "交渉成立。しかし、和平は成立せず。"],
  fragile_handover: ["alternative", "城は引き渡された。和平の履行には、不安が残った。"],
  unfinished: ["failure", "約定を結べぬまま、夜が明けた。"],
  breakdown: ["failure", "会談は決裂し、江戸の戦を止める約定は結ばれなかった。"],
  assault: ["failure", "和平の道は閉ざされ、江戸への攻撃が始まった。"],
  scorched: ["failure", "戦闘は市中へ広がり、江戸は大きな被害を受けた。"],
};
ENDINGS.empty_promises.text = "勝海舟は、あなたの条件を受け入れた。江戸城を明け渡すための約定は、この席で結ばれた。\n\nしかし、持ち帰った約定は新政府側の承認を得られなかった。会談で交わした言葉を、双方の軍勢を止める決定にはできなかった。\n\n合意の前提は揺らぎ、旧幕府側が再び抵抗へ傾けば、市中を巻き込む戦闘や火災へ発展する危険が残る。\n\nあなたは勝海舟を説得した。だが、江戸を救う和平は成立しなかった。";
ENDINGS.bloodless.text = "勝海舟が受け入れた約定を、新政府も承認した。総攻撃は止まり、双方は軍勢を抑えて江戸城の引渡しに取り掛かった。\n\n城と軍事力は定めた条件に従って移され、町には暮らしを続ける時間が残された。あなたは、会談の言葉を双方が引き受ける決定にした。";
ENDINGS.fragile_handover.text = "勝海舟との約定は新政府にも受け入れられ、江戸城の引渡しが始まった。総攻撃は避けられ、町はひとまず戦火を免れた。\n\nただし、軍勢を収め、人々の暮らしを支える仕事は続く。承認された約束を実行し続けられるか。和平には、なお不安が残っている。";
for (const [id, ending] of Object.entries(ENDINGS)) {
  Object.assign(ending, { id, category: endingOutcomes[id][0], outcomeLine: endingOutcomes[id][1], narrative: ending.text });
  Object.freeze(ending);
}

export function createCompletedRun({ endingId, messages, discoveries, completedAt = new Date().toISOString(), settlementSnapshot = null, presentation = null }) {
  const ending = ENDINGS[endingId];
  if (!ending) throw new Error("結末が確定していません。");
  const snapshot = JSON.parse(JSON.stringify({ version: 2, id: globalThis.crypto.randomUUID(), endingId, endingTitle: presentation?.title || ending.title, outcomeLine: presentation?.outcomeLine || ending.outcomeLine, summary: presentation?.summary || ending.outcomeLine, endingNarrative: presentation?.narrative || ending.narrative, settlementSnapshot, conversationHistory: messages, discoveredInformation: discoveries, completedAt }));
  const freeze = (value) => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  return freeze(snapshot);
}
