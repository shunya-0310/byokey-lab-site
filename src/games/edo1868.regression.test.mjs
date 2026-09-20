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

console.log("Edo 1868 ledger regression test passed");
