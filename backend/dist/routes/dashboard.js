"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    const totalCases = db_1.db.prepare('SELECT COUNT(*) as cnt FROM cases').get().cnt;
    const statusRows = db_1.db.prepare('SELECT status, COUNT(*) as cnt FROM cases GROUP BY status').all();
    const by_status = {};
    for (const row of statusRows)
        by_status[row.status] = row.cnt;
    const severityRows = db_1.db.prepare('SELECT severity, COUNT(*) as cnt FROM cases GROUP BY severity').all();
    const by_severity = {};
    for (const row of severityRows)
        by_severity[row.severity] = row.cnt;
    const closedCases = db_1.db.prepare(`
    SELECT c.created_at, a.created_at as closed_at
    FROM cases c
    JOIN audit_trail a ON a.case_id = c.id AND a.to_status = 'Closed'
    WHERE c.status = 'Closed'
  `).all();
    let avg_resolution_time_days = 0;
    if (closedCases.length > 0) {
        const totalDays = closedCases.reduce((sum, c) => {
            const diff = new Date(c.closed_at).getTime() - new Date(c.created_at).getTime();
            return sum + diff / 86400000;
        }, 0);
        avg_resolution_time_days = Math.round((totalDays / closedCases.length) * 10) / 10;
    }
    const now = new Date();
    const cases = db_1.db.prepare('SELECT id, created_at, status FROM cases').all();
    const aging_buckets = [
        { label: '0-7 days', days_range: '0-7', count: 0 },
        { label: '8-14 days', days_range: '8-14', count: 0 },
        { label: '15-30 days', days_range: '15-30', count: 0 },
        { label: '30+ days', days_range: '30+', count: 0 },
    ];
    for (const c of cases) {
        if (c.status === 'Closed')
            continue;
        const ageDays = (now.getTime() - new Date(c.created_at).getTime()) / 86400000;
        if (ageDays <= 7)
            aging_buckets[0].count++;
        else if (ageDays <= 14)
            aging_buckets[1].count++;
        else if (ageDays <= 30)
            aging_buckets[2].count++;
        else
            aging_buckets[3].count++;
    }
    res.json({ total_cases: totalCases, by_status, by_severity, avg_resolution_time_days, aging_buckets });
});
exports.default = router;
