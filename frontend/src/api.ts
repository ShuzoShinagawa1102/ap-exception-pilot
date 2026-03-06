import axios from 'axios';
import { Case, CaseWithDetails, DashboardStats, Evidence } from './types';

const api = axios.create({ baseURL: '/api' });

export const fetchDashboard = (): Promise<DashboardStats> =>
  api.get('/dashboard').then(r => r.data);

export const fetchCases = (params?: { status?: string; severity?: string }): Promise<Case[]> =>
  api.get('/cases', { params }).then(r => r.data);

export const fetchCase = (id: string): Promise<CaseWithDetails> =>
  api.get(`/cases/${id}`).then(r => r.data);

export const createCase = (data: Partial<Case>): Promise<Case> =>
  api.post('/cases', data).then(r => r.data);

export const updateCaseStatus = (id: string, to_status: string, actor: string, reason?: string): Promise<Case> =>
  api.patch(`/cases/${id}/status`, { to_status, actor, reason }).then(r => r.data);

export const recordDecision = (id: string, decision: string, actor: string, reason?: string): Promise<Case> =>
  api.post(`/cases/${id}/decision`, { decision, actor, reason }).then(r => r.data);

export const fetchEvidence = (caseId: string): Promise<Evidence[]> =>
  api.get(`/cases/${caseId}/evidence`).then(r => r.data);

export const addEvidence = (caseId: string, data: Partial<Evidence>): Promise<Evidence> =>
  api.post(`/cases/${caseId}/evidence`, data).then(r => r.data);

export const updateEvidence = (id: string, data: Partial<Evidence>): Promise<Evidence> =>
  api.patch(`/evidence/${id}`, data).then(r => r.data);
