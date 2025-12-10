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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';
import PermissionGuard from './PermissionGuard';

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  overStockItems: number;
  averageTurnover: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  stockTrends: Array<{
    date: string;
    totalValue: number;
    lowStockCount: number;
    turnoverRate: number;
  }>;
  topMovingItems: Array<{
    id: number;
    name: string;
    category: string;
    currentStock: number;
    minStock: number;
    turnoverRate: number;
  }>;
  reorderRecommendations: Array<{
    id: number;
    name: string;
    category: string;
    currentStock: number;
    suggestedOrder: number;
    estimatedCost: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'
];

const InventoryMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // 每分钟自动刷新
    return () => clearInterval(interval);
  }, [selectedCategory, dateRange]);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        category: selectedCategory,
        range: dateRange,
      });

      const response = await fetch(`/api/inventory/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      } else {
        setError('获取库存数据失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('获取库存指标失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    if (!metrics) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategory,
          range: dateRange,
          format: 'csv',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `inventory-metrics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('导出数据失败:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <PermissionGuard permission="inventory:read" showMessage={false}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载库存数据中...</span>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  if (error || !metrics) {
    return (
      <PermissionGuard permission="inventory:read" showMessage={false}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || '无法加载库存数据'}</p>
            <button
              onClick={fetchMetrics}
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
    <PermissionGuard permission="inventory:read" showMessage={false}>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-7 w-7 mr-3 text-blue-600" />
                库存监控仪表板
              </h1>
              <p className="text-gray-600 mt-1">
                实时监控库存状态、价值和趋势分析
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
                onClick={fetchMetrics}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">所有类别</option>
                <option value="TEA">茶叶</option>
                <option value="MILK">牛奶</option>
                <option value="TOPPING">配料</option>
                <option value="SYRUP">糖浆</option>
                <option value="FRUIT">水果</option>
                <option value="SPICE">香料</option>
                <option value="PACKAGING">包装</option>
                <option value="CLEANING">清洁用品</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
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

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">库存项总数</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">
                低库存: {metrics.lowStockItems} 项
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">库存总价值</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-red-600">
                超库存: {metrics.overStockItems} 项
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">平均周转率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(metrics.averageTurnover * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600">
                过去30天
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">需要补货</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.reorderRecommendations.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-orange-600">
                建议补货项目
              </span>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 库存价值趋势 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              库存价值趋势
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.stockTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '库存价值']} />
                <Line 
                  type="monotone" 
                  dataKey="totalValue" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 库存类别分布 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              库存类别分布
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.category} ${props.percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '价值']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 高周转率和补货建议 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 高周转率商品 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              高周转率商品
            </h3>
            <div className="space-y-3">
              {metrics.topMovingItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {item.currentStock}/{item.minStock} {item.unit}
                    </p>
                    <p className="text-xs text-green-600">
                      周转率 {(item.turnoverRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 补货建议 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              补货建议
            </h3>
            <div className="space-y-3">
              {metrics.reorderRecommendations.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority === 'HIGH' ? '高' : item.priority === 'MEDIUM' ? '中' : '低'}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      建议: {item.suggestedOrder} {metrics.topMovingItems[0]?.unit || '单位'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(item.estimatedCost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 详细表格 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              库存明细 ({metrics.totalItems} 项)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类别
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前库存
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最小库存
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    价值
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.categoryDistribution.slice(0, 10).map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.category} 系列商品
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.count} 项
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.count * 2} 项
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        正常
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default InventoryMonitor;