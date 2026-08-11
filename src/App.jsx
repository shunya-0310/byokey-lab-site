import { useEffect, useMemo, useState } from "react";
import byokeyLabLogo from "./assets/byokey-lab-logo.png";
import { SPEAK_APP_URL, absoluteUrl, buildJsonLd, getSeoForPath } from "./seo.js";
import {
  ArrowRight,
  BadgeDollarSign,
  BrainCircuit,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Crown,
  Database,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";

const contactFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSf14ucq_SU36hxEQSsw0W5eBJ1WVp7PYjCaaEHu9GKRWyWQVw/viewform?usp=publish-editor";
const speakAppUrl = SPEAK_APP_URL;

const providers = [
  {
    id: "gemini",
    name: "Gemini",
    owner: "Google",
    mark: "G",
    guideUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    owner: "OpenAI",
    mark: "O",
    guideUrl: "https://platform.openai.com/api-keys",
    clientWarning: "OpenAIは、APIキーをブラウザやモバイルアプリなどのクライアント環境へ配置しないよう公式に案内しています。BYOKey LabのPWA版では、本文書の記載時点でOpenAI APIキーには対応しません。",
  },
  {
    id: "claude",
    name: "Claude",
    owner: "Anthropic",
    mark: "C",
    guideUrl: "https://console.anthropic.com/settings/keys",
    clientWarning: "AnthropicのTypeScript SDKはブラウザ利用を明示的な設定で許可できますが、クライアント側APIキーには追加の注意が必要です。BYOKey LabのPWA版では、本文書の記載時点でClaude APIキーには対応しません。",
  },
];

const providerGuides = {
  gemini: {
    guidePdf: "/guides/api-key-guide-gemini.pdf",
    requirements: [
      "Googleアカウント",
      "Google AI StudioのプロジェクトとAPIキー",
      "有料枠を使う場合はCloud Billingの支払い方法とプリペイド残高",
    ],
    notes: "一部モデルには無料枠があります。有料枠では、AI StudioからCloud Billingを作成または連携し、原則として最低10米ドル相当のクレジットを前払いします。",
    steps: [
      "Google AI StudioへGoogleアカウントでログインする",
      "API KeysでプロジェクトとAPIキーを作成する",
      "有料枠を使う場合はSet up billingからCloud Billingと支払い方法を設定し、クレジットを購入する",
      "AI StudioのSpendで月間上限を設定し、BYOKey Speakで接続を確認する",
    ],
    billingUrl: "https://ai.google.dev/gemini-api/docs/billing",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  openai: {
    guidePdf: "/guides/api-key-guide-gpt.pdf",
    requirements: [
      "OpenAI Platformアカウント（ChatGPTの契約とは別会計）",
      "APIプロジェクトとプロジェクト用APIキー",
      "クレジットカードまたはデビットカードとAPIクレジット",
    ],
    notes: "新規APIアカウントはプリペイド方式が基本で、最低購入額は5米ドルです。初期設定ではAuto rechargeが有効になる場合があるため、不要なら無効化するか月間上限を設定します。",
    steps: [
      "OpenAI Platformへログインし、API用のプロジェクトを作成する",
      "Billingで支払い方法を登録し、APIクレジットを購入する",
      "API Keysでプロジェクト用の新しいキーを作成する",
      "利用上限と通知を設定する。モバイル利用の可否は下記注意事項も確認する",
    ],
    billingUrl: "https://help.openai.com/en/articles/8264644-how-can-i-set-up-prepaid-billing",
    pricingUrl: "https://developers.openai.com/api/docs/models",
  },
  claude: {
    guidePdfStatus: "作成中",
    requirements: [
      "Claude ConsoleアカウントとOrganization",
      "利用目的などのOrganization情報",
      "支払い方法、プリペイドのUsage Credits、APIキー",
    ],
    notes: "Claudeの個人向け有料プランとは別会計です。ConsoleのBillingでUsage Creditsを先に購入し、必要ならAuto reloadを低い上限で設定します。",
    steps: [
      "Claude Consoleへ登録し、Organization情報と利用目的を入力する",
      "Billingで支払い方法を登録し、Usage Creditsを購入する",
      "API Keysで用途を分けた新しいキーを作成する",
      "使用量と残高を確認し、BYOKey Speakで接続を確認する",
    ],
    billingUrl: "https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage",
    pricingUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
};

const productProviders = providers.filter((provider) => provider.id === "gemini");

function ByokAppDiagram() {
  return (
    <section className="diagram-section" aria-labelledby="byok-diagram-title">
      <div className="section-intro">
        <p className="section-kicker">BYOK APP DIAGRAM</p>
        <h2 id="byok-diagram-title">BYOKアプリの流れ</h2>
        <p>アプリ開発者、ユーザー、LLMプロバイダーの関係を図解しました。キーとデータをどこで扱うのかを、公開前に曖昧にしないための基本図です。</p>
      </div>
      <figure className="diagram-frame">
        <img src="/images/byok-app-diagram.png" alt="BYOKアプリの仕組み。開発者がアプリを提供し、ユーザーがAPIキーとAPI利用料をLLMプロバイダーへ用意する関係を示した図解。" />
        <figcaption>
          <a href="/guides/byok-app-diagram.pdf" target="_blank" rel="noreferrer">PDFで開く<ExternalLink size={15} /></a>
        </figcaption>
      </figure>
    </section>
  );
}

const pricingModels = [
  { provider: "Google", model: "Gemini 3.1 Flash-Lite", input: 0.25, output: 1.5, recommended: true },
  { provider: "Google", model: "Gemini 2.5 Flash", input: 0.3, output: 2.5, lifecycle: "2026年10月16日以降停止予定" },
  { provider: "Google", model: "Gemini 3.5 Flash", input: 1.5, output: 9, quality: true },
  { provider: "OpenAI", model: "GPT-5.4 nano", input: 0.2, output: 1.25, review: true },
  { provider: "OpenAI", model: "GPT-5.4 mini", input: 0.75, output: 4.5, review: true },
  { provider: "OpenAI", model: "GPT-5.5", input: 5, output: 30, review: true },
  { provider: "Anthropic", model: "Claude Haiku 4.5", input: 1, output: 5 },
  { provider: "Anthropic", model: "Claude Sonnet 5", input: 2, output: 10, lifecycle: "2026年8月31日までの導入価格" },
  { provider: "Anthropic", model: "Claude Sonnet 4.6", input: 3, output: 15 },
  { provider: "Anthropic", model: "Claude Opus 4.8", input: 5, output: 25 },
];

const pricingAssumption = {
  inputTokensPerTurn: 1500,
  billedOutputTokensPerTurn: 2800,
};

const cefrProfiles = {
  A1: "短い文と基本語彙を中心に、日本語の助けも多めにします。",
  A2: "身近な話題を自然な短文で続け、必要なときだけ日本語で補助します。",
  B1: "理由や経験を少し詳しく話せるよう、追加質問と自然な言い換えを増やします。",
  B2: "抽象的な話題も扱い、細かなニュアンスや不自然な表現を指摘します。",
  C1: "複雑な話題と幅広い語彙を使い、流暢さと表現の精度を磨きます。",
  C2: "母語話者に近い速度と含意を扱い、文体や語感まで細かく調整します。",
};

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

function setMetaAttribute(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function updateSeo(path) {
  const route = getSeoForPath(path);
  const canonicalUrl = absoluteUrl(route.path);

  document.title = route.title;
  setMetaAttribute("name", "description", route.description);
  setMetaAttribute("property", "og:site_name", "BYOKey Lab");
  setMetaAttribute("property", "og:type", "website");
  setMetaAttribute("property", "og:locale", "ja_JP");
  setMetaAttribute("property", "og:title", route.title);
  setMetaAttribute("property", "og:description", route.description);
  setMetaAttribute("property", "og:url", canonicalUrl);
  setMetaAttribute("property", "og:image", `${absoluteUrl("/")}images/byok-app-diagram.png`);
  setMetaAttribute("name", "twitter:card", "summary_large_image");
  setMetaAttribute("name", "twitter:title", route.title);
  setMetaAttribute("name", "twitter:description", route.description);
  setMetaAttribute("name", "twitter:image", `${absoluteUrl("/")}images/byok-app-diagram.png`);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", canonicalUrl);

  let structuredData = document.head.querySelector('script[type="application/ld+json"][data-byokey-seo="true"]');
  if (!structuredData) {
    structuredData = document.createElement("script");
    structuredData.setAttribute("type", "application/ld+json");
    structuredData.setAttribute("data-byokey-seo", "true");
    document.head.appendChild(structuredData);
  }
  structuredData.textContent = JSON.stringify(buildJsonLd(route));
}

function InternalLink({ to, onNavigate, children, ...props }) {
  const handleClick = (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onNavigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function Brand({ onNavigate }) {
  return (
    <InternalLink className="brand" to="/" onNavigate={onNavigate} aria-label="BYOKey Lab ホーム">
      <span className="brand-mark brand-logo-crop" aria-hidden="true"><img src={byokeyLabLogo} alt="" /></span>
      <span>BYOKey Lab</span>
    </InternalLink>
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
          <InternalLink to="/#principles" onNavigate={go}>考え方</InternalLink>
          <InternalLink className={active === "speak" ? "is-active" : ""} to="/speak/english/" onNavigate={go}>プロダクト</InternalLink>
          <InternalLink to="/important/" onNavigate={go}>重要事項</InternalLink>
          <InternalLink to="/privacy/" onNavigate={go}>プライバシー</InternalLink>
          <InternalLink to="/speak/english/#faq" onNavigate={go}>FAQ</InternalLink>
          <InternalLink to="/guide/api/" onNavigate={go}>API設定ガイド</InternalLink>
        </nav>
        <button className="icon-button menu-button" type="button" onClick={() => setOpen(!open)} aria-label={open ? "メニューを閉じる" : "メニューを開く"}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function ByokeyFlow() {
  return (
    <div className="setup-demo" aria-label="BYOKアプリを使い始めるまでの3ステップ">
      <article className="setup-step provider-step">
        <p className="step-label">01 / プロバイダー</p>
        <h2>Geminiを選ぶ</h2>
        <div className="provider-list" aria-label="BYOKey Speak PWA版で対応予定のLLMプロバイダー">
          {productProviders.map((provider) => (
            <div className="provider-option" key={provider.id}>
              <span className={`provider-mark provider-${provider.id}`}>{provider.mark}</span>
              <span><strong>{provider.name}</strong><small>{provider.owner} / PWA版で対応予定</small></span>
            </div>
          ))}
        </div>
        <p className="flow-description">Geminiのみから開始する理由は、APIキーの扱いに関する重要事項で説明しています。</p>
      </article>
      <article className="setup-step key-step">
        <p className="step-label">02 / APIキー</p>
        <h2>ブラウザで入力する</h2>
        <div className="flow-visual key-visual" aria-hidden="true">
          <span><Smartphone size={44} /></span>
          <ArrowRight size={22} />
          <span><LockKeyhole size={40} /></span>
        </div>
        <p className="flow-description">取得したGemini APIキーをPWAへ入力。キーはBYOKey Labのサーバーへ預けず、利用者のブラウザ内で扱います。</p>
      </article>
      <article className="setup-step conversation-step">
        <p className="step-label">03 / アプリ</p>
        <h2>すぐに使い始める</h2>
        <div className="flow-visual app-visual" aria-hidden="true">
          <span><MessageCircle size={42} /></span>
          <ArrowRight size={22} />
          <span><BrainCircuit size={42} /></span>
        </div>
        <p className="flow-description">ブラウザからGemini APIへ接続。月額会員登録を挟まず、必要な機能をすぐに試せます。</p>
      </article>
    </div>
  );
}

function TrustBand() {
  return (
    <section className="trust-band" aria-label="BYOKey Labの基本方針">
      <div className="trust-item"><LockKeyhole size={25} /><div><strong>キーはサーバーへ預けない</strong><span>PWAでは利用者のブラウザ内で扱います</span></div></div>
      <div className="trust-item"><Smartphone size={25} /><div><strong>透明性を優先</strong><span>Git公開できるWeb構成を採用します</span></div></div>
      <div className="trust-item"><BrainCircuit size={25} /><div><strong>Gemini専用から開始</strong><span>BYOK検証を小さく始めます</span></div></div>
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
          <h1 className="sr-only">BYOKey Lab</h1>
          <div className="brand-lockup"><img src={byokeyLabLogo} alt="BYOKey Lab - The Key is in your hand" /></div>
          <p className="hero-lead">AIアプリは、もう、<br />定額に縛られない。</p>
          <p className="hero-copy">BYOKey Labは、利用者自身のAPIキーで動く小さなAIツールをつくります。本文書の記載時点では、モバイルアプリではなく、PWAとPCアプリを中心に進めます。PWAとは、ブラウザから使えるWebアプリで、ホーム画面にも追加できる形式です。</p>
          <div className="hero-actions">
            <InternalLink className="button button-primary" to="/speak/english/" onNavigate={onNavigate}>最初のプロダクトを見る<ArrowRight size={18} /></InternalLink>
            <InternalLink className="button button-secondary" to="/important/" onNavigate={onNavigate}>重要事項を見る<ShieldAlert size={18} /></InternalLink>
            <InternalLink className="button button-secondary" to="/guide/api/" onNavigate={onNavigate}>API設定ガイド<BookOpen size={18} /></InternalLink>
          </div>
        </section>
        <section className="demo-band">
          <p className="byok-definition">BYOK（Bring Your Own Key）アプリとは、LLM（Geminiなど）の「自分のAPIキー」を設定してAIを使う形です。ただし、APIキーをクライアント環境に置く構成にはリスクがあるため、BYOKey Labでは公開形態ごとに扱いを分けます。</p>
          <ByokAppDiagram />
          <div className="section-intro compact-intro">
            <p className="section-kicker">HOW IT WORKS</p>
            <h2 className="steps-heading"><span>選ぶ。</span><span>設定する。</span><span>使い始める。</span></h2>
            <p>複雑な会員登録や月額プランはありません。PWA版ではGeminiを対象に、利用者がAPIキーのリスクを理解し同意したうえで使い始めます。</p>
          </div>
          <ByokeyFlow />
        </section>
        <TrustBand />
        <section className="principles-section" id="principles">
          <div className="section-intro">
            <p className="section-kicker">OUR PRINCIPLES</p>
            <h2 className="principles-heading"><span>ユーザーも、アプリ開発者も、</span><span>簡単に試せる。使える。次へ行ける。</span></h2>
          </div>
          <div className="data-columns">
            <article>
              <div className="principle-icon local"><Smartphone size={23} /></div>
              <h3>ユーザー</h3>
              <p>アカウント登録なしで試せる構成を優先します。PWA版ではAPIキーをBYOKey Labのサーバーへ送らず、PCアプリでは環境変数など利用者本人のローカル実行環境で扱う方針です。</p>
              <ul><li><Check size={17} />APIキーをBYOKey Labへ預けない</li><li><Check size={17} />専用キーと利用上限の設定を前提にする</li><li><Check size={17} />モバイルアプリ公開は見送る</li></ul>
            </article>
            <article>
              <div className="principle-icon direct"><ExternalLink size={23} /></div>
              <h3>アプリ開発者</h3>
              <p>ユーザー登録や会員データベースを持たず、API利用料もユーザー自身の契約へ分離できます。共通のBYOK設計を、学習、文章作成、業務支援など、さまざまなアプリへ展開できます。</p>
              <ul><li><ChevronRight size={17} />ユーザー情報の複雑な管理を減らす</li><li><ChevronRight size={17} />API従量課金を直接負担しない</li><li><ChevronRight size={17} />同じ仕組みを複数アプリへ展開</li></ul>
            </article>
          </div>
          <InternalLink className="text-link" to="/important/" onNavigate={onNavigate}>重要事項を詳しく見る<ArrowRight size={17} /></InternalLink>
        </section>
        <section className="product-section">
          <div className="product-copy">
            <p className="section-kicker">FIRST PRODUCT</p>
            <h2 className="product-title"><span>BYOKey</span><span>Speak</span><small>for English</small></h2>
            <p>英語が出てこない瞬間も、Quick Assistが日本語の質問から自然な表現を提案。会話の流れを止めません。</p>
            <div className="inline-meta"><span>PWA公開中</span><span>Gemini APIのみ</span><span>API代は利用者負担</span></div>
            <InternalLink className="button button-dark" to="/speak/english/" onNavigate={onNavigate}>製品ページへ<ArrowRight size={18} /></InternalLink>
          </div>
          <QuickAssistCard compact />
        </section>
        <FinalCta onNavigate={onNavigate} />
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function SpeakFeatureBand() {
  const features = [
    {
      icon: MessageCircle,
      title: "ニュースから話し始める",
      body: "毎朝届く世界のトップニュースをきっかけに、政治・経済、技術、スポーツ、エンタメの話題で会話できます。",
    },
    {
      icon: Sparkles,
      title: "言葉に詰まっても続けられる",
      body: "Quick Assistで、日本語の質問から会話の文脈に合う英語表現をその場で提案します。",
    },
    {
      icon: CheckCircle2,
      title: "話し方の癖を振り返る",
      body: "会話履歴が溜まると、推定CEFRレベル、よくある間違い、次に伸ばすポイントを分析できます。",
    },
  ];

  return (
    <section className="speak-features" aria-label="BYOKey Speakの基本機能">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <article key={feature.title}>
            <Icon size={24} />
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        );
      })}
    </section>
  );
}

function QuickAssistCard({ compact = false }) {
  const initialDraft = "I went to Kyoto and ... えっと、紅葉ってなんて言うんだっけ？";
  const completedDraft = "I went to Kyoto and saw the autumn leaves.";
  const [assistState, setAssistState] = useState("idle");
  const [copied, setCopied] = useState(false);
  const suggestion = "autumn leaves / fall foliage";
  const draft = ["inserted", "sending", "replied"].includes(assistState) ? completedDraft : initialDraft;

  const requestSuggestion = () => {
    setAssistState("loading");
    window.setTimeout(() => setAssistState("ready"), 700);
  };

  const insertSuggestion = () => {
    setAssistState("inserted");
  };

  const sendMessage = () => {
    setAssistState("sending");
    window.setTimeout(() => setAssistState("replied"), 700);
  };

  const resetDemo = () => {
    setAssistState("idle");
    setCopied(false);
  };

  return (
    <div className={compact ? "assist-demo is-compact" : "assist-demo"}>
      <div className="assist-topline"><span><Sparkles size={17} /> Quick Assist</span></div>
      {compact && <div className="assist-context"><small>Coach</small><p>What did you enjoy most about your trip to Kyoto?</p></div>}
      <label htmlFor={compact ? "compact-draft" : "hero-draft"}>{compact ? "講師への質問" : "あなたの下書き"}</label>
      <textarea id={compact ? "compact-draft" : "hero-draft"} value={draft} readOnly aria-readonly="true" />
      {assistState === "idle" && (
        <button className="assist-request" type="button" onClick={requestSuggestion}><Sparkles size={17} />AIに自然な表現を聞く</button>
      )}
      {assistState === "loading" && (
        <div className="assist-loading" role="status"><LoaderCircle size={18} />AIが会話の文脈を読んでいます...</div>
      )}
      {assistState === "ready" && (
        <div className="assist-result">
          <div><small>AIからの提案</small><strong>{suggestion}</strong></div>
          <div className="assist-actions">
            <button className="icon-button" type="button" onClick={() => { navigator.clipboard?.writeText(suggestion); setCopied(true); }} aria-label="提案をコピー">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
            <button className="button button-assist" type="button" onClick={insertSuggestion}>挿入する<ArrowRight size={17} /></button>
          </div>
        </div>
      )}
      {assistState === "inserted" && (
        <div className="assist-inserted">
          <div className="insert-success" role="status"><CheckCircle2 size={18} />自然な表現を挿入しました</div>
          <button className="button button-assist" type="button" onClick={sendMessage}>送信する<Send size={17} /></button>
        </div>
      )}
      {assistState === "sending" && (
        <div className="assist-loading" role="status"><LoaderCircle size={18} />講師が返信を考えています...</div>
      )}
      {assistState === "replied" && (
        <div className="assist-conversation" aria-live="polite">
          <div className="assist-sent"><small>You</small><p>{completedDraft}</p></div>
          <div className="assist-reply"><small>Coach</small><p>Kyoto in autumn is beautiful. Did you visit any temples or gardens?</p></div>
        </div>
      )}
      {assistState !== "idle" && assistState !== "loading" && <button className="reset-link" type="button" onClick={resetDemo}><RotateCcw size={14} />デモを最初に戻す</button>}
    </div>
  );
}

function ConversationPreview() {
  return (
    <div className="conversation-preview">
      <div className="conversation-header">
        <div><strong>Daily Conversation</strong></div>
        <button className="icon-button" type="button" aria-label="読み上げ"><Volume2 size={19} /></button>
      </div>
      <div className="chat-message coach-message">
        <div className="avatar coach-avatar">C</div>
        <div><span>Coach</span><p>That sounds like a great trip! What did you enjoy the most in Kyoto?</p></div>
      </div>
      <QuickAssistCard />
      <div className="chat-composer"><span>英語でも日本語でも入力できます</span><Mic size={19} /><Send size={19} /></div>
    </div>
  );
}

function PricingSimulator() {
  const [yenRate, setYenRate] = useState(160);
  const monthlyCost = (model, turnsPerDay) => {
    const turns = turnsPerDay * 30;
    const usd = ((turns * pricingAssumption.inputTokensPerTurn * model.input) + (turns * pricingAssumption.billedOutputTokensPerTurn * model.output)) / 1_000_000;
    return { usd, yen: Math.round(usd * yenRate) };
  };
  const formatUsd = (amount) => amount < 0.01 ? "<$0.01" : `$${amount.toFixed(2)}`;
  const formatYen = (amount) => `約${new Intl.NumberFormat("ja-JP").format(amount)}円`;

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-heading">
        <div className="section-intro">
          <p className="section-kicker"><BadgeDollarSign size={17} /> API COST</p>
          <h2>費用は使った分だけ。<br />予算上限を決めて使う。</h2>
          <p>下記は、毎日10往復または50往復を30日間続けた場合の高めの月額目安です。1往復を「入力約1,500トークン」と「思考トークンを含む課金対象出力約2,800トークン」として計算しています。</p>
        </div>
        <div className="market-price-card" aria-label="一般的なAI英会話アプリの月額相場">
          <span>一般的なAI英会話アプリの月額相場</span>
          <strong>約1,500円〜4,000円台/月</strong>
          <small>主要サービスの公開料金を月額・年額月換算で見た目安です。</small>
        </div>
        <label className="exchange-control" htmlFor="yen-rate">
          <span>換算レート</span>
          <span className="exchange-input"><strong>$1 =</strong><input id="yen-rate" type="number" min="80" max="300" step="1" value={yenRate} onChange={(event) => setYenRate(Math.min(300, Math.max(80, Number(event.target.value) || 160)))} /><strong>円</strong></span>
        </label>
      </div>
      <div className="pricing-table-wrap" tabIndex="0" aria-label="モデル別API料金表。横方向にスクロールできます。">
        <table className="pricing-table">
          <thead>
            <tr><th>プロバイダー</th><th>モデル</th><th>API単価 / 100万token</th><th>高めの月額目安<br />毎日10往復 × 30日</th><th>高めの月額目安<br />毎日50往復 × 30日</th></tr>
          </thead>
          <tbody>
            {pricingModels.map((model, index) => {
              const light = monthlyCost(model, 10);
              const heavy = monthlyCost(model, 50);
              const firstOfProvider = index === 0 || pricingModels[index - 1].provider !== model.provider;
              const providerCount = pricingModels.filter((item) => item.provider === model.provider).length;
              const recommended = model.recommended;
              return (
                <tr className={recommended ? "is-recommended" : ""} key={`${model.provider}-${model.model}`}>
                  {firstOfProvider && <th className={`price-provider price-${model.provider.toLowerCase()}`} scope="rowgroup" rowSpan={providerCount}>{model.provider}</th>}
                  <th scope="row"><span>{model.model}</span>{recommended && <small className="recommend-label"><Crown size={14} />推奨</small>}{model.quality && <small className="quality-label">品質重視</small>}{model.lifecycle && <small className="lifecycle-label">{model.lifecycle}</small>}{model.review && <small>PWA版は非対応</small>}</th>
                  <td><span>入力 ${model.input}</span><span>出力 ${model.output}</span></td>
                  <td><strong>{recommended && <Crown size={18} aria-hidden="true" />}{formatYen(light.yen)}</strong><small>{formatUsd(light.usd)}</small></td>
                  <td><strong>{recommended && <Crown size={18} aria-hidden="true" />}{formatYen(heavy.yen)}</strong><small>{formatUsd(heavy.usd)}</small></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="recommendation-note"><Crown size={18} />英会話の標準利用には、現行の安定版で低コストなGemini 3.1 Flash-Liteを推奨します。より細かな添削や複雑な指示を重視する場合はGemini 3.5 Flashも選べます。</p>
      <div className="pricing-notes">
        <p><CircleHelp size={18} /><span><strong>試算に含まれないもの</strong> 音声API、税、為替手数料、再送、さらに長い会話履歴、検索などの追加機能。実額は各社の請求画面で確認してください。</span></p>
        <p><RotateCcw size={18} /><span><strong>2026年7月30日確認</strong> Gemini 2.5 Flashは利用できますが、Googleは2026年10月16日を最短停止日として案内しています。<a href="https://ai.google.dev/gemini-api/docs/deprecations" target="_blank" rel="noreferrer">提供終了予定</a>と<a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Google料金</a>・<a href="https://developers.openai.com/api/docs/pricing" target="_blank" rel="noreferrer">OpenAI料金</a>・<a href="https://platform.claude.com/docs/en/about-claude/pricing" target="_blank" rel="noreferrer">Anthropic料金</a>の公式情報が正本です。</span></p>
      </div>
    </section>
  );
}

function CoachSettingsDemo() {
  const [level, setLevel] = useState("A2");
  return (
    <div className="coach-settings">
      <div className="level-row" role="radiogroup" aria-label="CEFRレベル">
        <span>CEFR</span>
        {Object.keys(cefrProfiles).map((item) => (
          <button className={level === item ? "is-selected" : ""} key={item} type="button" role="radio" aria-checked={level === item} onClick={() => setLevel(item)}>{item}</button>
        ))}
      </div>
      <div className="level-effect" role="status"><strong>{level}の会話レベル</strong><p>{cefrProfiles[level]}</p></div>
      <label htmlFor="coach-skill">Coach Personalities &amp; Skills</label>
      <textarea id="coach-skill" defaultValue={`# Coach Skills

## 目的
- ビジネスではなく日常会話を強化したい。

## 性格・口調
- かしこまった話し方ではなく、フランクに話す。
- スラングや気の利いた言い回しをよく使う。

## 添削方針
- 通じるけどネイティブは使わない表現も、「ネイティブではこうだよ」と細かく指摘する。

## 解説の言語
- 解説部分だけは英語だけでなく日本語も併記する。`} />
    </div>
  );
}

const faqGroups = [
  {
    id: "security",
    title: "セキュリティとプライバシー",
    icon: ShieldCheck,
    items: [
      ["APIキーはどのように扱われますか？", "PWA版ではGemini APIキーをBYOKey Labのサーバーへ送信しません。利用者のブラウザ内で扱い、保存する場合もブラウザの保存領域に限定します。公開時にはGitHubで実装を確認できる形にします。"],
      ["PWAならキーは安全ですか？", "いいえ。PWAもブラウザ上で動くクライアント環境です。サーバーへ預けない透明性はありますが、利用者の端末やブラウザが侵害された場合、APIキーの露出リスクは残ります。専用キー、低い上限、利用通知、定期的なキー交換を前提にしてください。"],
      ["会話内容はどこへ送信されますか？", "回答に必要な入力、会話履歴、CEFRレベル、Coach Personalities & Skillsは、Gemini APIへブラウザから送信されます。BYOKey Labのサーバーやデータベースは経由しません。送信後の保存期間や不正利用監視はGoogleのAPI規約に従います。"],
      ["会話はAIの学習に使われますか？", "契約形態で異なります。Googleは有料Gemini APIの入出力を製品改善に使わない一方、無料枠では利用する場合があります。必ず利用時点のGoogle公式情報を確認してください。"],
      ["OpenAIやClaudeには対応しますか？", "本文書の記載時点では対応しません。OpenAIとAnthropicにもブラウザ利用の技術的な導線はありますが、クライアント側APIキーの扱いに追加の注意が必要です。まずはGemini APIのみで、リスク説明、同意、利用上限、透明性を含むBYOK体験を小さく検証します。"],
      ["被害額を小さくするには何を設定すべきですか？", "BYOKey Labのアプリ専用のプロジェクトとキーを作り、少額のプリペイド残高、低い月間上限、利用通知を設定してください。キーを使い回さず、使用量を定期確認します。不審な利用があれば各社の管理画面で直ちにキーを無効化し、新しいキーへ交換してください。"],
      ["アプリ運営者は利用状況を収集しますか？", "PWA版では、独自ユーザー登録、広告SDK、クラウド会話履歴を使用しない設計から開始します。ただし、ホスティング事業者とGoogle Gemini APIは、それぞれの規約に基づき技術情報やAPI利用情報などを処理する場合があります。"],
    ],
  },
  {
    id: "api",
    title: "APIキーと料金",
    icon: KeyRound,
    items: [
      ["ChatGPT PlusやClaude Proの契約は使えますか？", "使えません。ChatGPT、Claude、Geminiの一般向け月額プランと開発者向けAPIは別のサービス・別会計です。各社の開発者向け画面でAPIキーとAPIの支払い設定を用意します。"],
      ["クレジットカード登録は必須ですか？", "有料APIを利用する場合は原則必要です。Geminiは一部モデルに無料枠がありますが、利用上限とデータ利用条件が有料枠と異なります。OpenAIとAnthropicは通常、支払い方法を登録してプリペイドクレジットを購入してから使います。"],
      ["API利用料は毎月固定ですか？", "固定ではありません。モデル、入出力トークン数、会話履歴の長さ、再試行、追加機能で変わります。料金表は比較のための試算で、BYOKey Labが請求する金額ではありません。"],
      ["APIキーを入力すると、その場で課金されますか？", "入力しただけでは通常は課金されません。接続テストや会話でAPIリクエストが成功すると、各社の料金体系に従って利用量が発生します。"],
      ["キーが使えなくなったらどうしますか？", "残高不足、利用上限、無効化、モデル名の変更、地域制限などが考えられます。まずプロバイダーのUsage・Billing・API Keys画面を確認し、その後アプリの接続テストを行います。"],
    ],
  },
  {
    id: "general",
    title: "アプリの使い方",
    icon: MessageCircle,
    items: [
      ["オフラインでも会話できますか？", "会話履歴や設定は端末内で確認できますが、AIから回答を生成するにはインターネット接続が必要です。"],
      ["日本語を混ぜても大丈夫ですか？", "はい。英語が出てこない部分を日本語で尋ね、Quick Assistで文脈に合う英語を提案できます。入力中の文章を消さずに必要な表現だけを追加します。"],
      ["端末を変えたときに履歴やキーは引き継がれますか？", "PWA版の初期方針では、APIキーを自動同期しません。履歴の保存や移行機能を提供する場合も、APIキーは含めず、新しいブラウザで再入力してもらいます。"],
      ["ブラウザのデータを削除するとどうなりますか？", "ブラウザに保存された設定、履歴、APIキーは削除されます。Google Gemini APIへ送信済みのデータは、Google側の保持方針に従います。"],
      ["問い合わせ先はどこですか？", `お問い合わせフォーム（${contactFormUrl}）からお願いします。APIキー、プロバイダーの秘密情報、支払い情報は送信しないでください。`],
    ],
  },
];

function FaqSection({ onNavigate }) {
  return (
    <section className="faq-section" id="faq">
      <div className="section-intro">
        <p className="section-kicker">FAQ</p>
        <h2>アプリを使用する前に。</h2>
        <p>APIキーや料金の仕組み、データの取り扱い、安全性について説明します。</p>
      </div>
      <div className="faq-groups">
        {faqGroups.map((group) => {
          const Icon = group.icon;
          return (
            <section className="faq-group" key={group.id} aria-labelledby={`faq-${group.id}`}>
              <h3 id={`faq-${group.id}`}><Icon size={22} />{group.title}</h3>
              <div className="faq-list">
                {group.items.map(([question, answer], index) => (
                  <details key={question} open={group.id === "security" && index === 0}>
                    <summary><span>{question}</span><ChevronDown size={19} /></summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="security-references">
        <strong>セキュリティ記述の根拠</strong>
        <div>
          <a href="https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety" target="_blank" rel="noreferrer">OpenAI APIキー安全指針<ExternalLink size={14} /></a>
          <a href="https://ai.google.dev/gemini-api/docs/api-key?hl=ja" target="_blank" rel="noreferrer">Gemini APIキー<ExternalLink size={14} /></a>
          <a href="https://docs.cloud.google.com/docs/authentication/api-keys-best-practices" target="_blank" rel="noreferrer">Google APIキー安全指針<ExternalLink size={14} /></a>
          <a href="https://ai.google.dev/gemini-api/docs/zdr" target="_blank" rel="noreferrer">Geminiデータ保持<ExternalLink size={14} /></a>
          <a href="https://platform.openai.com/docs/models/default-usage-policies-by-endpoint" target="_blank" rel="noreferrer">OpenAIデータ管理<ExternalLink size={14} /></a>
          <a href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data" target="_blank" rel="noreferrer">Anthropicデータ保持<ExternalLink size={14} /></a>
        </div>
      </div>
      <div className="faq-links"><InternalLink className="text-link" to="/important/" onNavigate={onNavigate}>重要事項を見る<ArrowRight size={17} /></InternalLink><InternalLink className="text-link" to="/guide/api/" onNavigate={onNavigate}>API設定ガイドを見る<ArrowRight size={17} /></InternalLink><InternalLink className="text-link" to="/privacy/" onNavigate={onNavigate}>プライバシーポリシーを見る<ArrowRight size={17} /></InternalLink></div>
    </section>
  );
}

function SpeakPage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} active="speak" />
      <main>
        <section className="speak-hero">
          <div className="speak-copy">
            <p className="eyebrow"><Zap size={17} /> BYOK英会話アプリ</p>
            <h1 className="speak-title"><span className="title-byokey">BYOKey</span><span className="title-speak">Speak</span><span className="title-for">for</span><span className="title-english">English</span></h1>
            <p className="hero-lead">費用は使った分だけ。</p>
            <p className="hero-copy">英語が出てこないときは、日本語のまま聞く。Quick Assistが自然な表現を提案し、<strong className="underlined-copy">会話の流れを止めません。</strong></p>
            <div className="hero-actions">
              <a className="button button-primary" href={speakAppUrl} target="_blank" rel="noreferrer"><Play size={18} fill="currentColor" />BYOKey Speakを開く</a>
              <InternalLink className="button button-secondary" to="/guide/api/" onNavigate={onNavigate}><BookOpen size={18} />API設定ガイド</InternalLink>
            </div>
            <p className="fine-print"><strong>PWA版はGemini APIのみ対応。</strong> Gemini API利用料はGoogleから直接請求されます。</p>
          </div>
          <ConversationPreview />
        </section>
        <TrustBand />
        <SpeakFeatureBand />
        <section className="speed-section">
          <div className="section-intro">
            <p className="section-kicker">QUICK ASSIST</p>
            <h2>言葉に詰まっても、会話は止まらない。</h2>
            <p>言葉に詰まったとき、翻訳アプリへ移動して、コピーして、また戻る…。こんな手間はQuick Assistがその場で解決します。</p>
          </div>
          <div className="speed-flow">
            <div><span>01</span><Mic size={22} /><strong>日本語で聞く</strong><p>テキストでも音声でも、その場で質問。</p></div>
            <ArrowRight className="flow-arrow" size={23} />
            <div><span>02</span><Sparkles size={22} /><strong>自然な表現を得る</strong><p>会話の文脈に合う候補をすぐに提案。</p></div>
            <ArrowRight className="flow-arrow" size={23} />
            <div><span>03</span><MessageCircle size={22} /><strong>会話を続ける</strong><p>下書きを上書きせず、その場で必要な表現だけを追加。</p></div>
          </div>
        </section>
        <section className="coach-section">
          <div className="coach-copy">
            <p className="section-kicker">YOUR COACH</p>
            <h2>レベルも、話し方も、自分で決める。</h2>
            <p>CEFR A1からC2まで、語彙や文の長さを調整。さらに「Coach Personalities & Skills」へ希望を書くと、解説の仕方や会話のテンポも変えられます。</p>
          </div>
          <CoachSettingsDemo />
        </section>
        <PricingSimulator />
        <FaqSection onNavigate={onNavigate} />
        <section className="release-section" id="release">
          <div>
            <p className="section-kicker">RELEASE</p>
            <h2>BYOKey Speak PWAを公開しました。</h2>
            <p>Gemini APIキーで試せるPWAとして公開しています。利用前に重要事項とAPI設定ガイドを確認し、専用キーと利用上限を設定したうえでお使いください。</p>
            <div className="install-steps">
              <strong>ホーム画面に追加して使う</strong>
              <ol>
                <li>SafariまたはChromeでBYOKey Speakを開く。</li>
                <li>iPhoneは共有ボタン、Androidはメニューから「ホーム画面に追加」を選ぶ。</li>
                <li>追加後はホーム画面のアイコンから起動する。</li>
              </ol>
            </div>
          </div>
          <div className="release-actions">
            <a className="button button-dark" href={speakAppUrl} target="_blank" rel="noreferrer">BYOKey Speakを開く<ExternalLink size={18} /></a>
            <InternalLink className="button button-secondary" to="/guide/api/" onNavigate={onNavigate}>API設定ガイド<ArrowRight size={18} /></InternalLink>
            <InternalLink className="text-link" to="/important/" onNavigate={onNavigate}>重要事項を見る<ArrowRight size={17} /></InternalLink>
          </div>
        </section>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function ProviderPdfGuide({ provider, guide }) {
  if (!guide.guidePdf) {
    return (
      <section className="pdf-guide-panel is-pending" aria-labelledby={`${provider.id}-pdf-guide`}>
        <div>
          <p className="step-label">DETAILED GUIDE</p>
          <h2 id={`${provider.id}-pdf-guide`}>{provider.name}の画像付き設定ガイド</h2>
          <p>Claude版のPDFガイドは作成中です。完成次第、このページでブラウザ閲覧できるように追加します。</p>
        </div>
        <span>{guide.guidePdfStatus || "作成中"}</span>
      </section>
    );
  }

  return (
    <section className="pdf-guide-panel" aria-labelledby={`${provider.id}-pdf-guide`}>
      <div className="pdf-guide-heading">
        <div>
          <p className="step-label">DETAILED GUIDE</p>
          <h2 id={`${provider.id}-pdf-guide`}>{provider.name}の画像付き設定ガイド</h2>
          <p>下のPDFをブラウザ上で確認できます。表示されない場合は、PDFを別タブで開いてください。</p>
        </div>
        <a className="official-link" href={guide.guidePdf} target="_blank" rel="noreferrer">PDFを別タブで開く<ExternalLink size={16} /></a>
      </div>
      <object className="pdf-viewer" data={`${guide.guidePdf}#view=FitH`} type="application/pdf" aria-label={`${provider.name} APIキー設定ガイドPDF`}>
        <iframe title={`${provider.name} APIキー設定ガイド`} src={`${guide.guidePdf}#view=FitH`} />
        <p>PDFを表示できませんでした。<a href={guide.guidePdf} target="_blank" rel="noreferrer">こちらからPDFを開いてください。</a></p>
      </object>
    </section>
  );
}

function GuidePage({ onNavigate }) {
  const [provider, setProvider] = useState("gemini");
  const selectedProvider = useMemo(() => providers.find((item) => item.id === provider), [provider]);
  const selectedGuide = providerGuides[provider];
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main className="document-page">
        <div className="document-header"><p className="section-kicker">API SETUP GUIDE</p><h1>APIキーの準備と接続</h1><p>BYOKey Speak PWA版を使うには、Google AI StudioでGemini APIキーを取得します。ChatGPTやClaudeの月額プランとは別の仕組みです。</p></div>
        <div className="guide-layout">
          <aside className="guide-provider-list" aria-label="プロバイダー選択">
            {providers.map((item) => <button className={provider === item.id ? "is-selected" : ""} type="button" key={item.id} onClick={() => setProvider(item.id)}><span className={`provider-mark provider-${item.id}`}>{item.mark}</span>{item.name}</button>)}
          </aside>
          <section className="guide-content">
            <div className="guide-callout"><CircleHelp size={21} /><div><strong>月額プランとは別の準備が必要です</strong><p>API利用料は{selectedProvider.name}から直接請求されます。一般向けの有料プランを契約中でも、APIの支払い設定とAPIキーは別途必要です。なお、BYOKey Speak PWA版の対応APIキーはGeminiのみです。</p></div></div>
            <div className="requirements-block">
              <div className="requirements-title"><Database size={21} /><div><p className="step-label">BEFORE YOU START</p><h2>{selectedProvider.name}で必要なもの</h2></div></div>
              <ul>{selectedGuide.requirements.map((requirement) => <li key={requirement}><CheckCircle2 size={18} />{requirement}</li>)}</ul>
              <p>{selectedGuide.notes}</p>
              <div className="guide-resource-links"><a href={selectedGuide.billingUrl} target="_blank" rel="noreferrer">請求設定の公式説明<ExternalLink size={15} /></a><a href={selectedGuide.pricingUrl} target="_blank" rel="noreferrer">公式料金表<ExternalLink size={15} /></a></div>
            </div>
            {selectedProvider.clientWarning && <div className="guide-callout provider-warning"><ShieldAlert size={21} /><div><strong>PWA版では非対応</strong><p>{selectedProvider.clientWarning}</p></div></div>}
            <ol className="guide-steps">
              {selectedGuide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><div><h2>{step}</h2>{index === 0 && <a className="official-link" href={selectedProvider.guideUrl} target="_blank" rel="noreferrer">APIキーの公式ガイドを開く<ExternalLink size={16} /></a>}{index === selectedGuide.steps.length - 1 && <p>APIキーはメール、チャット、問い合わせフォームへ送らず、BYOKey Speakの入力画面にだけ入力してください。OpenAIとClaudeのガイドは参考資料であり、PWA版の対応予定ではありません。</p>}</div></li>)}
            </ol>
            <ProviderPdfGuide provider={selectedProvider} guide={selectedGuide} />
            <div className="guide-callout warning"><ShieldCheck size={21} /><div><strong>事前に利用料の上限を設定してください。</strong><p>月間上限、利用通知を設定してください。BYOKey Labがサポート対応でAPIキーの送信を求めることはありません。</p></div></div>
          </section>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function ImportantPage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main className="document-page important-page">
        <div className="document-header">
          <p className="section-kicker">IMPORTANT MATTERS</p>
          <h1>重要事項</h1>
          <p>BYOKey LabにおけるAPIキーの扱い、公開形態、対応プロダクトの判断基準です。APIキーは利用者の費用と権限に直結するため、技術的に実装できることと、公式に推奨される構成を分けて説明します。</p>
          <small>最終更新: 2026年8月11日</small>
        </div>
        <div className="important-summary" aria-label="BYOKey Labの公開方針">
          <article>
            <ShieldAlert size={24} />
            <strong>モバイルアプリ</strong>
            <span>本文書の記載時点では公開しません。</span>
          </article>
          <article>
            <ExternalLink size={24} />
            <strong>PWA</strong>
            <span>Gemini APIのみ対応し、Git公開と明示同意を前提に検証します。</span>
          </article>
          <article>
            <LockKeyhole size={24} />
            <strong>PCアプリ</strong>
            <span>環境変数などのローカル実行環境でAPIキーを扱います。</span>
          </article>
        </div>
        <article className="policy-body">
          <h2>1. 基本方針</h2>
          <p>BYOKey Labは、利用者自身が取得したLLM APIキーを使うBYOK型のAIツールを扱います。APIキーは利用者のプロバイダーアカウント、利用上限、請求に紐づく重要な認証情報です。そのため、BYOKey LabがAPIキーを預かる構成、問い合わせやサポートでAPIキーの送信を求める構成、ログや公開リポジトリにAPIキーが残る構成は採用しません。</p>
          <p>本ページは、法的助言ではありません。各LLMプロバイダーの仕様、規約、セキュリティガイドラインは変更される可能性があるため、公開時点および主要アップデート時点で公式情報を確認します。</p>

          <h2>2. モバイルアプリの公開方針</h2>
          <p>モバイルアプリにAPIキーを配置する構成は、各社のセキュリティガイドライン上、暗号化して保存する場合でも推奨されにくいクライアント側の構成です。暗号化は保存データの偶発的な露出を減らしますが、アプリがAPIへ接続する時点ではキーを実行環境で使用するため、侵害端末、root化端末、動的解析、悪意あるアプリなどのリスクを完全には排除できません。</p>
          <p>また、配布済みモバイルアプリは、利用者から見て内部処理の透明性を確認しにくい面があります。BYOKey Labは、この透明性の不足を課題と判断し、本文書の記載時点では、APIキーをアプリ内に配置するモバイルアプリを公開しません。</p>

          <h2>3. PWAの公開方針</h2>
          <p>PWAもブラウザ上で動作するクライアント環境であり、APIキーの露出リスクがなくなるわけではありません。一方で、実装をGitHubなどで公開することで「APIキーをBYOKey Labのサーバーへ送っていない」ことを確認しやすい構成にできます。</p>
          <p>Gemini APIについても、本番のWeb/モバイルクライアントでAPIキーを露出させる構成が推奨されるわけではありません。GoogleのAPIキー安全指針では、APIキーを秘密情報として扱うこと、必要に応じてバックエンドを使うこと、利用制限や請求通知を設定することが案内されています。したがって、BYOKey LabではPWAを「リスクがない構成」とは説明しません。</p>
          <p>一方で、GeminiはGoogle AI StudioでAPIキー作成、請求、利用状況、上限管理を確認しやすく、BYOKの基本体験を小さく検証する初期対象として扱いやすいと判断しています。BYOKey Labでは、ユーザーの明示同意、専用APIキー、利用上限、利用通知、Git公開による透明性を前提に、まずGemini APIのみ対応のPWAを公開する方針とします。</p>

          <h2>4. OpenAI APIおよびAnthropic APIについて</h2>
          <p>OpenAIとAnthropicのJavaScript/TypeScript SDKにも、ブラウザからの利用を明示的に許可するための設定があります。ただし、いずれもクライアント側で秘密のAPIキーが露出する危険性を避けるため、通常は無効化または注意付きの扱いになっています。</p>
          <p>BYOKey Labでは、初期のPWA版においてOpenAI APIキーおよびAnthropic APIキーには対応しません。Gemini APIだけでBYOKの基本体験を検証できるため、対応範囲を広げる前に、実装の単純さと検証範囲の管理を優先します。</p>

          <h2>5. PCアプリの公開方針</h2>
          <p>PCアプリについては、利用者本人のローカル実行環境でAPIキーを環境変数やローカル設定ファイルとして管理する構成を採用できます。この方式は、APIキーをソースコードへ埋め込まず、公開リポジトリへコミットせず、利用者自身のOS環境で扱うものです。</p>
          <p>そのため、BYOKey Labでは、PCアプリを公開可能な構成として整理します。PCアプリでもAPIキーの漏えいリスクがゼロになるわけではありませんが、モバイルアプリやブラウザアプリのような配布クライアントへキーを直接組み込む構成とは区別して扱います。</p>

          <h2>6. 利用者にお願いすること</h2>
          <p>BYOK構成を使う場合は、BYOKey Labのアプリ専用のAPIキーを作成してください。メインプロジェクトや他サービスと同じキーを使い回さないでください。月間上限、利用通知、必要に応じた課金上限を設定し、利用状況を定期的に確認してください。漏えいが疑われる場合は、発行元で直ちにキーを無効化し、新しいキーへ交換してください。</p>
          <p>APIキー、プロバイダーの秘密情報、支払い情報を、問い合わせフォーム、メール、チャット、SNSへ送信しないでください。BYOKey Labがこれらの情報を求めることはありません。</p>

          <h2>7. 参照する公式情報</h2>
          <p>APIキーの扱いは、次の公式情報を確認対象とします。最新の内容が本ページと異なる場合は、公式情報を優先して方針を見直します。</p>
          <ul className="source-list">
            <li><a href="https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety" target="_blank" rel="noreferrer">OpenAI APIキー安全指針<ExternalLink size={14} /></a></li>
            <li><a href="https://github.com/openai/openai-node#requirements" target="_blank" rel="noreferrer">OpenAI JavaScript/TypeScript SDK<ExternalLink size={14} /></a></li>
            <li><a href="https://github.com/anthropics/anthropic-sdk-typescript#requirements" target="_blank" rel="noreferrer">Anthropic TypeScript SDK<ExternalLink size={14} /></a></li>
            <li><a href="https://ai.google.dev/gemini-api/docs/api-key?hl=ja" target="_blank" rel="noreferrer">Gemini APIキーの公式説明<ExternalLink size={14} /></a></li>
            <li><a href="https://docs.cloud.google.com/docs/authentication/api-keys-best-practices" target="_blank" rel="noreferrer">Google APIキー安全指針<ExternalLink size={14} /></a></li>
          </ul>
        </article>
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
        <div className="document-header"><p className="section-kicker">PRIVACY</p><h1>プライバシーポリシー</h1><p>BYOKey Speak for English PWA版におけるデータの取り扱い方針です。</p><small>最終更新: 2026年8月10日</small></div>
        <div className="policy-summary">
          <div><LockKeyhole size={22} /><strong>APIキー</strong><span>BYOKey Labのサーバーへ送信しません</span></div>
          <div><Smartphone size={22} /><strong>会話と設定</strong><span>原則としてブラウザ内に保存</span></div>
          <div><ExternalLink size={22} /><strong>回答生成</strong><span>Gemini APIへ直接送信</span></div>
        </div>
        <article className="policy-body">
          <h2>1. 対象</h2><p>本ポリシーは、BYOKey Labが提供予定のPWA「BYOKey Speak for English」に適用されます。本文書の記載時点では、モバイルアプリ版は公開しません。</p>
          <h2>2. アプリ内で扱う情報</h2><p>Gemini APIキー、会話内容、コーチ設定、CEFRレベル、学習メモ、Vocabulary List、会話分析などを扱います。これらは原則として利用者のブラウザ内に保存されます。</p>
          <h2>3. APIキー</h2><p>Gemini APIキーは、BYOKey Labが運営するサーバーには送信しません。キーは、Google Gemini APIへの認証にのみ利用します。PWAもクライアント環境であるため、APIキーの露出リスクがなくなるわけではありません。</p>
          <h2>4. 外部LLMサービスへの送信</h2><p>回答を生成するため、入力した文章、必要な会話履歴、CEFRレベル、コーチ設定をGoogle Gemini APIへブラウザから送信します。送信情報の取り扱いはGoogleの規約とプライバシーポリシーに従います。</p>
          <h2>5. AI返信の報告</h2><p>報告機能を提供する場合、利用者が明示的に操作したときに限り、対象のAI返信、報告理由、任意の補足、利用者が明示的に選んだ場合は直前の利用者発言をBYOKey Labへ送信します。APIキー、支払い情報、プロバイダーの秘密情報は送信しません。報告データは確認と品質改善のために使用し、受付から90日以内に削除します。</p>
          <h2>6. BYOKey Labによる収集</h2><p>初期方針では、独自のユーザー登録、広告SDK、クラウド会話履歴を使用しません。前項の報告または利用者自身がお問い合わせフォームから送信した情報を除き、BYOKey Labが通常の会話内容を収集することはありません。ホスティング事業者、Google Gemini API、Google Formsは、それぞれの仕組みに基づいて情報を処理する場合があります。</p>
          <h2>7. バックアップと端末変更</h2><p>履歴や設定のエクスポート機能を提供する場合でも、APIキーはバックアップに含めません。新しい端末やブラウザでは、Gemini APIキーを再入力してください。</p>
          <h2>8. データの削除</h2><p>ブラウザの保存データを削除すると、ブラウザ内に保存された設定、会話履歴、APIキーは削除されます。Google Gemini APIへ送信済みのデータは、Google側の保持方針に従います。</p>
          <h2>9. セキュリティ</h2><p>通信はHTTPSに限定し、APIキーをBYOKey Labのサーバーへ送信しない構成を採用します。ただし、端末、ブラウザ、通信経路、外部サービスを含むすべてのリスクを完全に排除することはできません。</p>
          <h2>10. お問い合わせ</h2><p>お問い合わせは <a href={contactFormUrl} target="_blank" rel="noreferrer">お問い合わせフォーム</a> からお願いします。APIキー、プロバイダーの秘密情報、支払い情報は送信しないでください。</p>
        </article>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function TermsPage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main className="document-page">
        <div className="document-header"><p className="section-kicker">TERMS</p><h1>利用規約</h1><p>BYOKey Speak for English PWA版の利用条件です。</p><small>施行日: 2026年8月10日</small></div>
        <article className="policy-body">
          <h2>1. 適用</h2><p>本規約は、BYOKey Labが提供予定のPWA「BYOKey Speak for English」の利用に適用されます。利用者は、本規約、プライバシーポリシー、重要事項を確認したうえで本アプリを利用します。</p>
          <h2>2. 本アプリの仕組み</h2><p>本アプリは、利用者自身が取得したGoogle Gemini APIキーを使用して英会話機能を提供します。利用できるモデル、料金、利用上限、生成結果はGoogle Gemini APIの仕様に依存します。本文書の記載時点では、OpenAI APIキーおよびAnthropic APIキーには対応しません。</p>
          <h2>3. 料金</h2><p>本アプリの提供条件と、Googleが請求するAPI利用料は別です。API利用料は利用者とGoogleとの間で発生し、BYOKey Labは請求、返金、利用上限の設定を代行しません。利用者はGoogle AI Studioまたは関連する管理画面で予算上限と通知を設定してください。</p>
          <h2>4. APIキー</h2><p>利用者はAPIキーを第三者へ共有せず、安全に管理するものとします。BYOKey Labがサポート、返金、調査を理由にAPIキーの送信を求めることはありません。APIキーの漏えいが疑われる場合は、発行元で直ちに無効化してください。</p>
          <h2>5. AI生成内容</h2><p>AIの回答は正確性、完全性、安全性を保証するものではありません。医療、法律、金融、安全、その他重要な判断では、一次情報と適切な専門家を確認してください。不適切なAI返信は、アプリ内の旗アイコンから報告できます。</p>
          <h2>6. 禁止事項</h2><p>法令または各LLM事業者の規約に違反する利用、第三者の権利を侵害する利用、サービスや他の利用者へ不正な負荷を与える行為、APIキーや審査用情報の不正取得、本アプリの安全機能を回避する行為を禁止します。</p>
          <h2>7. データとバックアップ</h2><p>会話や学習データは原則として利用者のブラウザ内に保存されます。エクスポート機能を提供する場合でも、APIキーはバックアップに含めません。</p>
          <h2>8. 提供の変更と停止</h2><p>外部LLMの仕様変更、法令、保守、セキュリティ上の必要により、本アプリの機能、対応モデル、提供条件を変更または停止する場合があります。重要な変更は、合理的な方法で案内します。</p>
          <h2>9. 問い合わせ</h2><p>不具合や確認事項がある場合は、<a href={contactFormUrl} target="_blank" rel="noreferrer">お問い合わせフォーム</a>からご連絡ください。APIキー、支払い情報、プロバイダーの秘密情報は送信しないでください。</p>
          <h2>10. 責任の範囲</h2><p>BYOKey Labは、適用法令で認められる範囲において、外部LLMの停止、AI回答、API料金、利用者によるAPIキー管理、ブラウザ保存データの削除または消失により生じた損害について責任を負いません。</p>
          <h2>11. 規約の変更</h2><p>本規約を変更する場合があります。利用者に重要な影響がある変更では、アプリまたは公式サイトで案内します。</p>
          <h2>12. お問い合わせ</h2><p>本規約に関する連絡は<a href={contactFormUrl} target="_blank" rel="noreferrer">お問い合わせフォーム</a>からお願いします。APIキーや支払い情報は送信しないでください。</p>
        </article>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function SupportPage({ onNavigate }) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <main className="document-page">
        <div className="document-header"><p className="section-kicker">SUPPORT</p><h1>お問い合わせ</h1><p>BYOKey Speak for English PWA版の問い合わせ、AI返信の報告に関する案内です。</p></div>
        <article className="policy-body">
          <h2>1. お問い合わせフォーム</h2><p>ご連絡は <a href={contactFormUrl} target="_blank" rel="noreferrer">お問い合わせフォーム</a> からお願いします。APIキー、プロバイダーの秘密情報、支払い情報は送信しないでください。</p>
          <h2>2. APIキー設定について</h2><p>Gemini APIキーの作成、利用上限、請求設定はGoogle側の管理画面で行います。BYOKey LabはAPIキーの発行、請求、返金、利用上限設定を代行しません。</p>
          <h2>3. 不適切なAI返信の報告</h2><p>AI返信に問題がある場合は、アプリ内の旗アイコンから報告できます。報告機能では、対象のAI返信、報告理由、任意の補足、利用者が明示的に選んだ場合は直前の利用者発言のみを送信します。APIキーは送信しません。</p>
          <h2>4. 端末変更時の注意</h2><p>APIキーを自動同期する設計にはしません。新しい端末やブラウザで使う場合は、Gemini APIキーを再入力してください。</p>
        </article>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function FinalCta({ onNavigate }) {
  return <section className="final-cta"><h2>鍵は、あなたの手の中に。</h2><InternalLink className="button button-primary" to="/speak/english/" onNavigate={onNavigate}>BYOKey Speakを見る<ArrowRight size={18} /></InternalLink></section>;
}

function Footer({ onNavigate }) {
  return (
    <footer><Brand onNavigate={onNavigate} /><div><InternalLink to="/important/" onNavigate={onNavigate}>重要事項</InternalLink><InternalLink to="/privacy/" onNavigate={onNavigate}>プライバシー</InternalLink><InternalLink to="/terms/" onNavigate={onNavigate}>利用規約</InternalLink><InternalLink to="/support/" onNavigate={onNavigate}>お問い合わせ</InternalLink><InternalLink to="/guide/api/" onNavigate={onNavigate}>API設定ガイド</InternalLink></div><small>© 2026 BYOKey Lab</small></footer>
  );
}

export function App() {
  const [path, navigate] = usePath();

  useEffect(() => {
    updateSeo(path);
  }, [path]);

  if (path.startsWith("/speak/english")) return <SpeakPage onNavigate={navigate} />;
  if (path.startsWith("/guide/api")) return <GuidePage onNavigate={navigate} />;
  if (path.startsWith("/important")) return <ImportantPage onNavigate={navigate} />;
  if (path.startsWith("/privacy")) return <PrivacyPage onNavigate={navigate} />;
  if (path.startsWith("/terms")) return <TermsPage onNavigate={navigate} />;
  if (path.startsWith("/support")) return <SupportPage onNavigate={navigate} />;
  return <HomePage onNavigate={navigate} />;
}
