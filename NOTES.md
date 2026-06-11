# 仓库笔记

## Type Fixes

- 当 gsts 编译器将事件属性（如 `evt.selectionResultList`）的元素错误推断为 `"entity"` 时，使用 `as unknown as bigint` 类型断言可以覆盖 TypeScript 类型，让编译器正确推断为 `"int"`。
- gsts 编译器使用 `env.checker.getTypeAtLocation(decl.name)` 获取变量类型，`as` 断言会影响这个结果。
- 事件属性（如 `evt.selectionResultList`）中取出的值用 `as unknown as bigint` 可强制编译器推断正确类型。

## 结构维护

- 项目结构或文件名变更时，同步更新 `STRUCTURE.md`（目录树 + 文件注解）
- `AGENTS.md` 的 Layout / Read First 部分也需同步更新

## 字典 (dict) 限制

- 顶层 `dict(pairs)` 创建的 `ReadonlyDict` **不能**作为字面量传入 `f.queryDictionaryValueByKey()` — gsts IR 不支持序列化字典为内联值
- 字典的正确用法：运行时 `f.assemblyDictionary()`、图变量声明、或空占位 `dict('str','float',null)`
- 顶层预计算数据传给 server 函数只能用 `list()` 数组
