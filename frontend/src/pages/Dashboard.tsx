import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard, fetchCases } from '../api';
import { DashboardStats, Case } from '../types';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchCases()])
      .then(([s, c]) => { setStats(s); setRecentCases(c.slice(0, 6)); })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="text-red-600 p-8">{error}</div>;
  if (!stats) return null;

  const openCases = Object.entries(stats.by_status)
    .filter(([s]) => !['Closed', 'Approved', 'Rejected'].includes(s))
    .reduce((a, [, v]) => a + v, 0);

  const exceptionCount = (stats.by_status['Exception'] ?? 0);
  const criticalCount = stats.by_severity['critical'] ?? 0;
  const maxBucket = Math.max(...stats.aging_buckets.map(b => b.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AP Exceptions Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Cases" value={stats.total_cases} color="blue" />
        <KpiCard title="Open Cases" value={openCases} color="purple" />
        <KpiCard title="Exceptions" value={exceptionCount} subtitle="Require escalation" color="red" />
        <KpiCard title="Critical" value={criticalCount} subtitle="High priority" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Aging Chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 col-span-2">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Case Aging (Open Cases)</h2>
          <div className="space-y-3">
            {stats.aging_buckets.map(bucket => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">{bucket.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-6 rounded-full flex items-center justify-end pr-2 transition-all ${
                      bucket.days_range === '30+' ? 'bg-red-500' :
                      bucket.days_range === '15-30' ? 'bg-orange-400' :
                      bucket.days_range === '8-14' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.max((bucket.count / maxBucket) * 100, bucket.count > 0 ? 8 : 0)}%` }}
                  >
                    {bucket.count > 0 && <span className="text-xs font-semibold text-white">{bucket.count}</span>}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-6 text-right">{bucket.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">By Status</h2>
          <div className="space-y-2">
            {Object.entries(stats.by_status).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <StatusBadge status={status as never} size="sm" />
                <span className="text-sm font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">Recent Cases</h2>
          <Link to="/cases" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentCases.map(c => (
            <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">{c.id}</span>
                  <SeverityBadge severity={c.severity} size="sm" />
                </div>
                <p className="text-sm text-gray-600 truncate mt-0.5">{c.vendor_name} · {c.invoice_id}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">${c.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{format(new Date(c.created_at), 'MMM d')}</p>
              </div>
              <StatusBadge status={c.status} size="sm" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
