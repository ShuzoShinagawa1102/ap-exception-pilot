import React from 'react';
import { AuditTrail } from '../types';
import { format } from 'date-fns';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface Props {
  entry: AuditTrail;
}

export const AuditEntry: React.FC<Props> = ({ entry }) => (
  <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-2"></div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-900">{entry.action}</span>
        {entry.from_status && entry.to_status && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{entry.from_status}</span>
            <ArrowRightIcon className="h-3 w-3" />
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{entry.to_status}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-gray-500">{entry.actor}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-400">{format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}</span>
      </div>
      {entry.reason && <p className="mt-1 text-xs text-gray-600 italic">"{entry.reason}"</p>}
    </div>
  </div>
);
