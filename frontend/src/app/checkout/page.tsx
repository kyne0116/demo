'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductList from '../../components/ProductList';
import ShoppingCart from '../../components/ShoppingCart';
import { createOrder } from '../../lib/api';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface MemberInfo {
  memberLevel?: string;
  pointsAvailable?: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          // 这里可以添加店员选择界面
          setStaffId('default-staff-id');
        }

        // 如果是会员，加载会员信息
        if (userData.role === 'customer') {
          // 这里可以调用会员API获取详细信息
          setMemberInfo({
            memberLevel: userData.memberLevel || 'regular',
            pointsAvailable: userData.points || 0,
          });
          setCustomerId(userData.id);
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

  const handleCheckout = async (orderData: any) => {
    try {
      const response = await createOrder(orderData);
      
      if (response.error) {
        alert(`订单创建失败: ${response.error}`);
        return;
      }

      if (response.data) {
        // 清空购物车
        setCart([]);
        
        // 显示成功消息
        alert(`订单创建成功！\n订单号: ${response.data.orderNumber}\n金额: ¥${response.data.finalAmount.toFixed(2)}`);
        
        // 可以跳转到订单详情页面或继续购物
        // router.push(`/orders/${response.data.id}`);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('订单创建失败，请稍后重试');
    }
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

            {/* 购物车 */}
            <div className="lg:col-span-1">
              <ShoppingCart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                staffId={staffId}
                customerId={customerId || undefined}
                memberInfo={memberInfo || undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 会员信息提示 */}
      {memberInfo && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <h4 className="font-semibold mb-2">会员信息</h4>
          <p className="text-sm">等级: {memberInfo.memberLevel}</p>
          <p className="text-sm">可用积分: {memberInfo.pointsAvailable}</p>
        </div>
      )}
    </div>
  );
}