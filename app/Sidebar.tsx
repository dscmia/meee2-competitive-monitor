'use client'

import { useState } from 'react'
import type { Competitor, Category, ThreatLevel } from './types'
import { ThreatBadge } from './ThreatBadge'
import styles from './Sidebar.module.css'

const CATS: { key: 'all' | Category; label: string }[] = [
  { key: 'all',          label: '全部' },
  { key: 'orchestrator', label: 'orchestrator' },
  { key: 'workspace',    label: 'workspace' },
  { key: 'comms',        label: 'comms' },
  { key: 'peripheral',   label: 'peripheral' },
]

const THREAT_ORDER: Record<ThreatLevel, number> = {
  crit: 0, hi: 1, md: 2, lo: 3,
}

const ICONS: Record<string, string> = {
  'anthropic-agent-teams':      '🤖',
  'devin':                       '🏗️',
  'factory':                     '🏭',
  'cursor':                      '🖱️',
  'openai-codex':                '⚡',
  'slack-agentforce':            '💬',
  'multica':                     '📋',
  'miro-flow':                   '🌊',
  'langgraph':                   '🔗',
  'github-copilot-workspace':    '🔵',
  'claude-code-desktop':         '💻',
  'linear':                      '📊',
  'notion-ai':                   '📝',
  'claudebar':                   '🍎',
  'zerolimit':                   '💻',
  'replit-agent':                '🔮',
  'microsoft-copilot-studio':    '🔵',
  'zapier-ai':                   '⚡',
}

interface Props {
  competitors: Competitor[]
  summary: { total_tracked: number; fetch_error: number; has_changes: number; new_alerts: number }
  activeId: string | null
  onSelect: (id: string) => void
}

export function Sidebar({ competitors, summary, activeId, onSelect }: Props) {
  const [cat, setCat] = useState<'all' | Category>('all')

  const filtered = competitors
    .filter(c => cat === 'all' || c.category === cat)
    .sort((a, b) => THREAT_ORDER[a.threat] - THREAT_ORDER[b.threat])

  const critCount = competitors.filter(c => c.threat === 'crit').length
  const hiCount   = competitors.filter(c => c.threat === 'hi').length
  const mdCount   = competitors.filter(c => c.threat === 'md').length

  return (
    <aside className={styles.sidebar}>
      {/* stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statN}>{summary.total_tracked}</div>
          <div className={styles.statL}>跟踪</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statN} ${styles.nCrit}`}>{critCount}</div>
          <div className={styles.statL}>严重</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statN} ${styles.nHi}`}>{hiCount}</div>
          <div className={styles.statL}>高威胁</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statN} ${styles.nMd}`}>{mdCount}</div>
          <div className={styles.statL}>中等</div>
        </div>
      </div>

      {/* category tabs */}
      <div className={styles.cats}>
        {CATS.map(c => (
          <button
            key={c.key}
            className={`${styles.catBtn} ${cat === c.key ? styles.catActive : ''}`}
            onClick={() => setCat(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* list */}
      <div className={styles.list}>
        {filtered.map(comp => (
          <button
            key={comp.id}
            className={`${styles.item} ${activeId === comp.id ? styles.itemActive : ''}`}
            onClick={() => onSelect(comp.id)}
          >
            <div className={styles.itemRow1}>
              <span className={styles.itemIcon}>{ICONS[comp.id] ?? '●'}</span>
              <span className={styles.itemName}>{comp.name}</span>
              {comp.has_changes && (
                <span className={styles.changeDot} title="有新变化" />
              )}
            </div>
            <div className={styles.itemDesc}>
              {comp.key_findings[0] ?? '—'}
            </div>
            <div className={styles.itemMeta}>
              <ThreatBadge level={comp.threat} />
              <span className={`${styles.badge} ${styles.badgeCat}`}>
                {comp.category}
              </span>
              {comp.fetch_status === 'error' && (
                <span className={`${styles.badge} ${styles.badgeErr}`}>
                  fetch err
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
