import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'

import {
  gstsServerElementAttack,
  gstsServerGetReactionColor,
  gstsServerGetReactionName
} from '../systems/elementSystem'

// === ElementAttack - 投射物命中时的攻击执行 ===
g.server({
  id: 1073741853,
  name: 'ElementAttack'
}).on('whenOnHitDetectionIsTriggered', (evt, f) => {
  const sourceEntity = evt.eventSourceEntity as unknown as ReturnType<typeof entity>
  const hitEntity = evt.onHitEntity as unknown as ReturnType<typeof entity>
  const hitLocation = evt.onHitLocation
  print(str('检测到投射物命中！开始攻击...'))
  const rot = stage.get('ElementAttRotate').asType('vec3')
  const mainElem = stage.get('mainElement').asType('int')
  const subElem = stage.get('subElement').asType('int')

  if (subElem !== int(0) && subElem !== mainElem) {
    gstsServerElementAttack(
      subElem,
      hitEntity as unknown as ReturnType<typeof entity>,
      hitLocation,
      rot,
      sourceEntity,
      f as unknown as ServerExecutionFlowFunctions,
      float(0)
    )
  }

  const tMain = setTimeout(() => {
    gstsServerElementAttack(
      mainElem,
      hitEntity as unknown as ReturnType<typeof entity>,
      hitLocation,
      rot,
      sourceEntity,
      f as unknown as ServerExecutionFlowFunctions,
      float(1)
    )
    if (subElem !== int(0) && subElem !== mainElem) {
      let reactionName = gstsServerGetReactionName(
        mainElem,
        subElem,
        f as unknown as ServerExecutionFlowFunctions
      )
      let reactionColor = gstsServerGetReactionColor(
        mainElem,
        subElem,
        f as unknown as ServerExecutionFlowFunctions
      )
      stage.set('reaction', reactionName)
      stage.set('reactionColor', reactionColor)
      print(reactionName)
    }
    clearTimeout(tMain)
  }, 10)

  const ti = setTimeout(() => {
    f.removeEntity(sourceEntity)
    clearTimeout(ti)
  }, 500)
})
