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

// Regression: an immediate settlement request after merely asking what should
// be discussed is correctly declined, but must not fabricate a specific
// unresolved agreement such as post-surrender public order.
const orientationState = reduceNegotiationEvents(INITIAL_STATE, [
  proposal("katsu", ["edo_castle", "tokugawa_house", "yoshinobu", "retainers", "warships", "civilian_safety", "public_order"], "江戸城明け渡し、慶喜の処遇、徳川家存続、旧幕臣の処遇、軍艦の扱い、市民の安全と治安維持の履行手順と権限の明確化"),
], {
  playerText: "決めるべきことがなにか、まずは確認しよう。",
  katsuText: "まずは徳川慶喜公の処遇、江戸城の明け渡し、そして旧幕臣たちの身の振り方だ。",
}).state;
const orientationSettlement = evaluateSettlement(orientationState, []);
assert.equal(orientationSettlement.settlementResult, "NOT_READY");
assert.ok(orientationSettlement.katsuResponse.includes("まだ互いの条件を一つも約していない"));
assert.ok(!orientationSettlement.katsuResponse.includes("城を渡した後の江戸を、誰がどう静めるのか"));
assert.ok(!orientationSettlement.reflection.some((line) => line.includes("ここまでに交わした条件")));

console.log("Edo 1868 event-sourced ledger regression test passed");

// Production transport regression: response normalization must preserve targets
// AND dependencies when the reducer receives the already-normalized events.
const { requestKatsuResponse, determineGovernmentOutcome, createCompletedRun, NEGOTIATION_ISSUES } = await import('./edo1868.js');
const originalFetch = globalThis.fetch;
let requestCount = 0;
const validity = { government_acceptance: 80, promise_credibility: 80, internal_consistency: 80, approval_mode: 'pending_approval' };
let payload = {
  spoken_response: '慶喜公の助命、徳川家の存続、幕臣の再就職、そして江戸の治安と武器・軍艦の段階的な移管。これらを約定として書面に記すことに異存はない。貴公が新政府の承認を取り付けるまで、私は江戸の秩序を守り、軍を動かさぬ。これにて、この場での合意事項とする。',
  expression: 'serious', discovered_information: [], settlement_validity: validity,
  events: [proposal('saigo', Object.keys(NEGOTIATION_ISSUES), '城の明け渡しまで勝側が治安を維持し双方の区域と役目を定める。受領後は新政府へ移管する。武器と軍艦は数量を確認し段階移管する。慶喜助命、徳川家存続、幕臣再就職と無血開城を政府承認条件の書面にする。', 'current_player_message'), response('katsu', 'current_player_message', Object.keys(NEGOTIATION_ISSUES))],
};
const reportedPlayer = '城の明け渡しまでの市中の治安は、勝さんたちに維持してもらいたい。ただし新政府軍と連絡を取り、双方の軍勢が不用意に接触せぬよう区域と役目を定める。城を受け取った後は新政府が治安維持を引き継ぐ。武器・軍艦は数量を双方で確認し、順次、新政府の管理へ移す。移管が終わるまでは勝手に動かさず、戦に用いない。';
try {
  globalThis.fetch = async (_url, options) => {
    requestCount++;
    assert.ok(JSON.parse(options.body).generationConfig.responseJsonSchema);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }], usageMetadata: {} }) };
  };
  const result = await requestKatsuResponse({ apiKey: 'test-only', model: 'fixture', messages: [{ role: 'saigo', text: reportedPlayer }], state: INITIAL_STATE });
  assert.equal(requestCount, 1);
  const throughTransport = evaluateMessage(reportedPlayer, INITIAL_STATE, result.semantic, result.spokenResponse, result.events).state;
  Object.values(throughTransport.issues).forEach(status => assert.equal(status, 'agreed'));
  let final = evaluateSettlement(throughTransport);
  assert.equal(final.settlementResult, 'ACCEPTED');
  assert.deepEqual(final.blocking, []);
  assert.ok(!final.katsuResponse.includes('具体の筋が見えない'));
  for (let i = 0; i < 8; i++) final = evaluateSettlement(final.state);
  assert.equal(final.settlementResult, 'ACCEPTED', 'Accepted settlement is idempotent');
  assert.equal(determineGovernmentOutcome({ ...final.state, governmentAcceptance: 10 }), 'empty_promises');
  assert.equal(determineGovernmentOutcome({ ...final.state, settlementValidity: { ...validity, internal_consistency: 20 } }), 'empty_promises');
  assert.equal(determineGovernmentOutcome({ ...INITIAL_STATE, governmentAcceptance: 100, promiseCredibility: 100 }), '', 'Government cannot end an unaccepted talk');

  payload = { ...payload, spoken_response: '慶喜公の命が守られるなら城を渡そう。', events: [{ ...proposal('saigo', ['edo_castle'], '慶喜公の助命を条件に城を渡す', 'current_player_message'), depends_on_issue_ids: ['yoshinobu'] }, response('katsu', 'current_player_message', ['edo_castle'], 'accept', 'conditional')] };
  const conditionalResponse = await requestKatsuResponse({ apiKey: 'test-only', model: 'fixture', messages: [{ role: 'saigo', text: '慶喜助命を条件に城を渡す。' }], state: INITIAL_STATE });
  const dependent = evaluateMessage('慶喜助命を条件に城を渡す。', INITIAL_STATE, {}, conditionalResponse.spokenResponse, conditionalResponse.events).state;
  assert.equal(dependent.issues.edo_castle, 'tentatively_agreed');
  assert.deepEqual(dependent.canonicalLedger.proposals[0].dependencies, ['yoshinobu']);
  const fulfilled = reduceNegotiationEvents({ ...dependent, turns: 2 }, [proposal('saigo', ['yoshinobu'], '慶喜公の生命を保証する', 'life'), response('katsu', 'life', ['yoshinobu'])], { playerText: '慶喜公の命は保証する。', katsuText: 'それなら異存はない。' }).state;
  assert.equal(fulfilled.issues.edo_castle, 'agreed');
  const withdrawn = reduceNegotiationEvents(fulfilled, [{ type: 'proposal_withdrawn', actor: 'saigo', target_proposal_id: fulfilled.canonicalLedger.proposals[1].id }], { playerText: '先ほどの助命条件を撤回する。' }).state;
  assert.equal(withdrawn.issues.yoshinobu, 'unresolved');
  assert.equal(withdrawn.issues.edo_castle, 'tentatively_agreed');

  payload = { ...payload, events: [payload.events[0], { type: 'not-an-event' }] };
  const countBefore = requestCount;
  await assert.rejects(requestKatsuResponse({ apiKey: 'test-only', model: 'fixture', messages: [], state: INITIAL_STATE }), /JSON/);
  assert.equal(requestCount, countBefore + 1, 'Invalid response must not trigger a hidden second request');
} finally { globalThis.fetch = originalFetch; }

let ambiguous = reduceNegotiationEvents(INITIAL_STATE, [proposal('katsu', ['warships'], '軍艦を徳川に残す', 'ships'), proposal('katsu', ['weapons'], '武器は共同で管理する', 'arms')], { katsuText: '軍艦と武器について二つの別案を提示する。' }).state;
const ambiguousResult = reduceNegotiationEvents(ambiguous, [response('saigo', '', [], 'accept')], { playerText: 'いいだろう。' });
assert.equal(JSON.stringify(ambiguousResult.state.canonicalLedger.proposals), JSON.stringify(ambiguous.canonicalLedger.proposals));
assert.equal(ambiguousResult.applied.length, 0);
const rejectedBatch = reduceNegotiationEvents(INITIAL_STATE, [proposal('saigo', ['warships'], '軍艦を移管する', 'ships'), response('katsu', 'ships', ['warships'])], { playerText: '軍艦を移管してほしい。', katsuText: 'その条件は認められない。' });
assert.equal(rejectedBatch.state.canonicalLedger.proposals.length, 0, 'Semantic validation failure rolls back the entire batch');

const sourceMessages = [{ role: 'saigo', text: '異存はない。' }];
const sourceNotes = [{ id: 'test', title: '記録', text: '獲得した情報だけ' }];
const snapshot = createCompletedRun({ endingId: 'empty_promises', messages: sourceMessages, discoveries: sourceNotes });
sourceMessages[0].text = '次のゲーム'; sourceNotes.push({ id: 'new' });
assert.equal(snapshot.conversationHistory[0].text, '異存はない。');
assert.equal(snapshot.discoveredInformation.length, 1);
assert.ok(Object.isFrozen(snapshot.conversationHistory[0]));
console.log('Production transport, government phase, dependency, validation and snapshot regressions passed');
const refusalWithoutOffer = reduceNegotiationEvents(playLogState, [response('katsu', 'current_player_message', ['weapons'], 'reject')], { playerText: 'これ以上は話さぬ。', katsuText: 'その姿勢では応じられぬ。' });
assert.equal(refusalWithoutOffer.applied[0].type, 'reservation');
assert.equal(refusalWithoutOffer.state.issues.weapons, 'agreed');
assert.deepEqual(refusalWithoutOffer.state.canonicalLedger.proposals, playLogState.canonicalLedger.proposals);
let repeatedAgreement = reduceNegotiationEvents(playLogState, [{type:'agreement_confirmed',actor:'katsu',issue_ids:['warships'],terms:'軍艦を段階的に新政府へ移す条件を再確認する',commitment:'firm'}], {playerText:'軍艦の条項を再確認しよう。',katsuText:'軍艦の段階移管に異存はない。'}).state;
const latestShips=repeatedAgreement.canonicalLedger.proposals.at(-1).id;
repeatedAgreement=reduceNegotiationEvents(repeatedAgreement,[{type:'proposal_withdrawn',actor:'saigo',target_proposal_id:latestShips}],{playerText:'先ほどの軍艦の条件は撤回する。'}).state;
assert.equal(repeatedAgreement.issues.warships,'unresolved','An older written confirmation must not resurrect a withdrawn clause');
assert.equal(repeatedAgreement.issues.weapons,'agreed','Other clauses remain locked');
