"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET /api/cases/:id/evidence
router.get('/cases/:id/evidence', (req, res) => {
    const evidence = db_1.db.prepare('SELECT * FROM evidence WHERE case_id = ? ORDER BY requirement_type').all(req.params.id);
    res.json(evidence);
});
// POST /api/cases/:id/evidence
router.post('/cases/:id/evidence', (req, res) => {
    const { requirement_name, requirement_type, status, notes } = req.body;
    if (!requirement_name || !requirement_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    db_1.db.prepare(`
    INSERT INTO evidence (id, case_id, requirement_name, requirement_type, status, submitted_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, requirement_name, requirement_type, status || 'pending', status !== 'pending' ? now : null, notes || null);
    const evidence = db_1.db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    res.status(201).json(evidence);
});
// PATCH /api/evidence/:id
router.patch('/:id', (req, res) => {
    const { status, notes } = req.body;
    const evidence = db_1.db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
    if (!evidence)
        return res.status(404).json({ error: 'Evidence not found' });
    const now = new Date().toISOString();
    db_1.db.prepare(`
    UPDATE evidence SET status = ?, submitted_at = ?, notes = ? WHERE id = ?
  `).run(status || evidence.status, now, notes ?? evidence.notes, req.params.id);
    const updated = db_1.db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
    res.json(updated);
});
exports.default = router;
