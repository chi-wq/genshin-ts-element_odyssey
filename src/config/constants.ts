import { CustomPrefab } from '../resources/prefabs'
import { ConfirmConfig, deriveConfig } from '../types/config'
import { battleStageConfig } from './battleStageConfig'

// 获取最大阶段数
export const maxStage = battleStageConfig.size
export const maxStageIdx = battleStageConfig.maxIdx

// === 元素常量 ===
export const Cryo = int(1) // 冰元素
export const Pyro = int(2) // 火元素
export const Hydro = int(3) // 水元素
export const Electro = int(4) // 雷元素
// === 特殊元素常量（增益型） ===
export const Anemo = int(5) // 风元素（加时间）
export const Geo = int(6) // 岩元素（加护盾）
export const Dendro = int(7) // 草元素（回血）
export const Light = int(8) // 光元素（当下场上敌人全灭清空）

// === 主元素图标ID ===
export const CryoMainIcon = int(1073742037) // 主冰图标
export const PyroMainIcon = int(1073742015) // 主火图标
export const HydroMainIcon = int(1073742059) // 主水图标
export const ElectroMainIcon = int(1073742081) // 主雷图标

// === 副元素图标ID ===
export const CryoSubIcon = int(1073742298) // 副冰图标
export const PyroSubIcon = int(1073742292) // 副火图标
export const HydroSubIcon = int(1073742296) // 副水图标
export const ElectroSubIcon = int(1073742294) // 副雷图标

// === 计时器UI ID ===
export const InitTimer = int(1073741874) // 初始化计时器UI
export const StageTimer = int(1073741860) // 阶段计时器UI

// === 敌人相关常量 ===
export const factionEnemy = 4 // 敌方阵营编号

// === 元素球相关常量 ===
export const orbPrefabIdValue = prefabId(CustomPrefab.Orb) // 元素球预制体ID
export const orbSPPrefabIdValue = prefabId(CustomPrefab.OrbSP) // 特殊元素球预制体ID
export const orbSPMin = 1 // 特殊元素球最少一个
export const orbSPMax = 3 // 特殊元素球最多三个

// === 卡牌选择器常量 ===
export const CardHeal = int(1) // 生命回复
export const CardShield = int(2) // 护盾
export const CardTime = int(3) // 增加时间
export const CardClearEnemies = int(4) // 敌人全灭
export const CardPurify = int(5) // 净化深渊球
export const DeckSelectorIndex = int(1073742343) // 卡牌选择器索引
export const DeckSelectorDuration = float(60) // 选择时长
export const DeckSelectorSelectMin = int(1) // 选择数量下限
export const DeckSelectorSelectMax = int(1) // 选择数量上限

// === E技能图标 ===
export const ESkillIndex = int(1073742360) // E技能图片控件索引
export const CardHealIcon = int(111128) // 生命回复图标
export const CardShieldIcon = int(111111) // 护盾图标
export const CardTimeIcon = int(111016) // 增加时间图标
export const CardClearEnemiesIcon = int(111025) // 敌人全灭图标
export const CardPurifyIcon = int(111048) // 净化深渊球图标

// === 悬浮交互页 ===
// 需在千星奇域编辑器中创建「悬浮交互页」后填入对应索引
export const ConfirmPageIndex = int(1073742337)
export const ConfirmOKButton = int(1073742367) // 确认对话框的确认按钮交互项索引
// 确认弹窗配置（同 battleStageConfig 的 stageConfigs 模式）
// 自动检测各字段数组
export const confirmConfig = deriveConfig(
  [
    { type: 1, text: '元素球不足且无法继续前进，是否重置本关？', okText: '重置', ngText: '取消' },
    { type: 2, text: '是否重置本关？', okText: '重置', ngText: '取消' }
  ] as const satisfies ConfirmConfig[],
  {},
  undefined,
  'type' // 指定 type 为主键
)

export const elementAttackPrefabIdValue = prefabId(CustomPrefab.ElementAttack) // 元素攻击预制体ID
export const monitorElementalReaction = configId(1077936129) // 元素反应监测配置ID
export const enemyElementAttackPrefabIdValue = prefabId(CustomPrefab.EnemyElementAttack) // 敌方元素攻击预制体ID

// 护盾
export const geoShieldConfigId = configId(1077936131) // 单位状态护盾

// === 手动重置按钮 ===
export const ResetButton = int(1073742372) // 手动重置按钮控件组索引

// === 传送点坐标 ===
export const PlayerSpawnPos = vec3([10.49, 3.48, 2.97]) // 玩家出生/传送位置
export const PlayerSpawnRot = vec3([0, -99.36, 0]) // 玩家出生/传送旋转
export const PlayerSpawnPos2 = vec3([224.67, 3.39, -2.78]) // 备用传送位置
export const PlayerSpawnRot2 = vec3([0, 272.89, 0]) // 备用传送旋转

// === 防掉落安全位置 ===
export const SafeFallbackPos = vec3([1, 3.5, 0]) // 敌人掉落地板后的回拉位置
export const SafeFallbackRot = vec3([0, 0, 0]) // 回拉旋转

// === 消息队列 ===
export const NotificationQueueIndex = int(1073742361) // 消息队列索引
export const NotificationItemId = int(1) // 消息项ID

// === 调试开关 ===
export const DEBUG = false // 设为 true 启用调试日志
