import fs from 'fs'
import path from 'path'
import type {
  Report,
  ThreatLevel,
  WeeklyFacts,
  WeeklyAlertRef,
  WeeklyCompetitorChange,
  ThreatMovement,
  WeeklyAnalysis,
} from './types'

const EMPTY_REPORT: Report = {
  report_date: null,
  generated_at: null,
  summary: {
    total_tracked: 0,
    fetched_ok: 0,
    fetch_error: 0,
    has_changes: 0,
    new_alerts: 0,
  },
  competitors: [],
  alerts: [],
}

function readReportFile(fileName: string): Report {
  const filePath = path.join(process.cwd(), 'data', fileName)
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as Report
    // handle empty/stub file
    if (!parsed.competitors) return EMPTY_REPORT
    return parsed
  } catch {
    return EMPTY_REPORT
  }
}

export function getReport(): Report {
  return readReportFile('latest.json')
}

// Read a specific dated report, e.g. getReportByDate('2026-05-24')
export function getReportByDate(date: string): Report {
  // guard against path traversal — only accept YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return EMPTY_REPORT
  return readReportFile(`${date}.json`)
}

function allDailyDates(): string[] {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    return fs
      .readdirSync(dataDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map(f => f.replace('.json', ''))
      .sort()
  } catch {
    return []
  }
}

export function getHistoryDates(): string[] {
  return allDailyDates().reverse()
}

// ─────────────────────────── Weekly aggregation ───────────────────────────
// Natural week = Monday → Sunday. A week is keyed by its Sunday (week-end).

function parseUTC(d: string): Date {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day))
}
function fmtUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}
// Sunday that ends the natural week containing `date`.
function weekEndOf(date: string): string {
  const dt = parseUTC(date)
  const dow = (dt.getUTCDay() + 6) % 7 // 0 = Mon … 6 = Sun
  dt.setUTCDate(dt.getUTCDate() + (6 - dow))
  return fmtUTC(dt)
}
function weekStartOf(weekEnd: string): string {
  const dt = parseUTC(weekEnd)
  dt.setUTCDate(dt.getUTCDate() - 6)
  return fmtUTC(dt)
}

// Distinct natural-week end dates (Sundays) that contain ≥1 daily report,
// newest first.
export function getWeeklyDates(): string[] {
  const set = new Set(allDailyDates().map(weekEndOf))
  return [...set].sort().reverse()
}

export function getLatestWeek(): string | null {
  return getWeeklyDates()[0] ?? null
}

// Fact layer — deterministic rollup of one natural week's daily reports.
export function getWeeklySummary(weekEnd: string): WeeklyFacts {
  const week_start = weekStartOf(weekEnd)
  const days_covered = allDailyDates().filter(d => d >= week_start && d <= weekEnd)

  const changed = new Map<string, WeeklyCompetitorChange>()
  const alerts = new Map<string, WeeklyAlertRef>()
  const threat = new Map<
    string,
    { name: string; first: ThreatLevel; last: ThreatLevel; changedDates: string[]; firstDate: string; lastDate: string }
  >()
  let change_count = 0

  // days_covered is sorted ascending, so earliest-day wins for "first" values.
  for (const date of days_covered) {
    const report = getReportByDate(date)

    for (const c of report.competitors) {
      const t = threat.get(c.id)
      if (!t) {
        threat.set(c.id, {
          name: c.name,
          first: c.threat, last: c.threat,
          firstDate: date, lastDate: date,
          changedDates: c.threat_changed ? [date] : [],
        })
      } else {
        t.last = c.threat
        t.lastDate = date
        if (c.threat_changed) t.changedDates.push(date)
      }

      if (c.has_changes && c.changes.length > 0) {
        change_count += c.changes.length
        const ex = changed.get(c.id)
        if (!ex) {
          changed.set(c.id, {
            id: c.id,
            name: c.name,
            threat: c.threat,
            dates: [date],
            headline: c.key_findings[0] ?? c.changes[0]?.description ?? '',
          })
        } else {
          ex.dates.push(date)
          ex.threat = c.threat // reflect most recent threat level
        }
      }
    }

    for (const a of report.alerts) {
      const key = `${a.competitor_id}::${a.headline}`
      if (!alerts.has(key)) alerts.set(key, { date, alert: a })
    }
  }

  const threat_movements: ThreatMovement[] = []
  for (const [id, t] of threat) {
    if (t.first !== t.last) {
      threat_movements.push({
        competitor_id: id, competitor_name: t.name,
        from: t.first, to: t.last, dates: [t.firstDate, t.lastDate],
      })
    } else if (t.changedDates.length > 0) {
      threat_movements.push({
        competitor_id: id, competitor_name: t.name,
        from: null, to: t.last, dates: t.changedDates,
      })
    }
  }

  const alertList = [...alerts.values()].sort((a, b) => a.date.localeCompare(b.date))

  return {
    week_start,
    week_end: weekEnd,
    days_covered,
    competitors_changed: [...changed.values()],
    alerts: alertList,
    threat_movements,
    change_count,
    alert_count: alertList.length,
  }
}

// Analysis layer — the AI narrative written by the weekly routine, if present.
export function getWeeklyAnalysis(weekEnd: string): WeeklyAnalysis | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekEnd)) return null
  const filePath = path.join(process.cwd(), 'data', 'weekly', `${weekEnd}.json`)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as WeeklyAnalysis
  } catch {
    return null
  }
}
