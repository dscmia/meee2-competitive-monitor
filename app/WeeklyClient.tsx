'use client'

import type { WeeklyFacts, WeeklyAnalysis, ThreatLevel } from './types'
import { ThreatBadge } from './ThreatBadge'
import styles from './weekly.module.css'

interface Props {
  facts: WeeklyFacts
  analysis: WeeklyAnalysis | null
  weeks: string[]
  currentWeek: string
}

const PRIO_LABEL: Record<'hi' | 'md' | 'lo', string> = {
  hi: '高', md: '中', lo: '低',
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export function WeeklyClient({ facts, analysis, weeks, currentWeek }: Props) {
  const range = `${facts.week_start} ~ ${facts.week_end}`

  return (
    <div className={styles.shell}>
      {/* topbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <div className={styles.brand}>
            meee<span className={styles.brandAccent}>2</span>
            <span className={styles.brandSep}>·</span>
            <span className={styles.brandSub}>竞品周报</span>
          </div>
          <div className={styles.topDate}>{range}</div>
        </div>
        <div className={styles.topRight}>
          <a href="/" className={styles.navLink}>← 日报</a>
          {weeks.length > 0 && (
            <select
              className={styles.weekSelect}
              value={currentWeek}
              onChange={e => { window.location.href = `/weekly/${e.target.value}` }}
            >
              {weeks.map(w => (
                <option key={w} value={w}>{w} 周</option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className={styles.scroll}>
        <div className={styles.page}>
          {/* ───── 上半:本周事实(确定性) ───── */}
          <section className={styles.factLayer}>
            <div className={styles.layerHead}>
              <span className={styles.layerTitle}>本周事实</span>
              <span className={styles.layerTag}>确定性聚合 · 每条可回溯到当天日报</span>
            </div>

            {/* stat row */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statN}>{facts.days_covered.length}</div>
                <div className={styles.statL}>覆盖天数</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statN}>{facts.competitors_changed.length}</div>
                <div className={styles.statL}>有变化竞品</div>
              </div>
              <div className={styles.stat}>
                <div className={`${styles.statN} ${facts.alert_count > 0 ? styles.nAlert : ''}`}>
                  {facts.alert_count}
                </div>
                <div className={styles.statL}>合并 alerts</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statN}>{facts.threat_movements.length}</div>
                <div className={styles.statL}>威胁变动</div>
              </div>
            </div>

            {facts.days_covered.length === 0 && (
              <div className={styles.empty}>本周暂无日报数据</div>
            )}

            {/* threat movements */}
            {facts.threat_movements.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockLabel}>威胁等级变动</div>
                <div className={styles.moveList}>
                  {facts.threat_movements.map(m => (
                    <div key={m.competitor_id} className={styles.moveRow}>
                      <span className={styles.moveName}>{m.competitor_name}</span>
                      <span className={styles.moveArrow}>
                        {m.from && <ThreatBadge level={m.from as ThreatLevel} />}
                        <span className={styles.arrow}>→</span>
                        <ThreatBadge level={m.to} />
                      </span>
                      <span className={styles.moveDates}>
                        {m.dates.map(d => (
                          <a key={d} href={`/history/${d}`} className={styles.dateLink}>{d}</a>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* merged alerts */}
            {facts.alerts.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockLabel}>本周合并 alerts</div>
                <div className={styles.alertList}>
                  {facts.alerts.map((ref, i) => (
                    <div key={i} className={styles.alertRow}>
                      <div className={styles.alertTop}>
                        <ThreatBadge level={ref.alert.severity} />
                        <span className={styles.alertName}>{ref.alert.competitor_name}</span>
                        <a href={`/history/${ref.date}`} className={styles.dateLink}>{ref.date}</a>
                      </div>
                      <div className={styles.alertHeadline}>{ref.alert.headline}</div>
                      {ref.alert.evidence && (
                        <blockquote className={styles.evidence}>{ref.alert.evidence}</blockquote>
                      )}
                      {ref.alert.action_suggestion && (
                        <div className={styles.action}>💡 {ref.alert.action_suggestion}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* competitors with changes */}
            {facts.competitors_changed.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockLabel}>
                  有变化竞品 · 共 {facts.change_count} 条变化
                </div>
                <div className={styles.changedList}>
                  {facts.competitors_changed.map(c => (
                    <div key={c.id} className={styles.changedRow}>
                      <ThreatBadge level={c.threat} />
                      <span className={styles.changedName}>{c.name}</span>
                      <span className={styles.changedHeadline}>{c.headline}</span>
                      <span className={styles.moveDates}>
                        {c.dates.map(d => (
                          <a key={d} href={`/history/${d}`} className={styles.dateLink}>{d}</a>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ───── 下半:分析师视角(AI) ───── */}
          <section className={styles.aiLayer}>
            <div className={styles.layerHead}>
              <span className={styles.layerTitle}>分析师视角</span>
              <span className={`${styles.layerTag} ${styles.aiTag}`}>
                AI 综述 · 基于上方事实,非新抓取
              </span>
            </div>

            {analysis ? (
              <>
                <div className={styles.narrative}>{analysis.narrative}</div>

                {analysis.recommendations.length > 0 && (
                  <div className={styles.block}>
                    <div className={styles.blockLabel}>给 meee2 团队的建议</div>
                    <div className={styles.recList}>
                      {analysis.recommendations.map((r, i) => (
                        <div key={i} className={styles.recRow}>
                          <span className={`${styles.prio} ${styles['prio_' + r.priority]}`}>
                            {PRIO_LABEL[r.priority]}
                          </span>
                          <div className={styles.recBody}>
                            <div className={styles.recHead}>{r.headline}</div>
                            <div className={styles.recDetail}>{r.detail}</div>
                            {r.basis && <div className={styles.recBasis}>依据:{r.basis}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.aiMeta}>
                  AI 综述生成于 {new Date(analysis.generated_at).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </>
            ) : (
              <div className={styles.aiPending}>
                本周 AI 综述待生成 —— 每周 routine 运行后会写入
                <code>data/weekly/{currentWeek}.json</code>,上方事实层不受影响。
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
