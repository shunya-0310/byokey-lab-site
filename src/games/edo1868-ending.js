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
  for (const clause of structured) acceptedTerms.push({proposalId:clause.proposalId,clauseId:clause.id,version:clause.version,issueIds:clause.issueIds,terms:clause.text,inheritedTerms:clause.inheritedTerms || [],quoted:true,commitment:clause.acceptance?.commitment || 'conditional',dependencies:clause.dependencies,fulfillment:clause.fulfillment});
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

export function describeSettlement(snapshot) {
  const { endingId, katsuAccepted, governmentAccepted, acceptedTerms } = snapshot;
  const negotiated = katsuAccepted ? '勝海舟は、あなたと交わした条件を受け入れた。今夜の会談は、一つの約定に結ばれた。'
    : endingId === 'unfinished' ? '勝海舟との最終的な合意には至らなかった。個々の言葉を、双方が引き受ける約定にはまとめられなかった。'
      : '勝海舟との会談は決裂した。交わした条件を、最終的な和平の約定として結ぶことはできなかった。';
  // Quotes describe promises, never their fulfillment. Timing and conditions
  // stay verbatim, including staged transfer and employment still to be arranged.
  const dimensionLabels={support_duration:'支援期間',appointment_capacity:'職枠',cost_scope:'支出上限',land:'所領',stipend:'禄・生活支援',employment:'任用',funding:'財源',authority:'承認権限',weapons:'武器',fleet_command:'軍艦の指揮',fleet_custody:'軍艦の保管',fleet_oversight:'軍艦の監督',fleet_use:'軍艦の使用制限',fleet_transfer:'軍艦の移管',castle:'城の引渡し',order:'治安引継ぎ',civilians:'市民保護',yoshinobu:'慶喜の処遇'};
  const describeTerm=term=>{
    const current=term.quoted ? `「${term.terms}」` : term.terms;
    const inherited=(term.inheritedTerms||[]).map(item=>`変更しない${item.dimensions.map(d=>dimensionLabels[d]||d).join('・')}の条件は、次の原発言の該当部分を引き継ぐ。\n「${item.text}」`);
    return [current,...inherited].join('\n');
  };
  const promises = acceptedTerms.length ? `会談で交わした約定には、次の言葉が残った。\n\n${acceptedTerms.map(describeTerm).join('\n\n')}` : '';
  const government = governmentAccepted ? '新政府も、その約定を承認した。あなたが持ち帰った合意は、軍を止め、江戸を平和に受け取るための決定となった。'
    : katsuAccepted ? 'しかし、新政府は持ち帰られた約定を承認しなかった。会談での合意を、双方の軍勢を止める決定にはできなかった。'
      : '新政府が承認する和平案は成立しなかった。会談で決着がつかず、総攻撃を止める決定にも至らなかった。';
  const world = governmentAccepted ? '翌朝、総攻撃の命令は取り下げられた。江戸へ攻め込むはずだった軍勢は、その場にとどまった。\n\n江戸の町に、この総攻撃による戦火は上がらなかった。城の受領に向け、双方は約した条件と手順に沿って動き始める。残る約束は、それぞれの時期や条件に従って果たしていくことになる。'
    : endingId === 'scorched' ? '軍勢は衝突し、戦闘は市中へ広がった。火災と混乱で、人々は住み慣れた町を逃れることになった。'
      : endingId === 'assault' ? '総攻撃を止める命令は届かず、新政府軍は江戸へ進んだ。戦闘が始まり、市民は避難を迫られた。'
        : '総攻撃を取りやめる約定がないまま、夜が明けた。双方の軍勢は警戒を解かず、町には戦闘や火災に巻き込まれる危険が残った。';
  const result = governmentAccepted ? endingId === 'fragile_handover'
    ? 'あなたは、勝海舟との合意を新政府の承認へつなぎ、江戸総攻撃を回避した。和平は成立したが、約定の履行を支える仕事はなお残っている。'
    : 'あなたは、勝海舟との合意を、新政府も引き受ける和平へと結びつけた。江戸総攻撃は回避された。'
    : katsuAccepted ? 'あなたは勝海舟を説得した。だが、江戸を救う和平は成立しなかった。'
      : 'あなたは、双方が受け入れる和平へたどり着けなかった。江戸を戦から守る道は、閉ざされた。';
  const outcomeLine = governmentAccepted ? '江戸総攻撃、回避。' : ENDINGS[endingId].outcomeLine;
  const summary = governmentAccepted ? '勝海舟と新政府の双方が約定を受け入れ、江戸総攻撃は回避された。' : katsuAccepted ? '勝海舟との交渉は成立した。しかし新政府の承認は得られず、和平は成立しなかった。' : ENDINGS[endingId].outcomeLine;
  return { title: ENDINGS[endingId].title, outcomeLine, summary, narrative: [negotiated, promises, government, world, result].filter(Boolean).join('\n\n') };
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
