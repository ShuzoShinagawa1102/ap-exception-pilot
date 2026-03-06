import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCase, updateCaseStatus, updateEvidence } from '../api';
import { CaseWithDetails, CaseStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { EvidenceRow } from '../components/EvidenceRow';
import { AuditEntry } from '../components/AuditEntry';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
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

const TRANSITION_BUTTON_STYLES: Partial<Record<CaseStatus, string>> = {
  Approved: 'bg-green-600 hover:bg-green-700 text-white',
  Rejected: 'bg-red-600 hover:bg-red-700 text-white',
  Closed: 'bg-gray-600 hover:bg-gray-700 text-white',
  Exception: 'bg-orange-600 hover:bg-orange-700 text-white',
  InReview: 'bg-purple-600 hover:bg-purple-700 text-white',
  WaitingForEvidence: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  IntakeValidated: 'bg-blue-600 hover:bg-blue-700 text-white',
  Reopened: 'bg-orange-500 hover:bg-orange-600 text-white',
};

const RISK_BADGE: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const RECOMMENDATION_ICON: Record<string, React.ReactNode> = {
  gather_evidence: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
  approve: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  reject: <XCircleIcon className="h-5 w-5 text-red-500" />,
  escalate: <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />,
  review: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
};

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  three_way_match: '3-Way Match Mismatch',
  missing_grn: 'Missing GRN',
  tax_code_mismatch: 'Tax Code Mismatch',
  duplicate_invoice: 'Duplicate Invoice',
  vendor_master_issue: 'Vendor Master Issue',
  over_budget: 'Over Budget',
  missing_po: 'Missing PO',
  approval_routing: 'Approval Routing',
  payment_hold: 'Payment Hold',
};

type TabId = 'evidence' | 'decision' | 'audit';

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('evidence');
  const [transitioning, setTransitioning] = useState(false);

  const loadCase = () => {
    if (!id) return;
    fetchCase(id)
      .then(setCaseData)
      .catch(() => setError('Failed to load case details.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCase(); }, [id]);

  const handleTransition = async (toStatus: CaseStatus) => {
    if (!caseData) return;
    const reason = toStatus === 'Approved' || toStatus === 'Rejected'
      ? window.prompt(`Reason for ${toStatus}:`) ?? undefined
      : undefined;
    setTransitioning(true);
    try {
      await updateCaseStatus(caseData.id, toStatus, 'current.user@company.com', reason);
      loadCase();
    } catch {
      alert('Failed to update status.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleEvidenceUpdate = async (evidenceId: string, status: string) => {
    try {
      await updateEvidence(evidenceId, { status: status as never });
      loadCase();
    } catch {
      alert('Failed to update evidence.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading case...</div>;
  if (error) return <div className="text-red-600 p-8">{error}</div>;
  if (!caseData) return null;

  const transitions = VALID_TRANSITIONS[caseData.status] ?? [];
  const isDueOverdue = new Date(caseData.due_date) < new Date() && caseData.status !== 'Closed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{caseData.id}</h1>
              <StatusBadge status={caseData.status} />
              <SeverityBadge severity={caseData.severity} />
            </div>
            <p className="mt-1 text-gray-600">{caseData.vendor_name} · <span className="font-mono text-sm">{caseData.invoice_id}</span></p>
            <p className="mt-2 text-sm text-gray-500">{EXCEPTION_TYPE_LABELS[caseData.exception_type] ?? caseData.exception_type}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${caseData.amount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{caseData.currency}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Assigned To</p>
            <p className="font-medium text-gray-800">{caseData.assigned_to.split('@')[0]}</p>
          </div>
          <div>
            <p className="text-gray-400">Due Date</p>
            <p className={`font-medium ${isDueOverdue ? 'text-red-600' : 'text-gray-800'}`}>
              {format(new Date(caseData.due_date), 'MMM d, yyyy')}
              {isDueOverdue && ' ⚠ Overdue'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Invoice Date</p>
            <p className="font-medium text-gray-800">{format(new Date(caseData.invoice_date), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-gray-400">Created</p>
            <p className="font-medium text-gray-800">{format(new Date(caseData.created_at), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-md p-3">{caseData.description}</p>

        {/* Transition Buttons */}
        {transitions.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-sm text-gray-500 self-center">Actions:</span>
            {transitions.map(t => (
              <button
                key={t}
                onClick={() => handleTransition(t)}
                disabled={transitioning}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${TRANSITION_BUTTON_STYLES[t] ?? 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                → {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(['evidence', 'decision', 'audit'] as TabId[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'decision' ? 'Decision Support' : tab === 'audit' ? 'Audit Trail' : 'Evidence'}
          </button>
        ))}
      </div>

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Evidence Checklist</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {caseData.evidence.filter(e => e.status === 'submitted' || e.status === 'approved').length} of {caseData.evidence.length} items submitted
            </p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Requirement</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {caseData.evidence.map(e => (
                <EvidenceRow key={e.id} evidence={e} onUpdateStatus={handleEvidenceUpdate} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Support Tab */}
      {activeTab === 'decision' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              {RECOMMENDATION_ICON[caseData.recommendation.action]}
              <h2 className="text-base font-semibold text-gray-800">Recommendation</h2>
              <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${RISK_BADGE[caseData.recommendation.risk_level]}`}>
                {caseData.recommendation.risk_level.toUpperCase()} RISK
              </span>
            </div>

            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Recommended Action</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {caseData.recommendation.action.replace('_', ' ')}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Reasoning</p>
              <ul className="space-y-1.5">
                {caseData.recommendation.reasoning.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {caseData.recommendation.missing_requirements.length > 0 && (
              <div className="border border-yellow-200 bg-yellow-50 rounded-md p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Missing Requirements</p>
                <ul className="space-y-1">
                  {caseData.recommendation.missing_requirements.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-yellow-700">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Audit Trail</h2>
          {caseData.audit_trail.length === 0 ? (
            <p className="text-sm text-gray-400">No audit entries yet.</p>
          ) : (
            <div>
              {caseData.audit_trail.map(entry => (
                <AuditEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
