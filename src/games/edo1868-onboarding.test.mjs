import assert from 'node:assert/strict';
import {CONSENT_KEY,CONSENT_VERSION,TUTORIAL_KEY,hasCurrentConsent,saveConsentedKey,reportText,REPORT_REASONS,geminiBlockCode} from './edo1868-onboarding.js';
import {requestKatsuResponse,INITIAL_STATE} from './edo1868.js';
const storage=new Map();const adapter={setItem:(k,v)=>storage.set(k,v)};
assert.throws(()=>saveConsentedKey(adapter,'dummy-test-key',false));assert.equal(storage.size,0);
saveConsentedKey(adapter,'dummy-test-key',true);assert.equal(storage.get(CONSENT_KEY),String(CONSENT_VERSION));assert.ok(hasCurrentConsent(storage.get(CONSENT_KEY)));assert.ok(!hasCurrentConsent(CONSENT_VERSION-1));assert.ok(!hasCurrentConsent(CONSENT_VERSION+1));assert.ok(!storage.has(TUTORIAL_KEY));
const report=reportText({output:'問題の文章 dummy-test-key',reason:REPORT_REASONS[0],comment:'dummy-test-key',model:'test-model',occurredAt:'2026-10-05',apiKey:'do-not-copy',history:['secret context']},'dummy-test-key');
assert.ok(!report.includes('dummy-test-key'));assert.ok(!report.includes('secret context'));assert.ok(!report.includes('do-not-copy'));
assert.equal(geminiBlockCode({candidates:[{finishReason:'STOP'}]}),null);
const original=globalThis.fetch;try{
 for(const body of [{promptFeedback:{blockReason:'SAFETY'}},{promptFeedback:{blockReason:'PROHIBITED_CONTENT'}},{candidates:[{finishReason:'PROHIBITED_CONTENT'}]},{candidates:[{safetyRatings:[{blocked:true}]}]}]){
  globalThis.fetch=async(url,options)=>{assert.ok(!url.includes('key='));assert.ok(!url.includes('dummy-test-key'));assert.equal(options.headers['x-goog-api-key'],'dummy-test-key');assert.ok(!options.body.includes('dummy-test-key'));assert.ok(!JSON.parse(options.body).safetySettings);return {ok:true,json:async()=>body};};
  await assert.rejects(()=>requestKatsuResponse({apiKey:'dummy-test-key',model:'test-model',messages:[{role:'saigo',text:'mock'}],state:INITIAL_STATE}),e=>e.validationCode==='safety_block'&&!e.message.includes('dummy-test-key'));
 }
 globalThis.fetch=async()=>({ok:false,json:async()=>({error:{message:'dummy-test-key'}})});
 await assert.rejects(()=>requestKatsuResponse({apiKey:'dummy-test-key',model:'test-model',messages:[],state:INITIAL_STATE}),e=>e.validationCode==='provider_http_error'&&!e.message.includes('dummy-test-key'));
}finally{globalThis.fetch=original;}
console.log('Consent version, independent tutorial state, report allowlist/redaction, header authentication and safety/HTTP mocks passed. No external API.');
