import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './features/auth/ProtectedRoute'
import AppShell from './layouts/AppShell'
import AuthPage from './pages/AuthPage'
import ComingSoon from './pages/ComingSoon'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<ComingSoon title="Transactions" day="Day 5" />} />
          <Route path="budgets" element={<ComingSoon title="Budgets" day="Day 8" />} />
          <Route path="goals" element={<ComingSoon title="Goals & Savings" day="Day 8" />} />
          <Route path="analytics" element={<ComingSoon title="Analytics" day="Day 7" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}