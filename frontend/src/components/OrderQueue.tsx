'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Package,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import OrderProgress, { ProductionStage, OrderStatus, OrderPriority } from './OrderProgress';
import PermissionGuard from './PermissionGuard';

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  totalItems: number;
  status: OrderStatus;
  productionStage: ProductionStage;
  priority: OrderPriority;
  assignedTo?: string;
  estimatedWaitTime: number;
  actualWaitTime: number;
  waitTimeInMinutes: number;
  isOverdue: boolean;
  productionProgress: number;
  createdAt: string;
  makingStartedAt?: string;
  makingCompletedAt?: string;
  readyAt?: string;
  completedAt?: string;
  pickupTime?: string;
  notes?: string;
  qualityNotes?: string;
  orderItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

interface OrderQueueData {
  pending: Order[];
  making: Order[];
  ready: Order[];
  overdue: Order[];
}

interface OrderQueueProps {
  staffId?: string;
  showAllQueues?: boolean;
  autoRefresh?: boolean;
  onOrderSelect?: (order: Order) => void;
  className?: string;
}

const OrderQueue: React.FC<OrderQueueProps> = ({
  staffId,
  showAllQueues = true,
  autoRefresh = true,
  onOrderSelect,
  className = '',
}) => {
  const [queueData, setQueueData] = useState<OrderQueueData>({
    pending: [],
    making: [],
    ready: [],
    overdue: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'making' | 'ready' | 'overdue'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQueueData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueueData, 30000); // 每30秒刷新
      return () => clearInterval(interval);
    }
  }, [staffId]);

  const fetchQueueData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const endpoint = staffId 
        ? `/api/orders/production/staff/${staffId}/queue`
        : '/api/orders/production/queue';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQueueData(data);
      } else {
        setError('获取订单队列失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('获取订单队列失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/production/${orderId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffId: staffId || 'current-staff' }),
      });

      if (response.ok) {
        await fetchQueueData(); // 刷新数据
      }
    } catch (err) {
      console.error('开始制作失败:', err);
    }
  };

  const handleUpdateStage = async (orderId: string, stage: ProductionStage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/production/${orderId}/stage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage }),
      });

      if (response.ok) {
        await fetchQueueData(); // 刷新数据
      }
    } catch (err) {
      console.error('更新制作阶段失败:', err);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/production/${orderId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchQueueData(); // 刷新数据
      }
    } catch (err) {
      console.error('完成订单失败:', err);
    }
  };

  const handleBatchStart = async () => {
    if (selectedOrders.size === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/production/batch/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          staffId: staffId || 'current-staff',
        }),
      });

      if (response.ok) {
        setSelectedOrders(new Set());
        await fetchQueueData(); // 刷新数据
      }
    } catch (err) {
      console.error('批量开始制作失败:', err);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const filterOrders = (orders: Order[]) => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderItems.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  };

  const getCurrentOrders = () => {
    const orders = queueData[activeTab] || [];
    return filterOrders(orders);
  };

  const getTotalOrders = () => {
    return Object.values(queueData).reduce((total, orders) => total + orders.length, 0);
  };

  const getPriorityColor = (priority: OrderPriority) => {
    switch (priority) {
      case OrderPriority.URGENT:
        return 'text-yellow-600 bg-yellow-100';
      case OrderPriority.RUSH:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载订单队列中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchQueueData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const currentOrders = getCurrentOrders();

  return (
    <PermissionGuard permission="orders:read" showMessage={false}>
      <div className={`space-y-6 ${className}`}>
        {/* 队列概览 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                订单队列 {staffId && `- ${staffId}`}
              </h2>
              <p className="text-gray-600 mt-1">
                总计 {getTotalOrders()} 个订单
              </p>
            </div>
            <button
              onClick={fetchQueueData}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </button>
          </div>

          {/* 队列统计 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">待确认</p>
                  <p className="text-2xl font-bold text-gray-900">{queueData.pending.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">制作中</p>
                  <p className="text-2xl font-bold text-blue-900">{queueData.making.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">待取餐</p>
                  <p className="text-2xl font-bold text-green-900">{queueData.ready.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">超时</p>
                  <p className="text-2xl font-bold text-red-900">{queueData.overdue.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 搜索和过滤 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号、客户或商品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">所有优先级</option>
                <option value="normal">普通</option>
                <option value="urgent">紧急</option>
                <option value="rush">加急</option>
              </select>
            </div>

            {activeTab === 'pending' && selectedOrders.size > 0 && (
              <button
                onClick={handleBatchStart}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                批量开始 ({selectedOrders.size})
              </button>
            )}
          </div>

          {/* 标签页 */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'pending', label: '待确认', count: queueData.pending.length },
              { key: 'making', label: '制作中', count: queueData.making.length },
              { key: 'ready', label: '待取餐', count: queueData.ready.length },
              { key: 'overdue', label: '超时', count: queueData.overdue.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        <div className="space-y-4">
          {currentOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无{activeTab === 'pending' ? '待确认' : activeTab === 'making' ? '制作中' : activeTab === 'ready' ? '待取餐' : '超时'}订单</p>
            </div>
          ) : (
            currentOrders.map((order) => (
              <div key={order.id} className="relative">
                {activeTab === 'pending' && (
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className={activeTab === 'pending' ? 'ml-8' : ''}>
                  <OrderProgress
                    order={order}
                    onStartProduction={() => handleStartProduction(order.id)}
                    onUpdateStage={(stage) => handleUpdateStage(order.id, stage)}
                    onCompleteOrder={() => handleCompleteOrder(order.id)}
                    canEdit={true}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default OrderQueue;