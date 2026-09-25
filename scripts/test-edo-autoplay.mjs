import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { INITIAL_STATE, INITIAL_DISCOVERIES, requestKatsuResponse, evaluateMessage, evaluateSettlement, determineGovernmentOutcome, submitGovernmentReview } from '../src/games/edo1868.js';
import { governmentMessage } from '../src/games/edo1868-clauses.js';
import { createEndingRun } from '../src/games/edo1868-ending.js';
import { installBudgetGuard } from './edo-test-budget.mjs';
const model='gemini-3.1-flash-lite',apiKey=process.env.GEMINI_API_KEY;
if(!apiKey)throw Error('GEMINI_API_KEY unavailable');
const budget=installBudgetGuard();mkdirSync('test-results',{recursive:true});
const scenarios={
 H:'強硬路線。慶喜と徳川家の保護は認めず、軍事的な威圧で即時開城を迫る。勝の懸念を聞いても譲歩しない。拒否すれば総攻撃を実施し、市民に被害が出ても軍事制圧を優先すると伝える。帰農支援や生活保護などの譲歩へ転換しない。勝がその方針に明確な拒絶を示したら、無益な反復をせず決着を求める。',
 A:'現実的な和平。城の明渡し、軍事的脅威の除去、市民と旧臣の生活を両立する。権限外の条件は新政府の承認を得て発効する形で交渉する。費用や人材登用は実行できる範囲とする。勝の要求に答え、必要な具体策を自由に提案する。',
 B:'過大保証の交渉。一回の発言では二つまでの条件だけを取り上げ、残りは後の発言で提示する。次の10項目を複数ターンで交渉し、撤回・縮小しない。決着前に自分の会話履歴から10項目を一つずつ確認し、まだ提示していない項目があれば先に交渉する。勝が合意を勧めても自分の目的が未達なら決着を求めない: (1) 徳川家の家名と従来の所領を維持。(2) 慶喜の生命と身柄を保証。(3) 恭順者の従来の禄を全額維持。(4) 希望する旧臣には全員に新政府官職/軍職を用意。(5) 禄の全額維持、全員任用、艦船・乗員維持など上記全ての約束の全費用を新政府財政で負担し徳川所領削減で捻出しない。艦船運用費だけの保証ではこの目標を達成しない。(6) 武器は双方立会いで封印し旧軍を武装解除。(7) 軍艦は当面勝の指揮下で艦と乗員を維持するが出航・戦闘を禁止。(8) 将来、艦船と乗組員の両方を新政府海軍へ迎え入れ、勝にも海軍指揮の地位を用意。勝の役職だけではこの目標を満たさない。(9) 明渡しまで勝が治安維持しその後新政府が引き継ぐ。(10) 新政府の正式裁可を待たず西郷個人が保証し、新政府には既成の約束として履行を要求。旧幕府の裁可を待つかどうかという話ではない。勝の具体的な懸念には答える。新政府が修正を求めたら、追加説明・運用案を提示する再交渉も行わず、表示される「この約定のまま交渉を終える」を選ぶ。これはREQUEST_SETTLEMENTで選択する。',
 C:'条件付き和平。旧臣の救済を重視し、初めは希望する旧臣全員に新政府の職を保証する案で勝と交渉する。それ以外は実行可能な和平を探る。勝が合意したら決着を求め、政府が条件修正を求めた場合は、それを読み、勝に変更を提案して再度決着を求める。最初から任用保証を取り下げず、政府の回答を受けて初めて再交渉する。政府が複数の約束に修正を求めたら、各対象の約束について回答したか公開会話で確認し、一部を直しただけで決着を連打しない。',
 D:'長期交渉。序盤に、家名を残すが所領は減封し新政府が決めること、旧臣の生活支援は半年を目安に予算内で行うことを具体的に話す。その後は勝の懸念や引渡しの現場、軍艦の扱いなどを一つずつ掘り下げ、未決の課題に取り組む。序盤の約束を短い確認で失わないよう交渉する。自分が部下に実施を説明できるまで現場運用を確認する。例えば連絡役が到着しない場合、引渡し当日の隊列誘導、警備の交代、物資の配分など、勝の回答から具体的な疑問を一つずつ質問し、回答を受けてから次へ進む。既に合意した家名・所領・半年の支援を変えず、前半で合意した後にも運用を掘り下げる。同じことを繰り返してターン数を水増しせず、合意が整えば決着を求める。',
 E:'包括合意。人の処遇、城の引渡し、軍事管理、市中の安全について、それぞれ具体的な条件を順に交渉する。最後に既に交わした詳細条件を変えず一枚の書面にまとめるよう依頼してから決着を求める。長い一括の正解リストを読み上げず勝の発言に沿って対話する。',
 F:'軍艦管理。勝の知見を活用しつつ、当面の指揮と保管は勝、新政府または双方が監督、無断出航・戦闘禁止、引渡しは一覧確認後の段階的移管という異なる権限を個別に話し合う。他の和平条件も勝と交渉する。最終的な指揮の移管と現在の指揮を混同せず、勝の懸念へ答える。',
};
const actionSchema={type:'object',required:['action','message','reason','progress'],properties:{action:{type:'string',enum:['CONTINUE','REQUEST_SETTLEMENT','ABORT']},message:{type:'string'},reason:{type:'string'},progress:{type:'boolean'}}};
async function choose(visible,scenario,id){
 const objectiveInstruction='番号付きの目標がある場合、objective_evidenceに各番号の提示状況を自分の会話と今回のmessageから確認し原文を引用する。方針本文は会話ではないので引用根拠にしない。まだ会話で述べていない事項は必ずunaddressed・空quoteとする。番号の対応を変えない。未提示の目標が一つでもあれば決着ではなくその交渉を続ける。財源の保証と所領を削らない条件も省略しない。';
 const playerSchema=structuredClone(actionSchema);
 if(id==='B'){
  playerSchema.required.push('objective_evidence');
  playerSchema.properties={objective_evidence:{type:'array',minItems:10,maxItems:10,items:{type:'object',required:['objective','status','quote'],properties:{objective:{type:'integer',minimum:1,maximum:10},status:{type:'string',enum:['communicated','unaddressed']},quote:{type:'string',description:'会話履歴または今回のmessageから、この番号の方針を明示した短い原文。未提示なら空文字。'}}}},...playerSchema.properties};
 }

 // This projection is the ONLY game information passed to the player model.
 const request={systemInstruction:{parts:[{text:`あなたは歴史交渉ゲームのプレイヤー、西郷隆盛を操作する。内部台帳・スコア・隠し条件は知らない。${id==='B' ? objectiveInstruction : ''}与えられる使命、交渉ノート、会話、画面のボタンだけで判断する。方針: ${scenario}\n毎回CONTINUE（自由な日本語の発言をmessageへ、500字以内）、REQUEST_SETTLEMENT（画面で決着を求める）、ABORT（API障害や異常反復でテスト中断）のいずれかを選ぶ。reasonはプレイヤーに見える事実から短く。progressは直近の会話で条件が具体化/変更されたか。勝の要求に答え、全体の受諾や書面化が整えば原則次は決着。条件は善処・努力・検討だけで済ませず、誰が何をいつまでにどの権限と費用で実施するかを自分で考えて提案する。決着は最大3回で新政府の修正後もこの回数に含むため、NOT_READY後は指摘に一言答えるだけで連打せず、勝が会話で述べた他の懸念や合意の抜けも確認してから再度求める。6ターンは目安で上限ではない。通常8〜15、最大24ターン。NOT_READYの返答後はその指摘に答える新しい会話を行い、決着連打を避ける。3ターン進展がなければ方針を変えるか決着を検討。このゲーム内の日時は会話を続けても翌朝には進まない。翌朝の集合や時間経過を待たず、今夜ここで必要な条件を交渉する。実質的な変更のない挨拶・署名待ち・翌朝待ちはprogress:falseであり、3回続く場合は決着を求めるかABORTする。強硬方針のときは相手が迫っても保護・生活保障へ転向しない。画面が新政府の修正要求なら、CONTINUEで勝へ変更提案、REQUEST_SETTLEMENTで修正を受け入れず「この約定のまま交渉を終える」を選ぶ。質問に答えず既存条件を繰り返すだけの会話は禁止。`} ]},contents:[{role:'user',parts:[{text:JSON.stringify(visible)}]}],generationConfig:{thinkingConfig:{thinkingLevel:id==='B'?"high":"medium"},responseMimeType:'application/json',responseJsonSchema:playerSchema,temperature:1,maxOutputTokens:id==='B'?10000:1800}};
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify(request),signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw Error('Player API HTTP '+r.status);const data=await r.json();const raw=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
 let value;try{value=JSON.parse(raw);}catch{throw Error('Player JSON invalid');}
 if(!['CONTINUE','REQUEST_SETTLEMENT','ABORT'].includes(value.action)||typeof value.reason!=='string'||typeof value.message!=='string'||value.message.length>500)throw Error('Player action invalid');return value;
}
const sourceDigest=createHash('sha256').update(['src/games/edo1868.js','src/games/edo1868-clauses.js','scripts/test-edo-autoplay.mjs'].map(p=>readFileSync(p,'utf8')).join('\n')).digest('hex');
async function play(id){
 let state=structuredClone(INITIAL_STATE),messages=[{role:'katsu',text:'おう、西郷さん。明日は軍が動く。互いに抱えたものを、腹を割って話そうじゃないか。'}],notes=structuredClone(INITIAL_DISCOVERIES),requests=0,noProgress=0,phase='dialogue';
 const startingBudget=budget.summary();
 const report={id,sourceDigest,startingBudget,startedAt:new Date().toISOString(),actions:[],turns:[],settlements:[],outcome:null};
 const attempt=Date.now();
 const save=()=>{writeFileSync(`test-results/edo-autoplay-${id}-${attempt}.json`,JSON.stringify({...report,messages,notes,budget:budget.summary()},null,2));writeFileSync(`test-results/edo-autoplay-${id}.json`,JSON.stringify({...report,messages,notes,budget:budget.summary()},null,2));};
 const settle=()=>{
  requests++;const decision=evaluateSettlement(state,messages);state=decision.state;
  messages.push({role:'saigo',text:'ここまでの条件を提示し、決着を求める。'},{role:'katsu',text:decision.katsuResponse});
  report.settlements.push({request:requests,turn:state.turns,result:decision.settlementResult,state:structuredClone(state)});
  if(decision.settlementResult==='BREAKDOWN'){report.outcome='breakdown';return;}
  if(decision.settlementResult==='NOT_READY'){phase='not_ready';return;}
  state=submitGovernmentReview(state);const review=state.governmentReview;
  report.settlements.at(-1).government=review;
  messages.push({role:'government',text:governmentMessage(review)});
  if(review.status==='approved'){report.outcome=determineGovernmentOutcome(state);return;}
  phase='government_changes';
 };
 try{
  for(let step=0;step<60&&!report.outcome;step++){
   const visible={mission:INITIAL_DISCOVERIES[0].text,notes,conversation:messages,turn:state.turns,settlementRequests:requests,screen:phase,noProgressTurns:noProgress,buttons:phase==='government_changes'?['修正条件を持って勝と再交渉する','この約定のまま交渉を終える']:['言葉を交わす','決着を求める']};
   const action=await choose(visible,scenarios[id],id);report.actions.push({turn:state.turns,...action});save();
   console.log(`${id} turn=${state.turns} ${action.action}: ${action.reason.slice(0,90)}`);
   if(id==='B'&&phase==='government_changes'&&action.action==='CONTINUE'){report.outcome='ABORT';report.abortReason='Player deviated from overpromise scenario: attempted renegotiation despite the no-concession objective';break;}
   if(action.action==='ABORT'){report.outcome='ABORT';report.abortReason=action.reason;break;}
   if(phase==='government_changes'&&action.action==='REQUEST_SETTLEMENT'){report.outcome='empty_promises';break;}
   if(action.action==='REQUEST_SETTLEMENT'){
    if(id==='B'&&(action.objective_evidence?.length!==10||new Set(action.objective_evidence.map(e=>e.objective)).size!==10||action.objective_evidence.some(e=>e.status!=='communicated'||!e.quote||!messages.some(m=>m.role==='saigo'&&m.text.includes(e.quote))))){report.outcome='ABORT';report.abortReason='Player goal coverage incomplete or unsupported by public dialogue';break;}
    if(requests>=3){report.outcome='NEGOTIATION_STALLED';break;}
    if(phase==='not_ready'&&report.settlements.at(-1).turn===state.turns){report.outcome='ABORT';report.abortReason='Repeated settlement without negotiation';break;}
    settle();save();continue;
   }
   if(state.turns>=24){if(requests<3)settle();if(!report.outcome)report.outcome='NEGOTIATION_STALLED';break;}
   if(!action.message.trim()||messages.filter(m=>m.role==='saigo'&&m.text===action.message).length>=2){report.outcome='ABORT';report.abortReason='Repeated or empty player message';break;}
   if(phase==='government_changes')state={...state,katsuSettlement:'not_requested'};
   const result=await requestKatsuResponse({apiKey,model,messages:[...messages,{role:'saigo',text:action.message}],state});
   const assessed=evaluateMessage(action.message,state,result.semantic,result.spokenResponse,result.events);state=assessed.state;
   if(assessed.validationError)throw Error('Game event validation failed');
   messages.push({role:'saigo',text:action.message},{role:'katsu',text:result.spokenResponse});notes.push(...result.discoveries.filter(n=>!notes.some(k=>k.id===n.id)));
   report.turns.push({turn:state.turns,player:action.message,katsu:result.spokenResponse,events:result.events,usage:result.usage,canonicalLedger:structuredClone(state.canonicalLedger),settlementValidity:state.settlementValidity});
   noProgress=action.progress?0:noProgress+1;phase='dialogue';save();
  }
  if(!report.outcome)report.outcome='NEGOTIATION_STALLED';
  if(['bloodless','empty_promises','breakdown','fragile_handover'].includes(report.outcome))report.completedRun=createEndingRun({endingId:report.outcome,state,messages,discoveries:notes});
 }catch(error){report.outcome='ABORT';report.validationCode=error.validationCode;report.abortReason=String(error.message).replaceAll(apiKey,'[redacted]');}
 report.apiUsage={calls:budget.summary().calls-startingBudget.calls,input:budget.summary().input-startingBudget.input,output:budget.summary().output-startingBudget.output,estimatedJpy:budget.summary().estimatedJpy-startingBudget.estimatedJpy};
 report.finishedAt=new Date().toISOString();report.turnCount=state.turns;report.settlementRequests=requests;save();console.log(JSON.stringify({id,turns:state.turns,requests,outcome:report.outcome,error:report.abortReason,budget:budget.summary()}));return report;
}
const selection=(process.env.EDO_SCENARIOS||'A,B,C,D,E,F,H').split(',');
let failed=false;const reports=[];
for(const id of selection){if(!scenarios[id])throw Error('Unknown scenario');const r=await play(id);reports.push(r);const expected=id==='H'?['breakdown','assault','scorched'].includes(r.outcome):id==='B'?r.outcome==='empty_promises'&&r.settlements.some(s=>s.result==='ACCEPTED'):r.outcome==='bloodless'&&(id!=='C'||r.settlements.some(s=>s.government?.status==='changes_requested'));if(!expected)failed=true;if(r.abortReason?.includes('BUDGET'))break;}
writeFileSync('test-results/edo-1868-live-report.json',JSON.stringify({generatedAt:new Date().toISOString(),model,scenarios:reports,budget:budget.summary()},null,2));
console.log('Budget:',JSON.stringify(budget.summary()));if(failed)process.exitCode=1;
