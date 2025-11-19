# 合金弹头2D射击游戏

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

一个基于Web技术栈开发的合金弹头风格2D横版射击游戏，使用TypeScript和HTML5 Canvas构建。

## 🎮 游戏预览

游戏采用经典合金弹头玩法：
- 🟦 控制蓝色角色在战场上移动
- 🟨 使用空格键发射子弹攻击敌人
- 🟥 击败从右侧出现的红色敌人
- 📊 实时计分和生命值显示

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 8+ 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 🎯 游戏指南

### 操作控制

| 按键 | 功能 |
|------|------|
| `W` | 向上移动 |
| `A` | 向左移动 |
| `S` | 向下移动 |
| `D` | 向右移动 |
| `空格` | 射击 |

### 游戏元素

#### 玩家角色
- **颜色**: 蓝色矩形
- **初始位置**: (100, 300)
- **移动**: 响应WASD键控制

#### 子弹系统
- **颜色**: 黄色
- **尺寸**: 8x2像素
- **方向**: 向右发射
- **限制**: 同时最多存在5个子弹

#### 敌人系统
- **颜色**: 红色
- **尺寸**: 24x32像素
- **行为**: 从屏幕右侧自动生成并移动
- **限制**: 同时最多存在3个敌人
- **生成**: 随机时间间隔（2%概率）

#### 计分系统
- **击中敌人**: +100分
- **消灭敌人**: +200分
- **实时显示**: 左上角显示分数和生命值

### 游戏机制

#### 核心特性
- **60FPS游戏循环**: 使用`requestAnimationFrame`实现流畅动画
- **实时碰撞检测**: 精确的子弹与敌人碰撞判断
- **边界限制**: 玩家和子弹不能移出游戏区域
- **自动清理**: 超出边界的游戏对象自动清除

#### 调试功能
在浏览器控制台中可使用以下调试函数：

```javascript
// 检查游戏状态
gameTest()

// 重置游戏
resetGame()

// 直接访问游戏状态对象
window.gameState
```

## 🛠️ 技术栈

### 前端技术
- **TypeScript 5.0+**: 提供类型安全和现代JavaScript特性
- **Vite**: 快速的开发服务器和构建工具
- **HTML5 Canvas 2D API**: 游戏渲染引擎
- **ES2020+**: 现代JavaScript语法特性

### 开发工具
- **Jest**: 单元测试框架
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Cypress**: 端到端测试

## 📁 项目结构

```
├── public/                 # 静态资源
├── src/
│   ├── game/              # 游戏核心逻辑
│   ├── utils/             # 工具函数
│   └── main.ts           # 应用入口
├── index.html             # HTML模板
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript配置
├── vite.config.ts         # Vite配置
└── jest.config.js         # Jest测试配置
```

## 🧪 开发命令

### 代码质量
```bash
npm run lint              # 检查代码质量
npm run lint:fix          # 自动修复代码格式问题
```

### 测试
```bash
npm run test              # 运行单元测试
npm run test:watch        # 监听模式运行测试
npm run test:coverage     # 生成测试覆盖率报告
```

### 构建
```bash
npm run build             # 构建生产版本
npm run preview           # 预览生产构建
```

## 🎨 特色功能

### 游戏特性
- ✅ **流畅的60FPS游戏体验**
- ✅ **响应式键盘控制**
- ✅ **实时碰撞检测系统**
- ✅ **自动对象生命周期管理**
- ✅ **完整的游戏状态跟踪**
- ✅ **热重载开发环境**

### 性能优化
- 高效的游戏循环设计
- 智能的内存管理机制
- 优化的渲染性能
- 最小化DOM操作

## 🚧 路线图

### 短期计划
- [ ] 添加角色和敌人精灵图
- [ ] 实现射击和击中音效
- [ ] 创建多种敌人类型
- [ ] 美化游戏界面UI

### 长期计划
- [ ] 游戏存档功能
- [ ] 本地双人模式
- [ ] 关卡编辑器
- [ ] 成就系统和排行榜

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢以下开源项目：
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript的类型化超集
- [Jest](https://jestjs.io/) - 令人愉快的JavaScript测试框架

---

**享受游戏，致敬经典合金弹头！** 🎮