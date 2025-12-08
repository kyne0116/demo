# Checklist: 核心业务逻辑完整性验证

**Purpose**: 验证奶茶店销售管理系统的核心业务规则、数据一致性和异常处理要求的完整性
**Created**: 2025-12-08
**Focus Areas**: 业务规则完整性、数据一致性、异常处理、财务逻辑、权限安全
**Depth**: Standard
**Actor**: Reviewer (PR)

## 核心业务规则完整性

- [ ] CHK001 - 订单计算逻辑是否完整定义（产品总价 + 税费 - 会员折扣 + 积分抵扣）？ [Completeness, Spec §FR-004]
- [ ] CHK002 - 会员积分累积规则是否明确量化（1元=1分）？ [Clarity, Clarification §Q2]
- [ ] CHK003 - 会员等级升级条件是否具体定义（Bronze: 0-999元, Silver: 1000-4999元等）？ [Completeness, Data Model]
- [ ] CHK004 - 订单状态流转规则是否完整（待处理→制作中→已完成→已取消）？ [Completeness, Spec §FR-006]
- [ ] CHK005 - 产品配方与库存扣减关系是否明确定义？ [Completeness, Spec §FR-007]
- [ ] CHK006 - 价格变更对历史订单的影响是否明确（历史订单保持原价）？ [Clarity, US4 §Acceptance-4]

## 数据一致性要求

- [ ] CHK007 - 库存数据实时性要求是否量化（订单确认后立即扣减）？ [Clarity, Spec §FR-007]
- [ ] CHK008 - 会员积分数据一致性如何保证（并发消费时的积分计算）？ [Coverage, Gap]
- [ ] CHK009 - 订单数据完整性是否定义（订单号唯一性、产品明细完整记录）？ [Completeness, Spec §FR-005]
- [ ] CHK010 - 产品价格变更的生效时间点是否明确（新价格只影响后续订单）？ [Clarity, US4 §Acceptance-4]
- [ ] CHK011 - 会员等级变更后的权益立即生效规则是否定义？ [Consistency, Spec §FR-003]

## 财务相关业务逻辑

- [ ] CHK012 - 积分抵扣规则是否精确量化（100分=1元，且有最大抵扣比例限制）？ [Clarity, Clarification §Q2]
- [ ] CHK013 - 会员折扣率计算逻辑是否定义（不同等级享受不同折扣）？ [Completeness, Gap]
- [ ] CHK014 - 订单退款处理逻辑是否定义（如何处理已使用的积分和折扣）？ [Coverage, Edge Case]
- [ ] CHK015 - 财务数据对账要求是否定义（销售总额、积分发放、库存成本等）？ [Completeness, Spec §FR-012]
- [ ] CHK016 - 现金结算与积分抵扣的优先级和组合规则是否明确？ [Clarity, Gap]

## 异常情况与恢复机制

- [ ] CHK017 - 库存不足时的业务处理流程是否完整（阻止下单 vs 允许下单但标注缺货）？ [Clarity, US1 §Acceptance-4]
- [ ] CHK018 - 订单取消后的库存回滚机制是否定义？ [Completeness, Edge Cases]
- [ ] CHK019 - 网络中断时的订单处理策略是否定义（本地缓存 vs 延迟同步）？ [Coverage, Edge Cases]
- [ ] CHK020 - 会员卡丢失或被盗用的处理流程是否定义？ [Coverage, Edge Cases]
- [ ] CHK021 - 店员操作失误的撤销和修正机制是否定义？ [Coverage, Edge Cases]
- [ ] CHK022 - 系统故障恢复后的数据一致性检查机制是否定义？ [Recovery, Gap]

## 权限与安全业务规则

- [ ] CHK023 - 三级权限的具体操作范围是否明确定义（普通店员 vs 值班经理 vs 店主）？ [Completeness, Clarification §Q1]
- [ ] CHK024 - 敏感操作的审计要求是否完整（退款、折扣、价格调整等）？ [Completeness, Spec §FR-011]
- [ ] CHK025 - 会员身份验证方式的技术实现是否定义（手机号 vs 会员卡号）？ [Clarity, Clarification §Q4]
- [ ] CHK026 - 操作日志的保存期限和查询权限是否定义？ [Completeness, Spec §FR-011]
- [ ] CHK027 - 不同权限级别查看销售报表的范围是否明确区分？ [Consistency, Spec §FR-012]

## 业务流程连贯性

- [ ] CHK028 - 客户购物到订单完成的完整流程是否无断点（产品浏览→购物车→结账→制作→完成）？ [Completeness, US1]
- [ ] CHK029 - 会员注册到享受权益的流程是否连贯（注册→验证→等级分配→折扣应用）？ [Consistency, US2]
- [ ] CHK030 - 产品管理到销售扣减的流程是否完整（产品创建→配方设置→库存管理→销售扣减）？ [Consistency, US4]
- [ ] CHK031 - 数据统计到经营决策的流程是否定义（数据收集→分析→报表→策略制定）？ [Completeness, US5]
- [ ] CHK032 - 跨用户故事的集成点是否明确定义（US1与US2的积分累积、US1与US4的库存扣减）？ [Integration, Gap]

## 业务规则量化标准

- [ ] CHK033 - "3分钟完成订单确认"的性能要求是否可测量和验证？ [Measurability, Spec §SC-001]
- [ ] CHK034 - "99.5%订单处理准确率"的质量标准如何验证和监控？ [Measurability, Spec §SC-003]
- [ ] CHK035 - "95%库存预警准确率"的预警机制标准如何定义？ [Measurability, Spec §SC-008]
- [ ] CHK036 - "50个并发用户"的性能基准是否明确定义测试场景？ [Measurability, Spec §SC-002]
- [ ] CHK037 - "99.5%系统可用性"的运维标准是否定义监控和报警机制？ [Measurability, Spec §SC-007]

## 数据实体业务关系

- [ ] CHK038 - 客户、会员、店员三个实体之间的关系是否明确（一个客户只能是一个会员）？ [Consistency, Key Entities]
- [ ] CHK039 - 产品与库存项的配方关系是否定义（一个产品对应多个原料）？ [Completeness, Spec §FR-009]
- [ ] CHK040 - 订单与订单项的关联关系是否完整（一个订单包含多个产品项）？ [Completeness, Spec §FR-005]
- [ ] CHK041 - 会员等级与折扣权益的映射关系是否定义？ [Completeness, Gap]
- [ ] CHK042 - 店员权限与具体功能模块的映射关系是否明确？ [Traceability, Spec §FR-008]

## 关键业务假设验证

- [ ] CHK043 - "单店运营模式"的假设是否限制了系统扩展性（未来多店连锁需求）？ [Assumption, Scope]
- [ ] CHK044 - "现金结算为主"的支付方式假设是否影响系统设计？ [Assumption, Clarification §Q3]
- [ ] CHK045 - "1000-10000产品SKU"的规模假设是否影响数据库设计和性能要求？ [Assumption, Scale]
- [ ] CHK046 - "数十个店员账号"的用户规模假设是否影响权限系统设计？ [Assumption, Spec §Scale/Scope]

## 业务规则冲突检查

- [ ] CHK047 - 会员积分累积与积分抵扣的规则是否存在冲突（同一订单既累积又抵扣）？ [Conflict, Logic]
- [ ] CHK048 - 库存预警与产品销售的规则是否协调（预警后是否允许销售）？ [Consistency, Spec §FR-010]
- [ ] CHK049 - 权限控制与业务效率的平衡是否合理（过于严格是否影响销售效率）？ [Balance, Spec §FR-008]
- [ ] CHK050 - 数据实时性与系统性能的权衡是否明确（库存数据实时准确的性能代价）？ [Trade-off, Spec §FR-007]

## 缺失业务场景识别

- [ ] CHK051 - 促销活动场景是否覆盖（买一送一、满减活动等）？ [Coverage, Gap]
- [ ] CHK052 - 退换货业务流程是否定义（产品质量问题、客户不满意等）？ [Coverage, Gap]
- [ ] CHK053 - 库存盘点业务流程是否定义（定期盘点、差异处理）？ [Coverage, Gap]
- [ ] CHK054 - 会员迁移/合并场景是否处理（客户更换手机号等）？ [Coverage, Gap]
- [ ] CHK055 - 跨门店业务场景是否考虑（多店连锁、门店间调货等）？ [Coverage, Future Scope]