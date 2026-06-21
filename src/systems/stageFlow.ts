import {
  DecisionRefreshMode,
  EntityType,
  SettlementStatus,
  UIControlGroupStatus
} from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes' // 服务器执行流函数

import { battleStageConfig } from '../config/battleStageConfig'
import {
  CardPurify,
  confirmConfig,
  ConfirmPageIndex,
  maxStage,
  maxStageIdx,
  ORB_SPAWN_Y,
  PlayerSpawnPos2,
  PlayerSpawnRot2,
  StageTimer
} from '../config/constants'
import { Signal } from '../resources/signals'
import { debugLog, debugLogValue } from '../utils/logger'
import { gstsServerGetListValue } from '../utils/stageUtils'
import { gstsServerSetESkillIcon } from './cardSystem'
import { gstsServerUpdateElementIcons } from './elementSystem'
import { gstsServerCheckFallenEnemies, gstsServerClearAllEnemies } from './enemySystem'
import {
  gstsServerBuildOrbPool,
  gstsServerClearAllOrbs,
  gstsServerCreateOrbAtRandomPos,
  gstsServerCreateSpecialOrbAtRandomPos,
  gstsServerSetOrbCollectable
} from './orbSystem'

// 设置结算状态（胜利或失败）
export function gstsServerSettleSuccessStatus(
  challengeState: bigint,
  f: ServerExecutionFlowFunctions
) {
  if (challengeState !== int(0)) {
    // 如果挑战状态不为0
    const player1 = player(1) // 获取玩家1
    // 删除所有元素球
    gstsServerClearAllOrbs(f)
    // 停止全局计时器并隐藏UI
    f.stopGlobalTimer(stage, 'StageTimer') // 停止阶段计时器
    stage.set('stageTimerActive', false) // 设置阶段计时器运行标记为false
    f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // 隐藏计时器UI
    if (challengeState === int(1)) {
      // 胜利时
      f.setPlayerSettlementSuccessStatus(player1, SettlementStatus.Victory) // 设置胜利状态
    } else if (challengeState === int(2)) {
      // 失败时
      f.setPlayerSettlementSuccessStatus(player1, SettlementStatus.Defeat) // 设置失败状态
    }
    // 在结算画面显示分数
    const finalScore = stage.get('score').asType('int') // 获取最终分数
    f.setPlayerSettlementScoreboardDataDisplay(player1, int(1), str('分数'), finalScore) // 在计分板显示
    f.settleStage() // 结算场景
  }
}

// 进入下一阶段
export function gstsServerNextStage(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage !== int(0)) {
    // 如果当前阶段不为0
    const player1 = player(1) // 获取玩家1
    // 删除所有元素球
    gstsServerClearAllOrbs(f)
    // 停止全局计时器并隐藏UI
    f.stopGlobalTimer(stage, 'StageTimer') // 停止阶段计时器
    stage.set('stageTimerActive', false) // 设置阶段计时器运行标记为false
    f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // 隐藏计时器UI

    if (currentStage === maxStage) {
      // 到达最终阶段时
      debugLog('到达最终阶段，开始结算处理...')
      gstsServerSettleSuccessStatus(int(1), f as unknown as ServerExecutionFlowFunctions) // 胜利结算
    } else {
      // 还有下一阶段时
      debugLog('开始下一阶段...')
      f.set('challengeState', int(3), true) // 设置挑战状态为中断
      stage.set('teleportFrom', int(currentStage)) // 记录传送起点
      f.teleportPlayer(player1, PlayerSpawnPos2, PlayerSpawnRot2) // 传送玩家
      debugLog('玩家已传送至下一阶段')
    }
  }
}

// 初始化阶段变量
export function gstsServerInitializeStageVariables(
  currentStage: bigint,
  f: ServerExecutionFlowFunctions
) {
  stage.set('deadlockPageShown', false)
  stage.set('enemyCount', int(0)) // 初始化敌人数为0
  gstsServerSetOrbCollectable(false, f as unknown as ServerExecutionFlowFunctions)
  // 读取 permanentOrbs 配置：如果为 true，元素球永久可见可拾取
  const permanentOrbs = gstsServerGetListValue(
    battleStageConfig.permanentOrbs,
    currentStage,
    maxStageIdx,
    'int',
    f
  ) as unknown as bigint
  stage.set('permanentOrbs', permanentOrbs === int(1))
  if (permanentOrbs === int(1)) {
    gstsServerSetOrbCollectable(true, f as unknown as ServerExecutionFlowFunctions)
  }
  stage.set('collectableTimeout', int(0)) // 初始化拾取超时为0
  stage.set('orbsCollected', int(0)) // 初始化已收集元素球数为0
  stage.set('spawnTimer', int(0)) // 初始化生成计时器为0
  // 分数跨阶段累积，不重置
  stage.set('reaction', str('')) // 初始化元素反应名为空字符串
  stage.set('reactionColor', str('')) // 初始化元素反应颜色为空字符串
  stage.set('reactionMsg', str('')) // 初始化元素反应消息为空字符串
  stage.set('reactionMsgColor', str('')) // 初始化元素反应消息颜色为空字符串
  stage.set('stageTimerActive', false) // 初始化阶段计时器运行标记为false
  // 主/副元素跨阶段继承（不随机重置），更新UI图标
  const existingMain = stage.get('mainElement').asType('int')
  const existingSub = stage.get('subElement').asType('int')
  gstsServerUpdateElementIcons(existingMain, true, f)
  gstsServerUpdateElementIcons(existingSub, false, f)
  f.set('challengeState', int(0), true) // 设置挑战状态为进行中
  // 从 battleStageConfig 获取各阶段配置值
  stage.set(
    'maxEnemies',
    gstsServerGetListValue(battleStageConfig.maxEnemies, currentStage, maxStageIdx, 'int', f)
  )
  stage.set(
    'orbsRequired',
    gstsServerGetListValue(battleStageConfig.orbsRequired, currentStage, maxStageIdx, 'int', f)
  )
  stage.set(
    'orbCount',
    gstsServerGetListValue(battleStageConfig.orbCount, currentStage, maxStageIdx, 'int', f)
  )
  stage.set(
    'goal',
    gstsServerGetListValue(battleStageConfig.goal, currentStage, maxStageIdx, 'str', f)
  )
  stage.set(
    'tips',
    gstsServerGetListValue(battleStageConfig.tips, currentStage, maxStageIdx, 'str', f)
  )
  stage.set('maxStage', maxStage) // 存储最大阶段数
  stage.set('cardEffect', int(0)) // 初始化卡牌效果为无
  // 重建运行时索引字典，每阶段初重置确保不重复
  gstsServerBuildOrbPool(f as unknown as ServerExecutionFlowFunctions)
  gstsServerSetESkillIcon(int(0)) // 清除E技能图标
}

// 创建阶段
export function gstsServerCreateStage(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage !== int(0)) {
    // 如果当前阶段不为0
    // 初始化阶段变量（根据阶段设置难度）
    gstsServerInitializeStageVariables(currentStage, f)

    // 敌人全灭
    gstsServerClearAllEnemies(f)

    // 删除所有元素球
    gstsServerClearAllOrbs(f)

    // 在随机位置生成元素球（数量由 orbCount 决定）
    f.finiteLoop(int(0), stage.get('orbCount').asType('int') - int(1), () => {
      gstsServerCreateOrbAtRandomPos(ORB_SPAWN_Y, f as unknown as ServerExecutionFlowFunctions) // 生成1个元素球
    })

    // 生成特殊元素球（风/岩/草/光）
    const orbSPCount = gstsServerGetListValue(
      battleStageConfig.orbSPCount,
      currentStage,
      maxStageIdx,
      'int',
      f
    ) as unknown as bigint
    const fixedSpecialOrb = gstsServerGetListValue(
      battleStageConfig.fixedSpecialOrb,
      currentStage,
      maxStageIdx,
      'int',
      f
    ) as unknown as bigint
    if (orbSPCount > int(0)) {
      f.finiteLoop(int(0), orbSPCount - int(1), () => {
        gstsServerCreateSpecialOrbAtRandomPos(
          ORB_SPAWN_Y,
          f as unknown as ServerExecutionFlowFunctions,
          fixedSpecialOrb
        )
      })
    }
  }
  return int(0) // 返回值
}

// 死锁检测：场上无敌人 + 无法再生成敌人 (maxEnemies=0) + 无可用净化卡牌 + 球数不足
// 返回 true 表示满足死锁条件，false 表示不满足
export function gstsServerCheckDeadlock() {
  const enemyCount = stage.get('enemyCount').asType('int') // 获取敌人数
  const orbsCollected = stage.get('orbsCollected').asType('int') // 获取已收集元素球数
  const orbsRequired = stage.get('orbsRequired').asType('int') // 获取所需元素球数
  const maxEnemies = stage.get('maxEnemies').asType('int')
  const cardEffect = stage.get('cardEffect').asType('int')
  const canPickup = stage.get('orbsCollectable').asType('bool')
  const hasPurify = cardEffect === CardPurify
  let result = false
  if (
    enemyCount === int(0) &&
    maxEnemies === int(0) &&
    orbsCollected < orbsRequired &&
    !canPickup &&
    !hasPurify
  ) {
    result = true
  }
  return result
}

// 战斗计时开始
export function gstsServerStartStageIntervalTimer(f: ServerExecutionFlowFunctions) {
  // 初始生成一波敌人
  send(Signal.SpawnEnemyWave)

  // 防掉落检测（每 1 秒检测一次，将掉到地板下的敌人拉回安全位置）
  const antiFallInterval = setInterval(() => {
    debugLog('[防掉落] 定时器触发')
    const challengeState = f.get('challengeState') as unknown as bigint
    if (challengeState === int(2) || challengeState === int(1) || challengeState === int(3)) {
      debugLog('[防掉落] 挑战结束，清除定时器')
      clearInterval(antiFallInterval)
    } else {
      debugLog('[防掉落] 挑战进行中，调用检测...')
      gstsServerCheckFallenEnemies(f)
    }
  }, 1000)

  // 阶段计时器（每秒执行，也负责敌人生成）
  const stageTimerInterval = setInterval(() => {
    debugLog('阶段计时器执行')
    const challengeState = f.get('challengeState') as unknown as bigint // 获取挑战状态

    // 检查是否已失败
    if (challengeState === int(2)) {
      debugLog('挑战已失败，清除计时器')
      clearInterval(stageTimerInterval)
    } else if (challengeState === int(1)) {
      debugLog('挑战已成功，清除计时器')
      clearInterval(stageTimerInterval)
    } else if (challengeState === int(3)) {
      debugLog('挑战已中断，清除计时器')
      clearInterval(stageTimerInterval) // 清除计时器
    } else {
      // 进行中 - 检查阶段计时器是否失效
      const timerActive = stage.get('stageTimerActive').asType('bool') // 获取计时器运行标记
      if (timerActive) {
        // 计时器应该运行时检查剩余时间
        const timerRemaining = f.getCurrentGlobalTimerTime(stage, 'StageTimer') // 获取剩余时间
        if (timerRemaining <= float(0)) {
          // 计时器已失效（可能因断线等丢失）
          debugLog('检测到StageTimer失效！判定失败')
          f.set('challengeState', int(2), true) // 设置挑战状态为失败
          gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
          clearInterval(stageTimerInterval) // 清除计时器
        }
      }
      // 检测角色是否倒下（HP归零）
      if (f.queryIfAllPlayerCharactersAreDown(player(1))) {
        debugLog('检测到角色倒下！失败结算...')
        f.set('challengeState', int(2), true) // 设置挑战状态为失败
        gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 失败结算
        clearInterval(stageTimerInterval) // 清除计时器
      }
      // 检查条件
      const currentStage = stage.get('currentStage').asType('int') // 获取当前阶段
      const enemyCount = stage.get('enemyCount').asType('int') // 获取敌人数
      const orbsCollected = stage.get('orbsCollected').asType('int') // 获取已收集元素球数
      const orbsRequired = stage.get('orbsRequired').asType('int') // 获取所需元素球数

      // 输出调试信息
      debugLogValue('敌人数:', enemyCount)
      debugLogValue('已收集元素球数:', orbsCollected)

      // 成功条件：全灭敌人 且 已收集足够元素球
      if (enemyCount === int(0) && orbsCollected >= orbsRequired) {
        debugLog('挑战成功！')
        f.set('challengeState', int(1), true) // 设置挑战状态为成功
        gstsServerNextStage(currentStage, f as unknown as ServerExecutionFlowFunctions) // 进入下一阶段
        clearInterval(stageTimerInterval) // 清除计时器
      } else {
        // 调试：打印为何未通关
        if (enemyCount === int(0)) {
          debugLogValue('敌人已清空，球未达标', orbsCollected)
          debugLogValue('/', orbsRequired)
        }
        if (orbsCollected >= orbsRequired) {
          debugLogValue('球已达标，敌人未清空', enemyCount)
        }
        const canPickup = stage.get('orbsCollectable').asType('bool')
        // 死锁检测：无敌人 + 无新敌人可生成 + 净化卡牌不可用 + 球数不足 → 卡死状态
        if (gstsServerCheckDeadlock()) {
          // 避免重复弹窗，只处理一次
          const deadlockShown = stage.get('deadlockPageShown').asType('bool')
          if (!deadlockShown) {
            debugLog('检测到死锁（maxEnemies=0 且无净化卡牌），请求显示交互页...')
            stage.set('deadlockPageShown', true)
            send(Signal.ShowFloatingInteractionPage, ConfirmPageIndex, confirmConfig.Type1)
          }
        } else {
          let needSpawnEnemyWave = false
          const permaOrbs = stage.get('permanentOrbs').asType('bool')
          // 可拾取倒计时逻辑（永久可见的关卡跳过此逻辑）
          if (canPickup && !permaOrbs) {
            // 可拾取时
            const countdown = stage.get('collectableTimeout').asType('int') // 获取倒计时值
            if (countdown > int(0)) {
              // 倒计时中
              stage.set('collectableTimeout', countdown - int(1)) // 倒计时减1
            } else {
              // 倒计时结束
              gstsServerSetOrbCollectable(false, f as unknown as ServerExecutionFlowFunctions) // 设置为不可拾取
              if (orbsRequired === int(0) || orbsCollected < orbsRequired) {
                // 纯战斗关或未达到所需元素球数时继续生成敌人
                needSpawnEnemyWave = true
              }
            }
          }
          // 敌人生成：每10秒生成1波
          const spawnTimer = stage.get('spawnTimer').asType('int') + int(1) // 增加生成计时器
          stage.set('spawnTimer', spawnTimer) // 更新生成计时器
          if (spawnTimer >= int(10)) {
            // 已过10秒时
            stage.set('spawnTimer', int(0)) // 重置生成计时器
            if (orbsRequired === int(0) || orbsCollected < orbsRequired) {
              // 未达到所需元素球数时（或纯战斗关）
              needSpawnEnemyWave = true
            }
          }
          if (needSpawnEnemyWave === true) {
            send(Signal.SpawnEnemyWave) // 发送敌人波次生成信号
          }
        }
      }
    }
  }, 1000) // 1秒间隔
}

// 重置本关：清除元素球、重置变量、重新展示卡牌选择器
export function gstsServerRestartStage(f: ServerExecutionFlowFunctions) {
  debugLog('重置本关...')
  const currentStage = stage.get('currentStage').asType('int') - int(1)
  stage.set('isRestarting', true)
  const player1 = player(1) // 获取玩家1
  // 敌人全灭
  gstsServerClearAllEnemies(f)
  // 删除所有元素球
  gstsServerClearAllOrbs(f)
  // 停止全局计时器并隐藏UI
  f.stopGlobalTimer(stage, 'StageTimer') // 停止阶段计时器
  stage.set('stageTimerActive', false) // 设置阶段计时器运行标记为false
  f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // 隐藏计时器UI
  f.set('challengeState', int(3), true)

  stage.set('currentStage', currentStage)
  send(Signal.PreFightPreparation)
  debugLog('重置完成')
}

// 等待场景和玩家初始化完成，然后发送 StageReady 信号
// 包含轮询逻辑，当场景实体和玩家角色都就绪时触发
export function gstsServerWaitForPlayerReady(f: ServerExecutionFlowFunctions) {
  const interval = setInterval(() => {
    if (f.queryIfEntityIsOnTheField(stage)) {
      const inited = stage.get('inited').asType('bool')
      if (inited) {
        print(str('场景实体初始化完毕'))
        f.stopGlobalTimer(stage, 'InitTimer')
        f.stopGlobalTimer(stage, 'StageTimer')
        if (
          f.queryIfEntityIsOnTheField(player(1)) &&
          f.getEntityType(player(1)) === EntityType.Player
        ) {
          print(str('玩家在场景上'))
          const characters = f.getAllCharacterEntitiesOfSpecifiedPlayer(player(1))
          const charLen = f.getListLength(characters)
          if (charLen > int(0)) {
            print(str('玩家拥有的角色不为空'))
            const character = f.getCorrespondingValueFromList(characters, int(0))
            const attrs = f.getCharacterAttribute(character as unknown as ReturnType<typeof entity>)
            if (attrs.maxHp > float(0)) {
              print(str('玩家角色的属性值可以正常取得'))
              stage.set('CharacterReady', true)
              clearInterval(interval)
            }
          }
        }
      } else {
        stage.set('inited', true)
      }
    }
  }, 1000)
  return int(0)
}
