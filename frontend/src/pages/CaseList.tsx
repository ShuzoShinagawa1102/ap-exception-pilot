import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCases } from '../api';
import { Case, CaseStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { format } from 'date-fns';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const FILTER_TABS: { label: string; status?: CaseStatus }[] = [
  { label: 'All' },
  { label: 'Exception', status: 'Exception' },
  { label: 'In Review', status: 'InReview' },
  { label: 'Waiting Evidence', status: 'WaitingForEvidence' },
  { label: 'Closed', status: 'Closed' },
];

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  three_way_match: '3-Way Match',
  missing_grn: 'Missing GRN',
  tax_code_mismatch: 'Tax Code Mismatch',
  duplicate_invoice: 'Duplicate Invoice',
  vendor_master_issue: 'Vendor Master Issue',
  over_budget: 'Over Budget',
  missing_po: 'Missing PO',
  approval_routing: 'Approval Routing',
  payment_hold: 'Payment Hold',
};

export const CaseList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CaseStatus | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    fetchCases(activeTab ? { status: activeTab } : undefined)
      .then(setCases)
      .catch(() => setError('Failed to load cases.'))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const filtered = cases.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.id.toLowerCase().includes(q) ||
      c.vendor_name.toLowerCase().includes(q) ||
      c.invoice_id.toLowerCase().includes(q);
  });

  const isDueOverdue = (due: string) => new Date(due) < new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exception Cases</h1>
        <Link
          to="/cases/new"
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#152d4a] transition-colors"
        >
          + New Case
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by case ID, vendor, or invoice..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.status)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.status
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-gray-500 py-16">Loading cases...</div>}
      {error && <div className="text-red-600 py-8">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16">No cases found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/cases/${c.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                        {c.id}
                      </Link>
                      <p className="text-xs text-gray-400">{c.invoice_id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{c.vendor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{EXCEPTION_TYPE_LABELS[c.exception_type] ?? c.exception_type}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">${c.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} size="sm" /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={c.severity} size="sm" /></td>
                    <td className={`px-4 py-3 text-sm ${isDueOverdue(c.due_date) && c.status !== 'Closed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {format(new Date(c.due_date), 'MMM d, yyyy')}
                      {isDueOverdue(c.due_date) && c.status !== 'Closed' && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.assigned_to.split('@')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
