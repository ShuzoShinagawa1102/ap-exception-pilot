import React from 'react';
import { CaseStatus } from '../types';

const STATUS_STYLES: Record<CaseStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  IntakeValidated: 'bg-blue-100 text-blue-700',
  WaitingForEvidence: 'bg-yellow-100 text-yellow-700',
  InReview: 'bg-purple-100 text-purple-700',
  Exception: 'bg-red-100 text-red-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-800',
  Closed: 'bg-gray-200 text-gray-600',
  Reopened: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  Draft: 'Draft',
  IntakeValidated: 'Intake Validated',
  WaitingForEvidence: 'Waiting For Evidence',
  InReview: 'In Review',
  Exception: 'Exception',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Closed: 'Closed',
  Reopened: 'Reopened',
};

interface Props {
  status: CaseStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};
