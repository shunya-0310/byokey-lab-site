import {mkdir,writeFile} from 'node:fs/promises';
const html=`<!doctype html><html lang="ja"><meta charset="utf-8"><title>1868 local result fixtures</title><h1>結果画面のローカル検証</h1><button id="success">合意済み交渉を読み込む</button><button id="failure">政府不承認の交渉を読み込む</button><button id="legacy">旧版の和平記録を読み込む</button><button id="empty">検証用記録を空にする</button><script type="module">
import { INITIAL_STATE, reduceNegotiationEvents, NEGOTIATION_ISSUES } from '/src/games/edo1868.js';
const gameKey='byokey-lab:edo-1868:game-save',runKey='byokey-lab:edo-1868:completed-run';
const terms='新政府の承認後に江戸城を段階的に明け渡す。武器・軍艦を管理して移管し、海軍関係者の技術を活用する。徳川家を存続させ、慶喜を助命し、恭順した旧幕臣の再出発を支援する。市中の治安を維持し、双方の連絡役で衝突を防ぐ。';
const messages=[{role:'saigo',text:terms},{role:'katsu',text:'これまで話した条件を書面に記すことに異存はない。'}];
const discoveries=[{id:'note',title:'旧幕臣',text:'勝海舟は幕臣の生活を気にしていた。'}];
function seed(score){const state=reduceNegotiationEvents({...INITIAL_STATE,turns:4,governmentAcceptance:score,promiseCredibility:score},[{type:'agreement_confirmed',actor:'katsu',issue_ids:Object.keys(NEGOTIATION_ISSUES),terms,commitment:'firm'}],{playerText:messages[0].text,katsuText:messages[1].text}).state;
localStorage.setItem(gameKey,JSON.stringify({version:4,state,messages,discoveries,endingId:''}));location.href='/games/edo-1868/';}
document.querySelector('#success').onclick=()=>seed(90);
document.querySelector('#failure').onclick=()=>seed(10);
document.querySelector('#legacy').onclick=()=>{localStorage.removeItem(gameKey);localStorage.setItem(runKey,JSON.stringify({endingId:'alternative_peace',endingTitle:'歴史に存在しない和平',endingNarrative:'本ゲームの反実仮想',conversationHistory:messages,discoveredInformation:discoveries,completedAt:'2026-09-22T10:00:00Z'}));location.href='/games/edo-1868/ending';};
document.querySelector('#empty').onclick=()=>{localStorage.removeItem(gameKey);localStorage.removeItem(runKey);location.href='/games/edo-1868/review';};
</script></html>`;
await mkdir('test-results',{recursive:true});await writeFile('test-results/edo-ui-fixture.html',html);
console.log('Local only: http://127.0.0.1:5173/test-results/edo-ui-fixture.html');
