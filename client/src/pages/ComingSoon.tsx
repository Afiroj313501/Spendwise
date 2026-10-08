import Card from '../components/ui/Card'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function ComingSoon({ title, day }: { title: string; day: string }) {
  useDocumentTitle(title)
  return (
    <div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <Card className="mt-6 text-slate-500">This page gets built on {day}.</Card>
    </div>
  )
}