// 主游戏入口文件
import { MetalSlugGame } from './game/MetalSlugGame'

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  const gameContainer = document.getElementById('game-container')
  
  if (!canvas) {
    throw new Error('找不到游戏Canvas元素')
  }
  
  // 初始化游戏
  const game = new MetalSlugGame(canvas)
  game.start()
  
  console.log('合金弹头风格2D射击游戏已启动')
})
