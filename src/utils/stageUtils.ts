import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'

import { NotificationItemId, NotificationQueueIndex } from '../config/constants'
import { Signal } from '../resources/signals'

/**
 * 从数组中获取指定索引的值（索引从 1 开始，自动钳位到数组范围）
 * 必须在 server ctx 内调用（gstsServer* 函数或 handler 中）
 *
 * @param data     原始数组（顶层 int()/str() 等转换后的数据）
 * @param index    从 1 开始的索引（如 currentStage）
 * @param maxIdx   最大有效索引（data.length - 1，在顶层算好传入）
 * @param typeName 数据类型名称（'int' | 'str' | 'bool' 等）
 * @param f        执行流函数
 */
export function gstsServerGetListValue(
  data: bigint[] | string[] | boolean[] | ReturnType<typeof vec3>[],
  index: bigint,
  maxIdx: bigint,
  typeName:
    | 'bool'
    | 'config_id'
    | 'entity'
    | 'faction'
    | 'float'
    | 'guid'
    | 'int'
    | 'prefab_id'
    | 'str'
    | 'vec3',
  f: ServerExecutionFlowFunctions
): any {
  const valueList = list(typeName, data)
  let idx = index - int(1)
  if (idx > maxIdx) {
    idx = maxIdx
  }
  return f.getCorrespondingValueFromList(valueList, idx)
}

/**
 * 从数组中获取指定索引的值（索引从 0 开始，自动钳位到数组范围）
 * 适合动态计算的索引（如 flatIdx = startIdx + i）
 *
 * @param data     原始数组
 * @param index    从 0 开始的索引
 * @param maxIdx   最大有效索引
 * @param typeName 数据类型名称
 * @param f        执行流函数
 */
export function gstsServerGetListValue0(
  data: bigint[] | string[] | boolean[] | ReturnType<typeof vec3>[],
  index: bigint,
  maxIdx: bigint,
  typeName:
    | 'bool'
    | 'config_id'
    | 'entity'
    | 'faction'
    | 'float'
    | 'guid'
    | 'int'
    | 'prefab_id'
    | 'str'
    | 'vec3',
  f: ServerExecutionFlowFunctions
): any {
  const valueList = list(typeName, data)
  let idx = index
  if (idx > maxIdx) {
    idx = maxIdx
  }
  return f.getCorrespondingValueFromList(valueList, idx)
}

/**
 * 发送消息到消息队列（封装信号参数，只需传入消息文本）
 *
 * @param msg 消息文本
 */
export function gstsServerSendNotificationMsg(msg: string): void {
  send(
    Signal.UpdateNotificationMsgList,
    player(1),
    NotificationQueueIndex,
    NotificationItemId,
    str(msg)
  )
}
