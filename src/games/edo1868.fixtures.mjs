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

// Reconstructed from the user's account, not a captured Gemini response.
export const prudentClauses=[
 clause('慶喜が恭順を貫き再挙兵しないことを条件に、生命と身柄の安全を守るよう朝廷に取り計らう。',{yoshinobu:'protected',authority:'submit_for_approval'},['yoshinobu']),
 clause('徳川家の家名存続を目指す。所領規模と慶喜の最終処遇は朝廷の裁可に委ねる。',{land:'name_only',authority:'submit_for_approval'},['tokugawa_house']),
 clause('恭順する旧幕臣をむやみに処罰せず、当面の生活を支援する。禄の全額維持は保証しない。',{stipend:'temporary_support'},['retainers']),
 clause('希望者全員の任用は保証しない。能力と希望に応じ、新政府での登用や新たな生業への道を開くよう尽力する。',{employment:'selection'},['retainers']),
 clause('軍艦は城の明け渡しに合わせて新政府へ引き渡す。',{fleet_transfer:'scheduled'},['warships']),
 clause('軍艦は引渡しまでは勝が管理し、出航・戦闘は禁止する。',{fleet_command:'katsu',fleet_custody:'katsu',fleet_use:'prohibited'},['warships']),
 clause('双方立会いのもとで武装を封印する。',{weapons:'joint_seal'},['weapons']),
 {...clause('引渡し後は新政府が軍艦を管理する。',{fleet_command:'government',fleet_custody:'government'},['warships']),facts:['fleet_command','fleet_custody'].map(dimension=>({dimension,value:'government',phase:'final',quote:'引渡し後は新政府が軍艦を管理する。'}))},
 clause('乗組員は能力と希望に応じて新政府海軍への登用を検討する。',{employment:'selection'},['retainers']),
 clause('双方の責任者が武器・弾薬の目録を作り、武装解除を確認して江戸城を順次引き渡す。',{weapons:'disarm',castle:'handover'},['weapons','edo_castle']),
 clause('城の引渡しまでは勝が市中の治安を維持し、その後は新政府が責任を引き継ぐ。新政府軍による無断の市中立入りを禁じ、警備・消防を引き継ぐ。',{order:'transition',civilians:'protected'},['public_order','civilian_safety','peaceful_transition']),
 clause('これらの準備を進めるため翌日の総攻撃を猶予する。朝廷の裁可が必要な事項は独断で確約せず責任を持って上申する。',{authority:'submit_for_approval'},['peaceful_transition']),
].map(c=>({...c,funding:'unknown',approval_authority:c.facts.some(f=>f.dimension==='authority')?'submit_for_approval':'unknown',duration:'unknown'}));
