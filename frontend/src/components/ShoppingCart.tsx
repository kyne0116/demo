'use client';

import { useState } from 'react';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: (orderData: {
    customerId?: string;
    staffId: string;
    items: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }>;
    notes?: string;
    memberInfo?: {
      memberLevel?: string;
      pointsAvailable?: number;
    };
  }) => void;
  staffId: string;
  customerId?: string;
  memberInfo?: {
    memberLevel?: string;
    pointsAvailable?: number;
  };
}

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  staffId,
  customerId,
  memberInfo
}: ShoppingCartProps) {
  const [notes, setNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // 计算订单总金额
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // 计算会员折扣
  const memberDiscount = calculateMemberDiscount(subtotal, memberInfo?.memberLevel);
  let remainingAmount = subtotal - memberDiscount.discountAmount;
  
  // 计算积分折扣
  const pointsDiscount = calculatePointsDiscount(memberInfo?.pointsAvailable || 0, remainingAmount);
  remainingAmount = remainingAmount - pointsDiscount.discountAmount;
  
  const totalDiscount = memberDiscount.discountAmount + pointsDiscount.discountAmount;
  const finalAmount = Math.max(0, remainingAmount);
  const pointsEarned = Math.floor(subtotal);
  const pointsUsed = pointsDiscount.usedPoints;

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const orderData = {
        customerId,
        staffId,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        notes: notes.trim() || undefined,
        memberInfo,
      };

      await onCheckout(orderData);
      
      // 清空购物车和备注
      setNotes('');
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">购物车</h3>
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
            />
          </svg>
          <p className="mt-4 text-gray-500">购物车是空的</p>
          <p className="text-sm text-gray-400">添加一些产品开始购物吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        购物车 ({items.length} 件商品)
      </h3>

      {/* 购物车商品列表 */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{item.productName}</h4>
              <p className="text-sm text-gray-500">¥{item.unitPrice.toFixed(2)}</p>
            </div>

            {/* 数量控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <span className="w-12 text-center text-sm font-medium">
                {item.quantity}
              </span>
              
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            {/* 小计 */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                ¥{item.subtotal.toFixed(2)}
              </p>
            </div>

            {/* 删除按钮 */}
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 备注输入 */}
      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          备注
        </label>
        <textarea
          id="notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="例如：少糖、多珍珠..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* 价格明细 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">价格明细</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>商品小计</span>
            <span>¥{subtotal.toFixed(2)}</span>
          </div>
          
          {memberInfo?.memberLevel && memberInfo.memberLevel !== 'regular' && (
            <div className="flex justify-between text-green-600">
              <span>会员折扣 ({memberInfo.memberLevel})</span>
              <span>-¥{memberDiscount.discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {pointsUsed > 0 && (
            <div className="flex justify-between text-green-600">
              <span>积分抵扣 ({pointsUsed} 积分)</span>
              <span>-¥{pointsDiscount.discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-gray-900">
            <span>应付金额</span>
            <span>¥{finalAmount.toFixed(2)}</span>
          </div>
          
          {memberInfo && (
            <div className="flex justify-between text-blue-600 text-xs">
              <span>本次消费获得积分</span>
              <span>+{pointsEarned} 积分</span>
            </div>
          )}
        </div>
      </div>

      {/* 结账按钮 */}
      <button
        onClick={handleCheckout}
        disabled={isCheckingOut || items.length === 0}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isCheckingOut || items.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {isCheckingOut ? '处理中...' : `结账 (¥${finalAmount.toFixed(2)})`}
      </button>

      {/* 会员信息显示 */}
      {memberInfo && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-blue-800">会员等级: {memberInfo.memberLevel}</span>
            <span className="text-blue-800">可用积分: {memberInfo.pointsAvailable}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 计算会员折扣
function calculateMemberDiscount(totalAmount: number, memberLevel?: string) {
  if (!memberLevel || memberLevel === 'regular' || memberLevel === 'bronze') {
    return { discountAmount: 0 };
  }

  let discountRate = 0;
  switch (memberLevel.toLowerCase()) {
    case 'silver':
      discountRate = 0.05;
      break;
    case 'gold':
      discountRate = 0.08;
      break;
    case 'platinum':
      discountRate = 0.10;
      break;
  }

  return { discountAmount: totalAmount * discountRate };
}

// 计算积分折扣
function calculatePointsDiscount(pointsAvailable: number, totalAmount: number) {
  if (!pointsAvailable || pointsAvailable <= 0) {
    return { usedPoints: 0, discountAmount: 0 };
  }

  const maxDiscountablePoints = totalAmount * 100; // 1元 = 100积分
  const usedPoints = Math.min(pointsAvailable, maxDiscountablePoints);
  const discountAmount = usedPoints / 100;

  return { usedPoints, discountAmount };
}