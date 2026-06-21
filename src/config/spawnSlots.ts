// === 敌人出生位置与旋转（固定值） ===
// 索引 0/1/2 对应 battleStageConfig 中 s1/s2/s3 的 pos/rot 字段
// struct + .map() 模式，和 battleStageConfig 一致

const spawnSlotData = [
  { pos: [1, 3.5, 0] as const, rot: [0, 0, 0] as const },
  { pos: [-1, 3.5, 0] as const, rot: [0, 150.25, 0] as const },
  { pos: [0, 3.5, 2] as const, rot: [0, 90, 0] as const }
] as const

export const spawnSlotSize = spawnSlotData.length
export const spawnSlotPositions: readonly (readonly [number, number, number])[] = spawnSlotData.map((s) => s.pos)
export const spawnSlotRotations: readonly (readonly [number, number, number])[] = spawnSlotData.map((s) => s.rot)

export const spawnSlots = {
  size: spawnSlotSize,
  positions: spawnSlotData.map((s) => vec3(s.pos)),
  rotations: spawnSlotData.map((s) => vec3(s.rot))
}
