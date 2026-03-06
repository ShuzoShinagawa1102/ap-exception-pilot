import React from 'react';
import { Severity } from '../types';

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-400 text-gray-900',
  low: 'bg-green-500 text-white',
};

interface Props {
  severity: Severity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase ${sizeClass} ${SEVERITY_STYLES[severity] ?? 'bg-gray-100 text-gray-700'}`}>
      {severity}
    </span>
  );
};
