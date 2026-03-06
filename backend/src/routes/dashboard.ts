import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const totalCases = (db.prepare('SELECT COUNT(*) as cnt FROM cases').get() as { cnt: number }).cnt;

  const statusRows = db.prepare('SELECT status, COUNT(*) as cnt FROM cases GROUP BY status').all() as { status: string; cnt: number }[];
  const by_status: Record<string, number> = {};
  for (const row of statusRows) by_status[row.status] = row.cnt;

  const severityRows = db.prepare('SELECT severity, COUNT(*) as cnt FROM cases GROUP BY severity').all() as { severity: string; cnt: number }[];
  const by_severity: Record<string, number> = {};
  for (const row of severityRows) by_severity[row.severity] = row.cnt;

  const closedCases = db.prepare(`
    SELECT c.created_at, a.created_at as closed_at
    FROM cases c
    JOIN audit_trail a ON a.case_id = c.id AND a.to_status = 'Closed'
    WHERE c.status = 'Closed'
  `).all() as { created_at: string; closed_at: string }[];

  let avg_resolution_time_days = 0;
  if (closedCases.length > 0) {
    const totalDays = closedCases.reduce((sum, c) => {
      const diff = new Date(c.closed_at).getTime() - new Date(c.created_at).getTime();
      return sum + diff / 86400000;
    }, 0);
    avg_resolution_time_days = Math.round((totalDays / closedCases.length) * 10) / 10;
  }

  const now = new Date();
  const cases = db.prepare('SELECT id, created_at, status FROM cases').all() as { id: string; created_at: string; status: string }[];

  const aging_buckets = [
    { label: '0-7 days', days_range: '0-7', count: 0 },
    { label: '8-14 days', days_range: '8-14', count: 0 },
    { label: '15-30 days', days_range: '15-30', count: 0 },
    { label: '30+ days', days_range: '30+', count: 0 },
  ];

  for (const c of cases) {
    if (c.status === 'Closed') continue;
    const ageDays = (now.getTime() - new Date(c.created_at).getTime()) / 86400000;
    if (ageDays <= 7) aging_buckets[0].count++;
    else if (ageDays <= 14) aging_buckets[1].count++;
    else if (ageDays <= 30) aging_buckets[2].count++;
    else aging_buckets[3].count++;
  }

  res.json({ total_cases: totalCases, by_status, by_severity, avg_resolution_time_days, aging_buckets });
});

export default router;
