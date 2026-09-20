import assert from "node:assert/strict";
import { INITIAL_STATE, evaluateMessage, evaluateSettlement } from "./edo1868.js";

// Regression: the conversation reported in the play test. Katsu explicitly
// accepts the ceasefire / public-order procedure; a settlement request must
// not ask the player to explain the same civilian-safety procedure again.
const saigoTurn8 = "総攻撃を停止し、市中の秩序を維持する。城内将兵を統制し、明朝に城門を開放する。江戸の民を戦火に巻き込まぬ無血の移行を進める。";
const katsuTurn8 = "西郷さん、その手順ならば江戸の民も戦火に怯えずに済むだろう。総攻撃の停止と市中の秩序維持、この両輪が揃うことが肝要だ。城門を開く日は明朝の合図を待て。私も直ちに城内へ伝え、将兵が暴発せぬよう厳重に申し渡す。";

const afterTurn8 = evaluateMessage(saigoTurn8, INITIAL_STATE, {}, katsuTurn8);
for (const issue of ["civilian_safety", "peaceful_transition", "public_order"]) {
  assert.ok(["tentatively_agreed", "agreed"].includes(afterTurn8.state.negotiationLedger[issue].status), `${issue} must retain Katsu's acceptance`);
}
assert.ok(afterTurn8.discovered.some((item) => item.id === "agreement-public_order"), "the negotiation note must record Katsu's conditional acceptance");

// Simulate an older save whose mirrored issue fields were stale. The transcript
// remains authoritative for the latest explicit agreement at settlement time.
const staleState = {
  ...afterTurn8.state,
  issues: { ...afterTurn8.state.issues, civilian_safety: "unresolved", peaceful_transition: "unresolved", public_order: "unresolved" },
  negotiationLedger: { ...afterTurn8.state.negotiationLedger, civilian_safety: { status: "unresolved", events: [] }, peaceful_transition: { status: "unresolved", events: [] }, public_order: { status: "unresolved", events: [] } },
};
const settlement = evaluateSettlement(staleState, [{ role: "saigo", text: saigoTurn8 }, { role: "katsu", text: katsuTurn8 }]);
for (const issue of ["civilian_safety", "peaceful_transition", "public_order"]) {
  assert.ok(["tentatively_agreed", "agreed"].includes(settlement.state.negotiationLedger[issue].status), `${issue} must be restored from the conversation transcript`);
  assert.ok(!settlement.blocking.includes(issue), `${issue} must not be requested again at settlement`);
}
assert.ok(!settlement.katsuResponse.includes("江戸の町を戦に巻き込まない具体の筋"), "settlement must not repeat the accepted civilian-safety demand");
assert.ok(!settlement.reflection.join("\n").includes("人の行く末まで届いていない"), "reflection must use the same ledger, not a generic stale summary");

// Regression: a player may accept Katsu's concrete proposal with a short reply
// such as "いいね、それで" or "書面に書こう". These replies must bind the
// immediately preceding offer, rather than leave it pending or loop back to it.
const turns = [
  {
    saigo: "武装解除と軍艦の扱いを、まず聞かせてほしい。",
    katsu: "ならばこうだ。武装解除は段階的に行い、徳川家には一定の警備兵力を残す。既存の軍艦と兵は新政府の管理下で共同運用する。この条件で覚書を交わす準備はあるか。",
  },
  {
    saigo: "いいじゃないですか、それでいきましょう。",
    katsu: "江戸の治安維持には、徳川の旧臣を一部留任させ、新政府の役人と共同で警察組織を編成する。これなら民の動揺も抑えられ、秩序ある移行が可能だ。これが江戸の平穏を維持するための最後の条件だ。",
  },
  {
    saigo: "いいね、それで。あとは？ 江戸城についても決めよう。",
    katsu: "江戸城の明け渡しは段階を踏む。武器弾薬を整理し、新政府の軍が入る際は徳川家の人々が安全に退去できるよう猶予を求めたい。城をただの空き家として引き渡すつもりはない。",
  },
  {
    saigo: "いいでしょう。それも書面に書くようにしましょう。慶喜公の命と徳川家の家名も守る。",
    katsu: "よかろう。慶喜公の命の保証と家名存続、そして江戸城の明け渡し。これらを一筆に認め、互いの署名をもって約定とする。西郷さんが新政府を代表してこの書面に責任を持つなら、私も徳川の家臣として全力を尽くそう。さあ、書面を整えよう。",
  },
];

let acceptingState = INITIAL_STATE;
const acceptingMessages = [];
for (const turn of turns) {
  const result = evaluateMessage(turn.saigo, acceptingState, {}, turn.katsu);
  acceptingState = result.state;
  acceptingMessages.push({ role: "saigo", text: turn.saigo }, { role: "katsu", text: turn.katsu });
}

for (const issue of ["weapons", "warships", "retainers", "public_order", "civilian_safety", "peaceful_transition", "edo_castle", "tokugawa_house", "yoshinobu"]) {
  assert.ok(["tentatively_agreed", "agreed"].includes(acceptingState.negotiationLedger[issue].status), `${issue} must be retained when Saigo accepts Katsu's offer tersely`);
}

const acceptingSettlement = evaluateSettlement(acceptingState, acceptingMessages);
for (const issue of ["weapons", "warships", "retainers", "public_order", "civilian_safety", "peaceful_transition", "edo_castle", "tokugawa_house", "yoshinobu"]) {
  assert.ok(!acceptingSettlement.blocking.includes(issue), `${issue} must not be re-requested after a written conditional agreement`);
}
assert.ok(!acceptingSettlement.katsuResponse.includes("城を渡した後の江戸を、誰がどう静めるのか"), "settlement must not loop to the already agreed public-order plan");
assert.ok(!acceptingSettlement.reflection.join("\n").includes("まだ人の行く末"), "reflection must inherit the same resolved ledger state");

// A prior, erroneous settlement response may have left a saved issue marked as
// conflicted. Reconciliation must let the subsequent explicit agreement win.
const staleAcceptanceState = {
  ...acceptingState,
  issues: Object.fromEntries(Object.keys(acceptingState.issues).map((id) => [id, "conflicted"])),
  negotiationLedger: Object.fromEntries(Object.keys(acceptingState.negotiationLedger).map((id) => [id, { status: "conflicted", events: [] }])),
};
const repairedSettlement = evaluateSettlement(staleAcceptanceState, acceptingMessages);
for (const issue of ["weapons", "warships", "retainers", "public_order", "civilian_safety", "peaceful_transition", "edo_castle", "tokugawa_house", "yoshinobu"]) {
  assert.ok(!repairedSettlement.blocking.includes(issue), `${issue} must be repaired from the actual transcript, not an old settlement state`);
}

// Regression: the exact wording from the second reported play test. The first
// settlement happens after the weapon/warship agreement, and the second after
// the retainer guarantee. Neither may loop back to weapon/warship treatment.
const reportedTurns = [
  [
    "勝さんにだって考えがあるでしょう。それをお聞かせ願いたい。",
    "ふむ、余に先を切れと言うか。ならば言おう。徳川宗家の存続は駿府七十万石、慶喜公の身の安全と謹慎、そして旧幕臣の召し抱えと生活の保障。これが最低限の条件だ。これらを朝廷から引き出す確約が取れるか？",
  ],
  [
    "いいよ、それで",
    "ほう、その条件で合意するというのだな。だが、口約束だけでは江戸の者どもは納得せぬ。朝廷からの正式な沙汰として、この条件をいかにして履行するのか、その手順と期限を早急に書面で示してもらいたい。それが成れば、城の明け渡しに向けて余も全力を尽くそう。",
  ],
  [
    "せっかくなのでここで書面書いてしまいましょう。",
    "よかろう、その決断は重いぞ。では、徳川宗家の駿府七十万石への移封、慶喜公の安全と謹慎、旧幕臣の召し抱えと生活保障、これらを明記した書面を今ここで作成しよう。この約束が履行される限り、江戸城の明け渡しは秩序をもって進めよう。",
  ],
  [
    "いいよ。あとは、江戸城をどうするか、ですかね。ここまで譲歩しているんだ。城は無血開城を望む。",
    "城の無血開城、それが余の本心だ。貴殿が今示した書面への署名と、その条件の履行が確約されるならば、城は無血で明け渡そう。城を去る者たちの安全と、江戸の民の平穏が守られることが大前提だ。これより城内の者たちへ、余の責任において開城の準備を命じる。これでよいな。",
  ],
  [
    "よい。他に決めねばならぬものはないか？",
    "残るは軍艦と武器の処遇だ。これらが新政府に接収されるのか、あるいは徳川家に残されるのか、曖昧なままでは火種が残る。これらをどう扱うか、貴殿の考えを聞きたい。",
  ],
  [
    "軍艦は幕府側のほうがうまく使えるであろう。ただ、武器については今後の反乱の種は残したくない。それでまとめられないか？",
    "軍艦の運用を徳川に任せるという提案、承知した。武器については、反乱の火種を消すという貴殿の懸念も理解した。ならば、軍艦は徳川の管理下に置き、武器は必要最小限を残して新政府へ引き渡すという折衷案でどうだ。これで双方の懸念は払拭されよう。この条件で正式に合意し、書面に加筆して署名を進めるべきではないか。",
  ],
  [
    "異存なし。書面に残しましょう。他にはあるか？",
    "異存なしと申したな。ならば、これで主要な懸念は概ね解消された。あとは、城の明け渡しに伴う混乱を避けるため、新政府軍の江戸入城の時期と、その際の秩序維持についてだ。民を脅かさぬよう、厳格な規律を敷いてもらわねばならん。それが守られるなら、余は速やかに城を明け渡す準備に取り掛かろう。これで全てだ。",
  ],
  [
    "そのようで良いぞ。他にはない。",
    "承知した。これにて江戸の行く末と徳川の処遇、軍備の扱いについて合意が成った。貴殿の言葉を信じ、余は直ちに城内の者たちへ開城の準備を命じる。この書面が両者の誠意の証だ。江戸の民が平穏に暮らせるよう、貴殿も新政府軍の統制に全力を尽くしてくれ。",
  ],
  [
    "それね。勝さんから要望はあるか？",
    "徳川家臣たちの行く末だ。彼らが新政府において路頭に迷わぬよう、相応の職や生活の道を保証してほしい。徳川家自体も存続を許し、武士としての誇りを保てる処遇を望む。これらが満たされれば、余は安心して城を明け渡せる。",
  ],
  [
    "いいよ。それも書面に残しておきましょう。",
    "感謝する。家臣たちの生活と徳川家の存続、この二つが明記されれば、余も心置きなく城を明け渡すことができる。早速、書面にこの条項を書き加え、互いに署名を交わそうではないか。これで全ての懸念が払拭された。これ以上望むことはない。",
  ],
];

let reportedState = INITIAL_STATE;
const reportedMessages = [];
let reportedIntermediateSettlement;
for (const [index, [saigo, katsu]] of reportedTurns.entries()) {
  reportedState = evaluateMessage(saigo, reportedState, {}, katsu).state;
  reportedMessages.push({ role: "saigo", text: saigo }, { role: "katsu", text: katsu });
  if (index === 7) reportedIntermediateSettlement = evaluateSettlement(reportedState, reportedMessages);
}
assert.ok(!reportedIntermediateSettlement.blocking.includes("weapons"), "the first reported settlement must retain the weapon agreement");
assert.ok(!reportedIntermediateSettlement.blocking.includes("warships"), "the first reported settlement must retain the warship agreement");
for (const issue of ["weapons", "warships", "retainers", "tokugawa_house", "edo_castle", "public_order"]) {
  assert.ok(["tentatively_agreed", "agreed"].includes(reportedState.negotiationLedger[issue].status), `${issue} must be agreed in the reported play-test transcript`);
}
const reportedSettlement = evaluateSettlement(reportedState, reportedMessages);
assert.ok(!reportedSettlement.blocking.includes("weapons"), "weapon treatment must not be requested again after the reported agreement");
assert.ok(!reportedSettlement.blocking.includes("warships"), "warship treatment must not be requested again after the reported agreement");
assert.ok(!reportedSettlement.katsuResponse.includes("兵と軍艦を収めた後の者たち"), "the reported settlement loop must never recur");

const reportedStaleState = {
  ...reportedState,
  issues: Object.fromEntries(Object.keys(reportedState.issues).map((id) => [id, "conflicted"])),
  negotiationLedger: Object.fromEntries(Object.keys(reportedState.negotiationLedger).map((id) => [id, { status: "conflicted", events: [] }])),
};
const repairedReportedSettlement = evaluateSettlement(reportedStaleState, reportedMessages);
assert.ok(!repairedReportedSettlement.blocking.includes("weapons"), "a stale save must not restore the weapon loop");
assert.ok(!repairedReportedSettlement.blocking.includes("warships"), "a stale save must not restore the warship loop");

console.log("Edo 1868 ledger regression test passed");
