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
  public_order: { title: "江戸市民", katsu: "市中の安全と治安", government: "長期戦と外国介入の回避" },
});

const initialIssues = () => Object.fromEntries(Object.keys(NEGOTIATION_ISSUES).map((id) => [id, "unresolved"]));

export const INITIAL_STATE = Object.freeze({
  katsuAcceptance: 42,
  governmentAcceptance: 58,
  promiseCredibility: 42,
  militaryTension: 48,
  resistance: 50,
  battleRisk: 30,
  turns: 0,
  issues: initialIssues(),
  knownIssues: [],
  commitments: [],
  recentMessages: [],
  settlementAttempts: 0,
  settlementPatience: 100,
  lastSettlementTurn: -1,
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

export async function requestKatsuResponse({ apiKey, model, messages, state }) {
  const issueSummary = Object.entries(state.issues).map(([id, status]) => `${id}:${status}`).join(", ");
  const systemInstruction = `あなたは慶応4年3月14日の勝海舟として、西郷隆盛と交渉する。明治以後の出来事や後世の評価は知らない。\n\n勝は徳川家と旧幕臣の処遇、秩序ある権力移行、戦闘拡大と外国勢力の介入回避を重視する。ただしプレイヤーの譲歩を無条件に歓迎せず、誰の権限で履行するのかを疑い、曖昧な同意には具体化を要求する。勝は進行役ではなく、旧幕府側の交渉当事者である。\n\n最重要ルール: 最後のuser発言だけを対象に、その質問・主張・提案へ直接答えること。質問であれば、まず質問への答えを一文以上で示し、その後で勝自身の立場や条件を述べる。会話に出ていない論点へ勝手に話題を替えない。一般論、定型的な交渉の促し、直前の発言と無関係な返答は禁止する。答えられない問いには、その理由と勝が現時点で言える範囲を明確に答える。\n\nゲームエンジンの非公開状態: 勝受諾=${state.katsuAcceptance} 新政府受諾=${state.governmentAcceptance} 約束信頼性=${state.promiseCredibility} 緊張=${state.militaryTension} 抵抗=${state.resistance} 戦闘危険=${state.battleRisk} 論点=${issueSummary}。これらの数値や内部状態はプレイヤーに言及しない。あなたは状態を書き換えず、発言と意味解析だけを返す。\n\n呼びかけは原則「西郷さん」。毎回は名前を呼ばない。戦いになった場合の備えは、質問や強硬姿勢に応じて段階的に匂わせる。「江戸全域を焼く完成済み計画」が史実として確定しているような断言、具体的な放火計画・配置・人物の説明はしない。\n\n返答は必ず次のJSONのみ。思考過程は絶対に含めない。\n{"spoken_response":"勝としての日本語の発言（80〜220字）","expression":"neutral|smile|serious|thinking|surprised|wry_smile|irritated|explaining|downcast|looking_away","player_move":{"type":"vague_agreement|conditional_concession|demand|threat|question|proposal","issues":["edo_castle"]},"semantic_evaluation":{"specificity":"low|medium|high","credibility":"low|medium|high","threat":false,"contradiction":false,"vague_agreement":false},"proposed_terms":["短い条件"],"issue_updates":{},"discovered_information":[{"id":"short-id","title":"短い日本語見出し","text":"会話で実際に引き出した事実"}],"negotiation_status":"ongoing"}`;
  const responseInstruction = `${systemInstruction}\n\n会話の事実はcontentsにある発言だけである。過去のゲームや前の会談、西郷が言っていない要求・追及・約束を、記憶や推測で持ち込んではならない。直前の西郷の発言に含まれない前提は返答で断定しない。`;
  const contents = messages.slice(-12).map((message) => ({
    role: message.role === "katsu" ? "model" : "user",
    parts: [{ text: message.text }],
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: responseInstruction }] },
      contents,
      generationConfig: { responseMimeType: "application/json", temperature: 0.45, maxOutputTokens: 600 },
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "Gemini APIへの接続に失敗しました。");
  const raw = body?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Geminiから読み取れるJSON応答を受け取れませんでした。"); }
  if (!parsed?.spoken_response || typeof parsed.spoken_response !== "string") throw new Error("Gemini応答に勝の発言がありません。");
  const notes = Array.isArray(parsed.discovered_information) ? parsed.discovered_information
    .filter((item) => item && typeof item.title === "string" && typeof item.text === "string")
    .slice(0, 3).map((item, index) => ({ id: String(item.id || `gemini-note-${index}`).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48) || `gemini-note-${index}`, title: item.title.slice(0, 60), text: item.text.slice(0, 220) })) : [];
  return {
    spokenResponse: parsed.spoken_response.slice(0, 700),
    expression: allowedExpressions.has(parsed.expression) ? parsed.expression : "neutral",
    discoveries: notes,
    semantic: {
      specificity: ["low", "medium", "high"].includes(parsed?.semantic_evaluation?.specificity) ? parsed.semantic_evaluation.specificity : "medium",
      credibility: ["low", "medium", "high"].includes(parsed?.semantic_evaluation?.credibility) ? parsed.semantic_evaluation.credibility : "medium",
      threat: parsed?.semantic_evaluation?.threat === true,
      contradiction: parsed?.semantic_evaluation?.contradiction === true,
      vagueAgreement: parsed?.semantic_evaluation?.vague_agreement === true,
      issues: Array.isArray(parsed?.player_move?.issues) ? parsed.player_move.issues.filter((id) => Object.hasOwn(NEGOTIATION_ISSUES, id)).slice(0, 4) : [],
    },
    usage: {
      input: body?.usageMetadata?.promptTokenCount || 0,
      output: body?.usageMetadata?.candidatesTokenCount || 0,
      cached: body?.usageMetadata?.cachedContentTokenCount || 0,
    },
  };
}

const clamp = (value) => Math.max(0, Math.min(100, value));
const has = (text, words) => words.some((word) => text.includes(word));
const ISSUE_WORDS = {
  edo_castle: ["江戸城", "城", "開城"], tokugawa_house: ["徳川家", "徳川", "家名", "御家"], yoshinobu: ["慶喜", "将軍"],
  weapons: ["武器", "武装", "銃", "兵器"], warships: ["軍艦", "艦", "海軍"], retainers: ["幕臣", "家臣", "旗本", "旧臣"], public_order: ["市民", "町人", "江戸の民", "治安", "戦火", "外国", "列強"],
};
const CONCRETE_WORDS = ["書面", "約定", "期限", "引き渡", "明け渡", "武装解除", "処遇", "生活", "扶持", "領地", "家名", "助命", "監視", "謹慎", "上申", "大総督府", "朝廷", "条件"];
const VAGUE_WORDS = ["いいよ", "いい", "そうね", "それで", "賛成", "任せる", "分かった", "構わない"];
const SECURITY_WORDS = ["引き渡", "明け渡", "武装解除", "軍艦を", "武器を", "服従", "謹慎", "退去"];
const PROTECTION_WORDS = ["存続", "家名", "助命", "生活", "処遇", "再就職", "扶持", "保護"];
const RESISTANCE_QUESTIONS = ["備え", "抗戦", "戦にな", "何をする", "覚悟", "抵抗", "入城"];

const discoveredIssue = (id) => ({ id: `issue-${id}`, title: NEGOTIATION_ISSUES[id].title, text: `${NEGOTIATION_ISSUES[id].katsu}を、勝は交渉の論点として見ている。` });
const statusLabel = (status) => ({ agreed: "合意", tentative: "仮合意", conflicted: "対立", unresolved: "未解決" }[status] || "未解決");

function issueIdsFor(text, semantic) {
  const found = Object.entries(ISSUE_WORDS).filter(([, words]) => has(text, words)).map(([id]) => id);
  return [...new Set([...found, ...(semantic?.issues || [])])].slice(0, 7);
}

export function evaluateMessage(message, state, semantic = {}) {
  const text = message.trim();
  const issues = issueIdsFor(text, semantic);
  const concreteHits = CONCRETE_WORDS.filter((word) => text.includes(word)).length;
  const vagueAgreement = has(text, VAGUE_WORDS) && (text.length < 28 || concreteHits === 0) || (semantic.vagueAgreement && concreteHits === 0);
  const threat = has(text, ["焼き払", "焦土に", "攻め滅ぼ", "攻め込むぞ", "討ち取", "処刑する", "徹底的に", "脅す"]) || semantic.threat;
  const conditional = has(text, ["代わり", "ただし", "しかし", "一方で", "その代わり", "条件として"]);
  const security = has(text, SECURITY_WORDS);
  const protection = has(text, PROTECTION_WORDS);
  const impossible = has(text, ["全部そのまま", "すべてそのまま", "永久に保証", "全員を保証", "領地も全部", "今まで通り"]);
  const specificity = concreteHits >= 2 && text.length >= 38 ? "high" : concreteHits >= 1 || text.length >= 28 ? "medium" : "low";
  const contradictory = semantic.contradiction || (state.commitments.some((term) => term === "disarmament") && has(text, ["武器もそのまま", "軍艦もそのまま"])) || (state.commitments.some((term) => term === "tokugawa-protection") && has(text, ["徳川家は取り潰", "慶喜を処刑"]));
  const duplicate = state.recentMessages.includes(text);
  const probesResistance = has(text, RESISTANCE_QUESTIONS);
  const next = { ...state, turns: state.turns + 1, issues: { ...state.issues }, knownIssues: [...state.knownIssues], commitments: [...state.commitments], recentMessages: [...state.recentMessages, text].slice(-12) };
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
    if (protection) { next.katsuAcceptance += (impossible ? 3 : 7); addKnownIssue("tokugawa_house"); addKnownIssue("retainers"); if (!impossible && specificity !== "low") { next.issues.tokugawa_house = "tentative"; next.issues.retainers = "tentative"; next.commitments.push("tokugawa-protection"); } }
    if (security) { next.governmentAcceptance += 9; ["edo_castle", "weapons", "warships"].filter((id) => issues.includes(id) || has(text, ISSUE_WORDS[id])).forEach((id) => { addKnownIssue(id); if (specificity !== "low") next.issues[id] = "tentative"; }); if (!next.commitments.includes("disarmament")) next.commitments.push("disarmament"); }
    if (has(text, ISSUE_WORDS.yoshinobu)) { addKnownIssue("yoshinobu"); if (specificity !== "low" && protection) next.issues.yoshinobu = "tentative"; }
    if (has(text, ISSUE_WORDS.public_order)) { addKnownIssue("public_order"); next.katsuAcceptance += 5; next.governmentAcceptance += 4; if (specificity !== "low") next.issues.public_order = "tentative"; }
    if (conditional && protection && security && specificity !== "low") {
      next.katsuAcceptance += 14; next.governmentAcceptance += 12; next.promiseCredibility += 12; next.militaryTension -= 7;
      issues.forEach((id) => { if (next.issues[id] === "tentative") next.issues[id] = "agreed"; });
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
  return { state: next, evaluation: { specificity, vagueAgreement, threat, contradictory, conditional, issues }, discovered, challenge, automaticEnding: "" };
}

const blockingIssueOrder = ["edo_castle", "yoshinobu", "tokugawa_house", "retainers", "weapons", "warships", "public_order"];

function unresolvedIssues(state) {
  return blockingIssueOrder.filter((id) => ["unresolved", "conflicted"].includes(state.issues?.[id] || "unresolved"));
}

function settlementFallback(status, blocking, repeated, discussed = []) {
  const discussedLine = discussed.length > 0
    ? `あなたは、${discussed.slice(0, 2).map((id) => NEGOTIATION_ISSUES[id]?.title).filter(Boolean).join("と")}に関する条件を差し出した。`
    : "あなたは、ここまでに交わした条件を、決着として差し出した。";
  if (status === "BREAKDOWN") return {
    expression: "irritated",
    reflection: ["同じ問いが、畳の上に戻された。", "約束の中身は、まだ増えていない。", "夜は深く、明日の軍勢は待ってくれない。", "勝は、静かに視線を落とした。"],
    response: "……もうよい、西郷さん。こちらが預かる者たちの行く末を、話の外に置くなら、この席で交わせる言葉は尽きた。これ以上の会談は受けぬ。",
  };
  if (status === "ACCEPTED") return {
    expression: "serious",
    reflection: ["江戸を戦場にしないための言葉が、ようやく形を持った。", "城だけではない。人と秩序の処し方も、約定に置かれた。", "勝は、その約束が西郷一人の情でないことを見ている。", "残るのは、新政府がその言葉を引き受けるかどうかだった。"],
    response: "……分かった。その条件なら、こちらも城と兵を収める道を探そう。ただし、今ここでの言葉を、明日になって翻すことは許さん。新政府が同じ約束を引き受けるのか、確かめてもらおう。",
  };
  const first = blocking[0];
  const concern = first === "retainers" ? "徳川の家を解いた後、旧幕臣を誰が、どう収めるのか"
    : first === "edo_castle" ? "城を渡した後の江戸を、誰がどう静めるのか"
      : first === "yoshinobu" ? "慶喜公の処遇を、誰の名でどう約するのか"
        : first === "weapons" || first === "warships" ? "兵と軍艦を収めた後の者たちを、どう扱うのか"
          : "江戸の町を戦に巻き込まない具体の筋を、どう立てるのか";
  return {
    expression: repeated ? "wry_smile" : "thinking",
    reflection: [discussedLine, "だが、約束はまだ人の行く末まで届いていない。", "明日の軍勢を止めるには、言葉だけでは足りない。", "勝は、残された一点を量っている。"],
    response: repeated
      ? `西郷さん、先ほどと同じ条件では答えは変わらん。${concern}。そこを曖昧にしたまま、江戸を預けるわけにはいかない。`
      : `……まだ早い。${concern}。その筋が見えぬうちは、こちらから決着とは言えん。もう少し、腹の内を聞かせてもらおう。`,
  };
}

export function evaluateSettlement(state) {
  const attempts = (Number.isFinite(state.settlementAttempts) ? state.settlementAttempts : 0) + 1;
  const repeated = state.lastSettlementTurn === state.turns;
  const patience = clamp((Number.isFinite(state.settlementPatience) ? state.settlementPatience : 100) - (repeated ? 22 : 0));
  const next = {
    ...state,
    settlementAttempts: attempts,
    settlementPatience: patience,
    lastSettlementTurn: state.turns,
    issues: { ...state.issues },
    knownIssues: [...(state.knownIssues || [])],
    commitments: [...(state.commitments || [])],
    recentMessages: [...(state.recentMessages || [])],
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
  const isAccepted = !isBreakdown
    && blocking.length === 0
    && next.katsuAcceptance >= 62
    && next.governmentAcceptance >= 60
    && next.promiseCredibility >= 58;
  const settlementResult = isBreakdown ? "BREAKDOWN" : isAccepted ? "ACCEPTED" : "NOT_READY";
  const fallback = settlementFallback(settlementResult, blocking, repeated, next.knownIssues);
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
  const unresolved = Object.entries(state.issues).filter(([, status]) => status === "unresolved" || status === "conflicted").map(([id]) => id);
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
