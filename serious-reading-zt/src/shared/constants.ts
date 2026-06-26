import type { Settings, TriggerKey } from './types'

/** 存储键前缀 */
export const DB_PREFIX = 'serious_reading/'

/** 触发动作的可选项（用于设置面板勾选） */
export const TRIGGER_OPTIONS: { key: TriggerKey; label: string }[] = [
  { key: 'dblclick', label: '双击' },
  { key: 'middleClick', label: '中键' },
  { key: 'rightClick', label: '右键' },
  { key: 'escape', label: 'Esc' },
  { key: 'mouseleave', label: '鼠标离开边缘' },
  { key: 'mouseenter', label: '鼠标进入边缘' },
]

/** 三功能之间的冲突判定：同一触发键不能被多个功能同时启用 */
export function detectConflicts(hide: Settings['hide']): Record<TriggerKey, string | null> {
  const assigned: Record<string, string> = {}
  for (const k of hide.stealthHide) assigned[k] = assigned[k] ? assigned[k] + '/隐身' : '隐身'
  for (const k of hide.stealthShow) assigned[k] = assigned[k] ? assigned[k] + '/显示' : '显示'
  for (const k of hide.realHide) assigned[k] = assigned[k] ? assigned[k] + '/真隐藏' : '真隐藏'
  const out = {} as Record<TriggerKey, string | null>
  for (const k of Object.keys(assigned) as TriggerKey[]) {
    out[k] = assigned[k].includes('/') ? assigned[k] : null
  }
  return out
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  window: { width: 520, height: 780, x: -1, y: -1 },
  reader: {
    bgColor: '#f5f5f5',
    textColor: '#1a1a1a',
    opacity: 1,
    fontSize: 17,
    lineHeight: 1.85,
    fontFamily: 'default',
    keepFormat: false,
  },
  page: { arrow: true, wheel: true, click: true, pgupdn: true, space: false, touch: true },
  hide: {
    stealthHide: ['escape', 'dblclick', 'mouseleave'],
    stealthShow: ['middleClick'],
    realHide: ['rightClick'],
  },
  autoPage: { interval: 0, pauseOnStealth: true },
}

export const SUPPORTED_EXTS = ['txt', 'epub', 'pdf']