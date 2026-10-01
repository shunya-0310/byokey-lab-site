import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INITIAL_STATE, requestKatsuResponse, evaluateMessage, evaluateSettlement, submitGovernmentReview, canContinueNegotiation } from './edo1868.js';
import { FLEET_DIMENSIONS, compileUpdates, activeClauses, materializeClauseEvidence, reviewGovernment } from './edo1868-clauses.js';
import { agreedState, overpromiseClauses } from './edo1868.fixtures.mjs';
import { createEndingRun } from './edo1868-ending.js';

const captured=JSON.parse(fs.readFileSync(new URL('./fixtures/edo-2026-10-01-play.json',import.meta.url),'utf8'));
const original=JSON.stringify(captured);
const actual={...structuredClone(INITIAL_STATE),...structuredClone(captured)};
const broken=reviewGovernment(actual);
assert.equal(broken.outcome,'fragile_handover');
assert.deepEqual(broken.findings,captured.governmentReview.findings);
assert.deepEqual(broken.findings.map(f=>[f.code,f.clauseIds]),[['fleet_control',['proposal-004-006:c1']]]);
const ship=activeClauses(actual.canonicalLedger).find(c=>c.id==='proposal-004-006:c1');
assert.ok(!ship.facts.some(f=>f.dimension==='fleet_oversight'));
assert.deepEqual(broken.snapshot,captured.governmentReview.snapshot);

// Causal counterfactual only: not a production migration of completed runs.
const counterfactual=structuredClone(actual);
counterfactual.canonicalLedger.proposals.find(p=>p.id===ship.proposalId).clauses[0].facts.push({dimension:'fleet_oversight',value:'joint',phase:'interim',quote:ship.source.quote});
assert.deepEqual(reviewGovernment(counterfactual).findings,[]);
assert.equal(reviewGovernment(counterfactual).outcome,'bloodless');

// Human-reviewed mock extraction of the actual player's words; NOT a recorded
// or newly generated Gemini response. Exercise the real transport + reducer.
const player=ship.source.quote;
const response='西郷さん、その条件で合意しよう。';
const emptyReview=()=>Object.fromEntries(FLEET_DIMENSIONS.map(d=>[d,[]]));
function roleClause(d,value,phase,excerpt){
 const c={text:excerpt,issue_ids:['warships'],source_ref:'current_player_message',subject:'軍艦',obligor:'双方',scope:excerpt,duration:'unknown',funding:'unknown',approval_authority:'unknown',dependency_clause_ids:[],facts:[],fleet_review:emptyReview()};
 c.fleet_review[d]=[{value,phase,source_ref:'current_player_message',source_excerpt:excerpt,text_excerpt:excerpt}];
 return c;
}
const clauses=[
 roleClause('fleet_custody','katsu','interim','それまでの間は勝さんが責任を持って管理し'),
 roleClause('fleet_oversight','joint','interim','新政府からも立会人を出して双方で監督する。'),
 roleClause('fleet_use','prohibited','interim','引渡しまで出航と戦闘を禁ずる。'),
 roleClause('fleet_transfer','scheduled','interim','軍艦は江戸城の明け渡しに合わせて新政府へ正式に引き渡してもらいたい。'),
 roleClause('fleet_command','government','final','指揮権と管理権を新政府へ移す。'),
 roleClause('fleet_custody','government','final','指揮権と管理権を新政府へ移す。'),
];
const preceding=actual.canonicalLedger.proposals.find(p=>p.id==='proposal-003-005');
const employmentText='乗組員についても、恭順する者はその経験と技量を見て、新しい海軍で力を生かす道を検討したい。ただし、全員の任用を保証するものではなか。';
clauses.push({text:employmentText,issue_ids:['retainers'],source_ref:'current_player_message',subject:'乗組員',obligor:'新政府',scope:employmentText,duration:'unknown',funding:'unknown',approval_authority:'submit_for_approval',dependency_clause_ids:[],facts:[{kind:'employment:selection',phase:'final',source_ref:'current_player_message'}],fleet_review:emptyReview()});
const rawEvents=[{target:preceding.id,agreement_status:'mutual',commitment:'firm',changed_clause_ids:[preceding.clauses[0].id],issue_ids:['warships'],terms:ship.text,clauses}];
// Reconstruct turn 3 from the saved ledger; replay the turn-4 revision, then
// the saved turn-5 final promise. Never reopen a completed game in production.
const before={...structuredClone(actual),katsuSettlement:'not_requested',governmentReview:null,governmentReviewHistory:[],endingId:''};
before.turns=3;
before.canonicalLedger.proposals=before.canonicalLedger.proposals.filter(p=>p.createdTurn<4);
before.canonicalLedger.proposals.find(p=>p.id===preceding.id).revokedClauseIds=[];
before.canonicalLedger.nextProposalNumber=6;
const beforeJSON=JSON.stringify(before);
const realFetch=globalThis.fetch;
let calls=0,payload={events:rawEvents,spoken_response:response,expression:'serious',discovered_information:[],settlement_validity:{government_acceptance:80,promise_credibility:80,internal_consistency:80,approval_mode:'pending_approval'}};
try {
 globalThis.fetch=async (_url,options)=>{calls++;const schema=JSON.parse(options.body).generationConfig.responseJsonSchema;assert.ok(schema.properties.events.items.properties.clauses.items.required.includes('fleet_review'));return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(payload)}]}}],usageMetadata:{}})};};
 const result=await requestKatsuResponse({apiKey:'test-only',model:'fixture',messages:[{role:'saigo',text:player}],state:before});
 assert.equal(calls,1);
 const applied=evaluateMessage(player,before,result.semantic,result.spokenResponse,result.events);
 assert.equal(applied.validationError,undefined);
 const last=actual.canonicalLedger.proposals.find(p=>p.id==='proposal-005-007').clauses[0];
 const finalClause={text:last.text,issue_ids:last.issueIds,source_ref:'current_katsu_response',subject:last.subject,obligor:last.obligor,scope:last.scope,duration:last.duration,funding:last.funding,approval_authority:last.approvalAuthority,dependency_clause_ids:last.dependencies,facts:last.facts.map(f=>({kind:`${f.dimension}:${f.value}`,phase:f.phase,source_ref:'current_katsu_response'})),fleet_review:emptyReview()};
 const finalEvents=materializeClauseEvidence(compileUpdates([{target:'new',agreement_status:'mutual',commitment:'firm',changed_clause_ids:[],issue_ids:last.issueIds,terms:last.text,clauses:[finalClause]}]),last.text,last.source.quote,{requireFleetReview:true});
 const lastApplied=evaluateMessage(last.text,applied.state,{},last.source.quote,finalEvents);
 const final=evaluateSettlement(lastApplied.state);
 assert.equal(final.settlementResult,'ACCEPTED');
 const reviewed=submitGovernmentReview(final.state);
 assert.equal(reviewed.governmentReview.status,'approved',JSON.stringify(reviewed.governmentReview.findings));
 assert.deepEqual(reviewed.governmentReview.findings,[]);
 assert.equal(reviewed.governmentReview.outcome,'bloodless');
 assert.equal(canContinueNegotiation(reviewed),false);
 const saved=activeClauses(reviewed.canonicalLedger);
 const oversight=saved.find(c=>c.facts.some(f=>f.dimension==='fleet_oversight'));
 assert.equal(oversight.version,preceding.clauses[0].version+1);
 assert.deepEqual(oversight.supersedes,[preceding.clauses[0].id]);
 assert.ok(oversight.facts.some(f=>f.dimension==='fleet_oversight'&&f.value==='joint'&&f.textEvidence===clauses[1].text));
 assert.ok(saved.some(c=>c.facts.some(f=>f.dimension==='employment'&&f.value==='selection')),'Selective crew employment survives');
 assert.ok(saved.some(c=>c.facts.some(f=>f.dimension==='fleet_custody'&&f.value==='katsu'&&f.phase==='interim')));
 const run=createEndingRun({endingId:'bloodless',state:reviewed,messages:captured.messages,discoveries:[]});
 assert.equal(run.endingId,'bloodless');
 // Contradictory and missing role evidence must fail atomically, with no retry.
 for(const mutate of [
  c=>{delete c.fleet_review;},
  c=>{c.fleet_review.fleet_oversight[0].source_excerpt='発言していない根拠';},
  c=>{c.fleet_review.fleet_oversight[0].text_excerpt='条項にない根拠';},
  c=>{c.facts=[{kind:'fleet_oversight:none',phase:'interim',source_ref:'current_player_message'}];},
  c=>{c.fleet_review.fleet_oversight.push({...c.fleet_review.fleet_oversight[0],value:'none'});},
 ]){
  payload=structuredClone(payload);payload.events=structuredClone(rawEvents);mutate(payload.events[0].clauses[1]);
  const count=calls;
  await assert.rejects(requestKatsuResponse({apiKey:'test-only',model:'fixture',messages:[{role:'saigo',text:player}],state:before}),/整合性/);
  assert.equal(calls,count+1);
  assert.equal(JSON.stringify(before),beforeJSON);
 }
}finally{globalThis.fetch=realFetch;}

// Evidence is structured semantics, never a keyword matcher or a custody alias.
for(const text of ['双方で監督する','新政府の立会人を出して双方で監督する','共同監視下','両陣営の担当者が運用を見届ける']){
 const c=roleClause('fleet_oversight','joint','interim',text);
 const facts=materializeClauseEvidence([{clauses:[c]}],text,'',{requireFleetReview:true})[0].clauses[0].facts;
 assert.deepEqual(facts.map(f=>[f.dimension,f.value]),[['fleet_oversight','joint']]);
}
for(const [value,text] of [['unknown','監督の仕組みは後で協議する'],['none','双方で監督する案は採用しない']]){
 const c=roleClause('fleet_oversight',value,'interim',text);
 const facts=materializeClauseEvidence([{clauses:[c]}],text,'',{requireFleetReview:true})[0].clauses[0].facts;
 const uncertain=structuredClone(counterfactual);
 uncertain.canonicalLedger.proposals.find(p=>p.id===ship.proposalId).clauses[0].facts=ship.facts.concat(facts);
 assert.equal(reviewGovernment(uncertain).outcome,'fragile_handover');
}
assert.equal(reviewGovernment(agreedState(overpromiseClauses)).outcome,'empty_promises');
assert.equal(canContinueNegotiation(actual),false);
assert.equal(submitGovernmentReview(actual).governmentReview.outcome,'fragile_handover','Completed saved review is immutable');
assert.equal(JSON.stringify(captured),original);
console.log('Actual play fixture, evidence compilation, contradiction rejection, version inheritance, genuine uncertainty and overpromise regressions passed (mock transport only).');
