// 枚举类型导入

import {
  DecisionRefreshMode, // 决策刷新模式
  EntityType, // 实体类型
  SettlementStatus, // 结算状态
  UIControlGroupStatus // UI控件组状态
} from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes' // 服务器执行流函数
import { g } from 'genshin-ts/runtime/core' // 运行时核心

import { Signal } from './resources/signals'

// === 元素常量 ===
const Cryo = int(1) // 冰元素
const Pyro = int(2) // 火元素
const Hydro = int(3) // 水元素
const Electro = int(4) // 雷元素
// === 特殊元素常量（增益型） ===
const Anemo = int(5) // 风元素（加时间）
const Geo = int(6) // 岩元素（加护盾）
const Dendro = int(7) // 草元素（回血）
const Light = int(8) // 光元素（当下场上敌人全灭清空）

// === 主元素图标ID ===
const CryoMainIcon = int(1073742037) // 主冰图标
const PyroMainIcon = int(1073742015) // 主火图标
const HydroMainIcon = int(1073742059) // 主水图标
const ElectroMainIcon = int(1073742081) // 主雷图标

// === 副元素图标ID ===
const CryoSubIcon = int(1073742298) // 副冰图标
const PyroSubIcon = int(1073742292) // 副火图标
const HydroSubIcon = int(1073742296) // 副水图标
const ElectroSubIcon = int(1073742294) // 副雷图标

// === 计时器UI ID ===
const InitTimer = int(1073741874) // 初始化计时器UI
const StageTimer = int(1073741860) // 阶段计时器UI

// === 敌人相关常量 ===
const factionEnemy = 4 // 敌方阵营编号
const enemyHilichurl = prefabId(1082130439) // 丘丘人
const enemyPyroSlime = prefabId(1082130443) // 火史莱姆
const enemyFighter = prefabId(1082130444) // 打手丘丘人
const enemyHydroSamachurl = prefabId(1082130445) // 水萨满
const enemyRuinGuard = prefabId(1082130446) // 遗迹守卫

// === 元素球相关常量 ===
const orbPrefabIdValue = prefabId(1077936129) // 元素球预制体ID
const orbCount = 10 // 元素球生成数量
// 新增特殊元素球，风（加时间）,岩元素（加护盾）,草元素（直接回血）
const orbSPPrefabIdValue = prefabId(1077936185) // 特殊元素球预制体ID
const orbSPMin = 1 // 特殊元素球最少一个
const orbSPMax = 3 // 特殊元素球最多三个

// === 卡牌选择器常量 ===
// 卡牌序号：1=生命回复, 2=护盾, 3=增加时间, 4=敌人全灭
const CardHeal = int(1) // 生命回复
const CardShield = int(2) // 护盾
const CardTime = int(3) // 增加时间
const CardClearEnemies = int(4) // 敌人全灭
const DeckSelectorIndex = int(1073742343) // 卡牌选择器索引
const DeckSelectorDuration = float(60) // 选择时长
const DeckSelectorSelectMin = int(1) // 选择数量下限
const DeckSelectorSelectMax = int(1) // 选择数量上限

// === E技能图标 ===
const ESkillIndex = int(1073742360) // E技能图片控件索引
const CardHealIcon = int(111128) // 生命回复图标
const CardShieldIcon = int(111111) // 护盾图标
const CardTimeIcon = int(111016) // 增加时间图标
const CardClearEnemiesIcon = int(111025) // 敌人全灭图标

// === 元素攻击相关常量 ===
const elementAttackPrefabIdValue = prefabId(1077936177) // 元素攻击预制体ID
const monitorElementalReaction = configId(1077936129) // 元素反应监测配置ID
const enemyElementAttackPrefabIdValue = prefabId(1077936186) // 敌方元素攻击预制体ID

// 护盾
const geoShieldConfigId = configId(1077936131) // 单位状态护盾

// === 敌人出生位置与旋转（固定值） ===
const enemyPos1 = vec3([1, 3.5, 0]) // 敌人出生位置1
const enemyPos2 = vec3([-1, 3.5, 0]) // 敌人出生位置2
const enemyRot1 = vec3([0, 0, 0]) // 敌人旋转1
const enemyRot2 = vec3([0, 150.25, 0]) // 敌人旋转2
const enemyPos3 = vec3([0, 3.5, 2]) // 敌人出生位置3
const enemyRot3 = vec3([0, 90, 0]) // 敌人旋转3

// 获取元素类型列表
function gstsServerGetElementalTypes(f: ServerExecutionFlowFunctions) {
  return list('int', [Cryo, Pyro, Hydro, Electro]) // 返回4种元素的列表
}

// 更新元素图标UI（主或副）
function gstsServerUpdateElementIcons(
  elem: bigint, // 元素值
  isMain: boolean, // 主元素还是副元素
  f: ServerExecutionFlowFunctions // 执行流函数
) {
  const p = player(1) // 获取玩家1
  const icons = isMain // 根据主副选择图标数组
    ? [CryoMainIcon, PyroMainIcon, HydroMainIcon, ElectroMainIcon] // 主元素图标数组
    : [CryoSubIcon, PyroSubIcon, HydroSubIcon, ElectroSubIcon] // 副元素图标数组
  // 关闭所有图标
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[0], UIControlGroupStatus.Off) // 冰图标关
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[1], UIControlGroupStatus.Off) // 火图标关
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[2], UIControlGroupStatus.Off) // 水图标关
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[3], UIControlGroupStatus.Off) // 雷图标关
  // 开启对应图标
  if (elem === Cryo) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[0], UIControlGroupStatus.On) // 冰图标开
  } else if (elem === Pyro) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[1], UIControlGroupStatus.On) // 火图标开
  } else if (elem === Hydro) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[2], UIControlGroupStatus.On) // 水图标开
  } else if (elem === Electro) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[3], UIControlGroupStatus.On) // 雷图标开
  }
}

// 根据元素执行initiateAttack（elem: 1=冰,2=火,3=水,4=雷）
// dmgCoeff: 伤害系数（0=无伤害·仅元素附着）
function gstsServerElementAttack(
  elem: bigint, // 元素值
  hitEntity: ReturnType<typeof entity>, // 命中实体
  hitLocation: ReturnType<typeof vec3>, // 命中位置
  rot: ReturnType<typeof vec3>, // 旋转
  sourceEntity: ReturnType<typeof entity>, // 发射源实体
  f: ServerExecutionFlowFunctions, // 执行流函数
  dmgCoeff: ReturnType<typeof float> // 伤害系数（0=仅元素附着，1=正常伤害）
) {
  if (elem !== int(0)) {
    // 仅当元素值不为0时执行
    const elementNames = list('str', [
      // 元素名称列表
      str(''), // 0: 空
      str('Cryo'), // 1: 冰
      str('Pyro'), // 2: 火
      str('Hydro'), // 3: 水
      str('Electro') // 4: 雷
    ])
    const elemName = f.getCorrespondingValueFromList(elementNames, elem) // 从列表中获取元素名
    f.initiateAttack(
      // 开始攻击
      hitEntity, // 攻击目标
      dmgCoeff, // 攻击倍率（0=仅元素附着，1=正常伤害）
      float(0), // 额外伤害
      hitLocation, // 命中位置
      rot, // 旋转
      elemName as unknown as ReturnType<typeof str>, // 元素名称
      true, // 覆盖能力单元设置
      sourceEntity // 发射源
    )
  }
}

// 获取元素反应名称（不发生反应时返回空字符串）
function gstsServerGetReactionName(
  mainElem: bigint, // 主元素
  subElem: bigint, // 副元素
  f: ServerExecutionFlowFunctions // 执行流函数
): ReturnType<typeof str> {
  let ret = str('') // 无反应（空字符串）
  // 根据主元素和副元素的组合判断元素反应名称
  if (mainElem === int(1) || subElem === int(1)) {
    // 包含冰元素的反应
    if (mainElem === int(2) || subElem === int(2)) {
      // 冰+火 → 融化
      ret = str('1熔')
    } else if (mainElem === int(3) || subElem === int(3)) {
      // 冰+水 → 冻结
      ret = str('2冻')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 冰+雷 → 超导
      ret = str('3超导')
    }
  } else if (mainElem === int(2) || subElem === int(2)) {
    // 包含火元素的反应（冰以外）
    if (mainElem === int(3) || subElem === int(3)) {
      // 火+水 → 蒸发
      ret = str('4蒸')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 火+雷 → 超载
      ret = str('5超载')
    }
  } else {
    // 剩余组合 → 水+雷 → 感电
    ret = str('6感电')
  }
  return ret // 返回元素反应名称
}

// 获取元素反应的颜色（HEX颜色字符串，无反应时返回空字符串）
function gstsServerGetReactionColor(
  mainElem: bigint, // 主元素
  subElem: bigint, // 副元素
  f: ServerExecutionFlowFunctions // 执行流函数
): ReturnType<typeof str> {
  let ret = str('') // 无反应（空字符串）
  if (mainElem === int(1) || subElem === int(1)) {
    // 包含冰元素的反应
    if (mainElem === int(2) || subElem === int(2)) {
      // 融化（冰+火）→ 橙色
      ret = str('#FF6633')
    } else if (mainElem === int(3) || subElem === int(3)) {
      // 冻结（冰+水）→ 冰蓝
      ret = str('#99FFFF')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 超导（冰+雷）→ 蓝紫
      ret = str('#B065E0')
    }
  } else if (mainElem === int(2) || subElem === int(2)) {
    // 包含火元素的反应（冰以外）
    if (mainElem === int(3) || subElem === int(3)) {
      // 蒸发（火+水）→ 橙色
      ret = str('#FF9933')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 超载（火+雷）→ 红色
      ret = str('#FF3366')
    }
  } else {
    // 感电（水+雷）→ 紫色
    ret = str('#CC77FF')
  }
  return ret // 返回元素反应颜色
}

// 在随机位置生成元素球
function gstsServerCreateOrbAtRandomPos(yPos: number, f: ServerExecutionFlowFunctions) {
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

// 获取特殊元素类型列表（增益型）
function gstsServerGetSpecialElementalTypes(f: ServerExecutionFlowFunctions) {
  return list('int', [Anemo, Geo, Dendro, Light]) // 返回4种特殊元素的列表
}

// 在随机位置生成特殊元素球
function gstsServerCreateSpecialOrbAtRandomPos(yPos: number, f: ServerExecutionFlowFunctions) {
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
  // 随机设置特殊元素类型，保存到元素球的自定义变量中
  const specialTypes = gstsServerGetSpecialElementalTypes(
    f as unknown as ServerExecutionFlowFunctions
  ) // 获取特殊元素列表
  const elemIdx = f.getRandomInteger(int(0), int(3)) // 获取随机索引（0~3）
  const elemType = f.getCorrespondingValueFromList(specialTypes, elemIdx) // 获取对应元素
  orb.setCustomVariable('element', elemType as unknown as bigint) // 将元素保存到自定义变量
}

// 设置元素球的可拾取状态
function gstsServerSetOrbCollectable(collectable: boolean, f: ServerExecutionFlowFunctions) {
  stage.set('orbsCollectable', collectable) // 设置可拾取标记
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 获取场景上所有元素球
  const orbLen = f.getListLength(orbs) // 获取元素球数量
  f.finiteLoop(int(0), orbLen - int(1), (i) => {
    // 循环每个元素球
    const orb = f.getCorrespondingValueFromList(orbs, i) // 获取元素球
    f.activateDisableModelDisplay(orb, collectable) // 切换显示/隐藏
  })
}

// 生成单个敌人（不更新计数）
function gstsServerSpawnEnemy(
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

// 生成敌人波次（根据阶段不同，敌人类型和数量不同）
function gstsServerSpawnEnemyWave(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage === int(1)) {
    // 阶段1：2只丘丘人
    gstsServerSpawnEnemy(enemyHilichurl, enemyPos1, enemyRot1, f) // 第1只丘丘人
    gstsServerSpawnEnemy(enemyHilichurl, enemyPos2, enemyRot2, f) // 第2只丘丘人
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(2)) // 敌人数+2
  } else if (currentStage === int(2)) {
    // 阶段2：1只丘丘人 + 1只火史莱姆
    gstsServerSpawnEnemy(enemyHilichurl, enemyPos1, enemyRot1, f) // 丘丘人
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos2, enemyRot2, f) // 火史莱姆
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(2)) // 敌人数+2
  } else if (currentStage === int(3)) {
    // 阶段3：2只打手丘丘人 + 1只火史莱姆
    gstsServerSpawnEnemy(enemyFighter, enemyPos1, enemyRot1, f) // 第1只打手丘丘人
    gstsServerSpawnEnemy(enemyFighter, enemyPos2, enemyRot2, f) // 第2只打手丘丘人
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos3, enemyRot3, f) // 火史莱姆
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(3)) // 敌人数+3
  } else if (currentStage === int(4)) {
    // 阶段4：2只打手丘丘人 + 1只水萨满
    gstsServerSpawnEnemy(enemyFighter, enemyPos1, enemyRot1, f) // 第1只打手丘丘人
    gstsServerSpawnEnemy(enemyHydroSamachurl, enemyPos2, enemyRot2, f) // 水萨满
    gstsServerSpawnEnemy(enemyFighter, enemyPos3, enemyRot3, f) // 第2只打手丘丘人
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(3)) // 敌人数+3
  } else {
    // 阶段5：1只遗迹守卫 + 2只火史莱姆
    gstsServerSpawnEnemy(enemyRuinGuard, enemyPos1, enemyRot1, f) // 遗迹守卫
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos2, enemyRot2, f) // 第1只火史莱姆
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos3, enemyRot3, f) // 第2只火史莱姆
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(3)) // 敌人数+3
  }
}

// 将卡牌效果序号转换为对应的特殊元素常量
// 1(回血)→7, 2(护盾)→6, 3(加时间)→5, 4(全灭)→8
function gstsServerCardEffectToElement(cardEffect: bigint): bigint {
  let result = int(0)
  if (cardEffect === CardHeal) {
    result = Dendro
  } else if (cardEffect === CardShield) {
    result = Geo
  } else if (cardEffect === CardTime) {
    result = Anemo
  } else if (cardEffect === CardClearEnemies) {
    result = Light
  }
  return result
}

// 将卡牌效果序号转换为对应的图标素材ID
function gstsServerCardEffectToIcon(cardEffect: bigint): bigint {
  let result = int(0)
  if (cardEffect === CardHeal) {
    result = CardHealIcon
  } else if (cardEffect === CardShield) {
    result = CardShieldIcon
  } else if (cardEffect === CardTime) {
    result = CardTimeIcon
  } else if (cardEffect === CardClearEnemies) {
    result = CardClearEnemiesIcon
  }
  return result
}

// 设置E技能的图标（通过关卡实体的变量通知图片控件）
function gstsServerSetESkillIcon(iconId: bigint) {
  stage.set('ESkillIcon', iconId)
}

// 应用增益效果（根据特殊元素常量 5~8）
// 5(风)=加时间, 6(岩)=护盾, 7(草)=回血, 8(光)=全灭
function gstsServerApplyBuffEffect(
  elem: bigint,
  targetEntity: ReturnType<typeof entity>,
  f: ServerExecutionFlowFunctions
) {
  if (elem === Dendro) {
    // 生命回复
    f.recoverHpDirectly(
      targetEntity,
      targetEntity,
      float(10000),
      true,
      float(0),
      float(0),
      [] as string[]
    )
    print(str('生命回复！'))
  } else if (elem === Geo) {
    // 护盾
    f.addUnitStatus(
      targetEntity,
      targetEntity,
      geoShieldConfigId,
      int(1),
      dict('str', 'float', null)
    )
    print(str('获得护盾！'))
  } else if (elem === Anemo) {
    // 增加时间
    f.modifyGlobalTimer(stage, 'StageTimer', float(30))
    print(str('时间+30秒！'))
  } else if (elem === Light) {
    // 敌人全灭
    gstsServerClearAllEnemies(f)
    print(str('场上敌人全灭！'))
  }
}
function gstsServerClearAllEnemies(f: ServerExecutionFlowFunctions) {
  // 清除丘丘人
  const e1 = f.getEntitiesWithSpecifiedPrefabOnTheField(enemyHilichurl)
  const l1 = f.getListLength(e1)
  f.finiteLoop(int(0), l1 - int(1), (i) => {
    f.removeEntity(f.getCorrespondingValueFromList(e1, i))
  })
  // 清除火史莱姆
  const e2 = f.getEntitiesWithSpecifiedPrefabOnTheField(enemyPyroSlime)
  const l2 = f.getListLength(e2)
  f.finiteLoop(int(0), l2 - int(1), (i) => {
    f.removeEntity(f.getCorrespondingValueFromList(e2, i))
  })
  // 清除打手丘丘人
  const e3 = f.getEntitiesWithSpecifiedPrefabOnTheField(enemyFighter)
  const l3 = f.getListLength(e3)
  f.finiteLoop(int(0), l3 - int(1), (i) => {
    f.removeEntity(f.getCorrespondingValueFromList(e3, i))
  })
  // 清除水萨满
  const e4 = f.getEntitiesWithSpecifiedPrefabOnTheField(enemyHydroSamachurl)
  const l4 = f.getListLength(e4)
  f.finiteLoop(int(0), l4 - int(1), (i) => {
    f.removeEntity(f.getCorrespondingValueFromList(e4, i))
  })
  // 清除遗迹守卫
  const e5 = f.getEntitiesWithSpecifiedPrefabOnTheField(enemyRuinGuard)
  const l5 = f.getListLength(e5)
  f.finiteLoop(int(0), l5 - int(1), (i) => {
    f.removeEntity(f.getCorrespondingValueFromList(e5, i))
  })
  stage.set('enemyCount', int(0)) // 敌人计数归零
}

// 删除场景上所有元素球
function gstsServerClearAllOrbs(f: ServerExecutionFlowFunctions) {
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 获取所有元素球
  const orbLen = f.getListLength(orbs) // 获取元素球数量
  f.finiteLoop(int(0), orbLen - int(1), (i) => {
    // 循环每个元素球
    const orb = f.getCorrespondingValueFromList(orbs, i) // 获取元素球
    f.removeEntity(orb) // 删除元素球
  })
  return int(0) // 返回值
}

// 随机删除场景上的1个元素球
function gstsServerRemoveRandomOrb(f: ServerExecutionFlowFunctions) {
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
  return int(0) // 返回值
}

// 设置结算状态（胜利或失败）
function gstsServerSettleSuccessStatus(challengeState: bigint, f: ServerExecutionFlowFunctions) {
  if (challengeState !== int(0)) {
    // 如果挑战状态不为0
    const player1 = player(1) // 获取玩家1
    // 删除所有元素球
    gstsServerClearAllOrbs(f)
    // 停止全局计时器并隐藏UI
    f.stopGlobalTimer(stage, 'StageTimer') // 停止阶段计时器
    stage.set('stageTimerActive', false) // 设置阶段计时器运行标记为false
    f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // 隐藏计时器UI
    if (challengeState === int(1)) {
      // 胜利时
      f.setPlayerSettlementSuccessStatus(player1, SettlementStatus.Victory) // 设置胜利状态
    } else if (challengeState === int(2)) {
      // 失败时
      f.setPlayerSettlementSuccessStatus(player1, SettlementStatus.Defeat) // 设置失败状态
    }
    // 在结算画面显示分数
    const finalScore = stage.get('score').asType('int') // 获取最终分数
    f.setPlayerSettlementScoreboardDataDisplay(player1, int(1), str('分数'), finalScore) // 在计分板显示
    f.settleStage() // 结算场景
  }
}

// 进入下一阶段
function gstsServerNextStage(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage !== int(0)) {
    // 如果当前阶段不为0
    const player1 = player(1) // 获取玩家1
    // 删除所有元素球
    gstsServerClearAllOrbs(f)
    // 停止全局计时器并隐藏UI
    f.stopGlobalTimer(stage, 'StageTimer') // 停止阶段计时器
    stage.set('stageTimerActive', false) // 设置阶段计时器运行标记为false
    f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // 隐藏计时器UI
    const maxStage = stage.get('maxStage').asType('int') // 获取最大阶段数
    if (currentStage === maxStage) {
      // 到达最终阶段时
      print(str('到达最终阶段，开始结算处理...')) // 调试日志
      gstsServerSettleSuccessStatus(int(1), f as unknown as ServerExecutionFlowFunctions) // 胜利结算
    } else {
      // 还有下一阶段时
      print(str('开始下一阶段...')) // 调试日志
      f.set('challengeState', int(3), true) // 设置挑战状态为中断
      stage.set('teleportFrom', int(currentStage)) // 记录传送起点
      f.teleportPlayer(player1, vec3([224.67, 3.39, -2.78]), vec3([0, 272.89, 0])) // 传送玩家
      print(str('玩家已传送至下一阶段')) // 调试日志
    }
  }
}

// 初始化阶段变量
function gstsServerInitializeStageVariables(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  stage.set('enemyCount', int(0)) // 初始化敌人数为0
  gstsServerSetOrbCollectable(false, f as unknown as ServerExecutionFlowFunctions) // 设置元素球不可拾取
  stage.set('collectableTimeout', int(0)) // 初始化拾取超时为0
  stage.set('orbsCollected', int(0)) // 初始化已收集元素球数为0
  stage.set('spawnTimer', int(0)) // 初始化生成计时器为0
  // 分数跨阶段累积，不重置
  stage.set('reaction', str('')) // 初始化元素反应名为空字符串
  stage.set('reactionColor', str('')) // 初始化元素反应颜色为空字符串
  stage.set('reactionMsg', str('')) // 初始化元素反应消息为空字符串
  stage.set('reactionMsgColor', str('')) // 初始化元素反应消息颜色为空字符串
  stage.set('stageTimerActive', false) // 初始化阶段计时器运行标记为false
  const initElement = f.getRandomInteger(int(1), int(4)) // 随机决定主元素
  stage.set('mainElement', initElement) // 设置主元素
  gstsServerUpdateElementIcons(initElement, true, f) // 更新主元素图标
  // 副元素设为与主元素不同的值（加偏移1～3，超过4则-4）
  const offset = f.getRandomInteger(int(1), int(3)) // 获取随机偏移
  let initSub = initElement + offset // 计算副元素
  if (initSub > int(4)) {
    // 超过4时
    initSub = initSub - int(4) // 回绕
  }
  stage.set('subElement', initSub) // 设置副元素
  gstsServerUpdateElementIcons(initSub, false, f) // 更新副元素图标
  f.set('challengeState', int(0), true) // 设置挑战状态为进行中
  // 阶段难度设置表（共5个阶段）
  const stageMaxEnemies = list('int', [int(12), int(18), int(24), int(30), int(36)]) // 各阶段的最大敌人数
  const stageOrbsRequired = list('int', [int(3), int(4), int(5), int(6), int(7)]) // 各阶段所需元素球数
  let idx = currentStage - int(1) // 计算索引
  if (idx > int(4)) {
    // 索引超出范围时
    idx = int(4) // 钳位到最大值
  }
  stage.set('maxEnemies', f.getCorrespondingValueFromList(stageMaxEnemies, idx)) // 设置最大敌人数
  stage.set('orbsRequired', f.getCorrespondingValueFromList(stageOrbsRequired, idx)) // 设置所需元素球数
  stage.set('cardEffect', int(0)) // 初始化卡牌效果为无
  gstsServerSetESkillIcon(int(0)) // 清除E技能图标
}

// 创建阶段
function gstsServerCreateStage(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage !== int(0)) {
    // 如果当前阶段不为0
    // 初始化阶段变量（根据阶段设置难度）
    gstsServerInitializeStageVariables(currentStage, f)

    // 在随机位置生成元素球（10个）
    f.finiteLoop(int(0), int(orbCount - 1), () => {
      gstsServerCreateOrbAtRandomPos(3.2, f as unknown as ServerExecutionFlowFunctions) // 生成1个元素球
    })

    // 额外生成1~3个特殊元素球（风/岩/草）
    const spCount = f.getRandomInteger(orbSPMin, orbSPMax) // 随机决定本阶段生成几个特殊元素球
    f.finiteLoop(int(0), spCount - int(1), () => {
      gstsServerCreateSpecialOrbAtRandomPos(3.2, f as unknown as ServerExecutionFlowFunctions) // 生成1个特殊元素球
    })
  }
  return int(0) // 返回值
}

// 战斗计时开始
function gstsServerStartStageIntervalTimer(f: ServerExecutionFlowFunctions) {
  // 阶段计时器（每秒执行，也负责敌人生成）
  const stageTimerInterval = setInterval(() => {
    print(str('阶段计时器执行')) // 调试日志
    const challengeState = f.get('challengeState') as unknown as bigint // 获取挑战状态

    // 检查是否已失败
    if (challengeState === int(2)) {
      print(str('挑战已失败，清除计时器')) // 调试日志
      clearInterval(stageTimerInterval) // 清除计时器
    } else if (challengeState === int(1)) {
      // 检查是否已成功
      print(str('挑战已成功，清除计时器')) // 调试日志
      clearInterval(stageTimerInterval) // 清除计时器
    } else if (challengeState === int(3)) {
      // 中断中（正在传送至下一阶段）
      print(str('挑战已中断，清除计时器')) // 调试日志
      clearInterval(stageTimerInterval) // 清除计时器
    } else {
      // 进行中 - 检查阶段计时器是否失效
      const timerActive = stage.get('stageTimerActive').asType('bool') // 获取计时器运行标记
      if (timerActive) {
        // 计时器应该运行时检查剩余时间
        const timerRemaining = f.getCurrentGlobalTimerTime(stage, 'StageTimer') // 获取剩余时间
        if (timerRemaining <= float(0)) {
          // 计时器已失效（可能因断线等丢失）
          print(str('检测到StageTimer失效！判定失败')) // 调试日志
          f.set('challengeState', int(2), true) // 设置挑战状态为失败
          gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
          clearInterval(stageTimerInterval) // 清除计时器
        }
      }
      // 检测角色是否倒下（HP归零）
      if (f.queryIfAllPlayerCharactersAreDown(player(1))) {
        print(str('检测到角色倒下！失败结算...')) // 调试日志
        f.set('challengeState', int(2), true) // 设置挑战状态为失败
        gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
        clearInterval(stageTimerInterval) // 清除计时器
      }
      // 检查条件
      const currentStage = stage.get('currentStage').asType('int') // 获取当前阶段
      const enemyCount = stage.get('enemyCount').asType('int') // 获取敌人数
      const orbsCollected = stage.get('orbsCollected').asType('int') // 获取已收集元素球数
      const orbsRequired = stage.get('orbsRequired').asType('int') // 获取所需元素球数

      // 输出调试信息
      print(str('敌人数:')) // 敌人数日志
      console.log(enemyCount) // 输出敌人数值
      print(str('已收集元素球数:')) // 已收集元素球数日志
      console.log(orbsCollected) // 输出已收集元素球数值

      // 成功条件：全灭敌人 且 已收集足够元素球
      if (enemyCount === int(0) && orbsCollected >= orbsRequired) {
        print(str('挑战成功！')) // 调试日志
        f.set('challengeState', int(1), true) // 设置挑战状态为成功
        gstsServerNextStage(currentStage, f as unknown as ServerExecutionFlowFunctions) // 进入下一阶段
        clearInterval(stageTimerInterval) // 清除计时器
      } else {
        // 可拾取倒计时逻辑（每秒递减，超时后不可拾取，触发敌人生成）

        const canPickup = stage.get('orbsCollectable').asType('bool') // 获取可拾取标记
        if (canPickup) {
          // 可拾取时
          const countdown = stage.get('collectableTimeout').asType('int') // 获取倒计时值
          if (countdown > int(0)) {
            // 倒计时中
            stage.set('collectableTimeout', countdown - int(1)) // 倒计时减1
          } else {
            // 倒计时结束
            gstsServerSetOrbCollectable(false, f as unknown as ServerExecutionFlowFunctions) // 设置为不可拾取
            send('SpawnEnemyWave') // 发送敌人波次生成信号
          }
        }
        // 敌人生成：每10秒生成1波
        const spawnTimer = stage.get('spawnTimer').asType('int') + int(1) // 增加生成计时器
        stage.set('spawnTimer', spawnTimer) // 更新生成计时器
        if (spawnTimer >= int(10)) {
          // 已过10秒时
          stage.set('spawnTimer', int(0)) // 重置生成计时器
          if (orbsCollected < orbsRequired) {
            // 仍未达到所需元素球数时
            send('SpawnEnemyWave') // 发送敌人波次生成信号
          }
        }
      }
    }
  }, 1000) // 1秒间隔
}
// 当下还没有，但准备新增的机能
// 拾取风元素后，加时间。岩元素后，加一定时间护盾。草元素后，加一定血量
// 记录拾取的各个元素拾取所有元素类型的元素球后，会让场上敌人瞬间清零.(并且显示一个宝箱)
// 打开宝箱后，可以获得各种buff
// 增加一个教程
//
// === StageMain - 阶段主控制 ===
g.server({
  id: 1073741854, // 节点图ID
  name: 'StageMain', // 节点名称
  variables: {
    challengeState: int(0) // 0: 进行中 1: 成功 2: 失败 3: 中断
  }
})
  .on('whenEntityIsCreated', (_evt, f) => {
    // 实体创建时
    if (f.queryIfEntityIsOnTheField(stage)) {
      // 检查场景是否在场
      const inited = stage.get('inited').asType('bool') // 获取已初始化标记
      if (inited) {
        // 已初始化时
        print(str('场景已初始化，跳过设置')) // 调试日志
        return // 跳过
      }
    }
    const interval = setInterval(() => {
      // 每秒轮询
      if (f.queryIfEntityIsOnTheField(stage)) {
        const inited = stage.get('inited').asType('bool')
        if (inited) {
          print(str('场景实体初始化完毕')) // 调试日志
          f.stopGlobalTimer(stage, 'InitTimer')
          f.stopGlobalTimer(stage, 'StageTimer')
          if (
            f.queryIfEntityIsOnTheField(player(1)) &&
            f.getEntityType(player(1)) === EntityType.Player
          ) {
            print(str('玩家在场景上')) // 调试日志
            // 检查场景和玩家是否在场
            // 再检查角色属性是否已加载（maxHp > 0 说明初始化完成）
            const characters = f.getAllCharacterEntitiesOfSpecifiedPlayer(player(1))
            const charLen = f.getListLength(characters)
            if (charLen > int(0)) {
              print(str('玩家拥有的角色不为空')) // 调试日志
              const character = f.getCorrespondingValueFromList(characters, int(0))
              const attrs = f.getCharacterAttribute(
                character as unknown as ReturnType<typeof entity>
              )
              if (attrs.maxHp > float(0)) {
                print(str('玩家角色的属性值可以正常取得')) // 调试日志
                clearInterval(interval) // 清除间隔
                send('StageReady') // 发送场景准备完成信号
              }
            }
          }
        } else {
          // 尚未初始化时
          stage.set('inited', true) // 设置为已初始化
        }
      }
    }, 1000) // 1秒间隔
  })
  .on('whenGlobalTimerIsTriggered', (evt, f) => {
    // 全局计时器触发时
    print(str('计时器触发')) // 调试日志
    if (evt.timerName === 'InitTimer') {
      // 初始化计时器时
      print(str('初始化计时器匹配！正在传送玩家...')) // 调试日志
      const player1 = player(1) // 获取玩家1
      // 停止全局计时器并隐藏UI
      f.stopGlobalTimer(stage, 'InitTimer') // 停止初始化计时器
      f.modifyUiControlStatusWithinTheInterfaceLayout(player1, InitTimer, UIControlGroupStatus.Off) // 隐藏计时器UI
      stage.set('teleportFrom', int(0)) // 设置传送起点为初始区域
      f.teleportPlayer(player1, vec3([10.49, 3.48, 2.97]), vec3([0, -99.36, 0])) // 传送玩家
    } else if (evt.timerName === 'StageTimer') {
      // 阶段计时器时
      print(str('阶段计时器匹配！')) // 调试日志

      // 超时失败处理
      print(str('挑战失败：超时')) // 调试日志
      stage.set('stageTimerActive', false) // 设置阶段计时器运行标记为false
      f.set('challengeState', int(2), true) // 设置挑战状态为失败
      gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
    }
  })
  .onSignal(Signal.StageReady, (_evt, f) => {
    // 收到场景准备完成信号时
    print(str('收到场景准备完成信号！')) // 调试日志
    print(str('场景初始化中...')) // 调试日志
    // 播放BGM（backgroundMusicIndex需替换为实际音乐索引）
    const player1 = player(1) // 获取玩家1
    f.modifyPlayerBackgroundMusic(
      // 设置BGM参数
      player1, // 玩家
      int(10075), // BGM
      float(0), // 开始时间
      float(999), // 结束时间（足够大以播放全曲）
      int(100), // 音量
      true, // 循环播放
      float(0), // 循环间隔
      float(1), // 播放速度
      true // 启用淡入淡出
    )
    f.startPausePlayerBackgroundMusic(player1, true) // 开始播放BGM
    //gstsServerNextStage(int(-1), f as unknown as ServerExecutionFlowFunctions)
    send('PreFightPreparation')
  })
  .onSignal(Signal.SpawnEnemyWave, (_evt, f) => {
    // 收到敌人波次生成信号时
    print(str('收到敌人波次生成信号！正在生成敌人波次...')) // 调试日志
    const enemyCount = stage.get('enemyCount').asType('int') // 获取当前敌人数
    if (enemyCount < stage.get('maxEnemies').asType('int')) {
      // 未达到最大敌人数时
      const currentStage = stage.get('currentStage').asType('int') // 获取当前阶段
      gstsServerSpawnEnemyWave(currentStage, f as unknown as ServerExecutionFlowFunctions) // 生成敌人波次
    }
  })
  .onSignal(Signal.EnterBattleStage, (_evt, f) => {
    // 收到玩家入场信号时
    print(str('收到玩家入场信号！启动阶段计时器...')) // 调试日志
    f.setPlayerRemainingRevives(player(1), int(0)) // 将复活次数设为0
    f.allowForbidPlayerToRevive(player(1), false) // 禁止复苏
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.On) // 显示阶段计时器UI
    f.startGlobalTimer(stage, 'StageTimer') // 启动阶段计时器
    stage.set('stageTimerActive', true) // 设置阶段计时器运行标记为true
    gstsServerStartStageIntervalTimer(f as unknown as ServerExecutionFlowFunctions)
  })
  .onSignal(Signal.PreFightPreparation, (_evt, f) => {
    // 收到玩家退场信号时
    print(str('收到玩家退场信号！停止阶段计时器...')) // 调试日志
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.Off) // 隐藏阶段计时器UI
    f.stopGlobalTimer(stage, 'StageTimer') // 停止阶段计时器
    const currentStage = stage.get('currentStage').asType('int') + int(1) // 计算下一阶段编号
    stage.set('currentStage', currentStage) // 更新当前阶段
    gstsServerCreateStage(currentStage, f as unknown as ServerExecutionFlowFunctions) // 创建新阶段
    // 卡牌序号，1：生命回复，2：护盾，3：增加时间，4：敌人全灭
    // 从4张卡牌中随机选2张
    const firstCard = f.getRandomInteger(int(1), int(4)) // 第一张卡牌 1~4
    const offset = f.getRandomInteger(int(1), int(3)) // 偏移 1~3
    let secondCard = firstCard + offset // 加上偏移保证不同
    if (secondCard > int(4)) {
      secondCard = secondCard - int(4) // 超出则回绕
    }
    f.invokeDeckSelector(
      player(1),
      DeckSelectorIndex, // 卡牌选择器索引
      DeckSelectorDuration, // 选择时长
      [firstCard, secondCard], // 选择结果对应列表
      [firstCard, secondCard], // 选择显示对应列表
      DeckSelectorSelectMin, // 选择数量下限
      DeckSelectorSelectMax, // 选择数量上限
      DecisionRefreshMode.CannotRefresh,
      int(0),
      int(0),
      [firstCard] // 默认返回选择
    )
  })
  .on('whenEntityIsDestroyed', (evt, f) => {
    // 实体销毁时
    const faction = evt.faction as unknown as number // 获取阵营
    if (faction === factionEnemy) {
      // 敌方阵营时
      gstsServerSetOrbCollectable(true, f as unknown as ServerExecutionFlowFunctions) // 设置元素球可拾取
      stage.set('collectableTimeout', int(5)) // 重置5秒倒计时
      const currentCount = stage.get('enemyCount').asType('int') // 获取当前敌人数
      stage.set('enemyCount', currentCount - int(1)) // 敌人数减1
      // 分数：元素反应击杀=100分，普通击杀=1分
      const currentScore = stage.get('score').asType('int') // 获取当前分数
      const reaction = stage.get('reaction').asType('str') // 获取元素反应名称
      if (reaction !== str('')) {
        // 元素反应击杀时
        stage.set('score', currentScore + int(100)) // 分数+100
        stage.set('reactionMsg', str('元素反应击杀 100分')) // 设置反应消息
        stage.set('reactionMsgColor', stage.get('reactionColor').asType('str')) // 设置反应消息颜色
        stage.set('reaction', str('')) // 重置反应名
        stage.set('reactionColor', str('')) // 重置反应颜色
        print(reaction) // 显示元素反应名
        // 3秒后若reaction为空则清除reactionMsg
        const tMsg = setTimeout(() => {
          if (stage.get('reaction').asType('str') === str('')) {
            stage.set('reactionMsg', str('')) // 清除反应消息
            stage.set('reactionMsgColor', str('')) // 清除反应消息颜色
          }
          clearTimeout(tMsg) // 清除超时
        }, 3000) // 3秒后
      } else {
        // 普通击杀时
        stage.set('score', currentScore + int(1)) // 分数+1
        print(str('普通击杀 +1分')) // 调试日志
      }
      print(str('分数:')) // 分数日志
      console.log(stage.get('score').asType('int')) // 输出分数值
    }
  })
  .onSignal(Signal.ClientSignal, (evt, f) => {
    if (evt.params.SignalName === 'ElementAttack') {
      // 收到元素攻击服务器信号时
      print(str('收到元素攻击服务器信号！')) // 调试日志
      const loc = evt.params.Location // 获取攻击发射位置
      const rot = evt.params.Rotate // 获取攻击旋转

      const elementAttack = f.createProjectile(
        // 生成投射物
        elementAttackPrefabIdValue, // 元素攻击预制体ID
        loc, // 发射位置
        rot, // 旋转
        entity(0), // 发射源实体（无）
        entity(0), // 目标实体（无）
        false, // 不追踪
        int(1), // 投射物数量
        [] as bigint[] // 无额外参数
      )

      const ti = setTimeout(() => {
        // 3秒后清理
        print(str('元素攻击超时，清理中')) // 调试日志
        f.removeEntity(elementAttack) // 删除投射物
        clearTimeout(ti) // 清除超时
      }, 3000) // 3秒
    } else if (evt.params.SignalName === 'AddSPStatus') {
      // E技能发动的时候，将卡牌选择器中选择的卡牌的效果，进行发动。
      // 发动完后，卡牌效果被消耗，不可再次发动。除非再次获得效果
      const cardEffect = stage.get('cardEffect').asType('int')
      if (cardEffect === int(0)) {
        print(str('无卡牌效果可发动'))
        return
      }
      // 消耗卡牌效果（先清空，防止重复发动）
      stage.set('cardEffect', int(0))
      gstsServerSetESkillIcon(int(0)) // 清除E技能图标
      gstsServerApplyBuffEffect(
        gstsServerCardEffectToElement(cardEffect),
        evt.params.OwnerEntity as unknown as ReturnType<typeof entity>,
        f as unknown as ServerExecutionFlowFunctions
      )
    }
  })
  .on('whenAllPlayerSCharactersAreDown', (_evt, f) => {
    print(str('玩家全部角色倒下！失败结算...'))
    gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
  })

// === ElementAttack - 投射物命中时的攻击执行 ===
g.server({
  id: 1073741853, // 节点图ID
  name: 'ElementAttack' // 节点名称
}).on('whenOnHitDetectionIsTriggered', (evt, f) => {
  // 命中检测时
  const sourceEntity = evt.eventSourceEntity as unknown as ReturnType<typeof entity> // 获取发射源实体
  const hitEntity = evt.onHitEntity as unknown as ReturnType<typeof entity> // 获取命中实体
  const hitLocation = evt.onHitLocation // 获取命中位置
  print(str('检测到投射物命中！开始攻击...')) // 调试日志
  const rot = stage.get('ElementAttRotate').asType('vec3') // 获取攻击旋转
  const mainElem = stage.get('mainElement').asType('int') // 获取主元素
  const subElem = stage.get('subElement').asType('int') // 获取副元素

  // 先用副元素攻击（仅元素附着，伤害0）
  if (subElem !== int(0) && subElem !== mainElem) {
    // 副元素有效且与主元素不同时
    gstsServerElementAttack(
      subElem, // 副元素（用于元素附着）
      hitEntity as unknown as ReturnType<typeof entity>, // 命中实体
      hitLocation, // 命中位置
      rot, // 旋转
      sourceEntity, // 发射源
      f as unknown as ServerExecutionFlowFunctions, // 执行流函数
      float(0) // 伤害系数0（仅元素附着）
    )
  }

  // 用主元素攻击（实际伤害，延迟以触发元素反应）
  const tMain = setTimeout(() => {
    gstsServerElementAttack(
      mainElem, // 主元素（实际伤害）
      hitEntity as unknown as ReturnType<typeof entity>, // 命中实体
      hitLocation, // 命中位置
      rot, // 旋转
      sourceEntity, // 发射源
      f as unknown as ServerExecutionFlowFunctions, // 执行流函数
      float(1) // 伤害系数1（正常伤害）
    )
    // 副元素存在时
    if (subElem !== int(0) && subElem !== mainElem) {
      // 获取元素反应名称
      let reactionName = gstsServerGetReactionName(
        mainElem,
        subElem,
        f as unknown as ServerExecutionFlowFunctions
      )
      let reactionColor = gstsServerGetReactionColor(
        mainElem,
        subElem,
        f as unknown as ServerExecutionFlowFunctions
      )
      stage.set('reaction', reactionName) // 设置元素反应名称
      stage.set('reactionColor', reactionColor) // 设置元素反应颜色
      print(reactionName) // 显示元素反应名称
    }
    clearTimeout(tMain) // 清除超时
  }, 10) // 10ms后主攻击

  const ti = setTimeout(() => {
    // 500ms后删除发射源实体
    f.removeEntity(sourceEntity) // 删除发射源
    clearTimeout(ti) // 清除超时
  }, 500) // 500ms
})

// === EnemyElementAttack - 敌方投射物命中时的攻击执行 ===
g.server({
  id: 1073741855, // 节点图ID
  name: 'EnemyElementAttack' // 节点名称
}).on('whenOnHitDetectionIsTriggered', (evt, f) => {
  // 命中检测时
  const sourceEntity = evt.eventSourceEntity as unknown as ReturnType<typeof entity> // 获取发射源实体
  const hitEntity = evt.onHitEntity as unknown as ReturnType<typeof entity> // 获取命中实体
  const hitLocation = evt.onHitLocation // 获取命中位置
  print(str('敌方攻击命中！')) // 调试日志
  f.removeEntity(sourceEntity) // 删除发射源
  /*
  const ti = setTimeout(() => {
    // 10ms后删除发射源实体
    f.removeEntity(sourceEntity) // 删除发射源
    clearTimeout(ti) // 清除超时
  }, 10) // 10ms
  */
})

// === GetOrb - 元素球获取处理 ===
g.server({
  id: 1073741829, // 节点图ID
  name: 'GetOrb' // 节点名称
}).on('whenEnteringCollisionTrigger', (evt, f) => {
  // 进入碰撞触发器时
  print(str('实体进入碰撞触发器')) // 调试日志
  const enteringEntity = evt.enteringEntity // 获取进入实体
  const triggerEntity = evt.triggerEntity // 获取触发器实体
  const faction = enteringEntity.faction() as unknown as number // 获取阵营
  const element = triggerEntity.getCustomVariable('element').asType('int') // 获取元素球的元素

  if (faction === factionEnemy) {
    // 敌人进入时
    // 敌人接触元素球，让玩家受伤。球不消失。
    const orbTransform = f.getEntityLocationAndRotation(
      triggerEntity as unknown as ReturnType<typeof entity>
    )
    const enemyAttack = f.createProjectile(
      enemyElementAttackPrefabIdValue,
      orbTransform.location,
      orbTransform.rotate,
      entity(0),
      player(1),
      true,
      int(1),
      [] as bigint[]
    )
    print(str('敌人接触元素球，生成敌方攻击！'))
    return // 球不消失，直接返回
  } else {
    // 玩家进入时
    // 玩家拾取元素球
    if (!stage.get('orbsCollectable').asType('bool')) {
      // 不可拾取时 → 生成一个追踪敌方攻击，然后禁用触发器，球不消失
      const orbTransform = f.getEntityLocationAndRotation(
        triggerEntity as unknown as ReturnType<typeof entity>
      )
      const enemyAttack = f.createProjectile(
        enemyElementAttackPrefabIdValue,
        orbTransform.location,
        orbTransform.rotate,
        entity(0),
        player(1),
        true,
        int(1),
        [] as bigint[]
      )
      print(str('触碰不可拾取元素球，生成敌方攻击！'))
      return // 球不消失，直接返回
    }

    if (element < 5) {
      // 增加收集计数 + 拾取元素球加30分
      stage.set('orbsCollected', stage.get('orbsCollected').asType('int') + int(1)) // 已收集元素球数+1
      stage.set('score', stage.get('score').asType('int') + int(30)) // 分数+30
      print(str('收集元素球！+30分')) // 调试日志

      const prevMain = stage.get('mainElement').asType('int') // 获取前一个主元素
      stage.set('subElement', prevMain) // 将前一个主元素设为副元素
      stage.set('mainElement', element) // 将新元素设为主元素
      gstsServerUpdateElementIcons(element, true, f as unknown as ServerExecutionFlowFunctions) // 更新主元素图标
      gstsServerUpdateElementIcons(prevMain, false, f as unknown as ServerExecutionFlowFunctions) // 更新副元素图标
    } else {
      print(str('收集特殊元素球')) // 调试日志
      gstsServerApplyBuffEffect(
        element,
        enteringEntity as unknown as ReturnType<typeof entity>,
        f as unknown as ServerExecutionFlowFunctions
      )
    }
  }

  triggerEntity.activateDisableCollisionTrigger(evt.triggerId, false) // 禁用碰撞触发器
  triggerEntity.activateDisablePathfindingObstacleFeature(true) // 禁用寻路障碍物
  triggerEntity.destroy() // 销毁元素球
  triggerEntity.remove() // 删除元素球
})

// === PlayerMain - 玩家主控制 ===
g.server({
  id: 1073741837, // 节点图ID
  name: 'PlayerMain' // 节点名称
})
  .on('whenPlayerTeleportCompletes', (evt, f) => {
    // 玩家传送完成时
    print(str('玩家传送完成！')) // 调试日志
    f.allowForbidPlayerToRevive(player(1), false) // 禁止复苏
    f.setPlayerRemainingRevives(player(1), int(0)) // 复活次数设为0
    const fromArea = stage.get('teleportFrom').asType('int') // 获取传送来源区域
    if (fromArea === int(0)) {
      // 来自初始区域时
      send('EnterBattleStage') // 发送玩家入场信号
    } else {
      // 来自其他区域时
      send('PreFightPreparation') // 发送玩家退场信号
    }
  })
  .on('whenDeckSelectorIsComplete', (evt, f) => {
    // 卡牌选择器完成时 → 保存选择的卡牌效果，更新E技能图标，启动初始化计时器
    // ★ 注意：evt.selectionResultList 在 gsts 编译时会被推断为 entity list，
    //   导致 f.getCorrespondingValueFromList 返回 entity 类型的引脚。
    //   此时若直接与 int 常量（如 CardHeal）比较，会因类型不匹配编译失败。
    //   解决方案：对 result 和 selectedCard 都加上 as unknown as bigint（或 bigint[]）
    //   强制覆盖 TypeScript 类型 → 编译器 getTypeAtLocation 正确识别为 bigint，
    //   进而生成 initLocalVariable("int")，避免 entity 与 int 冲突。
    //   result 的转换确保列表元素类型为 int；selectedCard 的转换是双重保险。
    const result = evt.selectionResultList as unknown as bigint[]
    const selectedCard = f.getCorrespondingValueFromList(result, int(0)) as unknown as bigint
    stage.set('cardEffect', selectedCard) // 保存卡牌效果
    gstsServerSetESkillIcon(gstsServerCardEffectToIcon(selectedCard))
    print(str('卡牌选择器确认！启动初始化计时器...')) // 调试日志
    print(str('正在显示UI控件...')) // 调试日志
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), InitTimer, UIControlGroupStatus.On) // 显示初始化计时器UI
    f.startGlobalTimer(stage, 'InitTimer') // 启动初始化计时器
    print(str('初始化计时器已启动，等待倒计时...')) // 调试日志
  })
  .on('whenTheCharacterIsDown', (_evt, f) => {
    // 角色倒下时 → 阻止复苏，立即失败结算
    print(str('角色倒下！阻止复苏，失败结算...')) // 调试日志
    f.setPlayerRemainingRevives(player(1), int(0)) // 将复活次数设为0
    f.allowForbidPlayerToRevive(player(1), false) // 禁止复苏
    gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
  })
