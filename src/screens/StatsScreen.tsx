import { useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { CountUp } from '../components/CountUp'
import { Segmented } from '../components/Segmented'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import {
  IconDownload,
  IconRefresh,
  IconTrash,
  IconUpload,
} from '../components/Icons'
import { LESSONS, META, TOTAL } from '../data/catalog'
import { formatPercent, pad2 } from '../lib/format'
import { DIRECTION_META, DIRECTION_ORDER } from '../lib/quiz'
import { navigate } from '../lib/router'
import { dayKey, recentDays, storageAvailable } from '../lib/storage'
import { useStore } from '../store'
import type { DirectionPref, SessionSize } from '../types'

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <i />
    </button>
  )
}

const DIRECTION_OPTIONS: { value: DirectionPref; label: string }[] = [
  { value: 'mix', label: '混合' },
  ...DIRECTION_ORDER.map((direction) => ({
    value: direction as DirectionPref,
    label: DIRECTION_META[direction].short,
  })),
]

export function StatsScreen() {
  const { state, derived, updateSettings, resetProgress, importFromText, exportText } = useStore()
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const days = recentDays(state, 7)
  const peak = Math.max(1, ...days.map((day) => day.stat.answered))
  const mistakes = derived.mistakes

  const onExport = () => {
    try {
      const blob = new Blob([exportText()], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `tango-cho-${dayKey(new Date())}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast('进度已导出')
    } catch {
      toast('导出失败，请换一个浏览器试试')
    }
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    if (importFromText(text)) toast('进度已导入')
    else toast('文件格式不对，导入失败')
  }

  return (
    <div className="screen screen--flush">
      <AppBar title="学习统计" onBack={() => navigate('/')} />

      <main className="stats">
        <section className="stat-strip" aria-label="总览">
          <div>
            <b>
              <CountUp value={derived.studied} />
            </b>
            <span>已学</span>
          </div>
          <div>
            <b>
              <CountUp value={derived.mastered} />
            </b>
            <span>熟练</span>
          </div>
          <div>
            <b>{derived.accuracy ? formatPercent(derived.accuracy) : '—'}</b>
            <span>正确率</span>
          </div>
          <div>
            <b>
              <CountUp value={derived.streak} />
              <small>天</small>
            </b>
            <span>连续</span>
          </div>
        </section>

        <section className="block">
          <header className="block__head">
            <h2>近 7 天</h2>
            <span>
              今天 {derived.today.answered} 题 · 正确{' '}
              {derived.today.answered
                ? formatPercent(derived.today.correct / derived.today.answered)
                : '—'}
            </span>
          </header>
          <div className="chart">
            {days.map((day) => {
              const height = Math.max(
                day.stat.answered ? 10 : 3,
                Math.round((day.stat.answered / peak) * 100),
              )
              return (
                <div className="chart__col" key={day.key}>
                  <span className="chart__value">{day.stat.answered || ''}</span>
                  <div className="chart__track">
                    <i
                      className={day.stat.answered ? 'is-active' : ''}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="chart__label">{day.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="block">
          <header className="block__head">
            <h2>各课进度</h2>
            <span>
              熟练 {derived.mastered} / {TOTAL}
            </span>
          </header>
          <div className="lessonbars">
            {LESSONS.map((meta) => {
              const progress = derived.byLesson.get(meta.lesson)
              const ratio = progress?.total ? progress.studied / progress.total : 0
              return (
                <div className="lessonbar" key={meta.lesson}>
                  <span className="lessonbar__no">{pad2(meta.lesson)}</span>
                  <span className="lessonbar__body">
                    <span className="lessonbar__top">
                      <span className="jp">{meta.title}</span>
                      <span>
                        {progress?.studied ?? 0}/{progress?.total ?? meta.count}
                      </span>
                    </span>
                    <span className="lessonbar__track">
                      <i style={{ width: `${ratio * 100}%` }} />
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="block block--row">
          <div>
            <h2>错题本</h2>
            <p className="block__copy">
              {mistakes ? `${mistakes} 个词答错过，重练时错得多的先出现。` : '还没有答错的词。'}
            </p>
          </div>
          <button
            type="button"
            className="ghostbtn ghostbtn--sm"
            onClick={() => navigate('/study?scope=mistakes')}
            disabled={!mistakes}
          >
            错题重练
          </button>
        </section>

        <section className="block">
          <header className="block__head">
            <h2>练习设置</h2>
          </header>

          <div className="setting">
            <div className="setting__label">
              <span>每轮题数</span>
              <small>一轮大约 3〜5 分钟</small>
            </div>
            <Segmented
              ariaLabel="每轮题数"
              value={state.settings.sessionSize}
              options={[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 30, label: '30' },
                { value: 0, label: '全部' },
              ]}
              onChange={(value) => updateSettings({ sessionSize: Number(value) as SessionSize })}
            />
          </div>

          <div className="setting setting--stack">
            <div className="setting__label">
              <span>出题方向</span>
              <small>「混合」每道题在四种问法里随机</small>
            </div>
            <div className="chips chips--wrap" role="group" aria-label="出题方向">
              {DIRECTION_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`chip${state.settings.direction === option.value ? ' is-on' : ''}`}
                  aria-pressed={state.settings.direction === option.value}
                  onClick={() => updateSettings({ direction: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting">
            <div className="setting__label">
              <span>答题后自动发音</span>
              <small>需要设备自带日语语音</small>
            </div>
            <Switch
              label="答题后自动发音"
              checked={state.settings.autoSpeak}
              onChange={(next) => updateSettings({ autoSpeak: next })}
            />
          </div>

          <div className="setting">
            <div className="setting__label">
              <span>词表显示罗马音</span>
              <small>由假名自动转写</small>
            </div>
            <Switch
              label="词表显示罗马音"
              checked={state.settings.romaji}
              onChange={(next) => updateSettings({ romaji: next })}
            />
          </div>
        </section>

        <section className="block">
          <header className="block__head">
            <h2>数据</h2>
            <span>{storageAvailable ? '保存在本机浏览器' : '当前环境无法保存'}</span>
          </header>
          <div className="data-actions">
            <button type="button" className="ghostbtn ghostbtn--sm" onClick={onExport}>
              <IconDownload size={16} /> 导出进度
            </button>
            <button
              type="button"
              className="ghostbtn ghostbtn--sm"
              onClick={() => fileRef.current?.click()}
            >
              <IconUpload size={16} /> 导入进度
            </button>
            <button
              type="button"
              className="ghostbtn ghostbtn--sm ghostbtn--danger"
              onClick={() => setConfirmReset(true)}
            >
              <IconTrash size={16} /> 重置
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                void onImportFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </section>

        <section className="about">
          <p>{META.title}</p>
          <p>
            {META.scope} · {TOTAL} 张词卡（原表 578 词，2 处完全重复已合并）
          </p>
          <p className="about__muted">
            复习算法{' '}
            <a
              href="https://github.com/open-spaced-repetition/ts-fsrs"
              target="_blank"
              rel="noreferrer"
            >
              ts-fsrs
            </a>
            {' · '}
            假名罗马音{' '}
            <a href="https://github.com/WaniKani/WanaKana" target="_blank" rel="noreferrer">
              WanaKana
            </a>
            {' · '}
            动效{' '}
            <a href="https://github.com/motiondivision/motion" target="_blank" rel="noreferrer">
              Motion
            </a>
            {' · '}
            单文件打包{' '}
            <a
              href="https://github.com/richardtallent/vite-plugin-singlefile"
              target="_blank"
              rel="noreferrer"
            >
              vite-plugin-singlefile
            </a>
          </p>
        </section>

        {!storageAvailable ? (
          <p className="storage-warn">当前浏览器不允许本地存储，进度只保留在本次会话中。</p>
        ) : null}
      </main>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="重置全部学习进度？"
        description="所有复习记录、正确率和连续天数都会清空，单词本身不受影响。"
        footer={
          <div className="sheet__actions">
            <button type="button" className="ghostbtn" onClick={() => setConfirmReset(false)}>
              取消
            </button>
            <button
              type="button"
              className="pill pill--danger"
              onClick={() => {
                resetProgress()
                setConfirmReset(false)
                toast('全部进度已重置')
              }}
            >
              <IconRefresh size={18} /> 确认重置
            </button>
          </div>
        }
      >
        <p className="sheet__note">建议先导出备份。</p>
      </Sheet>
    </div>
  )
}
