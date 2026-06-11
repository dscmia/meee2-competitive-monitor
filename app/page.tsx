import { getReport, getHistoryDates, getLatestWeek } from './data'
import { DashboardClient } from './DashboardClient'

// Re-build every time Vercel deploys (triggered by git push from Routine)
export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  const report = getReport()
  const historyDates = getHistoryDates()
  const latestWeek = getLatestWeek()

  return (
    <DashboardClient
      report={report}
      historyDates={historyDates}
      latestWeek={latestWeek}
    />
  )
}
