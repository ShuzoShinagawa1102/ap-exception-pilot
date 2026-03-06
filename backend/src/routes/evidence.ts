import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();

// GET /api/cases/:id/evidence
router.get('/cases/:id/evidence', (req: Request, res: Response) => {
  const evidence = db.prepare('SELECT * FROM evidence WHERE case_id = ? ORDER BY requirement_type').all(req.params.id);
  res.json(evidence);
});

// POST /api/cases/:id/evidence
router.post('/cases/:id/evidence', (req: Request, res: Response) => {
  const { requirement_name, requirement_type, status, notes } = req.body;
  if (!requirement_name || !requirement_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO evidence (id, case_id, requirement_name, requirement_type, status, submitted_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, requirement_name, requirement_type, status || 'pending', status !== 'pending' ? now : null, notes || null);

  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
  res.status(201).json(evidence);
});

// PATCH /api/evidence/:id
router.patch('/:id', (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) return res.status(404).json({ error: 'Evidence not found' });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE evidence SET status = ?, submitted_at = ?, notes = ? WHERE id = ?
  `).run(status || (evidence as { status: string }).status, now, notes ?? (evidence as { notes: string | null }).notes, req.params.id);

  const updated = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
