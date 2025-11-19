// 合金弹头2D游戏 - 可玩版本
console.log('合金弹头2D游戏开始初始化...')

// 游戏状态和配置
interface GameState {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    health: number;
    speed: number;
    color: string;
  };
  bullets: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    color: string;
  }>;
  enemies: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    health: number;
    speed: number;
    color: string;
  }>;
  keys: {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    space: boolean;
  };
  score: number;
  gameRunning: boolean;
  lastFrameTime: number;
}

// 初始化游戏状态
const gameState: GameState = {
  player: {
    x: 100,
    y: 300,
    width: 32,
    height: 48,
    health: 100,
    speed: 3,
    color: '#4a9eff'
  },
  bullets: [],
  enemies: [],
  keys: {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
  },
  score: 0,
  gameRunning: true,
  lastFrameTime: 0
}

// 游戏功能函数
function updateGameState(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // 移动玩家
  if (gameState.keys.w) gameState.player.y -= gameState.player.speed
  if (gameState.keys.s) gameState.player.y += gameState.player.speed
  if (gameState.keys.a) gameState.player.x -= gameState.player.speed
  if (gameState.keys.d) gameState.player.x += gameState.player.speed

  // 边界检查
  gameState.player.x = Math.max(0, Math.min(canvas.width - gameState.player.width, gameState.player.x))
  gameState.player.y = Math.max(0, Math.min(canvas.height - gameState.player.height, gameState.player.y))

  // 射击
  if (gameState.keys.space && gameState.bullets.length < 5) {
    gameState.bullets.push({
      x: gameState.player.x + gameState.player.width,
      y: gameState.player.y + gameState.player.height / 2,
      width: 8,
      height: 2,
      speed: 5,
      color: '#ffff00'
    })
  }

  // 更新子弹
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i]
    bullet.x += bullet.speed

    // 移除超出边界的子弹
    if (bullet.x > canvas.width) {
      gameState.bullets.splice(i, 1)
    }
  }

  // 生成敌人
  if (Math.random() < 0.02 && gameState.enemies.length < 3) {
    gameState.enemies.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 48),
      width: 24,
      height: 32,
      health: 50,
      speed: 1,
      color: '#ff4444'
    })
  }

  // 更新敌人
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i]
    enemy.x -= enemy.speed

    // 移除超出边界的敌人
    if (enemy.x < -enemy.width) {
      gameState.enemies.splice(i, 1)
    }
  }

  // 碰撞检测 - 子弹vs敌人
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i]
    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j]

      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        // 击中敌人
        gameState.bullets.splice(i, 1)
        enemy.health -= 25
        gameState.score += 100

        if (enemy.health <= 0) {
          gameState.enemies.splice(j, 1)
          gameState.score += 200
        }
        break
      }
    }
  }
}

function renderGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // 清除画布
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制玩家
  ctx.fillStyle = gameState.player.color
  ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height)

  // 绘制子弹
  gameState.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.color
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
  })

  // 绘制敌人
  gameState.enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
  })

  // 绘制UI
  ctx.fillStyle = '#ffffff'
  ctx.font = '16px Arial'
  ctx.fillText(`分数: ${gameState.score}`, 10, 25)
  ctx.fillText(`生命值: ${gameState.player.health}`, 10, 45)
  ctx.fillText('WASD移动，空格射击', 10, canvas.height - 10)
}

// 主游戏循环
function gameLoop(timestamp: number) {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 帧率控制
  if (timestamp - gameState.lastFrameTime < 16) { // ~60 FPS
    requestAnimationFrame(gameLoop)
    return
  }
  gameState.lastFrameTime = timestamp

  if (gameState.gameRunning) {
    updateGameState(canvas, ctx)
    renderGame(canvas, ctx)
  }

  requestAnimationFrame(gameLoop)
}

// 输入处理
function setupInputHandling() {
  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'KeyW': gameState.keys.w = true; event.preventDefault(); break
      case 'KeyA': gameState.keys.a = true; event.preventDefault(); break
      case 'KeyS': gameState.keys.s = true; event.preventDefault(); break
      case 'KeyD': gameState.keys.d = true; event.preventDefault(); break
      case 'Space': gameState.keys.space = true; event.preventDefault(); break
    }
  })

  document.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyW': gameState.keys.w = false; break
      case 'KeyA': gameState.keys.a = false; break
      case 'KeyS': gameState.keys.s = false; break
      case 'KeyD': gameState.keys.d = false; break
      case 'Space': gameState.keys.space = false; break
    }
  })
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('开始初始化可玩版本...')

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('找不到Canvas')
    return
  }

  console.log('设置输入处理...')
  setupInputHandling()

  console.log('启动游戏循环...')
  gameState.gameRunning = true
  requestAnimationFrame(gameLoop)

  console.log('✅ 合金弹头2D游戏已启动！')
  console.log('🎮 控制方式：WASD移动，空格射击')
  console.log('🎯 目标：击败敌人获得分数')
})

// 全局测试函数
declare global {
  interface Window {
    gameState?: GameState;
    gameTest?: () => void;
    resetGame?: () => void;
  }
}

window.gameTest = function() {
  console.log('=== 游戏功能测试 ===')
  console.log('玩家位置:', gameState.player.x, gameState.player.y)
  console.log('子弹数量:', gameState.bullets.length)
  console.log('敌人数量:', gameState.enemies.length)
  console.log('当前分数:', gameState.score)
  console.log('按WASD移动，空格射击来测试游戏')
}

window.resetGame = function() {
  gameState.player.x = 100
  gameState.player.y = 300
  gameState.bullets = []
  gameState.enemies = []
  gameState.score = 0
  gameState.player.health = 100
  console.log('游戏已重置')
}
