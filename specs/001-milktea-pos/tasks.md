# Tasks: 奶茶店销售管理系统

**Input**: Design documents from `/specs/001-milktea-pos/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/
**Created**: 2025-12-08

**Tests**: 遵循测试驱动开发模式，每个用户故事包含单元测试和集成测试

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Shared**: `shared/types/`, `shared/utils/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Create backend project structure (NestJS modules: auth, users, products, orders, inventory, members, reports)
- [ ] T002 [P] Create frontend project structure (Next.js App Router: app, components, lib, types)
- [ ] T003 [P] Create shared project structure (shared types and utilities)
- [ ] T004 [P] Initialize NestJS backend with TypeScript configuration
- [ ] T005 [P] Initialize Next.js frontend with TypeScript and Tailwind CSS
- [ ] T006 [P] Configure linting and formatting tools (ESLint, Prettier)
- [ ] T007 [P] Setup Jest testing framework for both frontend and backend

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Setup PostgreSQL database connection and TypeORM configuration
- [ ] T009 Create database migration framework with initial schema
- [ ] T010 [P] Implement JWT authentication service and middleware
- [ ] T011 [P] Setup API routing structure with validation and error handling
- [ ] T012 [P] Create base User entity and repository pattern
- [ ] T013 [P] Implement logging infrastructure and error handling
- [ ] T014 [P] Setup environment configuration management
- [ ] T015 [P] Create shared TypeScript types and interfaces

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 客户购物结账 (Priority: P1) 🎯 MVP

**Goal**: 完整的客户购物流程，从产品浏览到订单确认

**Independent Test**: 可以独立测试完整的客户购物流程：从浏览产品、添加到购物车、选择会员折扣、完成订单确认到获取收据

### Tests for User Story 1 (TDD Required) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Contract test for GET /api/products endpoint in tests/contract/products.test.ts
- [ ] T017 [P] [US1] Contract test for POST /api/orders endpoint in tests/contract/orders.test.ts
- [ ] T018 [P] [US1] Integration test for customer checkout flow in tests/integration/customer-checkout.test.ts
- [ ] T019 [P] [US1] Unit test for order calculation service in tests/unit/orders/OrderCalculationService.test.ts

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create Product entity with TypeORM decorators in backend/src/modules/products/entities/Product.ts
- [ ] T021 [P] [US1] Create Category entity with TypeORM decorators in backend/src/modules/products/entities/Category.ts
- [ ] T022 [P] [US1] Create Order entity with TypeORM decorators in backend/src/modules/orders/entities/Order.ts
- [ ] T023 [P] [US1] Create OrderItem entity with TypeORM decorators in backend/src/modules/orders/entities/OrderItem.ts
- [ ] T024 [US1] Implement ProductsService with CRUD operations in backend/src/modules/products/products.service.ts
- [ ] T025 [US1] Implement OrdersService with order creation and calculation in backend/src/modules/orders/orders.service.ts
- [ ] T026 [US1] Implement ProductsController with REST endpoints in backend/src/modules/products/products.controller.ts
- [ ] T027 [US1] Implement OrdersController with REST endpoints in backend/src/modules/orders/orders.controller.ts
- [ ] T028 [US1] Create ProductList component in frontend/src/components/ProductList.tsx
- [ ] T029 [US1] Create ShoppingCart component in frontend/src/components/ShoppingCart.tsx
- [ ] T030 [US1] Create CheckoutPage in frontend/src/app/checkout/page.tsx
- [ ] T031 [US1] Implement API client utilities in frontend/src/lib/api.ts
- [ ] T032 [US1] Add validation schemas and error handling for US1 endpoints

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 会员信息管理 (Priority: P2)

**Goal**: 完整的会员管理功能，包括注册、积分累积、等级权益

**Independent Test**: 可以独立测试完整的会员生命周期：注册新会员、查看会员信息、积分累积、等级升级、权益使用

### Tests for User Story 2 (TDD Required) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T033 [P] [US2] Contract test for POST /api/members endpoint in tests/contract/members.test.ts
- [ ] T034 [P] [US2] Contract test for GET /api/members/:id endpoint in tests/contract/members.test.ts
- [ ] T035 [P] [US2] Integration test for member registration and point management in tests/integration/member-management.test.ts
- [ ] T036 [P] [US2] Unit test for MemberService with point calculation in tests/unit/members/MemberService.test.ts

### Implementation for User Story 2

- [ ] T037 [P] [US2] Create MemberProfile entity with TypeORM decorators in backend/src/modules/members/entities/MemberProfile.ts
- [ ] T038 [US2] Implement MembersService with registration and point management in backend/src/modules/members/members.service.ts
- [ ] T039 [US2] Implement MembersController with REST endpoints in backend/src/modules/members/members.controller.ts
- [ ] T040 [US2] Update OrdersService to integrate with member point calculation in backend/src/modules/orders/orders.service.ts
- [ ] T041 [US2] Create MemberRegistrationPage in frontend/src/app/members/register/page.tsx
- [ ] T042 [US2] Create MemberProfilePage in frontend/src/app/members/profile/page.tsx
- [ ] T043 [US2] Create MemberCard component with point display in frontend/src/components/MemberCard.tsx
- [ ] T044 [US2] Update CheckoutPage to integrate member discount logic in frontend/src/app/checkout/page.tsx

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - 店员权限管理 (Priority: P3)

**Goal**: 完整的店员权限管理系统，包括账号管理、权限控制、操作审计

**Independent Test**: 可以独立测试不同权限级别的店员操作：普通店员只能查看和处理订单，管理员可以管理产品、查看报表

### Tests for User Story 3 (TDD Required) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T045 [P] [US3] Contract test for staff management endpoints in tests/contract/staff-management.test.ts
- [ ] T046 [P] [US3] Contract test for authorization guards in tests/contract/auth-guards.test.ts
- [ ] T047 [P] [US3] Integration test for role-based access control in tests/integration/rbac.test.ts
- [ ] T048 [P] [US3] Unit test for PermissionService in tests/unit/auth/PermissionService.test.ts

### Implementation for User Story 3

- [ ] T049 [P] [US3] Update User entity to include role-based permissions in backend/src/modules/users/entities/User.ts
- [ ] T050 [P] [US3] Create OperationLog entity for audit trail in backend/src/modules/users/entities/OperationLog.ts
- [ ] T051 [P] [US3] Implement RolesGuard for authorization in backend/src/common/guards/roles.guard.ts
- [ ] T052 [P] [US3] Implement PermissionService for role management in backend/src/modules/auth/permission.service.ts
- [ ] T053 [P] [US3] Implement UsersService with role-based operations in backend/src/modules/users/users.service.ts
- [ ] T054 [P] [US3] Implement UsersController with permission checks in backend/src/modules/users/users.controller.ts
- [ ] T055 [P] [US3] Create AdminDashboardPage in frontend/src/app/admin/dashboard/page.tsx
- [ ] T056 [P] [US3] Create StaffManagementPage in frontend/src/app/admin/staff/page.tsx
- [ ] T057 [P] [US3] Create PermissionGuard component for UI in frontend/src/components/PermissionGuard.tsx

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - 产品和库存管理 (Priority: P4)

**Goal**: 完整的产品和库存管理功能，包括产品信息管理、库存监控、预警系统

**Independent Test**: 可以独立测试产品全生命周期：添加新产品、设置价格和配方、库存更新、销售扣减、库存预警

### Tests for User Story 4 (TDD Required) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T058 [P] [US4] Contract test for inventory management endpoints in tests/contract/inventory.test.ts
- [ ] T059 [P] [US4] Contract test for product management endpoints in tests/contract/products-admin.test.ts
- [ ] T060 [P] [US4] Integration test for inventory tracking and stock deduction in tests/integration/inventory-tracking.test.ts
- [ ] T061 [P] [US4] Unit test for InventoryService with automatic stock deduction in tests/unit/inventory/InventoryService.test.ts

### Implementation for User Story 4

- [ ] T062 [P] [US4] Create InventoryItem entity with TypeORM decorators in backend/src/modules/inventory/entities/InventoryItem.ts
- [ ] T063 [P] [US4] Create ProductRecipe entity for product ingredient mapping in backend/src/modules/products/entities/ProductRecipe.ts
- [ ] T064 [P] [US4] Implement InventoryService with stock tracking and alerts in backend/src/modules/inventory/inventory.service.ts
- [ ] T065 [P] [US4] Implement InventoryController with REST endpoints in backend/src/modules/inventory/inventory.controller.ts
- [ ] T066 [P] [US4] Update ProductsService to integrate with inventory management in backend/src/modules/products/products.service.ts
- [ ] T067 [P] [US4] Create ProductManagementPage in frontend/src/app/admin/products/page.tsx
- [ ] T068 [P] [US4] Create InventoryManagementPage in frontend/src/app/admin/inventory/page.tsx
- [ ] T069 [P] [US4] Create InventoryAlert component for low stock notifications in frontend/src/components/InventoryAlert.tsx
- [ ] T070 [P] [US4] Update OrdersService to automatically deduct inventory on order confirmation in backend/src/modules/orders/orders.service.ts

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently

---

## Phase 7: Reports & Analytics (Priority: P5)

**Goal**: 完整的销售数据统计和报表功能

**Independent Test**: 可以独立测试销售报表生成、库存统计、会员数据分析

### Tests for Reports & Analytics (TDD Required) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T071 [P] [P5] Contract test for sales reports endpoint in tests/contract/reports.test.ts
- [ ] T072 [P] [P5] Contract test for inventory reports endpoint in tests/contract/reports.test.ts
- [ ] T073 [P] [P5] Integration test for report generation and data accuracy in tests/integration/reports.test.ts
- [ ] T074 [P] [P5] Unit test for ReportsService with data aggregation in tests/unit/reports/ReportsService.test.ts

### Implementation for Reports & Analytics

- [ ] T075 [P] [P5] Implement ReportsService with sales and inventory analytics in backend/src/modules/reports/reports.service.ts
- [ ] T076 [P] [P5] Implement ReportsController with REST endpoints in backend/src/modules/reports/reports.controller.ts
- [ ] T077 [P] [P5] Create ReportsDashboardPage in frontend/src/app/admin/reports/page.tsx
- [ ] T078 [P] [P5] Create SalesChart component with data visualization in frontend/src/components/SalesChart.tsx

**Checkpoint**: At this point, Reports & Analytics should be fully functional and testable independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T079 [P] Add comprehensive error handling and logging across all modules
- [ ] T080 [P] Optimize database queries and add proper indexing
- [ ] T081 [P] Implement API rate limiting and security headers
- [ ] T082 [P] Add input sanitization and validation across all endpoints
- [ ] T083 [P] Create seed data script for development and testing
- [ ] T084 [P] Add API documentation with Swagger/OpenAPI
- [ ] T085 [P] Implement caching layer for frequently accessed data
- [ ] T086 [P] Add performance monitoring and metrics collection

---

## Phase 9: 宪法合规性验证 *(新增)*

**Purpose**: 确保所有实现符合项目宪法要求

### 强制约束验证
- [ ] T087 [P] 验证所有Git操作都有明确授权记录
- [ ] T088 [P] 确认未使用Windows语法(代码中使用/dev/null)
- [ ] T089 [P] 验证所有文档和代码注释使用中文

### 开发原则验证
- [ ] T090 [P] 确认代码遵循最简原则(删除冗余代码和抽象层)
- [ ] T091 [P] 验证功能实现完整性(无偷工减料)
- [ ] T092 [P] 确认无历史包袱设计(无向后兼容约束)

### 文档规范验证
- [ ] T093 [P] 在custom-features/变更日志.md中添加功能变更记录
- [ ] T094 [P] 验证代码变更与文档更新同步提交
- [ ] T095 [P] 确认变更记录包含完整要素

### 变更管理规范验证
- [ ] T096 [P] 在custom-features/requirements/创建需求文档(如果需要)
- [ ] T097 [P] 在custom-features/components/创建实现文档
- [ ] T098 [P] 验证文档命名格式符合规范

### 质量保证验证
- [ ] T099 [P] 验证单元测试覆盖所有函数/方法
- [ ] T100 [P] 执行集成测试验证MVP完整性
- [ ] T101 [P] 确认每个用户故事独立可测试

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete
- **Constitutional Compliance (Phase 9)**: Depends on all development being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **Reports (P5)**: Can start after Foundational (Phase 2) - Depends on US1-US4 completion

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before controllers/endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for GET /api/products endpoint"
Task: "Contract test for POST /api/orders endpoint"
Task: "Integration test for customer checkout flow"
Task: "Unit test for order calculation service"

# Launch all models for User Story 1 together:
Task: "Create Product entity"
Task: "Create Category entity"  
Task: "Create Order entity"
Task: "Create OrderItem entity"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add Reports → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
3. Stories complete and integrate independently

---

## Task Summary

| Phase | User Story | Task Count | Parallel Tasks | Dependencies |
|-------|------------|------------|----------------|--------------|
| 1 | Setup | 7 | 7 | None |
| 2 | Foundational | 8 | 5 | Phase 1 |
| 3 | US1 - 客户购物结账 | 17 | 12 | Phase 2 |
| 4 | US2 - 会员信息管理 | 12 | 8 | Phase 2 |
| 5 | US3 - 店员权限管理 | 13 | 9 | Phase 2 |
| 6 | US4 - 产品库存管理 | 13 | 8 | Phase 2 |
| 7 | Reports & Analytics | 8 | 6 | Phase 2 |
| 8 | Polish & Cross-Cutting | 8 | 8 | Phase 3-7 |
| 9 | 宪法合规性验证 | 15 | 15 | Phase 3-8 |
| **Total** | **All Stories** | **101** | **78** | **Sequential** |

### Key Metrics
- **Total Tasks**: 101
- **Parallelizable Tasks**: 78 (77%)
- **Sequential Dependencies**: 23 (23%)
- **Estimated Timeline**: 8-12 weeks (depending on team size and parallel execution)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

**Ready for Implementation! 🚀**