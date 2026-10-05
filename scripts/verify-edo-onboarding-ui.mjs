import fs from 'node:fs/promises';import path from 'node:path';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const pause=ms=>new Promise(r=>setTimeout(r,ms));const profile=path.resolve('test-results/story-browser-'+Date.now());await fs.mkdir(profile,{recursive:true});
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;try{
 let port;for(let i=0;i<80;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}if(!port)throw Error('Browser unavailable');
 const tab=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});let next=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const evalDOM=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*generativelanguage.googleapis.com*']});await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});


 const waitFor=async expr=>{for(let i=0;i<80;i++){if(await evalDOM(expr))return;await pause(100);}throw Error('UI not ready: '+expr);};
 const click=async text=>{await evalDOM(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);await pause(80);};
 const reload=async()=>{await evalDOM('window.beforeReload=true');await send('Page.reload');await waitFor("!window.beforeReload && !!document.querySelector('.edo-title')");};
 await send('Page.navigate',{url:'http://127.0.0.1:5186/games/edo-1868/'});await waitFor("!!document.querySelector('.edo-title')");
 // Actual new-game flow, not a game-state shortcut.
 await click('ゲームを始める');for(let i=0;i<5;i++)await click('次へ');await click('いざ、対談');await waitFor("!!document.querySelector('.edo-tour-card')");
 assert.equal(await evalDOM("localStorage.getItem('byokey-lab:edo-1868:api-consent-version')"),null);
 for(const [width,height,label] of [[1280,800,'desktop'],[412,915,'android'],[390,844,'iphone']]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  if(label!=='desktop'){await click('設定');await click('チュートリアルを表示');}
  for(let step=0;step<7;step++){
   await pause(150);
   const geometry=await evalDOM(`(()=>{const card=document.querySelector('.edo-tour-card').getBoundingClientRect();const spot=document.querySelector('.edo-tour-spotlight').getBoundingClientRect();return {ok:card.left>=0&&card.right<=innerWidth+1&&card.top>=0&&card.bottom<=innerHeight+1,target:spot.width>0&&spot.top>=0&&spot.bottom<=innerHeight+1,title:document.querySelector('#edo-tour-title').textContent,focused:!!document.activeElement.closest('.edo-tour-card')}})()`);
   assert.ok(geometry.ok,JSON.stringify({label,step,geometry}));assert.ok(geometry.target,JSON.stringify({label,step,geometry}));
   if(step===4){assert.deepEqual(await evalDOM(`(()=>{const a=document.querySelector('.edo-tour-card a');return {href:a.href,target:a.target}})()`),{href:'https://byokey-lab.com/important/',target:'_blank'});}
   if(step===0){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab'});assert.ok(await evalDOM(`!!document.activeElement.closest('.edo-tour-card')`));}
   if(step===0||step===4||step===6){const shot=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`test-results/edo-onboarding-${label}-${step}.png`,Buffer.from(shot.data,'base64'));}
   if(step===2){await click('戻る');assert.equal(await evalDOM("document.querySelector('#edo-tour-title').textContent"),'交渉ノート');await click('次へ');}
   await click(step===6?'案内を終える':'次へ');
  }
  assert.equal(await evalDOM("localStorage.getItem('byokey-lab:edo-1868:tutorial-version')"),'1');
  console.log(JSON.stringify({viewport:label,steps:7,popupAndTargetsInViewport:true}));
 }
 await click('設定');assert.equal(await evalDOM("document.querySelector('.edo-settings-actions button').disabled"),true);
 await evalDOM("document.querySelector('input[type=password]').focus()");await send('Input.insertText',{text:'dummy-test-key'});
 assert.equal(await evalDOM("document.querySelector('.edo-settings-actions button').disabled"),true);
 await evalDOM("document.querySelector('.edo-consent input').click()");await click('保存');
 assert.equal(await evalDOM("localStorage.getItem('byokey-lab:edo-1868:api-consent-version')"),'1');
 assert.ok(!(await evalDOM("document.documentElement.outerHTML")).includes('dummy-test-key'));
 assert.equal(await evalDOM("document.querySelector('input[type=password]').type"),'password');
 {const shot=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile('test-results/edo-onboarding-settings.png',Buffer.from(shot.data,'base64'));}
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause(100);assert.equal(await evalDOM("!!document.querySelector('.edo-modal')"),false);
 // Use a saved conversation to verify provenance and normal reload without replaying guide.
 await evalDOM(`(async()=>{const {INITIAL_STATE}=await import('/src/games/edo1868.js');localStorage.setItem('byokey-lab:edo-1868:game-save',JSON.stringify({version:4,state:{...INITIAL_STATE,turns:1},messages:[{role:'katsu',text:'定型文'},{role:'saigo',text:'私の発言'},{role:'katsu',text:'対象のAI発言 dummy-test-key',generatedBy:'gemini',model:'mock-model',generatedAt:'2026-10-05'}],endingId:''}));})()`);
 await reload();await waitFor(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('続きから始める'))`);await click('続きから始める');await pause(2500);assert.equal(await evalDOM("!!document.querySelector('.edo-tour-card')"),false);
 await click('会話履歴');assert.equal(await evalDOM("document.querySelectorAll('.edo-history-list .edo-report-button').length"),1);await click('このAI出力を報告');
 assert.ok(!(await evalDOM("document.querySelector('.edo-report-dialog').innerText")).includes('dummy-test-key'));
 {const shot=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile('test-results/edo-onboarding-report.png',Buffer.from(shot.data,'base64'));}
 await evalDOM("navigator.clipboard.writeText=async text=>{window.copiedReport=text;}");await click('報告文をコピー');
 assert.ok((await evalDOM("window.copiedReport")).includes('[認証情報を除去]'));assert.ok(!(await evalDOM("window.copiedReport")).includes('私の発言'));
 assert.ok((await evalDOM("document.querySelector('.edo-report-dialog [role=status]').textContent")).includes('まだ送信されていません'));
 await evalDOM("navigator.clipboard.writeText=async()=>{throw Error('mock clipboard denial')}");await click('報告文をコピー');assert.ok((await evalDOM("document.querySelector('.edo-report-dialog [role=status]').textContent")).includes('コピーできません'));
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause(100);
 // Safety responses must preserve input, expose no raw provider response and make no network call.
 await evalDOM(`window.fetch=async()=>({ok:true,json:async()=>({promptFeedback:{blockReason:'PROHIBITED_CONTENT'}})})`);
 await evalDOM("document.querySelector('.edo-stage-form textarea').focus()");await send('Input.insertText',{text:'モック安全ブロック'});
 await evalDOM("document.querySelector('.edo-stage-form button[type=submit]').click()");await waitFor("!!document.querySelector('.edo-send-error')");
 assert.ok((await evalDOM("document.querySelector('.edo-send-error').textContent")).includes('表現を変えて'));assert.equal(await evalDOM("document.querySelector('.edo-stage-form textarea').value"),'モック安全ブロック');
 assert.equal(await evalDOM("JSON.parse(sessionStorage.getItem('byokey-lab:edo-1868:last-error')).code"),'safety_block');
 assert.ok(!(await evalDOM("sessionStorage.getItem('byokey-lab:edo-1868:last-error')")).includes('dummy-test-key'));
 await click('設定を開く');await click('チュートリアルを表示');await click('スキップ');
 assert.equal(await evalDOM("localStorage.getItem('byokey-lab:edo-1868:tutorial-version')"),'1');
 await evalDOM("localStorage.setItem('byokey-lab:edo-1868:api-consent-version','0')");await reload();await click('設定');assert.equal(await evalDOM("document.querySelector('.edo-consent input').checked"),false);assert.equal(await evalDOM("document.querySelector('.edo-settings-actions button').disabled"),true);
 console.log('First entry, full completion, replay, skip, independent versioned consent, key masking, report allowlist/copy failure and safety-block UI passed. No external LLM requests.');
 await send('Browser.close');
}finally{ws?.close();child.kill();}
