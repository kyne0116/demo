# 奶茶店销售管理系统 - 快速启动指南

## 🚀 项目概述

这是一个现代化的奶茶店销售管理系统，采用前后端分离架构，支持完整的奶茶店运营流程。

## 🛠 技术栈

### 后端
- **NestJS** - Node.js框架
- **TypeScript** - 类型安全
- **TypeORM** - 数据库ORM
- **MySQL** - 关系型数据库
- **JWT** - 身份认证
- **Swagger** - API文档

### 前端
- **Next.js 14** - React全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Hooks** - 状态管理

## 📋 快速启动

### 1. 环境准备

确保已安装：
- Node.js (>= 18.0.0)
- npm 或 yarn
- MySQL (>= 8.0)

### 2. 数据库配置

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE milktea_db;
```

### 3. 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接信息

# 运行数据库迁移
npm run migration:run

# 启动开发服务器
npm run start:dev
```

后端服务将在 `http://localhost:3000` 启动

### 4. 前端启动

```bash
# 进入前端目录（新建终端）
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:3001` 启动

## 🔐 测试账户

系统预置了两个测试账户：

### 管理员账户
- **邮箱**: admin@milktea.com
- **密码**: admin123
- **角色**: owner（店主）

### 店员账户
- **邮箱**: staff@milktea.com  
- **密码**: staff123
- **角色**: staff（普通店员）

## 📊 系统功能

### 核心模块
- ✅ **用户认证** - JWT登录注册
- ✅ **产品管理** - 产品CRUD、分类管理
- ✅ **订单处理** - 订单创建、状态更新
- ✅ **库存管理** - 基础库存实体
- ✅ **会员系统** - 会员档案管理

### 权限控制
- **客户 (customer)** - 查看产品、创建订单
- **店员 (staff)** - 处理订单、管理产品
- **经理 (manager)** - 高级管理功能
- **店主 (owner)** - 全部系统功能

## 🎯 下一步开发

基础架构已完成，可以开始实现用户故事：

1. **P1 客户购物结账** - 核心业务逻辑
2. **P2 会员信息管理** - 积分和会员权益
3. **P3 店员权限管理** - 角色和权限系统
4. **P4 产品和库存管理** - 完整的库存管理
5. **P5 销售数据统计** - 数据分析和报表

## 📚 相关文档

- [功能规范](../specs/001-milktea-pos/spec.md)
- [API文档](../specs/001-milktea-pos/contracts/api-spec.yaml)  
- [数据模型](../specs/001-milktea-pos/data-model.md)
- [任务分解](../specs/001-milktea-pos/tasks.md)
- [变更日志](../custom-features/变更日志.md)

## 🐛 问题排查

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否运行
   - 验证.env文件中的数据库配置
   - 确保数据库已创建

2. **前端无法连接后端**
   - 确认后端服务正在运行
   - 检查API代理配置
   - 查看浏览器控制台错误信息

3. **登录失败**
   - 使用预置的测试账户
   - 检查前端和后端是否都正常运行
   - 确认JWT密钥配置正确

### 调试模式

```bash
# 后端调试模式
DEBUG=nestjs:* npm run start:dev

# 前端调试模式
NEXT_PUBLIC_DEBUG=true npm run dev
```

## 📞 技术支持

如遇到问题，请：
1. 查看[API文档](http://localhost:3000/api)
2. 检查[变更日志](../custom-features/变更日志.md)
3. 参考[任务分解文档](../specs/001-milktea-pos/tasks.md)

---

**构建现代化奶茶店管理系统，提升运营效率！** 🧋✨