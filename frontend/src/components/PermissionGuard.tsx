'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface UserPermissions {
  roles: string[];
  permissions: string[];
  effectivePermissions: string[];
}

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  requireAll?: boolean; // true: 需要所有权限，false: 需要任一权限
  showMessage?: boolean; // 是否显示权限不足的消息
  className?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  fallback = (
    <div className="flex items-center justify-center p-8 text-center">
      <div className="flex flex-col items-center">
        <Lock className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">权限不足</h3>
        <p className="text-sm text-gray-600">您没有权限访问此内容</p>
      </div>
    </div>
  ),
  loading = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
  requireAll = false, // 默认需要任一权限
  showMessage = true,
  className = '',
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
  }, [permission, permissions, role, roles, requireAll]);

  const checkPermissions = async () => {
    try {
      setLoadingState(true);
      setError(null);

      // 检查是否已登录
      const token = localStorage.getItem('token');
      if (!token) {
        setHasPermission(false);
        setLoadingState(false);
        return;
      }

      // 获取用户权限信息
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setHasPermission(false);
        setLoadingState(false);
        return;
      }

      const userData = await response.json();
      
      // 如果需要检查特定权限，获取详细权限信息
      let permissionsData: UserPermissions | null = null;
      
      if (permission || permissions.length > 0 || role || roles.length > 0) {
        const permResponse = await fetch(`/api/users/staff/${userData.id}/permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (permResponse.ok) {
          permissionsData = await permResponse.json();
          setUserPermissions(permissionsData);
        }
      }

      // 检查权限
      const hasAccess = checkUserAccess(userData, permissionsData);
      setHasPermission(hasAccess);

    } catch (err) {
      console.error('权限检查失败:', err);
      setError('权限检查失败');
      setHasPermission(false);
    } finally {
      setLoadingState(false);
    }
  };

  const checkUserAccess = (user: any, permissionsData?: UserPermissions | null): boolean => {
    // 如果没有需要检查的条件，默认允许访问
    const needsPermissionCheck = permission || permissions.length > 0 || role || roles.length > 0;
    if (!needsPermissionCheck) {
      return true;
    }

    // 如果没有权限数据，无法检查
    if (!permissionsData) {
      return false;
    }

    let hasRequiredPermission = false;

    // 检查角色权限
    if (role) {
      hasRequiredPermission = permissionsData.roles.includes(role);
    } else if (roles.length > 0) {
      hasRequiredPermission = requireAll 
        ? roles.every(r => permissionsData.roles.includes(r))
        : roles.some(r => permissionsData.roles.includes(r));
    }

    // 检查具体权限
    if (permission) {
      const permissionCheck = permissionsData.effectivePermissions.includes(permission);
      hasRequiredPermission = hasRequiredPermission && permissionCheck;
    } else if (permissions.length > 0) {
      const permissionCheck = requireAll
        ? permissions.every(p => permissionsData.effectivePermissions.includes(p))
        : permissions.some(p => permissionsData.effectivePermissions.includes(p));
      hasRequiredPermission = hasRequiredPermission && permissionCheck;
    }

    return hasRequiredPermission;
  };

  const getPermissionInfo = () => {
    if (!userPermissions) return null;

    const missingPermissions: string[] = [];
    const missingRoles: string[] = [];

    // 检查缺失的权限
    if (permission && !userPermissions.effectivePermissions.includes(permission)) {
      missingPermissions.push(permission);
    }
    if (permissions.length > 0) {
      permissions.forEach(p => {
        if (!userPermissions.effectivePermissions.includes(p)) {
          missingPermissions.push(p);
        }
      });
    }

    // 检查缺失的角色
    if (role && !userPermissions.roles.includes(role)) {
      missingRoles.push(role);
    }
    if (roles.length > 0) {
      roles.forEach(r => {
        if (!userPermissions.roles.includes(r)) {
          missingRoles.push(r);
        }
      });
    }

    return { missingPermissions, missingRoles };
  };

  // 加载状态
  if (loadingState) {
    return <>{loading}</>;
  }

  // 错误状态
  if (error) {
    if (!showMessage) return null;
    
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // 无权限状态
  if (hasPermission === false) {
    if (!showMessage) return null;
    
    const permissionInfo = getPermissionInfo();
    
    return (
      <div className={className}>
        {fallback}
        {permissionInfo && (permissionInfo.missingPermissions.length > 0 || permissionInfo.missingRoles.length > 0) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <Shield className="h-5 w-5 text-yellow-400 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">需要以下权限：</p>
                {permissionInfo.missingRoles.length > 0 && (
                  <p className="mt-1">
                    角色: {permissionInfo.missingRoles.join(', ')}
                  </p>
                )}
                {permissionInfo.missingPermissions.length > 0 && (
                  <p className="mt-1">
                    权限: {permissionInfo.missingPermissions.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 有权限，显示子组件
  return <>{children}</>;
};

// 高阶组件版本
export const withPermissionGuard = (
  Component: React.ComponentType<any>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) => {
  const WrappedComponent: React.FC<any> = (props) => (
    <PermissionGuard {...guardProps}>
      <Component {...props} />
    </PermissionGuard>
  );

  WrappedComponent.displayName = `withPermissionGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook版本
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setPermissions(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取用户信息失败');
      }

      const userData = await response.json();

      const permResponse = await fetch(`/api/users/staff/${userData.id}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (permResponse.ok) {
        const permissionsData = await permResponse.json();
        setPermissions(permissionsData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions?.effectivePermissions.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return permissions?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => permissions?.roles.includes(role)) || false;
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => permissions?.roles.includes(role)) || false;
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refetch: fetchPermissions,
  };
};

export default PermissionGuard;