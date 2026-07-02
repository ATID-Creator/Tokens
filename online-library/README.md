# オンライン図書館

いつでもどこでも本が借りられるオンライン図書館アプリケーションです。

## 機能

- **蔵書カタログ** — 書籍の一覧表示、タイトル・著者・ISBNでの検索、カテゴリフィルタ
- **書籍詳細** — あらすじ、在庫状況、貸出ボタン
- **ユーザー認証** — 新規登録・ログイン・ログアウト
- **貸出・返却** — 書籍の借り出し（14日間）と返却
- **マイページ** — 借りている本の一覧と返却
- **管理画面** — 書籍の追加・編集・削除（管理者のみ）
- **多言語対応** — アジア圏10言語 + 英語（ヘッダーの言語切替）

## 対応言語

| コード | 言語 |
|--------|------|
| `ja` | 日本語（デフォルト） |
| `en` | English |
| `zh-CN` | 简体中文 |
| `zh-TW` | 繁體中文 |
| `ko` | 한국어 |
| `th` | ไทย |
| `vi` | Tiếng Việt |
| `id` | Bahasa Indonesia |
| `hi` | हिन्दी |
| `ms` | Bahasa Melayu |

URL形式: `http://localhost:3000/{locale}/` （例: `/ko/`, `/zh-CN/`）

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **国際化**: next-intl（10言語対応）
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite (better-sqlite3)

## セットアップ

```bash
cd online-library
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## デモアカウント

| 種別 | メールアドレス | パスワード |
|------|---------------|-----------|
| 一般ユーザー | user@library.jp | user123 |
| 管理者 | admin@library.jp | admin123 |

## 初期データ

初回起動時に12冊のサンプル書籍とデモユーザーが自動的に登録されます。

## 本番ビルド

```bash
npm run build
npm start
```
