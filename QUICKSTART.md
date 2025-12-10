# 快速开始指南

## 数据库配置快速设置

### 1. 环境变量配置

NestJS支持从环境变量中读取数据库配置，完全兼容Spring Boot风格。

#### Spring Boot配置转换示例

**Spring Boot原始配置:**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/copyright?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=utf8&createDatabaseIfNotExist=true&useAffectedRows=true
spring.datasource.username=root
spring.datasource.password=
```

**NestJS环境变量配置:**
```bash
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=copyright
DB_USERNAME=root
DB_PASSWORD=

# MySQL连接参数 (从JDBC URL解析)
DB_USE_SSL=false
DB_SERVER_TIMEZONE=Asia/Shanghai
DB_ALLOW_PUBLIC_KEY_RETRIEVAL=true
DB_USE_UNICODE=true
DB_CHARACTER_ENCODING=utf8
DB_CREATE_DATABASE_IF_NOT_EXIST=true
DB_USE_AFFECTED_ROWS=true
```

### 2. 快速启动步骤

#### 步骤1: 配置环境变量
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入你的数据库配置
```

#### 步骤2: 测试数据库连接
```bash
npm run db:test
```

#### 步骤3: 运行数据库迁移和种子数据
```bash
npm run db:migrate
npm run db:seed
```

#### 步骤4: 启动服务
```bash
npm run start:dev
```

### 3. 常用数据库命令

```bash
npm run db:test      # 测试数据库连接
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 填充初始数据
npm run db:reset     # 重置数据库 (如需要)
```

### 4. 支持的数据库类型

- **MySQL 8.0+** (推荐生产环境)
- **SQLite** (开发/测试环境)
- **PostgreSQL** (如需要)

### 5. 环境变量优先级

1. 系统环境变量 (最高)
2. .env文件 (开发)
3. 默认值 (最低)

### 6. 故障排除

**连接失败:**
- 检查MySQL服务是否运行
- 验证用户名密码
- 检查防火墙设置

**字符集问题:**
- 确保 `DB_CHARACTER_ENCODING=utf8`
- 检查数据库字符集设置

**时区问题:**
- 设置 `DB_SERVER_TIMEZONE=Asia/Shanghai`

更多详细信息请查看: `docs/database-config-guide.md`