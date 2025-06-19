```
mcp-template/
  ├── CLAUDE.md                      # Claude Memoryに保存される
  ├── README.md
  ├── package.json
  ├── tsconfig.json
  ├── eslint.config.mjs
  ├── vitest.config.ts
  ├── coverage/                      # テストカバレッジレポート
  ├── dist/                          # ビルド成果物
  ├── project/                       # プロジェクト管理
  │   ├── RULE.md                    # プロジェクトルール
  │   ├── TECK_STACK.md              # 技術スタック
  │   ├── BASE_STRUCTURE.md          # 基本ディレクトリ構造
  │   ├── requirements               # 要件定義書
  │   ├── references                 # 参考資料
  │   ├── tasks/                     # タスク管理
  │   │   ├── backlog/               # 未着手課題
  │   │   ├── in-progress/           # 着手中課題
  │   │   └── done/                  # 完了課題
  │   └── template/                  # タスクテンプレート
  └── src/                 # FSDアーキテクチャ
      ├── app/             # アプリケーション層
      ├── features/        # 機能層
      │   └── server/      # MCP Tool 登録
      ├── entities/        # エンティティ層
      └── shared/          # 共有層
          └── lib/
```