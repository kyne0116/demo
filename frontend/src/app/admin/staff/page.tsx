'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface CreateStaffData {
  name: string;
  email: string;
  phone: string;
  roles: string[];
  password: string;
}

const StaffManagementPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [createForm, setCreateForm] = useState<CreateStaffData>({
    name: '',
    email: '',
    phone: '',
    roles: [],
    password: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isActive', statusFilter);

      const response = await fetch(`/api/users/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取员工列表失败');
      }

      const data = await response.json();
      setStaff(data.data || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    try {
      const response = await fetch('/api/users/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        throw new Error('创建员工失败');
      }

      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        roles: [],
        password: '',
      });
      fetchStaff();

    } catch (err) {
      setError(err instanceof Error ? err.message : '创建员工失败');
    }
  };

  const handleUpdateStaff = async (staffId: string, updates: Partial<StaffMember>) => {
    try {
      const response = await fetch(`/api/users/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('更新员工信息失败');
      }

      setShowEditModal(false);
      setSelectedStaff(null);
      fetchStaff();

    } catch (err) {
      setError(err instanceof Error ? err.message : '更新员工信息失败');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      const response = await fetch(`/api/users/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除员工失败');
      }

      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();

    } catch (err) {
      setError(err instanceof Error ? err.message : '删除员工失败');
    }
  };

  const handleToggleStatus = async (staffId: string, isActive: boolean) => {
    await handleUpdateStaff(staffId, { isActive });
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-red-100 text-red-800',
      'MANAGER': 'bg-purple-100 text-purple-800',
      'CASHIER': 'bg-blue-100 text-blue-800',
      'KITCHEN_STAFF': 'bg-green-100 text-green-800',
      'INVENTORY_MANAGER': 'bg-orange-100 text-orange-800',
      'CUSTOMER': 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || member.roles.includes(roleFilter);
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加员工
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索员工..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有角色</option>
              <option value="ADMIN">管理员</option>
              <option value="MANAGER">经理</option>
              <option value="CASHIER">收银员</option>
              <option value="KITCHEN_STAFF">厨房员工</option>
              <option value="INVENTORY_MANAGER">库存管理员</select>

            <select
              value={statusFilter}
              onChange={(e) => set</option>
            StatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>

            <button
              onClick={fetchStaff}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </button>
          </div>
        </div>

        {/* 员工列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    员工信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role)}`}
                          >
                            {getRoleDisplayName(role)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {member.isActive ? (
                          <div className="flex items-center text-green-600">
                            <UserCheck className="h-4 w-4 mr-1" />
                            <span className="text-sm">活跃</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <UserX className="h-4 w-4 mr-1" />
                            <span className="text-sm">停用</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(member.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member.id, !member.isActive)}
                          className={`${member.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {member.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到员工</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter || statusFilter ? '尝试调整搜索条件' : '开始添加第一个员工'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 创建员工模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">添加新员工</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="姓名"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="邮箱"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="手机号"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  multiple
                  value={createForm.roles}
                  onChange={(e) => setCreateForm({ ...createForm, roles: Array.from(e.target.selectedOptions, option => option.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASHIER">收银员</option>
                  <option value="KITCHEN_STAFF">厨房员工</option>
                  <option value="INVENTORY_MANAGER">库存管理员</option>
                  <option value="MANAGER">经理</option>
                </select>
                <input
                  type="password"
                  placeholder="初始密码"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateStaff}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm text-gray-500 mb-6">
                确定要删除员工 <strong>{selectedStaff.name}</strong> 吗？此操作无法撤销。
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteStaff(selectedStaff.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;