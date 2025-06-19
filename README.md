# Screenshot MCP Server

PuppeteerライブラリとMCPフレームワークを使用してWebページのスクリーンショット機能を提供するMCPサーバー

## 機能

### スクリーンショット取得機能
- **URL**: HTTPSサイトのスクリーンショットを取得
- **ビューポート**: カスタム幅・高さ設定可能（デフォルト: 1280x720）
- **フルページ**: デフォルトでフルページ、ビューポート指定時は自動で無効
- **画像遅延読み込み対応**: フルページ時に自動スクロールして遅延読み込み画像も取得
- **出力**: PNGファイルとメタデータ
- **型安全性**: TypeScriptによる完全な型安全性（any型不使用）
- **テストカバレッジ**: 98%以上の高いコードカバレッジ

### MCPツール仕様

#### 必須パラメータ
- `url` (string): スクリーンショット対象のHTTPS URL

#### オプションパラメータ
- `width` (number): ビューポート幅（デフォルト: 1280）
- `height` (number): ビューポート高さ（デフォルト: 720）
- `fullPage` (boolean): フルページスクリーンショット（デフォルト: true、width/height指定時は自動でfalse）
- `outputPath` (string): 出力ファイルパス（デフォルト: 自動生成）

#### 使用例

**デフォルト（フルページ）**
```json
{
  "name": "screenshot",
  "arguments": {
    "url": "https://example.com"
  }
}
```

**カスタムビューポート**
```json
{
  "name": "screenshot",
  "arguments": {
    "url": "https://example.com",
    "width": 800,
    "height": 600
  }
}
```

**カスタム出力パス**
```json
{
  "name": "screenshot",
  "arguments": {
    "url": "https://example.com",
    "outputPath": "/custom/path/screenshot.png"
  }
}
```

### セキュリティ制約
- HTTPS URLのみ許可
- ローカルファイルアクセス禁止
- 最大タイムアウト: 60秒

### 画像遅延読み込み対応
- **自動スクロール**: フルページスクリーンショット時に自動実行
- **スクロール設定**: 300ms間隔、100ms要素待機
- **対象**: Lazy Loading、Infinite Scroll等の動的コンテンツ

### テストと品質
- **テストフレームワーク**: Vitest
- **テストカバレッジ**: 98%以上の高いカバレッジ（34テスト実行）
- **型安全性**: any型を一切使用しない完全な型安全コード
- **エラーハンドリング**: neverthrowによる関数型エラーハンドリング

## 開発・テスト

### コマンド
```bash
# テスト実行
npm run test

# カバレッジ確認（100%達成済み）
npm run test:cov

# 型チェック
npx tsc --noEmit

# ビルド
npm run build
```

### カスタムコマンド

- `/project:rule`: プロジェクトのルールを確認する
- `/project/task:count`: タスクの件数を確認する
- `/project/requirement:create`: 要求タスクを作成する
- `/project/requirement:execute`: 要求タスクを実行する
- `/project/development:execute`: 開発タスクを実行する

## 参考リンク

- [Claude Code Manage permissions](https://docs.anthropic.com/en/docs/claude-code/security)
- [built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system)
- [Feature-Sliced Design](https://feature-sliced.github.io/documentation/)