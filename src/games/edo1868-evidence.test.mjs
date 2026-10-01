import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchCitation,materializeClauseEvidence,FLEET_DIMENSIONS,activeClauses } from './edo1868-clauses.js';
import { reduceNegotiationEvents } from './edo1868.js';
import { agreedState,peaceClauses,clause } from './edo1868.fixtures.mjs';
const player=fs.readFileSync(new URL('./fixtures/edo-fleet-player-message.txt',import.meta.url),'utf8');
const exact='双方の監視下で共同して軍艦を監督し、**艦船と武器・弾薬の目録を作り、武装を封印する。';
const plain=exact.replaceAll('**','');
function raw(){return {text:plain,source_ref:'current_player_message',facts:[{kind:'fleet_oversight:joint',phase:'interim',source_ref:'current_player_message'}],fleet_review:{...Object.fromEntries(FLEET_DIMENSIONS.map(d=>[d,[]])),fleet_oversight:[{value:'joint',phase:'interim',source_ref:'current_player_message',source_excerpt:exact,text_excerpt:plain}]}};}
function convert(c,source=player){const diagnostics=[];const result=materializeClauseEvidence([{clauses:[c]}],source,'',{diagnostics})[0].clauses[0];return {result,diagnostics};}
for(const excerpt of [exact,plain,plain.replace('共同して','共同  して').replace('監督し、','監督し、\r\n　')]){
 const c=raw();c.fleet_review.fleet_oversight[0].source_excerpt=excerpt;
 const {result,diagnostics}=convert(c);
 assert.equal(result.source_quote,player);
 assert.equal(result.facts[0].quote,exact,'Evidence remains a literal span of the original, including Markdown');
 assert.equal(result.facts[0].value,'joint');
 assert.equal(result.facts[0].dimension,'fleet_oversight');
 if(excerpt!==exact)assert.ok(diagnostics.some(d=>d.category==='formatting_difference'));
}
assert.equal(matchCitation('do not allow','do allow'),null);
assert.equal(matchCitation('no where','nowhere'),null);
assert.equal(matchCitation('双方で監督しない','双方で監督する'),null);
assert.equal(matchCitation('出航・戦闘は禁止','出航・戦闘は許可'),null);
for(const [factPhase,reviewPhase]of [['interim','unspecified'],['unspecified','interim'],['final','unspecified'],['unspecified','final']]){
 const c=raw();c.facts[0].phase=factPhase;c.fleet_review.fleet_oversight[0].phase=reviewPhase;
 const {result,diagnostics}=convert(c);assert.equal(result.facts[0].phase,factPhase==='unspecified'?reviewPhase:factPhase);
 assert.ok(diagnostics.some(d=>d.category==='missing_information'));
}
for(const change of [c=>c.facts[0].phase='final',c=>c.facts[0].kind='fleet_oversight:none']){
 const c=raw();change(c);assert.throws(()=>convert(c),e=>e.validationCategory==='semantic_contradiction'&&!!e.validationCode&&e.validationDetails.clauseIndex===0);
}
const invalidPhase=raw();invalidPhase.facts[0].phase='invalid';assert.throws(()=>convert(invalidPhase),e=>e.validationCode==='phase_invalid');
const missing=raw();delete missing.fleet_review;assert.equal(convert(missing).result.facts[0].value,'joint');assert.ok(convert(missing).diagnostics.some(d=>d.category==='missing_information'));
const noFact=raw();noFact.facts=[];assert.equal(convert(noFact).result.facts[0].value,'joint');
const unknown=raw();unknown.facts[0].kind='fleet_oversight:unknown';assert.equal(convert(unknown).result.facts[0].value,'joint');
const fabricated=raw();fabricated.fleet_review.fleet_oversight[0].source_excerpt='双方が自由な出航を認める';assert.throws(()=>convert(fabricated),e=>e.validationCode==='source_quote_not_found');
const separated=raw();separated.facts.push({kind:'fleet_custody:katsu',phase:'interim',source_ref:'current_player_message'},{kind:'fleet_command:government',phase:'final',source_ref:'current_player_message'});
assert.deepEqual(convert(separated).result.facts.map(f=>[f.dimension,f.value,f.phase]),[['fleet_oversight','joint','interim'],['fleet_custody','katsu','interim'],['fleet_command','government','final']]);
for(const text of ['双方で監督する','共同監視下に置く']){const c=raw();c.text=text;c.fleet_review.fleet_oversight[0].source_excerpt=text;c.fleet_review.fleet_oversight[0].text_excerpt=text;assert.equal(convert(c,text).result.facts[0].value,'joint');}
// A new unspecified fact cannot erase either explicit period in a versioned clause.
const terms=structuredClone(peaceClauses);terms[3].facts.forEach(f=>f.phase='interim');terms[3].facts.push({dimension:'fleet_command',value:'government',phase:'final',quote:terms[3].text});
const open={...agreedState(terms),katsuSettlement:'not_requested',governmentReview:null};
const target=open.canonicalLedger.proposals[0];const old=target.clauses[3];
function amend(value){const c=clause('引渡し後の指揮権は新政府に移す。',{fleet_command:value},['warships']);c.facts[0].phase='unspecified';return reduceNegotiationEvents(open,[{type:'proposal_modified',actor:'saigo',target_proposal_id:target.id,changed_clause_ids:[old.id],issue_ids:['warships'],terms:c.text,clauses:[c]}],{playerText:c.text,katsuText:'検討する。'});}
const update=amend('government');assert.equal(update.validationError,undefined);
const newClause=activeClauses(update.state.canonicalLedger,{acceptedOnly:false}).find(c=>c.supersedes?.includes(old.id));
assert.ok(newClause.facts.some(f=>f.dimension==='fleet_command'&&f.value==='government'&&f.phase==='final'));
assert.ok(newClause.facts.some(f=>f.dimension==='fleet_command'&&f.value==='katsu'&&f.phase==='interim'));
assert.ok(!newClause.facts.some(f=>f.dimension==='fleet_command'&&f.phase==='unspecified'));
const ambiguous=amend('joint');assert.equal(ambiguous.validationCode,'fleet_phase_missing');assert.deepEqual(ambiguous.state.canonicalLedger.proposals,open.canonicalLedger.proposals);
console.log('Actual message formatting, raw evidence, missing information, explicit contradictions, independent roles and phase inheritance passed. No external API.');
