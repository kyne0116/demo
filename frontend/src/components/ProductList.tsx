'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '../lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId?: string;
  imageUrl?: string;
  nutritionInfo?: any;
  isActive: boolean;
  sortOrder: number;
}

interface ProductListProps {
  onAddToCart?: (product: Product, quantity: number) => void;
  showAddToCart?: boolean;
  categoryId?: string;
}

export default function ProductList({ 
  onAddToCart, 
  showAddToCart = true,
  categoryId 
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProducts(categoryId);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      setError('获取产品列表失败');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">加载失败</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <button
                onClick={fetchProducts}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">暂无产品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={showAddToCart ? () => handleAddToCart(product) : undefined}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* 产品图片 */}
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-gray-400 text-center">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">暂无图片</p>
          </div>
        )}
      </div>

      {/* 产品信息 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 营养信息 */}
        {product.nutritionInfo && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {product.nutritionInfo.calories && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {product.nutritionInfo.calories} 卡路里
                </span>
              )}
              {product.nutritionInfo.sugar && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {product.nutritionInfo.sugar}g 糖
                </span>
              )}
            </div>
          </div>
        )}

        {/* 价格和操作 */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            ¥{product.price.toFixed(2)}
          </span>
          
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              disabled={!product.isActive}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                product.isActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.isActive ? '加入购物车' : '已下架'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}