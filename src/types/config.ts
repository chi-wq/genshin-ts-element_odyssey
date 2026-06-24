// === 配置文件类型定义 ===

/** 单个敌人槽位 */
export interface SlotConfig {
  type: string
  pos: number
  rot: number
}

/** 单个关卡配置 */
export interface StageConfig {
  maxEnemies: number
  orbsRequired: number
  orbCount: number
  fixedCard: number
  skipCardSelector: boolean
  orbSPCount: number
  fixedSpecialOrb: number
  permanentOrbs: boolean
  infiniteTime: boolean
  goal: string
  tips: string
  slots: SlotConfig[]
}

/** 确认弹窗配置项 */
export interface ConfirmConfig {
  type: number
  text: string
  okText: string
  ngText: string
}

// ── 通用 derive 工具 ──
// int()/str() 是 gsts 运行时全局函数，在图中调用处生效
// deriveConfig 会根据 typeof 自动判断类型：
//   boolean → boolInt (0/1)
//   string  → str
//   number  → int

/** T 中所有数组类型的 key */
type ArrayKeys<T> = { [K in keyof T]: T[K] extends readonly any[] ? K : never }[keyof T]

/** 数组元素类型 */
type ArrayElement<A> = A extends readonly (infer U)[] ? U : never

/** 去除末尾 's' 得到前缀 */
type ToPrefix<S extends string> = S extends `${infer P}s` ? P : S

/** 首字母大写 */
type Cap<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S

/** 根据数组字段 + 子字段生成输出 key */
type NestedKey<Arr extends string, Sub extends string> = `${ToPrefix<Arr>}${Cap<Sub>}`

/** 自动推导的嵌套字段类型 */
type AutoNested<T> =
  ArrayKeys<T> extends never
    ? {}
    : {
        [K in ArrayKeys<T> & string]: {
          [F in keyof ArrayElement<T[K]> & string as NestedKey<K, F>]: ArrayElement<
            T[K]
          >[F] extends string
            ? string[]
            : bigint[]
        }
      }[ArrayKeys<T> & string]

/** 自动推导的 segments 字段类型 */
type AutoSegment<T> =
  ArrayKeys<T> extends never
    ? {}
    : {
        [K in ArrayKeys<T> & string as `${ToPrefix<K>}Starts` | `${ToPrefix<K>}Counts`]: bigint[]
      } & {
        [K in ArrayKeys<T> & string as `max${Cap<ToPrefix<K>>}Idx`]: bigint
      }

/** 声明式字段定义，T 为配置对象类型 */
type DeriveSpec<T> =
  | true // 自动推断简单字段（key 即字段名）
  | 'int'
  | 'str' // 简单字段，key 即字段名，显式指定类型
  | { field: keyof T; as?: 'int' | 'str' } // 简单字段，指定字段名
  | {
      [K in ArrayKeys<T>]: {
        from: K
        field: keyof ArrayElement<T[K]>
        as?: 'int' | 'str'
      }
    }[ArrayKeys<T>] // 嵌套字段

/** 根据 spec 条目推算输出数组类型 */
type SpecItemType<T, V> =
  // 嵌套字段 — 从数组元素类型推算
  V extends { from: infer K; field: infer F }
    ? ArrayElement<T[K & keyof T]>[F & keyof ArrayElement<T[K & keyof T]>] extends string
      ? string[]
      : bigint[]
    : // 重命名字段 — 从源字段类型推算
      V extends { field: infer F }
      ? T[F & keyof T] extends boolean
        ? bigint[]
        : T[F & keyof T] extends string
          ? string[]
          : bigint[]
      : // 简单字段 — 'str' → string[], 其余 → bigint[]
        V extends 'str'
        ? string[]
        : bigint[]

/** 显式 spec 条目映射为结果类型 */
type SpecResult<T, S extends Record<string, DeriveSpec<T>>> = {
  [K in keyof S]: SpecItemType<T, S[K]>
}

function inferSimple(c: any, fieldName: string, explicitType?: 'int' | 'str'): any {
  const val = c[fieldName]
  const t =
    explicitType ?? (typeof val === 'boolean' ? 'int' : typeof val === 'string' ? 'str' : 'int')
  if (typeof val === 'boolean') {
    return t === 'int' ? int(val ? 1 : 0) : str(val ? 1 : 0)
  }
  return t === 'int' ? int(val) : str(val)
}

/**
 * 计算分段偏移：遍历 configs，对每个 item 的 arrayField 数组累加长度，
 * 返回 starts（起始索引）、counts（每段长度）、maxIdx（总最大索引）。
 * 适用于"展平数组 + slotStarts/slotCounts"模式。
 */
export function computeSegments<T, K extends keyof T>(configs: readonly T[], arrayField: K) {
  const starts: bigint[] = []
  const counts: bigint[] = []
  let cum = 0
  for (const c of configs) {
    starts.push(int(cum))
    const len = (c[arrayField] as any[]).length
    counts.push(int(len))
    cum += len
  }
  const maxIdx = int(cum - 1)
  return { starts, counts, maxIdx }
}

/**
 * 将配置类型 T 的字段映射为对应的 derive 结果类型：
 *   boolean → bigint[]   (boolInt: int(0/1))
 *   string  → string[]   (str)
 *   number  → bigint[]   (int)
 *   其他    → bigint[]   (默认降级为 int)
 */
type DerivedFieldTypes<T> = {
  [K in keyof T]: T[K] extends boolean ? bigint[] : T[K] extends string ? string[] : bigint[]
}

/** segments 生成的字段：{prefix}Starts, {prefix}Counts 为数组，max{Prefix}Idx 为标量 */
type SegmentFields<Prefix extends string> = {
  [K in `${Prefix}Starts` | `${Prefix}Counts`]: bigint[]
} & {
  [K in `max${Capitalize<Prefix>}Idx`]: bigint
}

/**
 * 通用 derive：传入配置数组，自动推断所有字段并生成展平后的各字段数组。
 *
 * ── 自动检测规则 ──
 *
 * 1. 标量字段（非数组）
 *    - 从 configs[0] 的 keys 中自动识别，跳过数组字段和 spec 中已声明的字段。
 *    - 类型推断：boolean → bigint[] (int(0/1)), string → string[], number → bigint[]。
 *
 * 2. 嵌套数组字段（如 slots: SlotConfig[]）
 *    - 自动检测数组字段，取第一个非空元素的子字段名生成 {prefix}{Field}。
 *    - 前缀 = 数组字段名去掉末尾 's'（slots → slot）。
 *    - 例如 slots[].type → slotType: string[], slots[].pos → slotPos: bigint[]。
 *
 * 3. segments（每个数组字段自动生成）
 *    - {prefix}Starts: bigint[] — 每段起始索引
 *    - {prefix}Counts: bigint[] — 每段长度
 *    - max{Prefix}Idx: bigint — 总最大索引（标量）
 *
 * 4. 内置标量（总是存在）
 *    - size: bigint — configs.length
 *    - maxIdx: bigint — configs.length - 1
 *
 * 5. 主键标量（keyField 参数）
 *    - 指定 keyField（如 'type'）后，按字段值生成命名标量。
 *    - 例如 keyField='type' 且数据中有 type=1, type=2：
 *      → Type1: bigint（值 = int(1)），Type2: bigint（值 = int(2)）
 *    - 适用于 graph 回调中需要标量常量时的模块作用域提取。
 *
 * ── 显式 spec 参数（需要时才用） ──
 *    - { field: '实际字段' } — 输出 key ≠ 数据字段名时重命名
 *    - { from: 'arr', field: 'sub' } — 显式声明嵌套字段（通常可自动检测）
 *    - 'int' | 'str' — 强制指定类型（通常自动推断）
 *
 * ── 注意 ──
 *    - deriveConfig 返回的数组是普通 JS 数组（非 gsts list），
 *      在 graph 回调内（g.server().on(...)）直接索引会编译为
 *      f.getCorrespondingValueFromList() 导致泛型不匹配。
 *      应先在模块作用域提取标量，再在回调内使用变量。
 *
 * @example
 * // 最简用法：仅传数据，全部自动推断
 * const config = deriveConfig(stageConfigs)
 * // config.maxEnemies: bigint[]
 * // config.goal: string[]
 * // config.slotType: string[]   ← 自动从 slots[].type
 * // config.slotStarts: bigint[] ← 自动 segments
 * // config.maxSlotIdx: bigint
 * // config.size: bigint
 * // config.maxIdx: bigint
 *
 * // 带主键的用法
 * const confirmConfig = deriveConfig(confirmConfigs, {}, undefined, 'type')
 * // confirmConfig.Type1: bigint  ← 根据 type=1 自动生成
 */
export function deriveConfig<
  T extends Record<string, any>,
  S extends Record<string, DeriveSpec<T>>,
  Prefix extends string = string
>(
  configs: readonly T[],
  spec: S = {} as S,
  segments?:
    | { arrayField: keyof T; prefix: Prefix }
    | Array<{ arrayField: keyof T; prefix: string }>,
  keyField?: keyof T & string
): { size: bigint; maxIdx: bigint } & DerivedFieldTypes<T> &
  AutoNested<T> &
  AutoSegment<T> &
  SpecResult<T, S> &
  Record<string, bigint> &
  (typeof segments extends { prefix: Prefix } ? SegmentFields<Prefix> : Record<string, any[]>) {
  const merged: Record<string, DeriveSpec<T>> = {}

  // 将 segments 统一为数组
  const segList: { arrayField: keyof T; prefix: string }[] = segments
    ? Array.isArray(segments)
      ? segments
      : [segments]
    : []

  // 自动检测简单字段 + 嵌套数组字段
  if (configs.length > 0) {
    const first = configs[0] as any
    const usedFields = new Set<string>()
    for (const specValue of Object.values(spec)) {
      if (typeof specValue === 'object' && 'field' in specValue) {
        usedFields.add(specValue.field as string)
      }
    }
    const skipFields = new Set([
      ...Object.keys(spec),
      ...usedFields,
      ...segList.map((s) => String(s.arrayField))
    ])

    for (const key of Object.keys(first)) {
      if (skipFields.has(key)) continue
      const val = first[key]
      if (Array.isArray(val)) {
        // 数组字段 → 自动生成嵌套字段 + segments
        const prefix = key.endsWith('s') ? key.slice(0, -1) : key

        // 找第一个非空数组样本获取子字段名
        let sample: any = null
        for (const c of configs) {
          const a = (c as any)[key]
          if (Array.isArray(a) && a.length > 0) {
            sample = a[0]
            break
          }
        }
        if (sample) {
          for (const subKey of Object.keys(sample)) {
            const outKey = prefix + subKey.charAt(0).toUpperCase() + subKey.slice(1)
            if (!(outKey in merged)) {
              merged[outKey] = { from: key, field: subKey }
            }
          }
        }
        // 记录 segments
        if (!segList.find((s) => String(s.arrayField) === key)) {
          segList.push({ arrayField: key as any, prefix })
        }
      } else {
        // 标量字段
        merged[key] = true
      }
    }
  }

  // 显式声明覆盖
  for (const [key, value] of Object.entries(spec)) {
    merged[key] = value
  }

  const result: Record<string, any[]> = {}

  for (const [key, specValue] of Object.entries(merged)) {
    if (specValue === true || specValue === 'int' || specValue === 'str') {
      const explicitType = specValue === true ? undefined : specValue
      result[key] = configs.map((c) => inferSimple(c, key, explicitType))
    } else if ('from' in specValue) {
      const { from, field, as } = specValue
      result[key] = configs.flatMap((c) =>
        (c[from] as any[]).map((s: any) => {
          const val = s[field]
          const t = as ?? (typeof val === 'string' ? 'str' : 'int')
          return t === 'int' ? int(val) : str(val)
        })
      )
    } else {
      const { field, as } = specValue
      result[key] = configs.map((c) => inferSimple(c, field as string, as))
    }
  }

  // 内置标量
  result['size'] = int(configs.length) as any
  result['maxIdx'] = int(configs.length - 1) as any

  // 处理所有 segments（每个数组字段生成 starts/counts/maxIdx）
  for (const seg of segList) {
    const { starts, counts, maxIdx } = computeSegments(configs, seg.arrayField)
    const p = seg.prefix
    result[`${p}Starts`] = starts as any[]
    result[`${p}Counts`] = counts as any[]
    result[`max${p.charAt(0).toUpperCase() + p.slice(1)}Idx`] = maxIdx as any
  }

  // 主键标量：根据 keyField 的值自动生成命名标量
  // 如 keyField='type' 且数据中有 type=1, type=2 → result.Type1, result.Type2
  if (keyField && configs.length > 0) {
    const prefix = keyField.charAt(0).toUpperCase() + keyField.slice(1)
    for (const c of configs) {
      const keyVal = (c as any)[keyField]
      if (keyVal !== undefined) {
        result[`${prefix}${keyVal}`] = int(keyVal) as any
      }
    }
  }

  return result as unknown as { size: bigint; maxIdx: bigint } & DerivedFieldTypes<T> &
    AutoNested<T> &
    AutoSegment<T> &
    SpecResult<T, S> &
    Record<string, bigint> &
    (typeof segments extends { prefix: Prefix } ? SegmentFields<Prefix> : Record<string, any[]>)
}
