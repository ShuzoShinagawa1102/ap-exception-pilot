import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'ap_exceptions.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'Draft',
      exception_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      due_date TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      requirement_name TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      submitted_at TEXT,
      notes TEXT,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      exception_type TEXT NOT NULL,
      requirement_name TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      is_mandatory INTEGER NOT NULL DEFAULT 1
    );
  `);

  seedData();
}

function seedData(): void {
  const caseCount = (db.prepare('SELECT COUNT(*) as cnt FROM cases').get() as { cnt: number }).cnt;
  if (caseCount > 0) return;

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

  const cases = [
    {
      id: 'CASE-001',
      invoice_id: 'INV-2024-4421',
      vendor_name: 'Acme Supply Corp',
      vendor_id: 'VND-1042',
      invoice_date: daysAgo(8),
      amount: 45200.0,
      currency: 'USD',
      status: 'InReview',
      exception_type: 'three_way_match',
      severity: 'high',
      assigned_to: 'sarah.chen@company.com',
      due_date: daysFromNow(3),
      description: 'Invoice amount $45,200 does not match PO amount $44,800. Variance of $400 detected in line item 3 (shipping charges).',
      created_at: daysAgo(8),
      updated_at: daysAgo(1),
    },
    {
      id: 'CASE-002',
      invoice_id: 'INV-2024-4398',
      vendor_name: 'TechParts Ltd',
      vendor_id: 'VND-0871',
      invoice_date: daysAgo(5),
      amount: 12500.0,
      currency: 'USD',
      status: 'WaitingForEvidence',
      exception_type: 'missing_grn',
      severity: 'medium',
      assigned_to: 'mike.johnson@company.com',
      due_date: daysFromNow(5),
      description: 'Goods Receipt Note (GRN) not found in system for this invoice. Warehouse team needs to confirm receipt.',
      created_at: daysAgo(5),
      updated_at: daysAgo(2),
    },
    {
      id: 'CASE-003',
      invoice_id: 'INV-2024-4301',
      vendor_name: 'Global Tax Services Inc',
      vendor_id: 'VND-2210',
      invoice_date: daysAgo(35),
      amount: 8750.0,
      currency: 'USD',
      status: 'Exception',
      exception_type: 'tax_code_mismatch',
      severity: 'high',
      assigned_to: 'lisa.park@company.com',
      due_date: daysAgo(5),
      description: 'Tax code applied (TX-9001) does not match approved vendor tax classification. Potential compliance risk.',
      created_at: daysAgo(35),
      updated_at: daysAgo(3),
    },
    {
      id: 'CASE-004',
      invoice_id: 'INV-2024-4455',
      vendor_name: 'Office Essentials Co',
      vendor_id: 'VND-0334',
      invoice_date: daysAgo(12),
      amount: 33100.0,
      currency: 'USD',
      status: 'Exception',
      exception_type: 'duplicate_invoice',
      severity: 'critical',
      assigned_to: 'sarah.chen@company.com',
      due_date: daysFromNow(1),
      description: 'Duplicate invoice detected. Invoice INV-2024-4455 appears to match previously paid invoice INV-2024-4280 from same vendor.',
      created_at: daysAgo(12),
      updated_at: daysAgo(0),
    },
    {
      id: 'CASE-005',
      invoice_id: 'INV-2024-4467',
      vendor_name: 'New Horizons Consulting',
      vendor_id: 'VND-NEW-001',
      invoice_date: daysAgo(2),
      amount: 5200.0,
      currency: 'USD',
      status: 'Draft',
      exception_type: 'vendor_master_issue',
      severity: 'medium',
      assigned_to: 'james.wilson@company.com',
      due_date: daysFromNow(10),
      description: 'Vendor not found in approved vendor master list. Vendor onboarding process must be completed before payment.',
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: 'CASE-006',
      invoice_id: 'INV-2024-4389',
      vendor_name: 'Industrial Supplies LLC',
      vendor_id: 'VND-0556',
      invoice_date: daysAgo(20),
      amount: 7300.0,
      currency: 'USD',
      status: 'Closed',
      exception_type: 'three_way_match',
      severity: 'low',
      assigned_to: 'mike.johnson@company.com',
      due_date: daysAgo(10),
      description: 'Minor line item discrepancy resolved. Invoice matched correctly after vendor correction.',
      created_at: daysAgo(20),
      updated_at: daysAgo(8),
    },
    {
      id: 'CASE-007',
      invoice_id: 'INV-2024-4410',
      vendor_name: 'Enterprise Solutions Group',
      vendor_id: 'VND-1187',
      invoice_date: daysAgo(6),
      amount: 125000.0,
      currency: 'USD',
      status: 'InReview',
      exception_type: 'over_budget',
      severity: 'high',
      assigned_to: 'lisa.park@company.com',
      due_date: daysFromNow(2),
      description: 'Invoice amount exceeds approved budget by $25,000. CFO approval required for budget override.',
      created_at: daysAgo(6),
      updated_at: daysAgo(1),
    },
    {
      id: 'CASE-008',
      invoice_id: 'INV-2024-4459',
      vendor_name: 'Quick Print Services',
      vendor_id: 'VND-0922',
      invoice_date: daysAgo(3),
      amount: 9800.0,
      currency: 'USD',
      status: 'WaitingForEvidence',
      exception_type: 'missing_po',
      severity: 'low',
      assigned_to: 'james.wilson@company.com',
      due_date: daysFromNow(7),
      description: 'No Purchase Order reference found on invoice. Vendor must provide PO number or requestor must create retroactive PO.',
      created_at: daysAgo(3),
      updated_at: daysAgo(1),
    },
  ];

  const insertCase = db.prepare(`
    INSERT INTO cases (id, invoice_id, vendor_name, vendor_id, invoice_date, amount, currency, status, exception_type, severity, assigned_to, due_date, description, created_at, updated_at)
    VALUES (@id, @invoice_id, @vendor_name, @vendor_id, @invoice_date, @amount, @currency, @status, @exception_type, @severity, @assigned_to, @due_date, @description, @created_at, @updated_at)
  `);

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (id, case_id, requirement_name, requirement_type, status, submitted_at, notes)
    VALUES (@id, @case_id, @requirement_name, @requirement_type, @status, @submitted_at, @notes)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_trail (id, case_id, actor, action, from_status, to_status, reason, created_at)
    VALUES (@id, @case_id, @actor, @action, @from_status, @to_status, @reason, @created_at)
  `);

  const seedAll = db.transaction(() => {
    for (const c of cases) {
      insertCase.run(c);
    }

    // Evidence for CASE-001 (three_way_match - InReview)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-001', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(7), notes: 'Invoice INV-2024-4421 received' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-001', requirement_name: 'Purchase Order', requirement_type: 'po', status: 'submitted', submitted_at: daysAgo(7), notes: 'PO-88421 attached' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-001', requirement_name: 'Goods Receipt Note', requirement_type: 'grn', status: 'submitted', submitted_at: daysAgo(6), notes: 'GRN-77341 confirmed' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-001', requirement_name: 'Variance Explanation', requirement_type: 'other', status: 'submitted', submitted_at: daysAgo(2), notes: 'Vendor confirmed shipping rate change' });

    // Evidence for CASE-002 (missing_grn - WaitingForEvidence)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-002', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(5), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-002', requirement_name: 'Purchase Order', requirement_type: 'po', status: 'submitted', submitted_at: daysAgo(5), notes: 'PO-88310 attached' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-002', requirement_name: 'Goods Receipt Note', requirement_type: 'grn', status: 'pending', submitted_at: null, notes: 'Awaiting warehouse confirmation' });

    // Evidence for CASE-003 (tax_code_mismatch - Exception)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-003', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(34), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-003', requirement_name: 'Tax Exemption Certificate', requirement_type: 'tax', status: 'expired', submitted_at: daysAgo(30), notes: 'Certificate expired 5 days ago' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-003', requirement_name: 'Vendor Tax Classification', requirement_type: 'tax', status: 'rejected', submitted_at: daysAgo(20), notes: 'Classification does not match system records' });

    // Evidence for CASE-004 (duplicate_invoice - Exception)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-004', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(12), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-004', requirement_name: 'Duplicate Check Report', requirement_type: 'other', status: 'submitted', submitted_at: daysAgo(10), notes: 'System flagged 98% match with INV-2024-4280' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-004', requirement_name: 'Vendor Confirmation', requirement_type: 'other', status: 'pending', submitted_at: null, notes: 'Email sent to vendor, awaiting response' });

    // Evidence for CASE-005 (vendor_master_issue - Draft)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-005', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(2), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-005', requirement_name: 'Vendor Registration Form', requirement_type: 'other', status: 'pending', submitted_at: null, notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-005', requirement_name: 'W-9 Form', requirement_type: 'tax', status: 'pending', submitted_at: null, notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-005', requirement_name: 'Vendor Contract', requirement_type: 'contract', status: 'pending', submitted_at: null, notes: null });

    // Evidence for CASE-006 (Closed)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-006', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'approved', submitted_at: daysAgo(19), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-006', requirement_name: 'Purchase Order', requirement_type: 'po', status: 'approved', submitted_at: daysAgo(19), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-006', requirement_name: 'Goods Receipt Note', requirement_type: 'grn', status: 'approved', submitted_at: daysAgo(18), notes: null });

    // Evidence for CASE-007 (over_budget - InReview)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-007', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(6), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-007', requirement_name: 'Budget Approval Request', requirement_type: 'approval', status: 'submitted', submitted_at: daysAgo(5), notes: 'Submitted to CFO office' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-007', requirement_name: 'CFO Approval', requirement_type: 'approval', status: 'pending', submitted_at: null, notes: 'Awaiting CFO signature' });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-007', requirement_name: 'Business Justification', requirement_type: 'other', status: 'submitted', submitted_at: daysAgo(5), notes: 'Emergency infrastructure upgrade' });

    // Evidence for CASE-008 (missing_po - WaitingForEvidence)
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-008', requirement_name: 'Original Invoice', requirement_type: 'invoice', status: 'submitted', submitted_at: daysAgo(3), notes: null });
    insertEvidence.run({ id: uuidv4(), case_id: 'CASE-008', requirement_name: 'Purchase Order', requirement_type: 'po', status: 'pending', submitted_at: null, notes: 'Requestor notified to create PO' });

    // Audit trail
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-001', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(8) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-001', actor: 'system', action: 'Intake validated', from_status: 'Draft', to_status: 'IntakeValidated', reason: null, created_at: daysAgo(8) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-001', actor: 'sarah.chen@company.com', action: 'Evidence collection started', from_status: 'IntakeValidated', to_status: 'WaitingForEvidence', reason: null, created_at: daysAgo(7) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-001', actor: 'sarah.chen@company.com', action: 'All evidence collected, moved to review', from_status: 'WaitingForEvidence', to_status: 'InReview', reason: 'All required documents submitted', created_at: daysAgo(1) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-002', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(5) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-002', actor: 'mike.johnson@company.com', action: 'Intake validated', from_status: 'Draft', to_status: 'IntakeValidated', reason: null, created_at: daysAgo(5) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-002', actor: 'mike.johnson@company.com', action: 'Waiting for GRN from warehouse', from_status: 'IntakeValidated', to_status: 'WaitingForEvidence', reason: 'GRN missing from system', created_at: daysAgo(4) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-003', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(35) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-003', actor: 'lisa.park@company.com', action: 'Intake validated', from_status: 'Draft', to_status: 'IntakeValidated', reason: null, created_at: daysAgo(34) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-003', actor: 'lisa.park@company.com', action: 'Escalated to exception', from_status: 'WaitingForEvidence', to_status: 'Exception', reason: 'Tax certificate expired, vendor non-responsive', created_at: daysAgo(3) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-004', actor: 'system', action: 'Case created - duplicate detected', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(12) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-004', actor: 'sarah.chen@company.com', action: 'Escalated to exception', from_status: 'InReview', to_status: 'Exception', reason: 'High confidence duplicate match found', created_at: daysAgo(0) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-005', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(2) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-006', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(20) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-006', actor: 'mike.johnson@company.com', action: 'Case approved and closed', from_status: 'InReview', to_status: 'Closed', reason: 'All documents verified, approved for payment', created_at: daysAgo(8) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-007', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(6) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-007', actor: 'lisa.park@company.com', action: 'Moved to review pending CFO approval', from_status: 'WaitingForEvidence', to_status: 'InReview', reason: 'Budget justification submitted', created_at: daysAgo(1) });

    insertAudit.run({ id: uuidv4(), case_id: 'CASE-008', actor: 'system', action: 'Case created', from_status: null, to_status: 'Draft', reason: null, created_at: daysAgo(3) });
    insertAudit.run({ id: uuidv4(), case_id: 'CASE-008', actor: 'james.wilson@company.com', action: 'Waiting for PO creation', from_status: 'IntakeValidated', to_status: 'WaitingForEvidence', reason: 'No PO reference on invoice', created_at: daysAgo(2) });
  });

  seedAll();
}
