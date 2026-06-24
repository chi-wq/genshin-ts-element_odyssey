import { deriveConfig, StageConfig } from '../types/config'

/** 将【xxx】替换为富文本，\n 替换为\\n      */
const fmt = (s: string) =>
  s
    .trim()
    .replace(/【([^】]+)】/g, '<color=white>【$1】</color>')
    .replace(/\n/g, '\\n     ')

// 导出各字段数组（自动检测所有字段 + 嵌套数组字段 + segments）
export const battleStageConfig = deriveConfig(
  // === 各关卡难度配置 ===
  //
  // 每关一个对象，字段说明：
  //   maxEnemies    最大敌人数（达到后不再生成新敌人）
  //   orbsRequired  所需元素球数（收集足够+全灭敌人即通关）
  //   orbCount      元素球生成数量
  //   fixedCard     指定道具选择器里的道具序号，设置0的话为随机
  //   skipCardSelector 是否跳过道具选择器（true=跳过）
  //   orbSPCount    特殊元素球数量（0=不生成）
  //   fixedSpecialOrb 固定特殊元素类型（0=随机，5=风/加时，6=岩/护盾，7=草/回血，8=光/全灭）
  //   permanentOrbs 元素球是否永久可见可拾取（true=不会变为深渊球）
  //   infiniteTime  是否为无限时间（true=没有倒计时限制）
  //   goal          关卡目标描述（显示在UI）
  //   tips          关卡提示（显示在UI）
  //   slots         敌人槽位数组，每项 { type: '敌人名', pos: 位置索引, rot: 旋转索引 }
  //                 type 为空字符串时表示无敌人（空槽可省略）

  [
    // === 第1关：学习收集（无道具，球直接可见） ===
    {
      maxEnemies: 0,
      orbsRequired: 1,
      orbCount: 1,
      fixedCard: 0,
      skipCardSelector: true,
      orbSPCount: 0,
      fixedSpecialOrb: 0,
      permanentOrbs: true,
      infiniteTime: true,
      goal: fmt('触碰发光的【元素球】通关'),
      tips: fmt('走到发光的球旁边触碰它'),
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
      infiniteTime: false,
      goal: fmt('使用【道具】让【元素球】显现并收集'),
      tips: fmt(`
按元素战技键使用【道具】净化【深渊球】，
然后触碰收集
      `),
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
      infiniteTime: false,
      goal: fmt('消灭所有【敌人】通关'),
      tips: fmt(`
长按普攻击杀【敌人】，
使用【道具】回血
      `),
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
      infiniteTime: false,
      goal: fmt('消灭【敌人】，收集【元素球】'),
      tips: fmt(`
使用【道具】净化【深渊球】收集元素，
然后攻击【敌人】
      `),
      slots: [{ type: 'hilichurl', pos: 1, rot: 1 }]
    },
    // === 第5关：学习新道具（固定 Heal，更多敌人） ===
    {
      maxEnemies: 6,
      orbsRequired: 2,
      orbCount: 4,
      fixedCard: 1,
      skipCardSelector: false,
      orbSPCount: 0,
      fixedSpecialOrb: 0,
      permanentOrbs: false,
      infiniteTime: false,
      goal: fmt('消灭所有【敌人】，收集【元素球】'),
      tips: fmt('使用【道具】回血'),
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
      infiniteTime: false,
      goal: fmt('消灭所有【敌人】，收集足够的【元素球】'),
      tips: fmt(`
草色十字可回血，
集齐【元素球】后全灭【敌人】通关
      `),
      slots: [
        { type: 'hilichurl', pos: 1, rot: 1 },
        { type: 'pyroSlime', pos: 2, rot: 2 }
      ]
    },
    // === 第7关：随机道具 + 更多敌人 ===
    {
      maxEnemies: 12,
      orbsRequired: 3,
      orbCount: 8,
      fixedCard: 0,
      skipCardSelector: false,
      orbSPCount: 2,
      fixedSpecialOrb: 0,
      permanentOrbs: false,
      infiniteTime: false,
      goal: fmt('消灭所有【敌人】，收集足够的【元素球】'),
      tips: fmt(`
灵活运用攻击和【道具】效果，
【特殊元素球】有不同效果
      `),
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
      infiniteTime: false,
      goal: fmt('消灭所有【敌人】，收集足够的【元素球】'),
      tips: fmt(`
水火蒸发、冰火融化、冰雷超导
——组合元素造成额外伤害
      `),
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
      infiniteTime: false,
      goal: fmt('消灭所有【敌人】，收集足够的【元素球】'),
      tips: fmt(`
遗迹守卫飞弹伤害极高，
注意躲避或使用护盾【道具】
      `),
      slots: [
        { type: 'ruinGuard', pos: 1, rot: 1 },
        { type: 'pyroSlime', pos: 2, rot: 2 },
        { type: 'pyroSlime', pos: 3, rot: 3 }
      ]
    }
  ] as const satisfies StageConfig[]
)
