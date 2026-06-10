import { notFound } from 'next/navigation'
import { getReportByDate, getHistoryDates } from '../../data'
import { DashboardClient } from '../../DashboardClient'

// Static export — every dated report becomes its own pre-rendered page.
export const dynamic = 'force-static'
export const revalidate = false

// Pre-render one page per archived report date.
export function generateStaticParams() {
  return getHistoryDates().map(date => ({ date }))
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  const report = getReportByDate(date)
  if (!report.report_date) notFound()

  const historyDates = getHistoryDates()
  return (
    <DashboardClient
      report={report}
      historyDates={historyDates}
      currentDate={date}
    />
  )
}
