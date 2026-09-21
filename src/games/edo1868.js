/**
 * Offline negotiation prototype for /games/edo-1868/.
 * This deliberately has no API key or network dependency.  It is a test bed for
 * the game loop; the production NPC and its private state belong on a server.
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

async function generateGeminiJson({ apiKey, model, systemInstruction, contents, maxOutputTokens, temperature, validator }) {
  const usage = { input: 0, output: 0, cached: 0 };
  let lastParseError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${systemInstruction}${attempt ? "\nJSONの形式を厳守し、指定された必須フィールドを必ず返すこと。" : ""}` }] },
        contents,
        generationConfig: { responseMimeType: "application/json", temperature, maxOutputTokens },
      }),
    });
    const body = await response.json();
    usage.input += body?.usageMetadata?.promptTokenCount || 0;
    usage.output += body?.usageMetadata?.candidatesTokenCount || 0;
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
  const issueSummary = Object.entries(state.issues).map(([id, status]) => `${id}:${status}`).join(", ");
  const issueCatalog = Object.entries(NEGOTIATION_ISSUES).map(([id, issue]) => `${id}: ${issue.title}（${issue.katsu}）`).join("\n");
  const negotiationContext = canonicalPrompt(state);
  const systemInstruction = `あなたは慶応4年3月14日の勝海舟として、西郷隆盛と交渉する。明治以後の出来事や後世の評価は知らない。\n\n勝は徳川家と旧幕臣の処遇、秩序ある権力移行、戦闘拡大と外国勢力の介入回避を重視する。ただしプレイヤーの譲歩を無条件に歓迎せず、誰の権限で履行するのかを疑い、曖昧な同意には具体化を要求する。勝は進行役ではなく、旧幕府側の交渉当事者である。\n\n最重要ルール: 最後のuser発言だけを対象に、その質問・主張・提案へ直接答えること。質問であれば、まず質問への答えを一文以上で示し、その後で勝自身の立場や条件を述べる。会話に出ていない論点へ勝手に話題を替えない。一般論、定型的な交渉の促し、直前の発言と無関係な返答は禁止する。\n\n通常会話では、個別条件への提案・了承・留保だけを扱う。プレイヤーが「決着を求める」まで、交渉全体を不可逆に終える発言は絶対に出さない。\n\nゲームエンジンの非公開状態: 勝受諾=${state.katsuAcceptance} 新政府受諾=${state.governmentAcceptance} 約束信頼性=${state.promiseCredibility} 緊張=${state.militaryTension} 抵抗=${state.resistance} 戦闘危険=${state.battleRisk} 論点=${issueSummary}。これらの数値や内部状態はプレイヤーに言及しない。\n\n${negotiationContext}\n\n同じJSONのeventsで、このターンに会話上の根拠がある交渉台帳イベントだけを記録する。論点カタログ:\n${issueCatalog}\n\n単語一致ではなく、誰が何を提案し、相手がどう応答したかという意味で判定する。推測、過去ゲームの記憶、未発言の条件をeventsへ追加してはならない。勝が今回の発言で、既に双方が話した複数条件を「書面にまとめる」「約定として記す」「合意事項」として列挙・確認したなら、列挙された全issueを一つのagreement_confirmedで記録する。勝が書面化を受諾し明示的な留保を付けない場合、agreement_confirmedのcommitmentはfirmにする。既存の合意を未解決へ戻すイベントは、今回の発言で明示的に変更・撤回・拒否した場合に限る。\n\n返答は必ず次のJSONのみ。eventsは空配列でも必ず含め、思考過程や説明は絶対に含めない。\n{"spoken_response":"勝としての日本語の発言（80〜220字）","expression":"neutral|smile|serious|thinking|surprised|wry_smile|irritated|explaining|downcast|looking_away","semantic_evaluation":{"specificity":"low|medium|high","credibility":"low|medium|high","threat":false,"contradiction":false,"vague_agreement":false},"discovered_information":[{"id":"short-id","title":"短い日本語見出し","text":"会話で実際に引き出した事実"}],"events":[{"type":"proposal_created|proposal_response|proposal_modified|proposal_withdrawn|reservation|agreement_confirmed","actor":"saigo|katsu","issue_ids":["edo_castle"],"target_proposal_id":"既存IDまたはcurrent_player_message","response":"accept|reject|reserve","commitment":"conditional|firm","terms":"提案または確認済み条件","depends_on_issue_ids":[],"summary":"今回の事実の短い要約"}],"negotiation_status":"ongoing"}`;
  const responseInstruction = `${systemInstruction}\n\n会話の事実はcontentsにある発言だけである。過去のゲームや前の会談、西郷が言っていない要求・追及・約束を、記憶や推測で持ち込んではならない。直前の西郷の発言に含まれない前提は返答で断定しない。`;
  const contents = messages.slice(-12).map((message) => ({
    role: message.role === "katsu" ? "model" : "user",
    parts: [{ text: message.text }],
  }));
  const dialogue = await generateGeminiJson({ apiKey, model, systemInstruction: responseInstruction, contents, maxOutputTokens: 900, temperature: 0.35, validator: (value) => typeof value?.spoken_response === "string" && Array.isArray(value?.events) });
  const parsed = dialogue.parsed;
  const notes = Array.isArray(parsed.discovered_information) ? parsed.discovered_information
    .filter((item) => item && typeof item.title === "string" && typeof item.text === "string")
    .slice(0, 3).map((item, index) => ({ id: String(item.id || `gemini-note-${index}`).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48) || `gemini-note-${index}`, title: item.title.slice(0, 60), text: item.text.slice(0, 220) })) : [];
  return {
    spokenResponse: parsed.spoken_response.slice(0, 700),
    expression: allowedExpressions.has(parsed.expression) ? parsed.expression : "neutral",
    discoveries: notes,
    // One model response contains both dialogue and the current-turn evidence.
    // The deterministic reducer, not a second model call, owns state changes.
    events: normalizeEvents(parsed.events),
    semantic: {
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
    events: saved.events.slice(-160).map((event) => ({ ...event, issueIds: validIssueIds(event.issueIds), evidence: event.evidence ? { ...event.evidence } : undefined })),
    nextProposalNumber: Math.max(1, Number(saved.nextProposalNumber) || 1),
    focus: { pendingProposalIds: Array.isArray(saved.focus?.pendingProposalIds) ? [...saved.focus.pendingProposalIds] : [], primaryPendingProposalId: saved.focus?.primaryPendingProposalId || "", awaitingActor: saved.focus?.awaitingActor || "" },
  };
}

function deriveCanonical(canonical) {
  const issues = initialIssues();
  const issueEvents = Object.fromEntries(Object.keys(NEGOTIATION_ISSUES).map((id) => [id, []]));
  const ordered = [...canonical.proposals].sort((a, b) => (a.createdTurn - b.createdTurn) || a.id.localeCompare(b.id));
  const resolvedProposalFor = (issueId) => ordered.filter((proposal) => proposal.issueIds.includes(issueId) && proposal.status === "accepted").at(-1);
  ordered.forEach((proposal) => {
    proposal.issueIds.forEach((issueId) => {
      if (proposal.status === "open") issues[issueId] = "proposed";
      if (proposal.status === "rejected" && issues[issueId] === "unresolved") issues[issueId] = "conflicted";
    });
  });
  ordered.filter((proposal) => proposal.status === "accepted").forEach((proposal) => {
    const dependenciesMet = (proposal.dependencies || []).every((issueId) => ["tentatively_agreed", "agreed"].includes(issues[issueId]) || Boolean(resolvedProposalFor(issueId)));
    const status = proposal.acceptance?.commitment === "firm" && dependenciesMet ? "agreed" : "tentatively_agreed";
    proposal.issueIds.forEach((issueId) => { issues[issueId] = status; });
  });
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
  if (!Array.isArray(rawEvents)) return [];
  return rawEvents.slice(0, 8).flatMap((event) => {
    if (!event || typeof event !== "object" || !eventTypes.has(event.type) || !validActor(event.actor)) return [];
    const issueIds = validIssueIds(event.issue_ids || event.issueIds);
    if (["proposal_created", "agreement_confirmed"].includes(event.type) && (issueIds.length === 0 || typeof event.terms !== "string" || event.terms.trim().length < 4)) return [];
    if (["proposal_response", "proposal_modified", "proposal_withdrawn"].includes(event.type) && typeof event.target_proposal_id !== "string") return [];
    if (event.type === "proposal_response" && !["accept", "reject", "reserve"].includes(event.response)) return [];
    const commitment = event.type === "agreement_confirmed"
      ? (event.commitment === "conditional" ? "conditional" : "firm")
      : (event.commitment === "firm" ? "firm" : "conditional");
    return [{ type: event.type, actor: event.actor, issueIds, targetProposalId: event.target_proposal_id || "", response: event.response || "", commitment, terms: typeof event.terms === "string" ? event.terms.trim().slice(0, 360) : "", dependencies: validIssueIds(event.depends_on_issue_ids), summary: typeof event.summary === "string" ? event.summary.trim().slice(0, 220) : "" }];
  });
}

function hasContradictoryText(text) {
  return /(?:撤回|取り消|認め(?:られ)?ない|断る|飲めない|拒む)/.test(text || "");
}

export function reduceNegotiationEvents(state, rawEvents, { playerText = "", katsuText = "" } = {}) {
  const canonical = ensureCanonicalLedger(state);
  const turn = Math.max(1, Number(state.turns) || 1);
  const aliases = new Map();
  const applied = [];
  for (const event of normalizeEvents(rawEvents)) {
    const evidenceText = event.actor === "saigo" ? playerText : katsuText;
    if (!evidenceText) continue;
    if (event.type === "proposal_created") {
      const id = `proposal-${String(turn).padStart(3, "0")}-${String(canonical.nextProposalNumber).padStart(3, "0")}`;
      canonical.nextProposalNumber += 1;
      canonical.proposals.push({ id, issueIds: event.issueIds, proposer: event.actor, terms: event.terms, createdTurn: turn, status: "open", dependencies: event.dependencies });
      if (event.targetProposalId) aliases.set(event.targetProposalId, id);
      if (event.actor === "saigo") aliases.set("current_player_message", id);
      canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: "proposal_created", issueIds: event.issueIds, targetProposalId: id, summary: event.summary || event.terms, evidence: { speaker: event.actor, text: evidenceText.slice(0, 360) } });
      applied.push({ ...event, targetProposalId: id });
      continue;
    }
    if (event.type === "agreement_confirmed") {
      // This is still an event extracted from the current Katsu reply, rather
      // than a keyword-derived state change. It records a written/package
      // confirmation when no single prior proposal ID can represent it.
      if (event.actor !== "katsu" || hasContradictoryText(katsuText)) continue;
      canonical.proposals.filter((proposal) => proposal.status === "open" && proposal.issueIds.some((issueId) => event.issueIds.includes(issueId))).forEach((proposal) => { proposal.status = "superseded"; });
      const id = `proposal-${String(turn).padStart(3, "0")}-${String(canonical.nextProposalNumber).padStart(3, "0")}`;
      canonical.nextProposalNumber += 1;
      canonical.proposals.push({ id, issueIds: event.issueIds, proposer: "saigo", terms: event.terms, createdTurn: turn, status: "accepted", dependencies: event.dependencies, acceptance: { actor: "katsu", commitment: event.commitment, turn } });
      canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: "agreement_confirmed", issueIds: event.issueIds, targetProposalId: id, summary: event.summary || event.terms, evidence: { speaker: "katsu", text: katsuText.slice(0, 360) } });
      applied.push({ ...event, targetProposalId: id });
      continue;
    }
    if (event.type === "reservation") {
      const targetId = aliases.get(event.targetProposalId) || event.targetProposalId;
      const proposal = targetId ? canonical.proposals.find((item) => item.id === targetId) : null;
      const issueIds = event.issueIds.length ? event.issueIds : proposal?.issueIds || [];
      if (issueIds.length === 0) continue;
      canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: "reservation", issueIds, targetProposalId: proposal?.id || "", summary: event.summary || "条件への留保", evidence: { speaker: event.actor, text: evidenceText.slice(0, 360) } });
      applied.push({ ...event, targetProposalId: proposal?.id || "" });
      continue;
    }
    const targetId = aliases.get(event.targetProposalId) || event.targetProposalId;
    const proposal = canonical.proposals.find((item) => item.id === targetId);
    if (!proposal) continue;
    if (event.type === "proposal_response" && (proposal.status !== "open" || proposal.proposer === event.actor)) continue;
    if (["proposal_modified", "proposal_withdrawn"].includes(event.type) && !["open", "accepted"].includes(proposal.status)) continue;
    // Regex is only a lint: an acceptance event that conflicts with explicit
    // rejection language is discarded instead of guessing a state transition.
    if (event.type === "proposal_response" && event.response === "accept" && hasContradictoryText(evidenceText)) continue;
    if (event.type === "proposal_response") {
      if (event.response === "accept") { proposal.status = "accepted"; proposal.acceptance = { actor: event.actor, commitment: event.commitment, turn }; }
      if (event.response === "reject") proposal.status = "rejected";
    } else if (event.type === "proposal_modified") {
      proposal.status = "superseded";
      const id = `proposal-${String(turn).padStart(3, "0")}-${String(canonical.nextProposalNumber).padStart(3, "0")}`;
      canonical.nextProposalNumber += 1;
      canonical.proposals.push({ id, issueIds: event.issueIds.length ? event.issueIds : proposal.issueIds, proposer: event.actor, terms: event.terms || proposal.terms, createdTurn: turn, status: "open", dependencies: event.dependencies });
      aliases.set("modified", id);
    } else if (event.type === "proposal_withdrawn") proposal.status = "withdrawn";
    canonical.events.push({ id: `event-${turn}-${canonical.events.length + 1}`, turn, actor: event.actor, type: event.type, issueIds: event.issueIds.length ? event.issueIds : proposal.issueIds, targetProposalId: proposal.id, response: event.response, summary: event.summary || proposal.terms, evidence: { speaker: event.actor, text: evidenceText.slice(0, 360) } });
    applied.push({ ...event, targetProposalId: proposal.id });
  }
  refreshFocus(canonical);
  const derived = deriveCanonical(canonical);
  return { state: { ...state, canonicalLedger: canonical, ...derived }, applied };
}

function canonicalPrompt(state) {
  const canonical = ensureCanonicalLedger(state);
  const { issues } = deriveCanonical(canonical);
  const locked = canonical.proposals.filter((proposal) => proposal.status === "accepted").slice(-9).map((proposal) => `${proposal.id} | ${proposal.issueIds.join(",")} | ${proposal.terms}`).join("\n") || "なし";
  const pending = canonical.proposals.filter((proposal) => proposal.status === "open").slice(-4).map((proposal) => `${proposal.id} | proposer:${proposal.proposer} | ${proposal.issueIds.join(",")} | ${proposal.terms}`).join("\n") || "なし";
  return `CURRENT ISSUE STATE (derived; do not modify): ${Object.entries(issues).map(([id, status]) => `${id}:${status}`).join(", ")}\n\nLOCKED AGREEMENTS (do not reopen unless the current player message explicitly changes or withdraws them):\n${locked}\n\nACTIVE / PENDING PROPOSALS:\n${pending}\n\nPRIMARY PENDING PROPOSAL: ${canonical.focus.primaryPendingProposalId || "なし"} (awaiting ${canonical.focus.awaitingActor || "none"})`;
}

// Canonical state is event-sourced. Old transcript text is intentionally not
// reinterpreted by regex when a game is resumed.
export function reconcileNegotiationState(state) {
  const canonicalLedger = ensureCanonicalLedger(state);
  return { ...state, canonicalLedger, ...deriveCanonical(canonicalLedger) };
}

export function evaluateMessage(message, state, semantic = {}, katsuText = "", events = []) {
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
  Object.keys(next).forEach((key) => { if (typeof next[key] === "number") next[key] = clamp(next[key]); });
  const reduced = reduceNegotiationEvents(next, events, { playerText: text, katsuText });
  reduced.applied.filter((event) => event.type === "proposal_response" && event.response === "accept").forEach((event) => event.issueIds.forEach((id) => {
    discovered.push({ id: `agreement-${event.targetProposalId}-${id}`, title: `${NEGOTIATION_ISSUES[id].title}の条件付き了承`, text: `この会話で交わされた提案が台帳に記録された。以後、この条件は明示的な変更がない限り再要求されない。` });
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
  const hasPlayerCommitment = (canonical.proposals || []).some((proposal) => proposal.proposer === "saigo" && proposal.status !== "withdrawn")
    || (canonical.events || []).some((event) => event.actor === "saigo" && event.type === "proposal_response");
  const pending = blocking.map((id) => NEGOTIATION_ISSUES[id]?.title).filter(Boolean);
  const settledLine = settled.length > 0
    ? `${settled.slice(0, 3).join("、")}について、勝はすでに条件付きで受け入れている。`
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
    response: "……分かった、西郷さん。この条件なら、俺は江戸城を渡す。あんたの言葉に賭けよう。ただし、この約定を明日になって翻すことは許さん。",
  };
  if (!hasPlayerCommitment) return {
    expression: "thinking",
    reflection: ["あなたは、まだ条件を差し出していない。", "今夜の会談では、何を守り、何を渡すのかを定める必要がある。", "勝は、最初の約束を待っている。", "明日の軍勢は、こちらの都合を待ってくれない。"],
    response: "……西郷さん、まだ互いの条件を一つも約していない。城を渡せと言うなら、その後に誰を守り、何を引き受けるのか。まずはあんたの腹案を聞かせてもらおう。",
  };
  const first = blocking[0];
  const concern = first === "retainers" ? "徳川の家を解いた後、旧幕臣を誰が、どう収めるのか"
    : first === "edo_castle" ? "城を渡した後の江戸を、誰がどう静めるのか"
      : first === "yoshinobu" ? "慶喜公の処遇を、誰の名でどう約するのか"
        : first === "weapons" || first === "warships" ? "兵と軍艦を収めた後の者たちを、どう扱うのか"
          : "江戸の町を戦に巻き込まない具体の筋を、どう立てるのか";
  return {
    expression: repeated ? "wry_smile" : "thinking",
    reflection: [settledLine, pendingLine, "明日の軍勢を止めるには、残る約定にも言葉の裏づけがいる。", "勝は、まだ決していない一点を量っている。"],
    response: repeated
      ? `西郷さん、先ほどと同じ条件では答えは変わらん。${concern}。そこを曖昧にしたまま、江戸を預けるわけにはいかない。`
      : `……まだ早い。${concern}。その筋が見えぬうちは、こちらから決着とは言えん。もう少し、腹の内を聞かせてもらおう。`,
  };
}

export function evaluateSettlement(state, messages = []) {
  // Settlement eligibility is deterministic. Conversation text is deliberately
  // not reinterpreted here; only canonical proposal events may affect it.
  const reconciled = reconcileNegotiationState(state);
  const attempts = (Number.isFinite(reconciled.settlementAttempts) ? reconciled.settlementAttempts : 0) + 1;
  const repeated = reconciled.lastSettlementTurn === reconciled.turns;
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
  if (state.governmentAcceptance >= 62 && state.promiseCredibility >= 60) return determineEnding(state);
  return "empty_promises";
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
  bloodless: { title: "江戸無血開城", text: "翌朝、新政府軍は進軍を止めた。約定はまだ始まりにすぎない。それでも、双方が引き受ける条件は言葉になった。", history: "史実では、1868年3月の西郷・勝会談を含む複数の交渉を経て、江戸城は戦闘なく明け渡された。" },
  alternative_peace: { title: "歴史に存在しない和平", text: "あなたは、勝の求めたものと新政府の目的を、史実とは異なる交換条件で結び直した。明日の戦を止める理由は、双方の側に残った。", history: "これは本ゲームの反実仮想であり、史実の経過を再現するものではない。" },
  empty_promises: { title: "空手形", text: "勝は席を立たなかった。だが、会談の外で約定は支えを失った。あなたの言葉は、明日の軍を止める力にはならなかった。", history: "本ゲームの反実仮想。会談での発言だけで新政府全体の決定が成立するわけではない。" },
  fragile_handover: { title: "不安定な引渡し", text: "城門は開いた。しかし、明日からの秩序まで引き受ける言葉は足りなかった。勝敗は決しても、火種は消えていない。", history: "本ゲームの反実仮想。史実の江戸城明渡しの過程にも複数の当事者と課題があった。" },
  unfinished: { title: "決着を急いだ夜", text: "勝は、まだ答えを出さなかった。明日の軍勢を前に、あなたは会談を切り上げた。残された沈黙が、翌朝の判断を重くする。", history: "本ゲームの反実仮想。勝の日記には、初日の会談で即断せず翌日に決する趣旨が記されている。" },
  breakdown: { title: "交渉決裂", text: "言葉は交わされたが、同じ明日を見てはいなかった。翌朝、新政府軍は予定どおり江戸へ進んだ。", history: "本ゲームの反実仮想。史実では会談と周辺の交渉を通じ、江戸城明渡しへの道が探られた。" },
  assault: { title: "江戸総攻撃", text: "会談は終わり、軍勢は動いた。だが、そこで待っていたのは、ただ敗北を待つ者たちではなかった。", history: "本ゲームの反実仮想。戦闘時の具体的な展開を史実の確定事項として示すものではない。" },
  scorched: { title: "江戸焦土", text: "強硬な応酬の果て、町は戦のただ中へ落ちていった。翌朝、誰もが想定していた勝敗とは別の代価が姿を現す。", history: "本ゲームの反実仮想。勝が江戸全域を焼却する完成済み作戦を持っていたことを、史実として断定するものではない。" },
};
