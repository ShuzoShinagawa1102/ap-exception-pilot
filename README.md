# AP Exception Processing — Case Board

## Why（なぜ必要か）

AP（買掛金）自動化が進んでも、**例外処理だけは人手に残り続ける**。  
3-way match 不一致・税区分不備・承認経路逸脱・仕入先マスタ不備——これらの例外は、担当者がメール・ERP・スプレッドシートを行き来しながら手動で解消している。  
結果として「どの案件がどこで詰まっているか」が誰にも見えない状態になり、支払遅延・資金回収遅延・監査リスクが積み重なる。

---

## Problem（課題）

| 痛み | 現状の影響 |
|------|-----------|
| 例外の所在が不明 | 担当者が口頭や Excel で管理し、見落としが発生 |
| 判断根拠が属人化 | 誰がなぜ承認したか後から追えない |
| 書類収集が追えない | 何が足りないか、誰が持っているか分からない |
| SLA が管理されない | 期限超過に気づくのが遅れ、支払遅延につながる |
| 学習が蓄積されない | 同じ例外が繰り返し発生しても対策が打てない |

---

## Solution（解決方法）

**AP Exception Processing Case Board** は、例外案件を「ケース」として一元管理する業務基盤です。

- **ケースボード**: すべての例外案件を可視化。ステータス・担当者・期限・重要度を一覧で把握
- **エビデンス管理**: 各ケースに必要な証拠書類（請求書・PO・GRN・税務書類）をチェックリストで追跡
- **判断支援 (Decision Support)**: ルールベースの推奨アクション（承認/却下/エスカレーション）と根拠を自動提示
- **状態遷移管理**: Draft → IntakeValidated → WaitingForEvidence → InReview → Approved/Rejected/Exception → Closed の正確な状態機械
- **監査証跡 (Audit Trail)**: 誰がいつ何をしたかを完全に記録。再現可能な判断ログ
- **ダッシュボード KPI**: 総案件数・例外件数・案件エイジング・ステータス別集計をリアルタイム表示

---

## How to use（起動方法・使い方）

### 必要環境
- Node.js 18 以上
- npm 9 以上

### 1. バックエンド起動

```bash
cd backend
npm install
npm run dev
# → http://localhost:3001 で起動
```

### 2. フロントエンド起動

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 で起動
```

ブラウザで http://localhost:5173 を開くとアプリが表示されます。

### プロダクションビルド

```bash
# バックエンド
cd backend && npm run build && npm start

# フロントエンド
cd frontend && npm run build
# dist/ を静的ホスティングに配置
```

### API エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/dashboard` | KPI・集計データ |
| GET | `/api/cases` | ケース一覧（フィルタ対応） |
| POST | `/api/cases` | 新規ケース作成 |
| GET | `/api/cases/:id` | ケース詳細（エビデンス・監査証跡・推奨判断含む） |
| PATCH | `/api/cases/:id/status` | ステータス遷移 |
| POST | `/api/cases/:id/decision` | 判断記録 |
| GET | `/api/cases/:id/evidence` | エビデンス一覧 |
| POST | `/api/cases/:id/evidence` | エビデンス追加 |
| PATCH | `/api/evidence/:id` | エビデンス更新 |

---

## フォルダ構成

```
ap-exception-pilot/
├── docs/                          # 仕様書・設計書
│   ├── 01_overview/
│   ├── 02_business_why/
│   ├── 03_specification/
│   ├── 04_architecture/
│   └── 05_references/
├── backend/                       # Node.js + Express + TypeScript
│   └── src/
│       ├── index.ts               # エントリポイント
│       ├── db.ts                  # SQLite 初期化・シードデータ
│       ├── types.ts               # 型定義
│       └── routes/
│           ├── cases.ts           # ケース CRUD・状態遷移
│           ├── evidence.ts        # エビデンス管理
│           └── dashboard.ts       # KPI・集計
└── frontend/                      # React + TypeScript + Vite + Tailwind
    └── src/
        ├── App.tsx                # ルーティング
        ├── api.ts                 # API クライアント
        ├── types.ts               # 型定義
        ├── pages/
        │   ├── Dashboard.tsx      # KPI ダッシュボード
        │   ├── CaseList.tsx       # ケース一覧
        │   ├── CaseDetail.tsx     # ケース詳細（証拠・判断支援・監査証跡）
        │   └── NewCase.tsx        # 新規ケース作成
        └── components/
            ├── NavBar.tsx
            ├── StatusBadge.tsx
            ├── SeverityBadge.tsx
            ├── KpiCard.tsx
            ├── EvidenceRow.tsx
            └── AuditEntry.tsx
```

---

## ドメインモデル

本アプリは仕様書 (`docs/03_specification/`) で定義された以下のドメインモデルに基づいています。

**ケース状態遷移**:
```
Draft → IntakeValidated → WaitingForEvidence → InReview → Approved / Rejected / Exception → Closed → Reopened
```

**主要集約**:
- `Case` — 例外案件の追跡単位（Invoice / PO / GRN を束ねる）
- `Evidence` — Requirement を満たす根拠資料
- `AuditTrail` — 後追いで再現可能な操作履歴

---

## Screenshots

### ダッシュボード — KPI・エイジング・ステータス分布

![Dashboard](https://github.com/user-attachments/assets/cf1dfccf-50cc-4e75-9902-fe91ae053a1c)

---

### ケース一覧 — 検索・フィルタ・優先度表示

![Case List](https://github.com/user-attachments/assets/d9f84632-b948-41ea-9d26-4be1b2ebfef6)

---

### ケース詳細 — エビデンスチェックリスト

![Case Detail - Evidence](https://github.com/user-attachments/assets/82bb4068-5d51-4f24-ad03-371649471cbd)

---

### ケース詳細 — 判断支援（Decision Support）

![Case Detail - Decision Support](https://github.com/user-attachments/assets/9b979bcf-f2c7-46df-894b-3fcae9688f34)

---

### ケース詳細 — 監査証跡（Audit Trail）

![Case Detail - Audit Trail](https://github.com/user-attachments/assets/bc794421-63a2-4cfd-9bd0-f64b646ee272)

---

### 新規ケース作成

![New Case](https://github.com/user-attachments/assets/550f0279-d1d0-4fba-b117-8f43c0addf36)

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v3 |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (better-sqlite3) — ゼロセットアップ |
| Icons | Heroicons |
| HTTP Client | Axios |
| Date Handling | date-fns |

> **Note**: 本実装は PoC（概念実証）として SQLite を使用しています。本番運用では仕様書 (`docs/04_architecture/`) に記載の PostgreSQL + S3 + OpenSearch への移行を推奨します。

---

## プロダクト KPI（仕様書より）

本アプリが改善する業務指標:

- **Intake to decision lead time** — 案件起票から判断完了までのリードタイム
- **Exception aging** — 例外案件の滞留日数
- **Case completion rate** — ケース完了率
- **Evidence completeness score** — 証拠書類の充足率
- **Rework ratio** — 差戻し・再提出率
