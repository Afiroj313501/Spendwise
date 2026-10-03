import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './features/auth/ProtectedRoute'
import AppShell from './layouts/AppShell'
import ComingSoon from './pages/ComingSoon'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
      <Route path="/register" element={<Navigate to="/?auth=register" replace />} />

      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<ComingSoon title="Budgets" day="Day 8" />} />
          <Route path="goals" element={<ComingSoon title="Goals & Savings" day="Day 8" />} />
          <Route path="analytics" element={<ComingSoon title="Analytics" day="Day 7" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}