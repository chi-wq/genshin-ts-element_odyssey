import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'

// === EnemyElementAttack - 敌方投射物命中时的攻击执行 ===
g.server({
  id: 1073741855,
  name: 'EnemyElementAttack'
}).on('whenOnHitDetectionIsTriggered', (evt, f) => {
  const sourceEntity = evt.eventSourceEntity as unknown as ReturnType<typeof entity>
  const hitEntity = evt.onHitEntity as unknown as ReturnType<typeof entity>
  const hitLocation = evt.onHitLocation
  print(str('敌方攻击命中！'))
  f.removeEntity(sourceEntity)
})
