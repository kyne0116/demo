# 奶茶店管理信息系统

## 项目概述

这是一个基于现代化技术栈构建的奶茶店管理信息系统，采用前后端分离架构，旨在提供完整的奶茶店运营管理解决方案。

## 技术栈

### 前端技术
- **Next.js** - React框架，提供服务端渲染、静态生成等现代化前端能力
- 支持TypeScript，提供类型安全
- 响应式设计，支持多端访问

### 后端技术
- **NestJS** - 基于TypeScript的Node.js后端框架
- 采用模块化架构设计
- 集成TypeORM进行数据库操作
- 提供RESTful API接口

## 开发方法论

### Spec-Driven Development (SDD)

本项目采用**Spec-Driven Development**实践方法论，基于GitHub的[spec-kit](https://github.com/github/spec-kit)框架进行开发。

#### 核心原则

1. **规范先行** - 在编码前先制定清晰的规范和契约
2. **契约测试** - 通过测试验证接口和规范的正确性
3. **文档驱动** - 代码与文档保持同步更新
4. **协作优先** - 团队成员基于规范进行高效协作

#### vibe coding

项目开发过程中遵循**vibe coding**理念：

- **一致性** - 统一的代码风格和架构模式
- **协作性** - 通过规范促进团队协作
- **可维护性** - 清晰的代码结构和文档
- **可扩展性** - 模块化设计支持功能扩展

## 功能模块

### 核心功能
- 菜单管理
- 订单管理
- 库存管理
- 会员管理
- 数据统计

### 管理功能
- 员工管理
- 门店设置
- 财务统计
- 系统配置

## 项目结构

```
milktea/
├── frontend/          # Next.js前端应用
├── backend/           # NestJS后端应用
├── docs/              # 项目文档
├── specs/             # 规范文档
└── tests/             # 测试文件
```

## 开发规范

1. **代码规范** - 遵循统一的编码标准
2. **接口规范** - RESTful API设计规范
3. **数据库规范** - 统一的数据库设计原则
4. **测试规范** - 单元测试和集成测试标准

## 部署与启动

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 (或使用 yarn/pnpm)
- **数据库**: SQLite (开发环境) / MySQL/PostgreSQL (生产环境)

### 快速启动

#### 1. 克隆项目
```bash
git clone <repository-url>
cd demo
```

#### 2. 安装依赖

**后端依赖**
```bash
cd backend
npm install
```

**前端依赖**
```bash
cd ../frontend
npm install
```

#### 3. 环境配置

**后端环境变量**
```bash
cd backend
cp .env.example .env
```

**数据库配置选项:**

**选项1: MySQL (推荐生产环境)**
```env
# 数据库连接信息
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=copyright
DB_USERNAME=root
DB_PASSWORD=

# MySQL JDBC连接参数
DB_USE_SSL=false
DB_SERVER_TIMEZONE=Asia/Shanghai
DB_ALLOW_PUBLIC_KEY_RETRIEVAL=true
DB_USE_UNICODE=true
DB_CHARACTER_ENCODING=utf8
DB_CREATE_DATABASE_IF_NOT_EXIST=true
DB_USE_AFFECTED_ROWS=true

# 连接池配置
DB_CONNECTION_TIMEOUT=30000
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=3000

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 应用配置
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**选项2: SQLite (开发环境)**
```env
# 数据库配置 (使用SQLite)
DB_TYPE=sqlite
DB_DATABASE=./data/milktea.db

# 其他配置保持不变
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=3001
```

**快速配置数据库连接:**
```bash
# 测试数据库连接
cd backend
npm run db:test
```

**前端环境变量**
```bash
cd ../frontend
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=奶茶店管理系统
```

#### 4. 数据库初始化

**MySQL环境 (推荐)**
```bash
cd backend

# 测试数据库连接
npm run db:test

# 如果测试成功，运行迁移和种子数据
npm run db:migrate
npm run db:seed
```

**SQLite环境 (开发测试)**
```bash
cd backend

# SQLite不需要数据库连接测试
# 直接运行迁移和种子数据
npm run db:migrate
npm run db:seed
```

**数据库管理命令:**
```bash
npm run db:test      # 测试数据库连接
npm run db:check     # 检查数据库状态 (同db:test)
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 填充初始数据
npm run db:reset     # 重置数据库 (如需要)
```

#### 5. 启动服务

**开发模式启动**
```bash
# 启动后端服务 (端口 3001)
cd backend
npm run start:dev

# 启动前端服务 (端口 3000) - 新开终端窗口
cd frontend
npm run dev
```

**生产模式启动**
```bash
# 构建和启动后端
cd backend
npm run build
npm run start:prod

# 构建和启动前端
cd frontend
npm run build
npm run start
```

### 数据初始化

#### 管理员账户
项目首次启动时会自动创建默认管理员账户：

- **用户名**: admin
- **密码**: admin123
- **角色**: 系统管理员

#### 示例数据
运行种子脚本后会创建以下示例数据：

- **产品数据**: 20+种奶茶和配料产品
- **库存数据**: 基础原料库存记录
- **会员数据**: 示例会员账户
- **订单数据**: 历史订单记录

#### 重置数据
如需重新初始化数据：
```bash
cd backend
npm run db:reset
npm run db:seed
```

### 系统访问

#### 前端访问
- **开发环境**: http://localhost:3000
- **生产环境**: http://your-domain.com

#### 后端API
- **开发环境**: http://localhost:3001
- **API文档**: http://localhost:3001/api/docs (如启用Swagger)

#### 管理员登录
1. 访问管理员登录页面
2. 使用默认账户登录：
   - 用户名: `admin`
   - 密码: `admin123`
3. 登录后可以访问所有管理功能

#### 常用功能入口
- **订单管理**: `/admin/orders`
- **产品管理**: `/admin/products`
- **库存管理**: `/admin/inventory`
- **会员管理**: `/admin/members`
- **员工管理**: `/admin/staff`
- **库存监控**: `/admin/inventory/monitor`
- **制作管理**: `/admin/orders/production`
- **制作统计**: `/admin/orders/stats`

### 故障排除

#### 常见问题

**端口占用**
```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 终止占用进程
kill -9 <PID>
```

**数据库连接失败**
- 检查数据库服务是否运行
- 验证环境变量配置
- 确保数据库用户权限正确

**依赖安装失败**
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

**权限错误**
- 确保Node.js版本符合要求
- 检查文件系统权限
- 以管理员身份运行命令

#### 日志查看
```bash
# 后端日志
cd backend
tail -f logs/application.log

# 前端日志 (浏览器控制台)
# 在浏览器开发者工具中查看
```

### 生产部署

#### Docker部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### PM2部署 (后端)
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name milktea-backend

# 查看状态
pm2 status
pm2 logs milktea-backend
```

#### Nginx配置 (前端)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 监控和维护

#### 健康检查
- 前端: `GET /api/health`
- 后端: `GET /health`

#### 数据备份
```bash
# SQLite备份
cp backend/data/milktea.db backup/milktea-$(date +%Y%m%d).db

# MySQL备份
mysqldump -u username -p milktea_db > backup/milktea-$(date +%Y%m%d).sql
```

#### 性能监控
- 使用PM2监控后端性能
- 通过浏览器开发者工具监控前端性能
- 数据库性能监控 (如使用MySQL Workbench)

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件