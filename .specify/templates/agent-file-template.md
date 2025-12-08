# 奶茶店管理信息系统 开发指南

Auto-generated from all feature plans. Last updated: [DATE]

## 核心宪法原则

### 强制约束 (不可协商)
- 所有Git操作必须获得用户明确授权
- Git Bash环境下使用/dev/null而非nul
- 文档、代码注释和沟通使用中文

### 开发原则
- 无历史包袱：无需向后兼容
- 最少文件：避免不必要的抽象层
- 最全功能：完整实现，不偷工减料
- 最简代码：直接实现方式，积极重构
- 函数级测试：以函数/方法为最小测试单元

### 文档规范
- 变更记录：custom-features/变更日志.md
- 优先查阅：实现前查看变更日志
- 同步更新：代码变更与文档同步提交

### 变更管理规范
- 需求文档：custom-features/requirements/REQ-YYYYMMDD-功能名称.md
- 实现文档：custom-features/components/组件名称_技术方案.md
- 完整记录：日期、类型、简介、链接、变更内容、影响范围

## 活跃技术栈

[EXTRACTED FROM ALL PLAN.MD FILES]

## 项目结构

```text
[ACTUAL STRUCTURE FROM PLANS]
```

## 定制化功能目录结构

```text
custom-features/
├── 变更日志.md          # 变更索引总览 (必读)
├── requirements/        # 需求分析文档
│   └── REQ-YYYYMMDD-功能名称.md
└── components/         # 组件实现文档
    └── 组件名称_配置指南.md
```

## 核心命令

[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]

## 代码规范

- **语言**: 主要使用TypeScript (Next.js/NestJS)
- **注释**: 全程中文注释
- **文档**: Markdown格式，使用中文
- **测试**: 单元测试优先，集成测试验证

## 最近变更

[LAST 3 FEATURES AND WHAT THEY ADDED]

<!-- MANUAL ADDITIONS START -->
<!-- 手动添加的内容开始 -->
宪法更新至 v1.0.0 (2025-12-08):
- 新增强制约束章节，定义不可协商规则
- 明确开发原则，强调MVP和最简实现
- 建立变更管理规范，确保功能追踪
- 强化质量保证要求，测试驱动开发
<!-- 手动添加的内容结束 -->
<!-- MANUAL ADDITIONS END -->
