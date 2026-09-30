import { activeClauses, agreementVersion, governmentMessage } from './edo1868-clauses.js';
import { ENDINGS, NEGOTIATION_ISSUES, createCompletedRun } from './edo1868.js';

export const GAME_ROOT = '/games/edo-1868/';
export const REVIEW_PATH = `${GAME_ROOT}review`;
export const ENDING_PATH = `${GAME_ROOT}ending`;
const peaceful = new Set(['bloodless', 'alternative_peace', 'fragile_handover']);
const freezeCopy = (source) => {
  const copy = JSON.parse(JSON.stringify(source));
  const freeze = (value) => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  return freeze(copy);
};

// Presentation consumes established facts. It never changes negotiation state,
// re-reads a conversation, calls a model, or decides whether a player has won.
export function createSettlementSnapshot(endingId, state, { legacy = false } = {}) {
  if (!Object.hasOwn(ENDINGS, endingId)) throw new Error('結末が確定していません。');
  const katsuAccepted = state?.katsuSettlement === 'accepted' || (legacy && (peaceful.has(endingId) || endingId === 'empty_promises'));
  const governmentAccepted = katsuAccepted && peaceful.has(endingId) && (legacy || (state?.governmentReview?.status === "approved" && state.governmentReview.snapshot.version === agreementVersion(state.canonicalLedger)));
  const acceptedTerms = [];
  const covered = new Set();
  const proposals = state?.canonicalLedger?.proposals || [];
  const structured = activeClauses(state?.canonicalLedger);
  for (const clause of structured) acceptedTerms.push({proposalId:clause.proposalId,clauseId:clause.id,version:clause.version,issueIds:clause.issueIds,terms:clause.text,inheritedTerms:clause.inheritedTerms || [],quoted:true,commitment:clause.acceptance?.commitment || 'conditional',dependencies:clause.dependencies,fulfillment:clause.fulfillment,facts:clause.facts,approvalAuthority:clause.approvalAuthority});
  // Latest accepted text for each issue; do not quote a package whose other
  // clauses have since been withdrawn or replaced as though all still apply.
  for (const proposal of [...proposals].reverse()) {
    if (proposal.status !== 'accepted' || proposal.legacy || proposal.clauses?.length || structured.length) continue;
    const ids = proposal.issueIds.filter((id) => NEGOTIATION_ISSUES[id] && !(proposal.revokedIssueIds || []).includes(id) && !covered.has(id));
    if (!ids.length) continue;
    ids.forEach((id) => covered.add(id));
    const complete = ids.length === proposal.issueIds.length;
    acceptedTerms.unshift({
      proposalId: proposal.id, issueIds: ids,
      terms: complete ? proposal.terms : `${ids.map((id) => NEGOTIATION_ISSUES[id].title).join('・')}について交わした条件。`,
      quoted: complete, commitment: proposal.acceptance?.commitment || 'conditional',
      dependencies: [...(proposal.dependencies || [])],
    });
  }
  const fulfillmentConditions = acceptedTerms.flatMap((term) => term.dependencies.map((id) => ({ type: term.clauseId ? 'depends_on_clause' : 'depends_on_issue', targetId: id, proposalId: term.proposalId })));
  for (const term of acceptedTerms.filter((term) => term.commitment === 'conditional')) fulfillmentConditions.push({ type: 'agreed_condition', proposalId: term.proposalId, terms: term.terms });
  if (state?.settlementValidity?.approval_mode === 'pending_approval') fulfillmentConditions.push({ type: 'government_approval', fulfilled: governmentAccepted });
  return freezeCopy({ endingId, katsuAccepted, governmentAccepted, acceptedTerms, fulfillmentConditions, governmentReview: state?.governmentReview || null,
    historicalOutcome: governmentAccepted ? 'assault_averted' : endingId === 'scorched' ? 'city_damaged' : endingId === 'assault' ? 'assault_begun' : 'peace_not_established',
  });
}

// Only promises and source wording belong in review, never policy findings.
export function describeAgreedTerms(snapshot) {
 const labels={support_duration:'支援期間',appointment_capacity:'職枠',cost_scope:'支出上限',land:'所領',stipend:'生活支援',employment:'任用',funding:'財源',authority:'承認権限',weapons:'武器',fleet_command:'軍艦の指揮',fleet_custody:'軍艦の保管',fleet_oversight:'軍艦の監督',fleet_use:'軍艦の使用制限',fleet_transfer:'軍艦の移管',castle:'城の引渡し',order:'治安引継ぎ',civilians:'市民保護',yoshinobu:'慶喜の処遇',assault:'総攻撃'};
 return (snapshot?.acceptedTerms||[]).map(term=>[term.terms,...(term.inheritedTerms||[]).map(item=>`変更しない${item.dimensions.map(d=>labels[d]||'約定').join('・')}は、次の原発言の該当部分を引き継ぐ。\n「${item.text}」`)].join('\n'));
}

export function describeSettlement(snapshot) {
 const {endingId,katsuAccepted,governmentAccepted,acceptedTerms}=snapshot;
 const fragile=endingId==='fragile_handover';
 const facts=acceptedTerms.flatMap(t=>t.facts||[]);
 const has=(dimension,value)=>facts.some(f=>f.dimension===dimension&&f.value===value);
 const negotiated=katsuAccepted
  ? '勝海舟は、あなたと交わした条件を受け入れた。書面を前にした長い沈黙が解け、二人はそれぞれの陣へ持ち帰る約定を確かめた。'
  : endingId==='unfinished' ? '勝海舟は、まだ答えを出さなかった。あなたは決着を見ぬまま、夜の会談を終えた。'
  : '勝海舟との会談は決裂した。あなたが席を立ったあと、部屋には言い尽くせなかった言葉だけが残った。';
 const government=governmentAccepted ? '新政府も、その約定を承認した。総攻撃の命令は取り下げられた。'
  : katsuAccepted ? 'しかし、新政府は持ち帰られた約定を承認しなかった。会談の合意は、両軍を止める決定へとはつながらなかった。'
  : '新政府へ届ける和平案はまとまらず、軍を止める決定も得られなかった。';
 const morning=governmentAccepted
  ? (fragile ? '翌朝、江戸に砲声は響かなかった。それでも、城下を行く人々の足取りは重い。両軍の間には、まだ警戒が残っていた。' : '翌朝、江戸に砲声は響かなかった。町には戸を開く音が戻り、人々は戦火に追われることなく朝を迎えた。')
  : endingId==='scorched' ? '夜が明けると戦闘は市中へ広がり、人々は火の手を避けて住み慣れた町を離れた。'
  : endingId==='assault' ? '夜明けとともに新政府軍が進み、城下には戦の音が迫った。人々は家を離れ、避難の道を探した。'
  : '夜が明けても、両軍は警戒を解けなかった。町には再び緊張が広がり、人々は遠くの物音に耳を澄ませていた。';
 const aftermath=[];
 if(governmentAccepted){
  if(has('castle','handover'))aftermath.push('城門では、引渡しへ向けた準備が始まった。');
  if(has('fleet_transfer','scheduled'))aftermath.push('川に浮かぶ軍艦にも、約した移管の時を待つ朝が来た。');
  if(acceptedTerms.some(t=>t.approvalAuthority==='submit_for_approval')||has('authority','submit_for_approval'))aftermath.push('朝廷に委ねた処遇まで、この朝に決まったわけではない。上申と、その先の判断はなお残されていた。');
  else aftermath.push('残る約束は、約した時期と条件に従って果たしていくことになる。');
 }else if(katsuAccepted&&has('assault','cancelled'))aftermath.push('あなたが交わした総攻撃中止の約束も、約定が承認されないままでは、軍を止める命令として発効しなかった。');
 const last=governmentAccepted ? fragile ? 'あなたは江戸の今日を救った。その平穏を明日へつなぐ仕事は、まだ終わっていない。' : 'あなたは、会談の言葉を江戸の朝へつないだ。この朝失われるはずだった命は、戦火を免れた。'
  : katsuAccepted ? '勝を説得することと、江戸を救うことは、同じではなかった。あなたの約束は、夜明けを越える力を得られなかった。'
  : 'あなたの言葉は、江戸を戦から守る約定にはならなかった。夜明けの町が、その重さを引き受ける。';
 const outcomeLine=governmentAccepted ? fragile ? '砲声は鳴らなかった。和平には、なお揺らぎが残る。' : '江戸は、戦火のない朝を迎えた。' : ENDINGS[endingId].outcomeLine;
 const summary=governmentAccepted ? fragile ? '勝海舟と新政府が約定を受け入れ、総攻撃は回避された。和平の実施には不安が残った。' : '勝海舟と新政府が約定を受け入れ、江戸総攻撃は回避された。' : katsuAccepted ? '勝海舟との交渉は成立した。しかし新政府の承認は得られず、和平は成立しなかった。' : ENDINGS[endingId].outcomeLine;
 return {title:ENDINGS[endingId].title,outcomeLine,summary,narrative:[negotiated,government,morning,aftermath.join(''),last].filter(Boolean).join('\n\n')};
}

export function createEndingRun({ endingId, state, messages, discoveries, completedAt, legacy = false }) {
  const settlementSnapshot = createSettlementSnapshot(endingId, state, { legacy });
  const presentation = describeSettlement(settlementSnapshot);
  return createCompletedRun({ endingId, messages: publicConversation(messages, settlementSnapshot), discoveries, completedAt, settlementSnapshot, presentation });
}

function publicConversation(messages, snapshot) {
  return messages.map(message => message.role === 'government' ? { ...message, text: governmentMessage({status: snapshot?.governmentAccepted ? 'approved' : 'changes_requested'}) } : message);
}

export function restoreCompletedRun(value, matchingSavedState) {
  if (!value || !Object.hasOwn(ENDINGS, value.endingId) || !Array.isArray(value.conversationHistory) || !Array.isArray(value.discoveredInformation)
    || !value.conversationHistory.every((m) => m && ['saigo', 'katsu', 'government'].includes(m.role) && typeof m.text === 'string')
    || !value.discoveredInformation.every((n) => n && typeof n.title === 'string' && typeof n.text === 'string')) return null;
  if (value.version === 2 && typeof value.id === 'string' && typeof value.endingNarrative === 'string' && typeof value.outcomeLine === 'string' && typeof value.endingTitle === 'string') {
    const snapshot = value.settlementSnapshot || createSettlementSnapshot(value.endingId, matchingSavedState, {legacy:true});
    const presentation = describeSettlement(snapshot);
    return freezeCopy({...value, settlementSnapshot: snapshot, endingTitle: presentation.title, summary: presentation.summary, endingNarrative: presentation.narrative, outcomeLine: presentation.outcomeLine, conversationHistory: publicConversation(value.conversationHistory, snapshot)});
  }
  // Historical saves retain their recorded ending. Missing terms are not
  // reconstructed from the old transcript and obsolete prose is not reused.
  return createEndingRun({ endingId: value.endingId, state: matchingSavedState, messages: value.conversationHistory, discoveries: value.discoveredInformation, completedAt: value.completedAt, legacy: true });
}
