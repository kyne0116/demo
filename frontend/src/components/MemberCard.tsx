'use client';

import { useState } from 'react';

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  level: string;
  points: number;
  totalSpent: number;
}

interface MemberCardProps {
  member?: MemberInfo | null;
  onMemberSelect?: (member: MemberInfo) => void;
  showSelectButton?: boolean;
  compact?: boolean;
  className?: string;
}

export default function MemberCard({ 
  member, 
  onMemberSelect, 
  showSelectButton = false, 
  compact = false,
  className = ''
}: MemberCardProps) {
  const [imageError, setImageError] = useState(false);

  const getLevelInfo = (level: string) => {
    const levelInfo = {
      bronze: { 
        name: '青铜会员', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: '🥉'
      },
      silver: { 
        name: '白银会员', 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '🥈'
      },
      gold: { 
        name: '黄金会员', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: '🥇'
      },
      platinum: { 
        name: '白金会员', 
        color: 'text-gray-700', 
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        icon: '💎'
      }
    };
    
    return levelInfo[level as keyof typeof levelInfo] || levelInfo.bronze;
  };

  const getLevelProgress = (level: string, points: number) => {
    const thresholds = {
      bronze: { current: 0, next: 1000 },
      silver: { current: 1000, next: 5000 },
      gold: { current: 5000, next: 10000 },
      platinum: { current: 10000, next: 10000 }
    };
    
    const threshold = thresholds[level as keyof typeof thresholds];
    if (!threshold) return { progress: 0, remaining: 1000 };
    
    const progress = Math.min((points - threshold.current) / (threshold.next - threshold.current) * 100, 100);
    const remaining = Math.max(0, threshold.next - points);
    
    return { progress, remaining };
  };

  const getDiscountRate = (level: string) => {
    const discountRates = {
      bronze: 0,
      regular: 0,
      silver: 5,
      gold: 8,
      platinum: 10
    };
    return discountRates[level as keyof typeof discountRates] || 0;
  };

  if (!member) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">非会员</h3>
          <p className="text-sm text-gray-500">普通客户</p>
          {showSelectButton && (
            <button
              onClick={() => onMemberSelect?.(null as any)}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              选择为非会员
            </button>
          )}
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(member.level);
  const levelProgress = getLevelProgress(member.level, member.points);
  const discountRate = getDiscountRate(member.level);

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${levelInfo.borderColor} p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 头像 */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {member.name.charAt(0)}
              </span>
            </div>
            
            {/* 会员信息 */}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.color}`}>
                  {levelInfo.icon} {levelInfo.name}
                </span>
              </div>
              <p className="text-xs text-gray-500">{member.memberNumber}</p>
            </div>
          </div>

          {/* 积分和折扣 */}
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">{member.points.toLocaleString()}</p>
            <p className="text-xs text-gray-500">积分</p>
            {discountRate > 0 && (
              <p className="text-xs text-green-600">{discountRate}% 折扣</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${levelInfo.borderColor} border-2 ${className}`}>
      {/* 会员头像和基本信息 */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">
            {member.name.charAt(0)}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
        <p className="text-gray-600">{member.email}</p>
        
        {/* 会员等级 */}
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${levelInfo.bgColor} ${levelInfo.color} mt-3`}>
          <span className="mr-2">{levelInfo.icon}</span>
          {levelInfo.name}
        </div>
        
        <p className="text-sm text-gray-500 mt-2">会员号: {member.memberNumber}</p>
      </div>

      {/* 积分显示 */}
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <p className="text-3xl font-bold">{member.points.toLocaleString()}</p>
          <p className="text-sm opacity-90">当前积分</p>
        </div>
        
        {/* 可抵扣金额 */}
        <div className="mt-3">
          <p className="text-lg font-semibold text-green-600">
            可抵扣 ¥{(member.points / 100).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">100积分 = 1元</p>
        </div>
      </div>

      {/* 等级进度 */}
      {member.level !== 'platinum' && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>距离下一等级</span>
            <span>还需 {levelProgress.remaining.toLocaleString()} 积分</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${levelInfo.color.replace('text-', 'bg-')}`}
              style={{ width: `${levelProgress.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 会员权益 */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">会员权益</h4>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-700">积分奖励：消费1元获得1积分</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-700">积分抵扣：100积分 = 1元</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-700">会员折扣：{discountRate}% 专属折扣</span>
          </div>
          {member.level === 'platinum' && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-gray-700">VIP客服：享受专属客服服务</span>
            </div>
          )}
        </div>
      </div>

      {/* 累计消费 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">¥{member.totalSpent.toFixed(2)}</p>
            <p className="text-xs text-gray-500">累计消费</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">
              ¥{(member.totalSpent / member.points * 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">平均积分价值</p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      {showSelectButton && onMemberSelect && (
        <div className="mt-6">
          <button
            onClick={() => onMemberSelect(member)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            选择此会员
          </button>
        </div>
      )}
    </div>
  );
}

// 导出类型
export type { MemberInfo };