import {mkdirSync,existsSync,readFileSync,writeFileSync,openSync,closeSync,unlinkSync} from 'node:fs';
const file='test-results/edo-autoplay-budget.json';
const model='gemini-3.1-flash-lite';
const rate={input:0.25,output:1.5,jpyPerUsd:200,margin:1.1};
export function installBudgetGuard(){
 mkdirSync('test-results',{recursive:true});
 const lock='test-results/edo-autoplay-budget.lock';
 const lockFd=openSync(lock,'wx');
 process.once('exit',()=>{closeSync(lockFd);unlinkSync(lock);});
 const ledger=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{model,rate,capJpy:500,calls:[],createdAt:new Date().toISOString()};
 const save=()=>writeFileSync(file,JSON.stringify(ledger,null,2));
 const price=(input,output)=>(input*rate.input+output*rate.output)/1e6*rate.jpyPerUsd*rate.margin;
 const spent=()=>ledger.calls.reduce((n,c)=>n+c.chargedJpy,ledger.unattributedReserveJpy||0);
 const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/'))throw Error('Test transport only allows Gemini');
  if(!String(url).includes('/models/'+model+':'))throw Error('Test model must be '+model);
  const body=JSON.parse(options.body);const maxOutput=body.generationConfig?.maxOutputTokens;
  if(!Number.isFinite(maxOutput))throw Error('Budget requires a maximum output token count');
  const reserved=price(Buffer.byteLength(options.body,'utf8'),maxOutput);
  if(spent()+reserved>ledger.capJpy)throw Error('BUDGET_EXCEEDED');
  const call={number:ledger.calls.length+1,at:new Date().toISOString(),status:'reserved',chargedJpy:reserved};ledger.calls.push(call);save();
  try{
   const response=await original(url,options);const data=await response.clone().json();
   writeFileSync(`test-results/edo-api-response-${call.number}.json`,JSON.stringify(data,null,2));
   const u=data.usageMetadata;
   if(u){call.input=u.promptTokenCount||0;call.output=(u.candidatesTokenCount||0)+(u.thoughtsTokenCount||0);call.cached=u.cachedContentTokenCount||0;call.chargedJpy=price(call.input,call.output);}
   call.status=response.ok?'received':'http_'+response.status;save();return response;
  }catch{call.status='uncertain_reserved';save();throw Error('Gemini transport failed; reserved maximum cost retained');}
 };
 save();return {summary:()=>({model,calls:ledger.calls.length,input:ledger.calls.reduce((n,c)=>n+(c.input||0),0),output:ledger.calls.reduce((n,c)=>n+(c.output||0),0),estimatedJpy:spent(),capJpy:ledger.capJpy,rate}),restore:()=>{globalThis.fetch=original;}};
}
