'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductList from '../../components/ProductList';
import ShoppingCart from '../../components/ShoppingCart';
import MemberCard, { MemberInfo as MemberCardInfo } from '../../components/MemberCard';
import { createOrder, apiClient } from '../../lib/api';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  level: string;
  points: number;
  totalSpent: number;
  isActive: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [staffId, setStaffId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMemberSelection, setShowMemberSelection] = useState(false);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    try {
      // 检查认证状态
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // 获取用户信息
      const profileResponse = await fetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        setUser(userData);

        // 根据用户角色设置staffId
        if (userData.role === 'staff' || userData.role === 'manager' || userData.role === 'owner') {
          setStaffId(userData.id);
        } else {
          // 如果是客户，需要指定处理订单的店员
          setStaffId('default-staff-id');
        }

        // 如果是会员，加载会员信息
        if (userData.role === 'customer') {
          const memberResponse = await apiClient.getMember(userData.id);
          if (!memberResponse.error && memberResponse.data) {
            setMember(memberResponse.data);
          }
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any, quantity: number) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        subtotal: product.price * quantity,
      };
      setCart(prevCart => [...prevCart, newItem]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const handleMemberSelect = (selectedMember: MemberCardInfo | null) => {
    if (selectedMember) {
      setMember({
        id: selectedMember.id,
        name: selectedMember.name,
        email: selectedMember.email,
        memberNumber: selectedMember.memberNumber,
        level: selectedMember.level,
        points: selectedMember.points,
        totalSpent: selectedMember.totalSpent,
        isActive: true
      });
    } else {
      setMember(null);
    }
    setShowMemberSelection(false);
  };

  const handleCheckout = async (orderData: any) => {
    try {
      // 准备订单数据
      const finalOrderData = {
        customerId: member?.id,
        staffId: orderData.staffId || staffId,
        items: orderData.items,
        notes: orderData.notes,
        memberInfo: member ? {
          memberLevel: member.level,
          pointsAvailable: member.points
        } : undefined
      };

      const response = await createOrder(finalOrderData);

      if (response.error) {
        alert(`订单创建失败: ${response.error}`);
        return;
      }

      if (response.data) {
        // 清空购物车
        setCart([]);

        // 更新会员信息（如果订单完成）
        if (member && response.data.pointsEarned) {
          setMember(prev => prev ? {
            ...prev,
            points: prev.points + response.data.pointsEarned,
            totalSpent: prev.totalSpent + response.data.finalAmount
          } : null);
        }

        // 显示成功消息
        alert(`订单创建成功！\n订单号: ${response.data.orderNumber}\n金额: ¥${response.data.finalAmount.toFixed(2)}\n${response.data.pointsEarned ? `获得积分: ${response.data.pointsEarned}` : ''}`);

        // 可以跳转到订单详情页面或继续购物
        // router.push(`/orders/${response.data.id}`);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('订单创建失败，请稍后重试');
    }
  };

  const calculateDiscount = () => {
    if (!member) return { memberDiscount: 0, pointsDiscount: 0, totalDiscount: 0 };

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    // 会员折扣
    const discountRates = {
      bronze: 0,
      regular: 0,
      silver: 0.05,
      gold: 0.08,
      platinum: 0.10
    };

    const discountRate = discountRates[member.level as keyof typeof discountRates] || 0;
    const memberDiscount = subtotal * discountRate;

    // 积分折扣（最多抵扣订单金额的50%）
    const maxPointsDiscount = subtotal * 0.5;
    const maxPointsUsable = Math.min(member.points, maxPointsDiscount * 100);
    const pointsDiscount = maxPointsUsable / 100;

    return {
      memberDiscount,
      pointsDiscount,
      totalDiscount: memberDiscount + pointsDiscount,
      finalAmount: subtotal - memberDiscount - pointsDiscount,
      pointsUsed: maxPointsUsable
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">请先登录</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  const discountInfo = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                奶茶店结账系统
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                欢迎，{user.name} ({user.role})
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                返回仪表板
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 产品列表 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  产品列表
                </h2>
                <ProductList
                  onAddToCart={handleAddToCart}
                  showAddToCart={true}
                />
              </div>
            </div>

            {/* 右侧面板 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 会员信息卡片 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    会员信息
                  </h3>
                  <button
                    onClick={() => setShowMemberSelection(!showMemberSelection)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {member ? '更换' : '选择会员'}
                  </button>
                </div>

                <MemberCard
                  member={member}
                  onMemberSelect={handleMemberSelect}
                  showSelectButton={false}
                  compact={true}
                />

                {showMemberSelection && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <MemberCard
                      member={null}
                      onMemberSelect={handleMemberSelect}
                      showSelectButton={true}
                    />
                    {/* 这里可以添加搜索其他会员的功能 */}
                  </div>
                )}
              </div>

              {/* 折扣信息 */}
              {member && cart.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    折扣信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">商品小计</span>
                      <span className="font-medium">
                        ¥{cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                      </span>
                    </div>

                    {discountInfo.memberDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>会员折扣 ({member.level})</span>
                        <span>-¥{discountInfo.memberDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {discountInfo.pointsDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>积分抵扣 ({discountInfo.pointsUsed} 积分)</span>
                        <span>-¥{discountInfo.pointsDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-lg">
                      <span>应付金额</span>
                      <span className="text-blue-600">
                        ¥{Math.max(0, discountInfo.finalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 购物车 */}
              <ShoppingCart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                staffId={staffId}
                customerId={member?.id}
                memberInfo={member ? {
                  memberLevel: member.level,
                  pointsAvailable: member.points
                } : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 会员信息提示 */}
      {member && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <h4 className="font-semibold mb-2">会员信息</h4>
          <p className="text-sm">等级: {member.level}</p>
          <p className="text-sm">可用积分: {member.points}</p>
          <p className="text-sm">折扣: {['silver', 'gold', 'platinum'].includes(member.level) ? `${member.level === 'silver' ? '5%' : member.level === 'gold' ? '8%' : '10%'}` : '无'}</p>
        </div>
      )}
    </div>
  );
}