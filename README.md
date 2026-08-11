# BYOKey Lab Site

BYOKey Labの公式サイトと、BYOKey Speak for Englishの製品ページです。

## Routes

- `/` - BYOKey Lab
- `/speak/english/` - BYOKey Speak for English
- `/guide/api/` - API設定ガイド
- `/privacy/` - プライバシーポリシー

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Daily news feed

BYOKey Speak reads `/news/daily.json`. Generate it with a developer-owned Gemini API key:

```bash
GEMINI_API_KEY=... npm run news:generate
```

The API key is read only from the environment. The scheduled GitHub Actions workflow expects a
repository secret named `GEMINI_API_KEY`. It generates the feed once per day and commits only a
validated JSON file containing source URLs.

Cloudflareへのデプロイや設定変更は、ユーザー確認後に行います。
