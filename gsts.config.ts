import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'Global',
    playerId: 873740275,
    mapId: 1073741825
  }
}

export default config
