<!--
# Constitution Sync Impact Report

## Version Changes
- Old Version: (Initial Creation)
- New Version: 1.0.0
- Bump Type: MAJOR (Initial constitution establishment)

## Modified Principles
- N/A (Initial creation)

## Added Sections
- I. 强制约束 (强制约束和不可协商规则)
- II. 开发原则 (核心开发指导原则)
- III. 文档规范 (文档质量和一致性要求)
- IV. 变更管理规范 (定制化功能变更流程)
- V. 质量保证 (代码质量和系统可靠性标准)
- 技术规范 (项目技术栈和开发标准)
- 开发流程 (标准化开发流程)
- 治理规则 (宪法执行和变更管理机制)

## Removed Sections
- N/A (Initial creation)

## Templates Requiring Updates
- ✅ Updated: .specify/memory/constitution.md (Primary constitution file)
- ⚠ Pending: .specify/templates/plan-template.md (Template exists but content not reviewed)
- ⚠ Pending: .specify/templates/spec-template.md (Template exists but content not reviewed)
- ⚠ Pending: .specify/templates/tasks-template.md (Template exists but content not reviewed)
- ⚠ Pending: .specify/templates/agent-file-template.md (Template exists but may need updates)

## Follow-up TODOs
- Review and update template files to align with new constitution principles
- Create custom-features directory structure as specified in变更管理规范
- Update README.md references if needed to align with new constitution
- Consider creating guidance document for runtime development (referenced in 治理规则)

## Deferred Items
- None (All placeholders filled with concrete values)
-->

# 奶茶店管理信息系统 项目宪法

## 核心原则

### I. 强制约束
**所有开发活动必须遵守的不可协商约束**：
- 禁止未授权Git操作：所有git add/commit/push/merge等操作必须获得用户明确授权
- 禁止使用Windows语法：Git Bash环境下使用/dev/null而非nul，避免创建无法删除的文件
- 中文沟通原则：始终使用中文与我沟通交流，并且所产出的文档也使用中文，代码注释也使用中文

### II. 开发原则
**指导代码设计和实现的核心原则**：
- 无历史包袱原则：无需向后兼容、无需迁移脚本、无需保留旧代码
- 最少文件原则：避免创建不必要的文件、抽象层、工具类
- 最全功能原则：实现完整功能，不偷工减料
- 最简代码原则：使用最直接的实现方式，积极重构删除冗余
- 函数级测试原则：以函数/方法为最小测试单元，及时执行单元测试

### III. 文档规范
**确保项目文档质量和一致性的规范**：
- 变更必须记录：所有定制化功能必须在custom-features/变更日志.md中记录
- 优先查阅变更日志：实现功能前先查看对应模块的变更日志
- 代码与文档同步：代码变更和文档更新必须在同一次提交

### IV. 变更管理规范
**定制化功能变更的完整流程管理**：
- 需求阶段(可选)：在custom-features/requirements/创建需求文档，命名格式：REQ-YYYYMMDD-功能名称.md
- 实现阶段(必需)：在custom-features/components/创建实现文档，命名格式：组件名称_技术方案.md或组件名称_配置指南.md
- 变更日志更新(必需)：在custom-features/变更日志.md添加变更记录，包含日期、类型、简介、详细文档链接、变更内容、影响范围

### V. 质量保证
**确保代码质量和系统可靠性的标准**：
- 单元测试驱动：每完成一个MVP单元，立即运行集成测试
- MVP优先原则：确保每个功能模块的最小可用版本优先实现
- 集成验证：在功能完成后进行完整的集成测试验证

## 技术规范
**项目技术栈和开发标准**：
- 前端技术：Next.js框架，支持TypeScript，响应式设计
- 后端技术：NestJS框架，模块化架构，TypeORM数据库操作
- API设计：RESTful接口标准，统一的响应格式
- 开发方法论：Spec-Driven Development (SDD)，基于GitHub spec-kit框架

## 开发流程
**从需求到部署的标准化流程**：
- 规范先行：编码前先制定清晰的规范和契约
- 契约测试：通过测试验证接口和规范的正确性
- 文档驱动：代码与文档保持同步更新
- 协作优先：团队成员基于规范进行高效协作

## 治理规则
**宪法执行和变更管理机制**：
- 宪法优先：本宪法优先于所有其他开发实践和规范
- 变更审批：宪法修订需要完整的文档记录、审批流程和迁移计划
- 合规检查：所有代码评审必须验证对宪法的合规性
- 版本管理：宪法修订遵循语义化版本控制(MAJOR.MINOR.PATCH)

**Version**: 1.0.0 | **Ratified**: 2025-12-08 | **Last Amended**: 2025-12-08
