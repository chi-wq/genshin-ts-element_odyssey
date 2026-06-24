# UPDATE — 项目更新记录

> 双向对比文档：`main` (v0.03) vs `add_ver0.04_features` (v0.04)。
>
> 生成日期: 2026-06-24

---

# 第一部分: main 分支 (v0.03 相当)

> 注釈/コメント: 日文（原型阶段遗留）

---

## 1. 项目结构

```
src/
  main.ts          ← 全部代码集中在单一文件（约 800 行）
                       包含 4 个 graph + 20 个顶层函数
  resources/
    prefabs.ts     ← 预制体 ID 定义（13 个自定义预制体）
  graph-variables/ ← 空文件夹
```

### 编译配置 (`gsts.config.ts`)

```typescript
{
  compileRoot: '.',
  entries: ['./src'],         // 整个 src 目录为入口
  outDir: './dist',
  inject: {
    gameRegion: 'Global',
    playerId: 873740275,       // 注意：与 add_ver0.04_features 的 344728135 不同
    mapId: 1073741825          // 注意：与 add_ver0.04_features 的 1073741826 不同
  }
}
```

### `prefabs.ts` 可用预制体

```
1086324737: 默认模版
1090519041: 默认模版(角色编辑)
1077936129: Orb                    ← 元素球
1077936130: 金币组
1082130433: 丘丘人test
1077936131: 积木玩偶test
1082130434: 火史莱姆test
1082130435: 打手丘丘人
1082130436: 打手丘丘人test
...（还有其他）
```

---

## 2. 整体架构

全部逻辑写在 `src/main.ts` 一个文件中，包含 **4 个 g.server() 图** + **约 20 个顶层函数**。

### 2.1 4 个图 (graph)

| 图 ID        | 名称          | 事件绑定                                                                                                                                                             | 用途                               |
| ------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `1073741828` | StageMain     | `whenEntityIsCreated`, `whenGlobalTimerIsTriggered`, `StageReady`, `SpawnEnemyWave`, `PlayerEntered`, `PlayerLeaved`, `whenEntityIsDestroyed`, `ElementAttackServer` | 主关卡控制、敌人波次、计时器、计分 |
| `1073741853` | ElementAttack | `whenOnHitDetectionIsTriggered`                                                                                                                                      | 投射物命中 → 元素攻击 + 元素反应   |
| `1073741829` | GetOrb        | `whenEnteringCollisionTrigger`                                                                                                                                       | 碰撞触发器 → 拾取元素球            |
| `1073741837` | PlayerMain    | `whenPlayerTeleportCompletes`                                                                                                                                        | 玩家传送完成 → 发送入场/退场信号   |

### 2.2 信号 (Signal) — 字符串形式

```typescript
'StageReady' // 场景就绪
'SpawnEnemyWave' // 生成敌人波次
'PlayerEntered' // 玩家入场
'PlayerLeaved' // 玩家退场
'ElementAttackServer' // 元素攻击指令
```

所有信号使用**纯字符串**，无 enum 定义。

### 2.3 图变量

```typescript
variables: {
  challengeState: int(0)
}
// 0 = 进行中, 1 = 成功, 2 = 失败, 3 = 中断
```

### 2.4 顶层函数一览

| 函数名                               | 参数                                                           | 返回值             | 用途                                |
| ------------------------------------ | -------------------------------------------------------------- | ------------------ | ----------------------------------- |
| `gstsServerGetElementalTypes`        | `f`                                                            | `list('int', ...)` | 返回 [Cryo,Pyro,Hydro,Electro] 列表 |
| `gstsServerUpdateElementIcons`       | `elem, isMain, f`                                              | void               | 切换主/副元素图标 UI 的 On/Off      |
| `gstsServerElementAttack`            | `elem, hitEntity, hitLocation, rot, sourceEntity, f, dmgCoeff` | void               | 按元素类型执行 `initiateAttack`     |
| `gstsServerGetReactionName`          | `mainElem, subElem, f`                                         | `str`              | 判定元素反应名称                    |
| `gstsServerGetReactionColor`         | `mainElem, subElem, f`                                         | `str`              | 返回反应对应的 HEX 颜色             |
| `gstsServerCreateOrbAtRandomPos`     | `yPos, f`                                                      | void               | 随机位置生成元素球                  |
| `gstsServerSetOrbCollectable`        | `collectable, f`                                               | void               | 设置全场元素球可见/可拾取状态       |
| `gstsServerSpawnEnemy`               | `enemyPrefab, position, rotation, f`                           | void               | 生成单个敌人并添加元素反应监控      |
| `gstsServerSpawnEnemyWave`           | `currentStage, f`                                              | void               | 按关卡生成敌人波次                  |
| `gstsServerClearAllOrbs`             | `f`                                                            | `int(0)`           | 删除场上所有元素球                  |
| `gstsServerRemoveRandomOrb`          | `f`                                                            | `int(0)`           | 删除场上随机一个元素球              |
| `gstsServerSettleSuccessStatus`      | `challengeState, f`                                            | void               | 胜利/失败结算处理                   |
| `gstsServerNextStage`                | `currentStage, f`                                              | void               | 进入下一关或最终胜利                |
| `gstsServerInitializeStageVariables` | `currentStage, f`                                              | void               | 初始化关卡变量和难度参数            |
| `gstsServerCreateStage`              | `currentStage, f`                                              | `int(0)`           | 创建关卡（含战斗循环 setInterval）  |

---

## 3. 常量与配置值

### 3.1 元素常量

```typescript
const Cryo = int(1) // 冰
const Pyro = int(2) // 火
const Hydro = int(3) // 水
const Electro = int(4) // 雷
```

### 3.2 UI 图标 ID

| 常量              | ID           | 用途            |
| ----------------- | ------------ | --------------- |
| `CryoMainIcon`    | `1073742037` | 主冰图标        |
| `PyroMainIcon`    | `1073742015` | 主火图标        |
| `HydroMainIcon`   | `1073742059` | 主水图标        |
| `ElectroMainIcon` | `1073742081` | 主雷图标        |
| `CryoSubIcon`     | `1073742298` | 副冰图标        |
| `PyroSubIcon`     | `1073742292` | 副火图标        |
| `HydroSubIcon`    | `1073742296` | 副水图标        |
| `ElectroSubIcon`  | `1073742294` | 副雷图标        |
| `InitTimer`       | `1073741874` | 初始化计时器 UI |
| `StageTimer`      | `1073741860` | 关卡计时器 UI   |

### 3.3 敌人预制体 ID

```typescript
const enemyHilichurl = prefabId(1082130439) // 丘丘人
const enemyPyroSlime = prefabId(1082130443) // 火史莱姆
const enemyFighter = prefabId(1082130444) // 打手
const enemyHydroSamachurl = prefabId(1082130445) // 水萨满
const enemyRuinGuard = prefabId(1082130446) // 遗迹守卫
const factionEnemy = 4 // 敌方阵营编号
```

### 3.4 元素球常量

```typescript
const orbPrefabIdValue = prefabId(1077936129) // 元素球预制体
const orbCount = 10 // 固定生成 10 个
const elementAttackPrefabIdValue = prefabId(1077936177) // 元素攻击投射物
const monitorElementalReaction = configId(1077936129) // 元素反应监控配置
```

### 3.5 固定位置常量

```typescript
// 玩家初始传送位置
const initialSpawnPos = vec3([10.49, 3.48, 2.97])
const initialSpawnRot = vec3([0, -99.36, 0])

// 下一关传送位置
const nextStageSpawnPos = vec3([224.67, 3.39, -2.78])
const nextStageSpawnRot = vec3([0, 272.89, 0])

// 敌人生成位置（3 个固定槽位）
const enemyPos1 = vec3([1, 3.5, 0]) // 位置 1
const enemyPos2 = vec3([-1, 3.5, 0]) // 位置 2
const enemyPos3 = vec3([0, 3.5, 2]) // 位置 3
const enemyRot1 = vec3([0, 0, 0]) // 旋转 1
const enemyRot2 = vec3([0, 150.25, 0]) // 旋转 2
const enemyRot3 = vec3([0, 90, 0]) // 旋转 3
```

---

## 4. stage 变量字典

`main` 分支中通过 `stage.set()` / `stage.get()` 使用的所有变量：

| 变量名               | 类型            | 用途                          | 初始值          |
| -------------------- | --------------- | ----------------------------- | --------------- |
| `challengeState`     | bigint (图变量) | 0=进行中,1=成功,2=失败,3=中断 | `int(0)`        |
| `currentStage`       | bigint          | 当前关卡编号                  | 通过 stage 存储 |
| `maxStage`           | bigint          | 最大关卡数                    | `int(5)`        |
| `enemyCount`         | bigint          | 场上存活敌人数                | `int(0)`        |
| `maxEnemies`         | bigint          | 关卡最大敌人上限              | 从列表读取      |
| `orbsRequired`       | bigint          | 通关所需元素球数              | 从列表读取      |
| `orbsCollected`      | bigint          | 已收集球数                    | `int(0)`        |
| `collectableTimeout` | bigint          | 可拾取倒计时秒数              | `int(0)`        |
| `orbsCollectable`    | bool            | 元素球是否可拾取              | `false`         |
| `score`              | bigint          | 累积分数                      | 跨关保留        |
| `spawnTimer`         | bigint          | 敌人生成计时器（秒）          | `int(0)`        |
| `stageTimerActive`   | bool            | 关卡计时器是否运行中          | `false`         |
| `teleportFrom`       | bigint          | 传送来源区域                  | `int(0)`        |
| `mainElement`        | bigint          | 当前主元素                    | 每关随机        |
| `subElement`         | bigint          | 当前副元素                    | 每关随机        |
| `inited`             | bool            | 场景是否已初始化              | 首次为 false    |
| `reaction`           | str             | 当前元素反应名称              | `''`            |
| `reactionColor`      | str             | 当前元素反应颜色 HEX          | `''`            |
| `reactionMsg`        | str             | 反应通知消息                  | `''`            |
| `reactionMsgColor`   | str             | 反应通知颜色                  | `''`            |
| `ElementAttLocation` | vec3            | 元素攻击发射位置              | 由外部信号设置  |
| `ElementAttRotate`   | vec3            | 元素攻击发射旋转              | 由外部信号设置  |

---

## 5. 核心机能详情

### 5.1 元素系统

**4 种基础元素**：

- 冰 (Cryo, 1)
- 火 (Pyro, 2)
- 水 (Hydro, 3)
- 雷 (Electro, 4)

**主/副元素初始化**（每关 `gstsServerInitializeStageVariables` 中执行）：

```typescript
const initElement = f.getRandomInteger(int(1), int(4)) // 随机 1~4
stage.set('mainElement', initElement)

const offset = f.getRandomInteger(int(1), int(3)) // 随机 1~3
let initSub = initElement + offset
if (initSub > int(4)) {
  initSub = initSub - int(4) // 回绕
}
stage.set('subElement', initSub)
```

**元素图标更新函数 `gstsServerUpdateElementIcons(elem, isMain, f)`**：

1. 根据 `isMain` 选择主/副图标数组
2. 将所有 4 个图标设为 Off
3. 根据 `elem` 值将对应图标设为 On

### 5.2 元素攻击 (`gstsServerElementAttack`)

```typescript
function gstsServerElementAttack(elem, hitEntity, hitLocation, rot, sourceEntity, f, dmgCoeff)
```

**参数说明**：

- `elem`: 元素类型 (1=冰,2=火,3=水,4=雷)
- `dmgCoeff`: `float(0)` = 仅附着无伤害, `float(1)` = 正常伤害
- `hitEntity`: 命中目标
- `hitLocation`: 命中位置

**执行流程**：

1. 建立元素名字典 `['', 'Cryo', 'Pyro', 'Hydro', 'Electro']`
2. 通过 `f.getCorrespondingValueFromList` 查找元素名
3. 调用 `f.initiateAttack(hitEntity, dmgCoeff, 0, hitLocation, rot, elemName, true, sourceEntity)`

### 5.3 元素反应系统

**6 种反应判定**（`gstsServerGetReactionName` 中的 if-else 逻辑）：

```
  主/副含冰(1)?
  ├── 冰+火 → 溶解 (#FF6633)
  ├── 冰+水 → 凍結 (#99FFFF)
  ├── 冰+雷 → 超電導 (#B065E0)
  └── 无匹配 → 空
  主/副含火(2)且不含冰?
  ├── 火+水 → 蒸発 (#FF9933)
  ├── 火+雷 → 過負荷 (#FF3366)
  └── 无匹配 → 空
  其余组合:
  └── 水+雷 → 感電 (#CC77FF)
```

**反应触发时机**（在 `ElementAttack` 图的 `whenOnHitDetectionIsTriggered` 中）：

```typescript
// Step 1: 先用副元素附着（dmg=0），立即执行
gstsServerElementAttack(subElem, hitEntity, hitLocation, rot, sourceEntity, f, float(0))

// Step 2: 10ms 后用主元素攻击（dmg=1）
setTimeout(() => {
  gstsServerElementAttack(mainElem, hitEntity, hitLocation, rot, sourceEntity, f, float(1))
  // 如果有副元素且与主元素不同，设置反应名
  if (subElem !== int(0) && subElem !== mainElem) {
    const reactionName = gstsServerGetReactionName(mainElem, subElem, f)
    const reactionColor = gstsServerGetReactionColor(mainElem, subElem, f)
    stage.set('reaction', reactionName)
    stage.set('reactionColor', reactionColor)
  }
}, 10)

// Step 3: 500ms 后清除攻击投射物实体
setTimeout(() => {
  f.removeEntity(sourceEntity)
}, 500)
```

### 5.4 元素球 (Orb) 系统

**生成函数 `gstsServerCreateOrbAtRandomPos(yPos, f)`**：

```typescript
const x = f.getRandomInteger(int(-10), int(10))
const z = f.getRandomInteger(int(-10), int(10))
const position = f.create3dVector(float(x), float(yPos), float(z))
const orb = f.createPrefab(orbPrefabIdValue, position, vec3([0, 0, 0]), stage, true, 1, [])
orb.setFaction(2) // 阵营设为 2
f.activateDisableModelDisplay(orb, false) // 初始不可见
const elemIdx = f.getRandomInteger(int(0), int(3))
const elemType = f.getCorrespondingValueFromList(elementalTypes, elemIdx)
orb.setCustomVariable('element', elemType) // 存储元素类型
```

**可拾取控制 `gstsServerSetOrbCollectable(collectable, f)`**：

- 设置 `stage.set('orbsCollectable', collectable)`
- 遍历场上所有 Orb 预制体
- 切换 `activateDisableModelDisplay(orb, collectable)`（true=显示/可拾取, false=隐藏）

**拾取处理**（`GetOrb` 图 `whenEnteringCollisionTrigger`）：

```typescript
// 敌人触发 → 发送 SpawnEnemyWave
// 玩家触发:
if (!stage.get('orbsCollectable')) {
  send('SpawnEnemyWave') // 不可拾取时触发敌人波次
  return
}
// 可拾取时:
orbsCollected += 1
score += 30
const element = triggerEntity.getCustomVariable('element') // 读取球的元素类型
subElement = mainElement // 当前主 → 副
mainElement = element // 球元素 → 主
// 更新图标
triggerEntity.activateDisableCollisionTrigger(evt.triggerId, false) // 禁用触发器
triggerEntity.destroy()
triggerEntity.remove()
```

**注意**：`main` 分支中元素球**没有超时变为深渊球的机制**，也没有"特殊元素球"。

### 5.5 敌人系统

**生成函数 `gstsServerSpawnEnemy(enemyPrefab, position, rotation, f)`**：

```typescript
const enemy = f.createPrefab(enemyPrefab, position, rotation, stage, true, 1, [])
enemy.setFaction(factionEnemy) // 阵营设为 4
f.addUnitStatus(enemy, enemy, monitorElementalReaction, int(1), dict('str', 'float', null))
// 添加元素反应监控
```

**击杀处理**（`StageMain` 图 `whenEntityIsDestroyed`）：

```typescript
// 仅处理敌方阵营 (factionEnemy=4)
// 1. 设置所有球为可拾取状态 + 5秒倒计时
gstsServerSetOrbCollectable(true, f)
stage.set('collectableTimeout', int(5))

// 2. enemyCount -= 1

// 3. 计分:
//    - 反应击杀（reaction 非空）: +100 分, 显示反应消息 (3秒后自动清除)
//    - 普通击杀: +1 分
```

### 5.6 关卡配置（硬编码）

**5 关难度配置表**（在 `gstsServerInitializeStageVariables` 中定义）：

```typescript
const stageMaxEnemies = list('int', [int(12), int(18), int(24), int(30), int(36)])
const stageOrbsRequired = list('int', [int(3), int(4), int(5), int(6), int(7)])
```

索引计算：`idx = currentStage - 1`，超出 5 关则钳位到 `int(4)`。

**5 关敌人波次**（在 `gstsServerSpawnEnemyWave` 中 if-else）：

| 关卡 | 生成条件                  | 敌人组合                                                | 生成数量 | enemyCount 增量 |
| ---- | ------------------------- | ------------------------------------------------------- | -------- | --------------- |
| 1    | `currentStage === int(1)` | 丘丘人×2 (pos1/rot1, pos2/rot2)                         | 2        | +2              |
| 2    | `currentStage === int(2)` | 丘丘人 (pos1/rot1), 火史莱姆 (pos2/rot2)                | 2        | +2              |
| 3    | `currentStage === int(3)` | 打手×2 (pos1/rot1, pos2/rot2), 火史莱姆 (pos3/rot3)     | 3        | +3              |
| 4    | `currentStage === int(4)` | 打手×2 (pos1/rot1, pos3/rot3), 水萨满 (pos2/rot2)       | 3        | +3              |
| 5    | else                      | 遗迹守卫 (pos1/rot1), 火史莱姆×2 (pos2/rot2, pos3/rot3) | 3        | +3              |

**敌人上限检查**（`SpawnEnemyWave` 信号回调）：

```typescript
if (enemyCount < stage.get('maxEnemies').asType('int')) {
  gstsServerSpawnEnemyWave(currentStage, f)
}
```

注意：`main` 分支**没有死锁检测**，如果敌人已满但球数不足，不会出现死锁弹窗。

### 5.7 完整关卡流程时序

```
[EntityCreated]
  │
  ├── stage.get('inited') == true? → 跳过（场景已存在时）
  └── stage.get('inited') == false?
       ├── setInterval 1秒轮询
       ├── 首次: stage.set('inited', true)
       └── 再次: clearInterval + send('StageReady')
             │
[StageReady]
  │
  ├── BGM 设置 (int(10075), 音量100, 循环)
  ├── gstsServerCreateStage(currentStage)
  │     ├── gstsServerInitializeStageVariables(currentStage, f)
  │     │     ├── enemyCount=0, collectableTimeout=0, orbsCollected=0
  │     │     ├── spawnTimer=0, stageTimerActive=false
  │     │     ├── mainElement = random(1~4)
  │     │     ├── subElement = mainElement + random(1~3), wrap if >4
  │     │     ├── challengeState=0
  │     │     └── maxEnemies/orbsRequired 从列表读取 (按关卡索引)
  │     │
  │     ├── 生成 10 个元素球 (finiteLoop)
  │     │
  │     └── setInterval (战斗循环, 1秒间隔)
  │
  ├── InitTimer UI = On
  └── startGlobalTimer(stage, 'InitTimer')
        │
[InitTimer 触发] (whenGlobalTimerIsTriggered)
  │
  ├── stopGlobalTimer(stage, 'InitTimer')
  ├── InitTimer UI = Off
  ├── teleportFrom = 0
  └── teleportPlayer 到初始位置 (10.49, 3.48, 2.97)
        │
[PlayerMain: whenPlayerTeleportCompletes]
  │
  ├── teleportFrom === 0 ? → send('PlayerEntered')
  └── teleportFrom !== 0 ? → send('PlayerLeaved')
        │
[PlayerEntered]
  │
  ├── StageTimer UI = On
  ├── startGlobalTimer(stage, 'StageTimer')    ← 倒计时开始
  └── stage.set('stageTimerActive', true)
        │
        ├── [敌人波次] SpawnEnemyWave → 检查 enemyCount < maxEnemies → 生成
        │
        ├── [战斗循环 1秒] setInterval
        │     ├── challengeState 检查 (2/1/3 → clearInterval)
        │     ├── timerActive 检查 → 剩余时间 ≤ 0? → 超时失败
        │     ├── 成功条件: enemyCount===0 && orbsCollected>=orbsRequired
        │     │     → f.set('challengeState', 1) → gstsServerNextStage
        │     │
        │     ├── 可拾取倒计时: countdown > 0 → countdown-1
        │     │     countdown === 0 → 不可拾取 → send('SpawnEnemyWave')
        │     │
        │     └── 敌人生成: spawnTimer >= 10 → reset → send('SpawnEnemyWave')
        │
        └── [StageTimer 触发] (whenGlobalTimerIsTriggered)
              → 超时失败: challengeState=2 → gstsServerSettleSuccessStatus(2)
                    │
                    └── 失败结算
```

### 5.8 关卡切换

```typescript
[成功] gstsServerNextStage(currentStage, f)
  │
  ├── 全部球删除 (gstsServerClearAllOrbs)
  ├── stopGlobalTimer(StageTimer), UI=Off, stageTimerActive=false
  │
  ├── currentStage === maxStage?
  │     └── gstsServerSettleSuccessStatus(1) → 胜利结算
  │
  └── 还有下一关?
        ├── challengeState=3 (中断)
        ├── teleportFrom = currentStage
        └── teleportPlayer 到下一关位置 (224.67, 3.39, -2.78)
              │
              [PlayerMain: whenPlayerTeleportCompletes]
                └── teleportFrom !== 0 → send('PlayerLeaved')
                      │
                      [PlayerLeaved]
                        ├── StageTimer UI=Off, stopGlobalTimer
                        ├── currentStage += 1
                        ├── gstsServerCreateStage(newStage)
                        ├── InitTimer UI=On
                        └── startGlobalTimer(InitTimer)
```

### 5.9 元素攻击（外部触发）

通过 `ElementAttackServer` 信号触发（由客户端信号或其他图发出）：

```typescript
// StageMain 图 ElementAttackServer 回调
const loc = stage.get('ElementAttLocation') // 从 stage 变量读取位置
const rot = stage.get('ElementAttRotate') // 从 stage 变量读取旋转
const elementAttack = f.createProjectile(
  elementAttackPrefabIdValue,
  loc,
  rot,
  entity(0),
  entity(0),
  false,
  int(1),
  []
)
// 3 秒超时自动清除
const ti = setTimeout(() => {
  f.removeEntity(elementAttack)
  clearTimeout(ti)
}, 3000)
```

**投射物命中处理**（`ElementAttack` 图）：

- 在 `whenOnHitDetectionIsTriggered` 中处理
- 读取 `mainElement` / `subElement`
- 副元素附着 → 10ms 后主元素攻击 → 触发元素反应

### 5.10 计分系统

| 事件         | 加分 | 触发时机                                     |
| ------------ | ---- | -------------------------------------------- |
| 普通击杀     | +1   | `whenEntityIsDestroyed` 中 `reaction === ''` |
| 元素反应击杀 | +100 | `whenEntityIsDestroyed` 中 `reaction !== ''` |
| 收集元素球   | +30  | `GetOrb` 图 `whenEnteringCollisionTrigger`   |

分数跨关卡累积（不在 `gstsServerInitializeStageVariables` 中重置）。

**结算显示**：

```typescript
f.setPlayerSettlementScoreboardDataDisplay(player1, int(1), str('スコア'), finalScore)
```

---

## 6. 已知限制/问题

1. **元素球位置完全随机** (-10~10)，可能与玩家或敌人初始位置重叠
2. **无特殊元素球**（风/岩/草/光不存在）
3. **无深渊球机制**（超时后球直接消失而非变为深渊球）
4. **无道具/卡牌系统**（没有 E 技能道具使用）
5. **无规则说明按钮和弹窗**
6. **无重置关卡按钮**
7. **无死锁检测**（无敌人可生成且球数不足时不会弹窗提示重置）
8. **5 关后没有更多内容**（clamp 到第 5 关的配置）
9. **单文件结构**不利于维护
10. **注释为日文**，与中文项目不统一

---

## 7. 与 add_ver0.04_features 的差距

| 维度           | main                            | add_ver0.04_features                   |
| -------------- | ------------------------------- | -------------------------------------- |
| **代码结构**   |                                 |                                        |
| 文件数量       | 2 个 (`main.ts` + `prefabs.ts`) | 29 个文件                              |
| 模块拆分       | ❌ 单一文件                     | ✅ config/graphs/systems/types/utils   |
| deriveConfig   | ❌ 无                           | ✅ 类型安全配置系统                    |
| 信号定义       | ❌ 字符串字面量                 | ✅ `Signal` enum                       |
|                |                                 |                                        |
| **关卡系统**   |                                 |                                        |
| 关卡数量       | 5 关硬编码                      | 9 关声明式配置                         |
| 配置方式       | if-else 分支                    | `StageConfig[]` + `deriveConfig`       |
| 关卡目标/提示  | ❌ 无                           | ✅ goal + tips 逐关配置                |
| 无限时间模式   | ❌ 无                           | ✅ `infiniteTime` 图变量               |
|                |                                 |                                        |
| **元素球系统** |                                 |                                        |
| 球的数量       | 固定 10 个                      | 逐关 `orbCount` 配置                   |
| 特殊元素球     | ❌ 无                           | ✅ 风(+30s)/岩(护盾)/草(回血)/光(全灭) |
| 深渊球         | ❌ 无                           | ✅ 超时变为深渊球(不可拾取,追踪攻击)   |
| 净化机制       | ❌ 无                           | ✅ 净化道具恢复可拾取                  |
| 随机池         | ❌ `getRandomInteger` 每次      | ✅ dict 图变量 `orbPool` 去重          |
|                |                                 |                                        |
| **道具系统**   |                                 |                                        |
| 道具类型       | ❌ 无                           | ✅ 5 种 (回血/护盾/加时/全灭/净化)     |
| 道具选择器     | ❌ 无                           | ✅ 每关卡牌选择器 UI                   |
| 道具使用       | ❌ 无                           | ✅ E 技能键使用                        |
|                |                                 |                                        |
| **UI 交互**    |                                 |                                        |
| 规则说明       | ❌ 无                           | ✅ 规则按钮 + 悬浮交互页               |
| 重置关卡       | ❌ 无                           | ✅ 重置按钮 + 确认弹窗 (Type1/2)       |
| 死锁检测       | ❌ 无                           | ✅ `gstsServerCheckDeadlock`           |
| 消息队列       | ❌ 无                           | ✅ 道具/反应通知                       |
|                |                                 |                                        |
| **文本预处理** |                                 |                                        |
| 富文本格式化   | ❌ 无                           | ✅ `fmt()` 自动【】着色 + `\n` 转义    |
| 语言           | 日文                            | 中文                                   |
|                |                                 |                                        |
| **配置**       |                                 |                                        |
| `playerId`     | `873740275`                     | `344728135`                            |
| `mapId`        | `1073741825`                    | `1073741826`                           |

---

# 第二部分: add_ver0.04_features 分支 (v0.04)

## 1. 项目结构

```
src/
  main.ts              ← 入口，仅 import 6 个 graph 文件
  config/
    battleStageConfig.ts  ← 9 关声明式配置 + deriveConfig
    constants.ts          ← 所有常量集中管理
    ruleText.ts           ← 游戏规则文本
    spawnSlots.ts         ← 敌人固定生成槽位
  graphs/
    stageMain.ts          ← 主关卡控制 (ID: 1073741854)
    playerMain.ts         ← 玩家操作/UI交互 (ID: 1073741837)
    elementAttack.ts      ← 玩家投射物命中处理 (ID: 1073741853)
    enemyElementAttack.ts ← 敌方元素攻击命中处理 (ID: 1073741855)
    getOrb.ts             ← 元素球拾取处理 (ID: 1073741829)
    scanTagReady.ts       ← 场景就绪检测 (ID: 1073741856)
  systems/
    stageFlow.ts          ← 关卡生命周期管理
    cardSystem.ts         ← 道具/卡牌系统
    elementSystem.ts      ← 元素攻击、反应、增益
    enemySystem.ts        ← 敌人生成、击杀、防掉落
    orbSystem.ts          ← 元素球生成、随机池、深渊球
  types/
    config.ts             ← StageConfig/ConfirmConfig 类型 + deriveConfig()
  utils/
    logger.ts             ← 调试日志
    stageUtils.ts         ← 安全列表访问、消息通知
    enemyPrefabs.ts       ← 敌人名称→prefabId 映射
  resources/
    prefabs.ts            ← 预制体 ID (自动生成)
    signals.ts            ← 信号定义 (自动生成)
  graph-variables/        ← 空
```

### 编译配置 (`gsts.config.ts`)

```typescript
{
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'Global',
    playerId: 344728135,        // 与 main 的 873740275 不同
    mapId: 1073741826           // 与 main 的 1073741825 不同
  }
}
```

---

## 2. 整体架构

### 2.1 6 个图 (graph)

| 图 ID        | 名称               | 事件绑定                                                                                                                                                                                                                                                                                    | 用途                                        |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `1073741854` | StageMain          | `whenEntityIsCreated`, `whenGlobalTimerIsTriggered`(×2), `Signal.StageReady`, `Signal.SpawnEnemyWave`, `Signal.EnterBattleStage`, `Signal.PreFightPreparation`, `whenEntityIsDestroyed`, `Signal.ClientSignal`(×2), `Signal.ShowFloatingInteractionPage`, `whenAllPlayerSCharactersAreDown` | 主关卡控制、战斗循环、计时器、计分、UI 控制 |
| `1073741837` | PlayerMain         | `whenPlayerTeleportCompletes`, `whenDeckSelectorIsComplete`, `whenUiControlGroupIsTriggered`(×3), `whenTheCharacterIsDown`, `whenFloatingInteractionPageIsTriggered`                                                                                                                        | 玩家传送、卡牌选择、按钮交互、角色倒下      |
| `1073741853` | ElementAttack      | `whenOnHitDetectionIsTriggered`                                                                                                                                                                                                                                                             | 投射物命中 → 元素附着 + 主攻击 + 反应       |
| `1073741855` | EnemyElementAttack | `whenOnHitDetectionIsTriggered`                                                                                                                                                                                                                                                             | 敌方投射物命中（占位）                      |
| `1073741829` | GetOrb             | `whenEnteringCollisionTrigger`                                                                                                                                                                                                                                                              | 元素球碰撞 → 收集/敌方攻击                  |
| `1073741856` | ScanTagReady       | `whenOnHitDetectionIsTriggered`                                                                                                                                                                                                                                                             | 扫描标签 → 场景就绪判定                     |

### 2.2 信号 (Signal) — enum 定义

```typescript
// 定义在 src/resources/signals.ts
Signal.ClientSignal           ← 参数: SignalName, Location, Rotate, OwnerEntity, OwnerPlayer
Signal.EnterBattleStage       ← 无参数
Signal.PreFightPreparation    ← 无参数
Signal.ShowFloatingInteractionPage  ← 参数: Index, Type
Signal.SpawnEnemyWave         ← 无参数
Signal.StageReady             ← 无参数
Signal.UpdateNotificationMsgList    ← 参数: Entity, NotificationQueueIndex, NotificationItemId, Msg
```

### 2.3 图变量

```typescript
// StageMain 图
variables: {
  challengeState: int(0),       // 0=进行中, 1=成功, 2=失败, 3=中断
  infiniteTime: bool(false),    // 是否无限时间
  orbPool: dict('int', 'bool', null)  // 运行时随机池
}
```

---

## 3. 配置层详解

### 3.1 `battleStageConfig.ts` — 9 关配置

使用 `deriveConfig()` 自动生成展平数组。每关配置字段：

| 字段               | 类型         | 说明                   |
| ------------------ | ------------ | ---------------------- |
| `maxEnemies`       | number       | 场上最大敌人数         |
| `orbsRequired`     | number       | 通关所需元素球数       |
| `orbCount`         | number       | 元素球生成数量         |
| `fixedCard`        | number       | 固定道具序号（0=随机） |
| `skipCardSelector` | boolean      | 是否跳过道具选择器     |
| `orbSPCount`       | number       | 特殊球数量             |
| `fixedSpecialOrb`  | number       | 固定特殊元素类型       |
| `permanentOrbs`    | boolean      | 元素球是否永久可见     |
| `infiniteTime`     | boolean      | 无限时间               |
| `goal`             | string       | 关卡目标               |
| `tips`             | string       | 关卡提示               |
| `slots`            | SlotConfig[] | 敌人槽位数组           |

**9 关详情**：

| 关  | 名称       | 敌人             | 需球 | 球数 | 道具   | 特殊球 | 时间 | 特色                 |
| --- | ---------- | ---------------- | ---- | ---- | ------ | ------ | ---- | -------------------- |
| 1   | 学习收集   | 0                | 1    | 1    | 无     | 0      | ∞    | 球永久可见，跳过选卡 |
| 2   | 学习净化   | 0                | 1    | 1    | Purify | 0      | 限时 | 首次选卡，深渊球     |
| 3   | 纯战斗     | 4丘丘            | 0    | 0    | Heal   | 0      | 限时 | 首次打怪，教长按普攻 |
| 4   | 净化+打怪  | 4丘丘            | 1    | 2    | Purify | 0      | 限时 | 首次实战组合         |
| 5   | 更多敌人   | 6丘丘×2          | 2    | 4    | Heal   | 0      | 限时 | 两波敌人             |
| 6   | 首次特殊球 | 8丘丘+火史       | 2    | 5    | Purify | 1草    | 限时 | 草色十字回血         |
| 7   | 随机道具   | 12打手+丘丘+火史 | 3    | 8    | 随机   | 2随机  | 限时 | 灵活运用道具         |
| 8   | 元素反应   | 18打手×2+水萨    | 4    | 8    | 随机   | 2随机  | 限时 | 反应教学             |
| 9   | 挑战       | 24遗迹+火史×2    | 5    | 8    | 随机   | 3随机  | 限时 | 遗迹守卫飞弹         |

**自动生成的 deriveConfig 输出字段**：

```typescript
// 标量字段
battleStageConfig.maxEnemies: bigint[]     // [0,0,4,4,6,8,12,18,24]
battleStageConfig.orbsRequired: bigint[]   // [1,1,0,1,2,2,3,4,5]
battleStageConfig.orbCount: bigint[]       // [1,1,0,2,4,5,8,8,8]
battleStageConfig.fixedCard: bigint[]      // [0,5,1,5,1,5,0,0,0]
battleStageConfig.skipCardSelector: bigint[] // [1,0,0,0,0,0,0,0,0]
battleStageConfig.orbSPCount: bigint[]     // [0,0,0,0,0,1,2,2,3]
battleStageConfig.fixedSpecialOrb: bigint[] // [0,0,0,0,0,7,0,0,0]
battleStageConfig.permanentOrbs: bigint[]  // [1,0,0,0,0,0,0,0,0]
battleStageConfig.infiniteTime: bigint[]   // [1,0,0,0,0,0,0,0,0]
battleStageConfig.goal: string[]
battleStageConfig.tips: string[]
battleStageConfig.size: bigint             // 9
battleStageConfig.maxIdx: bigint           // 8

// 嵌套字段（slots[] 展平）
battleStageConfig.slotType: string[]       // 全关卡 slots 的 type 拼接
battleStageConfig.slotPos: bigint[]        // 全关卡 slots 的 pos 拼接
battleStageConfig.slotRot: bigint[]        // 全关卡 slots 的 rot 拼接
battleStageConfig.slotStarts: bigint[]     // 每段起始索引
battleStageConfig.slotCounts: bigint[]     // 每段长度
battleStageConfig.maxSlotIdx: bigint       // 总最大索引
```

**`fmt()` 预处理函数**：

```typescript
const fmt = (s: string) =>
  s
    .trim()
    .replace(/【([^】]+)】/g, '<b><i><color=#ADD8E6>【$1】</color></i></b>')
    .replace(/\n/g, '\\n     ')
```

自动为所有 `goal` / `tips` 中的 `【术语】` 添加富文本颜色，并处理多行文本转义。

### 3.2 `constants.ts` — 常量清单

| 类别     | 常量                                                           | 数量 | 用途           |
| -------- | -------------------------------------------------------------- | ---- | -------------- |
| 元素     | Cryo/Pyro/Hydro/Electro                                        | 4    | 基础元素       |
| 特殊元素 | Anemo/Geo/Dendro/Light                                         | 4    | 增益型元素     |
| 主图标   | CryoMainIcon/PyroMainIcon/HydroMainIcon/ElectroMainIcon        | 4    | UI 主元素显示  |
| 副图标   | CryoSubIcon/PyroSubIcon/HydroSubIcon/ElectroSubIcon            | 4    | UI 副元素显示  |
| 计时器   | InitTimer/StageTimer                                           | 2    | UI ID          |
| 道具     | CardHeal/Shield/Time/ClearEnemies/Purify                       | 5    | 道具 ID        |
| 图标     | CardHealIcon/ShieldIcon/TimeIcon/ClearEnemiesIcon/PurifyIcon   | 5    | 道具图标资产   |
| 选择器   | DeckSelectorIndex/Duration(60)/SelectMin(1)/SelectMax(1)       | 4    | 卡牌选择器配置 |
| 弹窗     | ConfirmPageIndex/ConfirmOKButton/confirmConfig(Type1/2)        | —    | 确认弹窗       |
| UI 按钮  | ResetButton/RuleButton/RulePageIndex/RulePageCloseButton       | 4    | 交互控件       |
| 传送     | PlayerSpawnPos/Rot, PlayerSpawnPos2/Rot2                       | 4    | vec3 坐标      |
| 防掉落   | SafeFallbackPos/Rot                                            | 2    | vec3           |
| 消息     | NotificationQueueIndex/NotificationItemId                      | 2    | 消息队列       |
| 生成     | EXCLUDE_RADIUS(3)/GRID_RANGE(10)/GRID_STEP(3)/ORB_SPAWN_Y(3.2) | 4    | 安全网格       |

### 3.3 `ruleText.ts` — 游戏规则

```
【目标】全灭敌人并集齐所需元素球即可通关。
【元素球】普通球(冰/火/水/雷)...触碰更新主元素... +30分
【特殊球/特殊元素球】风环→+30秒 岩盾→护盾 草色十字→回血 光柱→全灭
【深渊球】不可拾取，触碰追踪攻击
【元素反应】融化/冻结/超导/蒸发/超载/感电
【计分】普通+1，反应+100，收集+30
【道具】每关选一张卡
【敌人】每10秒一波
【失败】倒计时归零或角色倒下
【重置】重置按钮
```

### 3.4 `spawnSlots.ts` — 敌人槽位

| 索引 | 位置           | 旋转             |
| ---- | -------------- | ---------------- |
| 0    | `(1, 3.5, 0)`  | `(0, 0, 0)`      |
| 1    | `(-1, 3.5, 0)` | `(0, 150.25, 0)` |
| 2    | `(0, 3.5, 2)`  | `(0, 90, 0)`     |

导出：`spawnSlots` (含 size/positions/rotations)、原始元组、`spawnSlotSize`。

---

## 4. 系统层详解

### 4.1 `stageFlow.ts` — 关卡生命周期

| 函数                                                  | 用途           | 关键逻辑                                                                                                                                    |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `gstsServerSettleSuccessStatus(challengeState, f)`    | 胜利/失败结算  | 清球→停 StageTimer→隐藏UI→SettlementStatus 胜利(1)/失败(2)→显示分数                                                                         |
| `gstsServerNextStage(currentStage, f)`                | 进入下一关     | 清球→停 StageTimer→判断是否最后一关→胜利结算 or 中断状态+传送                                                                               |
| `gstsServerInitializeStageVariables(currentStage, f)` | 初始化关卡变量 | 重置所有 stage 变量，从 config 读取 maxEnemies/orbsRequired/orbCount/goal/tips，读取 permanentOrbs/infiniteTime，更新元素图标，构建 orbPool |
| `gstsServerCreateStage(currentStage, f)`              | 创建关卡       | InitVariables → 清敌人/球 → finiteLoop 生成普通球 → 生成特殊球                                                                              |
| `gstsServerCheckDeadlock()`                           | 死锁检测       | `enemyCount===0 && maxEnemies===0 && orbsCollected<orbsRequired && !canPickup && !hasPurify`                                                |
| `gstsServerStartStageIntervalTimer(f)`                | 战斗循环启动   | 双 setInterval：(1) 防掉落每秒检测 (2) 主循环每秒检测：超时/角色倒下/胜利条件/死锁/可拾取倒计时/敌人生成(10s)                               |
| `gstsServerRestartStage(f)`                           | 重置本关       | currentStage-1 → 清敌/球 → 停计时器 → PreFightPreparation                                                                                   |
| `gstsServerWaitForPlayerReady(f)`                     | 等待玩家就绪   | 每秒轮询 stage 存在/inited/player/角色/maxHp → CharacterReady                                                                               |

### 4.2 `cardSystem.ts` — 道具系统

| 函数                                        | 用途                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `gstsServerCardEffectToElement(cardEffect)` | 道具ID→元素：Heal(1)→Dendro(7), Shield(2)→Geo(6), Time(3)→Anemo(5), ClearEnemies(4)→Light(8), Purify(5)→0 |
| `gstsServerCardEffectToIcon(cardEffect)`    | 道具ID→图标资产ID                                                                                         |
| `gstsServerSetESkillIcon(iconId)`           | 设置 E 技能图标（UI picture control）                                                                     |
| `gstsServerShowDeckSelector(fixedCard, f)`  | 显示卡牌选择器：fixedCard=0 时随机 2 张不同卡，否则固定 1 张                                              |

**5 种道具**：

| ID  | 名称                   | 效果                | 图标     |
| --- | ---------------------- | ------------------- | -------- |
| 1   | 生命回复(Heal)         | 回复 10000 HP       | `111128` |
| 2   | 护盾(Shield)           | 添加护盾 20s        | `111111` |
| 3   | 增加时间(Time)         | StageTimer +30s     | `111016` |
| 4   | 敌人全灭(ClearEnemies) | 清除场上所有敌人    | `111025` |
| 5   | 净化(Purify)           | 深渊球恢复可拾取 5s | `111048` |

### 4.3 `elementSystem.ts` — 元素系统

| 函数                                               | 用途                     |
| -------------------------------------------------- | ------------------------ |
| `gstsServerGetElementalTypes(f)`                   | 返回 `[1,2,3,4]`         |
| `gstsServerGetSpecialElementalTypes(f)`            | 返回 `[5,6,7,8]`         |
| `gstsServerUpdateElementIcons(elem, isMain, f)`    | 全部 Off → 对应 On       |
| `gstsServerElementAttack(elem, ..., dmgCoeff)`     | `initiateAttack` 包装    |
| `gstsServerGetReactionName(mainElem, subElem, f)`  | 6 种反应判定（中文短名） |
| `gstsServerGetReactionColor(mainElem, subElem, f)` | HEX 颜色字符串           |
| `gstsServerApplyBuffEffect(elem, targetEntity, f)` | 应用元素增益效果         |

**元素反应**（中文短名）：

| 组合  | 名称 | 颜色      |
| ----- | ---- | --------- |
| 冰+火 | 熔   | `#FF6633` |
| 冰+水 | 冻   | `#99FFFF` |
| 冰+雷 | 超导 | `#B065E0` |
| 火+水 | 蒸   | `#FF9933` |
| 火+雷 | 超载 | `#FF3366` |
| 水+雷 | 感电 | `#CC77FF` |

**元素增益效果**：

| 元素   | 效果       | 实现方式                                                                 |
| ------ | ---------- | ------------------------------------------------------------------------ |
| 风 (5) | +30 秒     | `f.addGlobalTimerTime(stage, 'StageTimer', float(30))`                   |
| 岩 (6) | 护盾 20 秒 | `f.addUnitStatus(targetEntity, targetEntity, geoShieldConfigId, 1, ...)` |
| 草 (7) | 回血 10000 | `f.modifyEntityHealthEx(entity, float(10000), ...)`                      |
| 光 (8) | 全灭敌人   | `gstsServerClearAllEnemies(f)`                                           |

### 4.4 `enemySystem.ts` — 敌人系统

| 函数                                                       | 用途                                          |
| ---------------------------------------------------------- | --------------------------------------------- |
| `gstsServerSpawnEnemy(enemyPrefab, pos, rot, f)`           | 生成单个敌人 + 添加元素反应监控               |
| `gstsServerGetEnemyPosByIdx(idx, f)`                       | 从 spawnSlots 查位置                          |
| `gstsServerGetEnemyRotByIdx(idx, f)`                       | 从 spawnSlots 查旋转                          |
| `gstsServerSpawnSlot(slotType, slotPosIdx, slotRotIdx, f)` | 按槽位生成敌人（名称→prefab）                 |
| `gstsServerSpawnEnemyWave(currentStage, f)`                | 从 config 读取槽位配列，finiteLoop 生成       |
| `gstsServerClearAllEnemies(f)`                             | 清除场上所有 5 种敌人                         |
| `gstsServerHandleEnemyKill(f)`                             | Orbs 可拾取+5s→enemyCount-1→计分              |
| `gstsServerCheckFallenEnemies(f)`                          | 防掉落：Y<2.5 时回拉，使用 `f.doubleBranch()` |

**5 种敌人预制体**：

| 名称                  | prefabId     |
| --------------------- | ------------ |
| `enemyHilichurl`      | `1082130439` |
| `enemyPyroSlime`      | `1082130443` |
| `enemyFighter`        | `1082130444` |
| `enemyHydroSamachurl` | `1082130445` |
| `enemyRuinGuard`      | `1082130446` |

**计分处理**：

```
反应击杀: orbs 可拾取(5s) → enemyCount-1 → score+100 → 显示反应消息(3s) → 清除
普通击杀: orbs 可拾取(5s) → enemyCount-1 → score+1
```

### 4.5 `orbSystem.ts` — 元素球系统

| 函数                                                        | 用途                                             |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `gstsServerBuildOrbPool(f)`                                 | 重建 dict `orbPool`，key = 0..safeCount-1        |
| `gstsServerCreateOrbAtSafePos(prefabId, yPos, f)`           | 从 orbPool 随机取 key → 移除 → 查 safePos → 生成 |
| `gstsServerCreateOrbAtRandomPos(yPos, f)`                   | 调用 CreateOrbAtSafePos + 随机分配基础元素       |
| `gstsServerCreateSpecialOrbAtRandomPos(yPos, f, fixedElem)` | 同上，使用特殊球预制体 + 随机/固定特殊元素       |
| `gstsServerSetOrbCollectable(collectable, f)`               | 切换全场元素球显示/隐藏                          |
| `gstsServerClearAllOrbs(f)`                                 | 删除所有普通球 + 特殊球                          |
| `gstsServerRemoveRandomOrb(f)`                              | 删除随机一个球                                   |
| `gstsServerSpawnOrbEnemyAttack(triggerEntity, f)`           | 从球位置发射追踪弹 → player(1)                   |

**安全位置预计算**（模块作用域）：

```
网格: [-10, -7, -4, -1, 2, 5, 8] × [-10, -7, -4, -1, 2, 5, 8]
排除: 距玩家出生 < 3 或距任一敌人槽位 < 3
结果: ~44 个安全位置
```

**运行时随机池**：

```
BuildOrbPool: dict['0']=true, dict['1']=true, ... dict['N-1']=true
CreateOrbAtSafePos:
  1. keys = Object.keys(orbPool) → list
  2. randIdx = f.getRandomInteger(0, keys.length-1)
  3. selectedKey = keys[randIdx]
  4. delete orbPool[selectedKey]
  5. position = safeOrbXs[selectedKey], safeOrbZs[selectedKey]
```

**深渊球/追踪攻击**：

- 元素球 5 秒后自动变为不可拾取（深渊球）
- 触碰不可拾取的球或敌方触碰球 → `gstsServerSpawnOrbEnemyAttack` → 产生追踪弹
- 使用道具 Purify → `gstsServerSetOrbCollectable(true)` + 5s 倒计时 → 恢复可拾取

---

## 5. Graph 事件流程

### 5.1 完整关卡时序

```
[场景加载] scanTagReady.ts
  └── whenOnHitDetectionIsTriggered → scanTagReady=true → send(StageReady)

[StageReady] stageMain.ts
  ├── BGM 设置 (ID 10075, 循环)
  ├── send(PreFightPreparation)

[PreFightPreparation] stageMain.ts
  ├── Hide ResetButton/RuleButton/StageTimer
  ├── Stop StageTimer
  ├── currentStage += 1
  ├── gstsServerCreateStage(currentStage)
  │     ├── gstsServerInitializeStageVariables
  │     │     ├── 所有 stage 变量重置
  │     │     ├── 读取 permanentOrbs/infiniteTime 等配置
  │     │     ├── f.set('infiniteTime', ...)
  │     │     ├── 更新元素图标
  │     │     ├── gstsServerBuildOrbPool
  │     │     └── gstsServerSetESkillIcon(0)
  │     ├── 清敌人/球
  │     ├── finiteLoop: 生成 orbCount 个普通球
  │     └── finiteLoop: 生成 orbSPCount 个特殊球
  │
  ├── skipCardSelector 判断
  │     ├── false → gstsServerShowDeckSelector(fixedCard, f)
  │     │     └── [选卡完成] playerMain.ts → 设置 cardEffect → 传送
  │     └── true → 直接传送

[PlayerTeleportComplete] playerMain.ts
  ├── teleportFrom === 0 → send(EnterBattleStage)
  └── teleportFrom !== 0 → send(PreFightPreparation)

[EnterBattleStage] stageMain.ts
  ├── 0 复活次数 + 禁止复活
  ├── if (!infiniteTime) → 显示 StageTimer UI + startGlobalTimer
  ├── 显示 ResetButton + RuleButton
  └── gstsServerStartStageIntervalTimer(f)
        ├── 防掉落 setInterval (1s)
        └── 主循环 setInterval (1s)
              ├── 挑战状态检查
              ├── 超时检测
              ├── 角色倒下检测
              ├── 胜利条件: enemyCount===0 && orbsCollected>=orbsRequired
              ├── 死锁检测 → 弹确认窗
              ├── 可拾取倒计时(5s)
              └── 敌人生成(10s)
```

### 5.2 道具使用流程

```
[客户端] 按 E 键 → send(ClientSignal, SignalName='AddSPStatus', OwnerEntity=...)

[stageMain.ts] ClientSignal('AddSPStatus')
  ├── cardEffect = stage.get('cardEffect')
  ├── if (cardEffect === CardPurify)
  │     ├── sendNotification('使用了【净化】道具')
  │     └── gstsServerSetOrbCollectable(true) + 5s timeout
  └── else
        ├── gstsServerApplyBuffEffect(cardEffect→element, ownerEntity)
        └── sendNotification('使用了【xxx】道具')
```

### 5.3 元素球拾取流程

```
[getOrb.ts] whenEnteringCollisionTrigger
  ├── 敌方阵营 → gstsServerSpawnOrbEnemyAttack(追踪弹)
  └── 玩家阵营
        ├── orbsCollectable? → No → 追踪弹
        ├── 基础元素 (elemType 1~4)
        │     ├── orbsCollected += 1, score += 30
        │     ├── subElement = mainElement
        │     ├── mainElement = element
        │     └── 更新图标
        └── 特殊元素 (elemType 5~8)
              ├── gstsServerApplyBuffEffect(element, player)
              └── sendNotification
```

### 5.4 元素攻击 + 反应流程

```
[客户端] 攻击 → send(ClientSignal, SignalName='ElementAttack', Location, Rotate)

[stageMain.ts] ClientSignal('ElementAttack')
  └── f.createProjectile(elementAttackPrefabIdValue, loc, rot, ...)

[elementAttack.ts] whenOnHitDetectionIsTriggered
  ├── Step 1: 副元素附着 (dmg=0, 立即)
  ├── Step 2: 主元素攻击 (dmg=1, 10ms)
  │     └── 有副元素 → 设置反应名+颜色
  └── Step 3: 清除发射源 (500ms)
```

### 5.5 重置/死锁流程

```
[手动重置] ResetButton → ShowFloatingInteractionPage(Type=2)
  ├── 确认 → gstsServerRestartStage(f)
  └── 取消 → 无操作

[自动死锁检测] 主循环中 gstsServerCheckDeadlock()
  ├── true → ShowFloatingInteractionPage(Type=1)
  │     ├── 确认 → gstsServerRestartStage(f)
  │     └── 取消 → gstsServerCheckDeadlock() 检查
  │           └── 仍死锁 → 再次弹窗
  └── false → 正常进行
```

### 5.6 确认弹窗类型

| Type | 文本                                     |
| ---- | ---------------------------------------- |
| 1    | 元素球不足且无法继续前进，是否重置本关？ |
| 2    | 是否重置本关？                           |

---

## 6. 与 main 分支的关键新增功能清单

| #   | 功能                      | 涉及文件                                                         |
| --- | ------------------------- | ---------------------------------------------------------------- |
| 1   | **模块化架构**            | 全部文件：7 个目录、29 个文件                                    |
| 2   | **deriveConfig 类型系统** | `types/config.ts` — 自动类型推断、展平、segments                 |
| 3   | **声明式 9 关配置**       | `config/battleStageConfig.ts` — 逐关 goal/tips/slots/道具/特殊球 |
| 4   | **道具系统**              | `systems/cardSystem.ts` — 5 种道具、选择器、E 技能图标           |
| 5   | **特殊元素球**            | `systems/orbSystem.ts` — 风(+30s)/岩(护盾)/草(回血)/光(全灭)     |
| 6   | **深渊球 + 净化**         | `systems/orbSystem.ts` — 超时变深渊、追踪攻击、净化恢复          |
| 7   | **运行时随机池**          | `systems/orbSystem.ts` — dict 图变量 orbPool，不重复             |
| 8   | **安全位置网格**          | `systems/orbSystem.ts` — 预计算 ~44 安全位，排除玩家/敌人        |
| 9   | **规则文本 + UI**         | `config/ruleText.ts` + `graphs/playerMain.ts` — 规则按钮/页面    |
| 10  | **重置关卡**              | `systems/stageFlow.ts` — ResetButton + 确认弹窗                  |
| 11  | **死锁检测**              | `systems/stageFlow.ts` — 无敌人+无净化+球不足 → 弹窗             |
| 12  | **无限时间**              | `config/battleStageConfig.ts` + `graphs/stageMain.ts`            |
| 13  | **fmt() 富文本**          | `config/battleStageConfig.ts` — 自动【】着色 + \n 转义           |
| 14  | **消息队列**              | `utils/stageUtils.ts` — 道具/反应通知                            |
| 15  | **信号 enum**             | `resources/signals.ts` — 7 个定义信号                            |
| 16  | **扫描标签就绪**          | `graphs/scanTagReady.ts` — 场景就绪判定                          |
| 17  | **防掉落检测**            | `systems/enemySystem.ts` — Y<2.5 回拉                            |
| 18  | **敌方追踪攻击**          | `systems/orbSystem.ts` — 触碰深渊球产生追踪弹                    |
| 19  | **双段攻击+反应**         | `graphs/elementAttack.ts` — 先附着后伤害                         |
| 20  | **中文注释+术语**         | 全部文件 — 统一的"关卡/道具/元素战技"等                          |
