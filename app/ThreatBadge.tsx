import type { ThreatLevel } from './types'

const CONFIG: Record<ThreatLevel, { label: string; cls: string }> = {
  crit: { label: '严重威胁', cls: 'badge-crit' },
  hi:   { label: '高威胁',   cls: 'badge-hi'   },
  md:   { label: '中等',     cls: 'badge-md'   },
  lo:   { label: '低威胁',   cls: 'badge-lo'   },
}

export function ThreatBadge({
  level,
  large = false,
}: {
  level: ThreatLevel
  large?: boolean
}) {
  const { label, cls } = CONFIG[level]
  return (
    <span
      className={`badge ${cls}`}
      style={large ? { fontSize: 12, padding: '5px 12px' } : undefined}
    >
      {label}
    </span>
  )
}

export function threatColor(level: ThreatLevel) {
  return {
    crit: '#f04040',
    hi:   '#e8a020',
    md:   '#8888a0',
    lo:   '#30b870',
  }[level]
}
