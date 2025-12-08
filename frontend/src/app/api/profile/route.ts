import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // 模拟token验证和用户信息获取
    if (token.startsWith('mock-token-1-')) {
      return NextResponse.json({
        id: '1',
        email: 'admin@milktea.com',
        name: '管理员',
        role: 'owner',
        phone: '13800138000'
      });
    } else if (token.startsWith('mock-token-2-')) {
      return NextResponse.json({
        id: '2',
        email: 'staff@milktea.com',
        name: '普通店员',
        role: 'staff',
        phone: '13800138001'
      });
    }

    return NextResponse.json(
      { message: '无效的token' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: '获取用户信息失败' },
      { status: 500 }
    );
  }
}