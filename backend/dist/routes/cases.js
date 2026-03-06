"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const router = (0, express_1.Router)();
const VALID_TRANSITIONS = {
    Draft: ['IntakeValidated'],
    IntakeValidated: ['WaitingForEvidence', 'InReview'],
    WaitingForEvidence: ['InReview', 'Exception'],
    InReview: ['Approved', 'Rejected', 'Exception'],
    Exception: ['InReview', 'Closed'],
    Approved: ['Closed'],
    Rejected: ['Closed', 'Reopened'],
    Closed: ['Reopened'],
    Reopened: ['InReview', 'WaitingForEvidence'],
};
function computeRecommendation(evidence, status, exceptionType) {
    const pendingEvidence = evidence.filter(e => e.status === 'pending');
    const expiredEvidence = evidence.filter(e => e.status === 'expired');
    const rejectedEvidence = evidence.filter(e => e.status === 'rejected');
    const submittedEvidence = evidence.filter(e => e.status === 'submitted' || e.status === 'approved');
    const totalRequired = evidence.length;
    const missing = [...pendingEvidence, ...expiredEvidence, ...rejectedEvidence];
    const reasoning = [];
    let risk_level = 'low';
    if (missing.length > 0) {
        reasoning.push(`${missing.length} of ${totalRequired} evidence items are incomplete.`);
        if (expiredEvidence.length > 0) {
            reasoning.push(`${expiredEvidence.length} evidence item(s) have expired and must be renewed.`);
            risk_level = 'high';
        }
        if (rejectedEvidence.length > 0) {
            reasoning.push(`${rejectedEvidence.length} evidence item(s) were rejected and need resubmission.`);
            risk_level = 'high';
        }
        if (pendingEvidence.length > 0) {
            reasoning.push(`${pendingEvidence.length} evidence item(s) are still pending submission.`);
            if (risk_level === 'low')
                risk_level = 'medium';
        }
        return {
            action: 'gather_evidence',
            reasoning,
            missing_requirements: missing.map(e => e.requirement_name),
            risk_level,
        };
    }
    // All evidence present
    reasoning.push('All required evidence has been submitted.');
    if (exceptionType === 'duplicate_invoice') {
        risk_level = 'high';
        reasoning.push('Duplicate invoice exception carries high financial risk.');
        reasoning.push('Recommend rejecting this invoice to prevent double payment.');
        return { action: 'reject', reasoning, missing_requirements: [], risk_level };
    }
    if (exceptionType === 'tax_code_mismatch') {
        risk_level = 'high';
        reasoning.push('Tax code mismatches may result in compliance violations.');
        reasoning.push('Escalate to tax team for review before approving.');
        return { action: 'escalate', reasoning, missing_requirements: [], risk_level };
    }
    if (exceptionType === 'vendor_master_issue') {
        risk_level = 'medium';
        reasoning.push('Vendor not in approved master list. Onboarding must be completed first.');
        return { action: 'escalate', reasoning, missing_requirements: [], risk_level };
    }
    if (exceptionType === 'over_budget') {
        risk_level = 'medium';
        reasoning.push('Over-budget invoices require management approval.');
        if (submittedEvidence.some(e => e.requirement_name.includes('CFO'))) {
            reasoning.push('CFO approval document found. Recommend proceeding with approval.');
            return { action: 'approve', reasoning, missing_requirements: [], risk_level };
        }
        reasoning.push('CFO approval still pending. Do not approve until signed.');
        return { action: 'review', reasoning, missing_requirements: [], risk_level };
    }
    if (exceptionType === 'three_way_match') {
        risk_level = 'low';
        reasoning.push('Invoice, PO, and GRN all submitted. Variance explanation provided.');
        reasoning.push('If variance is within tolerance (<1%), recommend approval.');
        return { action: 'approve', reasoning, missing_requirements: [], risk_level };
    }
    // Suppress unused variable warning
    void status;
    risk_level = 'low';
    reasoning.push('All evidence collected. Case ready for final decision.');
    return { action: 'approve', reasoning, missing_requirements: [], risk_level };
}
// GET /api/cases
router.get('/', (req, res) => {
    const { status, severity, assigned_to } = req.query;
    let query = 'SELECT * FROM cases WHERE 1=1';
    const params = {};
    if (status) {
        query += ' AND status = @status';
        params.status = status;
    }
    if (severity) {
        query += ' AND severity = @severity';
        params.severity = severity;
    }
    if (assigned_to) {
        query += ' AND assigned_to = @assigned_to';
        params.assigned_to = assigned_to;
    }
    query += ' ORDER BY created_at DESC';
    const cases = db_1.db.prepare(query).all(params);
    res.json(cases);
});
// GET /api/cases/:id
router.get('/:id', (req, res) => {
    const caseData = db_1.db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData)
        return res.status(404).json({ error: 'Case not found' });
    const evidence = db_1.db.prepare('SELECT * FROM evidence WHERE case_id = ? ORDER BY requirement_type').all(req.params.id);
    const auditTrail = db_1.db.prepare('SELECT * FROM audit_trail WHERE case_id = ? ORDER BY created_at ASC').all(req.params.id);
    const c = caseData;
    const recommendation = computeRecommendation(evidence, c.status, c.exception_type);
    res.json({ ...caseData, evidence, audit_trail: auditTrail, recommendation });
});
// POST /api/cases
router.post('/', (req, res) => {
    const { invoice_id, vendor_name, vendor_id, invoice_date, amount, currency, exception_type, severity, assigned_to, due_date, description } = req.body;
    if (!invoice_id || !vendor_name || !exception_type) {
        return res.status(400).json({ error: 'Missing required fields: invoice_id, vendor_name, exception_type' });
    }
    const id = `CASE-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const now = new Date().toISOString();
    db_1.db.prepare(`
    INSERT INTO cases (id, invoice_id, vendor_name, vendor_id, invoice_date, amount, currency, status, exception_type, severity, assigned_to, due_date, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?)
  `).run(id, invoice_id, vendor_name, vendor_id || '', invoice_date || now, amount || 0, currency || 'USD', exception_type, severity || 'medium', assigned_to || 'unassigned', due_date || now, description || '', now, now);
    db_1.db.prepare(`
    INSERT INTO audit_trail (id, case_id, actor, action, from_status, to_status, reason, created_at)
    VALUES (?, ?, 'system', 'Case created', NULL, 'Draft', NULL, ?)
  `).run((0, uuid_1.v4)(), id, now);
    const newCase = db_1.db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    res.status(201).json(newCase);
});
// PATCH /api/cases/:id/status
router.patch('/:id/status', (req, res) => {
    const { to_status, actor, reason } = req.body;
    const caseData = db_1.db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData)
        return res.status(404).json({ error: 'Case not found' });
    const validNext = VALID_TRANSITIONS[caseData.status] || [];
    if (!validNext.includes(to_status)) {
        return res.status(400).json({
            error: `Invalid transition from ${caseData.status} to ${to_status}`,
            valid_transitions: validNext,
        });
    }
    const now = new Date().toISOString();
    db_1.db.prepare('UPDATE cases SET status = ?, updated_at = ? WHERE id = ?').run(to_status, now, req.params.id);
    db_1.db.prepare(`
    INSERT INTO audit_trail (id, case_id, actor, action, from_status, to_status, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run((0, uuid_1.v4)(), req.params.id, actor || 'system', `Status changed to ${to_status}`, caseData.status, to_status, reason || null, now);
    const updated = db_1.db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    res.json(updated);
});
// POST /api/cases/:id/decision
router.post('/:id/decision', (req, res) => {
    const { decision, actor, reason } = req.body;
    if (!['Approved', 'Rejected'].includes(decision)) {
        return res.status(400).json({ error: 'Decision must be Approved or Rejected' });
    }
    const caseData = db_1.db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData)
        return res.status(404).json({ error: 'Case not found' });
    const now = new Date().toISOString();
    db_1.db.prepare('UPDATE cases SET status = ?, updated_at = ? WHERE id = ?').run(decision, now, req.params.id);
    db_1.db.prepare(`
    INSERT INTO audit_trail (id, case_id, actor, action, from_status, to_status, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run((0, uuid_1.v4)(), req.params.id, actor || 'reviewer', `Decision: ${decision}`, caseData.status, decision, reason || null, now);
    const updated = db_1.db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    res.json(updated);
});
exports.default = router;
