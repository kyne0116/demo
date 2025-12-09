'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Search,
  Filter,
  Eye,
  Check,
  X,
  RefreshCw,
  Settings,
  Package,
  TrendingDown,
} from 'lucide-react';
import PermissionGuard from '../components/PermissionGuard';
import InventoryAlert from '../components/InventoryAlert';

interface AlertItem {
  id: number;
  itemId: number;
  itemName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier?: string;
  daysUntilReorder?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  alertType: 'LOW_STOCK' | 'OVERSTOCK' | 'EXPIRY' | 'REORDER';
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

interface AlertStatistics {
  total: number;
  high: number;
  medium: number;
  low: number;
  lowStock: number;
  overstock: number;
  expiry: number;
  reorder: number;
}

const InventoryAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<number>>(new Set());
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // 每分钟自动刷新
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        setLastUpdated(new Date());
      } else {
        setError('获取库存预警失败');
      }

      // 获取统计数据
      const statsResponse = await fetch('/api/inventory/alerts/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData);
      }
    } catch (err) {
      setError('网络错误');
      console.error('获取库存预警失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
      }
    } catch (err) {
      console.error('标记预警失败:', err);
    }
  };

  const acknowledgeSelectedAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/alerts/acknowledge-batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertIds: Array.from(selectedAlerts),
        }),
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          selectedAlerts.has(alert.id) ? { ...alert, acknowledged: true } : alert
        ));
        setSelectedAlerts(new Set());
        setShowAcknowledgeModal(false);
      }
    } catch (err) {
      console.error('批量标记预警失败:', err);
    }
  };

  const checkAlertsManually = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/alerts/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchAlerts(); // 重新获取数据
      }
    } catch (err) {
      console.error('手动检查预警失败:', err);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'LOW':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-50';
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'LOW':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'LOW_STOCK':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'OVERSTOCK':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'EXPIRY':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'REORDER':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'LOW_STOCK':
        return '低库存';
      case 'OVERSTOCK':
        return '超库存';
      case 'EXPIRY':
        return '过期';
      case 'REORDER':
        return '补货';
      default:
        return alertType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 过滤预警
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;
    const matchesType = typeFilter === 'all' || alert.alertType === typeFilter;

    return matchesSearch && matchesPriority && matchesCategory && matchesType;
  });

  // 未读的预警
  const unacknowledgedAlerts = filteredAlerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = filteredAlerts.filter(alert => alert.acknowledged);

  return (
    <PermissionGuard permission="inventory:read" showMessage={false}>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="h-7 w-7 mr-3 text-orange-600" />
                库存预警管理
              </h1>
              <p className="text-gray-600 mt-1">
                管理库存预警通知，及时处理库存问题
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  更新于 {lastUpdated.toLocaleTimeString('zh-CN')}
                </span>
              )}
              <button
                onClick={checkAlertsManually}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                手动检查
              </button>
              <button
                onClick={() => setShowAcknowledgeModal(true)}
                disabled={selectedAlerts.size === 0}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 mr-2" />
                标记已读 ({selectedAlerts.size})
              </button>
            </div>
          </div>
        </div>

        {/* 统计数据卡片 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">总预警数</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">高优先级</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.high}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">中优先级</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.medium}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">低库存预警</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.lowStock}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索商品名称、类别或消息..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 过滤器 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">所有优先级</option>
                  <option value="HIGH">高优先级</option>
                  <option value="MEDIUM">中优先级</option>
                  <option value="LOW">低优先级</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">所有类型</option>
                <option value="LOW_STOCK">低库存</option>
                <option value="OVERSTOCK">超库存</option>
                <option value="EXPIRY">过期</option>
                <option value="REORDER">补货</option>
              </select>
            </div>
          </div>
        </div>

        {/* 预警列表 */}
        <div className="space-y-6">
          {/* 未读预警 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                未读预警 ({unacknowledgedAlerts.length})
              </h3>
            </div>
            <div className="p-6">
              {unacknowledgedAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">暂无未读预警</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unacknowledgedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-l-4 pl-6 py-4 rounded-r-lg ${getPriorityColor(alert.priority)} ${
                        selectedAlerts.has(alert.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedAlerts.has(alert.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedAlerts);
                              if (e.target.checked) {
                                newSelected.add(alert.id);
                              } else {
                                newSelected.delete(alert.id);
                              }
                              setSelectedAlerts(newSelected);
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              {getPriorityIcon(alert.priority)}
                              <h4 className="ml-2 text-lg font-medium text-gray-900">
                                {alert.itemName}
                              </h4>
                              <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                alert.priority === 'HIGH'
                                  ? 'bg-red-100 text-red-800'
                                  : alert.priority === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {alert.priority === 'HIGH' ? '高优先级' : 
                                 alert.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                              </span>
                              <div className="ml-2 flex items-center">
                                {getAlertTypeIcon(alert.alertType)}
                                <span className="ml-1 text-xs text-gray-600">
                                  {getAlertTypeLabel(alert.alertType)}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{alert.message}</p>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">类别:</span> {alert.category}
                              </div>
                              <div>
                                <span className="font-medium">当前库存:</span> {alert.currentStock} {alert.unit}
                              </div>
                              <div>
                                <span className="font-medium">最小库存:</span> {alert.minStock} {alert.unit}
                              </div>
                              {alert.daysUntilReorder !== undefined && (
                                <div>
                                  <span className="font-medium">预计补货:</span> {alert.daysUntilReorder} 天后
                                </div>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              创建时间: {formatDate(alert.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                            title="标记为已读"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 已读预警 */}
          {acknowledgedAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  已读预警 ({acknowledgedAlerts.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {acknowledgedAlerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-75"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center">
                          {getPriorityIcon(alert.priority)}
                          <span className="ml-2 font-medium text-gray-700">{alert.itemName}</span>
                          <span className="ml-2 text-sm text-gray-500">({getAlertTypeLabel(alert.alertType)})</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(alert.createdAt)}
                      </div>
                    </div>
                  ))}
                  {acknowledgedAlerts.length > 10 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      还有 {acknowledgedAlerts.length - 10} 条已读预警...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 批量标记确认模态框 */}
        {showAcknowledgeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                确认标记已读
              </h3>
              <p className="text-gray-600 mb-6">
                您确定要将选中的 {selectedAlerts.size} 条预警标记为已读吗？
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAcknowledgeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={acknowledgeSelectedAlerts}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  确认标记
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default InventoryAlertsPage;