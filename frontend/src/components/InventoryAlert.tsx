'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  TrendingDown, 
  Clock,
  RefreshCw,
  Bell,
  X,
  Eye
} from 'lucide-react';
import PermissionGuard from './PermissionGuard';

interface AlertItem {
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

interface InventoryAlertProps {
  showHeader?: boolean;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // 毫秒
  onAlertClick?: (alert: AlertItem) => void;
  className?: string;
}

const InventoryAlert: React.FC<InventoryAlertProps> = ({
  showHeader = true,
  maxItems = 10,
  autoRefresh = true,
  refreshInterval = 60000, // 默认1分钟刷新
  onAlertClick,
  className = '',
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

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
    } catch (err) {
      setError('网络错误');
      console.error('获取库存预警失败:', err);
    } finally {
      setLoading(false);
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

  const getStockPercentage = (current: number, min: number) => {
    if (min <= 0) return 100;
    return Math.min(100, (current / min) * 100);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const displayedAlerts = showAll ? alerts : alerts.slice(0, maxItems);
  const hasMoreAlerts = alerts.length > maxItems;

  return (
    <PermissionGuard permission="inventory:read" showMessage={false}>
      <div className={`bg-white rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                库存预警
              </h3>
              {alerts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  更新于 {formatDate(lastUpdated)}
                </span>
              )}
              <button
                onClick={fetchAlerts}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="刷新"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchAlerts}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                重试
              </button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">所有库存项都在正常范围内</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.itemId}
                  className={`border-l-4 pl-4 py-3 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(alert.priority)}`}
                  onClick={() => onAlertClick && onAlertClick(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        {getPriorityIcon(alert.priority)}
                        <h4 className="ml-2 text-sm font-medium text-gray-900 truncate">
                          {alert.name}
                        </h4>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          alert.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : alert.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.priority === 'HIGH' ? '高优先级' : 
                           alert.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>
                          当前库存: <span className="font-medium text-red-600">{alert.currentStock} {alert.unit}</span>
                          {' | '}
                          最小库存: <span className="font-medium">{alert.minStock} {alert.unit}</span>
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, getStockPercentage(alert.currentStock, alert.minStock))}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {getStockPercentage(alert.currentStock, alert.minStock).toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>类别: {alert.category}</span>
                          {alert.daysUntilReorder !== undefined && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {alert.daysUntilReorder}天后需要补货
                            </span>
                          )}
                        </div>
                        
                        {alert.supplier && (
                          <p className="text-gray-500">
                            供应商: {alert.supplier}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button className="ml-2 p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {hasMoreAlerts && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 border-t border-gray-200"
                >
                  查看更多预警 ({alerts.length - maxItems} 条)
                </button>
              )}
              
              {showAll && hasMoreAlerts && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 border-t border-gray-200"
                >
                  收起
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default InventoryAlert;