# 项目交互指导文档 (QWEN.md)

## 项目概述

这是一个**奶茶店管理信息系统**项目，采用现代化前后端分离架构。该项目基于**Spec-Driven Development (SDD)**方法论，使用Next.js和NestJS技术栈构建。

### 项目定位
- **业务领域**：餐饮行业（奶茶店）管理系统
- **架构模式**：前后端分离架构
- **开发理念**：Spec-Driven Development + vibe coding
- **当前状态**：项目初始化阶段，已创建基础文档

## 技术栈分析

### 前端技术
- **Next.js** - React全栈框架
- **TypeScript** - 类型安全
- **响应式设计** - 多端支持

### 后端技术
- **NestJS** - TypeScript后端框架
- **模块化架构** - 清晰的代码组织
- **TypeORM** - 数据库ORM
- **RESTful API** - 标准接口设计

### 开发工具
- **Vite** - 现代构建工具（从.gitignore推断）
- **Node.js生态** - npm包管理
- **Git版本控制** - 分支开发模式

## 目录结构

```
D:\02_Dev\Workspace\GitHub\demo\
├── .git/                    # Git版本控制
├── .gitattributes          # Git属性配置
├── .gitignore              # Git忽略规则
├── .vite/                  # Vite构建工具缓存（空目录）
├── node_modules/           # Node.js依赖包（忽略）
├── QWEN.md                 # 本文件 - 项目交互指导
└── README.md               # 项目说明文档
```

## 分支管理

### 当前分支
- **milktea** - 奶茶店项目主分支（当前活动分支）

### 其他分支
- **main** - 主分支
- **MetalSlug鍚堥噾寮瑰ご** - 其他项目分支（合金弹头相关？）

### 分支策略
- 采用功能分支开发模式
- milktea分支用于奶茶店项目开发
- 主分支用于稳定版本维护

## 开发方法论

### Spec-Driven Development (SDD)
基于GitHub [spec-kit](https://github.com/github/spec-kit)框架：

1. **规范先行** - 先制定接口和契约规范
2. **契约测试** - 通过测试验证规范
3. **文档驱动** - 代码与文档同步
4. **协作优先** - 基于规范的团队协作

### vibe coding理念
- **一致性** - 统一代码风格和架构
- **协作性** - 促进团队协作
- **可维护性** - 清晰的代码结构
- **可扩展性** - 模块化设计

## 项目规划

### 目标功能模块
#### 核心业务功能
- **菜单管理** - 产品信息维护
- **订单管理** - 订单处理流程
- **库存管理** - 原料库存控制
- **会员管理** - 客户信息管理
- **数据统计** - 销售数据分析

#### 管理功能
- **员工管理** - 人员权限控制
- **门店设置** - 店铺配置信息
- **财务统计** - 营收成本分析
- **系统配置** - 系统参数设置

### 计划项目结构
```
milktea/
├── frontend/          # Next.js前端应用
├── backend/           # NestJS后端应用
├── docs/              # 项目文档
├── specs/             # 规范文档
└── tests/             # 测试文件
```

## 构建和运行

### 当前状态
- **项目阶段**：初始化阶段
- **代码量**：仅基础配置文件
- **依赖管理**：已配置.gitignore忽略规则

### 后续开发指令
当项目进入开发阶段时，可以使用以下命令：

```bash
# 安装依赖
npm install
# 或
yarn install

# 开发模式运行
npm run dev
# 或
yarn dev

# 构建项目
npm run build
# 或
yarn build

# 运行测试
npm test
# 或
yarn test
```

## 开发规范

### 代码规范
- 遵循统一的编码标准
- 使用TypeScript确保类型安全
- 采用模块化架构设计

### 接口规范
- RESTful API设计原则
- 统一的响应格式
- 规范的错误处理

### 数据库规范
- 统一的数据模型设计
- 规范的命名约定
- 数据一致性保证

### 测试规范
- 单元测试覆盖
- 集成测试验证
- 契约测试确保接口正确

## Git工作流

### 提交规范
采用约定式提交格式：
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

示例：
```
feat: 添加用户登录功能
fix: 修复订单状态更新bug
docs: 更新API文档
```

### 忽略规则
项目已配置完整的.gitignore文件，包含：
- 依赖目录（node_modules/）
- 构建输出（dist/, build/, out/）
- 环境配置文件（.env*）
- 编辑器和IDE配置
- 操作系统临时文件
- 日志和缓存文件

## 交互指导

### 当需要开发功能时
1. 确认当前在milktea分支
2. 基于Spec-Driven Development制定规范
3. 创建对应的功能分支
4. 实现功能并编写测试
5. 提交并合并到milktea分支

### 当需要技术支持时
1. 参考README.md了解项目概述
2. 检查specs/目录下的规范文档
3. 查看tests/目录了解测试策略
4. 遵循vibe coding理念进行开发

### 注意事项
- 项目处于早期阶段，很多目录和文件还未创建
- 当前只有基础文档和配置文件
- 实际开发需要先建立前后端项目结构
- 建议遵循Spec-Driven Development流程

## 许可证
项目采用MIT许可证（根据README.md）