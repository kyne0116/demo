'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';

interface MemberProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  memberNumber: string;
  level: string;
  points: number;
  totalSpent: number;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MemberStats {
  totalOrders: number;
  totalSpent: number;
  totalPointsEarned: number;
  totalPointsUsed: number;
  netPoints: number;
  averageOrderValue: number;
}

export default function MemberProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemberProfile();
  }, []);

  const fetchMemberProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前登录的会员信息
      const profileResponse = await apiClient.getProfile();
      
      if (profileResponse.error) {
        setError(profileResponse.error);
        return;
      }

      if (profileResponse.data) {
        setMember(profileResponse.data);
        
        // 获取会员统计信息
        const statsResponse = await apiClient.getMemberOrderStats(profileResponse.data.id);
        if (!statsResponse.error && statsResponse.data) {
          setStats(statsResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch member profile:', error);
      setError('获取会员信息失败');
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: string) => {
    const levelInfo = {
      bronze: { name: '青铜会员', color: 'bg-yellow-600', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      silver: { name: '白银会员', color: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-50' },
      gold: { name: '黄金会员', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      platinum: { name: '白金会员', color: 'bg-gray-300', textColor: 'text-gray-700', bgColor: 'bg-gray-50' }
    };
    
    return levelInfo[level as keyof typeof levelInfo] || levelInfo.bronze;
  };

  const getLevelProgress = (level: string) => {
    const thresholds = {
      bronze: { current: 0, next: 1000 },
      silver: { current: 1000, next: 5000 },
      gold: { current: 5000, next: 10000 },
      platinum: { current: 10000, next: 10000 }
    };
    
    const threshold = thresholds[level as keyof typeof thresholds];
    if (!threshold) return { progress: 0, remaining: 1000 };
    
    const memberPoints = member?.points || 0;
    const progress = Math.min((memberPoints - threshold.current) / (threshold.next - threshold.current) * 100, 100);
    const remaining = Math.max(0, threshold.next - memberPoints);
    
    return { progress, remaining };
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchMemberProfile}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">会员信息不存在</p>
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

  const levelInfo = getLevelInfo(member.level);
  const levelProgress = getLevelProgress(member.level);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                会员资料
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/checkout')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                开始购物
              </button>
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 会员基本信息 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  {/* 头像 */}
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
                  <p className="text-gray-600">{member.email}</p>
                  
                  {/* 会员等级 */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${levelInfo.bgColor} ${levelInfo.textColor} mt-3`}>
                    {levelInfo.name}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">会员号: {member.memberNumber}</p>
                </div>
                
                {/* 积分显示 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{member.points.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">当前积分</p>
                  </div>
                  
                  {/* 等级进度 */}
                  {member.level !== 'platinum' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>距离下一等级还需 {levelProgress.remaining} 积分</span>
                        <span>{levelProgress.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${levelInfo.color}`}
                          style={{ width: `${levelProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 详细信息和统计 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本信息 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">手机号码</label>
                    <p className="mt-1 text-sm text-gray-900">{member.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">注册时间</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(member.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">最后活跃</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {member.lastActiveAt 
                        ? new Date(member.lastActiveAt).toLocaleDateString('zh-CN')
                        : '从未活跃'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">会员状态</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? '正常' : '已停用'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 积分和消费统计 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">积分与消费</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{member.points.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">当前积分</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">¥{member.totalSpent.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">累计消费</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {((member.points / 100) * 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">可抵扣金额</p>
                  </div>
                </div>
              </div>

              {/* 详细统计 */}
              {stats && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">消费统计</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">{stats.totalOrders}</p>
                      <p className="text-xs text-gray-600">总订单数</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">¥{stats.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">总消费金额</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-lg font-semibold text-purple-600">{stats.totalPointsEarned}</p>
                      <p className="text-xs text-gray-600">获得积分</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-lg font-semibold text-orange-600">{stats.totalPointsUsed}</p>
                      <p className="text-xs text-gray-600">使用积分</p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <p className="text-lg font-semibold text-indigo-600">{stats.netPoints}</p>
                      <p className="text-xs text-gray-600">净积分</p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                      <p className="text-lg font-semibold text-pink-600">¥{stats.averageOrderValue.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">平均订单金额</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 会员权益 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">会员权益</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">积分奖励：消费1元获得1积分</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">积分抵扣：100积分 = 1元</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">会员折扣：{levelInfo.name}享受专属折扣</span>
                  </div>
                  {member.level === 'platinum' && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">专属客服：享受VIP专属服务</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}