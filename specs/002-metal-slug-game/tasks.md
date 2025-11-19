# Tasks: 合金弹头风格2D横版射击游戏

**Input**: Design documents from `/specs/002-metal-slug-game/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/
**Technology Stack**: TypeScript + HTML5 Canvas + Vite

**Tests**: 测试任务包含在每个用户故事中，采用测试驱动开发方式

**Organization**: 任务按用户故事组织，支持独立实现和测试

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 用户故事标识 (US1, US2, US3)
- 包含具体文件路径

## Path Conventions

- **项目根目录**: `src/`, `tests/` 
- **游戏核心**: `src/game/entities/`, `src/game/systems/`, `src/game/scenes/`
- **UI系统**: `src/ui/`, `src/ui/menus/`, `src/ui/hud/`
- **服务层**: `src/services/`
- **配置**: `src/config/`

## Phase 1: Setup (项目初始化)

**Purpose**: 项目初始化和基础架构搭建

- [ ] T001 初始化Vite + TypeScript项目配置 (vite.config.ts, tsconfig.json)
- [ ] T002 创建项目目录结构 (按轻量级游戏架构)
- [ ] T003 [P] 配置ESLint和Prettier代码规范工具
- [ ] T004 [P] 设置Jest单元测试框架配置
- [ ] T005 配置Cypress端到端测试框架
- [ ] T006 创建基础HTML页面和Canvas元素 (public/index.html)
- [ ] T007 配置游戏资源目录 (public/assets/images, sounds, data)

**Checkpoint**: 项目环境搭建完成，可以开始核心开发

---

## Phase 2: Foundational (基础系统)

**Purpose**: 核心基础设施，必须在所有用户故事前完成

**⚠️ CRITICAL**: 在用户故事实现前必须完成此阶段

- [ ] T008 实现基础类型定义 (src/types/game.ts)
- [ ] T009 [P] 创建Vector2和Math工具类 (src/utils/math.ts)
- [ ] T010 [P] 实现输入系统基础框架 (src/services/input/InputManager.ts)
- [ ] T011 [P] 实现物理系统核心类 (src/game/systems/PhysicsSystem.ts)
- [ ] T012 [P] 创建渲染系统基础框架 (src/game/systems/RenderSystem.ts)
- [ ] T013 [P] 实现游戏循环系统 (src/game/systems/GameLoop.ts)
- [ ] T014 [P] 创建事件系统 (src/game/systems/EventSystem.ts)
- [ ] T015 实现游戏状态管理器 (src/game/core/GameStateManager.ts)
- [ ] T016 [P] 实现基础音效系统 (src/services/audio/AudioSystem.ts)
- [ ] T017 [P] 实现存档系统 (src/services/save/SaveSystem.ts)
- [ ] T018 创建基础配置管理器 (src/config/GameConfig.ts)

**Checkpoint**: 所有游戏核心系统就绪，用户故事开发可以开始

---

## Phase 3: User Story 1 - 基础游戏体验 (Priority: P1) 🎯 MVP

**Goal**: 实现基础游戏核心机制：玩家控制、基本敌人、射击、分数和关卡完成

**Independent Test**: 玩家可以完成一次完整关卡流程：开始游戏 → WASD移动 → 射击消灭敌人 → 到达终点 → 显示分数

### Tests for User Story 1 (测试驱动开发) ⚠️

> **NOTE: 先写测试，确保测试失败后再实现**

- [ ] T019 [P] [US1] 编写Player实体单元测试 (tests/unit/entities/Player.test.ts)
- [ ] T020 [P] [US1] 编写基础Enemy实体单元测试 (tests/unit/entities/Enemy.test.ts)
- [ ] T021 [P] [US1] 编写InputSystem单元测试 (tests/unit/systems/InputSystem.test.ts)
- [ ] T022 [P] [US1] 编写物理系统单元测试 (tests/unit/systems/PhysicsSystem.test.ts)
- [ ] T023 [US1] 编写关卡完成集成测试 (tests/integration/LevelComplete.test.ts)

### Implementation for User Story 1

- [ ] T024 [P] [US1] 创建Player实体类 (src/game/entities/Player.ts)
- [ ] T025 [P] [US1] 创建基础Enemy实体类 (src/game/entities/BasicEnemy.ts)
- [ ] T026 [P] [US1] 创建Bullet实体类 (src/game/entities/Bullet.ts)
- [ ] T027 [P] [US1] 实现Weapon基础类 (src/game/entities/Weapon.ts)
- [ ] T028 [US1] 实现玩家控制器 (src/game/controllers/PlayerController.ts)
- [ ] T029 [US1] 实现基础敌人AI (src/game/ai/BasicAI.ts)
- [ ] T030 [US1] 创建关卡1数据配置 (public/assets/levels/level1.json)
- [ ] T031 [US1] 实现关卡管理系统 (src/game/systems/LevelSystem.ts)
- [ ] T032 [US1] 实现分数系统 (src/game/systems/ScoreSystem.ts)
- [ ] T033 [US1] 创建游戏HUD界面 (src/ui/hud/GameHUD.ts)
- [ ] T034 [US1] 实现游戏主菜单 (src/ui/menus/MainMenu.ts)
- [ ] T035 [US1] 集成所有系统并实现主游戏类 (src/game/MetalSlugGame.ts)

**Checkpoint**: 用户故事1完全功能性和独立可测试性

---

## Phase 4: User Story 2 - 敌人AI和多样性 (Priority: P2)

**Goal**: 扩展敌人系统，实现多种敌人类型、独特AI行为和多样化战斗体验

**Independent Test**: 玩家可以在一次关卡中遇到至少3种不同类型的敌人，每种都有不同的行为模式和消灭方式

### Tests for User Story 2 (测试驱动开发) ⚠️

- [ ] T036 [P] [US2] 编写HeavyTank实体单元测试 (tests/unit/entities/HeavyTank.test.ts)
- [ ] T037 [P] [US2] 编写FastJet实体单元测试 (tests/unit/entities/FastJet.test.ts)
- [ ] T038 [P] [US2] 编写AI行为单元测试 (tests/unit/ai/AIBehaviors.test.ts)
- [ ] T039 [US2] 编写敌人多样性集成测试 (tests/integration/EnemyDiversity.test.ts)

### Implementation for User Story 2

- [ ] T040 [P] [US2] 创建重型坦克敌人实体 (src/game/entities/HeavyTank.ts)
- [ ] T041 [P] [US2] 创建快速飞机敌人实体 (src/game/entities/FastJet.ts)
- [ ] T042 [P] [US2] 实现Boss敌人实体 (src/game/entities/BossEnemy.ts)
- [ ] T043 [US2] 实现巡逻AI行为 (src/game/ai/PatrolAI.ts)
- [ ] T044 [US2] 实现追击AI行为 (src/game/ai/ChaseAI.ts)
- [ ] T045 [US2] 实现射击AI行为 (src/game/ai/ShootAI.ts)
- [ ] T046 [US2] 实现敌人类型工厂 (src/game/factories/EnemyFactory.ts)
- [ ] T047 [US2] 更新关卡2配置包含新敌人类型 (public/assets/levels/level2.json)
- [ ] T048 [US2] 增强敌人动画和死亡效果 (src/game/systems/AnimationSystem.ts)
- [ ] T049 [US2] 实现敌人血量显示UI (src/ui/hud/EnemyHealthBar.ts)

**Checkpoint**: 用户故事2完成，敌人多样性系统正常运行

---

## Phase 5: User Story 3 - 道具收集和升级系统 (Priority: P3)

**Goal**: 实现道具收集、武器升级、生命恢复和特殊增强系统

**Independent Test**: 玩家可以在一次游戏过程中发现和使用至少3种不同类型的道具，每种都有明确的效果

### Tests for User Story 3 (测试驱动开发) ⚠️

- [ ] T050 [P] [US3] 编写Item实体单元测试 (tests/unit/entities/Item.test.ts)
- [ ] T051 [P] [US3] 编写WeaponUpgrade系统单元测试 (tests/unit/systems/WeaponUpgrade.test.ts)
- [ ] T052 [P] [US3] 编写Inventory系统单元测试 (tests/unit/systems/Inventory.test.ts)
- [ ] T053 [US3] 编写道具收集集成测试 (tests/integration/ItemCollection.test.ts)

### Implementation for User Story 3

- [ ] T054 [P] [US3] 创建Item实体基类 (src/game/entities/Item.ts)
- [ ] T055 [P] [US3] 实现生命恢复道具 (src/game/entities/HealthPack.ts)
- [ ] T056 [P] [US3] 实现武器升级道具 (src/game/entities/WeaponUpgrade.ts)
- [ ] T057 [P] [US3] 实现分数加成道具 (src/game/entities/ScoreBonus.ts)
- [ ] T058 [P] [US3] 创建散弹枪武器类型 (src/game/entities/Shotgun.ts)
- [ ] T059 [P] [US3] 创建机枪武器类型 (src/game/entities/MachineGun.ts)
- [ ] T060 [US3] 实现武器升级系统 (src/game/systems/WeaponUpgradeSystem.ts)
- [ ] T061 [US3] 实现玩家背包系统 (src/game/systems/InventorySystem.ts)
- [ ] T062 [US3] 创建道具生成器 (src/game/factories/ItemFactory.ts)
- [ ] T063 [US3] 更新关卡3配置包含道具分布 (public/assets/levels/level3.json)
- [ ] T064 [US3] 实现道具收集UI效果 (src/ui/effects/ItemCollectionEffect.ts)
- [ ] T065 [US3] 创建武器切换界面 (src/ui/menus/WeaponMenu.ts)

**Checkpoint**: 用户故事3完成，道具收集和升级系统完全功能

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进和优化工作

**文档同步约束（宪法第十一条）**:
- [ ] T066 在custom-features/变更日志.md中记录所有定制化功能
- [ ] T067 [P] 同步更新游戏README和API文档
- [ ] T068 验证代码和文档在同一次提交中更新

**性能优化**:
- [ ] T069 实现Canvas渲染性能优化 (对象池、离屏渲染)
- [ ] T070 实现60FPS性能监控系统 (src/utils/PerformanceMonitor.ts)
- [ ] T071 [P] 优化内存管理和垃圾回收
- [ ] T072 实现多敌人同时出现的性能优化

**质量提升**:
- [ ] T073 代码清理和重构（最简代码原则）
- [ ] T074 [P] 补充单元测试覆盖率到80%+
- [ ] T075 实现像素艺术风格的美术优化
- [ ] T076 实现游戏设置界面 (src/ui/menus/SettingsMenu.ts)

**用户体验优化**:
- [ ] T077 实现暂停功能和完善UI
- [ ] T078 实现成就系统 (src/game/systems/AchievementSystem.ts)
- [ ] T079 实现音效完善 (射击、爆炸、收集音效)
- [ ] T080 运行quickstart.md验证和最终测试

**Git操作授权**:
- [ ] T081 确认所有代码变更都已获得用户授权

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - 阻塞所有用户故事
- **User Stories (Phase 3-5)**: 都依赖Foundational阶段完成
  - 用户故事可以并行进行（如果有开发资源）
  - 或按优先级顺序进行 (P1 → P2 → P3)
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完成后即可开始 - 无其他故事依赖
- **User Story 2 (P2)**: Foundational完成后即可开始 - 可以独立测试
- **User Story 3 (P3)**: Foundational完成后即可开始 - 可以独立测试

### Within Each User Story

**测试驱动开发约束（宪法第八条）**:
- 单元测试必须在实现前编写并确保失败
- 集成测试必须在每个MVP单元完成后立即运行
- 测试文件使用中文注释和描述

**实现顺序**:
- 实体创建（Entities）→ 系统实现（Systems）→ 控制器（Controllers）
- 核心实现 → 集成测试 → UI集成
- 每个故事完成后必须能独立运行

**中文使用约束（宪法第三条）**:
- 所有任务描述使用中文
- 测试用例和注释使用中文
- 变更日志使用中文记录

### Parallel Opportunities

- 所有Setup任务标记[P]可以并行执行
- 所有Foundational任务标记[P]可以并行执行
- 一旦Foundational阶段完成，所有用户故事可以并行开始
- 用户故事内的测试标记[P]可以并行
- 不同用户故事可以由不同开发者并行完成

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成Phase 1: Setup
2. 完成Phase 2: Foundational (关键 - 阻塞所有故事)
3. 完成Phase 3: User Story 1
4. **停止和验证**: 独立测试User Story 1
5. 部署/演示MVP

### Incremental Delivery

1. 完成Setup + Foundational → 基础就绪
2. 添加User Story 1 → 独立测试 → 部署/演示 (MVP!)
3. 添加User Story 2 → 独立测试 → 部署/演示
4. 添加User Story 3 → 独立测试 → 部署/演示
5. 每个故事都增加价值而不破坏之前的故事

### Parallel Team Strategy

多开发者协作：

1. 团队共同完成Setup + Foundational
2. Foundational完成后：
   - 开发者A: User Story 1
   - 开发者B: User Story 2  
   - 开发者C: User Story 3
3. 故事独立完成和集成

---

## Notes

- [P] 任务 = 不同文件，无依赖
- [Story] 标签映射到特定用户故事用于可追溯性
- 每个用户故事应该独立可完成和可测试
- 确保测试在实现前失败
- 每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免：模糊任务、同一文件冲突、破坏独立性的跨故事依赖
