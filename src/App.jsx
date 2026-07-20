import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  Play,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";

const providers = [
  {
    id: "gemini",
    name: "Gemini",
    owner: "Google",
    mark: "G",
    guideUrl: "https://ai.google.dev/gemini-api/docs/api-key",
  },
  {
    id: "openai",
    name: "OpenAI",
    owner: "OpenAI",
    mark: "O",
    guideUrl: "https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key",
    clientWarning: "OpenAIは、APIキーをブラウザやモバイルアプリなどのクライアント環境へ配置しないよう公式に案内しています。BYOKey Speakでの提供可否は、公開前に規約と安全面を再確認します。",
  },
  {
    id: "claude",
    name: "Claude",
    owner: "Anthropic",
    mark: "C",
    guideUrl: "https://support.anthropic.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure",
  },
];

function usePath() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath) => {
    const [pathname, hash = ""] = nextPath.split("#");
    window.history.pushState({}, "", nextPath);
    setPath(pathname || "/");
    if (hash) {
      window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return [path, navigate];
}

function Brand({ onNavigate }) {
  return (
    <button className="brand" type="button" onClick={() => onNavigate("/")} aria-label="BYOKey Lab ホーム">
      <span className="brand-mark"><KeyRound size={20} strokeWidth={2.4} /></span>
      <span>BYOKey Lab</span>
    </button>
  );
}

function Header({ onNavigate, active = "home" }) {
  const [open, setOpen] = useState(false);
  const go = (path) => {
    setOpen(false);
    onNavigate(path);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand onNavigate={go} />
        <nav className={open ? "nav-links is-open" : "nav-links"} aria-label="メインナビゲーション">
          <button type="button" onClick={() => go("/#principles")}>考え方</button>
          <button className={active === "speak" ? "is-active" : ""} type="button" onClick={() => go("/speak/english/")}>プロダクト</button>
          <button type="button" onClick={() => go("/privacy/")}>プライバシー</button>
          <button type="button" onClick={() => go("/guide/api/")}>API設定ガイド</button>
        </nav>
        <button className="icon-button menu-button" type="button" onClick={() => setOpen(!open)} aria-label={open ? "メニューを閉じる" : "メニューを開く"}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function ProviderPicker() {
  const [selected, setSelected] = useState("gemini");
  const [key, setKey] = useState("sample-api-key");
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("idle");

  const testConnection = () => {
    setStatus("testing");
    window.setTimeout(() => setStatus("success"), 700);
  };

  return (
    <div className="setup-demo" aria-label="API接続デモ">
      <div className="setup-step provider-step">
        <p className="step-label">01 / プロバイダー</p>
        <h2>好きなAIを選ぶ</h2>
        <div className="provider-list" role="radiogroup" aria-label="LLMプロバイダー">
          {providers.map((provider) => (
            <button
              className={selected === provider.id ? "provider-option is-selected" : "provider-option"}
              key={provider.id}
              type="button"
              role="radio"
              aria-checked={selected === provider.id}
              onClick={() => {
                setSelected(provider.id);
                setStatus("idle");
              }}
            >
              <span className={`provider-mark provider-${provider.id}`}>{provider.mark}</span>
              <span><strong>{provider.name}</strong><small>{provider.owner}</small></span>
              {selected === provider.id && <CheckCircle2 size={19} />}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-step key-step">
        <p className="step-label">02 / APIキー</p>
        <h2>端末に設定する</h2>
        <label htmlFor="demo-key">APIキー</label>
        <div className="key-input-wrap">
          <input id="demo-key" type={visible ? "text" : "password"} value={key} onChange={(event) => setKey(event.target.value)} />
          <button className="icon-button" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "APIキーを隠す" : "APIキーを表示する"}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button className="button button-primary test-button" type="button" disabled={!key || status === "testing"} onClick={testConnection}>
          {status === "testing" ? "確認中..." : "接続をテスト"}
        </button>
        {status === "success" && (
          <div className="success-note" role="status"><CheckCircle2 size={18} />接続できました。このキーは送信・保存されません。</div>
        )}
        <p className="demo-caption">これは操作イメージです。サイト上ではAPIキーを収集しません。</p>
      </div>
      <div className="setup-step conversation-step">
        <p className="step-label">03 / 会話</p>
        <h2>すぐに話し始める</h2>
        <div className="mini-chat">
          <div className="mini-message coach"><span>Coach</span>What would you like to talk about today?</div>
          <div className="mini-message learner">I want to practice speaking naturally.</div>
          <div className="mini-message coach"><span>Coach</span>Great. Tell me about your weekend.</div>
        </div>
        <div className="mini-composer"><span>メッセージを入力...</span><Mic size={17} /></div>
      </div>
    </div>
  );
}

function TrustBand() {
  return (
    <section className="trust-band" aria-label="BYOKey Labの基本方針">
      <div className="trust-item"><LockKeyhole size={25} /><div><strong>キーは端末内で暗号化</strong><span>BYOKey Labのサーバーへ保存しません</span></div></div>
      <div className="trust-item"><Smartphone size={25} /><div><strong>アカウント登録は不要</strong><span>設定と履歴は端末を中心に管理</span></div></div>
      <div className="trust-item"><Languages size={25} /><div><strong>AIを選べる設計</strong><span>Gemini・OpenAI・Claudeの接続方式を検証中</span></div></div>
    </section>
  );
}

function HomePage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main>
        <section className="lab-hero">
          <div className="eyebrow"><ShieldCheck size={17} /> Bring Your Own Key</div>
          <h1>BYOKey Lab</h1>
          <p className="hero-lead">好きなAIを選ぶ。<br />キーとデータを、自分の手元に。</p>
          <p className="hero-copy">月額サービスに閉じ込めず、自分のAPIキーで必要な機能だけを使う。BYOKey Labは、買い切り型の小さな道具をつくります。</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={() => onNavigate("/speak/english/")}>最初のプロダクトを見る<ArrowRight size={18} /></button>
            <button className="button button-secondary" type="button" onClick={() => onNavigate("/guide/api/")}>API設定ガイド<BookOpen size={18} /></button>
          </div>
        </section>
        <section className="demo-band">
          <div className="section-intro compact-intro">
            <p className="section-kicker">HOW IT WORKS</p>
            <h2>選ぶ。設定する。使い始める。</h2>
            <p>複雑な会員登録や月額プランはありません。APIキーは、使う人の端末から選択したAIへ直接つながります。</p>
          </div>
          <ProviderPicker />
        </section>
        <TrustBand />
        <section className="principles-section" id="principles">
          <div className="section-intro">
            <p className="section-kicker">OUR PRINCIPLES</p>
            <h2>「ローカル保存」と「外部AIへの送信」を、曖昧にしない。</h2>
          </div>
          <div className="data-columns">
            <article>
              <div className="principle-icon local"><Smartphone size={23} /></div>
              <h3>端末内に保存</h3>
              <p>APIキー、アプリ設定、会話履歴などは、原則として利用者のAndroid端末内に保存します。</p>
              <ul><li><Check size={17} />APIキーは暗号化</li><li><Check size={17} />独自アカウント不要</li><li><Check size={17} />データベースへの収集なし</li></ul>
            </article>
            <article>
              <div className="principle-icon direct"><ExternalLink size={23} /></div>
              <h3>選んだAIへ直接送信</h3>
              <p>回答を生成するために必要な会話内容は、利用者が選んだLLM事業者へ送信されます。</p>
              <ul>{providers.map((provider) => <li key={provider.id}><ChevronRight size={17} />{provider.name} API</li>)}</ul>
            </article>
          </div>
          <button className="text-link" type="button" onClick={() => onNavigate("/privacy/")}>データの取り扱いを詳しく見る<ArrowRight size={17} /></button>
        </section>
        <section className="product-section">
          <div className="product-copy">
            <p className="section-kicker">FIRST PRODUCT</p>
            <h2>BYOKey Speak<br />for English</h2>
            <p>英語が出てこない瞬間も、会話を止めない。Quick Assistが日本語の質問を自然な英語に変え、書きかけの文章へ追加します。</p>
            <div className="inline-meta"><span>Android</span><span>買い切り予定</span><span>API利用料は別</span></div>
            <button className="button button-dark" type="button" onClick={() => onNavigate("/speak/english/")}>製品ページへ<ArrowRight size={18} /></button>
          </div>
          <QuickAssistCard compact />
        </section>
        <FinalCta onNavigate={onNavigate} />
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function QuickAssistCard({ compact = false }) {
  const initialDraft = "I went to Kyoto and ... 紅葉ってなんて言う？";
  const [draft, setDraft] = useState(initialDraft);
  const [assisted, setAssisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const suggestion = "autumn leaves / fall foliage";

  const insertSuggestion = () => {
    setDraft("I went to Kyoto and saw the autumn leaves.");
    setAssisted(true);
  };

  return (
    <div className={compact ? "assist-demo is-compact" : "assist-demo"}>
      <div className="assist-topline"><span><Sparkles size={17} /> Quick Assist</span><span>A2</span></div>
      <label htmlFor={compact ? "compact-draft" : "hero-draft"}>あなたの下書き</label>
      <textarea id={compact ? "compact-draft" : "hero-draft"} value={draft} onChange={(event) => { setDraft(event.target.value); setAssisted(false); }} />
      {!assisted ? (
        <div className="assist-result">
          <div><small>自然な英語の提案</small><strong>{suggestion}</strong></div>
          <div className="assist-actions">
            <button className="icon-button" type="button" onClick={() => { navigator.clipboard?.writeText(suggestion); setCopied(true); }} aria-label="提案をコピー">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
            <button className="button button-assist" type="button" onClick={insertSuggestion}>挿入する<ArrowRight size={17} /></button>
          </div>
        </div>
      ) : (
        <div className="insert-success" role="status"><CheckCircle2 size={18} />下書きを残したまま追加しました</div>
      )}
      {!compact && <button className="reset-link" type="button" onClick={() => { setDraft(initialDraft); setAssisted(false); }}>デモを最初に戻す</button>}
    </div>
  );
}

function ConversationPreview() {
  return (
    <div className="conversation-preview">
      <div className="conversation-header">
        <div><strong>Daily Conversation</strong><span>A2</span></div>
        <button className="icon-button" type="button" aria-label="読み上げ"><Volume2 size={19} /></button>
      </div>
      <div className="chat-message coach-message">
        <div className="avatar coach-avatar">C</div>
        <div><span>Coach</span><p>That sounds like a great trip! What did you enjoy the most in Kyoto?</p></div>
      </div>
      <QuickAssistCard />
      <div className="chat-message coach-message feedback-message">
        <div className="avatar coach-avatar">C</div>
        <div><span>Coach</span><p>Kyoto in autumn is beautiful. Did you visit any temples or gardens?</p><small>自然な表現</small></div>
      </div>
      <div className="chat-composer"><span>英語でも日本語でも入力できます</span><Mic size={19} /><Send size={19} /></div>
    </div>
  );
}

function SpeakPage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} active="speak" />
      <main>
        <section className="speak-hero">
          <div className="speak-copy">
            <p className="eyebrow"><Zap size={17} /> Android英会話アプリ</p>
            <h1>BYOKey Speak<br />for English</h1>
            <p className="hero-lead">月額なし。言葉につまっても、会話は止めない。</p>
            <p className="hero-copy">英語が出てこないときは、日本語のまま聞く。Quick Assistが自然な表現を提案し、書きかけの文章を残したまま会話へ戻します。</p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => document.getElementById("release")?.scrollIntoView({ behavior: "smooth" })}><Play size={18} fill="currentColor" />Google Playで公開予定</button>
              <button className="button button-secondary" type="button" onClick={() => onNavigate("/guide/api/")}><BookOpen size={18} />API設定ガイド</button>
            </div>
            <p className="fine-print">買い切り予定。Gemini / OpenAI / ClaudeのAPI利用料は別途かかります。</p>
          </div>
          <ConversationPreview />
        </section>
        <TrustBand />
        <section className="speed-section">
          <div className="section-intro">
            <p className="section-kicker">QUICK ASSIST</p>
            <h2>調べるために、会話から離れない。</h2>
            <p>翻訳アプリへ移動して、コピーして、戻って、消えた下書きを直す。その手間を、会話の中のひとつの操作にまとめます。</p>
          </div>
          <div className="speed-flow">
            <div><span>01</span><Mic size={22} /><strong>日本語で聞く</strong><p>テキストでも音声でも、その場で質問。</p></div>
            <ArrowRight className="flow-arrow" size={23} />
            <div><span>02</span><Sparkles size={22} /><strong>自然な表現を得る</strong><p>会話の文脈に合う候補をすぐに提案。</p></div>
            <ArrowRight className="flow-arrow" size={23} />
            <div><span>03</span><MessageCircle size={22} /><strong>会話を続ける</strong><p>下書きを上書きせず、必要な表現だけを追加。</p></div>
          </div>
        </section>
        <section className="coach-section">
          <div className="coach-copy">
            <p className="section-kicker">YOUR COACH</p>
            <h2>レベルも、先生の話し方も、自分で決める。</h2>
            <p>CEFR A1からC2まで、語彙や文の長さを調整。さらに「Coach Personalities & Skills」へ希望を書くと、解説の仕方や会話のテンポも変えられます。</p>
          </div>
          <div className="coach-settings">
            <div className="level-row"><span>CEFR</span>{["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => <button className={level === "A2" ? "is-selected" : ""} key={level} type="button">{level}</button>)}</div>
            <label htmlFor="coach-skill">Coach Personalities &amp; Skills</label>
            <textarea id="coach-skill" defaultValue="Be a patient teacher. Keep the conversation moving, accept Japanese questions, and explain corrections briefly after I reply." />
          </div>
        </section>
        <section className="release-section" id="release">
          <div>
            <p className="section-kicker">RELEASE</p>
            <h2>Google Play公開に向けて準備中です。</h2>
            <p>販売価格と公開日は、審査準備が整い次第このページでお知らせします。</p>
          </div>
          <button className="button button-dark" type="button" onClick={() => onNavigate("/guide/api/")}>先にAPIキーの準備方法を見る<ArrowRight size={18} /></button>
        </section>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function GuidePage({ onNavigate }) {
  const [provider, setProvider] = useState("gemini");
  const selectedProvider = useMemo(() => providers.find((item) => item.id === provider), [provider]);
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main className="document-page">
        <div className="document-header"><p className="section-kicker">API SETUP GUIDE</p><h1>APIキーの準備と接続</h1><p>BYOKey Speakを使うには、対応するLLM事業者でAPIキーを取得します。ChatGPTやClaudeの月額プランとは別の仕組みです。</p></div>
        <div className="guide-layout">
          <aside className="guide-provider-list" aria-label="プロバイダー選択">
            {providers.map((item) => <button className={provider === item.id ? "is-selected" : ""} type="button" key={item.id} onClick={() => setProvider(item.id)}><span className={`provider-mark provider-${item.id}`}>{item.mark}</span>{item.name}</button>)}
          </aside>
          <section className="guide-content">
            <div className="guide-callout"><CircleHelp size={21} /><div><strong>利用料金を先に確認してください</strong><p>API利用料は{selectedProvider.name}から直接請求されます。上限設定や使用量の確認方法は各社の公式画面で確認してください。</p></div></div>
            {selectedProvider.clientWarning && <div className="guide-callout provider-warning"><ShieldCheck size={21} /><div><strong>モバイルアプリでの利用に関する注意</strong><p>{selectedProvider.clientWarning}</p></div></div>}
            <ol className="guide-steps">
              <li><span>1</span><div><h2>{selectedProvider.name}の開発者向けページを開く</h2><p>{selectedProvider.owner}の公式アカウントでログインし、API利用の設定を行います。</p><a className="official-link" href={selectedProvider.guideUrl} target="_blank" rel="noreferrer">公式ガイドを開く<ExternalLink size={16} /></a></div></li>
              <li><span>2</span><div><h2>新しいAPIキーを作成する</h2><p>キーは他人に見せず、公開リポジトリやSNSへ貼り付けないでください。</p></div></li>
              <li><span>3</span><div><h2>アプリへ貼り付け、接続テストを行う</h2><p>BYOKey Speakの設定画面でプロバイダーとモデルを選び、APIキーを入力します。</p></div></li>
            </ol>
            <div className="guide-callout warning"><ShieldCheck size={21} /><div><strong>キーを共有しない</strong><p>BYOKey Labがメール、フォーム、サポート対応でAPIキーの送信を求めることはありません。</p></div></div>
          </section>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function PrivacyPage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main className="document-page privacy-page">
        <div className="document-header"><p className="section-kicker">PRIVACY</p><h1>プライバシーポリシー</h1><p>BYOKey Speak for Englishにおけるデータの取り扱い方針です。</p><small>最終更新: 2026年7月20日</small></div>
        <div className="policy-summary">
          <div><LockKeyhole size={22} /><strong>APIキー</strong><span>端末内で暗号化して保存</span></div>
          <div><Smartphone size={22} /><strong>会話と設定</strong><span>原則として端末内に保存</span></div>
          <div><ExternalLink size={22} /><strong>回答生成</strong><span>選択したLLM事業者へ直接送信</span></div>
        </div>
        <article className="policy-body">
          <h2>1. 対象</h2><p>本ポリシーは、BYOKey Labが提供するAndroidアプリ「BYOKey Speak for English」に適用されます。</p>
          <h2>2. アプリ内で扱う情報</h2><p>APIキー、会話内容、コーチ設定、CEFRレベル、学習メモなどを扱います。これらは原則として利用者の端末内に保存されます。</p>
          <h2>3. APIキー</h2><p>APIキーはAndroid端末内で暗号化して保存します。BYOKey Labが運営するサーバーには送信しません。キーは、利用者が選択したLLMサービスへの認証にのみ利用します。</p>
          <h2>4. 外部LLMサービスへの送信</h2><p>回答を生成するため、入力した文章、必要な会話履歴、CEFRレベル、コーチ設定を、選択したGoogle Gemini API、OpenAI API、またはAnthropic Claude APIへ直接送信します。送信情報の取り扱いは各社の規約とプライバシーポリシーに従います。</p>
          <h2>5. BYOKey Labによる収集</h2><p>現行版では、独自のユーザー登録、クラウドデータベース、広告SDK、アクセス解析SDKを使用しません。Google Playは購入やインストール等の情報をGoogleの仕組みに基づいて処理する場合があります。</p>
          <h2>6. データの削除</h2><p>アプリ内の削除機能、またはアプリのアンインストールにより端末内データを削除できます。APIキーは設定画面から削除できます。</p>
          <h2>7. セキュリティ</h2><p>APIキーの保護にはAndroid KeystoreとAES-GCM暗号化を使用し、通信はHTTPSに限定します。ただし、端末、通信経路、外部サービスを含むすべてのリスクを完全に排除することはできません。</p>
          <h2>8. お問い合わせ</h2><p>運営者情報と連絡先は、Google Playでの公開前に本ページへ掲載します。</p>
        </article>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function FinalCta({ onNavigate }) {
  return <section className="final-cta"><h2>AIを借りるだけでなく、<br />自分の道具として使う。</h2><button className="button button-primary" type="button" onClick={() => onNavigate("/speak/english/")}>BYOKey Speakを見る<ArrowRight size={18} /></button></section>;
}

function Footer({ onNavigate }) {
  return (
    <footer><Brand onNavigate={onNavigate} /><p>自分のAPIキーで、必要なAIを使う。</p><div><button type="button" onClick={() => onNavigate("/privacy/")}>プライバシー</button><button type="button" onClick={() => onNavigate("/guide/api/")}>API設定ガイド</button></div><small>© 2026 BYOKey Lab</small></footer>
  );
}

export function App() {
  const [path, navigate] = usePath();

  useEffect(() => {
    if (path.startsWith("/speak/english")) document.title = "BYOKey Speak for English | BYOKey Lab";
    else if (path.startsWith("/guide/api")) document.title = "API設定ガイド | BYOKey Lab";
    else if (path.startsWith("/privacy")) document.title = "プライバシーポリシー | BYOKey Lab";
    else document.title = "BYOKey Lab";
  }, [path]);

  if (path.startsWith("/speak/english")) return <SpeakPage onNavigate={navigate} />;
  if (path.startsWith("/guide/api")) return <GuidePage onNavigate={navigate} />;
  if (path.startsWith("/privacy")) return <PrivacyPage onNavigate={navigate} />;
  return <HomePage onNavigate={navigate} />;
}
