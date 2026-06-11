import { DecisionRefreshMode } from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes'

import {
  Anemo,
  CardClearEnemies,
  CardClearEnemiesIcon,
  CardHeal,
  CardHealIcon,
  CardPurify,
  CardPurifyIcon,
  CardShield,
  CardShieldIcon,
  CardTime,
  CardTimeIcon,
  DeckSelectorDuration,
  DeckSelectorIndex,
  DeckSelectorSelectMax,
  DeckSelectorSelectMin,
  Dendro,
  Geo,
  Light
} from '../config/constants'

// 将卡牌效果序号转换为对应的特殊元素常量
// 1(回血)→7, 2(护盾)→6, 3(加时间)→5, 4(全灭)→8, 5(净化)→9
export function gstsServerCardEffectToElement(cardEffect: bigint): bigint {
  let result = int(0)
  if (cardEffect === CardHeal) {
    result = Dendro
  } else if (cardEffect === CardShield) {
    result = Geo
  } else if (cardEffect === CardTime) {
    result = Anemo
  } else if (cardEffect === CardClearEnemies) {
    result = Light
  }
  return result
}

// 将卡牌效果序号转换为对应的图标素材ID
export function gstsServerCardEffectToIcon(cardEffect: bigint): bigint {
  let result = int(0)
  if (cardEffect === CardHeal) {
    result = CardHealIcon
  } else if (cardEffect === CardShield) {
    result = CardShieldIcon
  } else if (cardEffect === CardTime) {
    result = CardTimeIcon
  } else if (cardEffect === CardClearEnemies) {
    result = CardClearEnemiesIcon
  } else if (cardEffect === CardPurify) {
    result = CardPurifyIcon
  }
  return result
}

// 设置E技能的图标（通过关卡实体的变量通知图片控件）
export function gstsServerSetESkillIcon(iconId: bigint) {
  stage.set('ESkillIcon', iconId)
}

// 显示卡牌选择器（fixedCard=0时随机选2张，非0时强制该卡牌）
export function gstsServerShowDeckSelector(fixedCard: bigint, f: ServerExecutionFlowFunctions) {
  if (fixedCard === int(0)) {
    const firstCard = f.getRandomInteger(int(1), int(5))
    const offset = f.getRandomInteger(int(1), int(4))
    let secondCard = firstCard + offset
    if (secondCard > int(5)) {
      secondCard = secondCard - int(5)
    }
    f.invokeDeckSelector(
      player(1),
      DeckSelectorIndex,
      DeckSelectorDuration,
      [firstCard, secondCard],
      [firstCard, secondCard],
      DeckSelectorSelectMin,
      DeckSelectorSelectMax,
      DecisionRefreshMode.CannotRefresh,
      int(0),
      int(0),
      [firstCard]
    )
  } else {
    f.invokeDeckSelector(
      player(1),
      DeckSelectorIndex,
      DeckSelectorDuration,
      [fixedCard],
      [fixedCard],
      DeckSelectorSelectMin,
      DeckSelectorSelectMax,
      DecisionRefreshMode.CannotRefresh,
      int(0),
      int(0),
      [fixedCard]
    )
  }
}
