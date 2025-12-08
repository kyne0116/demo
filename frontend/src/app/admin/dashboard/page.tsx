'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  Clock,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  staffUsers: number;
  roleDistribution: Record<string, number>;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取统计数据
      const statsResponse = await fetch('/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error('获取统计数据失败');
      }

      const statsData = await statsResponse.json();
      setStats(statsData);

      // 模拟最近活动数据
      setRecentActivity([
        {
          id: '1',
          user: '张三',
          action: '创建了新员工',
          timestamp: '2分钟前',
          status: 'success'
        },
        {
          id: '2',
          user: '李四',
          action: '更新了用户角色',
          timestamp: '5分钟前',
          status: 'warning'
        },
        {
          id: '3',
          user: '王五',
          action: '尝试访问受限资源',
          timestamp: '10分钟前',
          status: 'error'
        },
        {
          id: '4',
          user: '赵六',
          action: '登录系统',
          timestamp: '15分钟前',
          status: 'success'
        },
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'ADMIN': '管理员',
      'MANAGER': '经理',
      'CASHIER': '收银员',
      'KITCHEN_STAFF': '厨房员工',
      'INVENTORY_MANAGER': '库存管理员',
      'CUSTOMER': '客户',
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                系统设置
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    总用户数
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.totalUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    活跃用户
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.activeUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    员工数量
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.staffUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    活跃率
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 角色分布 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">角色分布</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats?.roleDistribution && Object.entries(stats.roleDistribution).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">
                        {getRoleDisplayName(role)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${stats.totalUsers ? (count / stats.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近活动 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">最近活动</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status).replace('text-', 'bg-').replace('-600', '-500')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status === 'success' && '成功'}
                      {activity.status === 'warning' && '警告'}
                      {activity.status === 'error' && '错误'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">管理员工</h4>
                  <p className="text-sm text-gray-600">添加、编辑或删除员工账户</p>
                </div>
              </div>
            </button>

            <button className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">权限设置</h4>
                  <p className="text-sm text-gray-600">配置角色和权限</p>
                </div>
              </div>
            </button>

            <button className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">查看报表</h4>
                  <p className="text-sm text-gray-600">系统使用统计和分析</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;