import fs from 'fs'
import path from 'path'
import type { Report } from './types'

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

export function getReport(): Report {
  const filePath = path.join(process.cwd(), 'data', 'latest.json')
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

export function getHistoryDates(): string[] {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    return fs
      .readdirSync(dataDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse()
  } catch {
    return []
  }
}
