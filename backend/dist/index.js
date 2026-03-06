"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const cases_1 = __importDefault(require("./routes/cases"));
const evidence_1 = __importDefault(require("./routes/evidence"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
(0, db_1.initDb)();
app.use('/api/cases', cases_1.default);
app.use('/api/evidence', evidence_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.listen(PORT, () => {
    console.log(`AP Exception Backend running on http://localhost:${PORT}`);
});
exports.default = app;
