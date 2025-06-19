# スクリーンショット(Puppeteer) MCP要件定義書

## 1. 機能概要

WebページのスクリーンショットをPuppeteerライブラリを使用して取得するMCP Tool機能を提供する。

## 2. 機能要件

### 2.1 スクリーンショット取得機能
- **機能ID**: screenshot
- **説明**: 指定されたURLのWebページスクリーンショットを取得
- **入力**: URL、オプション設定
- **出力**: スクリーンショット画像ファイルパス、メタデータ

### 2.2 入力パラメータ

#### 必須パラメータ
- `url` (string): スクリーンショットを取得するWebページのURL

#### オプションパラメータ
- `width` (number): ビューポート幅 (デフォルト: 1280)
- `height` (number): ビューポート高さ (デフォルト: 720)
- `fullPage` (boolean): フルページスクリーンショット (デフォルト: true、ただしwidth/height指定時はfalse)
- `outputPath` (string): 出力ファイルパス (デフォルト: 自動生成)

#### フルページ優先ロジック
- デフォルトでフルページスクリーンショットを取得
- width/height パラメータが指定された場合、自動的に fullPage=false になる
- 明示的に fullPage=false を指定することも可能

#### 内部固定値（ユーザー指定不可）
- ページ読み込み完了条件: 'networkidle2'
- タイムアウト時間: 30000ms

### 2.3 出力フォーマット
```json
{
  "content": [
    {
      "type": "text",
      "text": "Screenshot saved successfully at: /path/to/screenshot.png"
    }
  ],
  "metadata": {
    "url": "https://example.com",
    "filePath": "/path/to/screenshot.png",
    "timestamp": "2025-06-19T15:17:30Z",
    "viewport": { "width": 1280, "height": 720 },
    "fullPage": true
  }
}
```

## 3. 制約事項

### 3.1 技術制約
- Node.js環境で実行
- Puppeteerのバージョン互換性
- ファイルシステムアクセス権限が必要

### 3.2 セキュリティ制約
- HTTPSサイトのみ許可（HTTP除外）
- ローカルファイルアクセス禁止
- 悪意のあるサイトの除外機能

### 3.3 パフォーマンス制約
- 1リクエストあたり最大30秒
- 同時実行数制限（1並列）
- 画像ファイルサイズ上限（10MB）

## 4. エラーハンドリング

### 4.1 エラータイプ
- `INVALID_URL`: 無効なURL形式
- `NETWORK_ERROR`: ネットワーク接続エラー
- `TIMEOUT_ERROR`: タイムアウトエラー
- `PERMISSION_ERROR`: ファイル保存権限エラー
- `PUPPETEER_ERROR`: Puppeteer内部エラー

### 4.2 エラーレスポンス
```json
{
  "content": [
    {
      "type": "text", 
      "text": "Error: [エラーメッセージ]"
    }
  ],
  "isError": true
}
```

## 5. テストケース

### 5.1 正常系
- 有効なHTTPSサイトのスクリーンショット取得
- デフォルトフルページスクリーンショット
- カスタムビューポートサイズ指定（自動的にfullPage=false）
- 明示的fullPage=false指定
- カスタム出力パス指定

### 5.2 異常系
- 無効URL指定
- HTTP URL指定（HTTPS必須）
- 無効URL形式
- ネットワーク接続エラー
- タイムアウト（30秒）
- ファイル保存権限エラー
- Puppeteer内部エラー

### 5.3 境界値
- 最小/最大ビューポートサイズ
- フルページ優先ロジックの動作確認
- HTTPSプロトコル制約の確認

## 6. 実装例

### 6.1 デフォルト使用例
```json
{
  "url": "https://example.com"
}
```
結果: フルページスクリーンショット（1280x720ビューポート）

### 6.2 カスタムビューポート例
```json
{
  "url": "https://example.com",
  "width": 800,
  "height": 600
}
```
結果: ビューポートスクリーンショット（800x600、自動的にfullPage=false）

### 6.3 明示的フルページ無効例
```json
{
  "url": "https://example.com",
  "fullPage": false
}
```
結果: ビューポートスクリーンショット（1280x720）

### 6.4 カスタム出力パス例
```json
{
  "url": "https://example.com",
  "outputPath": "/custom/path/screenshot.png"
}
```
結果: 指定パスにフルページスクリーンショット保存

## 7. 品質保証

### 7.1 テストカバレッジ
- **カバレッジ要件**: 100%（ステートメント、ブランチ、関数、行すべて）
- **テストフレームワーク**: Vitest
- **テスト総数**: 43テスト（型定義、正常系、異常系、境界値、統合テスト）

### 7.2 型安全性
- **TypeScript**: 厳格な型チェック
- **any型禁止**: any型を一切使用しない完全な型安全コード
- **エラーハンドリング**: neverthrowライブラリによる関数型エラーハンドリング

### 7.3 コード品質
- **アーキテクチャ**: Feature-Sliced Design（FSD）
- **依存関係**: 明確な関心の分離
- **テスタビリティ**: 高い単体テスト可能性
- **メンテナビリティ**: 拡張性を考慮した設計

### 7.4 実装完了状況
- ✅ 要件定義完了
- ✅ 型定義実装完了
- ✅ コア機能実装完了  
- ✅ MCPサーバー統合完了
- ✅ 100%テストカバレッジ達成
- ✅ any型完全除去
- ✅ 言語診断エラーゼロ
- ✅ ドキュメント整備完了