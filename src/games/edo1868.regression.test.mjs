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

console.log("Edo 1868 ledger regression test passed");
