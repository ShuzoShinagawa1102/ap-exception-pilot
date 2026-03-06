import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}

const COLOR_STYLES = {
  blue: 'border-l-blue-500',
  red: 'border-l-red-500',
  green: 'border-l-green-500',
  yellow: 'border-l-yellow-500',
  purple: 'border-l-purple-500',
};

export const KpiCard: React.FC<Props> = ({ title, value, subtitle, color = 'blue' }) => (
  <div className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${COLOR_STYLES[color]}`}>
    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
    <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
  </div>
);
