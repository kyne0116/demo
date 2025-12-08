import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 模拟登录验证 - 在实际应用中应该调用后端API
    const mockUsers = [
      {
        id: '1',
        email: 'admin@milktea.com',
        password: 'admin123',
        name: '管理员',
        role: 'owner'
      },
      {
        id: '2',
        email: 'staff@milktea.com',
        password: 'staff123',
        name: '普通店员',
        role: 'staff'
      }
    ];

    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        { message: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 生成模拟token
    const token = `mock-token-${user.id}-${Date.now()}`;

    return NextResponse.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: '登录请求处理失败' },
      { status: 500 }
    );
  }
}