export type CaseStatus =
  | 'Draft'
  | 'IntakeValidated'
  | 'WaitingForEvidence'
  | 'InReview'
  | 'Exception'
  | 'Approved'
  | 'Rejected'
  | 'Closed'
  | 'Reopened';

export type ExceptionType =
  | 'three_way_match'
  | 'missing_grn'
  | 'tax_code_mismatch'
  | 'duplicate_invoice'
  | 'vendor_master_issue'
  | 'over_budget'
  | 'missing_po'
  | 'approval_routing'
  | 'payment_hold';

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type EvidenceStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';

export interface Case {
  id: string;
  invoice_id: string;
  vendor_name: string;
  vendor_id: string;
  invoice_date: string;
  amount: number;
  currency: string;
  status: CaseStatus;
  exception_type: ExceptionType;
  severity: Severity;
  assigned_to: string;
  due_date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  case_id: string;
  requirement_name: string;
  requirement_type: string;
  status: EvidenceStatus;
  submitted_at: string | null;
  notes: string | null;
}

export interface AuditTrail {
  id: string;
  case_id: string;
  actor: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  created_at: string;
}

export interface Recommendation {
  action: 'gather_evidence' | 'approve' | 'reject' | 'escalate' | 'review';
  reasoning: string[];
  missing_requirements: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface CaseWithDetails extends Case {
  evidence: Evidence[];
  audit_trail: AuditTrail[];
  recommendation: Recommendation;
}

export interface DashboardStats {
  total_cases: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  avg_resolution_time_days: number;
  aging_buckets: {
    label: string;
    count: number;
    days_range: string;
  }[];
}
