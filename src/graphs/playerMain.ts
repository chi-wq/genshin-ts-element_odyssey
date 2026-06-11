import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'

import { InitTimer } from '../config/constants'
import { Signal } from '../resources/signals'
import { gstsServerCardEffectToIcon, gstsServerSetESkillIcon } from '../systems/cardSystem'
import { gstsServerSettleSuccessStatus } from '../systems/stageFlow'

// === PlayerMain - 玩家主控制 ===
g.server({
  id: 1073741837,
  name: 'PlayerMain'
})
  .on('whenPlayerTeleportCompletes', (evt, f) => {
    print(str('玩家传送完成！'))
    f.allowForbidPlayerToRevive(player(1), false)
    f.setPlayerRemainingRevives(player(1), int(0))
    const fromArea = stage.get('teleportFrom').asType('int')
    if (fromArea === int(0)) {
      send(Signal.EnterBattleStage)
    } else {
      send(Signal.PreFightPreparation)
    }
  })
  .on('whenDeckSelectorIsComplete', (evt, f) => {
    // ★ 注意：evt.selectionResultList 在 gsts 编译时会被推断为 entity list，
    //   导致 f.getCorrespondingValueFromList 返回 entity 类型的引脚。
    //   此时若直接与 int 常量（如 CardHeal）比较，会因类型不匹配编译失败。
    //   解决方案：对 result 和 selectedCard 都加上 as unknown as bigint（或 bigint[]）
    //   强制覆盖 TypeScript 类型 → 编译器 getTypeAtLocation 正确识别为 bigint，
    //   进而生成 initLocalVariable("int")，避免 entity 与 int 冲突。
    //   result 的转换确保列表元素类型为 int；selectedCard 的转换是双重保险。
    const result = evt.selectionResultList as unknown as bigint[]
    const selectedCard = f.getCorrespondingValueFromList(result, int(0)) as unknown as bigint
    stage.set('cardEffect', selectedCard)
    gstsServerSetESkillIcon(gstsServerCardEffectToIcon(selectedCard))
    print(str('卡牌选择器确认！启动初始化计时器...'))
    print(str('正在显示UI控件...'))
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), InitTimer, UIControlGroupStatus.On)
    f.startGlobalTimer(stage, 'InitTimer')
    print(str('初始化计时器已启动，等待倒计时...'))
  })
  .on('whenTheCharacterIsDown', (_evt, f) => {
    print(str('角色倒下！阻止复苏，失败结算...'))
    f.setPlayerRemainingRevives(player(1), int(0))
    f.allowForbidPlayerToRevive(player(1), false)
    gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions)
  })
