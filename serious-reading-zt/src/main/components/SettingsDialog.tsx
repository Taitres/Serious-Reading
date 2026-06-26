import { useState, useEffect } from 'react'
import type { Settings, TriggerKey, HideActions } from '@/shared/types'
import { TRIGGER_OPTIONS, detectConflicts, DEFAULT_SETTINGS } from '@/shared/constants'
import { saveSettings } from '@/shared/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

const PAGE_KEYS: { key: keyof Settings['page']; label: string }[] = [
  { key: 'arrow', label: '键盘 ←→' },
  { key: 'wheel', label: '滚轮' },
  { key: 'click', label: '点击左右' },
  { key: 'pgupdn', label: 'PageUp/Down' },
  { key: 'space', label: '空格' },
  { key: 'touch', label: '触摸滑动' },
]

export function SettingsDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settings: Settings
  setSettings: (s: Settings) => void
  setTheme: (t: Settings['theme']) => void
}) {
  const [draft, setDraft] = useState<Settings>(props.settings)
  const conflicts = detectConflicts(draft.hide)
  const conflictCount = Object.values(conflicts).filter(Boolean).length

  useEffect(() => { setDraft(props.settings) }, [props.settings, props.open])

  function patch(p: Partial<Settings>) { setDraft({ ...draft, ...p }) }
  function patchReader(p: Partial<Settings['reader']>) { setDraft({ ...draft, reader: { ...draft.reader, ...p } }) }
  function patchPage(p: Partial<Settings['page']>) { setDraft({ ...draft, page: { ...draft.page, ...p } }) }
  function patchHide(p: Partial<HideActions>) { setDraft({ ...draft, hide: { ...draft.hide, ...p } }) }

  function toggleTrigger(group: keyof HideActions, key: TriggerKey) {
    const arr = draft.hide[group]
    patchHide({ [group]: arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key] } as any)
  }

  function save() {
    if (conflictCount > 0) return
    saveSettings(draft)
    props.setSettings(draft)
    // 推送给已打开的阅读窗，实时生效（字号/行高/透明度/触发器等）
    ;(window as any).services?.sendToReader?.('sr:settings', draft)
    props.onOpenChange(false)
  }
  function reset() { setDraft(JSON.parse(JSON.stringify(DEFAULT_SETTINGS))) }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 主题 */}
          <Section title="界面主题">
            <div className="flex gap-2">
              {(['auto', 'light', 'dark'] as const).map((t) => (
                <Button key={t} size="sm" variant={draft.theme === t ? 'default' : 'outline'} onClick={() => { patch({ theme: t }); props.setTheme(t) }}>
                  {t === 'auto' ? '跟随系统' : t === 'light' ? '明亮' : '暗黑'}
                </Button>
              ))}
            </div>
          </Section>

          {/* 阅读外观 */}
          <Section title="阅读外观">
            <div className="grid grid-cols-2 gap-3">
              <Field label="背景色"><input type="color" value={draft.reader.bgColor} onChange={(e) => patchReader({ bgColor: e.target.value })} className="h-9 w-full rounded border" /></Field>
              <Field label="文字色"><input type="color" value={draft.reader.textColor} onChange={(e) => patchReader({ textColor: e.target.value })} className="h-9 w-full rounded border" /></Field>
              <Field label={`透明度 ${Math.round(draft.reader.opacity * 100)}%`}>
                <Slider min={10} max={100} step={5} value={[draft.reader.opacity * 100]} onValueChange={(v) => patchReader({ opacity: v[0] / 100 })} />
              </Field>
              <Field label={`字号 ${draft.reader.fontSize}px`}>
                <Slider min={12} max={32} step={1} value={[draft.reader.fontSize]} onValueChange={(v) => patchReader({ fontSize: v[0] })} />
              </Field>
              <Field label={`行高 ${draft.reader.lineHeight.toFixed(2)}`}>
                <Slider min={1} max={3} step={0.05} value={[draft.reader.lineHeight]} onValueChange={(v) => patchReader({ lineHeight: v[0] })} />
              </Field>
              <Field label="保留换行">
                <Switch checked={draft.reader.keepFormat} onCheckedChange={(v) => patchReader({ keepFormat: v })} />
              </Field>
            </div>
          </Section>

          {/* 窗口 */}
          <Section title="窗口">
            <div className="grid grid-cols-4 gap-2">
              <Field label="宽"><Input type="number" value={draft.window.width} onChange={(e) => patch({ window: { ...draft.window, width: +e.target.value || 520 } })} /></Field>
              <Field label="高"><Input type="number" value={draft.window.height} onChange={(e) => patch({ window: { ...draft.window, height: +e.target.value || 780 } })} /></Field>
              <Field label="X(−1=默认)"><Input type="number" value={draft.window.x} onChange={(e) => patch({ window: { ...draft.window, x: +e.target.value } })} /></Field>
              <Field label="Y(−1=默认)"><Input type="number" value={draft.window.y} onChange={(e) => patch({ window: { ...draft.window, y: +e.target.value } })} /></Field>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">阅读窗可见时可原地拖动边缘缩放、拖拽移动，无需在此修改。</p>
          </Section>

          {/* 翻页 */}
          <Section title="翻页方式">
            <div className="flex flex-wrap gap-3">
              {PAGE_KEYS.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={draft.page[p.key]} onCheckedChange={(v) => patchPage({ [p.key]: !!v } as any)} />
                  {p.label}
                </label>
              ))}
            </div>
          </Section>

          {/* 隐藏动作（三功能 · 冲突检测） */}
          <Section title="隐藏 / 伪装（三功能可自定义绑定）">
            {(['stealthHide', 'stealthShow', 'realHide'] as const).map((g) => (
              <div key={g} className="mb-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {g === 'stealthHide' ? '隐身（显→隐）' : g === 'stealthShow' ? '显示（隐→显）' : '真隐藏（彻底消失，命令恢复）'}
                </div>
                <div className="flex flex-wrap gap-3">
                  {TRIGGER_OPTIONS.map((o) => (
                    <label key={o.key} className={`flex items-center gap-1.5 rounded px-1 text-sm ${conflicts[o.key] ? 'text-destructive' : ''}`}>
                      <Checkbox checked={draft.hide[g].includes(o.key)} onCheckedChange={() => toggleTrigger(g, o.key)} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {conflictCount > 0 && (
              <p className="text-sm font-medium text-destructive">⚠ 触发动作冲突：{Object.entries(conflicts).filter(([,v]) => v).map(([k,v]) => `${k}(${v})`).join('、')}，每个动作只能绑一个功能。</p>
            )}
          </Section>

          {/* 自动翻页 */}
          <Section title="自动翻页">
            <Field label={`间隔 ${draft.autoPage.interval}s（0=关闭）`}>
              <Slider min={0} max={120} step={1} value={[draft.autoPage.interval]} onValueChange={(v) => setDraft({ ...draft, autoPage: { ...draft.autoPage, interval: v[0] } })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.autoPage.pauseOnStealth} onCheckedChange={(v) => setDraft({ ...draft, autoPage: { ...draft.autoPage, pauseOnStealth: v } })} />
              stealth 隐藏时自动暂停
            </label>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={reset}>恢复默认</Button>
          <Button onClick={save} disabled={conflictCount > 0}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">{title}</div>
      {children}
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}