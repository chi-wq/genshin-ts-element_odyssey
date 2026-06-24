// === 日志工具模块 ===
// 集中管理调试日志输出，通过 DEBUG 开关统一控制
// 直接在 gsts 作用域下调用（print/console.log 均为 gsts 全局函数）

import { DEBUG } from '../config/constants'

/**
 * 调试日志：仅在 DEBUG=true 时输出
 */
export function debugLog(msg: string): void {
  if (DEBUG) {
    print(str(msg))
  }
}

/**
 * 调试日志（带值）：仅在 DEBUG=true 时输出
 * 用 print(str()) 代替 console.log，避免 gsts 对象不显示的问题
 */
export function debugLogValue(msg: string, value: any): void {
  if (DEBUG) {
    print(str(msg))
    print(str(value))
  }
}

/**
 * 信息日志：始终输出（上线时也显示）
 */
export function log(msg: string): void {
  print(str(msg))
}

/**
 * 信息日志（带值）：始终输出
 */
export function logValue(msg: string, value: any): void {
  print(str(msg))
  print(str(value))
}
