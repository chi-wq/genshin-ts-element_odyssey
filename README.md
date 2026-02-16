# genshin-ts-element_odyssey

これは [Genshin-TS](https://gsts.moe) を使って作ったゲームプロジェクトです。TypeScript でロジックを書き、ノードグラフにコンパイルしてマップへ注入できます。

## クイックスタート

```bash
npm install
npm run dev
```

ドキュメント: `https://gsts.moe`

## プロジェクト構成

- `src/main.ts`: エントリ例（`g.server(...).on(...)`）
- `gsts.config.ts`: コンパイル/出力の設定
- `dist/`: ビルド出力（`.gs.ts` / `.json` / `.gia`）
- `CLAUDE.md` / `AGENTS.md`: AI 協業メモ（先に読む）

## 注入（Injection）設定例（任意）

```ts
import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'Global',
    playerId: 1,
    mapId: 1073741849,
    nodeGraphId: 1073741825
  }
}

export default config
```

メモ:

- `npm run maps` は最近保存したマップを列挙し、`mapId` 特定の助けになります。
- 複数リージョン/複数アカウントを使う場合は `gameRegion` / `playerId` を埋めてください。
- 注入時にロールバック用バックアップが自動作成されます。

## エントリとイベントの書き方

```ts
import { g } from 'genshin-ts/runtime/core'

g.server({ id: 1073741825 }).on('whenEntityIsCreated', (_evt, f) => {
  const p = player(1)
  f.printString(str(p.guid))
})
```

ポイント:

- `id` は注入対象の NodeGraph ID です。同一 ID のエントリはマージされます。
- イベント名は文字列リテラルで指定します。
- `f` はノードグラフ関数のエントリです。出力や変数操作に使います。
- `g.server(...).on(...).onSignal(...)` のようにイベントをチェーンできます。

## g.server のオプション（注入安全性）

よく使うオプション:

- `id`: 注入対象の NodeGraph ID（注入設定はこの ID と一致させる必要があります）
- `name`: グラフ表示名（デフォルトはエントリファイル名）
- `prefix`: `_GSTS_` プレフィックスを自動付与（デフォルト true）
- `type`: グラフタイプ（デフォルト server/entity）
- `variables`: グラフ変数を宣言し、`f.get` / `f.set` を有効化

注入の安全ルール:

- 対象 `id` はマップ内に存在している必要があります。
- 対象グラフが空、または名前が `_GSTS` で始まらない場合は注入がブロックされます。
- 仕様を理解している場合は `gsts.config.ts` で `inject.skipSafeCheck = true` を設定できます。
- 新しいグラフを作成したら、インジェクタが `id` を検出できるようにマップを保存してください。
- 推奨: 先にグラフをまとめて作成・保存し、その後に 1 回だけコンパイル/注入します。

## gsts.config の最適化オプション（デフォルト有効）

`gsts.config.ts` は `options.optimize` を使用し、デフォルトではすべて有効です:

- `precompileExpression`: リテラルのみで構成された式を事前計算
- `removeUnusedNodes`: 未使用の exec/data ノードを削除
- `timerPool`: `setTimeout` / `setInterval` の名前プールサイズ
- `timerDispatchAggregate`: タイマー dispatch を集約して複雑度を削減

デバッグやグラフ比較が必要な場合は、必要に応じて一時的に無効化してください。

## 典型的な使い方と制約（AI は必読）

### スコープ分離

- **トップレベル（コンパイル時）**: ファイル読み込み、npm ライブラリ使用、事前計算は OK。ただしここで `g.server` や `gsts` のランタイム API を呼ばないでください。
- **ノードグラフ（実行時）**: 対応している TS のサブセットのみ使用可。ここで書いたロジックがノードグラフへコンパイルされます。

### 制御構文と return

- `if/while/switch` の条件は `boolean` 必須です。必要なら `bool(...)` を使ってください。
- `gstsServer*` 関数は **末尾の単一 `return <expr>` のみ**許可されます。
- ノードグラフスコープでは再帰、`async/await`、Promise は非対応です。
- `while(true)` はループ上限で制限されます。代わりにタイマーや明示的カウンタを使ってください。
- `!` や三項演算子は条件が boolean である必要があります。

### 数値と型

- `number` は **float**、`bigint` は **int** です。
- 剰余/ビット演算は `bigint` を使ってください。
- list/dict は同種要素のみ（homogeneous）です。混在型は失敗します。
- 空配列は型推論できない場合があります。型付きプレースホルダを入れるか `list(...)` を使ってください。
- `int`, `float`, `vec3`, `configId`, `prefabId`, `entity` などの明示ヘルパーを優先してください。
- `dict(...)` は読み取り専用 dict を作ります。可変 dict はグラフ変数（`f.get` / `f.set`）で扱ってください。
- `let` はローカル変数ノードの生成を強制できます。`const` は最適化で直結配線になる場合があります。

### グローバル関数/変数チートシート（AI 向け推奨）

ログ/デバッグ:

- `print(str(...))`: 最も安定するログ。
- `console.log(x)`: **引数は 1 つ בלבד**。自動的に `print(str(...))` に書き換えられます。
- `f.printString(...)`: 厳密にノードを合わせたい場合の明示呼び出し。

型ヘルパー:

- `bool(...)` / `int(...)` / `float(...)` / `str(...)`
- `vec3(...)` / `guid(...)` / `prefabId(...)` / `configId(...)` / `faction(...)` / `entity(...)`
- `list('int', items)`: explicit list typing (critical for empty arrays).
- `dict(...)`: read-only dict.
- `raw(...)`: compiler ignores it; JS native semantics apply.

エンティティ/シーン:

- `player(1)`: player entity (starts from 1).
- `stage` / `level`: stage entity aliases.
- `self`: current graph entity.
- `GameObject.Find(...)` / `FindWithTag(...)` / `FindByPrefabId(...)`

数学/ベクトル:

- `Math.*`: compiled to node graph equivalents in server scope.
- `Mathf.*` / `Vector3.*` / `Random.*`: Unity-style APIs.

シグナル/イベント:

- `send('signalName')` with `g.server().onSignal(...)`.

タイマー:

- `setTimeout` / `setInterval` / `clearTimeout` / `clearInterval`.

よく使うメソッド:

- 多くの配列/文字列メソッド（`map`/`filter`/`find`/`length`）に対応しています。型ヒントに従って使ってください。

### ノードグラフ変数（書き込み可能）

```ts
g.server({
  id: 1073741825,
  variables: { counter: 0n },
}).on('whenEntityIsCreated', (_evt, f) => {
  const v = f.get('counter')
  f.set('counter', v + 1n)
})
```

Notes:

- `variables` はグラフ変数を定義し、型付きの `f.get` / `f.set` を有効にします。
- エンティティ変数は型宣言のみです（`entity(0)` を使います）。
- `entity(0)` は、エディタ上でエンティティ引数を空に保つためのプレースホルダとしても使えます。

### タイマー

- `setTimeout` / `setInterval` を使います（ミリ秒）。
- コンパイラは名前衝突を避けるためタイマー名プールを構築します。
- `// @gsts:timerPool=4` でプールサイズを上書きできます（上級）。
- `setInterval` が 100ms 以下の場合、パフォーマンス警告が出ます。
- タイマーコールバックは値キャプチャに対応しますが、dict のキャプチャは非対応です。

### ネイティブ JS オブジェクト制限

- `Object.*` と `JSON.*` は通常ノードグラフスコープで非対応です。
- トップレベルで事前計算するか、`raw(...)` を使ってください。
- 文字列連結が失敗する場合は、トップレベルで事前計算するか `str(...)` を使ってください。

## 再利用関数（gstsServer）

```ts
function gstsServerSum(a: bigint, b: bigint) {
  const total = a + b
  return total
}

g.server({ id: 1073741825 }).on('whenEntityIsCreated', (_evt, f) => {
  const v = gstsServerSum(1n, 2n)
  f.printString(str(v))
})
```

Rules:

- トップレベルに定義します。引数は識別子のみ（分割代入/デフォルト/可変長は不可）。
- `return` は末尾に 1 回だけ許可されます。
- 呼び出しは `g.server().on(...)` または他の `gstsServer*` 内からのみ可能です。
- `gstsServer*` 内では `gsts.f` を直接使えます（`f` を渡す必要はありません）。

## 複数エントリとマージ

- `gsts.config.ts` の `entries` がコンパイル対象ファイルを決めます。
- 各エントリはグラフを生成し、同一 ID のエントリはマージされます。
- dev モードでは依存関係の変更に応じて影響範囲のみ再コンパイルされます。

## 出力とデバッグ

- `.gs.ts`: ノード関数呼び出しに展開した形（意味/呼び出しチェック向け）。
- `.json`: ノード接続と型チェック用の IR。
- `.gia`: 注入/インポート用の最終グラフ出力。

## コンパイル時実行の注意

- コンパイラはすべてのエントリを走査し、`g.server().on(...)` を起点にコンパイルします。
- トップレベルコードは（インクリメンタルビルドや複数エントリにより）1 回または複数回実行されることがあります。
- トップレベルでのファイル I/O や乱数利用には注意してください。
- 一時的に注入を無効化したい場合は、存在しない `id` を設定してください。
- トップレベルはファイル読み込み、事前計算、手続き生成に向いています。
- `stage.set` は（実行時の）グローバル変数として使えます。

## スクリプト

- `npm run build`: フルコンパイル
- `npm run dev`: インクリメンタルコンパイル（設定されていれば自動注入）
- `npm run maps`: 最近のマップ一覧
- `npm run backup`: バックアップディレクトリを開く
- `npm run typecheck`: TypeScript 型チェック
- `npm run lint`: ESLint

メモ:

- このプロジェクトには独自 ESLint ルールが含まれます。隠れた制約を早めに拾うため `npm run lint` を頻繁に実行してください。
- `npm run typecheck` はコンパイルエラーになる前に型問題を見つける助けになります。
- `npm run dev` は `gsts dev` の watch モードのみを実行します。
- 注入後、変更を反映するにはマップをリロードしてください。
- 一時的な空マップを用意すると切り替えとリロードが速くなります。
- リロード前に保存すると注入内容が上書きされる場合があります。必要なら再注入してください。

## FAQ

- `npm run maps` が空: エディタで一度マップを保存してから再実行してください。
- 注入に失敗する: `mapId` / `nodeGraphId` とグラフタイプを確認してください。
- 型エラー: まず `.value` の使い方と型の整合を確認してください。

## 関数/イベント注釈の探し方（AI 向け）

型ヒントだけでは足りない場合は `node_modules/genshin-ts` を検索してください:

- ノード関数/イベント定義: `node_modules/genshin-ts/dist/src/definitions/`
- キーワード（イベント名、関数名）でコメントや引数説明を探せます。
