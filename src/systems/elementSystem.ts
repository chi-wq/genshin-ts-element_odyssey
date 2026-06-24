import { UIControlGroupStatus } from 'genshin-ts/definitions/enum' // UI控件组状态
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes' // 服务器执行流函数

import {
  Anemo,
  Cryo,
  CryoMainIcon,
  CryoSubIcon,
  Dendro,
  Electro,
  ElectroMainIcon,
  ElectroSubIcon,
  Geo,
  geoShieldConfigId,
  Hydro,
  HydroMainIcon,
  HydroSubIcon,
  Light,
  Pyro,
  PyroMainIcon,
  PyroSubIcon
} from '../config/constants'
import { gstsServerClearAllEnemies } from './enemySystem'

// 获取元素类型列表
export function gstsServerGetElementalTypes(f: ServerExecutionFlowFunctions) {
  return list('int', [Cryo, Pyro, Hydro, Electro]) // 返回4种元素的列表
}

// 获取特殊元素类型列表（增益型）
export function gstsServerGetSpecialElementalTypes(f: ServerExecutionFlowFunctions) {
  return list('int', [Anemo, Geo, Dendro, Light]) // 返回4种特殊元素的列表
}

// 更新元素图标UI（主或副）
export function gstsServerUpdateElementIcons(
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
export function gstsServerElementAttack(
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
export function gstsServerGetReactionName(
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
export function gstsServerGetReactionColor(
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

// 应用增益效果（根据特殊元素常量 5~8）
// 5(风)=加时间, 6(岩)=护盾, 7(草)=回血, 8(光)=全灭
export function gstsServerApplyBuffEffect(
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
