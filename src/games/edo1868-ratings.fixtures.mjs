import { INITIAL_STATE, reduceNegotiationEvents, evaluateSettlement, submitGovernmentReview } from './edo1868.js';
import { clause, feasiblePeaceClauses, fragilePeaceClauses, overpromiseClauses } from './edo1868.fixtures.mjs';
// Reconstructed from the human play descriptions in the October 4 instruction.
// These are not claimed to be exported responses from those two latest plays.
export const humanSuccessClauses=structuredClone(feasiblePeaceClauses);
export const humanOverpromiseClauses=structuredClone(overpromiseClauses);
humanOverpromiseClauses.push({...clause('城の明渡し後も艦隊と乗組員を一体として維持し、勝に海軍を預ける。',{fleet_command:'katsu',fleet_custody:'katsu'},['warships']),facts:['fleet_command','fleet_custody'].map(dimension=>({dimension,value:'katsu',phase:'final',quote:'城の明渡し後も艦隊と乗組員を一体として維持し、勝に海軍を預ける。'}))});
export const ceasefireClauses=[clause('明日の総攻撃を見合わせ、両軍は戦闘を行わない。残る条件は後日協議する。',{assault:'postponed'},['peaceful_transition'])];
export function openTalk(clauses){
 const text=clauses.map(c=>c.text).join('\n');
 const result=reduceNegotiationEvents({...structuredClone(INITIAL_STATE),turns:4},[{type:'agreement_confirmed',actor:'katsu',issue_ids:[...new Set(clauses.flatMap(c=>c.issue_ids))],terms:text,clauses,commitment:'firm'}],{playerText:text,katsuText:'記した条件に同意する。'});
 if(result.validationError)throw Error(result.validationError);return result.state;
}
export function finishTalk(clauses){const decision=evaluateSettlement(openTalk(clauses));if(decision.settlementResult!=='ACCEPTED')throw Error('Fixture not accepted: '+decision.settlementResult);return submitGovernmentReview(decision.state);}
export function fiveEndingStates(){return {
 bloodless:finishTalk(humanSuccessClauses),
 fragile_handover:finishTalk(fragilePeaceClauses),
 ceasefire:finishTalk(ceasefireClauses),
 empty_promises:finishTalk(humanOverpromiseClauses),
 breakdown:evaluateSettlement({...structuredClone(INITIAL_STATE),settlementPatience:0}).state,
};}
