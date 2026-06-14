// === 各阶段难度配置 ===
// 修改数字即可调整对应阶段的参数，索引 0=阶段1, 1=阶段2, ... 8=阶段9
//
// 每关一个对象，字段说明：
//   maxEnemies    最大敌人数（达到后不再生成新敌人）
//   orbsRequired  所需元素球数（收集足够+全灭敌人即通关）
//   orbCount      元素球生成数量
//   fixedCard     指定卡牌选择器里的卡牌序号，设置0的话为随机
//   skipCardSelector 是否跳过卡牌选择器（true=跳过）
//   orbSPCount    特殊元素球数量（0=不生成）
//   fixedSpecialOrb 固定特殊元素类型（0=随机，5=风/加时，6=岩/护盾，7=草/回血，8=光/全灭）
//   permanentOrbs 元素球是否永久可见可拾取（true=不会变为深渊球）
//   goal          关卡目标描述（显示在UI）
//   tips          关卡提示（显示在UI）
//   slots         敌人槽位数组，每项 { type: '敌人名', pos: 位置索引, rot: 旋转索引 }
//                 type 为空字符串时表示无敌人（空槽可省略）

const stageConfigs = [
  // === 第1关：学习收集（无卡牌，球直接可见） ===
  {
    maxEnemies: 0,
    orbsRequired: 1,
    orbCount: 1,
    fixedCard: 0,
    skipCardSelector: true,
    orbSPCount: 0,
    fixedSpecialOrb: 0,
    permanentOrbs: true,
    goal: '触碰发光的元素球通关',
    tips: '走到发光的球旁边触碰它',
    slots: []
  },
  // === 第2关：学习净化（固定 Purify，一个深渊球） ===
  {
    maxEnemies: 0,
    orbsRequired: 1,
    orbCount: 1,
    fixedCard: 5,
    skipCardSelector: false,
    orbSPCount: 0,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '使用卡牌让元素球显现并收集',
    tips: '按E使用卡牌净化深渊球，然后触碰收集',
    slots: []
  },
  // === 第3关：纯战斗（固定 Heal，无需收集球） ===
  {
    maxEnemies: 4,
    orbsRequired: 0,
    orbCount: 0,
    fixedCard: 1,
    skipCardSelector: false,
    orbSPCount: 0,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '消灭所有敌人通关',
    tips: '长按普攻蓄力松手发射元素攻击，按E使用卡牌回血',
    slots: [{ type: 'hilichurl', pos: 1, rot: 1 }]
  },
  // === 第4关：净化+打怪（固定 Purify，首次实战） ===
  {
    maxEnemies: 4,
    orbsRequired: 1,
    orbCount: 2,
    fixedCard: 5,
    skipCardSelector: false,
    orbSPCount: 0,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '消灭敌人，收集元素球',
    tips: '按E净化深渊球收集元素，长按普攻攻击敌人',
    slots: [{ type: 'hilichurl', pos: 1, rot: 1 }]
  },
  // === 第5关：学习新卡牌（固定 Heal，更多敌人） ===
  {
    maxEnemies: 6,
    orbsRequired: 2,
    orbCount: 4,
    fixedCard: 1,
    skipCardSelector: false,
    orbSPCount: 0,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '消灭所有敌人，收集元素球',
    tips: '长按普攻蓄力松手发射元素攻击，按E使用卡牌回血',
    slots: [
      { type: 'hilichurl', pos: 1, rot: 1 },
      { type: 'hilichurl', pos: 2, rot: 2 }
    ]
  },
  // === 第6关：综合应用（固定 Purify，首次出现特殊球） ===
  {
    maxEnemies: 8,
    orbsRequired: 2,
    orbCount: 5,
    fixedCard: 5,
    skipCardSelector: false,
    orbSPCount: 1,
    fixedSpecialOrb: 7,
    permanentOrbs: false,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '按E使用卡牌效果，绿色球可回血',
    slots: [
      { type: 'hilichurl', pos: 1, rot: 1 },
      { type: 'pyroSlime', pos: 2, rot: 2 }
    ]
  },
  // === 第7关：随机卡牌 + 更多敌人 ===
  {
    maxEnemies: 12,
    orbsRequired: 3,
    orbCount: 8,
    fixedCard: 0,
    skipCardSelector: false,
    orbSPCount: 2,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '灵活运用攻击和卡牌效果，特殊元素球有不同效果',
    slots: [
      { type: 'fighter', pos: 1, rot: 1 },
      { type: 'hilichurl', pos: 2, rot: 2 },
      { type: 'pyroSlime', pos: 3, rot: 3 }
    ]
  },
  // === 第8关：元素反应 ===
  {
    maxEnemies: 18,
    orbsRequired: 4,
    orbCount: 8,
    fixedCard: 0,
    skipCardSelector: false,
    orbSPCount: 2,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '水火蒸发、冰火融化、冰雷超导——组合元素造成额外伤害',
    slots: [
      { type: 'fighter', pos: 1, rot: 1 },
      { type: 'hydroSamachurl', pos: 2, rot: 2 },
      { type: 'fighter', pos: 3, rot: 3 }
    ]
  },
  // === 第9关：挑战 ===
  {
    maxEnemies: 24,
    orbsRequired: 5,
    orbCount: 8,
    fixedCard: 0,
    skipCardSelector: false,
    orbSPCount: 3,
    fixedSpecialOrb: 0,
    permanentOrbs: false,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '遗迹守卫非常危险，优先清理小兵',
    slots: [
      { type: 'ruinGuard', pos: 1, rot: 1 },
      { type: 'pyroSlime', pos: 2, rot: 2 },
      { type: 'pyroSlime', pos: 3, rot: 3 }
    ]
  }
] as const

// 预计算各阶段在展平数组中的起始索引和槽位数
const slotStarts: bigint[] = []
const slotCounts: bigint[] = []
let cumSlots = 0
for (const c of stageConfigs) {
  slotStarts.push(int(cumSlots))
  slotCounts.push(int(c.slots.length))
  cumSlots += c.slots.length
}
const maxSlotIdx = int(cumSlots - 1)

// 导出各字段数组（int()/str() 在顶层返回基本类型）
export const battleStageConfig = {
  maxEnemies: stageConfigs.map((c) => int(c.maxEnemies)),
  orbsRequired: stageConfigs.map((c) => int(c.orbsRequired)),
  orbCount: stageConfigs.map((c) => int(c.orbCount)),
  size: stageConfigs.length,
  fixedCard: stageConfigs.map((c) => int(c.fixedCard)),
  // 关卡目标与提示
  goals: stageConfigs.map((c) => str(c.goal)),
  tips: stageConfigs.map((c) => str(c.tips)),
  // 敌人槽位数据（展平成单层数组 + 起始索引定位）
  // 每阶段槽位数量不同，用 slotStarts[i] 定位第 i 阶段的起点
  // --> spawnSlots.ts 没有这种分层，因为出生点是所有阶段共用的固定集合
  slotStarts,
  slotCounts,
  maxSlotIdx,
  slotTypes: stageConfigs.flatMap((c) => c.slots.map((s) => str(s.type))),
  slotPoss: stageConfigs.flatMap((c) => c.slots.map((s) => int(s.pos))),
  slotRots: stageConfigs.flatMap((c) => c.slots.map((s) => int(s.rot))),
  // 是否跳过卡牌选择器（int: 0=不跳过, 1=跳过）
  skipCardSelector: stageConfigs.map((c) => int(c.skipCardSelector ? 1 : 0)),
  // 特殊元素球数量（0=不生成，-1=随机1~3）
  orbSPCount: stageConfigs.map((c) => int(c.orbSPCount)),
  // 固定特殊元素类型（0=随机，5=风/加时，6=岩/护盾，7=草/回血，8=光/全灭）
  fixedSpecialOrb: stageConfigs.map((c) => int(c.fixedSpecialOrb)),
  // 元素球是否永久可见可拾取（1=是，0=否）
  permanentOrbs: stageConfigs.map((c) => int(c.permanentOrbs ? 1 : 0))
}
