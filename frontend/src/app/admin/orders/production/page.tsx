'use client';

import React from 'react';
import OrderQueue from '@/components/OrderQueue';
import PermissionGuard from '@/components/PermissionGuard';

export default function OrderProductionPage() {
  return (
    <PermissionGuard permission="orders:read" showMessage={false}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">P</span>
                </div>
                订单制作管理
              </h1>
              <p className="text-gray-600 mt-1">
                管理订单制作流程，追踪制作进度和队列状态
              </p>
            </div>
          </div>
        </div>

        <OrderQueue 
          showAllQueues={true}
          autoRefresh={true}
          className=""
        />
      </div>
    </PermissionGuard>
  );
}