import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'

import { battleStageConfig } from '../config/battleStageConfig'
import {
  CardPurify,
  elementAttackPrefabIdValue,
  factionEnemy,
  InitTimer,
  maxStageIdx,
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
import { gstsServerGetListValue } from '../utils/stageUtils'

// === StageMain - 阶段主控制 ===
g.server({
  id: 1073741854,
  name: 'StageMain',
  variables: {
    challengeState: int(0)
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
      f.teleportPlayer(player1, vec3([10.49, 3.48, 2.97]), vec3([0, -99.36, 0]))
    } else if (evt.timerName === 'StageTimer') {
      print(str('阶段计时器匹配！'))
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
    if (enemyCount < stage.get('maxEnemies').asType('int') && orbsCollected < orbsRequired) {
      const currentStage = stage.get('currentStage').asType('int')
      gstsServerSpawnEnemyWave(currentStage, f as unknown as ServerExecutionFlowFunctions)
    }
  })
  .onSignal(Signal.EnterBattleStage, (_evt, f) => {
    print(str('收到玩家入场信号！启动阶段计时器...'))
    f.setPlayerRemainingRevives(player(1), int(0))
    f.allowForbidPlayerToRevive(player(1), false)
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.On)
    f.startGlobalTimer(stage, 'StageTimer')
    stage.set('stageTimerActive', true)
    gstsServerStartStageIntervalTimer(f as unknown as ServerExecutionFlowFunctions)
  })
  .onSignal(Signal.PreFightPreparation, (_evt, f) => {
    print(str('收到玩家退场信号！停止阶段计时器...'))
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.Off)
    f.stopGlobalTimer(stage, 'StageTimer')
    const currentStage = stage.get('currentStage').asType('int') + int(1)
    stage.set('currentStage', currentStage)
    gstsServerCreateStage(currentStage, f as unknown as ServerExecutionFlowFunctions)
    const fixedCard = gstsServerGetListValue(
      battleStageConfig.fixedCard,
      currentStage,
      maxStageIdx,
      'int',
      f
    ) as unknown as bigint
    gstsServerShowDeckSelector(fixedCard, f as unknown as ServerExecutionFlowFunctions)
  })
  .on('whenEntityIsDestroyed', (evt, f) => {
    const faction = evt.faction as unknown as number
    if (faction === factionEnemy) {
      gstsServerHandleEnemyKill(f as unknown as ServerExecutionFlowFunctions)
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
        return
      }
      stage.set('cardEffect', int(0))
      gstsServerSetESkillIcon(int(0))
      if (cardEffect === CardPurify) {
        gstsServerSetOrbCollectable(true, f as unknown as ServerExecutionFlowFunctions)
        stage.set('collectableTimeout', int(5))
      } else {
        gstsServerApplyBuffEffect(
          gstsServerCardEffectToElement(cardEffect),
          evt.params.OwnerEntity as unknown as ReturnType<typeof entity>,
          f as unknown as ServerExecutionFlowFunctions
        )
      }
    }
  })
  .on('whenAllPlayerSCharactersAreDown', (_evt, f) => {
    print(str('玩家全部角色倒下！失败结算...'))
    gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions)
  })
