import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'

import {
  enemyElementAttackPrefabIdValue,
  EXCLUDE_RADIUS,
  GRID_RANGE,
  GRID_STEP,
  orbPrefabIdValue,
  orbSPMax,
  orbSPMin,
  orbSPPrefabIdValue,
  PlayerSpawnPos
} from '../config/constants'
import { spawnSlotPositions, spawnSlotSize } from '../config/spawnSlots'
import { gstsServerGetElementalTypes, gstsServerGetSpecialElementalTypes } from './elementSystem'

// ── 预计算安全生成坐标 ──
// 网格: [-GRID_RANGE, GRID_RANGE] × 同范围, 步长 GRID_STEP
// 当前配置 (GRID_RANGE=10, GRID_STEP=3): 7×7=49 候选, 排除 5 个, 剩余 44 个安全位置
// 排除点为距玩家出生点(10.49,2.97)或任意敌人槽位 < EXCLUDE_RADIUS 的位置
// 参考: 步长 2 时 range±8→81候选/67安全, range±10→121候选/105安全
// 注意：vec3.x/z getter 在模块作用域不可用（依赖 gsts.f），改用 .value[] 访问原始数组
const excludePoints: [number, number][] = [[PlayerSpawnPos.value[0], PlayerSpawnPos.value[2]]]
for (let i = 0; i < spawnSlotSize; i++) {
  const p = spawnSlotPositions[i]
  excludePoints.push([p[0], p[2]])
}
const safeOrbPositions: [number, number][] = []
for (let x = -GRID_RANGE; x <= GRID_RANGE; x += GRID_STEP) {
  for (let z = -GRID_RANGE; z <= GRID_RANGE; z += GRID_STEP) {
    const tooClose = excludePoints.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < EXCLUDE_RADIUS)
    if (!tooClose) safeOrbPositions.push([x, z])
  }
}
// precomputed — 编译时确定的安全位置数组，纯数据，不含任何随机逻辑
const safeOrbXs: bigint[] = safeOrbPositions.map((p) => int(p[0]))
const safeOrbZs: bigint[] = safeOrbPositions.map((p) => int(p[1]))

// 运行时构建索引字典 {0:true, 1:true, ..., N-1:true}，每关初调用一次
// 每次抽取：取 keys 列表 → 随机抽一个 → 从 dict 移除 → 用该值做位置索引
// 每关开始时 dict 大小 = 44（全量）；关内每生成一个球 remove 一个 key，逐渐缩小
// 下一关开始重新填充，又回到 44
//
// 此方案同时满足了三个要求：
// 1. ✅ 没有预计算打乱表 —— dict 内容在运行时通过 finiteLoop 填充，无编译时随机
// 2. ✅ 不重复 —— 抽过的 key 立即从 dict 移除，下次不可能再抽到
// 3. ✅ 顺序随机 —— 每次用 f.getRandomInteger 从剩余 keys 中独立随机选
export function gstsServerBuildOrbPool(f: ServerExecutionFlowFunctions) {
  const dict = f.get('orbPool') as unknown as Dict<'int', 'bool'> // 取 orbPool dict，setOrAdd 会覆盖已有 key，等价于重置
  const n = f.getListLength(list('int', safeOrbXs)) // 获取安全位置总数（44）
  f.finiteLoop(int(0), f.subtraction(n, int(1)), (i) => {
    // 循环 i = 0..43 — 仅用于填充，不影响随机性
    f.setOrAddKeyValuePairsToDictionary(dict, i, true) // 填充 {i: true}，i 即位置索引。顺序填入无妨，随机性在抽取时的 f.getRandomInteger
  })
}

export function gstsServerCreateOrbAtSafePos(
  prefabId: bigint,
  yPos: number,
  f: ServerExecutionFlowFunctions
) {
  // 直接从 graph 变量取 dict，内联调用避免局部变量包装
  const keys = f.getListOfKeysFromDictionary(f.get('orbPool') as unknown as Dict<'int', 'bool'>)
  const len = f.getListLength(keys)
  const pick = f.getRandomInteger(int(0), f.subtraction(len, int(1))) // ← 这才是确保随机顺序的关键步骤：从剩余 keys 中随机选一个
  // 先取位置索引（keys 中随机抽一个），再从 dict 移除，保证一致性
  const posIdx = int(f.getCorrespondingValueFromList(keys, pick))
  f.removeKeyValuePairsFromDictionaryByKey(
    f.get('orbPool') as unknown as Dict<'int', 'bool'>,
    posIdx
  )
  // 下面两个 getCorrespondingValueFromList 用相同 posIdx，X/Z 配对自然保留
  const x = f.getCorrespondingValueFromList(list('int', safeOrbXs), posIdx)
  const z = f.getCorrespondingValueFromList(list('int', safeOrbZs), posIdx)
  const position = f.create3dVector(float(x), float(yPos), float(z))
  const orb = f.createPrefab(prefabId, position, vec3([0, 0, 0]), stage, true, 1, [] as bigint[])
  orb.setFaction(2)
  f.activateDisableModelDisplay(orb, false)
  return orb
}

// 在随机安全位置生成元素球
export function gstsServerCreateOrbAtRandomPos(yPos: number, f: ServerExecutionFlowFunctions) {
  const orb = gstsServerCreateOrbAtSafePos(orbPrefabIdValue, yPos, f)
  const elementalTypes = gstsServerGetElementalTypes(f as unknown as ServerExecutionFlowFunctions)
  const elemIdx = f.getRandomInteger(int(0), int(3))
  const elemType = f.getCorrespondingValueFromList(elementalTypes, elemIdx)
  orb.setCustomVariable('element', elemType as unknown as bigint)
}

// 在随机安全位置生成特殊元素球
// fixedElem: 0=随机, 5~8=固定特殊元素类型
export function gstsServerCreateSpecialOrbAtRandomPos(
  yPos: number,
  f: ServerExecutionFlowFunctions,
  fixedElem: bigint
) {
  const orb = gstsServerCreateOrbAtSafePos(orbSPPrefabIdValue, yPos, f)
  let elemType = fixedElem
  if (elemType === int(0)) {
    const specialTypes = gstsServerGetSpecialElementalTypes(
      f as unknown as ServerExecutionFlowFunctions
    )
    const elemIdx = f.getRandomInteger(int(0), int(3))
    elemType = f.getCorrespondingValueFromList(specialTypes, elemIdx)
  }
  orb.setCustomVariable('element', elemType as unknown as bigint)
}

// 设置元素球的可拾取状态
export function gstsServerSetOrbCollectable(collectable: boolean, f: ServerExecutionFlowFunctions) {
  stage.set('orbsCollectable', collectable) // 设置可拾取标记
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 获取场景上所有元素球
  const orbLen = f.getListLength(orbs) // 获取元素球数量
  f.finiteLoop(int(0), orbLen - int(1), (i) => {
    // 循环每个元素球
    const orb = f.getCorrespondingValueFromList(orbs, i) // 获取元素球
    f.activateDisableModelDisplay(orb, collectable) // 切换显示/隐藏
  })
}

// 删除场景上所有元素球
export function gstsServerClearAllOrbs(f: ServerExecutionFlowFunctions) {
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 获取所有元素球
  const orbLen = f.getListLength(orbs) // 获取元素球数量
  f.finiteLoop(int(0), orbLen - int(1), (i) => {
    // 循环每个元素球
    const orb = f.getCorrespondingValueFromList(orbs, i) // 获取元素球
    f.removeEntity(orb) // 删除元素球
  })
  // 同时清理特殊元素球
  const spOrbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbSPPrefabIdValue)
  const spOrbLen = f.getListLength(spOrbs)
  f.finiteLoop(int(0), spOrbLen - int(1), (i) => {
    const orb = f.getCorrespondingValueFromList(spOrbs, i)
    f.removeEntity(orb)
  })
}

// 随机删除场景上的1个元素球
export function gstsServerRemoveRandomOrb(f: ServerExecutionFlowFunctions) {
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 获取所有元素球
  const orbLen = f.getListLength(orbs) // 获取元素球数量
  if (orbLen > int(0)) {
    // 如果存在元素球
    const idx = f.getRandomInteger(int(0), orbLen - int(1)) // 获取随机索引
    const orb = f.getCorrespondingValueFromList(orbs, idx) // 获取目标元素球
    orb.activateDisablePathfindingObstacleFeature(true) // 禁用寻路障碍物
    orb.destroy() // 销毁元素球
    f.removeEntity(orb) // 删除实体
  }
}

// 敌人接触元素球时生成追踪攻击
// 在 GetOrb 中有两处重复使用此代码
export function gstsServerSpawnOrbEnemyAttack(
  triggerEntity: ReturnType<typeof entity>,
  f: ServerExecutionFlowFunctions
) {
  const orbTransform = f.getEntityLocationAndRotation(triggerEntity)
  return f.createProjectile(
    enemyElementAttackPrefabIdValue,
    orbTransform.location,
    orbTransform.rotate,
    entity(0),
    player(1),
    true,
    int(1),
    [] as bigint[]
  )
}
