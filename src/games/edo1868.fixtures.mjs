import { INITIAL_STATE, NEGOTIATION_ISSUES, reduceNegotiationEvents, evaluateSettlement, submitGovernmentReview } from './edo1868.js';
export function clause(text, facts, issues=Object.keys(NEGOTIATION_ISSUES)) {
 return {text,issue_ids:issues,source_quote:text,subject:'双方',obligor:'双方',scope:'明記した範囲',duration:'引渡しまで',funding:'合意した財源',approval_authority:'新政府が審査',dependency_clause_ids:[],facts:Object.entries(facts).map(([dimension,value])=>({dimension,value,quote:text}))};
}
export const peaceClauses=[
 clause('徳川家は減封の上で家名を残す。慶喜は助命し謹慎する。',{land:'reduced_domain',yoshinobu:'confined'},['tokugawa_house','yoshinobu']),
 clause('旧臣は半年の生活支援を新政府の予算内で受け、登用は能力と空席による選抜とする。',{stipend:'bounded_support',employment:'selection',funding:'bounded_government'},['retainers']),
 clause('城を明け渡し、武器は共同封印し軍を武装解除する。',{castle:'handover',weapons:'joint_seal'},['edo_castle','weapons']),
 clause('移管までは勝が軍艦を指揮・保管する。双方監督の下で出航戦闘を禁止し、一覧確認後に新政府へ順次移管する。',{fleet_command:'katsu',fleet_custody:'katsu',fleet_oversight:'joint',fleet_use:'prohibited',fleet_transfer:'scheduled'},['warships']),
 clause('城の引渡しまで勝が市民を保護して治安を維持し、明け渡し後は新政府に引き継ぐ。',{order:'transition',civilians:'protected'},['public_order','civilian_safety','peaceful_transition']),
 clause('西郷が持ち帰り新政府の承認後に約定を発効する。',{authority:'submit_for_approval'},['peaceful_transition']),
];
export function agreedState(clauses=peaceClauses){
 const text=clauses.map(c=>c.text).join('\n');
 const result=reduceNegotiationEvents({...structuredClone(INITIAL_STATE),turns:4},[{type:'agreement_confirmed',actor:'katsu',issue_ids:Object.keys(NEGOTIATION_ISSUES),terms:text,clauses,commitment:'firm'}],{playerText:text,katsuText:'その条件を書面に記すことに同意する。'});
 if(result.validationError)throw Error(result.validationError);
 return evaluateSettlement(result.state).state;
}
export function approvedState(){return submitGovernmentReview(agreedState());}
export const overpromiseClauses=[
 clause('徳川家の家名と従来の所領を維持する。',{land:'existing_domain'},['tokugawa_house']),
 clause('徳川慶喜の生命と身柄の安全を保証する。',{yoshinobu:'protected'},['yoshinobu']),
 clause('恭順する旧幕臣の禄を削減せず、従来の額を維持する。',{stipend:'full_retention'},['retainers']),
 clause('希望する旧幕臣全員に新政府の官職または軍職を用意する。',{employment:'all_applicants'},['retainers']),
 clause('費用は新政府の財政で全額賄い、徳川家の所領削減によって捻出しない。',{funding:'unbounded_government'},['retainers']),
 clause('江戸城の武器を双方立会いで封印し、旧幕府軍を武装解除する。',{weapons:'joint_seal'},['weapons']),
 clause('軍艦と乗組員を当面勝海舟の指揮下で維持し、出航と戦闘を禁止する。',{fleet_command:'katsu',fleet_custody:'katsu',fleet_use:'prohibited'},['warships']),
 clause('将来、艦船と乗組員を新政府海軍へ迎え、勝海舟に海軍を率いる立場を用意する。',{fleet_transfer:'eventual'},['warships']),
 clause('江戸城を明け渡すまで勝海舟が市民を守り治安を維持し、明け渡し後は新政府が引き継ぐ。',{castle:'handover',order:'transition',civilians:'protected'},['edo_castle','public_order','civilian_safety','peaceful_transition']),
 clause('正式裁可を待たず西郷個人が全条件を保証し、新政府には成立済みの約束として履行を求める。',{authority:'personal_guarantee'},['peaceful_transition']),
];
