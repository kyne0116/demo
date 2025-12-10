'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  BarChart3,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';

interface ProductionStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageWaitTime: number;
  overdueRate: number;
  completionRate: number;
  hourlyData: Array<{
    hour: string;
    orders: number;
    completed: number;
    averageTime: number;
  }>;
  dailyData: Array<{
    date: string;
    orders: number;
    completed: number;
    averageTime: number;
  }>;
  stageData: Array<{
    stage: string;
    count: number;
    averageTime: number;
  }>;
  staffPerformance: Array<{
    staffId: string;
    ordersHandled: number;
    averageTime: number;
    completionRate: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ProductionStatsPage: React.FC = () => {
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 每分钟自动刷新
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/production/stats?days=${dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
      } else {
        setError('获取统计数据失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    if (!stats) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/production/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: dateRange,
          format: 'csv',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.content], { type: data.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('导出数据失败:', err);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <PermissionGuard permission="orders:read" showMessage={false}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载统计数据中...</span>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  if (error || !stats) {
    return (
      <PermissionGuard permission="orders:read" showMessage={false}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || '无法加载统计数据'}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              重试
            </button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="orders:read" showMessage={false}>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-7 w-7 mr-3 text-blue-600" />
                制作统计报表
              </h1>
              <p className="text-gray-600 mt-1">
                分析订单制作效率、时间和质量指标
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  更新于 {formatDate(lastUpdated)}
                </span>
              )}
              <button
                onClick={exportData}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </button>
              <button
                onClick={fetchStats}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                刷新
              </button>
            </div>
          </div>

          {/* 时间范围选择器 */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="90d">最近90天</option>
              </select>
            </div>
          </div>
        </div>

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">总订单数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-green-600 mt-1">
                  完成率 {stats.completionRate}%
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">平均等待时间</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(stats.averageWaitTime)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  目标: 15分钟以内
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">超时率</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueRate}%</p>
                <p className="text-sm text-red-600 mt-1">
                  {stats.overdueRate > 10 ? '需要关注' : '表现良好'}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">已完成订单</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                <p className="text-sm text-green-600 mt-1">
                  成功率 {((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">取消订单</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                <p className="text-sm text-red-600 mt-1">
                  取消率 {((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">制作效率</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  综合效率评分
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 每日订单趋势 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              每日订单趋势
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="总订单"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="已完成"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 制作阶段分析 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              制作阶段耗时分析
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}分钟`, '平均耗时']} />
                <Bar dataKey="averageTime" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 人员绩效分析 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            制作人员绩效分析
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    人员ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    处理订单数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平均耗时
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    完成率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    绩效评级
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.staffPerformance.map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {staff.staffId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.ordersHandled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(staff.averageTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.completionRate >= 95 ? 'bg-green-100 text-green-800' :
                        staff.completionRate >= 85 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {staff.completionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.completionRate >= 95 && staff.averageTime <= 10 ? 'bg-green-100 text-green-800' :
                        staff.completionRate >= 85 && staff.averageTime <= 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {staff.completionRate >= 95 && staff.averageTime <= 10 ? '优秀' :
                         staff.completionRate >= 85 && staff.averageTime <= 15 ? '良好' : '待改进'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 制作效率趋势 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            制作效率趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="averageTime" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="平均制作时间(分钟)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ProductionStatsPage;