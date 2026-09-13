export const articleCatalog = [
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
