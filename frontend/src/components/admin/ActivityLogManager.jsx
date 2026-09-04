import React, { useState, useEffect } from 'react';
import { Clock, Shield, Search, Filter, User } from 'lucide-react';
import { activityLogService } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const ActivityLogManager = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState('all');
  const [entity, setEntity] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await activityLogService.getLogs({
        actionType: actionType !== 'all' ? actionType : undefined,
        entity: entity !== 'all' ? entity : undefined,
        search,
        limit: 100,
      });
      if (res.data?.logs) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionType, entity, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-festival-card border border-festival-border p-6 rounded-3xl">
        <h2 className="text-xl font-bold text-white">Administrator Audit Logs</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Detailed trail of all product additions, price updates, inventory adjustments, order status changes, and settings modifications
        </p>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search details or admin name..."
            className="w-full bg-festival-card border border-festival-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full bg-festival-card border border-festival-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Action Types</option>
            <option value="Product Created">Product Created</option>
            <option value="Product Updated">Product Updated</option>
            <option value="Product Deleted">Product Deleted</option>
            <option value="Price Changed">Price Changed</option>
            <option value="Inventory Adjusted">Inventory Adjusted</option>
            <option value="Order Status Updated">Order Status Updated</option>
            <option value="Banner Updated">Banner Updated</option>
            <option value="Settings Updated">Settings Updated</option>
          </select>
        </div>

        <div>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full bg-festival-card border border-festival-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Entities</option>
            <option value="Product">Product</option>
            <option value="Order">Order</option>
            <option value="Inventory">Inventory</option>
            <option value="Banner">Banner</option>
            <option value="Pincode">Pincode</option>
            <option value="Setting">Setting</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner text="Fetching audit trail..." />
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No activity logs match your filter criteria.
        </div>
      ) : (
        <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-festival-dark/80 text-slate-400 uppercase font-bold border-b border-festival-border">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin User</th>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Action Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {formatDate(log.createdAt, true)}
                    </td>
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      {log.adminUser?.name || 'Administrator'}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[10px] uppercase whitespace-nowrap">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{log.entity}</td>
                    <td className="p-4 text-slate-200">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogManager;
