import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes' // 服务器执行流函数

import { battleStageConfig } from '../config/battleStageConfig'
import { factionEnemy, maxStageIdx, monitorElementalReaction } from '../config/constants'
import { spawnSlots } from '../config/spawnSlots'
import {
  enemyFighter,
  enemyHilichurl,
  enemyHydroSamachurl,
  enemyPyroSlime,
  enemyRuinGuard,
  gstsServerGetPrefabByName
} from '../utils/enemyPrefabs'
import { gstsServerGetListValue, gstsServerGetListValue0 } from '../utils/stageUtils'

// 生成单个敌人（不更新计数）
export function gstsServerSpawnEnemy(
  enemyPrefab: ReturnType<typeof prefabId>, // 敌人预制体ID
  position: ReturnType<typeof vec3>, // 生成位置
  rotation: ReturnType<typeof vec3>, // 旋转
  f: ServerExecutionFlowFunctions // 执行流函数
) {
  const enemy = f.createPrefab(enemyPrefab, position, rotation, stage, true, 1, [] as bigint[]) // 生成敌人
  enemy.setFaction(factionEnemy) // 设置为敌方阵营
  // 给敌人附加元素反应监测单元状态
  f.addUnitStatus(enemy, enemy, monitorElementalReaction, int(1), dict('str', 'float', null))
}

// 根据位置/旋转索引获取对应的 vec3 值
export function gstsServerGetEnemyPosByIdx(
  idx: bigint,
  f: ServerExecutionFlowFunctions
): ReturnType<typeof vec3> {
  const positions = list('vec3', spawnSlots.positions)
  return f.getCorrespondingValueFromList(positions, idx)
}
export function gstsServerGetEnemyRotByIdx(
  idx: bigint,
  f: ServerExecutionFlowFunctions
): ReturnType<typeof vec3> {
  const rotations = list('vec3', spawnSlots.rotations)
  return f.getCorrespondingValueFromList(rotations, idx)
}

// 生成单个槽位的敌人
export function gstsServerSpawnSlot(
  slotType: ReturnType<typeof str>,
  slotPosIdx: bigint,
  slotRotIdx: bigint,
  f: ServerExecutionFlowFunctions
) {
  if (slotType !== str('')) {
    const prefab = gstsServerGetPrefabByName(slotType)
    const pos = gstsServerGetEnemyPosByIdx(slotPosIdx, f)
    const rot = gstsServerGetEnemyRotByIdx(slotRotIdx, f)
    gstsServerSpawnEnemy(prefab, pos, rot, f)
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(1))
  }
}

// 生成敌人波次（从 battleStageConfig 动态读取配置）
export function gstsServerSpawnEnemyWave(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  const slotCount = gstsServerGetListValue(
    battleStageConfig.slotCounts,
    currentStage,
    maxStageIdx,
    'int',
    f
  ) as unknown as bigint
  const startIdx = gstsServerGetListValue(
    battleStageConfig.slotStarts,
    currentStage,
    maxStageIdx,
    'int',
    f
  ) as unknown as bigint
  f.finiteLoop(int(0), slotCount - int(1), (i) => {
    const flatIdx = startIdx + i
    const slotType = gstsServerGetListValue0(
      battleStageConfig.slotTypes,
      flatIdx,
      battleStageConfig.maxSlotIdx,
      'str',
      f
    )
    const slotPos = gstsServerGetListValue0(
      battleStageConfig.slotPoss,
      flatIdx,
      battleStageConfig.maxSlotIdx,
      'int',
      f
    )
    const slotRot = gstsServerGetListValue0(
      battleStageConfig.slotRots,
      flatIdx,
      battleStageConfig.maxSlotIdx,
      'int',
      f
    )
    gstsServerSpawnSlot(slotType, slotPos, slotRot, f)
  })
}

// 清除单个类型的敌人（提取为函数确保 finiteLoop 在独立作用域）
function gstsServerClearEnemyType(
  prefab: ReturnType<typeof prefabId>,
  f: ServerExecutionFlowFunctions
) {
  const entities = f.getEntitiesWithSpecifiedPrefabOnTheField(prefab)
  const count = f.getListLength(entities)
  f.finiteLoop(int(0), count - int(1), (i) => {
    f.removeEntity(f.getCorrespondingValueFromList(entities, i))
  })
}

// 清除所有敌人（运行时用字典管理敌人类型列表，新增敌人只需加一对 k/v）
export function gstsServerClearAllEnemies(f: ServerExecutionFlowFunctions) {
  const dict = f.assemblyDictionary([
    { k: str('hilichurl'), v: enemyHilichurl },
    { k: str('pyroSlime'), v: enemyPyroSlime },
    { k: str('fighter'), v: enemyFighter },
    { k: str('hydroSamachurl'), v: enemyHydroSamachurl },
    { k: str('ruinGuard'), v: enemyRuinGuard }
  ])
  const prefabs = f.getListOfValuesFromDictionary(dict)
  const numTypes = f.getListLength(prefabs)
  f.finiteLoop(int(0), numTypes - int(1), (i) => {
    const prefab = f.getCorrespondingValueFromList(prefabs, i)
    gstsServerClearEnemyType(prefab, f)
  })
  stage.set('enemyCount', int(0)) // 敌人计数归零
}

// 处理敌人击杀：设置元素球可拾取、更新分数和反应消息
export function gstsServerHandleEnemyKill(f: ServerExecutionFlowFunctions) {
  stage.set('orbsCollectable', true)
  stage.set('collectableTimeout', int(5))
  const currentCount = stage.get('enemyCount').asType('int')
  stage.set('enemyCount', currentCount - int(1))
  const currentScore = stage.get('score').asType('int')
  const reaction = stage.get('reaction').asType('str')
  if (reaction !== str('')) {
    stage.set('score', currentScore + int(100))
    stage.set('reactionMsg', str('元素反应击杀 100分'))
    stage.set('reactionMsgColor', stage.get('reactionColor').asType('str'))
    stage.set('reaction', str(''))
    stage.set('reactionColor', str(''))
    print(reaction)
    const tMsg = setTimeout(() => {
      if (stage.get('reaction').asType('str') === str('')) {
        stage.set('reactionMsg', str(''))
        stage.set('reactionMsgColor', str(''))
      }
      clearTimeout(tMsg)
    }, 3000)
  } else {
    stage.set('score', currentScore + int(1))
    print(str('普通击杀 +1分'))
  }
  print(str('分数:'))
  console.log(stage.get('score').asType('int'))
}
