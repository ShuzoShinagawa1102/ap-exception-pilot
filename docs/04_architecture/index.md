# Accounts Payable 例外処理 / 04_architecture

## 1. アーキテクチャ原則
1. **Case-centric**: すべてをケース中心に組み立てる
2. **Human-in-the-loop**: 自動化ではなく判断支援を主軸に置く
3. **Audit-first**: 全判断は再現可能なログを持つ
4. **Integration-first**: 既存基幹システムと共存する
5. **Exception-native**: 例外処理を後付けにしない

## 2. 推奨技術スタック
既存ERPと共存するため、疎結合API統合が重要。Backend は TypeScript/NestJS、文書抽出と照合補助は Python、ワークフローは Temporal、RDB は PostgreSQL、オブジェクト保管は S3、検索は OpenSearch。ERP 連携は SAP/OData、Oracle、NetSuite、Dynamics 等のコネクタを明確に分離する。

## 3. 参照アーキテクチャ
```mermaid
flowchart TB
  subgraph Channels
    A1[Web UI]
    A2[API / Batch / File Intake]
    A3[Email / Portal / EDI Connector]
  end

  subgraph App
    B1[Case Service]
    B2[Requirement Engine]
    B3[Evidence Service]
    B4[Decision Support Service]
    B5[Exception Orchestrator]
    B6[Audit Service]
  end

  subgraph Async
    C1[Workflow Engine]
    C2[Event Bus]
  end

  subgraph Data
    D1[(PostgreSQL)]
    D2[(Object Storage)]
    D3[(OpenSearch)]
    D4[(Analytics / Warehouse)]
  end

  subgraph Intelligence
    E1[Structured Extraction]
    E2[Rule Engine]
    E3[LLM Assist]
  end

  subgraph Integrations
    F1[Core System / ERP / EHR / CLM]
    F2[External Data Providers]
    F3[Identity / IAM]
  end

  A1 --> B1
  A2 --> B1
  A3 --> B3

  B1 --> C1
  B2 --> E2
  B3 --> E1
  B4 --> E3
  B4 --> E2
  B5 --> C1

  B1 --> D1
  B3 --> D2
  B3 --> D3
  B6 --> D1
  B6 --> D4

  C1 --> C2
  C2 --> B1
  C2 --> B5

  B1 --> F1
  B3 --> F2
  B6 --> F3
```

## 4. サービス分割
- **Case Service**: 案件の生成、状態管理、責任者管理
- **Requirement Engine**: 必要条件・SLA・分岐ルール算出
- **Evidence Service**: 提出物管理、抽出、完全性判定
- **Decision Support Service**: 推奨判断、理由表示、根拠束ね
- **Exception Orchestrator**: 例外優先順位付け、エスカレーション
- **Audit Service**: 証跡、監査、説明責任
- **Integration Adapters**: 外部システム接続

## 5. データ設計方針
- 取引データは正規化されたRDBで保持
- 文書・画像・原本は object storage
- 全文検索/類似検索/抽出後テキストは検索基盤へ
- KPI と業務分析は別 warehouse へ集約

## 6. セキュリティ・ガバナンス
- 行レベル/ケースレベル権限制御
- 署名付きアクセスURL
- PII/PHI/財務情報のマスキング
- 監査ログの改ざん防止
- モデル出力の versioning
- prompt / extraction / decision recommendation の保存

## 7. 非機能要件
- 可用性: 業務時間帯の高可用
- 追跡性: すべてのケースに traceId を付与
- 再処理性: ルール改定時にケース再評価可能
- 拡張性: コネクタ差し替え可能
- 国際化: 日付、通貨、言語、法域差異に対応可能

## 8. 導入順序
1. 最も高価な例外パターンを特定
2. その例外だけをケース化
3. 必要条件計算と不足検知を実装
4. 推奨判断と根拠提示を実装
5. 下流連携を追加
6. KPI可視化と学習ループを載せる
