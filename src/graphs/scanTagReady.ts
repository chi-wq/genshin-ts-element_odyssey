import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../resources/signals'

// === ScanTagReady - 扫描标签检测场景就绪 ===
// 在编辑器中配置了扫描标签，当扫描检测到目标（场景UI已就绪）时，
// 触发 whenOnHitDetectionIsTriggered 事件，发送 StageReady 信号
g.server({
  id: 1073741856,
  name: 'ScanTagReady'
}).on('whenOnHitDetectionIsTriggered', (evt, _f) => {
  const inited = stage.get('inited').asType('bool')
  const characterReady = stage.get('CharacterReady').asType('bool')
  const scanTagReady = stage.get('ScanTagReady').asType('bool')
  const currentStage = stage.get('currentStage').asType('int')
  if (inited && currentStage === int(0) && characterReady && !scanTagReady) {
    stage.set('scanTagReady', true)
    print(str('扫描标签命中，场景UI已就绪'))
    send(Signal.StageReady)
  }
})
