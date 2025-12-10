'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
} from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  inStock?: boolean;
  canBeMade?: boolean;
  preparationTime: number;
  costPrice?: number;
  viewCount: number;
  orderCount: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ProductStatistics {
  totalProducts: number;
  availableProducts: number;
  inStockProducts: number;
  canBeMadeProducts: number;
  unavailableProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  averageCost: number;
  categoryStats: Record<string, {
    total: number;
    available: number;
    inStock: number;
    canBeMade: number;
  }>;
}

const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStatistics();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products?withInventory=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchProducts();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('搜索产品失败:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        fetchStatistics();
      }
    } catch (error) {
      console.error('删除产品失败:', error);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${productId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(p => p.id === productId ? updatedProduct : p));
        fetchStatistics();
      }
    } catch (error) {
      console.error('更新产品状态失败:', error);
    }
  };

  const getProductStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          已停用
        </span>
      );
    }

    if (!product.isAvailable) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          不可售
        </span>
      );
    }

    if (product.canBeMade) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          可制作
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        库存不足
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  const getProfitMargin = (price: number, costPrice?: number) => {
    if (!costPrice || costPrice <= 0) return null;
    return ((price - costPrice) / price * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permission="products:read"
      showMessage={true}
    >
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理产品信息、价格和库存状态
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              统计信息
            </button>
            <PermissionGuard permission="products:write">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加产品
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* 统计信息卡片 */}
        {showStatistics && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">总产品数</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">可售产品</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.availableProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">可制作产品</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.canBeMadeProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">缺货产品</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.outOfStockProducts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索产品名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Search className="w-4 h-4 mr-2" />
              搜索
            </button>
          </div>
        </div>

        {/* 产品列表 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              产品列表 ({products.length})
            </h3>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li key={product.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.description}</p>
                          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-400">
                            <span>分类: {product.category?.name || '未分类'}</span>
                            <span>制作时间: {product.preparationTime}分钟</span>
                            <span>浏览: {product.viewCount}</span>
                            <span>订单: {product.orderCount}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatPrice(product.price)}</p>
                          {product.costPrice && (
                            <p className="text-sm text-gray-500">
                              成本: {formatPrice(product.costPrice)}
                              {getProfitMargin(product.price, product.costPrice) && (
                                <span className="ml-2 text-green-600">
                                  毛利: {getProfitMargin(product.price, product.costPrice)}%
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getProductStatusBadge(product)}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <PermissionGuard permission="products:read">
                            <button
                              onClick={() => window.open(`/products/${product.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-900"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="products:write">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="编辑产品"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="products:write">
                            <button
                              onClick={() => handleToggleAvailability(product.id, product.isAvailable)}
                              className={`${
                                product.isAvailable
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={product.isAvailable ? '设为不可售' : '设为可售'}
                            >
                              {product.isAvailable ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="products:delete">
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                              title="删除产品"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有产品</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建你的第一个产品</p>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ProductManagementPage;