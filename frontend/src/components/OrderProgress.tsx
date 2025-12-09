'use client';

import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Phone,
  MapPin,
  Package,
  Timer,
} from 'lucide-react';

export enum ProductionStage {
  NOT_STARTED = 'not_started',
  PREPARING = 'preparing',
  MIXING = 'mixing',
  FINISHING = 'finishing',
  QUALITY_CHECK = 'quality_check',
  READY_FOR_PICKUP = 'ready_for_pickup',
}

export enum OrderStatus {
  PENDING = 'pending',
  MAKING = 'making',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
  RUSH = 'rush',
}

interface OrderProgressProps {
  order: {
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
  };
  onStartProduction?: () => void;
  onUpdateStage?: (stage: ProductionStage) => void;
  onCompleteOrder?: () => void;
  onAssignStaff?: (staffId: string) => void;
  canEdit?: boolean;
}

const OrderProgress: React.FC<OrderProgressProps> = ({
  order,
  onStartProduction,
  onUpdateStage,
  onCompleteOrder,
  onAssignStaff,
  canEdit = false,
}) => {
  const getStageInfo = (stage: ProductionStage) => {
    const stageMap = {
      [ProductionStage.NOT_STARTED]: { name: '未开始', color: 'text-gray-500', bg: 'bg-gray-100' },
      [ProductionStage.PREPARING]: { name: '准备中', color: 'text-blue-600', bg: 'bg-blue-100' },
      [ProductionStage.MIXING]: { name: '调制中', color: 'text-purple-600', bg: 'bg-purple-100' },
      [ProductionStage.FINISHING]: { name: '完成制作', color: 'text-orange-600', bg: 'bg-orange-100' },
      [ProductionStage.QUALITY_CHECK]: { name: '质检中', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      [ProductionStage.READY_FOR_PICKUP]: { name: '待取餐', color: 'text-green-600', bg: 'bg-green-100' },
    };
    return stageMap[stage] || stageMap[ProductionStage.NOT_STARTED];
  };

  const getStatusInfo = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.PENDING]: { name: '待确认', color: 'text-gray-600', bg: 'bg-gray-100' },
      [OrderStatus.MAKING]: { name: '制作中', color: 'text-blue-600', bg: 'bg-blue-100' },
      [OrderStatus.READY]: { name: '制作完成', color: 'text-green-600', bg: 'bg-green-100' },
      [OrderStatus.COMPLETED]: { name: '已完成', color: 'text-green-700', bg: 'bg-green-200' },
      [OrderStatus.CANCELLED]: { name: '已取消', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return statusMap[status] || statusMap[OrderStatus.PENDING];
  };

  const getPriorityInfo = (priority: OrderPriority) => {
    const priorityMap = {
      [OrderPriority.NORMAL]: { name: '普通', color: 'text-gray-600', bg: 'bg-gray-100' },
      [OrderPriority.URGENT]: { name: '紧急', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      [OrderPriority.RUSH]: { name: '加急', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return priorityMap[priority] || priorityMap[OrderPriority.NORMAL];
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getNextStage = (currentStage: ProductionStage): ProductionStage | null => {
    const stages = Object.values(ProductionStage);
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const stageInfo = getStageInfo(order.productionStage);
  const statusInfo = getStatusInfo(order.status);
  const priorityInfo = getPriorityInfo(order.priority);
  const nextStage = getNextStage(order.productionStage);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 订单头部信息 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                订单 #{order.orderNumber}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.name}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                {priorityInfo.name}
              </span>
              {order.isOverdue && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  已超时
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              {order.customerName && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {order.customerName}
                </div>
              )}
              {order.customerPhone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {order.customerPhone}
                </div>
              )}
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                {order.totalItems} 件商品
              </div>
              <div className="flex items-center">
                <Timer className="h-4 w-4 mr-2" />
                等待 {order.waitTimeInMinutes} 分钟
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          {canEdit && (
            <div className="flex items-center space-x-2">
              {order.status === OrderStatus.PENDING && (
                <button
                  onClick={onStartProduction}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  开始制作
                </button>
              )}
              {order.status === OrderStatus.MAKING && nextStage && (
                <button
                  onClick={() => onUpdateStage?.(nextStage)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  进入下一阶段
                </button>
              )}
              {order.status === OrderStatus.READY && (
                <button
                  onClick={onCompleteOrder}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  完成订单
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 制作进度 */}
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">制作进度</span>
            <span className="text-sm text-gray-500">
              {Math.round(order.productionProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${order.productionProgress}%` }}
            ></div>
          </div>
        </div>

        {/* 当前阶段 */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${stageInfo.bg}`}>
            <span className={`text-sm font-medium ${stageInfo.color}`}>
              {stageInfo.name === '准备中' ? 'P' : 
               stageInfo.name === '调制中' ? 'M' :
               stageInfo.name === '完成制作' ? 'F' :
               stageInfo.name === '质检中' ? 'Q' :
               stageInfo.name === '待取餐' ? 'R' : 'N'}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              当前阶段: {stageInfo.name}
            </div>
            {order.assignedTo && (
              <div className="text-xs text-gray-500">
                分配给: {order.assignedTo}
              </div>
            )}
          </div>
        </div>

        {/* 时间信息 */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">创建时间:</span><br />
            {formatDate(order.createdAt)}
          </div>
          <div>
            <span className="font-medium">预估完成:</span><br />
            {order.estimatedWaitTime} 分钟
          </div>
          {order.makingStartedAt && (
            <div>
              <span className="font-medium">开始制作:</span><br />
              {formatTime(order.makingStartedAt)}
            </div>
          )}
          {order.makingCompletedAt && (
            <div>
              <span className="font-medium">制作完成:</span><br />
              {formatTime(order.makingCompletedAt)}
            </div>
          )}
          {order.readyAt && (
            <div>
              <span className="font-medium">待取餐时间:</span><br />
              {formatTime(order.readyAt)}
            </div>
          )}
          {order.completedAt && (
            <div>
              <span className="font-medium">完成时间:</span><br />
              {formatTime(order.completedAt)}
            </div>
          )}
        </div>

        {/* 订单项详情 */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">订单详情</h4>
          <div className="space-y-2">
            {order.orderItems?.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-900">
                  {item.productName} x {item.quantity}
                </span>
                <span className="text-gray-600">
                  ¥{item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 备注 */}
        {order.notes && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <div className="text-xs font-medium text-yellow-800 mb-1">订单备注</div>
            <div className="text-sm text-yellow-700">{order.notes}</div>
          </div>
        )}

        {/* 质量检查备注 */}
        {order.qualityNotes && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-xs font-medium text-green-800 mb-1">质量检查备注</div>
            <div className="text-sm text-green-700">{order.qualityNotes}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderProgress;