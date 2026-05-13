'use client'

import type { Competitor } from './types'
import { ThreatBadge, threatColor } from './ThreatBadge'
import styles from './Detail.module.css'

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

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={styles.scoreCard}>
      <div className={styles.scoreName}>{label}</div>
      <div className={styles.scoreBarBg}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <div className={styles.scoreVal} style={{ color }}>{value}%</div>
    </div>
  )
}

interface Props {
  competitor: Competitor | null
}

export function Detail({ competitor: c }: Props) {
  if (!c) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyGlyph}>◈</div>
        <div className={styles.emptyText}>click a competitor to inspect</div>
      </div>
    )
  }

  const color = threatColor(c.threat)
  const domainOf = (url: string) => {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  }

  return (
    <div className={styles.body}>
      {/* header */}
      <div className={styles.head}>
        <div className={styles.headIcon}>{ICONS[c.id] ?? '●'}</div>
        <div className={styles.headText}>
          <div className={styles.headTitle}>{c.name}</div>
          {c.has_changes && (
            <div className={styles.changedPill}>新变化</div>
          )}
          {c.fetched_urls.length > 0 && (
            <div className={styles.headLinks}>
              {c.fetched_urls.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.headLink}
                >
                  ↗ {domainOf(url)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      {/* threat */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>威胁评估</div>
        <div className={styles.threatRow}>
          <ThreatBadge level={c.threat} large />
          <span className={styles.catChip}>{c.category}</span>
          {c.threat_changed && (
            <span className={styles.changedChip}>⬆ 等级变化</span>
          )}
          {c.fetch_status === 'error' && (
            <span className={styles.errChip}>fetch 失败</span>
          )}
        </div>
      </section>

      {/* scores — only if we have changes data to derive them */}
      {c.changes.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>相似度评分</div>
          <div className={styles.scores}>
            <ScoreBar
              label="功能相似度"
              value={Math.min(95, 40 + c.changes.filter(ch => ch.threat_signal).length * 15)}
              color={color}
            />
            <ScoreBar
              label="目标用户重叠"
              value={Math.min(90, 35 + c.changes.length * 10)}
              color={color}
            />
          </div>
        </section>
      )}

      {/* changes */}
      {c.has_changes && c.changes.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>本次变化</div>
          <div className={styles.changes}>
            {c.changes.map((ch, i) => (
              <div key={i} className={styles.change}>
                <div className={styles.changeHeader}>
                  <span className={styles.changeType}>{ch.type}</span>
                  {ch.threat_signal && (
                    <span className={styles.threatSignal}>⚠ meee2 相关</span>
                  )}
                </div>
                <div className={styles.changeDesc}>{ch.description}</div>
                <blockquote className={styles.evidence}>{ch.evidence}</blockquote>
                {ch.meee2_relevance && (
                  <div className={styles.relevance}>锚点：{ch.meee2_relevance}</div>
                )}
                <a
                  href={ch.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  {domainOf(ch.source_url)} ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* key findings */}
      {c.key_findings.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>关键发现</div>
          <div className={styles.findings}>
            {c.key_findings.map((f, i) => (
              <div key={i} className={styles.finding}>
                <span className={styles.findingArrow}>→</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* no change */}
      {!c.has_changes && c.no_change_reason && (
        <section className={styles.section}>
          <div className={styles.noChange}>{c.no_change_reason}</div>
        </section>
      )}

      {/* last seen */}
      {c.last_seen_at && (
        <div className={styles.lastSeen}>
          最后抓取：{new Date(c.last_seen_at).toLocaleString('zh-CN', {
            month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </div>
      )}
    </div>
  )
}
