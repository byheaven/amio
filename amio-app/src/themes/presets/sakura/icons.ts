import { TileType } from '../../../constants/game'
import type { ThemeIconSet } from '../../types'
import { sharkStarIcons } from '../shark-star/icons'

function applyPalette(svg: string, palette: Record<string, string>): string {
  let next = svg
  Object.keys(palette).forEach((from) => {
    next = next.split(from).join(palette[from])
  })
  return next
}

const tiles: Record<TileType, string> = {
  [TileType.STAR]: applyPalette(sharkStarIcons.tiles[TileType.STAR], {
    '#FFD700': '#FFB7D5',
    '#E6C200': '#E48FB1',
  }),
  [TileType.SHARK]: applyPalette(sharkStarIcons.tiles[TileType.SHARK], {
    '#00BFFF': '#FF69B4',
    '#009ACD': '#DB4A96',
  }),
  [TileType.BAMBOO]: applyPalette(sharkStarIcons.tiles[TileType.BAMBOO], {
    '#90EE90': '#E6B8D7',
    '#228B22': '#B57FA8',
  }),
  [TileType.DOT]: applyPalette(sharkStarIcons.tiles[TileType.DOT], {
    '#FF6347': '#FF91A4',
    '#CD5C5C': '#D9778A',
  }),
  [TileType.CHARACTER]: applyPalette(sharkStarIcons.tiles[TileType.CHARACTER], {
    '#FFB6C1': '#DDA0DD',
    '#FF69B4': '#C586C5',
    '#C71585': '#A85AA4',
  }),
  [TileType.RACKET]: applyPalette(sharkStarIcons.tiles[TileType.RACKET], {
    '#FF4500': '#FF6EB4',
    '#8B0000': '#A93A72',
  }),
  [TileType.MEDAL]: applyPalette(sharkStarIcons.tiles[TileType.MEDAL], {
    '#FFD700': '#FFC0CB',
    '#DAA520': '#D98FA1',
  }),
  [TileType.HEART]: applyPalette(sharkStarIcons.tiles[TileType.HEART], {
    '#DC143C': '#FF1493',
    '#8B0000': '#B0126A',
  }),
  [TileType.PINGPONG]: applyPalette(sharkStarIcons.tiles[TileType.PINGPONG], {
    '#FFFFFF': '#FFF0F5',
    '#D3D3D3': '#E4C9D9',
    '#FFA500': '#FF9BBC',
  }),
}

export const sakuraIcons: ThemeIconSet = {
  tiles,
  tools: {
    ...sharkStarIcons.tools,
  },
}
