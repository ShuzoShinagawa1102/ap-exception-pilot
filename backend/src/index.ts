import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import casesRouter from './routes/cases';
import evidenceRouter from './routes/evidence';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api/cases', casesRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`AP Exception Backend running on http://localhost:${PORT}`);
});

export default app;
