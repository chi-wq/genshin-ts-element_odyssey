// === 各阶段难度配置 ===
// 修改数字即可调整对应阶段的参数，索引 0=阶段1, 1=阶段2, ... 4=阶段5
//
// 每关一个对象，字段说明：
//   maxEnemies    最大敌人数（达到后不再生成新敌人）
//   orbsRequired  所需元素球数（收集足够+全灭敌人即通关）
//   orbCount      元素球生成数量
//   fixedCard     指定卡牌选择器里的卡牌序号，设置0的话为随机
//   goal          关卡目标描述（显示在UI）
//   tips          关卡提示（显示在UI）
//   slots         敌人槽位数组，每项 { type: '敌人名', pos: 位置索引, rot: 旋转索引 }
//                 type 为空字符串时表示无敌人（空槽可省略）

const stageConfigs = [
  {
    maxEnemies: 0,
    orbsRequired: 1,
    orbCount: 1,
    fixedCard: 5,
    goal: '收集所有元素球通关',
    tips: '拾取元素球获得元素，按【元素战技】发射',
    slots: []
  },
  {
    maxEnemies: 12,
    orbsRequired: 3,
    orbCount: 10,
    fixedCard: 0,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '击杀敌人后元素球可拾取，按【元素战技】使用卡牌效果',
    slots: [
      { type: 'hilichurl', pos: 1, rot: 1 },
      { type: 'hilichurl', pos: 2, rot: 2 }
    ]
  },
  {
    maxEnemies: 18,
    orbsRequired: 4,
    orbCount: 10,
    fixedCard: 0,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '注意元素反应：不同元素组合可造成额外伤害',
    slots: [
      { type: 'hilichurl', pos: 1, rot: 1 },
      { type: 'pyroSlime', pos: 2, rot: 2 }
    ]
  },
  {
    maxEnemies: 24,
    orbsRequired: 5,
    orbCount: 10,
    fixedCard: 0,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '打手丘丘人威胁更大，优先处理',
    slots: [
      { type: 'fighter', pos: 1, rot: 1 },
      { type: 'fighter', pos: 2, rot: 2 },
      { type: 'pyroSlime', pos: 3, rot: 3 }
    ]
  },
  {
    maxEnemies: 30,
    orbsRequired: 6,
    orbCount: 10,
    fixedCard: 0,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '水萨满会治疗敌人，优先击杀',
    slots: [
      { type: 'fighter', pos: 1, rot: 1 },
      { type: 'hydroSamachurl', pos: 2, rot: 2 },
      { type: 'fighter', pos: 3, rot: 3 }
    ]
  },
  {
    maxEnemies: 36,
    orbsRequired: 7,
    orbCount: 10,
    fixedCard: 0,
    goal: '消灭所有敌人，收集足够的元素球',
    tips: '遗迹守卫是强大的敌人，小心应对',
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
  slotRots: stageConfigs.flatMap((c) => c.slots.map((s) => int(s.rot)))
}
