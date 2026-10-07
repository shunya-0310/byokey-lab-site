export const articleCatalog = [
  {
    slug: "edo-1868-history-ai-game",
    source: "/articles/edo-1868-history-ai-game.md",
    category: "歴史ゲーム",
    datePublished: "2026-10-08",
    title: "江戸無血開城を自分の言葉で目指す｜歴史AIゲーム「1868」の遊び方",
    description: "1868年の江戸無血開城を、自分の言葉で追体験するブラウザゲーム「1868 -江戸焦土前夜-」。西郷隆盛として勝海舟と交渉する遊び方と開発経緯を、ゲーム画面とともに紹介します。",
    image: "/images/articles/edo-1868/game-title.webp",
  },
  {
    slug: "byokey-speak-api-english",
    source: "/articles/byokey-speak-api-english.md",
    category: "英語学習",
    datePublished: "2026-09-14",
    title: "AI英会話に料金革命｜自分のAPIキーで使う英会話アプリ「BYOKey Speak」",
    description: "BYOKey Speakは、AIとの会話に使った分だけ費用が発生する英会話アプリです。Android製品版でできること、自分の言葉でコーチを設定する方法、体験版の位置づけを紹介します。",
    image: "/images/byokey-speak-subscription-vs-byok-illustration.png",
  },
];

export function getArticle(slug) {
  return articleCatalog.find((article) => article.slug === slug);
}
