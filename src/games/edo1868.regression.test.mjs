import assert from "node:assert/strict";
import { INITIAL_STATE, evaluateMessage, evaluateSettlement, reduceNegotiationEvents } from "./edo1868.js";

const proposal = (actor, issueIds, terms, ref = "") => ({ type: "proposal_created", actor, issue_ids: issueIds, terms, target_proposal_id: ref, summary: terms });
const response = (actor, target, issueIds, result = "accept", commitment = "firm") => ({ type: "proposal_response", actor, target_proposal_id: target, issue_ids: issueIds, response: result, commitment, summary: `${target}への${result}` });

// Reducer unit test: a proposal is an event, and acceptance deterministically
// derives the issue state. No Japanese keyword is used to decide the result.
let state = { ...INITIAL_STATE, turns: 1 };
state = reduceNegotiationEvents(state, [
  proposal("saigo", ["warships", "weapons"], "軍艦は徳川の知見を活かして新政府と協調運用し、武器は段階的に引き渡す", "current_player_message"),
  response("katsu", "current_player_message", ["warships", "weapons"], "accept", "firm"),
], { playerText: "軍艦は協調運用、武器は段階的に引き渡す。", katsuText: "その条件で進めよう。" }).state;
assert.equal(state.issues.warships, "agreed");
assert.equal(state.issues.weapons, "agreed");
assert.equal(state.canonicalLedger.proposals.length, 1);
assert.equal(state.canonicalLedger.events.at(-1).evidence.text, "その条件で進めよう。");

// A terse affirmative is never judged by a regex. It is applied only because
// Gemini extracted an accept event that targets one explicit pending proposal.
state = { ...state, turns: 2 };
state = reduceNegotiationEvents(state, [
  proposal("katsu", ["retainers"], "旧幕臣に職と生活の道を用意する", "retainer-offer"),
], { playerText: "旧幕臣について聞かせてほしい。", katsuText: "職と生活の道を用意するならどうだ。" }).state;
const pendingRetainers = state.canonicalLedger.focus.primaryPendingProposalId;
assert.ok(pendingRetainers, "Katsu proposal must become the pending focus");
state = { ...state, turns: 3 };
state = reduceNegotiationEvents(state, [
  response("saigo", pendingRetainers, ["retainers"], "accept", "firm"),
], { playerText: "いいよ。それでいこう。", katsuText: "承知した。" }).state;
assert.equal(state.issues.retainers, "agreed");

// An unstructured response does not mutate the ledger, even when it contains
// the same short Japanese affirmative. False positives are forbidden.
const beforeInvalid = JSON.stringify(state.canonicalLedger);
const noMutation = reduceNegotiationEvents({ ...state, turns: 4 }, [], { playerText: "異存なし。", katsuText: "承知した。" }).state;
assert.equal(JSON.stringify(noMutation.canonicalLedger), beforeInvalid);

// Accepted conditions may only reopen through a causal event. A modification
// supersedes the former agreement and creates a new open proposal.
const warshipProposal = state.canonicalLedger.proposals.find((item) => item.issueIds.includes("warships"));
const modified = reduceNegotiationEvents({ ...state, turns: 5 }, [{
  type: "proposal_modified", actor: "saigo", target_proposal_id: warshipProposal.id,
  issue_ids: ["warships"], terms: "軍艦はすべて新政府へ引き渡す", summary: "軍艦条件を変更する",
}], { playerText: "やはり軍艦はすべて新政府へ引き渡してもらう。", katsuText: "その変更には異論がある。" }).state;
assert.equal(modified.canonicalLedger.proposals.find((item) => item.id === warshipProposal.id).status, "superseded");
assert.equal(modified.issues.warships, "proposed");

// Conditional agreements carry their dependency. The castle cannot become a
// firm resolution until the promised treatment of Yoshinobu is also accepted.
let conditionalState = { ...INITIAL_STATE, turns: 1 };
conditionalState = reduceNegotiationEvents(conditionalState, [
  proposal("saigo", ["edo_castle"], "慶喜公の安全が保証されるなら江戸城を明け渡す", "castle-terms"),
  response("katsu", "castle-terms", ["edo_castle"], "accept", "firm"),
], { playerText: "慶喜公の安全が保証されるなら城を明け渡す。", katsuText: "その条件なら城を渡そう。" }).state;
// Attach the dependency through a deterministic proposal-created event.
const castle = conditionalState.canonicalLedger.proposals[0];
castle.dependencies = ["yoshinobu"];
conditionalState = reduceNegotiationEvents({ ...conditionalState, turns: 2 }, [], { playerText: "", katsuText: "" }).state;
assert.equal(conditionalState.issues.edo_castle, "tentatively_agreed");
conditionalState = reduceNegotiationEvents({ ...conditionalState, turns: 3 }, [
  proposal("saigo", ["yoshinobu"], "慶喜公の身の安全を保証する", "yoshinobu-terms"),
  response("katsu", "yoshinobu-terms", ["yoshinobu"], "accept", "firm"),
], { playerText: "慶喜公の安全を保証する。", katsuText: "その約束を受け入れる。" }).state;
assert.equal(conditionalState.issues.edo_castle, "agreed");

// Settlement reads the canonical state only. Repeated settlement checks cannot
// reinterpret a transcript and reopen the previously accepted warship terms.
const settledState = { ...state, turns: 8, katsuAcceptance: 70, governmentAcceptance: 70, promiseCredibility: 70,
  issues: { ...state.issues, edo_castle: "agreed", tokugawa_house: "agreed", yoshinobu: "agreed", civilian_safety: "agreed", peaceful_transition: "agreed", public_order: "agreed" } };
const settlement = evaluateSettlement(settledState, []);
assert.ok(!settlement.blocking.includes("warships"));
assert.ok(!settlement.blocking.includes("weapons"));
assert.ok(!settlement.blocking.includes("retainers"));
assert.ok(!settlement.katsuResponse.includes("兵と軍艦を収めた後の者たち"));

// Regression: the 2026-09-21 play log. Katsu has explicitly accepted the
// written package, including Yoshinobu, the castle, the former retainers,
// weapons/warships, and public order. A later settlement request must not
// reinterpret any of those clauses as unresolved just because government-side
// feasibility is low. That is the second-stage outcome, not Katsu's answer.
const playLogIssueIds = ["edo_castle", "tokugawa_house", "yoshinobu", "weapons", "warships", "retainers", "civilian_safety", "peaceful_transition", "public_order"];
let playLogState = { ...INITIAL_STATE, turns: 9, katsuAcceptance: 55, governmentAcceptance: 18, promiseCredibility: 20, resistance: 40, militaryTension: 45 };
playLogState = reduceNegotiationEvents(playLogState, [
  proposal("saigo", playLogIssueIds, "徳川家の存続、慶喜公への手出し無用、旧幕臣の処遇、武器・軍艦の移管、市中秩序、無血開城を一枚の書面に記す", "written-package"),
  response("katsu", "written-package", playLogIssueIds, "accept", "firm"),
], {
  playerText: "無論だ。では良いな？",
  katsuText: "無論だ。これら全ての条件を記した書面に署名し、速やかに江戸城明け渡しの準備に取り掛かる。",
}).state;
assert.equal(playLogState.issues.yoshinobu, "agreed");
assert.equal(playLogState.issues.edo_castle, "agreed");
// No later event may reopen an accepted issue.
playLogState = reduceNegotiationEvents({ ...playLogState, turns: 10 }, [], {
  playerText: "決着を求める。",
  katsuText: "",
}).state;
assert.equal(playLogState.issues.yoshinobu, "agreed");
assert.equal(playLogState.issues.edo_castle, "agreed");
const playLogSettlement = evaluateSettlement(playLogState, []);
assert.equal(playLogSettlement.settlementResult, "ACCEPTED");
assert.equal(playLogSettlement.state.katsuSettlement, "accepted");
assert.ok(!playLogSettlement.blocking.includes("yoshinobu"));
assert.ok(!playLogSettlement.blocking.includes("edo_castle"));
assert.ok(!playLogSettlement.katsuResponse.includes("城を渡した後の江戸を、誰がどう静めるのか"));
assert.ok(playLogSettlement.reflection.some((line) => line.includes("徳川慶喜")));
assert.equal(playLogSettlement.state.governmentAcceptance, 18, "government feasibility is not allowed to reopen Katsu's agreement");

// Regression: a written confirmation in Katsu's own reply can cover several
// clauses at once. The model supplies this semantic event; the reducer does
// not search Japanese words to manufacture agreement. Missing clauses may
// still block settlement, but the confirmed castle/Yoshinobu clauses must not.
let writtenPackageState = { ...INITIAL_STATE, turns: 6, katsuAcceptance: 58, resistance: 40, militaryTension: 45 };
writtenPackageState = reduceNegotiationEvents(writtenPackageState, [{
  type: "agreement_confirmed", actor: "katsu",
  issue_ids: ["edo_castle", "tokugawa_house", "yoshinobu", "weapons", "warships", "retainers", "public_order"],
  commitment: "firm",
  terms: "江戸城の明け渡し、慶喜公への不問、旧幕臣の身分保障、武器と軍艦の扱い、市中秩序を一つの書面に記す",
  summary: "書面化する個別条件を双方で確認した",
}], {
  playerText: "異存はない。書いてくれ。",
  katsuText: "承知した。これまでの議論を全て書面に落とし込もう。江戸城の明け渡し、慶喜公の身分保障、旧幕臣の身分と武器の保持、これらを約定として記す。",
}).state;
assert.equal(writtenPackageState.issues.edo_castle, "agreed");
assert.equal(writtenPackageState.issues.yoshinobu, "agreed");
const writtenPackageSettlement = evaluateSettlement(writtenPackageState, []);
assert.ok(!writtenPackageSettlement.blocking.includes("edo_castle"));
assert.ok(!writtenPackageSettlement.blocking.includes("yoshinobu"));
assert.ok(!writtenPackageSettlement.katsuResponse.includes("城を渡した後の江戸を、誰がどう静めるのか"));

// Evaluation uses event output. The spoken response by itself can never create
// a hidden agreement; this is the JSON-invalid / event-missing failure-safe.
const evaluated = evaluateMessage("いいよ", INITIAL_STATE, {}, "承知した。その条件で進めよう。", []);
assert.equal(evaluated.state.issues.warships, "unresolved");

console.log("Edo 1868 event-sourced ledger regression test passed");
