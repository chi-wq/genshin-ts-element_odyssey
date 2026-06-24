# 元素试炼:深渊迴廊

使用 [Genshin-TS](https://gsts.moe) 构建的游戏项目。用 TypeScript 编写逻辑，编译为节点图并注入到地图中。

## 快速开始

```bash
npm install
npm run dev
```

文档: `https://gsts.moe`

## 项目结构

- `src/main.ts`: 入口文件（`g.server(...).on(...)`）
- `gsts.config.ts`: 编译/输出配置
- `dist/`: 构建输出（`.gs.ts` / `.json` / `.gia`）
- `CLAUDE.md` / `AGENTS.md`: AI 协作备忘（优先阅读）
- `UPDATE.md`: 版本更新对比文档

## 注入配置示例（可选）

```ts
import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'China',
    playerId: 344728135,
    mapId: 1073741826
  }
}

export default config
```

说明:

- `npm run maps` 可列出最近保存的地图，帮助确定 `mapId`。
- 多区域/多账号使用时请填写 `gameRegion` / `playerId`。
- 注入时会自动创建回滚备份。

## 入口与事件写法

```ts
import { g } from 'genshin-ts/runtime/core'

g.server({ id: 1073741825 }).on('whenEntityIsCreated', (_evt, f) => {
  const p = player(1)
  f.printString(str(p.guid))
})
```

要点:

- `id` 是注入目标的 NodeGraph ID。相同 ID 的入口会自动合并。
- 事件名使用字符串字面量指定。
- `f` 是节点图函数的入口，用于输出和变量操作。
- `g.server(...).on(...).onSignal(...)` 支持链式调用。

## g.server 选项（注入安全性）

常用选项:

- `id`: 注入目标的 NodeGraph ID（注入配置需与此 ID 一致）
- `name`: 图谱显示名（默认使用入口文件名）
- `prefix`: 自动添加 `_GSTS_` 前缀（默认 true）
- `type`: 图谱类型（默认 server/entity）
- `variables`: 声明图谱变量，启用 `f.get` / `f.set`

注入安全规则:

- 目标 `id` 必须在地图中存在。
- 如果目标图谱为空或名称不以 `_GSTS` 开头，注入将被阻止。
- 确认了解规范后，可在 `gsts.config.ts` 中设置 `inject.skipSafeCheck = true`。
- 创建新图谱后，请保存地图以便注入器检测到 `id`。
- 建议：先批量创建并保存图谱，然后一次性编译/注入。

## gsts.config 优化选项（默认启用）

`gsts.config.ts` 使用 `options.optimize`，默认全部启用:

- `precompileExpression`: 预计算仅含字面量的表达式
- `removeUnusedNodes`: 删除未使用的 exec/data 节点
- `timerPool`: `setTimeout` / `setInterval` 的名称池大小
- `timerDispatchAggregate`: 聚合 timer dispatch 以降低复杂度

调试或需要对比图谱时，可临时禁用相关选项。

## 典型用法与约束（AI 必读）

### 作用域分离

- **顶层（编译时）**: 文件读取、npm 库使用、预计算均可。但此处**不要**调用 `g.server` 或 `gsts` 运行时 API。
- **节点图（运行时）**: 仅可使用支持的 TS 子集。此处编写的逻辑将编译为节点图。

### 控制结构与 return

- `if/while/switch` 的条件必须是 `boolean`。必要时使用 `bool(...)`。
- `gstsServer*` 函数**仅允许末尾单个 `return <expr>`**。
- 节点图作用域不支持递归、`async/await`、Promise。
- `while(true)` 有循环上限限制。请使用定时器或显式计数器替代。
- `!` 和三目运算符的条件必须是 boolean。

### 数值与类型

- `number` 是 **float**，`bigint` 是 **int**。
- 取模/位运算请使用 `bigint`。
- list/dict 必须是同类元素（homogeneous）。混合类型会导致失败。
- 空数组可能无法推断类型。请放入类型化占位符或使用 `list(...)`。
- 优先使用 `int`、`float`、`vec3`、`configId`、`prefabId`、`entity` 等显式辅助函数。
- `dict(...)` 创建只读 dict。可变 dict 请使用图变量（`f.get` / `f.set`）。
- `let` 会强制创建局部变量节点。`const` 在优化时可能直接连线。

### 全局函数/变量速查表（AI 推荐）

日志/调试:

- `print(str(...))`: 最稳定的日志方式。
- `console.log(x)`: **仅限 1 个参数**。自动转换为 `print(str(...))`。
- `f.printString(...)`: 需要精确匹配节点时的显式调用。

类型辅助:

- `bool(...)` / `int(...)` / `float(...)` / `str(...)`
- `vec3(...)` / `guid(...)` / `prefabId(...)` / `configId(...)` / `faction(...)` / `entity(...)`
- `list('int', items)`: 显式列表类型化（对空数组至关重要）。
- `dict(...)`: 只读字典。
- `raw(...)`: 编译器忽略，使用 JS 原生语义。

实体/场景:

- `player(1)`: 玩家实体（从 1 开始）。
- `stage` / `level`: 关卡实体别名。
- `self`: 当前图谱实体。
- `GameObject.Find(...)` / `FindWithTag(...)` / `FindByPrefabId(...)`

数学/向量:

- `Math.*`: 在服务端作用域中编译为节点图等效函数。
- `Mathf.*` / `Vector3.*` / `Random.*`: Unity 风格的 API。

信号/事件:

- `send('signalName')` 配合 `g.server().onSignal(...)` 使用。

定时器:

- `setTimeout` / `setInterval` / `clearTimeout` / `clearInterval`

常用方法:

- 支持多数数组/字符串方法（`map`/`filter`/`find`/`length`）。请按类型提示使用。

### 节点图变量（可写）

```ts
g.server({
  id: 1073741825,
  variables: { counter: 0n }
}).on('whenEntityIsCreated', (_evt, f) => {
  const v = f.get('counter')
  f.set('counter', v + 1n)
})
```

说明:

- `variables` 定义图变量，启用类型化的 `f.get` / `f.set`。
- 实体变量仅声明类型（使用 `entity(0)`）。
- `entity(0)` 也可用作占位符，在编辑器中保持实体参数为空。

### 定时器

- 使用 `setTimeout` / `setInterval`（毫秒）。
- 编译器会构建定时器名称池以避免名称冲突。
- `// @gsts:timerPool=4` 可覆盖池大小（高级）。
- `setInterval` 小于等于 100ms 时会触发性能警告。
- 定时器回调支持值捕获，但不支持 dict 捕获。

### 原生 JS 对象限制

- `Object.*` 和 `JSON.*` 通常在节点图作用域中不支持。
- 请在顶层预计算或使用 `raw(...)`。
- 字符串拼接失败时，请在顶层预计算或使用 `str(...)`。

## 可复用函数（gstsServer）

```ts
function gstsServerSum(a: bigint, b: bigint) {
  const total = a + b
  return total
}

g.server({ id: 1073741825 }).on('whenEntityIsCreated', (_evt, f) => {
  const v = gstsServerSum(1n, 2n)
  f.printString(str(v))
})
```

规则:

- 定义在顶层。参数只能是标识符（不支持解构/默认值/可变参数）。
- `return` 仅允许在末尾出现一次。
- 只能在 `g.server().on(...)` 或其他 `gstsServer*` 内部调用。
- 在 `gstsServer*` 内部可直接使用 `gsts.f`（无需传递 `f`）。

## 多入口与合并

- `gsts.config.ts` 的 `entries` 决定编译目标文件。
- 每个入口生成一个图谱，相同 ID 的入口会自动合并。
- dev 模式下仅重新编译受依赖变化影响的部分。

## 输出与调试

- `.gs.ts`: 展开为节点函数调用形式（用于语义/调用检查）。
- `.json`: 节点连接与类型检查的中间表示（IR）。
- `.gia`: 用于注入/导入的最终图谱输出。

## 编译时执行注意事项

- 编译器会遍历所有入口，以 `g.server().on(...)` 为起点进行编译。
- 顶层代码可能被执行一次或多次（取决于增量构建和多个入口）。
- 请注意顶层代码中的文件 I/O 和随机数使用。
- 如需临时禁用注入，可设置一个不存在的 `id`。
- 顶层适用于文件读取、预计算和过程生成。
- `stage.set` 可用作（运行时的）全局变量。

## 脚本命令

- `npm run build`: 完整编译
- `npm run dev`: 增量编译（如已配置则自动注入）
- `npm run maps`: 列出最近的地图
- `npm run backup`: 打开备份目录
- `npm run typecheck`: TypeScript 类型检查
- `npm run lint`: ESLint

说明:

- 本项目包含自定义 ESLint 规则。建议频繁执行 `npm run lint` 以尽早发现隐藏约束问题。
- `npm run typecheck` 有助于在编译报错前发现类型问题。
- `npm run dev` 仅执行 `gsts dev` 的 watch 模式。
- 注入后需重新加载地图才能看到变更。
- 准备一个临时空地图可加快切换和重新加载速度。
- 重新加载前保存可能会覆盖注入内容，必要时请重新注入。

## 常见问题

- `npm run maps` 为空: 请在编辑器中保存一次地图后重试。
- 注入失败: 请检查 `mapId` / `nodeGraphId` 和图谱类型。
- 类型错误: 请先检查 `.value` 的使用方式和类型一致性。

## 函数/事件注释的查找方式（AI 向）

当类型提示不足时，请在 `node_modules/genshin-ts` 中搜索:

- 节点函数/事件定义: `node_modules/genshin-ts/dist/src/definitions/`
- 使用关键词（事件名、函数名）搜索注释和参数说明。
