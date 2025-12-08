# Data Model Design: 奶茶店销售管理系统

**Date**: 2025-12-08  
**Feature**: 001-milktea-pos  
**Status**: Final Design

## Overview

基于调研结果设计的数据模型，采用PostgreSQL + TypeORM架构。模型设计遵循第三范式，确保数据一致性和完整性。核心设计理念是最简原则，避免过度复杂的关系设计。

## Core Entities

### 1. User (用户)

**Purpose**: 系统用户基础信息，包括客户、店员、管理员

**Fields**:
- `id` (UUID, Primary Key): 用户唯一标识
- `email` (VARCHAR, Unique): 用户邮箱
- `password` (VARCHAR): 加密密码
- `phone` (VARCHAR, Unique): 手机号码
- `name` (VARCHAR): 用户姓名
- `role` (ENUM): 用户角色 ('customer', 'staff', 'manager', 'owner')
- `isActive` (BOOLEAN): 账号状态
- `createdAt` (TIMESTAMP): 创建时间
- `updatedAt` (TIMESTAMP): 更新时间

**Validation Rules**:
- email格式验证
- 手机号码格式验证
- 密码强度要求(最少8位，包含字母数字)
- 角色枚举值验证

**Relationships**:
- One-to-Many: User → Order (客户订单)
- One-to-Many: User → MemberProfile (会员信息)
- One-to-Many: User → OperationLog (操作日志)

### 2. MemberProfile (会员档案)

**Purpose**: 会员专属信息，包括积分、等级、权益

**Fields**:
- `id` (UUID, Primary Key): 会员档案ID
- `userId` (UUID, Foreign Key): 关联用户ID
- `memberNumber` (VARCHAR, Unique): 会员卡号
- `level` (ENUM): 会员等级 ('bronze', 'silver', 'gold', 'platinum')
- `points` (INTEGER): 积分余额
- `totalSpent` (DECIMAL): 累计消费金额
- `pointsUsed` (INTEGER): 已使用积分
- `discountRate` (DECIMAL): 折扣率
- `isActive` (BOOLEAN): 会员状态
- `registeredAt` (TIMESTAMP): 注册时间
- `lastActiveAt` (TIMESTAMP): 最后活跃时间

**Validation Rules**:
- 积分不能为负数
- 累计消费金额>=0
- 折扣率范围(0.8-1.0)

**Business Rules**:
- 积分累积规则: 消费1元=1积分
- 积分抵扣规则: 100积分=1元
- 等级升级规则: 
  - Bronze: 0-999元
  - Silver: 1000-4999元  
  - Gold: 5000-9999元
  - Platinum: 10000+元

### 3. Category (产品分类)

**Purpose**: 产品分类管理

**Fields**:
- `id` (UUID, Primary Key): 分类ID
- `name` (VARCHAR, Unique): 分类名称
- `description` (TEXT): 分类描述
- `sortOrder` (INTEGER): 排序权重
- `isActive` (BOOLEAN): 是否启用
- `createdAt` (TIMESTAMP): 创建时间

**Validation Rules**:
- 分类名称不能为空
- 排序权重>=0

### 4. Product (产品)

**Purpose**: 产品基本信息

**Fields**:
- `id` (UUID, Primary Key): 产品ID
- `name` (VARCHAR): 产品名称
- `description` (TEXT): 产品描述
- `price` (DECIMAL): 产品价格
- `categoryId` (UUID, Foreign Key): 分类ID
- `imageUrl` (VARCHAR): 产品图片URL
- `nutritionInfo` (JSONB): 营养信息
- `isActive` (BOOLEAN): 是否上架
- `sortOrder` (INTEGER): 显示排序
- `createdAt` (TIMESTAMP): 创建时间
- `updatedAt` (TIMESTAMP): 更新时间

**Validation Rules**:
- 价格必须>0
- 产品名称不能为空
- 分类必须存在

**Relationships**:
- Many-to-One: Category → Product
- One-to-Many: Product → InventoryItem
- One-to-Many: Product → OrderItem

### 5. InventoryItem (库存项)

**Purpose**: 原料库存管理

**Fields**:
- `id` (UUID, Primary Key): 库存项ID
- `name` (VARCHAR): 原料名称
- `unit` (VARCHAR): 计量单位 ('g', 'ml', 'piece')
- `currentStock` (DECIMAL): 当前库存
- `minStock` (DECIMAL): 最低预警库存
- `maxStock` (DECIMAL): 最大库存
- `unitCost` (DECIMAL): 单位成本
- `supplier` (VARCHAR): 供应商
- `expiryDate` (DATE): 过期日期
- `isActive` (BOOLEAN): 是否启用
- `updatedAt` (TIMESTAMP): 更新时间

**Validation Rules**:
- 库存数量>=0
- 最低库存<=当前库存<=最大库存
- 成本>=0

**Business Rules**:
- 库存预警: 当前库存<=最低库存时触发预警
- 库存更新: 订单确认后自动扣减相应原料

### 6. ProductRecipe (产品配方)

**Purpose**: 产品原料配方

**Fields**:
- `id` (UUID, Primary Key): 配方ID
- `productId` (UUID, Foreign Key): 产品ID
- `inventoryItemId` (UUID, Foreign Key): 原料ID
- `quantity` (DECIMAL): 所需数量
- `unit` (VARCHAR): 计量单位

**Validation Rules**:
- 配方数量>0
- 原料和产品必须存在

**Business Rules**:
- 产品销售时自动计算原料扣减量

### 7. Order (订单)

**Purpose**: 订单主表

**Fields**:
- `id` (UUID, Primary Key): 订单ID
- `orderNumber` (VARCHAR, Unique): 订单号
- `customerId` (UUID, Foreign Key): 客户ID (可为空，支持匿名购买)
- `staffId` (UUID, Foreign Key): 处理店员ID
- `totalAmount` (DECIMAL): 订单总金额
- `discountAmount` (DECIMAL): 折扣金额
- `finalAmount` (DECIMAL): 最终金额
- `pointsUsed` (INTEGER): 使用积分
- `pointsEarned` (INTEGER): 获得积分
- `status` (ENUM): 订单状态 ('pending', 'making', 'completed', 'cancelled')
- `notes` (TEXT): 订单备注
- `createdAt` (TIMESTAMP): 创建时间
- `updatedAt` (TIMESTAMP): 更新时间
- `completedAt` (TIMESTAMP): 完成时间

**Validation Rules**:
- 最终金额>=0
- 状态枚举值验证
- 订单时间逻辑验证

**State Transitions**:
- pending → making (确认订单)
- making → completed (完成制作)
- making → cancelled (取消订单)
- pending → cancelled (取消订单)

**Business Rules**:
- 订单确认后自动更新库存
- 会员订单自动累积积分
- 支持订单取消和退款

### 8. OrderItem (订单明细)

**Purpose**: 订单商品明细

**Fields**:
- `id` (UUID, Primary Key): 订单明细ID
- `orderId` (UUID, Foreign Key): 订单ID
- `productId` (UUID, Foreign Key): 产品ID
- `quantity` (INTEGER): 购买数量
- `unitPrice` (DECIMAL): 单价
- `totalPrice` (DECIMAL): 小计
- `customizations` (JSONB): 个性化要求
- `notes` (TEXT): 商品备注

**Validation Rules**:
- 数量>0
- 单价>=0
- 小计=数量×单价

### 9. OperationLog (操作日志)

**Purpose**: 系统操作审计

**Fields**:
- `id` (UUID, Primary Key): 日志ID
- `userId` (UUID, Foreign Key): 操作人ID
- `action` (VARCHAR): 操作动作
- `resource` (VARCHAR): 资源类型
- `resourceId` (UUID): 资源ID
- `details` (JSONB): 操作详情
- `ipAddress` (VARCHAR): IP地址
- `userAgent` (VARCHAR): 用户代理
- `createdAt` (TIMESTAMP): 操作时间

**Validation Rules**:
- 操作动作不能为空
- 资源类型枚举值验证

**Business Rules**:
- 关键操作必须记录日志
- 包含用户身份、时间、IP地址等信息

## Index Strategy

```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- 会员档案索引
CREATE INDEX idx_member_profiles_number ON member_profiles(member_number);
CREATE INDEX idx_member_profiles_level ON member_profiles(level);

-- 产品表索引
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- 订单表索引
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_staff ON orders(staff_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- 库存表索引
CREATE INDEX idx_inventory_name ON inventory_items(name);
CREATE INDEX idx_inventory_stock ON inventory_items(current_stock, min_stock);
```

## Data Integrity Constraints

### Foreign Key Constraints
```sql
ALTER TABLE member_profiles ADD CONSTRAINT fk_member_user 
  FOREIGN KEY (userId) REFERENCES users(id);

ALTER TABLE products ADD CONSTRAINT fk_product_category 
  FOREIGN KEY (categoryId) REFERENCES categories(id);

ALTER TABLE orders ADD CONSTRAINT fk_order_customer 
  FOREIGN KEY (customerId) REFERENCES users(id);

ALTER TABLE orders ADD CONSTRAINT fk_order_staff 
  FOREIGN KEY (staffId) REFERENCES users(id);

ALTER TABLE order_items ADD CONSTRAINT fk_order_item_order 
  FOREIGN KEY (orderId) REFERENCES orders(id);

ALTER TABLE order_items ADD CONSTRAINT fk_order_item_product 
  FOREIGN KEY (productId) REFERENCES products(id);
```

### Check Constraints
```sql
-- 价格不能为负数
ALTER TABLE products ADD CONSTRAINT chk_product_price 
  CHECK (price > 0);

-- 库存不能为负数
ALTER TABLE inventory_items ADD CONSTRAINT chk_inventory_stock 
  CHECK (current_stock >= 0);

-- 积分不能为负数
ALTER TABLE member_profiles ADD CONSTRAINT chk_member_points 
  CHECK (points >= 0);

-- 订单金额验证
ALTER TABLE orders ADD CONSTRAINT chk_order_amounts 
  CHECK (totalAmount >= 0 AND finalAmount >= 0 AND finalAmount <= totalAmount);
```

## Migration Strategy

### Initial Migration (v1.0.0)
1. 创建基础表结构
2. 设置索引和约束
3. 插入基础数据（默认分类、管理员账号）

### Future Migrations
- v1.1.0: 添加高级报表功能
- v1.2.0: 增加多门店支持
- v2.0.0: 移动端API优化

## Data Seeding

### 基础数据
```sql
-- 默认分类
INSERT INTO categories (id, name, description, sortOrder, isActive) VALUES
  (gen_random_uuid(), '经典奶茶', '传统奶茶系列', 1, true),
  (gen_random_uuid(), '果茶', '新鲜果茶系列', 2, true),
  (gen_random_uuid(), '咖啡', '精品咖啡系列', 3, true),
  (gen_random_uuid(), '小食', '配套小食系列', 4, true);

-- 默认管理员账号
INSERT INTO users (id, email, password, phone, name, role, isActive) VALUES
  (gen_random_uuid(), 'admin@milktea.com', '$2b$10$...', '13800000000', '系统管理员', 'owner', true);
```

## Performance Considerations

1. **查询优化**: 合理使用索引，避免N+1查询
2. **分页处理**: 大数据量场景使用cursor分页
3. **缓存策略**: 热点数据使用Redis缓存
4. **批量操作**: 批量插入和更新操作
5. **异步处理**: 复杂计算使用队列异步处理

## Security Considerations

1. **数据加密**: 敏感字段加密存储
2. **访问控制**: 行级安全策略
3. **审计日志**: 完整操作记录
4. **数据脱敏**: 日志中脱敏处理
5. **备份策略**: 定期数据备份

## Next Steps

1. **Create API Contracts**: Define REST API endpoints
2. **Generate Migrations**: Create database migration files
3. **Setup Seeds**: Create initial data seeding scripts
4. **Plan Implementation**: Break down into development tasks

**Ready for**: API Contract Design and Quickstart Guide