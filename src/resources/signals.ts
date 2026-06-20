// @gsts:signals

import { defineSignal } from 'genshin-ts/runtime/core'

export const Signal = {
  ClientSignal: defineSignal('ClientSignal', [
    ['SignalName', 'str'],
    ['Location', 'vec3'],
    ['Rotate', 'vec3'],
    ['OwnerEntity', 'entity'],
    ['OwnerPlayer', 'entity']
  ]),
  EnterBattleStage: defineSignal('EnterBattleStage', []),
  PreFightPreparation: defineSignal('PreFightPreparation', []),
  ShowFloatingInteractionPage: defineSignal('ShowFloatingInteractionPage', [
    ['Index', 'int'],
    ['Type', 'int']
  ]),
  SpawnEnemyWave: defineSignal('SpawnEnemyWave', []),
  StageReady: defineSignal('StageReady', []),
  UpdateNotificationMsgList: defineSignal('UpdateNotificationMsgList', [
    ['Entity', 'entity'],
    ['NotificationQueueIndex', 'int'],
    ['NotificationItemId', 'int'],
    ['Msg', 'str']
  ])
} as const
