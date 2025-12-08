import { NextRequest, NextResponse } from 'next/server';

// 模拟订单数据
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-1702000000000-ABC123',
    customerId: null,
    staffId: '2',
    totalAmount: 35.50,
    discountAmount: 0,
    finalAmount: 35.50,
    pointsUsed: 0,
    pointsEarned: 35,
    status: 'completed',
    notes: '少糖，谢谢',
    createdAt: '2023-12-01T14:30:00Z',
    updatedAt: '2023-12-01T14:45:00Z',
    completedAt: '2023-12-01T14:45:00Z',
    orderItems: [
      {
        id: '1',
        orderId: '1',
        productId: '1',
        productName: '珍珠奶茶',
        unitPrice: 18.50,
        quantity: 2,
        subtotal: 37.00
      }
    ]
  },
  {
    id: '2',
    orderNumber: 'ORD-1702000000001-DEF456',
    customerId: null,
    staffId: '2',
    totalAmount: 15.00,
    discountAmount: 0,
    finalAmount: 15.00,
    pointsUsed: 0,
    pointsEarned: 15,
    status: 'making',
    notes: null,
    createdAt: '2023-12-01T15:00:00Z',
    updatedAt: '2023-12-01T15:00:00Z',
    completedAt: null,
    orderItems: [
      {
        id: '2',
        orderId: '2',
        productId: '2',
        productName: '芒果布丁',
        unitPrice: 15.00,
        quantity: 1,
        subtotal: 15.00
      }
    ]
  },
  {
    id: '3',
    orderNumber: 'ORD-1702000000002-GHI789',
    customerId: null,
    staffId: '2',
    totalAmount: 22.00,
    discountAmount: 0,
    finalAmount: 22.00,
    pointsUsed: 0,
    pointsEarned: 22,
    status: 'pending',
    notes: null,
    createdAt: '2023-12-01T15:15:00Z',
    updatedAt: '2023-12-01T15:15:00Z',
    completedAt: null,
    orderItems: [
      {
        id: '3',
        orderId: '3',
        productId: '3',
        productName: '草莓奶昔',
        unitPrice: 22.00,
        quantity: 1,
        subtotal: 22.00
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(mockOrders);
  } catch (error) {
    return NextResponse.json(
      { message: '获取订单列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    // 计算订单总金额
    const totalAmount = orderData.items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    // 生成订单号
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 创建订单
    const newOrder = {
      id: (mockOrders.length + 1).toString(),
      orderNumber,
      customerId: orderData.customerId || null,
      staffId: orderData.staffId,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      pointsUsed: 0,
      pointsEarned: Math.floor(totalAmount),
      status: 'pending',
      notes: orderData.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      orderItems: orderData.items.map((item: any, index: number) => ({
        id: `${mockOrders.length + 1}-${index + 1}`,
        orderId: (mockOrders.length + 1).toString(),
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity
      }))
    };

    mockOrders.unshift(newOrder);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: '创建订单失败' },
      { status: 500 }
    );
  }
}