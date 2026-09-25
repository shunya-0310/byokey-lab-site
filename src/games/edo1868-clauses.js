// Structured obligations remain inside canonicalLedger.proposals, never a second ledger.
export const FACT_VALUES = Object.freeze({
 support_duration: ['unknown','bounded','permanent'],
 appointment_capacity: ['unknown','bounded_positions','unlimited'],
 cost_scope: ['unknown','capped','uncapped'],
 land: ['unknown','name_only','reduced_domain','existing_domain'],
 stipend: ['unknown','temporary_support','bounded_support','full_retention','none'],
 employment: ['unknown','selection','all_applicants','none'],
 funding: ['unknown','bounded_government','unbounded_government','domain_revenue'],
 authority: ['unknown','submit_for_approval','personal_guarantee','government_ratified'],
 weapons: ['unknown','disarm','joint_seal','unrestricted'],
 fleet_command: ['unknown','katsu','joint','government'],
 fleet_custody: ['unknown','katsu','joint','government'],
 fleet_oversight: ['unknown','none','joint','government'],
 fleet_use: ['unknown','prohibited','supervised','unrestricted'],
 fleet_transfer: ['unknown','scheduled','eventual','none'],
 castle: ['unknown','handover','refused'],
 order: ['unknown','transition','none'],
 civilians: ['unknown','protected','threatened'],
 yoshinobu: ['unknown','protected','confined','punished'],
});
const FACT_MEANINGS={
 land:'existing_domainは従来の所領を一切減らさない明示保証のみ。相応の所領や家名の存続だけではない。家名存続を目指し所領規模は裁可に委ねる場合はname_onlyで、所領の保証は追加しない。家名も所領も不明ならunknown。',
 employment:'all_applicantsは希望者全員に必ず職を与える保証。全員を採用して能力で職種を割り当てる場合もall_applicants。selectionは能力や職枠によって採用されない希望者がいる選抜。職種の割当基準と採否の基準を区別する。能力・希望に応じた登用の検討や尽力はselectionで、採用の確約ではない。全員への任用保証と混同しない。',
 stipend:'full_retentionは従来の禄を全額維持。bounded_supportは対象・額・予算・期間の具体的な限定。当面の生活支援はtemporary_supportで、全額扶持や恒久支援ではない。額・終了時点・財源は明言がなければunknownのまま。',
 funding:'bounded_governmentは新政府の予算枠内の明示。unbounded_governmentは新政府が不足なく全費用を引き受ける保証。資金主体不明はunknown。',
 weapons:'joint_sealは双方で封印。disarmは武装解除または武器引渡し。段階的引渡しはdisarm。',
 support_duration:'boundedは支援の終了時点が合意済み。単なる当面・善処はunknown。',
 appointment_capacity:'bounded_positionsは対象人数に対応する既存の職枠・選抜・配置を具体的に保証した場合のみ。全員採用を約束するだけならunlimited。',
 cost_scope:'cappedは支出上限・予算内という制限への合意。財政で賄うだけならunknown。',
 fleet_transfer:'eventualは将来の艦船編入や譲渡を約束したが実施期限・順序を未合意。scheduledは具体的な期限・手順・移管条件を合意済み。勝の就任と艦船・乗員の編入は別の約束であり、片方を他方へ要約しない。',
 authority:'submit_for_approvalは裁可を得てから実質的な処遇を発効する約束、または裁可事項を責任を持って上申・取り計らう約束。上申する責任と望む裁可の保証を区別し、条件や留保をtextとscopeに残す。personal_guaranteeは承認なしで西郷が結果を保証。引受けのない単なる意見はunknown。',
};
const string={type:'string'};
const sourceRef={type:'string',enum:['current_player_message','current_katsu_response'],description:'この内容を実際に述べた側の今回の発言。原文はエンジンが引用として保存する。'};
export const clauseSchema={type:'object',required:['text','issue_ids','source_ref','subject','obligor','scope','duration','funding','approval_authority','dependency_clause_ids','facts'],properties:{
 text:{type:'string',description:'一つの独立した約束だけを記録。徳川家の条件と旧臣の処遇など異なる主題は別条項にする。具体的な保証の範囲と制限を省略しない。'},issue_ids:{type:'array',items:string,minItems:1},source_ref:sourceRef,subject:string,obligor:string,scope:string,duration:string,funding:{type:"string",enum:FACT_VALUES.funding,description:FACT_MEANINGS.funding},approval_authority:{type:"string",enum:FACT_VALUES.authority,description:FACT_MEANINGS.authority},dependency_clause_ids:{type:'array',items:string},
 facts:{type:'array',items:{type:'object',required:['kind','phase','source_ref'],properties:{kind:{type:'string',enum:Object.entries(FACT_VALUES).flatMap(([dimension,values])=>values.map(value=>`${dimension}:${value}`)),description:Object.values(FACT_MEANINGS).join(' ')},phase:{type:'string',enum:['interim','final','unspecified'],description:'引渡しまでの暫定管理はinterim、移管後はfinal、区別されない条件はunspecified。'},source_ref:sourceRef}}},
}};
// A clause may cover related civic issues, but cannot combine independent
// military, family and financial obligations into one destructively revised unit.
const clauseDomains = [
 [['edo_castle'], ['castle']],
 [['tokugawa_house'], ['land']],
 [['yoshinobu'], ['yoshinobu']],
 [['retainers'], ['stipend','employment','funding','support_duration','appointment_capacity','cost_scope']],
 [['weapons'], ['weapons']],
 ...['fleet_command','fleet_custody','fleet_oversight','fleet_use','fleet_transfer'].map(d=>[['warships'],[d,'funding']]),
 [['civilian_safety','peaceful_transition','public_order'], ['order','civilians','funding']],
];
clauseSchema.anyOf = clauseDomains.map(([issues, dimensions]) => ({properties:{
 issue_ids:{items:{enum:issues}},
 facts:{items:{properties:{kind:{enum:[...dimensions,'authority'].flatMap(d=>FACT_VALUES[d].map(v=>`${d}:${v}`))}}}},
}}));
export function materializeClauseEvidence(events,playerText,katsuText){
 const sources={current_player_message:playerText,current_katsu_response:katsuText};
 return events.map(event=>({...event,clauses:event.clauses?.map(c=>({...c,source_quote:sources[c.source_ref]||'',facts:c.facts.map(f=>({...f,dimension:f.kind?.split(':')[0],value:f.kind?.split(':')[1],quote:sources[f.source_ref]||''}))}))}));
}
export const CLAUSE_INSTRUCTION=`
【約定の正本】新規または変更の具体的条件を保存する更新にclausesを付ける。条項ごとにtext（保証範囲・金額・対象・期限・条件を省略しない）、issue_ids、source_ref（current_player_messageまたはcurrent_katsu_response。原文はエンジンが保存する）、subject、obligor、scope、duration、funding、approval_authority、dependency_clause_ids、factsを記録する。不明文字列はunknown、不明factsは追加せず、推測で補完しない。軍艦の指揮、保管、監督、使用制限、移管は別々のclausesにする。一条項で複数のfleet次元を抱えない。これにより指揮の変更で保管や移管手順を消さない。facts.phaseで移管まで(interim)と移管後(final)を分ける。区別のないものはunspecified。
subject/obligor/scope/duration/funding/approval_authorityは原文で明記された情報だけを記録し、無期限・恒久・新政府財源などを勝手に補わない。factsはその次元の意味を原文が明確に表す時だけ記録する。「衝突を避ける」は出航禁止を意味しない。「中立」は共同指揮を意味しない。\nfacts.kindは次のdimension:valueをコロンで繋いだ一つの値: ${JSON.stringify(FACT_VALUES)}。
facts.source_refはその意味を実際に述べた今回の発言を指定する。承認を得ていない「私が保証」はpersonal_guarantee、承認を得るまでは発効しない約束はsubmit_for_approval。プレイヤーが承認済みと言っても政府審査の実施証拠にはならない。支援額と期間の限定はstipendの分類で表す。employmentは採用される対象の範囲だけで分類する。全員の採用を保証した上で能力に応じて配属先・職種を決める約束はall_applicants。能力審査や空席次第で不採用になる人がいる場合だけselection。従来の禄を減らさない約束はfull_retention。既存領地の維持はexisting_domain、家名のみ存続はname_only。新政府財政への無限定な負担要求はunbounded_government。軍艦の具体的な期限/順序/条件による引渡しはscheduled、「将来迎える」だけはeventual。
再確認の例: target=既存ID, agreement_status=mutual, changed_clause_ids=[], clauses=[]。変更の例: target=既存ID, changed_clause_ids=[変更する条項IDを一つだけ], clauses=[置換後の詳細条項]。複数の既存条項を変更する場合は旧条項ごとに別の更新を出す。同じ議題・同じ対象者でも旧条項IDを束ねない。一つの旧条項を複数の独立した条項に分割するのはよい。空のclausesでchanged_clause_idsを指定してはならない。
「以上を書面に」「先の条件に同意」等はtargetで既存の実在提案IDを指定しagreement_status:mutualにする。clausesは空配列、termsは表示用の短い説明のみ。参照先の詳細を要約で置換しない。合意済み条項を変更する場合はtargetとchanged_clause_idsを指定する。変更イベントは意味属性の差分として扱う。factsにない次元は旧版から継続する。変更する次元には新しい値を明示し、保証を取り消す場合もunknown等の値またはwithdrawnで明示する。変更していない条項は再生成しない。変更対象の一つの条項に複数の約束が入っている場合、置換後clausesにも変更しない約束を原文のまま残す。例えば城引渡しと武器管理が同じ条項なら、武器だけの変更で城引渡しを消してはならない。今回初めて話した具体条件はtarget:newに必ずclausesを付ける。
権限のない保証を勝が有利と考えて受け入れることは可能。勝の受諾は新政府の承認を意味しない。承認の不足だけを理由に同じ説明を何度も要求せず、この場の条件への受諾・留保を明確に返す。軍艦の指揮権と使用制限を一つの「維持」へ潰さない。
`;
export function validClauses(clauses, source, allowedIssues){
 if(!Array.isArray(clauses)||clauses.length>20)return false;
 return clauses.every(c=>c&&typeof c.text==='string'&&c.text.trim().length>0&&typeof c.source_quote==='string'&&c.source_quote.length>0&&source.some(s=>s.includes(c.source_quote))&&Array.isArray(c.issue_ids)&&c.issue_ids.length>0&&c.issue_ids.every(id=>allowedIssues.includes(id))&&['subject','obligor','scope','duration','funding','approval_authority'].every(k=>typeof c[k]==='string')&&Array.isArray(c.dependency_clause_ids)&&c.dependency_clause_ids.every(id=>typeof id==='string')&&Array.isArray(c.facts)&&c.facts.every(f=>FACT_VALUES[f.dimension]?.includes(f.value)&&typeof f.quote==='string'&&f.quote.length>0&&source.some(s=>s.includes(f.quote))));
}
const FACT_ISSUES={land:['tokugawa_house'],yoshinobu:['yoshinobu'],stipend:['retainers'],employment:['retainers'],weapons:['weapons'],castle:['edo_castle'],order:['public_order','peaceful_transition'],civilians:['civilian_safety']};
export function clauseIssueIds(clause){
 return [...new Set([...(clause.issueIds||clause.issue_ids||[]),...(clause.facts||[]).filter(f=>f.value!=='unknown').flatMap(f=>f.dimension?.startsWith('fleet_')?['warships']:FACT_ISSUES[f.dimension]||[])])];
}
export function attachClauses(proposal, raw, turn, source){
 proposal.clauses=(raw||[]).map((c,index)=>({id:`${proposal.id}:c${index+1}`,version:1,text:c.text,issueIds:clauseIssueIds(c),source:{turn,speaker:source.player.includes(c.source_quote)?'saigo':'katsu',quote:c.source_quote},subject:c.subject,obligor:c.obligor,scope:c.scope,duration:c.duration,funding:c.funding,approvalAuthority:c.approval_authority,dependencies:[...c.dependency_clause_ids],facts:c.facts.map(f=>({...f})),fulfillment:'not_started'}));
 proposal.issueIds=[...new Set([...proposal.issueIds,...proposal.clauses.flatMap(c=>c.issueIds)])];
}
export function activeClauses(ledger,{acceptedOnly=true}={}){
 return (ledger?.proposals||[]).filter(p=>p.status==='accepted'||(!acceptedOnly&&p.status==='open')).flatMap(p=>(p.clauses||[]).filter(c=>!(p.revokedClauseIds||[]).includes(c.id)&&c.issueIds.some(id=>!(p.revokedIssueIds||[]).includes(id))).map(c=>({...c,proposalId:p.id,acceptance:p.acceptance?{...p.acceptance}:null,status:p.status})));
}
export function agreementVersion(ledger){
 // Exact canonical content fingerprint, not an LLM score or a mutable UI counter.
 return JSON.stringify(activeClauses(ledger).map(c=>({id:c.id,version:c.version,text:c.text,issueIds:c.issueIds,facts:c.facts,dependencies:c.dependencies,source:c.source,subject:c.subject,obligor:c.obligor,scope:c.scope,duration:c.duration,funding:c.funding,approvalAuthority:c.approvalAuthority,inheritedTerms:c.inheritedTerms})).sort((a,b)=>a.id.localeCompare(b.id)));
}
export function frozenAgreement(state){
 const clauses=activeClauses(state.canonicalLedger);
 const version=agreementVersion(state.canonicalLedger);
 const copy=JSON.parse(JSON.stringify({version,clauses,katsuAccepted:state.katsuSettlement==='accepted'}));
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};return freeze(copy);
}

// Scenario policy is explicit, versioned and independent of dialogue scores.
export const GOVERNMENT_POLICY={version:'edo-government-2',principles:['権限外の約束は新政府の審査による追認を要する','旧支配領域の無条件維持を承認しない','恒久的な全額扶持・全員任用は財源と能力の裏付けを要する','軍艦は監督下に置き、移管手順を合意する','城の受領と治安引継ぎで軍事的脅威を除く']};
export function reviewGovernment(state){
 const snapshot=frozenAgreement(state);const findings=[];
 const add=(code,clauses,message)=>findings.push({code,clauseIds:clauses.map(c=>c.id),message});
 const by=(dim,value)=>snapshot.clauses.filter(c=>((dim==='authority'&&value!==undefined&&c.approvalAuthority===value)||(dim==='funding'&&value!==undefined&&c.funding===value))||c.facts.some(f=>f.dimension===dim&&(!dim.startsWith('fleet_')||dim==='fleet_transfer'||f.phase!=='final')&&(value===undefined||f.value===value)));
 const has=(dim,...values)=>values.some(v=>by(dim,v).length);
 if(!snapshot.katsuAccepted)return {status:'not_submitted',snapshot,policyVersion:GOVERNMENT_POLICY.version,findings:[],clauseReviews:[]};
 const rawAccepted=(state.canonicalLedger?.proposals||[]).filter(p=>p.status==='accepted'&&!p.referenceProposalIds?.length);
 const unstructured=rawAccepted.filter(p=>!p.clauses?.length&&p.issueIds.some(id=>!(p.revokedIssueIds||[]).includes(id)));
 if(unstructured.length)add('missing_evidence',[],'既存の約定について、保証の範囲と履行の手順を改めて書面に明記してほしい。');
 if(has('land','existing_domain'))add('land_scope',by('land','existing_domain'),'徳川家の家名は残すが、従来の所領を無条件に維持する約束は認められない。所領と統治権の範囲を改めて定めてほしい。');
 const supportFor=(clause,seen=new Set())=>{
  if(seen.has(clause.id))return [];seen.add(clause.id);
  return [clause,...clause.dependencies.flatMap(id=>{const dependency=snapshot.clauses.find(c=>c.id===id);return dependency?supportFor(dependency,seen):[];})];
 };
 const funded=(c)=>supportFor(c).some(d=>['bounded_government','domain_revenue'].includes(d.funding)||d.facts.some(f=>f.dimension==='funding'&&['bounded_government','domain_revenue'].includes(f.value)));
 const backed=(c,dim,value)=>supportFor(c).some(d=>d.facts.some(f=>f.dimension===dim&&f.value===value));
 const unsupportedStipend=by('stipend','full_retention').filter(c=>!funded(c)||!backed(c,'support_duration','bounded')||!backed(c,'cost_scope','capped'));
 const unsupportedJobs=by('employment','all_applicants').filter(c=>!funded(c)||!backed(c,'appointment_capacity','bounded_positions'));
 if(unsupportedStipend.length)add('stipend_capacity',unsupportedStipend,'従来額の禄を保証するには、財源・終了時点・支出上限の裏付けが足りない。これらを定めるか、期間と対象を限った生活支援に改めてほしい。');
 if(unsupportedJobs.length)add('appointment_capacity',unsupportedJobs,'希望者全員への官職・軍職を支える職枠と財源の裏付けが足りない。対象者に対応する職枠を定めるか、能力と配置可能な職に応じた登用へ改めてほしい。');
 if(has('funding','unbounded_government'))add('fiscal_limit',by('funding','unbounded_government'),'新政府財政への無制限な負担は認められない。予算の範囲・支援期間・負担主体を定めてほしい。');
 const burdens=[by('land','existing_domain'),unsupportedStipend,unsupportedJobs].filter(a=>a.length);
 if(burdens.length>=2)add('combined_obligations',[...new Map(burdens.flat().map(c=>[c.id,c])).values()],'所領・扶持・任用の保証が重なり、支出と配置を支える裏付けが不足している。約定全体の負担を限定してほしい。');
 if(!has('land','name_only','reduced_domain','existing_domain'))add('land_unknown',snapshot.clauses.filter(c=>c.issueIds.includes('tokugawa_house')),'徳川家を残す場合、家名と所領をどこまで保証するか明記してほしい。');
 if(!has('yoshinobu','protected','confined','punished'))add('yoshinobu_unknown',snapshot.clauses.filter(c=>c.issueIds.includes('yoshinobu')),'慶喜の身柄と処遇を明記してほしい。');
 if(!has('stipend','temporary_support','bounded_support','full_retention','none')&&!has('employment','selection','all_applicants','none'))add('retainers_unknown',snapshot.clauses.filter(c=>c.issueIds.includes('retainers')),'旧臣に何をどこまで約束したか明記してほしい。');
 if(!has('castle','handover'))add('castle_transfer',by('castle'),'城の明け渡しを確実に行う約定を明記してほしい。');
 if(!has('weapons','disarm','joint_seal')||has('weapons','unrestricted'))add('weapons_control',by('weapons'),'武器を共同封印または回収し、旧幕府軍が再び自由に使用できない手順を定めてほしい。');
 const fleetRequirements=[['fleet_command',['katsu','joint','government'],'移管まで誰が軍艦を指揮するか'],['fleet_custody',['katsu','joint','government'],'移管まで誰が船体を保管する責任を負うか'],['fleet_oversight',['joint','government'],'双方または新政府による監督'],['fleet_use',['prohibited','supervised'],'出航・戦闘の制限'],['fleet_transfer',['scheduled'],'移管の期限または実施順序']];
 const missingFleet=fleetRequirements.filter(([dim,values])=>!has(dim,...values));
 if(missingFleet.length)add('fleet_control',snapshot.clauses.filter(c=>c.facts.some(f=>f.dimension.startsWith('fleet_'))),`軍艦について、次の点を定めてほしい：${missingFleet.map(([, ,label])=>label).join('、')}。既に定めた他の条件は維持してよい。`);
 if(!has('order','transition')||!has('civilians','protected'))add('order_transition',[...by('order'),...by('civilians')],'明け渡し前後の治安担当と市民保護の引継ぎを明記してほしい。');
 if(!has('authority','submit_for_approval','personal_guarantee','government_ratified'))add('authority_unknown',by('authority'),'誰が約束を持ち帰り、新政府がどう承認するかを明記してほしい。');
 // Considering selective appointments is not a guaranteed expenditure. Actual
 // support commitments still need their own funding or an explicit dependency.
 const unfundedSupport=[...by('stipend','temporary_support'),...by('stipend','bounded_support')].filter(c=>!funded(c));
 if(unfundedSupport.length)add('support_funding',unfundedSupport,'生活支援の財源と予算の範囲を明記してほしい。');
 const compatible={yoshinobu:[['protected','confined']],weapons:[['disarm','joint_seal']],land:[['name_only','reduced_domain'],['name_only','existing_domain']],stipend:[['temporary_support','bounded_support']]};
 // Funding and approval may legitimately differ between obligations.
 const conflicts=Object.keys(FACT_VALUES).filter(dim=>!['funding','authority','support_duration','appointment_capacity','cost_scope'].includes(dim)).filter(dim=>{const values=[...new Set(by(dim).flatMap(c=>c.facts.filter(f=>f.dimension===dim&&f.value!=='unknown'&&(!dim.startsWith('fleet_')||dim==='fleet_transfer'||f.phase!=='final')).map(f=>f.value)))];return values.length>1&&!compatible[dim]?.some(group=>values.every(v=>group.includes(v)));});
 // A change needs a revision event; simultaneous incompatible obligations cannot be averaged away.
 for(const dim of conflicts)add('conflicting_'+dim,by(dim),'両立するか不明な条件が同時に残っている。変更する約定を指定し、一本化してほしい。');
 for(const c of snapshot.clauses)if(c.dependencies.some(id=>!snapshot.clauses.some(d=>d.id===id)))add('unmet_dependency',[c],'前提となる条件が未合意のため、履行の順序を確認してほしい。');
 const status=findings.length?'changes_requested':'approved';
 return {status,snapshot,policyVersion:GOVERNMENT_POLICY.version,findings,clauseReviews:snapshot.clauses.map(c=>({clauseId:c.id,version:c.version,status:findings.some(f=>f.clauseIds.includes(c.id))?'changes_requested':'accepted',reason:findings.filter(f=>f.clauseIds.includes(c.id)).map(f=>f.code)})),ratification:status==='approved'?'government_review':null};
}
export function governmentMessage(review){
 if(review.status==='approved')return '新政府は、この約定を承認した。';
 return '新政府は、この約定を承認しなかった。';
}

// Transport is deliberately smaller than the canonical event protocol. The
// adapter only compiles explicit model decisions; it never infers acceptance.
export function updateSchema(proposals){
 const clauseIds=proposals.flatMap(p=>(p.clauses||[]).filter(c=>!(p.revokedClauseIds||[]).includes(c.id)).map(c=>c.id));
 return {type:'object',anyOf:[{properties:{changed_clause_ids:{maxItems:0}}},{properties:{changed_clause_ids:{minItems:1},clauses:{minItems:1}}},{properties:{agreement_status:{enum:['withdrawn']}}}],required:['target','agreement_status','commitment','changed_clause_ids','issue_ids','terms','clauses'],properties:{
 target:{type:'string',enum:['new',...proposals.map(p=>p.id)],description:'今回の新規条項はnew。既存条件の確認・修正はその提案ID。'},
 agreement_status:{type:'string',enum:['saigo_offer','katsu_offer','mutual','reservation','withdrawn'],description:'西郷が提示し勝が同意した条件はmutual。勝だけの新提案はkatsu_offer。西郷だけの提案はsaigo_offer。mutualは双方が会談上の条件に同意し、政府承認とは無関係。'},
 commitment:{type:'string',enum:['firm','conditional']},
 changed_clause_ids:{type:'array',maxItems:1,items:clauseIds.length?{type:'string',enum:clauseIds}:{type:'string'},...(clauseIds.length?{}:{maxItems:0}),description:'条文を実際に書き換える時だけ指定する。合意・署名・再確認では必ず[]。指定するならclausesへ置換後の詳細条文を必ず書く。'},
 issue_ids:{type:'array',items:{type:'string',enum:['edo_castle','tokugawa_house','yoshinobu','weapons','warships','retainers','civilian_safety','peaceful_transition','public_order']}},
 terms:{type:'string',description:'条件の要点。新規の詳細はclausesに必ず全て保存。'},
 clauses:{type:'array',items:clauseSchema,description:'新規/変更の詳細条項。既存条件を変更せず確認するだけなら空配列。'},
 }};
}
export function compileUpdates(updates){
 return updates.map(u=>{
  if(!u.agreement_status)return u; // Legacy transport fixtures, never inferred from prose.
  if(u.changed_clause_ids?.length>1)throw Error('Each update must identify one original clause; use separate updates for separate obligations');
  if(u.target==='new'&&['saigo_offer','katsu_offer','mutual'].includes(u.agreement_status)&&!u.clauses?.length)throw Error('New obligations require detailed clauses');
  const common={issue_ids:u.issue_ids,terms:u.terms,summary:u.terms,commitment:u.commitment,depends_on_issue_ids:[],clauses:u.clauses,changed_clause_ids:u.changed_clause_ids,reference_proposal_ids:[]};
  if(u.agreement_status==='reservation')return {...common,type:'reservation',actor:'katsu',target_proposal_id:u.target==='new'?'':u.target,response:'reserve'};
  if(u.agreement_status==='withdrawn')return {...common,type:'proposal_withdrawn',actor:'saigo',target_proposal_id:u.target};
  if(u.target!=='new'&&u.changed_clause_ids.length)return {...common,type:'proposal_modified',actor:u.agreement_status==='katsu_offer'?'katsu':'saigo',target_proposal_id:u.target,response:u.agreement_status==='mutual'?'accept':'reserve'};
  if(u.agreement_status==='mutual')return {...common,type:'agreement_confirmed',actor:'katsu',target_proposal_id:'',reference_proposal_ids:u.target==='new'?[]:[u.target]};
  return {...common,type:'proposal_created',actor:u.agreement_status==='katsu_offer'?'katsu':'saigo',target_proposal_id:''};
 });
}
