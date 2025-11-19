# Implementation Plan: 合金弹头风格2D横版射击游戏

**Branch**: `002-metal-slug-game` | **Date**: 2025-11-19 | **Spec**: [Link to spec.md](D:\02_Dev\Workspace\GitHub\demo\specs\002-metal-slug-game/spec.md)
**Input**: Feature specification from `/specs/002-metal-slug-game/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

基于功能规范分析，这是一个基于Web浏览器的2D横版射击游戏，需要60FPS流畅运行，包含3个关卡、多种敌人类型、道具收集系统。核心技术需求包括Canvas渲染、实时输入处理、游戏状态管理和进度保存功能。

## 技术栈评估: Next.js + Nest.js 适用性分析

### 建议的技术栈: Next.js + Nest.js 评估结果

**前端评估 (Next.js)**:
- ✅ 优势: React生态系统成熟，TypeScript支持良好
- ⚠️ 考虑因素: 对于2D游戏可能过于重量级，增加不必要的页面路由复杂性
- 🔧 建议方案: 如选择Next.js，重点使用App Router + Canvas进行游戏渲染，简化页面结构

**后端评估 (Nest.js)**:
- ✅ 优势: TypeScript支持，架构清晰
- ❌ 劣势: 对小游戏后端过于复杂，增加开发和维护成本
- 🔧 建议方案: 考虑简化架构，使用Next.js API Routes + 轻量级数据存储

### 替代技术栈推荐

**方案A: 轻量级解决方案 (推荐)**
- 前端: HTML5 Canvas + TypeScript + Vite
- 后端: Next.js API Routes + JSON文件存储
- 优势: 开发简单，性能优秀，部署方便

**方案B: 游戏引擎方案**
- 前端: Phaser.js (2D游戏引擎) + TypeScript
- 后端: Next.js API Routes + 轻量数据库
- 优势: 专业游戏开发框架，丰富游戏相关功能

**方案C: 混合方案**
- 前端: Next.js + React Three Fiber (处理Canvas)
- 后端: Nest.js (如需要复杂后端逻辑)
- 优势: 平衡开发效率与架构清晰性

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.0+ / JavaScript ES2020+
**Primary Dependencies**:
- 前端: Vite 5+ / HTML5 Canvas API
- 游戏开发: Canvas 2D API / Web Audio API / Local Storage API
**Storage**:
- 游戏存档: LocalStorage API (本地存储)
- 静态资源: 本地文件存储/CDN
**Testing**:
- 单元测试: Jest + Testing Library
- 集成测试: Cypress (游戏端到端测试)
- 性能测试: 自定义60FPS性能监控
**Target Platform**: 现代Web浏览器 (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web游戏 - 需要前端为主，后端简化
**Performance Goals**:
- 60FPS稳定帧率
- 游戏响应时间 < 100ms
- 页面加载时间 < 3秒
- 内存使用 < 200MB
**Constraints**:
- 必须支持键盘(WASD)和鼠标输入
- 必须使用合金弹头风格像素艺术
- 单人游戏模式，无需复杂后端
- 离线可玩，进度保存为可选项
**Scale/Scope**:
- 目标用户: 1000+ 并发玩家
- 项目规模: 中小型 (预计 < 10k LOC)
- 功能范围: 3个关卡 + 基础游戏功能
- 开发周期: MVP 2-4周

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**强制约束检查**:
- ✅ 确认所有Git操作将获得用户明确授权（无历史包袱原则下允许大胆重构）
- ✅ 确认项目将使用中文进行文档编写和代码注释
- ✅ 确认在Git Bash环境下使用/dev/null而非nul

**开发原则检查**:
- ✅ 确认实现方案符合最简代码原则（避免过度抽象）- 已确定使用原生Canvas + TypeScript，避开Next.js/Nest.js重量级架构
- ✅ 确认项目结构符合最少文件原则 - 采用轻量级游戏结构，模块化设计，最小化依赖
- ✅ 确认每个功能都有完整实现计划（最全功能原则）- 所有游戏核心功能都已规划，包含详细API合同

**测试驱动开发**:
- ✅ 确认将为每个函数/方法编写单元测试
- ✅ 确认每个MVP单元完成后将运行集成测试
- ✅ 确认遵循"测试先行，代码实现"流程

**文档规范检查**:
- ✅ 确认将在custom-features/变更日志.md中记录所有定制化功能
- ✅ 确认代码变更和文档更新将在同一次提交中完成
- ✅ 确认开发前将查阅相关模块的变更日志

**设计阶段合规性确认**:
- ✅ 采用了最简技术栈：TypeScript + HTML5 Canvas + Vite
- ✅ 避免了不必要的框架复杂性（未使用Next.js和Nest.js）
- ✅ 确保了60FPS性能目标和模块化架构

## Project Structure

### Documentation (this feature)

```text
specs/002-metal-slug-game/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Lightweight Web Game Structure (RECOMMENDED)
src/
├── game/
│   ├── entities/        # 玩家角色、敌人、道具实体
│   ├── scenes/          # 游戏场景(关卡)
│   ├── systems/         # 游戏系统(物理、渲染、输入)
│   ├── assets/          # 游戏资源(图片、音效、关卡数据)
│   └── utils/           # 工具函数
├── ui/                  # 游戏UI界面
│   ├── menus/           # 主菜单、暂停菜单等
│   ├── hud/             # 血量、分数显示
│   └── components/      # UI组件
├── services/            # 服务层
│   ├── save/            # 存档系统
│   ├── audio/           # 音频系统
│   └── network/         # 网络服务(可选)
└── config/              # 配置文件

tests/
├── unit/                # 单元测试
├── integration/         # 集成测试
└── e2e/                 # 端到端测试

public/
├── assets/              # 静态资源
└── favicon.ico

docs/
├── gameplay/            # 游戏设计文档
└── api/                 # API文档(如有)
```

**Structure Decision**: 采用轻量级Web游戏结构，重点突出游戏核心逻辑，使用Canvas直接渲染，最小化框架依赖。采用TypeScript + Vite + HTML5 Canvas的技术栈，所有功能在前端实现。

## Phase 0: Research

需要研究的关键技术问题和解决方案：

### 核心技术研究任务

1. **HTML5 Canvas性能优化研究**
   - 60FPS稳定渲染的最佳实践
   - 内存管理和对象池技术
   - 渲染循环优化策略

2. **TypeScript游戏架构研究**
   - 游戏实体系统的类型设计模式
   - 状态管理模式
   - 游戏引擎集成方案

3. **轻量级游戏引擎评估**
   - Phaser.js vs 原生Canvas vs 其他轻量级引擎
   - 性能对比和功能适用性分析

4. **Web游戏存档系统研究**
   - LocalStorage vs IndexedDB vs 云存储
   - 数据压缩和加密方案
   - 跨平台兼容性

### 研究结果

#### 决策: 采用原生HTML5 Canvas + TypeScript + 轻量级架构

**理由**:
- 合金弹头风格游戏2D渲染需求简单，原生Canvas足以满足60FPS要求
- TypeScript提供类型安全，避免Next.js等框架的开销
- 简化架构符合项目宪法的"最简代码原则"

**替代方案考虑**:
- Next.js: 额外页面路由开销，不适合单页面游戏
- Nest.js: 后端架构过于复杂，小游戏项目不需要
- Phaser.js: 功能丰富但增加依赖，轻量级需求下不必要

#### 最佳实践整合

**Canvas优化策略**:
- 使用requestAnimationFrame控制渲染循环
- 对象池减少GC压力
- 离屏Canvas预渲染静态元素
- 分层渲染优化(背景、实体、UI分离)

**TypeScript架构模式**:
- 组件-实体系统(CES)模式
- 严格的类型定义避免运行时错误
- 模块化设计便于测试和维护

**存档系统设计**:
- LocalStorage作为主要存储方案
- JSON压缩和简单加密
- 自动保存和手动保存结合

## Phase 1: Design & Contracts

### 已完成的设计文档

#### 1. 数据模型 (data-model.md)
- ✅ 定义了8个核心实体：Player, Enemy, Weapon, Item, Bullet, Level, GameState, Achievement
- ✅ 建立了完整的实体关系图和状态转换图
- ✅ 设计了数据验证规则和存储方案
- ✅ 制定了性能优化考虑（对象池、空间分区等）

#### 2. 系统API合同 (contracts/game-system-apis.md)
- ✅ 定义了8个核心系统API：Input, Physics, Render, Audio, Save, GameLoop, Event, Level Management
- ✅ 建立了系统间通信接口：MessageBus, StateManager
- ✅ 设计了性能监控和错误处理接口
- ✅ 提供了完整的API使用示例

#### 3. 快速开始指南 (quickstart.md)
- ✅ 技术栈详细说明和项目结构
- ✅ 完整的安装、开发和部署指南
- ✅ 游戏开发模式最佳实践
- ✅ 性能优化策略和调试工具
- ✅ 常见问题解答和贡献指南

#### 4. 代理上下文更新
- ✅ 已更新Qwen代理上下文文件 (QWEN.md)
- ✅ 添加了TypeScript 5.0+技术栈信息
- ✅ 更新了项目类型为Web游戏开发
