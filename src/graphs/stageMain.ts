import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'

import { battleStageConfig } from '../config/battleStageConfig'
import {
  CardClearEnemies,
  CardHeal,
  CardPurify,
  CardShield,
  CardTime,
  confirmConfig,
  elementAttackPrefabIdValue,
  factionEnemy,
  InitTimer,
  maxStageIdx,
  NotificationItemId,
  NotificationQueueIndex,
  PlayerSpawnPos,
  PlayerSpawnRot,
  ResetButton,
  RuleButton,
  StageTimer
} from '../config/constants'
import { Signal } from '../resources/signals'
import {
  gstsServerCardEffectToElement,
  gstsServerCardEffectToIcon,
  gstsServerSetESkillIcon,
  gstsServerShowDeckSelector
} from '../systems/cardSystem'
import { gstsServerApplyBuffEffect } from '../systems/elementSystem'
import { gstsServerHandleEnemyKill, gstsServerSpawnEnemyWave } from '../systems/enemySystem'
import { gstsServerSetOrbCollectable } from '../systems/orbSystem'
import {
  gstsServerCreateStage,
  gstsServerSettleSuccessStatus,
  gstsServerStartStageIntervalTimer,
  gstsServerWaitForPlayerReady
} from '../systems/stageFlow'
import { gstsServerGetListValue, gstsServerSendNotificationMsg } from '../utils/stageUtils'

// === StageMain - 关卡主控制 ===
g.server({
  id: 1073741854,
  name: 'StageMain',
  variables: {
    challengeState: int(0),
    infiniteTime: bool(false),
    orbPool: dict('int', 'bool', null)
  }
})
  .on('whenEntityIsCreated', (_evt, f) => {
    gstsServerWaitForPlayerReady(f as unknown as ServerExecutionFlowFunctions)
  })
  .on('whenGlobalTimerIsTriggered', (evt, f) => {
    print(str('计时器触发'))
    if (evt.timerName === 'InitTimer') {
      print(str('初始化计时器匹配！正在传送玩家...'))
      const player1 = player(1)
      f.stopGlobalTimer(stage, 'InitTimer')
      f.modifyUiControlStatusWithinTheInterfaceLayout(player1, InitTimer, UIControlGroupStatus.Off)
      stage.set('teleportFrom', int(0))
      f.teleportPlayer(player1, PlayerSpawnPos, PlayerSpawnRot)
    } else if (evt.timerName === 'StageTimer') {
      print(str('关卡计时器匹配！'))
      print(str('挑战失败：超时'))
      stage.set('stageTimerActive', false)
      f.set('challengeState', int(2), true)
      gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions)
    }
  })
  .onSignal(Signal.StageReady, (_evt, f) => {
    print(str('收到场景准备完成信号！'))
    print(str('场景初始化中...'))
    const player1 = player(1)
    f.modifyPlayerBackgroundMusic(
      player1,
      int(10075),
      float(0),
      float(999),
      int(100),
      true,
      float(0),
      float(1),
      true
    )
    f.startPausePlayerBackgroundMusic(player1, true)
    send(Signal.PreFightPreparation)
  })
  .onSignal(Signal.SpawnEnemyWave, (_evt, f) => {
    print(str('收到敌人波次生成信号！正在生成敌人波次...'))
    const enemyCount = stage.get('enemyCount').asType('int')
    const orbsCollected = stage.get('orbsCollected').asType('int')
    const orbsRequired = stage.get('orbsRequired').asType('int')
    if (
      enemyCount < stage.get('maxEnemies').asType('int') &&
      (orbsRequired === int(0) || orbsCollected < orbsRequired)
    ) {
      const currentStage = stage.get('currentStage').asType('int')
      gstsServerSpawnEnemyWave(currentStage, f as unknown as ServerExecutionFlowFunctions)
    }
  })
  .onSignal(Signal.EnterBattleStage, (_evt, f) => {
    const infiniteTime = f.get('infiniteTime') as unknown as boolean
    print(str('收到玩家入场信号！启动关卡计时器...'))
    f.setPlayerRemainingRevives(player(1), int(0))
    f.allowForbidPlayerToRevive(player(1), false)
    if (!infiniteTime) {
      f.modifyUiControlStatusWithinTheInterfaceLayout(
        player(1),
        StageTimer,
        UIControlGroupStatus.On
      )
      f.startGlobalTimer(stage, 'StageTimer')
      stage.set('stageTimerActive', true)
    }
    // 显示手动重置按钮和游戏规则说明按钮
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), ResetButton, UIControlGroupStatus.On)
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), RuleButton, UIControlGroupStatus.On)
    gstsServerStartStageIntervalTimer(f as unknown as ServerExecutionFlowFunctions)
  })
  .onSignal(Signal.PreFightPreparation, (_evt, f) => {
    print(str('收到玩家退场信号！停止关卡计时器...'))
    // 隐藏手动重置按钮和游戏规则说明按钮
    f.modifyUiControlStatusWithinTheInterfaceLayout(
      player(1),
      ResetButton,
      UIControlGroupStatus.Off
    )
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), RuleButton, UIControlGroupStatus.Off)
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.Off)
    f.stopGlobalTimer(stage, 'StageTimer')
    const currentStage = stage.get('currentStage').asType('int') + int(1)
    stage.set('currentStage', currentStage)
    gstsServerCreateStage(currentStage, f as unknown as ServerExecutionFlowFunctions)
    // 判断是否跳过卡牌选择器（第1关教学不需要选卡）
    const skipCard = gstsServerGetListValue(
      battleStageConfig.skipCardSelector,
      currentStage,
      maxStageIdx,
      'int',
      f
    ) as unknown as bigint
    if (skipCard === int(0)) {
      const fixedCard = gstsServerGetListValue(
        battleStageConfig.fixedCard,
        currentStage,
        maxStageIdx,
        'int',
        f
      ) as unknown as bigint
      gstsServerShowDeckSelector(fixedCard, f as unknown as ServerExecutionFlowFunctions)
    } else {
      // 跳过选卡，直接传送（扫描标签已确保场景就绪）
      print(str('跳过卡牌选择器，直接传送'))
      stage.set('teleportFrom', int(0))
      f.teleportPlayer(player(1), PlayerSpawnPos, PlayerSpawnRot)
    }
  })
  .on('whenEntityIsDestroyed', (evt, f) => {
    const faction = evt.faction as unknown as number
    if (faction === factionEnemy) {
      // 跳过关卡切换时清理旧敌人导致的误触发（challengeState不为0表示非战斗中）
      const state = f.get('challengeState') as unknown as bigint
      if (state === int(0)) {
        gstsServerHandleEnemyKill(f as unknown as ServerExecutionFlowFunctions)
      }
    }
  })
  .onSignal(Signal.ClientSignal, (evt, f) => {
    if (evt.params.SignalName === 'ElementAttack') {
      print(str('收到元素攻击服务器信号！'))
      const loc = evt.params.Location
      const rot = evt.params.Rotate

      const elementAttack = f.createProjectile(
        elementAttackPrefabIdValue,
        loc,
        rot,
        entity(0),
        entity(0),
        false,
        int(1),
        [] as bigint[]
      )

      const ti = setTimeout(() => {
        print(str('元素攻击超时，清理中'))
        f.removeEntity(elementAttack)
        clearTimeout(ti)
      }, 3000)
    } else if (evt.params.SignalName === 'AddSPStatus') {
      const cardEffect = stage.get('cardEffect').asType('int')
      if (cardEffect === int(0)) {
        print(str('无卡牌效果可发动'))
        gstsServerSendNotificationMsg('无道具可用')
        return
      }
      stage.set('cardEffect', int(0))
      gstsServerSetESkillIcon(int(0))
      if (cardEffect === CardPurify) {
        gstsServerSendNotificationMsg('使用了【净化】道具')
        gstsServerSetOrbCollectable(true, f as unknown as ServerExecutionFlowFunctions)
        stage.set('collectableTimeout', int(5))
      } else {
        gstsServerApplyBuffEffect(
          gstsServerCardEffectToElement(cardEffect),
          evt.params.OwnerEntity as unknown as ReturnType<typeof entity>,
          f as unknown as ServerExecutionFlowFunctions
        )
        if (cardEffect === CardHeal) {
          gstsServerSendNotificationMsg('使用了【生命回复】道具')
        } else if (cardEffect === CardShield) {
          gstsServerSendNotificationMsg('使用了【护盾】道具')
        } else if (cardEffect === CardTime) {
          gstsServerSendNotificationMsg('使用了【增加时间】道具')
        } else if (cardEffect === CardClearEnemies) {
          gstsServerSendNotificationMsg('使用了【敌人全灭】道具')
        } else {
          gstsServerSendNotificationMsg('使用了未知道具')
        }
      }
    }
  })
  .onSignal(Signal.ShowFloatingInteractionPage, (evt, f) => {
    print(str('收到信号，唤起悬浮交互页...'))
    print(str('页面索引:'))
    console.log(evt.params.Index)
    print(str('页面类型:'))
    console.log(evt.params.Type)
    // 用 Type 值直接索引文本数组，无需 if-else 分支
    stage.set(
      'ConfirmText',
      gstsServerGetListValue(confirmConfig.text, evt.params.Type, confirmConfig.maxIdx, 'str', f)
    )
    stage.set(
      'ConfirmOKText',
      gstsServerGetListValue(confirmConfig.okText, evt.params.Type, confirmConfig.maxIdx, 'str', f)
    )
    stage.set(
      'ConfirmNGText',
      gstsServerGetListValue(confirmConfig.ngText, evt.params.Type, confirmConfig.maxIdx, 'str', f)
    )
    f.showFloatingInteractionPage(player(1), evt.params.Index, dict('int', 'int_list', null))
    print(str('showFloatingInteractionPage 已调用'))
  })
  .on('whenAllPlayerSCharactersAreDown', (_evt, f) => {
    print(str('玩家全部角色倒下！失败结算...'))
    gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions)
  })
