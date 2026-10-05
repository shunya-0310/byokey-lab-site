import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IMPORTANT_URL, REPORT_FORM_URL, REPORT_REASONS, redactReportText, reportText } from "./edo1868-onboarding.js";

// Shared keyboard confinement and focus restoration for game overlays.
export function useEdoDialog(active, selector, close) {
  const closeRef = useRef(close); closeRef.current = close;
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    const dialog = document.querySelector(selector);
    if (!dialog) return;
    const root = document.getElementById("root");
    const outsideRoot = root && !root.contains(dialog);
    const wasInert = root?.inert;
    if (outsideRoot) root.inert = true;
    const before = document.body.style.overflow; document.body.style.overflow = "hidden";
    const focusables = () => [...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(e => e.getClientRects().length);
    (focusables()[0] || dialog).focus({ preventScroll:true });
    const keydown = e => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeRef.current(); }
      if (e.key === "Tab") {
        const items = focusables(); const index = items.indexOf(document.activeElement);
        if (!items.length) { e.preventDefault(); dialog.focus(); }
        else if (e.shiftKey && index <= 0) { e.preventDefault(); items.at(-1).focus(); }
        else if (!e.shiftKey && (index < 0 || index === items.length - 1)) { e.preventDefault(); items[0].focus(); }
      }
    };
    document.addEventListener("keydown", keydown, true);
    return () => { document.removeEventListener("keydown", keydown, true); document.body.style.overflow = before; if(outsideRoot) root.inert = wasInert; if(previous?.isConnected) previous.focus({preventScroll:true}); else document.querySelector('.edo-report-button, [data-edo-tour="settings"]')?.focus({preventScroll:true}); };
  }, [active, selector]);
}
const STEPS = [
  ["mission", "使命", "あなたは西郷隆盛。明日に迫った江戸総攻撃を前に、勝海舟と交渉します。「使命」で立場と目的を確認できます。"],
  ["notes", "交渉ノート", "会話で明らかになった情報を読み返せます。勝が何を求めているのか、自分の約束と照らして考えてみてください。"],
  ["history", "会話履歴", "交わした言葉を読み返せます。"],
  ["usage", "API使用量", "この交渉で使ったトークン数と概算料金を確認できます。実際の請求額はGoogle AI Studioにてご確認ください。"],
  ["settings", "設定", "あなた自身のGemini APIキーを登録します。キーは大切な認証情報です。利用前に注意事項を確認してください。案内は設定から再表示できます。"],
  ["input", "テキスト入力欄", "ここから西郷として自由に発言できます。あなた自身の言葉で、勝海舟と交渉してください。"],
  ["conclude", "決着を求める", "あなたが交渉はこれで良いと判断したところで決着を求めてください。交渉の内容を以て新政府に最終判断を仰ぎ、明日を迎えます。"],
];
export function EdoTutorial({ onFinish }) {
  const [step, setStep] = useState(0); const [layout, setLayout] = useState(null); const popup = useRef(null);
  useEdoDialog(true, '.edo-tour-card', onFinish);
  useLayoutEffect(() => {
    const target = document.querySelector(`[data-edo-tour="${STEPS[step][0]}"]`);
    if(!target) { setLayout(null); return; }
    target.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});
    const place = () => {
      const r=target.getBoundingClientRect(); const w=document.documentElement.clientWidth, h=window.innerHeight;
      const ph=popup.current?.offsetHeight || 270; const pw=Math.min(380,w-24);
      const top=r.bottom+14+ph<=h-12?r.bottom+14:Math.max(12,r.top-ph-14);
      setLayout({rect:{left:Math.max(3,r.left-4),top:Math.max(3,r.top-4),width:Math.min(w-6,r.width+8),height:r.height+8},card:{left:Math.max(12,Math.min(w-pw-12,r.left)),top,width:pw}});
    };
    place();const observer=new ResizeObserver(place);observer.observe(target);if(popup.current)observer.observe(popup.current);
    window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return ()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  },[step]);
  return createPortal(<div className="edo-tour-overlay">
    {layout && <div className="edo-tour-spotlight" aria-hidden="true" style={layout.rect} />}
    <section ref={popup} className="edo-tour-card" role="dialog" aria-modal="true" aria-labelledby="edo-tour-title" tabIndex={-1} style={layout?.card}>
      <p className="edo-tour-progress">チュートリアル {step+1} / {STEPS.length}</p>
      <h2 id="edo-tour-title">{STEPS[step][1]}</h2><p aria-live="polite">{STEPS[step][2]}</p>
      {STEPS[step][0]==="settings" && <a href={IMPORTANT_URL} target="_blank" rel="noreferrer">API利用上の注意事項を確認する ↗</a>}
      <div className="edo-tour-actions"><button onClick={onFinish}>スキップ</button><button disabled={step===0} onClick={()=>setStep(step-1)}>戻る</button><button onClick={()=>step===STEPS.length-1?onFinish():setStep(step+1)}>{step===STEPS.length-1?"案内を終える":"次へ"}</button></div>
    </section>
  </div>,document.body);
}
export function EdoReport({ message, apiKey, onClose }) {
  const [reason,setReason]=useState(REPORT_REASONS[0]); const [comment,setComment]=useState("");
  const [output,setOutput]=useState(()=>redactReportText(message.text,apiKey)); const [status,setStatus]=useState("");
  useEdoDialog(true,'.edo-report-dialog',onClose);
  const payload=reportText({output,reason,comment,model:message.model,occurredAt:message.generatedAt},apiKey);
  const copy=async()=>{try{await navigator.clipboard.writeText(payload);setStatus("コピーしました。まだ送信されていません。お問い合わせフォームに貼り付け、内容を確認して送信してください。");}catch{setStatus("コピーできませんでした。下の報告文を選択してコピーしてください。");}};
  return createPortal(<div className="edo-modal-backdrop"><section className="edo-modal edo-report-dialog" role="dialog" aria-modal="true" aria-labelledby="edo-report-title" tabIndex={-1}>
    <button className="edo-modal-close" onClick={onClose} aria-label="閉じる">×</button><h2 id="edo-report-title">AI出力を報告</h2>
    <p>送信先はBYOKey Labです。Googleへの報告ではありません。</p><p>対象のAI出力、理由、任意コメント、モデル名、記録日時、機能versionを報告文に含めます。会話全文や保存設定は含めません。個人情報を取り除いてから、フォームで送信してください。</p>
    <label className="edo-key-field">報告理由<select value={reason} onChange={e=>{setReason(e.target.value);setStatus("");}}>{REPORT_REASONS.map(r=><option key={r}>{r}</option>)}</select></label>
    <label className="edo-key-field">対象のAI出力（個人情報を削除できます）<textarea value={output} onChange={e=>{setOutput(e.target.value);setStatus("");}} /></label>
    <label className="edo-key-field">任意コメント<input maxLength={1000} value={comment} onChange={e=>{setComment(e.target.value);setStatus("");}} /></label>
    <details><summary>コピーする報告文を確認</summary><textarea aria-label="コピーする報告文" readOnly value={payload} /></details>
    <div className="edo-report-actions"><button disabled={!output.trim()} onClick={copy}>報告文をコピー</button><a href={REPORT_FORM_URL} target="_blank" rel="noreferrer">お問い合わせフォームを開く ↗</a></div>
    <p role="status">{status || "この画面から自動送信はしません。コピー後、フォームに貼り付けて送信してください。"}</p>
  </section></div>,document.body);
}
