import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'

import {
  Anemo,
  Dendro,
  enemyElementAttackPrefabIdValue,
  factionEnemy,
  Geo,
  Light
} from '../config/constants'
import { gstsServerApplyBuffEffect, gstsServerUpdateElementIcons } from '../systems/elementSystem'
import { gstsServerSpawnOrbEnemyAttack } from '../systems/orbSystem'
import { gstsServerSendNotificationMsg } from '../utils/stageUtils'

// === GetOrb - 元素球获取处理 ===
g.server({
  id: 1073741829,
  name: 'GetOrb'
}).on('whenEnteringCollisionTrigger', (evt, f) => {
  print(str('实体进入碰撞触发器'))
  const enteringEntity = evt.enteringEntity
  const triggerEntity = evt.triggerEntity
  const faction = enteringEntity.faction() as unknown as number
  const element = triggerEntity.getCustomVariable('element').asType('int')

  if (faction === factionEnemy) {
    gstsServerSpawnOrbEnemyAttack(
      triggerEntity as unknown as ReturnType<typeof entity>,
      f as unknown as ServerExecutionFlowFunctions
    )
    print(str('敌人接触元素球，生成敌方攻击！'))
    return
  } else {
    if (!stage.get('orbsCollectable').asType('bool')) {
      gstsServerSpawnOrbEnemyAttack(
        triggerEntity as unknown as ReturnType<typeof entity>,
        f as unknown as ServerExecutionFlowFunctions
      )
      print(str('触碰不可拾取元素球，生成敌方攻击！'))
      return
    }

    if (element < 5) {
      stage.set('orbsCollected', stage.get('orbsCollected').asType('int') + int(1))
      stage.set('score', stage.get('score').asType('int') + int(30))
      print(str('收集元素球！+30分'))

      const prevMain = stage.get('mainElement').asType('int')
      stage.set('subElement', prevMain)
      stage.set('mainElement', element)
      gstsServerUpdateElementIcons(element, true, f as unknown as ServerExecutionFlowFunctions)
      gstsServerUpdateElementIcons(prevMain, false, f as unknown as ServerExecutionFlowFunctions)
    } else {
      print(str('收集特殊元素球'))
      if (element === Anemo) {
        gstsServerSendNotificationMsg('获得特殊效果：增加时间')
      } else if (element === Geo) {
        gstsServerSendNotificationMsg('获得特殊效果：获得护盾')
      } else if (element === Dendro) {
        gstsServerSendNotificationMsg('获得特殊效果：恢复生命')
      } else if (element === Light) {
        gstsServerSendNotificationMsg('获得特殊效果：全灭敌人')
      }
      gstsServerApplyBuffEffect(
        element,
        enteringEntity as unknown as ReturnType<typeof entity>,
        f as unknown as ServerExecutionFlowFunctions
      )
    }
  }

  triggerEntity.activateDisableCollisionTrigger(evt.triggerId, false)
  triggerEntity.activateDisablePathfindingObstacleFeature(true)
  triggerEntity.destroy()
  triggerEntity.remove()
})
