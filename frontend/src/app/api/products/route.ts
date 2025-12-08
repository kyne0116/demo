import { NextRequest, NextResponse } from 'next/server';

// 模拟产品数据
const mockProducts = [
  {
    id: '1',
    name: '珍珠奶茶',
    description: '经典珍珠奶茶，丝滑奶茶配Q弹珍珠',
    price: 18.50,
    categoryId: '1',
    imageUrl: '/images/pearl-milk-tea.jpg',
    nutritionInfo: { calories: 350, protein: 5, sugar: 45 },
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z'
  },
  {
    id: '2',
    name: '芒果布丁',
    description: '新鲜芒果配Q弹布丁',
    price: 15.00,
    categoryId: '1',
    imageUrl: '/images/mango-pudding.jpg',
    nutritionInfo: { calories: 280, protein: 3, sugar: 38 },
    isActive: true,
    sortOrder: 2,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z'
  },
  {
    id: '3',
    name: '草莓奶昔',
    description: '新鲜草莓制作的香甜奶昔',
    price: 22.00,
    categoryId: '2',
    imageUrl: '/images/strawberry-smoothie.jpg',
    nutritionInfo: { calories: 320, protein: 8, sugar: 42 },
    isActive: true,
    sortOrder: 3,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    let products = mockProducts;
    
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { message: '获取产品列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();
    
    // 模拟创建产品
    const newProduct = {
      id: (mockProducts.length + 1).toString(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockProducts.push(newProduct);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: '创建产品失败' },
      { status: 500 }
    );
  }
}