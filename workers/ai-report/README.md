# BYOKey AI返信報告 Worker

AI返信のアプリ内報告を受け付け、Cloudflare D1へ最大90日保存する専用Workerである。

## 初回セットアップ

1. `npm install`
2. `npx wrangler d1 create byokey-ai-reports`
3. 返されたDatabase IDを`wrangler.jsonc`へ設定する。
4. `npx wrangler d1 execute byokey-ai-reports --remote --file=./schema.sql`
5. `npx wrangler secret put RATE_LIMIT_SALT`
6. `npm run deploy:dry`
7. 内容確認後、明示承認を得て`npm run deploy`

デプロイ後のURLに`/v1/ai-reports`を付け、Androidのreleaseビルド時に
`BYOKEY_AI_REPORT_ENDPOINT`環境変数またはGradleプロパティとして設定する。

```powershell
$env:BYOKEY_AI_REPORT_ENDPOINT='https://<worker-domain>/v1/ai-reports'
.\gradlew.bat :app:bundleRelease
```

`RATE_LIMIT_SALT`はリポジトリへ保存しない。公開前に実送信、429、異常JSON、
20KB超過、90日削除の各ケースを確認する。
