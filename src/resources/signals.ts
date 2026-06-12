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
  ShowFloatingInteractionPage: defineSignal('ShowFloatingInteractionPage', [['Index', 'int']]),
  SpawnEnemyWave: defineSignal('SpawnEnemyWave', []),
  StageReady: defineSignal('StageReady', [])
} as const
