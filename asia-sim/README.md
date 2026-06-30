# アジア貿易・外交シミュレーター

## 起動方法（どちらか一方）

### 方法1: リポジトリのルートから起動（推奨）

```bash
npm run asia-sim:install   # 初回のみ
npm run asia-sim
```

### 方法2: asia-sim フォルダから起動

```bash
cd asia-sim
npm install   # 初回のみ
npm start
```

### 方法3: シェルスクリプト

```bash
cd asia-sim
chmod +x start.sh
./start.sh
```

起動後、ブラウザで **http://localhost:5173** を開いてください。

> **注意**: リポジトリのルートで `npm run dev` を実行しても起動しません。必ず上記のコマンドを使ってください。

## ビルド版を確認する場合

```bash
cd asia-sim
npm run build
npm run preview
```

ブラウザで **http://localhost:4173** を開いてください。

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| `Missing script: "dev"` | ルートではなく `asia-sim` 内で実行するか、`npm run asia-sim` を使う |
| ページが真っ白 | ターミナルにエラーが出ていないか確認し、`npm install` を再実行 |
| ポートが使用中 | 別のターミナルでサーバーが起動していないか確認 |

## 機能

- **インタラクティブ地図**: アジア太平洋地域16カ国を仮想マップ上に表示
- **外交アクション**: 首脳会談、貿易協定、経済援助、制裁措置、文化交流、安全保障協力
- **ターン制シミュレーション**: 四半期ごとに進行、ランダムイベント発生
- **ダッシュボード**: 予算、外交影響力、GDP、総貿易額を表示

## 技術スタック

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
