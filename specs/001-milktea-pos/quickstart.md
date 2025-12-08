# 快速开始指南: 奶茶店销售管理系统

**Date**: 2025-12-08  
**Version**: 1.0.0  
**Feature**: 001-milktea-pos

## 项目概述

基于Next.js和NestJS的现代化奶茶店销售管理系统，支持完整的店铺运营管理流程。采用前后端分离架构，使用TypeScript确保类型安全。

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: NestJS + TypeScript + TypeORM
- **数据库**: PostgreSQL
- **认证**: JWT
- **测试**: Jest + Testing Library
- **构建**: Vite (前端) + Webpack (后端)

## 环境要求

- Node.js 18.0.0+
- PostgreSQL 14+
- Git 2.30+

## 本地开发环境搭建

### 1. 克隆项目

```bash
git clone <repository-url>
cd milktea-pos-system
git checkout 001-milktea-pos
```

### 2. 安装依赖

#### 后端依赖
```bash
cd backend
npm install
```

#### 前端依赖
```bash
cd frontend
npm install
```

### 3. 数据库配置

#### 安装PostgreSQL
```bash
# Windows (使用Chocolatey)
choco install postgresql

# macOS (使用Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-14
```

#### 创建数据库
```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE milktea_pos;
CREATE USER milktea_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE milktea_pos TO milktea_user;
\q
```

### 4. 环境变量配置

#### 后端环境变量 (.env)
```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=milktea_pos
DATABASE_USERNAME=milktea_user
DATABASE_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

# Redis (可选，用于缓存)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### 前端环境变量 (.env.local)
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=奶茶店销售管理系统
```

### 5. 数据库迁移

#### 运行迁移
```bash
cd backend
npm run migration:run
npm run seed:run
```

#### 迁移命令说明
```bash
npm run migration:generate -- --name InitialMigration
npm run migration:revert
npm run seed:run      # 运行种子数据
npm run seed:revert   # 回滚种子数据
```

## 开发启动

### 启动后端服务
```bash
cd backend
npm run start:dev
```

服务将在 http://localhost:3000 启动

### 启动前端服务
```bash
cd frontend
npm run dev
```

服务将在 http://localhost:3001 启动

### 同时启动前后端
```bash
# 在项目根目录
npm run dev:all
```

## 默认账户

### 管理员账户
```
邮箱: admin@milktea.com
密码: Admin123!
角色: owner
```

### 测试店员账户
```
邮箱: staff@milktea.com
密码: Staff123!
角色: staff
```

### 测试客户账户
```
邮箱: customer@milktea.com
密码: Customer123!
角色: customer
```

## 项目结构

```
milktea-pos-system/
├── backend/                 # NestJS后端
│   ├── src/
│   │   ├── modules/         # 业务模块
│   │   │   ├── auth/        # 认证模块
│   │   │   ├── users/       # 用户管理
│   │   │   ├── products/    # 产品管理
│   │   │   ├── orders/      # 订单管理
│   │   │   ├── members/     # 会员管理
│   │   │   ├── inventory/   # 库存管理
│   │   │   └── reports/     # 报表统计
│   │   ├── common/          # 公共模块
│   │   ├── config/          # 配置模块
│   │   └── main.ts          # 应用入口
│   ├── tests/               # 测试文件
│   └── package.json
├── frontend/                # Next.js前端
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/      # 可复用组件
│   │   ├── lib/             # 工具函数
│   │   └── types/           # TypeScript类型
│   ├── public/              # 静态资源
│   ├── tests/               # 测试文件
│   └── package.json
├── shared/                  # 共享代码
│   ├── types/               # 共享类型
│   └── utils/               # 共享工具
├── docs/                    # 文档
│   ├── api/                 # API文档
│   └── deployment/          # 部署文档
└── README.md
```

## 核心功能使用指南

### 1. 用户认证

#### 登录
```typescript
// 前端登录
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.accessToken);
  }
};
```

#### API调用
```typescript
// 带认证的API调用
const getOrders = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/orders', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 2. 产品管理

#### 获取产品列表
```typescript
// GET /api/products
const products = await fetch('/api/products').then(r => r.json());
```

#### 创建产品 (需要staff+权限)
```typescript
const createProduct = async (productData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return response.json();
};
```

### 3. 订单处理

#### 创建订单
```typescript
const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

#### 更新订单状态
```typescript
const updateOrderStatus = async (orderId, status) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};
```

### 4. 会员管理

#### 获取会员信息
```typescript
const getMemberProfile = async (memberId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/members/${memberId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

#### 调整积分
```typescript
const adjustPoints = async (memberId, operation, amount, reason) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/members/${memberId}/points`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ operation, amount, reason })
  });
  return response.json();
};
```

## 测试指南

### 后端测试
```bash
cd backend

# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:cov
```

### 前端测试
```bash
cd frontend

# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### API测试示例
```typescript
// 测试登录接口
describe('AuthController', () => {
  it('should login user', async () => {
    const loginDto = {
      email: 'admin@milktea.com',
      password: 'Admin123!'
    };
    
    const response = await request(app)
      .post('/auth/login')
      .send(loginDto)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

## 调试指南

### 后端调试

#### 启用调试日志
```bash
# backend/.env
LOG_LEVEL=debug
```

#### 常见问题排查
```bash
# 数据库连接问题
npm run db:check

# 依赖问题
npm run deps:check

# 环境变量验证
npm run env:validate
```

### 前端调试

#### 开发工具
- React DevTools
- Next.js DevTools
- TypeScript LSP

#### 常见问题
```bash
# TypeScript类型检查
npm run type-check

# 构建问题排查
npm run build:debug
```

## 性能优化

### 后端优化
- 数据库索引优化
- 查询结果缓存
- 分页查询实现
- 连接池配置

### 前端优化
- 组件懒加载
- 图片优化
- Bundle分析
- CDN配置

## 部署指南

### 开发环境部署
```bash
# 构建项目
npm run build

# 启动生产服务
npm run start:prod
```

### Docker部署
```bash
# 构建镜像
docker build -t milktea-pos .

# 运行容器
docker run -p 3000:3000 milktea-pos
```

### 生产环境配置
```bash
# 环境变量
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=production-secret
```

## 常见问题

### Q: 数据库连接失败？
A: 检查PostgreSQL服务状态和连接配置，确保数据库存在且用户权限正确。

### Q: JWT Token验证失败？
A: 检查JWT_SECRET配置和token格式，确保前后端时间同步。

### Q: 前端API调用404？
A: 确认后端服务启动，检查API_URL配置和CORS设置。

### Q: TypeORM迁移失败？
A: 检查数据库版本兼容性，手动清理migration表并重新运行。

## 获取帮助

- 📧 技术支持: support@milktea.com
- 📚 API文档: http://localhost:3000/api/docs
- 🐛 问题报告: [GitHub Issues]
- 💬 社区讨论: [Discord/QQ群]

## 下一步

1. **配置开发环境**: 完成上述环境搭建
2. **运行示例数据**: 执行种子数据脚本
3. **探索API**: 使用Postman测试接口
4. **开始开发**: 查看[tasks.md](tasks.md)了解开发任务
5. **阅读文档**: 深入了解[数据模型](data-model.md)和[API契约](contracts/api-spec.yaml)

**Ready for Development! 🚀**