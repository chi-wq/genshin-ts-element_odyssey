import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes' // 服务器执行流函数

import {
  enemyElementAttackPrefabIdValue,
  orbPrefabIdValue,
  orbSPMax,
  orbSPMin,
  orbSPPrefabIdValue
} from '../config/constants'
import { gstsServerGetElementalTypes, gstsServerGetSpecialElementalTypes } from './elementSystem'

// 在随机位置生成元素球
export function gstsServerCreateOrbAtRandomPos(yPos: number, f: ServerExecutionFlowFunctions) {
  const x = f.getRandomInteger(int(-10), int(10)) // 随机生成X坐标
  const z = f.getRandomInteger(int(-10), int(10)) // 随机生成Z坐标
  const position = f.create3dVector(float(x), float(yPos), float(z)) // 创建3D向量
  const orb = f.createPrefab(
    // 生成元素球预制体
    orbPrefabIdValue, // 元素球预制体ID
    position, // 生成位置
    vec3([0, 0, 0]), // 无旋转
    stage, // 放置在场景中
    true, // 激活
    1, // 层级
    [] as bigint[] // 无额外参数
  )
  orb.setFaction(2) // 设置阵营为2
  f.activateDisableModelDisplay(orb, false) // 禁用模型显示（初始隐藏）
  // 随机设置元素类型，保存到元素球的自定义变量中
  const elementalTypes = gstsServerGetElementalTypes(f as unknown as ServerExecutionFlowFunctions) // 获取元素列表
  const elemIdx = f.getRandomInteger(int(0), int(3)) // 获取随机索引
  const elemType = f.getCorrespondingValueFromList(elementalTypes, elemIdx) // 获取对应元素
  orb.setCustomVariable('element', elemType as unknown as bigint) // 将元素保存到自定义变量
}

// 在随机位置生成特殊元素球
// fixedElem: 0=随机, 5~8=固定特殊元素类型
export function gstsServerCreateSpecialOrbAtRandomPos(
  yPos: number,
  f: ServerExecutionFlowFunctions,
  fixedElem: bigint
) {
  const x = f.getRandomInteger(int(-10), int(10)) // 随机生成X坐标
  const z = f.getRandomInteger(int(-10), int(10)) // 随机生成Z坐标
  const position = f.create3dVector(float(x), float(yPos), float(z)) // 创建3D向量
  const orb = f.createPrefab(
    // 生成特殊元素球预制体
    orbSPPrefabIdValue, // 特殊元素球预制体ID
    position, // 生成位置
    vec3([0, 0, 0]), // 无旋转
    stage, // 放置在场景中
    true, // 激活
    1, // 层级
    [] as bigint[] // 无额外参数
  )
  orb.setFaction(2) // 设置阵营为2
  f.activateDisableModelDisplay(orb, false) // 禁用模型显示（初始隐藏）
  // 设置特殊元素类型
  let elemType = fixedElem
  if (elemType === int(0)) {
    // 0=随机选择
    const specialTypes = gstsServerGetSpecialElementalTypes(
      f as unknown as ServerExecutionFlowFunctions
    )
    const elemIdx = f.getRandomInteger(int(0), int(3)) // 获取随机索引（0~3）
    elemType = f.getCorrespondingValueFromList(specialTypes, elemIdx)
  }
  orb.setCustomVariable('element', elemType as unknown as bigint) // 将元素保存到自定义变量
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
