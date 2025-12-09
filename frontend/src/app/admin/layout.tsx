'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  ShoppingCart,
  Settings,
  Bell,
  ClipboardList,
  Warehouse,
  AlertTriangle,
  Coffee,
  TrendingUp,
} from 'lucide-react';
import PermissionGuard from '../../components/PermissionGuard';

const navigation = [
  {
    name: '仪表板',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    name: '员工管理',
    href: '/admin/staff',
    icon: Users,
    permission: 'users:read',
  },
  {
    name: '产品管理',
    href: '/admin/products',
    icon: Package,
    permission: 'products:read',
  },
  {
    name: '库存管理',
    href: '/admin/inventory',
    icon: Warehouse,
    permission: 'inventory:read',
  },
  {
    name: '库存监控',
    href: '/admin/inventory/monitor',
    icon: BarChart3,
    permission: 'inventory:read',
  },
  {
    name: '库存预警',
    href: '/admin/inventory/alerts',
    icon: AlertTriangle,
    permission: 'inventory:read',
  },
  {
    name: '订单管理',
    href: '/admin/orders',
    icon: ShoppingCart,
    permission: 'orders:read',
  },
  {
    name: '订单制作',
    href: '/admin/orders/production',
    icon: Coffee,
    permission: 'orders:read',
  },
  {
    name: '制作统计',
    href: '/admin/orders/stats',
    icon: TrendingUp,
    permission: 'orders:read',
  },
  {
    name: '会员管理',
    href: '/admin/members',
    icon: Users,
    permission: 'members:read',
  },
  {
    name: '系统设置',
    href: '/admin/settings',
    icon: Settings,
    permission: 'system:read',
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <PermissionGuard permission="admin:access" showMessage={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* 侧边栏 */}
          <div className="w-64 bg-white shadow-lg">
            <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
              <h1 className="text-xl font-bold text-white">奶茶店管理系统</h1>
            </div>
            
            <nav className="mt-8">
              <div className="px-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <PermissionGuard key={item.name} permission={item.permission} showMessage={false}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    </PermissionGuard>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 overflow-auto">
            {/* 顶部导航栏 */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="flex items-center justify-between h-16 px-6">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {navigation.find(item => 
                      pathname === item.href || pathname.startsWith(item.href + '/')
                    )?.name || '管理后台'}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* 快捷预警显示 */}
                  <PermissionGuard permission="inventory:read" showMessage={false}>
                    <Link
                      href="/admin/inventory/alerts"
                      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    </Link>
                  </PermissionGuard>
                  
                  {/* 用户信息 */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">管理员</p>
                      <p className="text-xs text-gray-500">系统管理员</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">A</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* 页面内容 */}
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}