import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'

import { CustomPrefab } from '../resources/prefabs'

// === 敌人预制体常量（顶层 prefabId() 返回 prefabId 实例） ===
export const enemyHilichurl = prefabId(CustomPrefab.enemyHilichurl) // 丘丘人
export const enemyPyroSlime = prefabId(CustomPrefab.enemyPyroSlime) // 火史莱姆
export const enemyFighter = prefabId(CustomPrefab.enemyFighter) // 打手丘丘人
export const enemyHydroSamachurl = prefabId(CustomPrefab.enemyHydroSamachurl) // 水萨满
export const enemyRuinGuard = prefabId(CustomPrefab.enemyRuinGuard) // 遗迹守卫

/**
 * 将敌人名称字符串转换为对应的 prefabId
 * 必须在 server ctx 内调用
 */
export function gstsServerGetPrefabByName(
  name: ReturnType<typeof str>
): ReturnType<typeof prefabId> {
  let result = prefabId(0)
  if (name === str('hilichurl')) {
    result = enemyHilichurl
  } else if (name === str('pyroSlime')) {
    result = enemyPyroSlime
  } else if (name === str('fighter')) {
    result = enemyFighter
  } else if (name === str('hydroSamachurl')) {
    result = enemyHydroSamachurl
  } else if (name === str('ruinGuard')) {
    result = enemyRuinGuard
  }
  return result
}
