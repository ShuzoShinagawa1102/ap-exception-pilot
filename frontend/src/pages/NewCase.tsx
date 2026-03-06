import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../api';
import { ExceptionType, Severity } from '../types';

const EXCEPTION_TYPES = [
  { value: 'three_way_match', label: '3-Way Match Mismatch' },
  { value: 'missing_grn', label: 'Missing GRN' },
  { value: 'tax_code_mismatch', label: 'Tax Code Mismatch' },
  { value: 'duplicate_invoice', label: 'Duplicate Invoice' },
  { value: 'vendor_master_issue', label: 'Vendor Master Issue' },
  { value: 'over_budget', label: 'Over Budget' },
  { value: 'missing_po', label: 'Missing PO' },
  { value: 'approval_routing', label: 'Approval Routing Deviation' },
  { value: 'payment_hold', label: 'Payment Hold' },
];

export const NewCase: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    invoice_id: '',
    vendor_name: '',
    vendor_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'USD',
    exception_type: 'three_way_match',
    severity: 'medium',
    assigned_to: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    description: '',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createCase({
        ...form,
        exception_type: form.exception_type as ExceptionType,
        severity: form.severity as Severity,
        amount: parseFloat(form.amount),
        invoice_date: new Date(form.invoice_date).toISOString(),
        due_date: new Date(form.due_date).toISOString(),
      });
      navigate(`/cases/${created.id}`);
    } catch {
      setError('Failed to create case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Exception Case</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice ID *</label>
            <input required className={inputClass} value={form.invoice_id} onChange={e => set('invoice_id', e.target.value)} placeholder="INV-2024-0001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
            <input required className={inputClass} value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Acme Corp" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor ID</label>
            <input className={inputClass} value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)} placeholder="VND-0001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input type="date" className={inputClass} value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input required type="number" step="0.01" className={inputClass} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select className={inputClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exception Type *</label>
            <select required className={inputClass} value={form.exception_type} onChange={e => set('exception_type', e.target.value)}>
              {EXCEPTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select className={inputClass} value={form.severity} onChange={e => set('severity', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <input className={inputClass} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="email@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" className={inputClass} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} className={inputClass} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the exception..." />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-lg font-medium hover:bg-[#152d4a] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Case'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
