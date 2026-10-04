import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INITIAL_STATE, ENDINGS, ENDING_RATINGS, endingStars, evaluateSettlement, reduceNegotiationEvents, determineGovernmentOutcome, submitGovernmentReview, canContinueNegotiation } from './edo1868.js';
import { reviewGovernment, activeClauses } from './edo1868-clauses.js';
import { createEndingRun, restoreCompletedRun, describeAgreedTerms } from './edo1868-ending.js';
import { humanSuccessClauses, humanOverpromiseClauses, ceasefireClauses, openTalk, finishTalk, fiveEndingStates } from './edo1868-ratings.fixtures.mjs';
import { clause, fragilePeaceClauses } from './edo1868.fixtures.mjs';
const cases=fiveEndingStates();
const labels={bloodless:['江戸無血開城',5],fragile_handover:['和平成立',4],ceasefire:['停戦成立',3],empty_promises:['空手形',2],breakdown:['交渉決裂',1]};
for(const [id,state]of Object.entries(cases)){
 assert.equal(ENDINGS[id].title,labels[id][0]);assert.equal(ENDING_RATINGS[id],labels[id][1]);assert.equal(endingStars(id).length,5);
 if(id==='breakdown'){assert.equal(state.katsuSettlement,'breakdown');assert.equal(reviewGovernment(state).status,'not_submitted');assert.equal(determineGovernmentOutcome(state),'');}
 else assert.equal(determineGovernmentOutcome(state),id);
 assert.equal(canContinueNegotiation(state),false);
 assert.equal(reduceNegotiationEvents(state,[]).validationCode,'negotiation_closed');
 const record=createEndingRun({endingId:id,state,messages:[],discoveries:[]});
 assert.equal(record.stars,labels[id][1]);assert.equal(restoreCompletedRun(record).endingId,id);assert.equal(restoreCompletedRun(record).id,record.id);
 assert.ok(Object.isFrozen(record.settlementSnapshot));
 assert.doesNotMatch(record.endingNarrative,/fleet_|clauseId|blocking|uncertainty|★5に|修正して/);
 if(id==='ceasefire'){assert.equal(record.settlementSnapshot.governmentAccepted,true);assert.match(record.endingNarrative,/一日を救った/);assert.doesNotMatch(record.endingNarrative,/引渡し.*始まった|総攻撃の命令は取り下げられた/);}
}
assert.equal(cases.ceasefire.settlementScope,'ceasefire');
assert.notEqual(cases.ceasefire.issues.edo_castle,'agreed');
assert.equal(submitGovernmentReview(cases.ceasefire),cases.ceasefire,'No second review or renegotiation');
assert.equal(evaluateSettlement(cases.ceasefire).settlementResult,'ACCEPTED');
assert.doesNotMatch(evaluateSettlement(cases.ceasefire).katsuResponse,/城.*明け渡/);
// Incomplete peace is not a government rejection of dangerous promises.
const cancelOnly=structuredClone(ceasefireClauses);cancelOnly[0].facts[0].value='cancelled';
assert.equal(determineGovernmentOutcome(finishTalk(cancelOnly)),'ceasefire');
const postponed=structuredClone(humanSuccessClauses);postponed.find(c=>c.facts.some(f=>f.dimension==='assault')).facts.find(f=>f.dimension==='assault').value='postponed';
assert.equal(determineGovernmentOutcome(finishTalk(postponed)),'ceasefire');
assert.equal(determineGovernmentOutcome(finishTalk(humanSuccessClauses)),'bloodless','Court reservation is not a downgrade');
// One-sided and conditional stopping offers must not be promoted to final acceptance.
const oneSided=reduceNegotiationEvents(INITIAL_STATE,[{type:'proposal_created',actor:'saigo',issue_ids:['peaceful_transition'],terms:ceasefireClauses[0].text,clauses:ceasefireClauses}],{playerText:ceasefireClauses[0].text,katsuText:'まだ同意はできない。'}).state;
assert.equal(evaluateSettlement(oneSided).settlementResult,'NOT_READY');
const conditional=structuredClone(openTalk(ceasefireClauses));conditional.canonicalLedger.proposals[0].acceptance.commitment='conditional';conditional.canonicalLedger.proposals[0].dependencies=['edo_castle'];
assert.equal(evaluateSettlement(conditional).settlementResult,'NOT_READY');
const dependent=structuredClone(openTalk(ceasefireClauses));dependent.canonicalLedger.proposals[0].clauses[0].dependencies=['missing-clause'];
assert.equal(evaluateSettlement(dependent).settlementResult,'NOT_READY');
// An explicit dangerous obligation remains blocking even with a stopping promise.
assert.equal(determineGovernmentOutcome(finishTalk([...humanOverpromiseClauses,...ceasefireClauses])),'empty_promises');
for(const bad of [clause('市民への危害を認める。',{civilians:'threatened'},['civilian_safety']),clause('武器を自由に用いてよい。',{weapons:'unrestricted'},['weapons'])])assert.equal(determineGovernmentOutcome(finishTalk([...ceasefireClauses,bad])),'empty_promises');
// Several administrative uncertainties do not turn peace into a ceasefire.
const admin=structuredClone(fragilePeaceClauses);
for(const c of admin){c.facts=c.facts.filter(f=>!['land','yoshinobu','authority'].includes(f.dimension));c.approval_authority='unknown';}
const withManyNotes=finishTalk(admin);assert.ok(withManyNotes.governmentReview.findings.length>cases.fragile_handover.governmentReview.findings.length);assert.equal(determineGovernmentOutcome(withManyNotes),'fragile_handover');
// Alternate solutions: direct government command/custody, or shared command
// with use restrictions. Neither requires the fleet_oversight attribute.
for(const mode of ['government','joint']){
 const variant=structuredClone(humanSuccessClauses).filter(c=>!c.facts.some(f=>f.dimension==='fleet_oversight'));
 for(const c of variant)for(const f of c.facts)if(['fleet_command','fleet_custody'].includes(f.dimension)&&f.phase!=='final')f.value=mode;
 if(mode==='government')for(const c of variant)c.facts=c.facts.filter(f=>f.dimension!=='fleet_use');
 const result=finishTalk(variant);assert.equal(determineGovernmentOutcome(result),'bloodless');
 assert.ok(!activeClauses(result.canonicalLedger).some(c=>c.facts.some(f=>f.dimension==='fleet_oversight')));
}
for(const text of ['引渡しまでは双方で共同警備し、定めた日に新政府へ引き継ぐ。','地区と消防・警備の役割を分担し、期限を定めて新政府へ治安の責任を移す。']){
 const variant=structuredClone(humanSuccessClauses);const c=variant.find(c=>c.facts.some(f=>f.dimension==='order'));c.text=text;c.source_quote=text;c.facts.forEach(f=>f.quote=text);
 assert.equal(determineGovernmentOutcome(finishTalk(variant)),'bloodless');
}
// Minor omitted detail must not be a checklist penalty; material uncertainty is.
const detail=structuredClone(humanSuccessClauses);for(const c of detail)c.facts=c.facts.filter(f=>f.dimension!=='civilians');
assert.equal(determineGovernmentOutcome(finishTalk(detail)),'bloodless');
const original=createEndingRun({endingId:'fragile_handover',state:cases.fragile_handover,messages:[],discoveries:[]});
const saved={...original,endingTitle:'薄氷の和平'};delete saved.stars;
const restored=restoreCompletedRun(saved,cases.bloodless);assert.equal(restored.endingId,'fragile_handover');assert.equal(restored.endingTitle,'和平成立');assert.equal(restored.stars,4);assert.deepEqual(restored.settlementSnapshot,original.settlementSnapshot);
for(const id of ['alternative_peace','unfinished','assault','scorched'])assert.equal(restoreCompletedRun({endingId:id,conversationHistory:[],discoveredInformation:[]}).endingId,id);
assert.ok(describeAgreedTerms(original.settlementSnapshot).length);
console.log('Five historical outcomes, independent ceasefire acceptance, multiple executable solutions, qualitative risks, privacy and legacy saves passed.');

const actual=JSON.parse(fs.readFileSync(new URL('./fixtures/edo-2026-10-04-overpromise.json',import.meta.url),'utf8'));
const untouched=JSON.stringify(actual);
assert.equal(reviewGovernment(actual).outcome,'empty_promises');
assert.equal(ENDING_RATINGS[reviewGovernment(actual).outcome],2);
assert.equal(submitGovernmentReview(actual),actual,'Never rejudge a saved government review');
const actualRun=createEndingRun({endingId:'empty_promises',state:actual,messages:[],discoveries:[]});
assert.equal(actualRun.stars,2);
assert.equal(JSON.stringify(actual),untouched);
console.log('Actual October 4 human overpromise export remains two-star empty promises.');
