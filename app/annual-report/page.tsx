import { redirect } from 'next/navigation'

export default function AnnualReportPage() {
    redirect('/analytics?tab=yearly')
}
