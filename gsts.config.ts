import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'China',
    playerId: 344728135,
    mapId: 1073741826
  }
}

export default config
