// 简单事件发射器实现
export class EventEmitter {
  private events: Map<string, Function[]> = new Map()

  // 注册事件监听器
  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  // 移除事件监听器
  off(event: string, callback: Function): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 添加一次性事件监听器
  once(event: string, callback: Function): void {
    const onceCallback = (...args: any[]) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }

  // 触发事件
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  // 移除所有事件监听器
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  // 获取事件监听器数量
  listenerCount(event: string): number {
    const callbacks = this.events.get(event)
    return callbacks ? callbacks.length : 0
  }

  // 销毁
  destroy(): void {
    this.events.clear()
  }
}
