import React, { useState } from 'react';
import { FileText, Search, Clock, Users, Eye, ArrowUpDown } from 'lucide-react';
import { PageStat } from '../../types';

interface PagesTabProps {
  pages: PageStat[];
}

export const PagesTab: React.FC<PagesTabProps> = ({ pages }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'views' | 'uniqueVisitors' | 'avgTime'>('views');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleSort = (field: 'views' | 'uniqueVisitors' | 'avgTime') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredPages = pages
    .filter(p => p.path.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortOrder === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mul;
    });

  const totalViews = pages.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="space-y-6">
      {/* Header with Search and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Pages Performance</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Breakdown of visits, unique visitors, and attention duration per URL
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search paths or titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Pages Data Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-neutral-800 bg-neutral-950/60 font-semibold uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="py-3.5 px-5">Page URL & Title</th>
              <th
                onClick={() => handleSort('views')}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Views</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('uniqueVisitors')}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Unique Visitors</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('avgTime')}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Avg Time</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-5 text-right">Traffic Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {filteredPages.map((page, idx) => {
              const share = totalViews > 0 ? Math.round((page.views / totalViews) * 100) : 0;
              return (
                <tr key={idx} className="hover:bg-neutral-800/40 transition">
                  <td className="py-3 px-5 max-w-sm">
                    <div className="font-mono font-medium text-white truncate">{page.path}</div>
                    <div className="text-[11px] text-neutral-500 truncate">{page.title || 'Untitled Page'}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-white">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-neutral-400 font-mono">
                    {page.uniqueVisitors.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">
                    {formatDuration(page.avgTime)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, Math.max(2, share))}%` }}
                        />
                      </div>
                      <span className="font-mono text-neutral-400 w-8 text-right">{share}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPages.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-neutral-500">
                  No pages matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
