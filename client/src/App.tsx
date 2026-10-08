import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './features/auth/ProtectedRoute'
import AppShell from './layouts/AppShell'
import Budgets from './pages/Budgets'
import ComingSoon from './pages/ComingSoon'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
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
          <Route path="budgets" element={<Budgets />} />
          <Route path="goals" element={<Goals />} />
          <Route path="analytics" element={<ComingSoon title="Analytics" day="Day 9" />} />
          <Route path="*" element={<NotFound inApp />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}