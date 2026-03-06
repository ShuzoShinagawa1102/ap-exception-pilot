import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Evidence } from '../types';
import { format } from 'date-fns';

const STATUS_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  submitted: <CheckCircleIcon className="h-5 w-5 text-blue-500" />,
  pending: <ClockIcon className="h-5 w-5 text-yellow-400" />,
  rejected: <XCircleIcon className="h-5 w-5 text-red-500" />,
  expired: <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />,
};

const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved',
  submitted: 'Submitted',
  pending: 'Pending',
  rejected: 'Rejected',
  expired: 'Expired',
};

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  po: 'Purchase Order',
  grn: 'Goods Receipt',
  tax: 'Tax Document',
  contract: 'Contract',
  approval: 'Approval',
  other: 'Other',
};

interface Props {
  evidence: Evidence;
  onUpdateStatus?: (id: string, status: string) => void;
}

export const EvidenceRow: React.FC<Props> = ({ evidence, onUpdateStatus }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-4 py-3 text-sm font-medium text-gray-900">{evidence.requirement_name}</td>
    <td className="px-4 py-3 text-sm text-gray-500">{TYPE_LABELS[evidence.requirement_type] ?? evidence.requirement_type}</td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-1.5">
        {STATUS_ICON[evidence.status]}
        <span className="text-sm text-gray-700">{STATUS_LABEL[evidence.status] ?? evidence.status}</span>
      </div>
    </td>
    <td className="px-4 py-3 text-sm text-gray-500">
      {evidence.submitted_at ? format(new Date(evidence.submitted_at), 'MMM d, yyyy') : '—'}
    </td>
    <td className="px-4 py-3 text-sm text-gray-500">{evidence.notes ?? '—'}</td>
    {onUpdateStatus && (
      <td className="px-4 py-3">
        {evidence.status === 'pending' && (
          <button
            onClick={() => onUpdateStatus(evidence.id, 'submitted')}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
          >
            Mark Submitted
          </button>
        )}
      </td>
    )}
  </tr>
);
