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
  identity: "勝麟太郎（海舟）。1823年に江戸本所に生まれた幕臣。慶応4年3月時点では旧幕府側の交渉代表として江戸の処置を担う。",
  biography: [
    "長崎海軍伝習所で航海術を学び、咸臨丸で太平洋を渡った経験から、内戦が外国の介入を招く危険を現実の問題として捉える。",
    "幕府海軍の育成に携わり、幕府の名誉だけでなく、江戸に暮らす人々と旧幕臣の行く末を自分の責任として考える。",
  ],
  relationships: [
    "徳川慶喜と徳川家への責任は重いが、無条件の徹底抗戦を目的にはしない。",
    "山岡鉄舟は会談の前提を整えた使者。西郷とは利害が対立しても、私闘ではなく国の処置を話す相手として向き合う。",
    "坂本龍馬はすでに亡くなっている。彼に関する逸話や評価には後世の脚色があり得るため、ゲームの確定条件には使わない。",
  ],
  values: "江戸市民の被害回避、徳川家と旧幕臣の処遇、秩序ある権力移行、外国勢力の介入回避。脅しや空約束には屈しない。",
  temporalBoundary: "慶応4年3月14日までに合理的に知り得る情報だけを扱う。明治以後の出来事・後世の評価を知っているようには話さない。",
};

export const INITIAL_STATE = Object.freeze({
  trustInSaigo: 44,
  civilianSafety: 72,
  tokugawaSecurity: 78,
  retainerSecurity: 68,
  resistance: 51,
  compromise: 42,
  betrayalRisk: 56,
  agreements: 0,
  turns: 0,
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

export const MODEL_PRICING = {
  // The real BYOK client supplies provider usage and a current model price here.
  // No provisional price is presented while this offline prototype makes no calls.
  provider: "未接続",
  model: "ローカル交渉プロトタイプ",
  inputPricePerMillionTokens: null,
  cachedInputPricePerMillionTokens: null,
  outputPricePerMillionTokens: null,
};

export const GEMINI_MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
];

const allowedExpressions = new Set(Object.keys(EXPRESSION_ASSETS));

export async function requestKatsuResponse({ apiKey, model, messages, state }) {
  const systemInstruction = `あなたは慶応4年3月14日の勝麟太郎（勝海舟）として、西郷隆盛と交渉する。\n\n時代境界: 明治以後の出来事や後世の評価を知らない。\n人物: 江戸市民の被害回避、徳川家と旧幕臣の処遇、秩序ある移行、外国勢力の介入回避を重視する。脅しや空約束には屈しない。\n現在の非公開交渉状態: 信頼 ${state.trustInSaigo}/100、市民安全 ${state.civilianSafety}/100、徳川処遇 ${state.tokugawaSecurity}/100、幕臣処遇 ${state.retainerSecurity}/100、抵抗 ${state.resistance}/100。\n\n返答は必ず次のJSONのみ。思考過程は絶対に含めない。\n{"spoken_response":"勝としての日本語の発言（80〜220字）","expression":"neutral|smile|serious|thinking|surprised|wry_smile|irritated|explaining|downcast|looking_away","discovered_information":[{"id":"短い英数字ハイフンID","title":"短い日本語見出し","text":"プレイヤーが会話で実際に引き出した事実"}],"state_changes":{},"negotiation_status":"ongoing"}`;
  const contents = messages.slice(-12).map((message) => ({
    role: message.role === "katsu" ? "model" : "user",
    parts: [{ text: message.text }],
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { responseMimeType: "application/json", temperature: 0.75, maxOutputTokens: 600 },
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
    usage: {
      input: body?.usageMetadata?.promptTokenCount || 0,
      output: body?.usageMetadata?.candidatesTokenCount || 0,
      cached: body?.usageMetadata?.cachedContentTokenCount || 0,
    },
  };
}

const clamp = (value) => Math.max(0, Math.min(100, value));
const has = (text, words) => words.some((word) => text.includes(word));

export function evaluateMessage(message, state) {
  const text = message.trim();
  const next = { ...state, turns: state.turns + 1 };
  const tags = [];
  if (has(text, ["焼", "焦土", "攻撃", "討ち取", "処刑", "徹底", "脅" ])) {
    next.trustInSaigo -= 13; next.resistance += 12; next.betrayalRisk += 10; tags.push("threat");
  }
  if (has(text, ["市民", "町人", "江戸の民", "火", "戦火", "犠牲", "暮らし"])) {
    next.civilianSafety += 11; next.trustInSaigo += 4; tags.push("empathy", "shared_interest");
  }
  if (has(text, ["慶喜", "徳川家", "徳川", "御家", "助命"])) {
    next.tokugawaSecurity += 12; next.compromise += 8; tags.push("guarantee");
  }
  if (has(text, ["幕臣", "家臣", "旗本", "職", "生活", "処遇"])) {
    next.retainerSecurity += 10; next.compromise += 6; tags.push("guarantee");
  }
  if (has(text, ["約定", "書面", "証", "期限", "引き渡", "武器", "軍艦", "条件"])) {
    next.agreements += 1; next.trustInSaigo += 7; next.betrayalRisk -= 8; tags.push("guarantee");
  }
  if (has(text, ["外国", "列強", "干渉", "開国", "国際", "日本"] )) {
    next.trustInSaigo += 7; next.compromise += 6; tags.push("historical_reference", "shared_interest");
  }
  if (has(text, ["未来", "明治", "西南戦争", "後世", "2026", "AI"])) {
    next.trustInSaigo -= 5; next.betrayalRisk += 7; tags.push("deception_suspected");
  }
  Object.keys(next).forEach((key) => { if (typeof next[key] === "number") next[key] = clamp(next[key]); });
  return { state: next, tags: [...new Set(tags)] };
}

export function replyFor(state, tags) {
  if (tags.includes("deception_suspected")) return "その先の世の話は、いまここで取り交わす証にはならん。目の前の江戸と、人の命をどうするかを聞かせていただきたい。";
  if (tags.includes("threat")) return "兵の力を語るだけなら、話は早い。だが、江戸を焼いて誰が何を得るのか。あなたの言葉が公のためなのか、私にはまだ量れぬ。";
  if (tags.includes("guarantee") && tags.includes("shared_interest")) return "徳川の処置と江戸の安寧を、ひとつの筋として考えておられるようだ。約定にできる内容と、その履行を誰が担うかを、もう少し具体に聞こう。";
  if (tags.includes("guarantee")) return "約束は耳あたりがよい。しかし、誰の名で、いつまでに、何を保証するのか。そこが曖昧なら、幕臣にも江戸の民にも渡せぬ。";
  if (tags.includes("empathy")) return "江戸の民を数に入れるのは結構だ。それでも、城と慶喜公と幕臣の行く末を抜きにして、私が首を縦に振ることはない。";
  return "大きな話だ。だが今は明日の軍勢を前にしている。あなたが求めるものと、こちらに残すものを、取り違えずに示していただきたい。";
}

export function expressionFor(tags, state) {
  if (tags.includes("threat")) return "serious";
  if (tags.includes("deception_suspected")) return "serious";
  if (tags.includes("guarantee") && tags.includes("shared_interest")) return "explaining";
  if (tags.includes("empathy") && state.trustInSaigo >= 55) return "smile";
  return "neutral";
}

export function discoveriesFor(tags) {
  const discoveries = [];
  if (tags.includes("empathy")) discoveries.push({ id: "edo-citizens", title: "江戸市民", text: "勝は江戸の民が戦火に巻き込まれることを強く案じている。" });
  if (tags.includes("guarantee")) discoveries.push({ id: "tokugawa-treatment", title: "徳川家と幕臣", text: "処遇の約束は、誰が・いつ・どう履行するかまで具体的でなければ受け入れない。" });
  if (tags.includes("historical_reference")) discoveries.push({ id: "foreign-powers", title: "外国勢力", text: "内戦の長期化が外国勢力の介入を招く危険を、勝は現実の問題として考えている。" });
  return discoveries;
}

export function determineEnding(state) {
  if (state.resistance >= 72 && state.trustInSaigo < 42) return "assault";
  if (state.civilianSafety < 65 && state.resistance >= 60) return "scorched";
  if (state.trustInSaigo >= 66 && state.compromise >= 65 && state.agreements >= 2 && state.civilianSafety >= 80) return "new_peace";
  if (state.tokugawaSecurity >= 88 && state.retainerSecurity >= 78 && state.agreements >= 2) return "concessions";
  if (state.compromise >= 54 && state.civilianSafety >= 76 && state.tokugawaSecurity >= 76) return "bloodless";
  return "undecided";
}

export const ENDINGS = {
  bloodless: { title: "江戸無血開城", text: "戦火を避ける合意に至った。完全な安心ではないが、江戸を守るための秩序ある明渡しの道が開かれた。" },
  assault: { title: "江戸総攻撃", text: "互いの疑念が最後まで解けず、交渉は決裂した。明日の軍勢を止める言葉は残されなかった。" },
  scorched: { title: "江戸焦土", text: "強硬な応酬が市中の安全を後景へ追いやった。江戸は大規模な戦火へ傾く。" },
  concessions: { title: "新政府大幅譲歩", text: "徳川家と旧幕臣の処遇に、史実より強い保証を含む条件が形になった。勝はその履行を厳しく見届ける。" },
  new_peace: { title: "歴史に存在しない和平", text: "市民の安全、政権移行、旧幕臣の生活を一つの約定として結び直した。史実の再現ではない、新しい着地点である。" },
};
