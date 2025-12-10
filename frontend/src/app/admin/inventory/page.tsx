'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Calendar,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  supplier?: string;
  description?: string;
  expirationDate?: string;
  storageLocation?: string;
  isActive: boolean;
}

interface LowStockAlert {
  itemId: number;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier?: string;
  daysUntilReorder?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface InventoryStatistics {
  totalItems: number;
  lowStockItems: number;
  overStockItems: number;
  expiringItems: number;
  totalValue: number;
  averageTurnover: number;
  categories: Record<string, {
    count: number;
    totalValue: number;
    lowStockCount: number;
  }>;
}

const InventoryManagementPage: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'alerts'>('inventory');

  const categories = [
    'TEA', 'MILK', 'TOPPING', 'SYRUP', 'FRUIT', 'SPICE', 'PACKAGING', 'CLEANING', 'OTHER'
  ];

  useEffect(() => {
    fetchInventoryItems();
    fetchLowStockAlerts();
    fetchStatistics();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (stockStatus) params.append('stockStatus', stockStatus);

      const response = await fetch(`/api/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.data || data);
      }
    } catch (error) {
      console.error(':', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLowStockAlerts(data);
      }
    } catch (error) {
      console.error('获取低库存警告失败:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('获取库存统计失败:', error);
    }
  };

  const handleSearch = () => {
    fetchInventoryItems();
  };

  const handleAdjustStock = async (adjustment: number, reason: string) => {
    if (!adjustingItem) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/${adjustingItem.id}/adjust`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          adjustment,
          reason,
          adjustedBy: 1, // 应该从用户上下文获取
        }),
      });

      if (response.ok) {
        await fetchInventoryItems();
        await fetchStatistics();
        setShowAdjustModal(false);
        setAdjustingItem(null);
      }
    } catch (error) {
      console.error('调整库存失败:', error);
    }
  };

  const getStockStatusBadge = (item: InventoryItem) => {
    if (!item.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          已停用
        </span>
      );
    }

    if (item.currentStock <= item.minStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          低库存
        </span>
      );
    }

    if (item.currentStock > item.maxStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          超库存
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        正常
      </span>
    );
  };

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    
    if (percentage <= 20) return { color: 'bg-red-500', level: '极低' };
    if (percentage <= 50) return { color: 'bg-yellow-500', level: '偏低' };
    if (percentage >= 120) return { color: 'bg-purple-500', level: '过高' };
    return { color: 'bg-green-500', level: '正常' };
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permission="inventory:read"
      showMessage={true}
    >
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">库存管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理库存项、监控库存状态和处理补货
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                fetchInventoryItems();
                fetchLowStockAlerts();
                fetchStatistics();
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </button>
            <PermissionGuard permission="inventory:write">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加库存项
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* 统计卡片 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">总库存项</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">低库存警告</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.lowStockItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">库存总值</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatPrice(statistics.totalValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">平均周转天数</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.averageTurnover.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 标签页 */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`${
                  activeTab === 'inventory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                库存列表 ({inventoryItems.length})
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                低库存警告 ({lowStockAlerts.length})
              </button>
            </nav>
          </div>

          {activeTab === 'inventory' && (
            <div className="p-6">
              {/* 搜索和筛选 */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="搜索库存项名称或供应商..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">所有类别</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:w-48">
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">所有状态</option>
                    <option value="LOW">低库存</option>
                    <option value="NORMAL">正常</option>
                    <option value="OVERSTOCK">超库存</option>
                  </select>
                </div>

                <button
                  onClick={handleSearch}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Search className="w-4 h-4 mr-2" />
                  搜索
                </button>
              </div>

              {/* 库存列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        库存项
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类别
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        当前库存
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        库存状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        成本价格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        供应商
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryItems.map((item) => {
                      const stockLevel = getStockLevel(item);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500">{item.description}</div>
                              )}
                              {item.storageLocation && (
                                <div className="text-xs text-gray-400">位置: {item.storageLocation}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.currentStock} {item.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              最小: {item.minStock} | 最大: {item.maxStock}
                            </div>
                            <div className="mt-1 w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${stockLevel.color}`}
                                style={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStockStatusBadge(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(item.costPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.supplier || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <PermissionGuard permission="inventory:write">
                              <button
                                onClick={() => {
                                  setAdjustingItem(item);
                                  setShowAdjustModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </PermissionGuard>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {inventoryItems.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">没有库存项</h3>
                  <p className="mt-1 text-sm text-gray-500">开始添加你的第一个库存项</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="p-6">
              <div className="space-y-4">
                {lowStockAlerts.map((alert) => (
                  <div
                    key={alert.itemId}
                    className="border border-red-200 bg-red-50 rounded-lg p-4"
                  >
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-800">
                          {alert.name}
                        </h3>
                        <div className="mt-1 text-sm text-red-700">
                          <p>
                            当前库存: {alert.currentStock} {alert.unit}
                            {' | '}
                            最小库存: {alert.minStock} {alert.unit}
                          </p>
                          <p>
                            类别: {alert.category}
                            {alert.supplier && ` | 供应商: ${alert.supplier}`}
                          </p>
                          {alert.daysUntilReorder !== undefined && (
                            <p>
                              预计 {alert.daysUntilReorder} 天后需要补货
                            </p>
                          )}
                        </div>
                        <div className="mt-3">
                          <PermissionGuard permission="inventory:write">
                            <button
                              onClick={() => {
                                setAdjustingItem({
                                  id: alert.itemId,
                                  name: alert.name,
                                  currentStock: alert.currentStock,
                                  minStock: alert.minStock,
                                  maxStock: alert.maxStock,
                                  unit: alert.unit,
                                  category: alert.category,
                                  costPrice: 0,
                                  isActive: true,
                                } as InventoryItem);
                                setShowAdjustModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                            >
                              立即补货
                            </button>
                          </PermissionGuard>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.priority === 'HIGH' 
                            ? 'bg-red-100 text-red-800'
                            : alert.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {alert.priority === 'HIGH' ? '高优先级' : alert.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {lowStockAlerts.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">没有低库存警告</h3>
                    <p className="mt-1 text-sm text-gray-500">所有库存项都在正常范围内</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 调整库存模态框 */}
        {showAdjustModal && adjustingItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                  调整库存 - {adjustingItem.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      当前库存: {adjustingItem.currentStock} {adjustingItem.unit}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      调整数量 (正数增加，负数减少)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入调整数量"
                      id="adjustment-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      调整原因
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入调整原因"
                      id="reason-input"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        const adjustmentInput = document.getElementById('adjustment-input') as HTMLInputElement;
                        const reasonInput = document.getElementById('reason-input') as HTMLInputElement;
                        const adjustment = parseFloat(adjustmentInput.value);
                        const reason = reasonInput.value;

                        if (adjustment && reason) {
                          handleAdjustStock(adjustment, reason);
                        }
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      确认调整
                    </button>
                    <button
                      onClick={() => {
                        setShowAdjustModal(false);
                        setAdjustingItem(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default InventoryManagementPage;