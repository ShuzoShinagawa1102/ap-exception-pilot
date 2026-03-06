# Accounts Payable 例外処理 / 03_specification

    ## 1. ドメイン原則
    1. すべての案件は **Case / Aggregate** として追跡可能でなければならない
    2. どの判断も、**根拠ルール** と **根拠証拠** に接続されなければならない
    3. 自動化はブラックボックスではなく、**説明可能な提案** として実装する
    4. 例外は失敗ではなく、**明示的に管理される業務対象** とみなす
    5. 人間の最終責任を残しつつ、人が使う判断材料を機械側が準備する

    ## 2. 境界づけられたコンテキスト
    - **Invoice Intake**: 請求書受領・抽出
- **Match & Validation**: PO/GRN/契約/税区分照合
- **Exception Case**: 不一致案件の集約
- **Approval Routing**: 承認先の決定と催促
- **Vendor Collaboration**: 補足情報要求・再送依頼
- **Payment Release**: 保留解除と支払実行


    ## 3. ユビキタス言語（最小）
    - **Case**: ひとつの業務要求を表す追跡単位
    - **Requirement**: 案件成立に必要な条件
    - **Evidence**: Requirement を満たす根拠資料
    - **Decision**: ルールと証拠に基づく判断結果
    - **Exception**: 標準フローから外れた状態
    - **Task**: 誰かに割り当てられた行為
    - **Audit Trail**: 後追いで再現可能な操作履歴

    ## 4. 主要ユースケース
    ### UC-01 案件起票
    入力チャネルから案件を生成し、最初の責任者を割り当てる。

    ### UC-02 必要条件の計算
    ルール・商品・国・相手先・契約種別などに応じて、必要書類・必要審査・期限を算出する。

    ### UC-03 証拠収集と完全性評価
    提出資料を受理し、欠落・期限切れ・不一致を検知する。

    ### UC-04 判断支援
    自動で結論を確定するのではなく、担当者に「推奨判断」「理由」「不足点」を提示する。

    ### UC-05 例外エスカレーション
    標準フローで処理できない場合に、例外案件へ昇格し、優先度と責任者を定める。

    ### UC-06 結果反映
    最終判断を下流システムへ反映し、後続業務へ接続する。

    ### UC-07 学習ループ
    完了案件から、将来のテンプレート、ルール、回答資産、リスクパターンを抽出する。

    ## 5. 集約と不変条件
    ### Aggregate: Case
    - Case は単一の状態遷移を持つ
    - Close された Case は、再審査または変更ケースを別生成しない限り再編集できない
    - Decision は Evidence 不足状態では確定できない
    - 例外理由が未設定のまま Exception 状態へ移行できない

    ### Aggregate: Requirement / Evidence
    - Evidence は Requirement に紐づかなければ意味を持たない
    - 有効期限切れの Evidence は自動的に「満たしている」とみなしてはならない

    ### Aggregate: Task
    - Task は明確な owner / due date / reason を持つ
    - SLA超過は監査イベントとして残す

    ## 6. ドメインイベント
    - CaseCreated
    - RequirementsCalculated
    - EvidenceReceived
    - EvidenceRejected
    - ExceptionRaised
    - TaskAssigned
    - DecisionRecommended
    - DecisionConfirmed
    - CaseClosed
    - CaseReopened
    - RuleSetChanged

    ## 7. ドメインモデル
    ```mermaid
    classDiagram
direction LR

class Invoice {
  +invoiceId
  +vendorId
  +invoiceDate
  +amount
  +currency
}
class PurchaseOrder {
  +poId
  +status
}
class GoodsReceipt {
  +grnId
  +receivedAt
}
class MatchResult {
  +matchResultId
  +resultType
  +varianceAmount
}
class ExceptionCase {
  +caseId
  +reasonCode
  +severity
  +status
}
class ApprovalTask {
  +taskId
  +assignee
  +dueAt
}
class PaymentInstruction {
  +paymentId
  +scheduledAt
  +status
}

Invoice "1" --> "0..1" PurchaseOrder : references
PurchaseOrder "1" --> "*" GoodsReceipt : fulfilled_by
Invoice "1" --> "1" MatchResult : evaluated_as
MatchResult "1" --> "0..1" ExceptionCase : escalates_to
ExceptionCase "1" --> "*" ApprovalTask : resolves_with
Invoice "1" --> "0..1" PaymentInstruction : released_as
    ```

    ## 8. 状態遷移
    ```mermaid
    stateDiagram-v2
      [*] --> Draft
      Draft --> IntakeValidated
      IntakeValidated --> WaitingForEvidence
      WaitingForEvidence --> InReview
      InReview --> Exception
      InReview --> Approved
      InReview --> Rejected
      Exception --> WaitingForEvidence
      Exception --> InReview
      Approved --> Closed
      Rejected --> Closed
      Closed --> Reopened
    ```

    ## 9. コンテキスト間の関係
    ```mermaid
    flowchart LR
      A[Intake] --> B[Requirement Engine]
      B --> C[Evidence Management]
      C --> D[Decision Support]
      D --> E[Exception Orchestration]
      D --> F[Downstream Sync]
      E --> C
      F --> G[Audit & Analytics]
      C --> G
      D --> G
    ```

    ## 10. 実装上の注意
    - LLM は Case の owner ではなく、**assistant** として振る舞わせる
    - 重要判定は rule engine と structured extraction を混ぜる
    - 監査・再現性のない推論は本番の決定根拠に使わない
    - UI は「チャット」より「ケースボード」「不足点」「根拠表示」を優先する
