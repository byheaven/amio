import { TileType } from '../../../constants/game'
import type { ThemeIconSet } from '../../types'

const tiles: Record<TileType, string> = {
  [TileType.STAR]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD700" stroke="#E6C200" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  [TileType.SHARK]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 14C22 14 19 14 18 11C18 11 15 13 13 13C11 13 10 11 10 11C10 11 7 13 4 13C2 13 2 17 2 17C2 17 6 19 12 19C18 19 22 17 22 17V14Z" fill="#00BFFF" stroke="#009ACD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="15" cy="14" r="1" fill="white"/><path d="M10 8L12 11H8L10 8Z" fill="#00BFFF" stroke="#009ACD" stroke-width="1"/></svg>',
  [TileType.BAMBOO]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="4" width="6" height="16" rx="1" fill="#90EE90" stroke="#228B22" stroke-width="2"/><path d="M9 10H15" stroke="#228B22" stroke-width="2"/><path d="M9 14H15" stroke="#228B22" stroke-width="2"/><path d="M10 4V2M14 4V2" stroke="#228B22" stroke-width="2" stroke-linecap="round"/></svg>',
  [TileType.DOT]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="#FF6347" stroke="#CD5C5C" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="white"/></svg>',
  [TileType.CHARACTER]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/><path d="M8 8H16M12 8V16M8 16H16" stroke="#C71585" stroke-width="2" stroke-linecap="round"/></svg>',
  [TileType.RACKET]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="10" r="6" fill="#FF4500" stroke="#8B0000" stroke-width="2"/><path d="M12 16V22" stroke="#8B0000" stroke-width="3" stroke-linecap="round"/><path d="M10 22H14" stroke="#8B0000" stroke-width="3" stroke-linecap="round"/></svg>',
  [TileType.MEDAL]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="14" r="5" fill="#FFD700" stroke="#DAA520" stroke-width="2"/><path d="M12 14L9 4H15L12 14Z" fill="#DAA520" stroke="#DAA520" stroke-width="1"/><path d="M8 4L7 2H17L16 4" stroke="#DAA520" stroke-width="2"/></svg>',
  [TileType.HEART]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#DC143C" stroke="#8B0000" stroke-width="2"/></svg>',
  [TileType.PINGPONG]: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#FFFFFF" stroke="#D3D3D3" stroke-width="1"/><circle cx="12" cy="12" r="7" stroke="#FFA500" stroke-width="1"/></svg>',
}

const tools: ThemeIconSet['tools'] = {
  undo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>',
  pop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>',
  shuffle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>',
}

export const sharkStarIcons: ThemeIconSet = {
  tiles,
  tools,
}
