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
