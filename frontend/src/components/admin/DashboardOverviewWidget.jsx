import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const DashboardOverviewWidget = ({ data, onNavigateTab }) => {
  if (!data) return null;

  const { summary, dailyTrends, recentOrders, bestSellingProducts, recentLogs } = data;

  const statCards = [
    {
      title: 'Total Revenue (COD Confirmed)',
      value: formatCurrency(summary?.totalRevenue || 0),
      subtitle: `Today: ${formatCurrency(summary?.todayRevenue || 0)}`,
      icon: TrendingUp,
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-400',
    },
    {
      title: 'Total Orders',
      value: summary?.totalOrders || 0,
      subtitle: `Today: ${summary?.todayOrders || 0} new order(s)`,
      icon: ShoppingBag,
      color: 'from-red-600 to-orange-600',
      textColor: 'text-red-400',
      tab: 'orders',
    },
    {
      title: 'Pending Dispatch',
      value: summary?.pendingOrders || 0,
      subtitle: `${summary?.confirmedOrders || 0} Confirmed / In Packing`,
      icon: Clock,
      color: 'from-orange-500 to-amber-600',
      textColor: 'text-orange-400',
      tab: 'orders',
    },
    {
      title: 'Delivered Orders',
      value: summary?.deliveredOrders || 0,
      subtitle: `${summary?.shippedOrders || 0} currently in transit`,
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-400',
      tab: 'orders',
    },
    {
      title: 'Active Products',
      value: summary?.totalProducts || 0,
      subtitle: 'In Sivakasi catalog',
      icon: Package,
      color: 'from-purple-600 to-indigo-600',
      textColor: 'text-purple-400',
      tab: 'products',
    },
    {
      title: 'Low Stock Alerts',
      value: summary?.lowStockCount || 0,
      subtitle: `${summary?.outOfStockCount || 0} completely out of stock`,
      icon: AlertTriangle,
      color: 'from-rose-600 to-pink-600',
      textColor: 'text-rose-400',
      tab: 'inventory',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 6 Core Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.tab && onNavigateTab(card.tab)}
              className={`p-5 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/40 shadow-xl transition-all ${
                card.tab ? 'cursor-pointer hover:-translate-y-1' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                  <div className={`text-2xl sm:text-3xl font-black ${card.textColor}`}>{card.value}</div>
                  <p className="text-xs text-slate-400">{card.subtitle}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-slate-950 shadow-lg flex-shrink-0`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Widget */}
        <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-festival-border">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Recent Customer Orders</span>
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="p-3.5 rounded-xl bg-festival-dark/80 border border-festival-border/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{order.orderId}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-950 text-emerald-300'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">
                      {order.customerDetails?.name} ({order.customerDetails?.city}) • {order.items?.length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white text-sm block">{formatCurrency(order.totalAmount)}</span>
                    <span className="text-[10px] text-slate-500">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No orders placed yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-festival-border">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Low / Out of Stock Crackers</span>
            </h3>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              Manage Inventory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary?.lowStockCount === 0 && summary?.outOfStockCount === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>All Sivakasi cracker items have healthy inventory stock!</span>
              </div>
            ) : (
              bestSellingProducts?.map((prod) => (
                <div
                  key={prod._id}
                  className="p-3.5 rounded-xl bg-festival-dark/80 border border-festival-border/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-400">{prod.category?.name || 'Crackers'} • ₹{prod.price}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-black text-xs px-2.5 py-1 rounded-full ${
                        prod.stockQuantity <= 0
                          ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                          : prod.stockQuantity <= 10
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {prod.stockQuantity <= 0 ? '0 Stock (Out)' : `${prod.stockQuantity} in stock`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid: Best Sellers & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Best Sellers */}
        <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-festival-border">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Top Selling Fireworks</span>
            </h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              Sales Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {bestSellingProducts?.map((item, idx) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 rounded-xl bg-festival-dark/80 border border-festival-border/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-white">{item.name}</h4>
                    <p className="text-[10px] text-slate-400">{formatCurrency(item.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-400">{item.totalSold || 0} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Logs Widget */}
        <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-festival-border">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent Activity Logs</span>
            </h3>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-festival-dark/80 border border-festival-border/50 text-xs space-y-1"
                >
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-amber-300">{log.actionType}</span>
                    <span className="text-[10px] text-slate-500">{formatDate(log.createdAt, true)}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{log.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewWidget;
