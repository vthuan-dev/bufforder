import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StatCard } from "./StatCard";
import {
  Users,
  UserCheck,
  Clock,
  DollarSign,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from "../../services/api";

export function AdminDashboard() {
  const { t } = useTranslation(['adminDashboard', 'admin']);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel with individual error handling
      // This prevents one failed API from crashing the entire dashboard
      const results = await Promise.allSettled([
        api.adminGetDashboardStats(),
        api.adminGetWeeklyRevenue(),
        api.adminGetUserGrowth(),
        api.adminGetRecentUsers()
      ]);

      // Handle stats
      if (results[0].status === 'fulfilled' && results[0].value?.success) {
        setStats(results[0].value.data);
      } else {
        console.warn('Failed to load dashboard stats:', results[0].status === 'rejected' ? results[0].reason : 'API returned unsuccessful');
        // Set default stats to prevent null reference errors
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          pendingDeposits: 0,
          todayDeposits: 0,
          todayAmount: 0,
          todayCommission: 0,
          totalUsersTrend: 0,
          activeUsersTrend: 0,
          todayDepositsTrend: 0,
          todayAmountTrend: 0,
          todayCommissionTrend: 0
        });
      }

      // Handle revenue data
      if (results[1].status === 'fulfilled' && results[1].value?.success) {
        setRevenueData(results[1].value.data || []);
      } else {
        console.warn('Failed to load weekly revenue:', results[1].status === 'rejected' ? results[1].reason : 'API returned unsuccessful');
        setRevenueData([]);
      }

      // Handle user growth data
      if (results[2].status === 'fulfilled' && results[2].value?.success) {
        setUserGrowthData(results[2].value.data || []);
      } else {
        console.warn('Failed to load user growth:', results[2].status === 'rejected' ? results[2].reason : 'API returned unsuccessful');
        setUserGrowthData([]);
      }

      // Handle recent users
      if (results[3].status === 'fulfilled' && results[3].value?.success) {
        setRecentUsers(results[3].value.data || []);
      } else {
        console.warn('Failed to load recent users:', results[3].status === 'rejected' ? results[3].reason : 'API returned unsuccessful');
        setRecentUsers([]);
      }
    } catch (error) {
      console.error('Critical error loading dashboard data:', error);
      // Set all defaults to prevent crashes
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        pendingDeposits: 0,
        todayDeposits: 0,
        todayAmount: 0,
        todayCommission: 0,
        totalUsersTrend: 0,
        activeUsersTrend: 0,
        todayDepositsTrend: 0,
        todayAmountTrend: 0,
        todayCommissionTrend: 0
      });
      setRevenueData([]);
      setUserGrowthData([]);
      setRecentUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('adminDashboard:loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">{t('adminDashboard:title')}</h1>
          <p className="text-gray-600">{t('adminDashboard:subtitle')}</p>
        </div>
        {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          {t('adminDashboard:downloadReport')}
        </button> */}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t('adminDashboard:stats.totalUsers')}
          value={stats ? formatNumber(stats.totalUsers) : "0"}
          icon={Users}
          trend={stats ? { value: stats.totalUsersTrend, isPositive: stats.totalUsersTrend >= 0 } : undefined}
          color="blue"
        />
        <StatCard
          title={t('adminDashboard:stats.activeUsers')}
          value={stats ? formatNumber(stats.activeUsers) : "0"}
          icon={UserCheck}
          trend={stats ? { value: stats.activeUsersTrend, isPositive: stats.activeUsersTrend >= 0 } : undefined}
          color="green"
        />
        <StatCard
          title={t('adminDashboard:stats.pendingDeposits')}
          value={stats ? formatNumber(stats.pendingDeposits) : "0"}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title={t('adminDashboard:stats.todayDeposits')}
          value={stats ? formatNumber(stats.todayDeposits) : "0"}
          icon={ArrowUpRight}
          trend={stats ? { value: stats.todayDepositsTrend, isPositive: stats.todayDepositsTrend >= 0 } : undefined}
          color="green"
        />
        <StatCard
          title={t('adminDashboard:stats.todayAmount')}
          value={stats ? formatCurrency(stats.todayAmount) : "$0"}
          icon={DollarSign}
          trend={stats ? { value: stats.todayAmountTrend, isPositive: stats.todayAmountTrend >= 0 } : undefined}
          color="blue"
        />
        <StatCard
          title={t('adminDashboard:stats.todayCommission')}
          value={stats ? formatCurrency(stats.todayCommission) : "$0"}
          icon={Wallet}
          trend={stats ? { value: stats.todayCommissionTrend, isPositive: stats.todayCommissionTrend >= 0 } : undefined}
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 mb-1">{t('adminDashboard:charts.weeklyRevenue.title')}</h3>
              <p className="text-sm text-gray-600">{t('adminDashboard:charts.weeklyRevenue.subtitle')}</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData.length > 0 ? revenueData : []}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), t('adminDashboard:charts.weeklyRevenue.label')]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 mb-1">{t('adminDashboard:charts.userGrowth.title')}</h3>
              <p className="text-sm text-gray-600">{t('adminDashboard:charts.userGrowth.subtitle')}</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userGrowthData.length > 0 ? userGrowthData : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [formatNumber(Number(value)), t('adminDashboard:charts.userGrowth.label')]} />
              <Bar dataKey="users" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 mb-1">{t('adminDashboard:recentUsers.title')}</h3>
              <p className="text-sm text-gray-600">{t('adminDashboard:recentUsers.subtitle')}</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">{t('adminDashboard:recentUsers.viewAll')}</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminDashboard:recentUsers.table.user')}</TableHead>
                <TableHead>{t('adminDashboard:recentUsers.table.vipLevel')}</TableHead>
                <TableHead>{t('adminDashboard:recentUsers.table.status')}</TableHead>
                <TableHead>{t('adminDashboard:recentUsers.table.joinDate')}</TableHead>
                <TableHead className="text-right">{t('adminDashboard:recentUsers.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      >
                        {user.vip}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "Active" ? "default" : "secondary"}
                        className={
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">{t('adminDashboard:recentUsers.table.view')}</button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {t('adminDashboard:recentUsers.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
