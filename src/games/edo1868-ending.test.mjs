import assert from 'node:assert/strict';
import { ENDINGS, INITIAL_STATE, NEGOTIATION_ISSUES, reduceNegotiationEvents, evaluateSettlement, determineGovernmentOutcome } from './edo1868.js';
import { createEndingRun, createSettlementSnapshot, restoreCompletedRun } from './edo1868-ending.js';

const terms = '新政府の承認後に城を段階的に明け渡す。武器・軍艦の管理と移管、徳川家の存続と慶喜の助命、恭順した旧幕臣の再出発、海軍関係者の技術活用、市中の治安維持、双方の連絡役による衝突防止を約する。';
const messages = [{ role: 'saigo', text: terms }, { role: 'katsu', text: 'その条件で書面に記そう。' }];
const discoveries = [{ id: 'note', title: '旧幕臣', text: '勝は幕臣の生活を気にしていた。' }];
const agreed = reduceNegotiationEvents({ ...INITIAL_STATE, turns: 4, governmentAcceptance: 90, promiseCredibility: 90 }, [{ type: 'agreement_confirmed', actor: 'katsu', issue_ids: Object.keys(NEGOTIATION_ISSUES), terms, commitment: 'firm' }], { playerText: messages[0].text, katsuText: messages[1].text }).state;
const settled = evaluateSettlement(agreed, messages);
assert.equal(settled.settlementResult, 'ACCEPTED');
assert.equal(determineGovernmentOutcome(settled.state), 'empty_promises', 'unstructured old agreements require clarification');
const endingId = 'bloodless';
const run = createEndingRun({ endingId, state: settled.state, messages, discoveries, legacy: true });
assert.equal(run.settlementSnapshot.governmentAccepted, true);
assert.equal(run.settlementSnapshot.acceptedTerms[0].terms, terms);
assert.match(run.endingNarrative, /新政府も、その約定を承認した/);
assert.match(run.endingNarrative, /総攻撃の命令は取り下げられた/);
assert.match(run.endingNarrative, /残る約束は、それぞれの時期や条件に従って/);
assert.ok(run.endingNarrative.includes(`「${terms}」`));
assert.doesNotMatch(run.endingNarrative, /履行された|武装解除された|雇用された|反実仮想|史実/);
assert.ok(Object.isFrozen(run.settlementSnapshot.acceptedTerms[0]));
const before = JSON.stringify(run);
messages[0].text = '新しいプレイ'; discoveries[0].text = '新しいノート';
assert.equal(JSON.stringify(run), before);
assert.notEqual(createEndingRun({ endingId, state: settled.state, messages, discoveries }).id, run.id);
assert.deepEqual(restoreCompletedRun(JSON.parse(before)), run);

const partial = structuredClone(settled.state);
partial.canonicalLedger.proposals[0].revokedIssueIds = ['warships'];
const partialSnapshot = createSettlementSnapshot(endingId, partial);
assert.equal(partialSnapshot.acceptedTerms[0].quoted, false);
assert.ok(!partialSnapshot.acceptedTerms[0].issueIds.includes('warships'));
assert.ok(!partialSnapshot.acceptedTerms[0].terms.includes('軍艦'));
partial.canonicalLedger.proposals.push({ id: 'open', issueIds: ['warships'], terms: '全艦を永遠に温存', status: 'open' });
assert.ok(!createSettlementSnapshot(endingId, partial).acceptedTerms.some(t => t.terms.includes('永遠')));
partial.canonicalLedger.proposals[0].acceptance.commitment = 'conditional';
partial.canonicalLedger.proposals[0].dependencies = ['edo_castle'];
assert.equal(createSettlementSnapshot(endingId, partial).fulfillmentConditions.length, 2);

for (const id of Object.keys(ENDINGS)) {
  const saved = restoreCompletedRun({ endingId: id, conversationHistory: run.conversationHistory, discoveredInformation: run.discoveredInformation, completedAt: '2026-09-23T00:00:00Z' });
  assert.ok(saved.id);
  assert.match(saved.endingNarrative, /勝海舟/);
  assert.match(saved.endingNarrative, /新政府/);
  assert.match(saved.endingNarrative, /江戸|町/);
  assert.match(saved.endingNarrative, /あなた/);
  assert.doesNotMatch(saved.endingNarrative, /反実仮想|史実/);
  assert.equal(saved.settlementSnapshot.acceptedTerms.length, 0);
  assert.equal(saved.completedAt, '2026-09-23T00:00:00Z');
}
assert.equal(ENDINGS.alternative_peace.title, '歴史にない和平');
for (const value of [null, {}, { endingId: 'toString', conversationHistory: [], discoveredInformation: [] }, { ...run, conversationHistory: [null] }]) assert.equal(restoreCompletedRun(value), null);
const rejected = createEndingRun({ endingId: 'empty_promises', state: settled.state, messages, discoveries });
assert.equal(rejected.settlementSnapshot.katsuAccepted, true);
assert.equal(rejected.settlementSnapshot.governmentAccepted, false);
assert.match(rejected.endingNarrative, /承認しなかった/);
console.log('Ending snapshot, all 8 narratives, migration, immutability and replay-isolation tests passed');

const oldRun = { ...run, version: 1 };
assert.equal(restoreCompletedRun(oldRun, settled.state).settlementSnapshot.acceptedTerms[0].terms, terms);
