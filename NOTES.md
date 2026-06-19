# 仓库笔记

## Type Fixes

- 当 gsts 编译器将事件属性（如 `evt.selectionResultList`）的元素错误推断为 `"entity"` 时，使用 `as unknown as bigint` 类型断言可以覆盖 TypeScript 类型，让编译器正确推断为 `"int"`。
- gsts 编译器使用 `env.checker.getTypeAtLocation(decl.name)` 获取变量类型，`as` 断言会影响这个结果。
- 事件属性（如 `evt.selectionResultList`）中取出的值用 `as unknown as bigint` 可强制编译器推断正确类型。

## 结构维护

- 项目结构或文件名变更时，同步更新 `STRUCTURE.md`（目录树 + 文件注解）
- `AGENTS.md` 的 Layout / Read First 部分也需同步更新

## 悬浮交互页

- 必须设置为**层级渲染**才能正常显示（时序渲染可能导致页面不显示）
- 在编辑器里创建「悬浮交互页」后，代码通过 `showFloatingInteractionPage(player, pageIndex, initDict)` 呼出
- 好习惯：带参数的信号 `send` 时传参对齐定义，避免遗漏
- 好习惯：UI 函数尽量在顶层事件处理中调用，通过信号从定时器回调中转，避免时序问题
- **`whenFloatingInteractionPageIsTriggered` 事件必须挂在玩家实体（`playerMain.ts`）上**，不能挂在场景实体（`stageMain.ts`），否则按钮点击无法触发

## gstsServer\* 约束

- `gstsServer*` 函数只能有一个尾部的 `return`，不能在 `if`/`loop`/`switch` 内部使用 `return`
- 需要条件返回时，用变量记录结果，最后统一 `return`：`let result = false; if (...) { result = true }; return result`

## 定时器注意

- `setInterval` 返回值类型是 `string`（定时器句柄名），不是 `bigint`
- 编译后 `clearInterval` 依赖回调内 `evt.timerName`，无法通过 `stage.get` 中转后再从外部清除
- 需要从外部停止 interval 的推荐做法：在回调内检查 stage 标志位，由回调自行 `clearInterval`

## 死锁检测

- 使用 `stage.set('deadlockPageShown', true/false)` 防止重复弹窗
- 取消重置后，调用 `gstsServerCheckDeadlock()` 检查是否仍处于死锁状态，决定是否允许再次弹窗

## 字典 (dict) 限制

- 顶层 `dict(pairs)` 创建的 `ReadonlyDict` **不能**作为字面量传入 `f.queryDictionaryValueByKey()` — gsts IR 不支持序列化字典为内联值
- 字典的正确用法：运行时 `f.assemblyDictionary()`、图变量声明、或空占位 `dict('str','float',null)`
- 顶层预计算数据传给 server 函数只能用 `list()` 数组

## gsts 回调体内变量与运算符规则

- `finiteLoop`、`doubleBranch`、`setInterval` 等 gsts API 的回调体内，只能访问经过 gsts 变量包装的值
- 直接用 `f.getCorrespondingValueFromList` 获取的原始值在回调内**不可读**
- 正确做法：用 `f.initLocalVariable` + `f.setLocalVariable` 包装
  ```typescript
  const raw = gstsServerGetListValue(data, index, maxIdx, 'int', f)
  const wrapped = f.initLocalVariable('int')
  f.setLocalVariable(wrapped.localVariable, raw)
  f.finiteLoop(int(0), count - int(1), (i) => {
    const result = f.addition(wrapped.value, i) // ✅ 回调体内用 API 方法
  })
  ```
- **回调体内算术必须用 `f.addition()`/`f.subtraction()` 等 API 方法**，不能用 JavaScript `+`/`-` 运算符（编译器只转换 API 调用参数位置的运算符，不转换回调体内变量赋值/表达式中的运算符）
- **比较结果必须用 `f.doubleBranch()`/`f.singleBranch()` 判断**，不能用 `if`。`f.lessThan`、`f.greaterThanOrEqualTo` 等比较 API 返回的是 gsts 布尔**对象**，在 JavaScript `if()` 里永远是 truthy，导致条件永远为真。示例：

  ```typescript
  // ❌ 错误：if 对 gsts 布尔对象永远是 truthy
  if (f.lessThan(y, float(2.5))) { ... }

  // ✅ 正确：用 doubleBranch 编译为条件图节点
  f.doubleBranch(
    f.greaterThanOrEqualTo(y, float(2.5)),
    () => { /* 条件为真时 */ },
    () => { /* 条件为假时 */ }
  )
  ```

## 展平数组 + offset 模式

- 多阶段槽位数据展平到单个数组，用 `slotStarts`/`slotCounts` 定位每阶段的数据段
- `gstsServerGetListValue`（1 基）和 `gstsServerGetListValue0`（0 基）读取数据
- `gstsServerGetListValue0` 内部用 `initLocalVariable`/`setLocalVariable` 包装索引参数
- 循环内用 `startIdxVar.value + i` 计算展平索引（需先包装 `startIdx`）

## deriveConfig 使用注意

- **模块作用域提取标量**：`confirmConfig.Type1` 等命名标量必须在模块作用域（constants.ts）提取，不能在图回调内直接 `confirmConfig.type[0]`。后者会被 gsts 编译器编译为 `f.getCorrespondingValueFromList()`，但 deriveConfig 生成的数组是普通 JS 数组，不是 gsts list，导致 `Generic parameter not matched` 错误。
- **keyField 主键标量**：`deriveConfig(data, {}, undefined, 'type')` 按字段值生成命名标量（`Type1`、`Type2`），不依赖数组索引位置。
- **`gstsServerGetListValue` 的第二参数是索引，不是值**：
  - `gstsServerGetListValue`（1 基）：`index=1` → 数组索引 `0`
  - `gstsServerGetListValue0`（0 基）：`index=0` → 数组索引 `0`
  - `evt.params.Type` 是实际值（如 1、2），不是索引。配合 1 基的 `gstsServerGetListValue`，Type 值自然对应目标条目（Type=1 → index 0）。
