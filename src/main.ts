// 列挙型のインポート

import {
  SettlementStatus, // 決算ステータス
  UIControlGroupStatus // UIコントロールグループステータス
} from 'genshin-ts/definitions/enum'
import { ServerExecutionFlowFunctions } from 'genshin-ts/definitions/nodes' // サーバー実行フロー関数
import { g } from 'genshin-ts/runtime/core' // ランタイムコア

// === 元素定数 ===
const Cryo = int(1) // 氷元素
const Pyro = int(2) // 炎元素
const Hydro = int(3) // 水元素
const Electro = int(4) // 雷元素

// === メイン元素アイコンID ===
const CryoMainIcon = int(1073742037) // メイン氷アイコン
const PyroMainIcon = int(1073742015) // メイン炎アイコン
const HydroMainIcon = int(1073742059) // メイン水アイコン
const ElectroMainIcon = int(1073742081) // メイン雷アイコン

// === サブ元素アイコンID ===
const CryoSubIcon = int(1073742298) // サブ氷アイコン
const PyroSubIcon = int(1073742292) // サブ炎アイコン
const HydroSubIcon = int(1073742296) // サブ水アイコン
const ElectroSubIcon = int(1073742294) // サブ雷アイコン

// === タイマーUI ID ===
const InitTimer = int(1073741874) // 初期化タイマーUI
const StageTimer = int(1073741860) // ステージタイマーUI

// === 敵関連定数 ===
const factionEnemy = 4 // 敵陣営番号
const enemyHilichurl = prefabId(1082130439) // ヒルチャール
const enemyPyroSlime = prefabId(1082130443) // 炎スライム
const enemyFighter = prefabId(1082130444) // ファイター
const enemyHydroSamachurl = prefabId(1082130445) // 水サマチャール
const enemyRuinGuard = prefabId(1082130446) // 遺跡守衛

// === オーブ関連定数 ===
const orbPrefabIdValue = prefabId(1077936129) // オーブプレハブID
const orbCount = 10 // オーブ生成数

// === 元素攻撃関連定数 ===
const elementAttackPrefabIdValue = prefabId(1077936177) // 元素攻撃プレハブID
const monitorElementalReaction = configId(1077936129) // 元素反応監視コンフィグID

// === 敵の生成位置と回転（固定値） ===
const enemyPos1 = vec3([1, 3.5, 0]) // 敵生成位置1
const enemyPos2 = vec3([-1, 3.5, 0]) // 敵生成位置2
const enemyRot1 = vec3([0, 0, 0]) // 敵回転1
const enemyRot2 = vec3([0, 150.25, 0]) // 敵回転2
const enemyPos3 = vec3([0, 3.5, 2]) // 敵生成位置3
const enemyRot3 = vec3([0, 90, 0]) // 敵回転3

// 元素タイプリストを取得する
function gstsServerGetElementalTypes(f: ServerExecutionFlowFunctions) {
  return list('int', [Cryo, Pyro, Hydro, Electro]) // 4元素のリストを返す
}

// 元素アイコンUI更新（メインまたはサブ）
function gstsServerUpdateElementIcons(
  elem: bigint, // 元素値
  isMain: boolean, // メインかサブか
  f: ServerExecutionFlowFunctions // 実行フロー関数
) {
  const p = player(1) // プレイヤー1を取得
  const icons = isMain // メインかサブかでアイコン配列を選択
    ? [CryoMainIcon, PyroMainIcon, HydroMainIcon, ElectroMainIcon] // メインアイコン配列
    : [CryoSubIcon, PyroSubIcon, HydroSubIcon, ElectroSubIcon] // サブアイコン配列
  // 全アイコンをオフにする
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[0], UIControlGroupStatus.Off) // 氷アイコンオフ
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[1], UIControlGroupStatus.Off) // 炎アイコンオフ
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[2], UIControlGroupStatus.Off) // 水アイコンオフ
  f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[3], UIControlGroupStatus.Off) // 雷アイコンオフ
  // 対応するアイコンをオンにする
  if (elem === Cryo) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[0], UIControlGroupStatus.On) // 氷アイコンオン
  } else if (elem === Pyro) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[1], UIControlGroupStatus.On) // 炎アイコンオン
  } else if (elem === Hydro) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[2], UIControlGroupStatus.On) // 水アイコンオン
  } else if (elem === Electro) {
    f.modifyUiControlStatusWithinTheInterfaceLayout(p, icons[3], UIControlGroupStatus.On) // 雷アイコンオン
  }
}

// 元素に応じてinitiateAttackを実行する（elem: 1=氷,2=炎,3=水,4=雷）
// dmgCoeff: ダメージ係数（0でダメージなし・元素付着のみ）
function gstsServerElementAttack(
  elem: bigint, // 元素値
  hitEntity: ReturnType<typeof entity>, // 命中エンティティ
  hitLocation: ReturnType<typeof vec3>, // 命中位置
  rot: ReturnType<typeof vec3>, // 回転
  sourceEntity: ReturnType<typeof entity>, // 発射元エンティティ
  f: ServerExecutionFlowFunctions, // 実行フロー関数
  dmgCoeff: ReturnType<typeof float> // ダメージ係数（0=元素付着のみ、1=通常ダメージ）
) {
  if (elem !== int(0)) {
    // 元素値が0でない場合のみ実行
    const elementNames = list('str', [
      // 元素名リスト
      str(''), // 0: 空
      str('Cryo'), // 1: 氷
      str('Pyro'), // 2: 炎
      str('Hydro'), // 3: 水
      str('Electro') // 4: 雷
    ])
    const elemName = f.getCorrespondingValueFromList(elementNames, elem) // リストから元素名を取得
    f.initiateAttack(
      // 攻撃を開始する
      hitEntity, // 攻撃対象
      dmgCoeff, // 攻撃倍率（0=元素付着のみ、1=通常ダメージ）
      float(0), // 追加ダメージ
      hitLocation, // 命中位置
      rot, // 回転
      elemName as unknown as ReturnType<typeof str>, // 元素名
      true, // アビリティユニット設定を上書き
      sourceEntity // 発射元
    )
  }
}

// 元素反応名を取得する（反応が発生しない場合は空文字列を返す）
function gstsServerGetReactionName(
  mainElem: bigint, // メイン元素
  subElem: bigint, // サブ元素
  f: ServerExecutionFlowFunctions // 実行フロー関数
): ReturnType<typeof str> {
  let ret = str('') // 反応なし（空文字列）
  // メイン元素とサブ元素の組み合わせから元素反応名を判定
  if (mainElem === int(1) || subElem === int(1)) {
    // 氷元素を含む反応
    if (mainElem === int(2) || subElem === int(2)) {
      // 氷+炎 → 溶解
      ret = str('溶解')
    } else if (mainElem === int(3) || subElem === int(3)) {
      // 氷+水 → 凍結
      ret = str('凍結')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 氷+雷 → 超電導
      ret = str('超電導')
    }
  } else if (mainElem === int(2) || subElem === int(2)) {
    // 炎元素を含む反応（氷以外）
    if (mainElem === int(3) || subElem === int(3)) {
      // 炎+水 → 蒸発
      ret = str('蒸発')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 炎+雷 → 過負荷
      ret = str('過負荷')
    }
  } else {
    // 残りの組み合わせ → 水+雷 → 感電
    ret = str('感電')
  }
  return ret // 元素反応名を返す
}

// 元素反応のカラーを取得する（HEXカラー文字列、反応なしは空文字列）
function gstsServerGetReactionColor(
  mainElem: bigint, // メイン元素
  subElem: bigint, // サブ元素
  f: ServerExecutionFlowFunctions // 実行フロー関数
): ReturnType<typeof str> {
  let ret = str('') // 反応なし（空文字列）
  if (mainElem === int(1) || subElem === int(1)) {
    // 氷元素を含む反応
    if (mainElem === int(2) || subElem === int(2)) {
      // 溶解（氷+炎）→ オレンジ
      ret = str('#FF6633')
    } else if (mainElem === int(3) || subElem === int(3)) {
      // 凍結（氷+水）→ アイスブルー
      ret = str('#99FFFF')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 超電導（氷+雷）→ 青紫
      ret = str('#B065E0')
    }
  } else if (mainElem === int(2) || subElem === int(2)) {
    // 炎元素を含む反応（氷以外）
    if (mainElem === int(3) || subElem === int(3)) {
      // 蒸発（炎+水）→ オレンジ
      ret = str('#FF9933')
    } else if (mainElem === int(4) || subElem === int(4)) {
      // 過負荷（炎+雷）→ 赤
      ret = str('#FF3366')
    }
  } else {
    // 感電（水+雷）→ 紫
    ret = str('#CC77FF')
  }
  return ret // 元素反応カラーを返す
}

// ランダム位置にオーブを生成する
function gstsServerCreateOrbAtRandomPos(yPos: number, f: ServerExecutionFlowFunctions) {
  const x = f.getRandomInteger(int(-10), int(10)) // X座標をランダム生成
  const z = f.getRandomInteger(int(-10), int(10)) // Z座標をランダム生成
  const position = f.create3dVector(float(x), float(yPos), float(z)) // 3Dベクトルを作成
  const orb = f.createPrefab(
    // オーブプレハブを生成
    orbPrefabIdValue, // オーブプレハブID
    position, // 生成位置
    vec3([0, 0, 0]), // 回転なし
    stage, // ステージに配置
    true, // アクティブ
    1, // レイヤー
    [] as bigint[] // 追加パラメータなし
  )
  orb.setFaction(2) // 陣営を2に設定
  f.activateDisableModelDisplay(orb, false) // モデル表示を無効化（初期は非表示）
  // 元素タイプをランダムに設定し、オーブのカスタム変数に保存する
  const elementalTypes = gstsServerGetElementalTypes(f as unknown as ServerExecutionFlowFunctions) // 元素リスト取得
  const elemIdx = f.getRandomInteger(int(0), int(3)) // ランダムなインデックスを取得
  const elemType = f.getCorrespondingValueFromList(elementalTypes, elemIdx) // 対応する元素を取得
  orb.setCustomVariable('element', elemType as unknown as bigint) // カスタム変数に元素を保存
}

// オーブの拾得可能状態を設定する
function gstsServerSetOrbCollectable(collectable: boolean, f: ServerExecutionFlowFunctions) {
  stage.set('orbsCollectable', collectable) // 拾得可能フラグを設定
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // フィールド上の全オーブを取得
  const orbLen = f.getListLength(orbs) // オーブ数を取得
  f.finiteLoop(int(0), orbLen - int(1), (i) => {
    // 各オーブをループ
    const orb = f.getCorrespondingValueFromList(orbs, i) // オーブを取得
    f.activateDisableModelDisplay(orb, collectable) // 表示/非表示を切り替え
  })
}

// 単体の敵を生成する（カウント更新なし）
function gstsServerSpawnEnemy(
  enemyPrefab: ReturnType<typeof prefabId>, // 敵プレハブID
  position: ReturnType<typeof vec3>, // 生成位置
  rotation: ReturnType<typeof vec3>, // 回転
  f: ServerExecutionFlowFunctions // 実行フロー関数
) {
  const enemy = f.createPrefab(enemyPrefab, position, rotation, stage, true, 1, [] as bigint[]) // 敵を生成
  enemy.setFaction(factionEnemy) // 敵陣営に設定
  // 敵に元素反応監視ユニットステータスを付与する
  f.addUnitStatus(enemy, enemy, monitorElementalReaction, int(1), dict('str', 'float', null))
}

// 敵ウェーブを生成する（ステージに応じて異なる敵タイプと数量）
function gstsServerSpawnEnemyWave(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage === int(1)) {
    // ステージ1：ヒルチャール2体
    gstsServerSpawnEnemy(enemyHilichurl, enemyPos1, enemyRot1, f) // ヒルチャール1体目
    gstsServerSpawnEnemy(enemyHilichurl, enemyPos2, enemyRot2, f) // ヒルチャール2体目
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(2)) // 敵数+2
  } else if (currentStage === int(2)) {
    // ステージ2：ヒルチャール1体 + 炎スライム1体
    gstsServerSpawnEnemy(enemyHilichurl, enemyPos1, enemyRot1, f) // ヒルチャール
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos2, enemyRot2, f) // 炎スライム
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(2)) // 敵数+2
  } else if (currentStage === int(3)) {
    // ステージ3：ファイター2体 + 炎スライム1体
    gstsServerSpawnEnemy(enemyFighter, enemyPos1, enemyRot1, f) // ファイター1体目
    gstsServerSpawnEnemy(enemyFighter, enemyPos2, enemyRot2, f) // ファイター2体目
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos3, enemyRot3, f) // 炎スライム
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(3)) // 敵数+3
  } else if (currentStage === int(4)) {
    // ステージ4：ファイター2体 + 水サマチャール1体
    gstsServerSpawnEnemy(enemyFighter, enemyPos1, enemyRot1, f) // ファイター1体目
    gstsServerSpawnEnemy(enemyHydroSamachurl, enemyPos2, enemyRot2, f) // 水サマチャール
    gstsServerSpawnEnemy(enemyFighter, enemyPos3, enemyRot3, f) // ファイター2体目
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(3)) // 敵数+3
  } else {
    // ステージ5：遺跡守衛1体 + 炎スライム2体
    gstsServerSpawnEnemy(enemyRuinGuard, enemyPos1, enemyRot1, f) // 遺跡守衛
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos2, enemyRot2, f) // 炎スライム1体目
    gstsServerSpawnEnemy(enemyPyroSlime, enemyPos3, enemyRot3, f) // 炎スライム2体目
    stage.set('enemyCount', stage.get('enemyCount').asType('int') + int(3)) // 敵数+3
  }
}

// フィールド上の全オーブを削除する
function gstsServerClearAllOrbs(f: ServerExecutionFlowFunctions) {
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 全オーブを取得
  const orbLen = f.getListLength(orbs) // オーブ数を取得
  f.finiteLoop(int(0), orbLen - int(1), (i) => {
    // 各オーブをループ
    const orb = f.getCorrespondingValueFromList(orbs, i) // オーブを取得
    f.removeEntity(orb) // オーブを削除
  })
  return int(0) // 戻り値
}

// フィールド上のオーブを1つランダムに削除する
function gstsServerRemoveRandomOrb(f: ServerExecutionFlowFunctions) {
  const orbs = f.getEntitiesWithSpecifiedPrefabOnTheField(orbPrefabIdValue) // 全オーブを取得
  const orbLen = f.getListLength(orbs) // オーブ数を取得
  if (orbLen > int(0)) {
    // オーブが存在する場合
    const idx = f.getRandomInteger(int(0), orbLen - int(1)) // ランダムなインデックスを取得
    const orb = f.getCorrespondingValueFromList(orbs, idx) // 対象オーブを取得
    orb.activateDisablePathfindingObstacleFeature(true) // パスファインディング障害物を無効化
    orb.destroy() // オーブを破壊
    f.removeEntity(orb) // エンティティを削除
  }
  return int(0) // 戻り値
}

// 決算ステータスを設定する（勝利または敗北）
function gstsServerSettleSuccessStatus(challengeState: bigint, f: ServerExecutionFlowFunctions) {
  if (challengeState !== int(0)) {
    // チャレンジ状態が0でない場合
    const player1 = player(1) // プレイヤー1を取得
    // 全オーブを削除する
    gstsServerClearAllOrbs(f)
    // グローバルタイマーを停止しUIを非表示にする
    f.stopGlobalTimer(stage, 'StageTimer') // ステージタイマーを停止
    stage.set('stageTimerActive', false) // ステージタイマー動作フラグをfalseに設定
    f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // タイマーUIを非表示
    if (challengeState === int(1)) {
      // 勝利の場合
      f.setPlayerSettlementSuccessStatus(player1, SettlementStatus.Victory) // 勝利ステータスを設定
    } else if (challengeState === int(2)) {
      // 敗北の場合
      f.setPlayerSettlementSuccessStatus(player1, SettlementStatus.Defeat) // 敗北ステータスを設定
    }
    // 決算画面にスコアを表示する
    const finalScore = stage.get('score').asType('int') // 最終スコアを取得
    f.setPlayerSettlementScoreboardDataDisplay(player1, int(1), str('スコア'), finalScore) // スコアボードに表示
    f.settleStage() // ステージを決算する
  }
}

// 次のステージに進む
function gstsServerNextStage(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage !== int(0)) {
    // 現在のステージが0でない場合
    const player1 = player(1) // プレイヤー1を取得
    // 全オーブを削除する
    gstsServerClearAllOrbs(f)
    // グローバルタイマーを停止しUIを非表示にする
    f.stopGlobalTimer(stage, 'StageTimer') // ステージタイマーを停止
    stage.set('stageTimerActive', false) // ステージタイマー動作フラグをfalseに設定
    f.modifyUiControlStatusWithinTheInterfaceLayout(player1, StageTimer, UIControlGroupStatus.Off) // タイマーUIを非表示
    const maxStage = stage.get('maxStage').asType('int') // 最大ステージ数を取得
    if (currentStage === maxStage) {
      // 最終ステージに到達した場合
      print(str('最終ステージ到達、決算処理開始...')) // デバッグログ
      gstsServerSettleSuccessStatus(int(1), f as unknown as ServerExecutionFlowFunctions) // 勝利で決算
    } else {
      // まだ次のステージがある場合
      print(str('次のステージを開始...')) // デバッグログ
      f.set('challengeState', int(3), true) // チャレンジ状態を中断に設定
      stage.set('teleportFrom', int(currentStage)) // テレポート元を記録
      f.teleportPlayer(player1, vec3([224.67, 3.39, -2.78]), vec3([0, 272.89, 0])) // プレイヤーをテレポート
      print(str('プレイヤーを次のステージへテレポート完了')) // デバッグログ
    }
  }
}

// ステージ変数を初期化する
function gstsServerInitializeStageVariables(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  stage.set('enemyCount', int(0)) // 敵カウントを0に初期化
  gstsServerSetOrbCollectable(false, f as unknown as ServerExecutionFlowFunctions) // オーブを拾得不可に設定
  stage.set('collectableTimeout', int(0)) // 拾得タイムアウトを0に初期化
  stage.set('orbsCollected', int(0)) // 収集済みオーブ数を0に初期化
  stage.set('spawnTimer', int(0)) // スポーンタイマーを0に初期化
  // スコアはステージ間で累積するためリセットしない
  stage.set('reaction', str('')) // 元素反応名を空文字列に初期化
  stage.set('reactionColor', str('')) // 元素反応カラーを空文字列に初期化
  stage.set('reactionMsg', str('')) // 元素反応メッセージを空文字列に初期化
  stage.set('reactionMsgColor', str('')) // 元素反応メッセージカラーを空文字列に初期化
  stage.set('stageTimerActive', false) // ステージタイマー動作フラグをfalseに初期化
  const initElement = f.getRandomInteger(int(1), int(4)) // メイン元素をランダムに決定
  stage.set('mainElement', initElement) // メイン元素を設定
  gstsServerUpdateElementIcons(initElement, true, f) // メイン元素アイコンを更新
  // サブ元素はメインと異なる値にする（オフセット1～3を加算、4を超えたら-4）
  const offset = f.getRandomInteger(int(1), int(3)) // ランダムオフセットを取得
  let initSub = initElement + offset // サブ元素を算出
  if (initSub > int(4)) {
    // 4を超えた場合
    initSub = initSub - int(4) // ラップアラウンド
  }
  stage.set('subElement', initSub) // サブ元素を設定
  gstsServerUpdateElementIcons(initSub, false, f) // サブ元素アイコンを更新
  f.set('challengeState', int(0), true) // チャレンジ状態を進行中に設定
  // ステージ難易度設定テーブル（全5ステージ）
  const stageMaxEnemies = list('int', [int(12), int(18), int(24), int(30), int(36)]) // 各ステージの最大敵数
  const stageOrbsRequired = list('int', [int(3), int(4), int(5), int(6), int(7)]) // 各ステージの必要オーブ数
  let idx = currentStage - int(1) // インデックスを算出
  if (idx > int(4)) {
    // インデックスが範囲外の場合
    idx = int(4) // 最大値にクランプ
  }
  stage.set('maxEnemies', f.getCorrespondingValueFromList(stageMaxEnemies, idx)) // 最大敵数を設定
  stage.set('orbsRequired', f.getCorrespondingValueFromList(stageOrbsRequired, idx)) // 必要オーブ数を設定
}

// ステージを作成する
function gstsServerCreateStage(currentStage: bigint, f: ServerExecutionFlowFunctions) {
  if (currentStage !== int(0)) {
    // 現在のステージが0でない場合
    // ステージ変数を初期化する（ステージに応じた難易度設定）
    gstsServerInitializeStageVariables(currentStage, f)

    // ランダム位置にオーブを生成する（10個）
    f.finiteLoop(int(0), int(orbCount - 1), () => {
      gstsServerCreateOrbAtRandomPos(3.2, f as unknown as ServerExecutionFlowFunctions) // オーブを1つ生成
    })

    // ステージタイマー（毎秒実行、敵生成も兼ねる）
    const stageTimerInterval = setInterval(() => {
      print(str('ステージタイマー実行')) // デバッグログ
      const challengeState = f.get('challengeState') as unknown as bigint // チャレンジ状態を取得

      // 既に敗北しているか確認
      if (challengeState === int(2)) {
        print(str('チャレンジ既に失敗、タイマーをクリア')) // デバッグログ
        clearInterval(stageTimerInterval) // タイマーをクリア
      } else if (challengeState === int(1)) {
        // 既に成功しているか確認
        print(str('チャレンジ既に成功、タイマーをクリア')) // デバッグログ
        clearInterval(stageTimerInterval) // タイマーをクリア
      } else if (challengeState === int(3)) {
        // 中断中（次ステージへテレポート中）
        print(str('チャレンジ中断、タイマーをクリア')) // デバッグログ
        clearInterval(stageTimerInterval) // タイマーをクリア
      } else {
        // 進行中 - ステージタイマー失効チェック
        const timerActive = stage.get('stageTimerActive').asType('bool') // タイマー動作フラグを取得
        if (timerActive) {
          // タイマーが動作中であるべき状態で残り時間を確認
          const timerRemaining = f.getCurrentGlobalTimerTime(stage, 'StageTimer') // 残り時間を取得
          if (timerRemaining <= float(0)) {
            // タイマーが失効している（切断等で失われた可能性）
            print(str('StageTimer失効検出！敗北判定')) // デバッグログ
            f.set('challengeState', int(2), true) // チャレンジ状態を敗北に設定
            gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 敗北で決算
            clearInterval(stageTimerInterval) // タイマーをクリア
          }
        }
        // 条件を確認する
        const currentStage = stage.get('currentStage').asType('int') // 現在ステージを取得
        const enemyCount = stage.get('enemyCount').asType('int') // 敵数を取得
        const orbsCollected = stage.get('orbsCollected').asType('int') // 収集済みオーブ数を取得
        const orbsRequired = stage.get('orbsRequired').asType('int') // 必要オーブ数を取得

        // デバッグ情報を出力
        print(str('敵数:')) // 敵数ログ
        console.log(enemyCount) // 敵数の値を出力
        print(str('収集済みオーブ数:')) // 収集済みオーブ数ログ
        console.log(orbsCollected) // 収集済みオーブ数の値を出力

        // 成功条件：全敵撃破 かつ 必要オーブ数を収集済み
        if (enemyCount === int(0) && orbsCollected >= orbsRequired) {
          print(str('チャレンジ成功！')) // デバッグログ
          f.set('challengeState', int(1), true) // チャレンジ状態を成功に設定
          gstsServerNextStage(currentStage, f as unknown as ServerExecutionFlowFunctions) // 次ステージへ
          clearInterval(stageTimerInterval) // タイマーをクリア
        } else {
          // 拾得可能カウントダウンロジック（毎秒減少、タイムアウト後は拾得不可、敵生成をトリガー）

          const canPickup = stage.get('orbsCollectable').asType('bool') // 拾得可能フラグを取得
          if (canPickup) {
            // 拾得可能な場合
            const countdown = stage.get('collectableTimeout').asType('int') // カウントダウン値を取得
            if (countdown > int(0)) {
              // カウントダウン中
              stage.set('collectableTimeout', countdown - int(1)) // カウントダウンを1減算
            } else {
              // カウントダウン終了
              gstsServerSetOrbCollectable(false, f as unknown as ServerExecutionFlowFunctions) // 拾得不可に設定
              send('SpawnEnemyWave') // 敵ウェーブ生成シグナルを送信
            }
          }
          // 敵生成：10秒ごとに1ウェーブ生成
          const spawnTimer = stage.get('spawnTimer').asType('int') + int(1) // スポーンタイマーを加算
          stage.set('spawnTimer', spawnTimer) // スポーンタイマーを更新
          if (spawnTimer >= int(10)) {
            // 10秒経過した場合
            stage.set('spawnTimer', int(0)) // スポーンタイマーをリセット
            if (orbsCollected < orbsRequired) {
              // まだ必要オーブ数に達していない場合
              send('SpawnEnemyWave') // 敵ウェーブ生成シグナルを送信
            }
          }
        }
      }
    }, 1000) // 1秒間隔
  }
  return int(0) // 戻り値
}

// === StageMain - ステージ主制御 ===
g.server({
  id: 1073741828, // ノードグラフID
  name: 'StageMain', // ノード名
  variables: {
    challengeState: int(0) // 0: 進行中 1: 成功 2: 敗北 3: 中断
  }
})
  .on('whenEntityIsCreated', (_evt, f) => {
    // エンティティ作成時
    if (f.queryIfEntityIsOnTheField(stage)) {
      // ステージがフィールド上にあるか確認
      const inited = stage.get('inited').asType('bool') // 初期化済みフラグを取得
      if (inited) {
        // 既に初期化済みの場合
        print(str('ステージ初期化済み、セットアップをスキップ')) // デバッグログ
        return // スキップ
      }
    }
    const interval = setInterval(() => {
      // 1秒間隔でポーリング
      if (f.queryIfEntityIsOnTheField(stage)) {
        // ステージがフィールド上にあるか確認
        if (stage.get('inited').asType('bool')) {
          // 初期化済みの場合
          clearInterval(interval) // インターバルをクリア
          send('StageReady') // ステージ準備完了シグナルを送信
        } else {
          // まだ初期化されていない場合
          stage.set('inited', true) // 初期化済みに設定
        }
      }
    }, 1000) // 1秒間隔
  })
  .on('whenGlobalTimerIsTriggered', (evt, f) => {
    // グローバルタイマー発火時
    print(str('タイマー発火')) // デバッグログ
    if (evt.timerName === 'InitTimer') {
      // 初期化タイマーの場合
      print(str('初期化タイマー一致！プレイヤーをテレポート中...')) // デバッグログ
      const player1 = player(1) // プレイヤー1を取得
      // グローバルタイマーを停止しUIを非表示にする
      f.stopGlobalTimer(stage, 'InitTimer') // 初期化タイマーを停止
      f.modifyUiControlStatusWithinTheInterfaceLayout(player1, InitTimer, UIControlGroupStatus.Off) // タイマーUIを非表示
      stage.set('teleportFrom', int(0)) // テレポート元を初期エリアに設定
      f.teleportPlayer(player1, vec3([10.49, 3.48, 2.97]), vec3([0, -99.36, 0])) // プレイヤーをテレポート
    } else if (evt.timerName === 'StageTimer') {
      // ステージタイマーの場合
      print(str('ステージタイマー一致！')) // デバッグログ

      // タイムアウトによる敗北処理
      print(str('チャレンジ失敗：タイムアウト')) // デバッグログ
      stage.set('stageTimerActive', false) // ステージタイマー動作フラグをfalseに設定
      f.set('challengeState', int(2), true) // チャレンジ状態を敗北に設定
      gstsServerSettleSuccessStatus(int(2), f as unknown as ServerExecutionFlowFunctions) // 敗北で決算
    }
  })
  .onSignal('StageReady', (_evt, f) => {
    // ステージ準備完了シグナル受信時
    print(str('ステージ準備完了シグナル受信！')) // デバッグログ
    print(str('ステージ初期化中...')) // デバッグログ
    // BGMを再生する（backgroundMusicIndexは実際の音楽インデックスに置換すること）
    const player1 = player(1) // プレイヤー1を取得
    f.modifyPlayerBackgroundMusic(
      // BGMパラメータを設定
      player1, // プレイヤー
      int(10075), // BGM
      float(0), // 開始時間
      float(999), // 終了時間（十分大きい値で全曲再生）
      int(100), // 音量
      true, // ループ再生
      float(0), // ループ間隔
      float(1), // 再生速度
      true // フェードイン・アウト有効
    )
    f.startPausePlayerBackgroundMusic(player1, true) // BGM再生を開始
    const currentStage = stage.get('currentStage').asType('int') // 現在ステージを取得
    gstsServerCreateStage(currentStage, f as unknown as ServerExecutionFlowFunctions) // ステージを作成
    print(str('UIコントロールを表示中...')) // デバッグログ
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), InitTimer, UIControlGroupStatus.On) // 初期化タイマーUIを表示
    print(str('初期化タイマーを開始...')) // デバッグログ
    f.startGlobalTimer(stage, 'InitTimer') // 初期化タイマーを開始
    print(str('初期化タイマー開始、カウントダウン待機中...')) // デバッグログ
  })
  .onSignal('SpawnEnemyWave', (_evt, f) => {
    // 敵ウェーブ生成シグナル受信時
    print(str('敵ウェーブ生成シグナル受信！敵ウェーブを生成中...')) // デバッグログ
    const enemyCount = stage.get('enemyCount').asType('int') // 現在の敵数を取得
    if (enemyCount < stage.get('maxEnemies').asType('int')) {
      // 最大敵数未満の場合
      const currentStage = stage.get('currentStage').asType('int') // 現在ステージを取得
      gstsServerSpawnEnemyWave(currentStage, f as unknown as ServerExecutionFlowFunctions) // 敵ウェーブを生成
    }
  })
  .onSignal('PlayerEntered', (_evt, f) => {
    // プレイヤー入場シグナル受信時
    print(str('プレイヤー入場シグナル受信！ステージタイマー開始...')) // デバッグログ
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.On) // ステージタイマーUIを表示
    f.startGlobalTimer(stage, 'StageTimer') // ステージタイマーを開始
    stage.set('stageTimerActive', true) // ステージタイマー動作フラグをtrueに設定
  })
  .onSignal('PlayerLeaved', (_evt, f) => {
    // プレイヤー退場シグナル受信時
    print(str('プレイヤー退場シグナル受信！ステージタイマー停止...')) // デバッグログ
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), StageTimer, UIControlGroupStatus.Off) // ステージタイマーUIを非表示
    f.stopGlobalTimer(stage, 'StageTimer') // ステージタイマーを停止
    const currentStage = stage.get('currentStage').asType('int') + int(1) // 次のステージ番号を算出
    stage.set('currentStage', currentStage) // 現在ステージを更新
    gstsServerCreateStage(currentStage, f as unknown as ServerExecutionFlowFunctions) // 新しいステージを作成
    print(str('UIコントロールを表示中...')) // デバッグログ
    f.modifyUiControlStatusWithinTheInterfaceLayout(player(1), InitTimer, UIControlGroupStatus.On) // 初期化タイマーUIを表示
    print(str('初期化タイマーを開始...')) // デバッグログ
    f.startGlobalTimer(stage, 'InitTimer') // 初期化タイマーを開始
    print(str('初期化タイマー開始、カウントダウン待機中...')) // デバッグログ
  })
  .on('whenEntityIsDestroyed', (evt, f) => {
    // エンティティ破壊時
    const faction = evt.faction as unknown as number // 陣営を取得
    if (faction === factionEnemy) {
      // 敵陣営の場合
      gstsServerSetOrbCollectable(true, f as unknown as ServerExecutionFlowFunctions) // オーブを拾得可能に設定
      stage.set('collectableTimeout', int(5)) // 5秒カウントダウンをリセット
      const currentCount = stage.get('enemyCount').asType('int') // 現在の敵数を取得
      stage.set('enemyCount', currentCount - int(1)) // 敵数を1減算
      // スコア：元素反応撃破=100点、通常撃破=1点
      const currentScore = stage.get('score').asType('int') // 現在のスコアを取得
      const reaction = stage.get('reaction').asType('str') // 元素反応名を取得
      if (reaction !== str('')) {
        // 元素反応撃破の場合
        stage.set('score', currentScore + int(100)) // スコア+100
        stage.set('reactionMsg', str('元素反応撃破 +100点')) // 反応メッセージを設定
        stage.set('reactionMsgColor', stage.get('reactionColor').asType('str')) // 反応メッセージカラーを設定
        stage.set('reaction', str('')) // 反応名をリセット
        stage.set('reactionColor', str('')) // 反応カラーをリセット
        print(reaction) // 元素反応名を表示
        // 3秒後にreactionが空ならreactionMsgをクリア
        const tMsg = setTimeout(() => {
          if (stage.get('reaction').asType('str') === str('')) {
            stage.set('reactionMsg', str('')) // 反応メッセージをクリア
            stage.set('reactionMsgColor', str('')) // 反応メッセージカラーをクリア
          }
          clearTimeout(tMsg) // タイムアウトをクリア
        }, 3000) // 3秒後
      } else {
        // 通常キルの場合
        stage.set('score', currentScore + int(1)) // スコア+1
        print(str('通常撃破 +1点')) // デバッグログ
      }
      print(str('スコア:')) // スコアログ
      console.log(stage.get('score').asType('int')) // スコア値を出力
    }
  })
  .onSignal('ElementAttackServer', (_evt, f) => {
    // 元素攻撃サーバーシグナル受信時
    print(str('元素攻撃サーバーシグナル受信！')) // デバッグログ
    const loc = stage.get('ElementAttLocation').asType('vec3') // 攻撃発射位置を取得
    const rot = stage.get('ElementAttRotate').asType('vec3') // 攻撃回転を取得

    const elementAttack = f.createProjectile(
      // 投射物を生成
      elementAttackPrefabIdValue, // 元素攻撃プレハブID
      loc, // 発射位置
      rot, // 回転
      entity(0), // 発射元エンティティ（なし）
      entity(0), // ターゲットエンティティ（なし）
      false, // 追従なし
      int(1), // 投射物数
      [] as bigint[] // 追加パラメータなし
    )

    const ti = setTimeout(() => {
      // 3秒後にクリーンアップ
      print(str('元素攻撃タイムアウト、クリーンアップ')) // デバッグログ
      f.removeEntity(elementAttack) // 投射物を削除
      clearTimeout(ti) // タイムアウトをクリア
    }, 3000) // 3秒
  })

// === ElementAttack - 投射物命中時の攻撃実行 ===
g.server({
  id: 1073741853, // ノードグラフID
  name: 'ElementAttack' // ノード名
}).on('whenOnHitDetectionIsTriggered', (evt, f) => {
  // 命中検出時
  const sourceEntity = evt.eventSourceEntity as unknown as ReturnType<typeof entity> // 発射元エンティティを取得
  const hitEntity = evt.onHitEntity as unknown as ReturnType<typeof entity> // 命中エンティティを取得
  const hitLocation = evt.onHitLocation // 命中位置を取得
  print(str('投射物命中検出！攻撃を開始...')) // デバッグログ
  const rot = stage.get('ElementAttRotate').asType('vec3') // 攻撃回転を取得
  const mainElem = stage.get('mainElement').asType('int') // メイン元素を取得
  const subElem = stage.get('subElement').asType('int') // サブ元素を取得

  // サブ元素で先に攻撃する（元素付着のみ、ダメージ0）
  if (subElem !== int(0) && subElem !== mainElem) {
    // サブ元素が有効かつメインと異なる場合
    gstsServerElementAttack(
      subElem, // サブ元素（元素付着用）
      hitEntity as unknown as ReturnType<typeof entity>, // 命中エンティティ
      hitLocation, // 命中位置
      rot, // 回転
      sourceEntity, // 発射元
      f as unknown as ServerExecutionFlowFunctions, // 実行フロー関数
      float(0) // ダメージ係数0（元素付着のみ）
    )
  }

  // メイン元素で攻撃する（実ダメージ、遅延で元素反応を発生させる）
  const tMain = setTimeout(() => {
    gstsServerElementAttack(
      mainElem, // メイン元素（実ダメージ）
      hitEntity as unknown as ReturnType<typeof entity>, // 命中エンティティ
      hitLocation, // 命中位置
      rot, // 回転
      sourceEntity, // 発射元
      f as unknown as ServerExecutionFlowFunctions, // 実行フロー関数
      float(1) // ダメージ係数1（通常ダメージ）
    )
    // サブ元素が存在する場合
    if (subElem !== int(0) && subElem !== mainElem) {
      // 元素反応名を取得
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
      stage.set('reaction', reactionName) // 元素反応名を設定
      stage.set('reactionColor', reactionColor) // 元素反応カラーを設定
      print(reactionName) // 元素反応名を表示
    }
    clearTimeout(tMain) // タイムアウトをクリア
  }, 10) // 10ms後にメイン攻撃

  const ti = setTimeout(() => {
    // 500ms後に発射元エンティティを削除
    f.removeEntity(sourceEntity) // 発射元を削除
    clearTimeout(ti) // タイムアウトをクリア
  }, 500) // 500ms
})

// === GetOrb - オーブ取得処理 ===
g.server({
  id: 1073741829, // ノードグラフID
  name: 'GetOrb' // ノード名
}).on('whenEnteringCollisionTrigger', (evt, f) => {
  // 衝突トリガー進入時
  print(str('エンティティが衝突トリガーに進入')) // デバッグログ
  const enteringEntity = evt.enteringEntity // 進入エンティティを取得
  const triggerEntity = evt.triggerEntity // トリガーエンティティを取得
  const faction = enteringEntity.faction() as unknown as number // 陣営を取得

  if (faction === factionEnemy) {
    // 敵が進入した場合
    // 敵がオーブに接触 → 敵ウェーブ生成をトリガー
    send('SpawnEnemyWave') // 敵ウェーブ生成シグナルを送信
  } else {
    // プレイヤーが進入した場合
    // プレイヤーがオーブを拾う
    if (!stage.get('orbsCollectable').asType('bool')) {
      // 拾得不可の場合
      send('SpawnEnemyWave') // 敵ウェーブ生成シグナルを送信
      return // 処理を終了
    }

    // 収集カウントを増加 ＋ オーブ拾得で30点加算
    stage.set('orbsCollected', stage.get('orbsCollected').asType('int') + int(1)) // 収集済みオーブ数+1
    stage.set('score', stage.get('score').asType('int') + int(30)) // スコア+30
    print(str('オーブ収集！+30点')) // デバッグログ
    const element = triggerEntity.getCustomVariable('element').asType('int') // オーブの元素を取得
    const prevMain = stage.get('mainElement').asType('int') // 前のメイン元素を取得
    stage.set('subElement', prevMain) // 前のメイン元素をサブに設定
    stage.set('mainElement', element) // 新しい元素をメインに設定
    gstsServerUpdateElementIcons(element, true, f as unknown as ServerExecutionFlowFunctions) // メインアイコンを更新
    gstsServerUpdateElementIcons(prevMain, false, f as unknown as ServerExecutionFlowFunctions) // サブアイコンを更新
  }

  triggerEntity.activateDisableCollisionTrigger(evt.triggerId, false) // 衝突トリガーを無効化
  triggerEntity.activateDisablePathfindingObstacleFeature(true) // パスファインディング障害物を無効化
  triggerEntity.destroy() // オーブを破壊
  triggerEntity.remove() // オーブを削除
})

// === PlayerMain - プレイヤー主制御 ===
g.server({
  id: 1073741837, // ノードグラフID
  name: 'PlayerMain' // ノード名
}).on('whenPlayerTeleportCompletes', (evt, f) => {
  // プレイヤーテレポート完了時
  print(str('プレイヤーテレポート完了！')) // デバッグログ
  const fromArea = stage.get('teleportFrom').asType('int') // テレポート元エリアを取得
  if (fromArea === int(0)) {
    // 初期エリアからの場合
    send('PlayerEntered') // プレイヤー入場シグナルを送信
  } else {
    // 他エリアからの場合
    send('PlayerLeaved') // プレイヤー退場シグナルを送信
  }
})
