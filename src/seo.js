export const SITE_URL = "https://byokey-lab.com";
export const SPEAK_APP_URL = "https://speak.byokey-lab.com/";

const defaultImage = `${SITE_URL}/images/byok-app-diagram.png`;
const logoImage = `${SITE_URL}/images/byokey-lab-logo.png`;

export const seoRoutes = [
  {
    path: "/",
    title: "BYOKey Lab | 自分のAPIキーで使うAIアプリ",
    description:
      "BYOKey Labは、利用者自身のAPIキーで動くAIアプリを検証・開発するプロジェクトです。PWAとPCアプリを中心に、BYOK型AIツールの使い方と注意点を整理します。",
    priority: "1.0",
    changefreq: "weekly",
    schemaType: "WebPage",
  },
  {
    path: "/speak/english/",
    title: "BYOKey Speak | 無料体験版とAndroid製品版のAI英会話",
    description:
      "BYOKey Speakは、Gemini APIキーで使うAI英会話です。無料のPWA体験版と、Daily News・会話分析・Gemini TTSを使えるAndroid製品版を用意しています。",
    priority: "0.9",
    changefreq: "weekly",
    schemaType: "WebPage",
  },
  {
    path: "/guide/api/",
    title: "API設定ガイド | BYOKey Lab",
    description:
      "Gemini、OpenAI、ClaudeのAPIキー作成、課金、利用上限設定の基本を整理したBYOKey LabのAPI設定ガイドです。",
    priority: "0.8",
    changefreq: "monthly",
    schemaType: "Article",
  },
  {
    path: "/important/",
    title: "重要事項 | BYOKey Lab",
    description:
      "BYOK型AIアプリでAPIキーを扱う前に確認すべき重要事項です。モバイルアプリ、PWA、PCアプリにおけるAPIキー管理方針を整理します。",
    priority: "0.8",
    changefreq: "monthly",
    schemaType: "Article",
  },
  {
    path: "/privacy/",
    title: "プライバシーポリシー | BYOKey Lab",
    description:
      "BYOKey LabおよびBYOKey Speak for English PWA版におけるAPIキー、会話内容、報告データ、外部LLMサービスへの送信に関するプライバシーポリシーです。",
    priority: "0.5",
    changefreq: "yearly",
    schemaType: "WebPage",
  },
  {
    path: "/terms/",
    title: "利用規約 | BYOKey Lab",
    description:
      "BYOKey Speak for English PWA版の利用条件、APIキー管理、API利用料、AI生成内容、禁止事項、責任範囲に関する利用規約です。",
    priority: "0.5",
    changefreq: "yearly",
    schemaType: "WebPage",
  },
  {
    path: "/support/",
    title: "お問い合わせ | BYOKey Lab",
    description:
      "BYOKey Labへのお問い合わせ、BYOKey Speak for Englishの不具合連絡、AI返信の報告、APIキー設定に関する案内です。",
    priority: "0.5",
    changefreq: "monthly",
    schemaType: "ContactPage",
  },
];

export function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  const cleanPath = pathname.split("#")[0].split("?")[0];
  return cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
}

export function getSeoForPath(pathname) {
  const normalized = normalizePath(pathname);
  return seoRoutes.find((route) => route.path === normalized) || seoRoutes[0];
}

export function absoluteUrl(path) {
  if (path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

export function buildJsonLd(route) {
  const pageUrl = absoluteUrl(route.path);
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "BYOKey Lab",
      item: `${SITE_URL}/`,
    },
  ];

  if (route.path !== "/") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: route.title.replace(" | BYOKey Lab", ""),
      item: pageUrl,
    });
  }

  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BYOKey Lab",
      url: `${SITE_URL}/`,
      logo: logoImage,
    },
    {
      "@type": route.schemaType,
      "@id": `${pageUrl}#webpage`,
      name: route.title,
      description: route.description,
      url: pageUrl,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      inLanguage: "ja",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
  ];

  if (route.path === "/") {
    graph.push({
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "BYOKey Lab",
      url: `${SITE_URL}/`,
      inLanguage: "ja",
    });
  }

  if (route.path === "/speak/english/") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${pageUrl}#app`,
      name: "BYOKey Speak for English",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web browser",
      url: pageUrl,
      description: route.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
        description: "PWA体験版のアプリ利用料は無料。Gemini API利用料は利用者がGoogleへ直接支払います。",
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildHeadTags(route) {
  const url = absoluteUrl(route.path);
  const jsonLd = JSON.stringify(buildJsonLd(route)).replace(/</g, "\\u003c");

  return [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="BYOKey Lab" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="ja_JP" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${defaultImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${defaultImage}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n    ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
