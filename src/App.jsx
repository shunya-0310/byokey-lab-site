import { useEffect, useMemo, useState } from "react";
import byokeyLabLogo from "./assets/byokey-lab-logo.png";
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

const providerGuides = {
  gemini: {
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
    requirements: [
      "Claude ConsoleアカウントとOrganization",
      "利用目的などのOrganization情報",
      "支払い方法、プリペイドのUsage Credits、APIキー",
    ],
    notes: "Claudeの個人向け有料プランとは別会計です。ConsoleのBillingでUsage Creditsを先に購入し、必要ならAuto reloadを低い上限で設定します。",
    steps: [
      "Claude Consoleへ登録し、Organization情報と利用目的を入力する",
      "Billingで支払い方法を登録し、Usage Creditsを購入する",
      "API KeysでBYOKey Speak専用のキーを作成する",
      "使用量と残高を確認し、BYOKey Speakで接続を確認する",
    ],
    billingUrl: "https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage",
    pricingUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
};

const pricingModels = [
  { provider: "Google", model: "Gemini 3.1 Flash-Lite", input: 0.25, output: 1.5, recommended: true },
  { provider: "Google", model: "Gemini 2.5 Flash", input: 0.3, output: 2.5, lifecycle: "2026年10月16日以降停止予定" },
  { provider: "Google", model: "Gemini 3.5 Flash", input: 1.5, output: 9, quality: true },
  { provider: "OpenAI", model: "GPT-5 nano", input: 0.05, output: 0.4, review: true },
  { provider: "OpenAI", model: "GPT-5 mini", input: 0.25, output: 2, review: true },
  { provider: "OpenAI", model: "GPT-5.6 Luna", input: 1, output: 6, review: true },
  { provider: "Anthropic", model: "Claude Haiku 4.5", input: 1, output: 5 },
  { provider: "Anthropic", model: "Claude Sonnet 4.6", input: 3, output: 15 },
  { provider: "Anthropic", model: "Claude Opus 4.8", input: 5, output: 25 },
];

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

function Brand({ onNavigate }) {
  return (
    <button className="brand" type="button" onClick={() => onNavigate("/")} aria-label="BYOKey Lab ホーム">
      <span className="brand-mark brand-logo-crop" aria-hidden="true"><img src={byokeyLabLogo} alt="" /></span>
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
          <button type="button" onClick={() => go("/speak/english/#faq")}>FAQ</button>
          <button type="button" onClick={() => go("/guide/api/")}>API設定ガイド</button>
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
        <h2>好きなAIを選ぶ</h2>
        <div className="provider-list" aria-label="選択できるLLMプロバイダーの例">
          {providers.map((provider) => (
            <div className="provider-option" key={provider.id}>
              <span className={`provider-mark provider-${provider.id}`}>{provider.mark}</span>
              <span><strong>{provider.name}</strong><small>{provider.owner}</small></span>
            </div>
          ))}
        </div>
      </article>
      <article className="setup-step key-step">
        <p className="step-label">02 / APIキー</p>
        <h2>端末に設定する</h2>
        <div className="flow-visual key-visual" aria-hidden="true">
          <span><Smartphone size={44} /></span>
          <ArrowRight size={22} />
          <span><LockKeyhole size={40} /></span>
        </div>
        <p className="flow-description">取得したAPIキーをアプリへ設定。キーはアプリ開発者のサーバーへ預けず、端末内で管理します。</p>
      </article>
      <article className="setup-step conversation-step">
        <p className="step-label">03 / アプリ</p>
        <h2>すぐに使い始める</h2>
        <div className="flow-visual app-visual" aria-hidden="true">
          <span><MessageCircle size={42} /></span>
          <ArrowRight size={22} />
          <span><BrainCircuit size={42} /></span>
        </div>
        <p className="flow-description">アプリから選んだAIへ直接接続。月額会員登録を挟まず、必要な機能をすぐに使えます。</p>
      </article>
    </div>
  );
}

function TrustBand() {
  return (
    <section className="trust-band" aria-label="BYOKey Labの基本方針">
      <div className="trust-item"><LockKeyhole size={25} /><div><strong>キーは端末内で暗号化</strong><span>BYOKey Labのサーバーへ保存しません</span></div></div>
      <div className="trust-item"><Smartphone size={25} /><div><strong>アカウント登録は不要</strong><span>設定と履歴は端末で管理</span></div></div>
      <div className="trust-item"><BrainCircuit size={25} /><div><strong>AIを選べる設計</strong><span>Gemini・OpenAI・Claudeから自由に選択可能</span></div></div>
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
          <p className="hero-copy">BYOKey Labは、LLMを組み込んだ買い切り型の小さなアプリをつくります。ユーザーは自分のAPIキーをつなぎ、必要な分だけ従量課金で使えます。</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={() => onNavigate("/speak/english/")}>最初のプロダクトを見る<ArrowRight size={18} /></button>
            <button className="button button-secondary" type="button" onClick={() => onNavigate("/guide/api/")}>API設定ガイド<BookOpen size={18} /></button>
          </div>
        </section>
        <section className="demo-band">
          <p className="byok-definition">BYOK（Bring Your Own Key）アプリとは、LLM（Gemini, ChatGPT, Claudeなど）の「自分のAPIキー」を設定して、AIを使う新しいアプリの形です。</p>
          <div className="section-intro compact-intro">
            <p className="section-kicker">HOW IT WORKS</p>
            <h2 className="steps-heading"><span>選ぶ。</span><span>設定する。</span><span>使い始める。</span></h2>
            <p>複雑な会員登録や月額プランはありません。好きなAIを選び、APIキーを端末へ設定したら、対応アプリからすぐに使い始められます。</p>
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
              <p>アカウント登録は不要。APIキー、アプリ設定、会話履歴などは、原則として利用者のAndroid端末内に保存します。買い切りアプリと従量課金APIを組み合わせ、使わない月の自動更新を気にせず利用できます。</p>
              <ul><li><Check size={17} />APIキーは端末内で暗号化</li><li><Check size={17} />開発者のデータベースへ収集しない</li><li><Check size={17} />月額サブスクリプションなし</li></ul>
            </article>
            <article>
              <div className="principle-icon direct"><ExternalLink size={23} /></div>
              <h3>アプリ開発者</h3>
              <p>ユーザー登録や会員データベースを持たず、API利用料もユーザー自身の契約へ分離できます。共通のBYOK設計を、学習、文章作成、業務支援など、さまざまなアプリへ展開できます。</p>
              <ul><li><ChevronRight size={17} />ユーザー情報の複雑な管理を減らす</li><li><ChevronRight size={17} />API従量課金を直接負担しない</li><li><ChevronRight size={17} />同じ仕組みを複数アプリへ展開</li></ul>
            </article>
          </div>
          <button className="text-link" type="button" onClick={() => onNavigate("/privacy/")}>データの取り扱いを詳しく見る<ArrowRight size={17} /></button>
        </section>
        <section className="product-section">
          <div className="product-copy">
            <p className="section-kicker">FIRST PRODUCT</p>
            <h2 className="product-title"><span>BYOKey</span><span>Speak</span><small>for English</small></h2>
            <p>英語が出てこない瞬間も、Quick Assistが日本語の質問から自然な表現を提案。会話の流れを止めません。</p>
            <div className="inline-meta"><span>Android</span><span>買い切り。月額なし。</span><span>API代だけ。</span></div>
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

function SpeakFeatureBand() {
  const features = [
    {
      icon: MessageCircle,
      title: "テーマに沿って長く話せる",
      body: "旅行、日常、仕事前の雑談など、会話を自然に続けながら表現を増やします。",
    },
    {
      icon: BrainCircuit,
      title: "ライトなChatsも使える",
      body: "短い質問や表現確認だけをしたいときは、会話練習とは別にすばやく相談できます。",
    },
    {
      icon: CheckCircle2,
      title: "その場で直してもらえる",
      body: "通じるけれど不自然な言い方、語感の違い、より自然な返し方を会話中に確認できます。",
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
    const usd = ((turns * 1000 * model.input) + (turns * 250 * model.output)) / 1_000_000;
    return { usd, yen: Math.round(usd * yenRate) };
  };
  const formatUsd = (amount) => amount < 0.01 ? "<$0.01" : `$${amount.toFixed(2)}`;
  const formatYen = (amount) => `約${new Intl.NumberFormat("ja-JP").format(amount)}円`;

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-heading">
        <div className="section-intro">
          <p className="section-kicker"><BadgeDollarSign size={17} /> API COST</p>
          <h2>費用は使った分だけ。<br />頑張れない月もお財布に優しい。</h2>
          <p>下記は、毎日10往復または50往復を30日間続けた場合の月額目安です。1往復を「短い入力（約1,000トークン）と回答（約250トークン）」として計算しています。</p>
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
            <tr><th>プロバイダー</th><th>モデル</th><th>API単価 / 100万token</th><th>月額目安<br />毎日10往復 × 30日</th><th>月額目安<br />毎日50往復 × 30日</th></tr>
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
                  <th scope="row"><span>{model.model}</span>{recommended && <small className="recommend-label"><Crown size={14} />推奨</small>}{model.quality && <small className="quality-label">品質重視</small>}{model.lifecycle && <small className="lifecycle-label">{model.lifecycle}</small>}{model.review && <small>アプリ対応は審査中</small>}</th>
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
        <p><CircleHelp size={18} /><span><strong>試算に含まれないもの</strong> 音声API、税、為替手数料、再送、長い会話履歴、思考トークン、検索などの追加機能。実額は各社の請求画面で確認してください。</span></p>
        <p><RotateCcw size={18} /><span><strong>2026年7月21日確認</strong> Gemini 2.5 Flashは利用できますが、Googleは2026年10月16日を最短停止日として案内しています。<a href="https://ai.google.dev/gemini-api/docs/deprecations" target="_blank" rel="noreferrer">提供終了予定</a>と<a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Google料金</a>・<a href="https://developers.openai.com/api/docs/models" target="_blank" rel="noreferrer">OpenAI料金</a>・<a href="https://platform.claude.com/docs/en/about-claude/pricing" target="_blank" rel="noreferrer">Anthropic料金</a>の公式情報が正本です。</span></p>
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
      <textarea id="coach-skill" defaultValue="ビジネスではなく日常会話を強化したいので、かしこまった話し方ではなくフランクに話してほしい。通じはするけど、ネイティブでは使わない表現など、細かなところも「ネイティブではこうだよ」と指摘してほしい。スラングや気の利いた言い回しをよく使う性格。解説部分だけは英語だけでなく日本語も併記して。" />
    </div>
  );
}

const faqGroups = [
  {
    id: "security",
    title: "セキュリティとプライバシー",
    icon: ShieldCheck,
    items: [
      ["APIキーはどのように保存されますか？", "Android Keystoreで生成した256bit AES鍵を使い、APIキーをAES-GCMで暗号化して端末内に保存します。暗号鍵自体はKeystore外へ書き出さず、暗号化済みデータのバックアップも無効にします。通信はHTTPSのみを許可します。"],
      ["暗号化していれば、キーは絶対に漏れませんか？", "いいえ。暗号化は端末内の保存データを読む攻撃には有効ですが、アプリがAPIへ接続するときはキーを復号してメモリ上で使用します。ロック解除済み・root化済み端末、悪意あるアプリ、デバッグや動的解析、OSの脆弱性、プロバイダーアカウントの侵害までは完全に防げません。BYOKはリスクをゼロにする仕組みではなく、運営者のサーバーへキーを預けない設計です。"],
      ["会話内容はどこへ送信されますか？", "回答に必要な入力、会話履歴、CEFRレベル、Coach Personalities & Skillsは、選択したLLM事業者のAPIへ端末から直接送信されます。BYOKey Labのサーバーやデータベースは経由しません。送信後の保存期間や不正利用監視は各社のAPI規約に従います。"],
      ["会話はAIの学習に使われますか？", "契約形態で異なります。Googleは有料Gemini APIの入出力を製品改善に使わない一方、無料枠では利用する場合があります。OpenAI APIは明示的にオプトインしない限り学習に使わず、標準では不正利用監視ログを最大30日保持します。Anthropic APIも通常は学習に使わず、標準では入出力を30日以内に削除します。必ず利用時点の各社規約を確認してください。"],
      ["OpenAIのAPIキーをAndroidアプリに入れてもよいですか？", "OpenAIは公式に、APIキーをモバイルアプリなどのクライアント環境へ配置しないよう案内しています。このためOpenAIへの直接接続は公開版への搭載可否を審査中です。暗号化しても実行時の抽出リスクは残るため、公式方針に反して安全だとは説明しません。"],
      ["被害額を小さくするには何を設定すべきですか？", "BYOKey Speak専用のプロジェクトとキーを作り、少額のプリペイド残高、低い月間上限、利用通知を設定してください。キーを使い回さず、使用量を定期確認します。不審な利用があれば各社の管理画面で直ちにキーを無効化し、新しいキーへ交換してください。"],
      ["アプリ運営者は利用状況を収集しますか？", "現行設計では独自ユーザー登録、広告SDK、アクセス解析SDK、クラウド会話履歴を使用しません。ただし、Google Playと選択したLLM事業者は、それぞれの規約に基づき購入情報、技術情報、API利用情報などを処理します。"],
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
      ["機種変更時に履歴やキーは引き継がれますか？", "自動クラウド同期は行いません。セキュリティ上、APIキーのバックアップも無効です。新しい端末でAPIキーを再設定し、履歴の移行機能は公開版の仕様として別途案内します。"],
      ["アプリを削除するとデータはどうなりますか？", "端末内にある設定、会話履歴、暗号化済みAPIキーはアンインストールにより削除されます。各LLM事業者側に送信済みのデータは、各社の保持方針に従います。"],
      ["問い合わせ先はどこですか？", "現時点の問い合わせ先はXの @gaju_nft です。Google Play公開時には、審査要件に合わせてメールアドレス等の連絡先も整備します。"],
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
          <a href="https://developer.android.com/privacy-and-security/keystore" target="_blank" rel="noreferrer">Android Keystore<ExternalLink size={14} /></a>
          <a href="https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety" target="_blank" rel="noreferrer">OpenAI APIキー安全指針<ExternalLink size={14} /></a>
          <a href="https://docs.cloud.google.com/docs/authentication/api-keys-best-practices" target="_blank" rel="noreferrer">Google APIキー安全指針<ExternalLink size={14} /></a>
          <a href="https://ai.google.dev/gemini-api/docs/zdr" target="_blank" rel="noreferrer">Geminiデータ保持<ExternalLink size={14} /></a>
          <a href="https://platform.openai.com/docs/models/default-usage-policies-by-endpoint" target="_blank" rel="noreferrer">OpenAIデータ管理<ExternalLink size={14} /></a>
          <a href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data" target="_blank" rel="noreferrer">Anthropicデータ保持<ExternalLink size={14} /></a>
        </div>
      </div>
      <div className="faq-links"><button className="text-link" type="button" onClick={() => onNavigate("/guide/api/")}>API設定ガイドを見る<ArrowRight size={17} /></button><button className="text-link" type="button" onClick={() => onNavigate("/privacy/")}>プライバシーポリシーを見る<ArrowRight size={17} /></button></div>
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
              <button className="button button-primary" type="button" onClick={() => document.getElementById("release")?.scrollIntoView({ behavior: "smooth" })}><Play size={18} fill="currentColor" />Google Playで公開予定</button>
              <button className="button button-secondary" type="button" onClick={() => onNavigate("/guide/api/")}><BookOpen size={18} />API設定ガイド</button>
            </div>
            <p className="fine-print"><strong>アプリは買い切り！</strong> Gemini / OpenAI / ClaudeのAPI利用料は別途かかります。</p>
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
  const selectedGuide = providerGuides[provider];
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
            <div className="guide-callout"><CircleHelp size={21} /><div><strong>月額プランとは別の準備が必要です</strong><p>API利用料は{selectedProvider.name}から直接請求されます。一般向けの有料プランを契約中でも、APIの支払い設定とAPIキーは別途必要です。</p></div></div>
            <div className="requirements-block">
              <div className="requirements-title"><Database size={21} /><div><p className="step-label">BEFORE YOU START</p><h2>{selectedProvider.name}で必要なもの</h2></div></div>
              <ul>{selectedGuide.requirements.map((requirement) => <li key={requirement}><CheckCircle2 size={18} />{requirement}</li>)}</ul>
              <p>{selectedGuide.notes}</p>
              <div className="guide-resource-links"><a href={selectedGuide.billingUrl} target="_blank" rel="noreferrer">請求設定の公式説明<ExternalLink size={15} /></a><a href={selectedGuide.pricingUrl} target="_blank" rel="noreferrer">公式料金表<ExternalLink size={15} /></a></div>
            </div>
            {selectedProvider.clientWarning && <div className="guide-callout provider-warning"><ShieldAlert size={21} /><div><strong>公開版への搭載可否を審査中</strong><p>{selectedProvider.clientWarning}</p></div></div>}
            <ol className="guide-steps">
              {selectedGuide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><div><h2>{step}</h2>{index === 0 && <a className="official-link" href={selectedProvider.guideUrl} target="_blank" rel="noreferrer">APIキーの公式ガイドを開く<ExternalLink size={16} /></a>}{index === selectedGuide.steps.length - 1 && <p>APIキーはメール、チャット、問い合わせフォームへ送らず、BYOKey Speakの設定画面にだけ入力してください。</p>}</div></li>)}
            </ol>
            <div className="guide-callout warning"><ShieldCheck size={21} /><div><strong>最初から被害上限を小さくする</strong><p>専用キー、少額残高、月間上限、利用通知を設定してください。BYOKey Labがサポート対応でAPIキーの送信を求めることはありません。</p></div></div>
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
          <h2>8. お問い合わせ</h2><p>現時点のお問い合わせ先は <a href="https://x.com/gaju_nft" target="_blank" rel="noreferrer">https://x.com/gaju_nft</a> です。Google Play公開時には、審査要件に合わせてメールアドレス等の連絡先も整備します。</p>
        </article>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  );
}

function FinalCta({ onNavigate }) {
  return <section className="final-cta"><h2>鍵は、あなたの手の中に。</h2><button className="button button-primary" type="button" onClick={() => onNavigate("/speak/english/")}>BYOKey Speakを見る<ArrowRight size={18} /></button></section>;
}

function Footer({ onNavigate }) {
  return (
    <footer><Brand onNavigate={onNavigate} /><div><button type="button" onClick={() => onNavigate("/privacy/")}>プライバシー</button><button type="button" onClick={() => onNavigate("/guide/api/")}>API設定ガイド</button><a href="https://x.com/gaju_nft" target="_blank" rel="noreferrer">お問い合わせ</a></div><small>© 2026 BYOKey Lab</small></footer>
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
