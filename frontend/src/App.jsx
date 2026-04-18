import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import useThemeStore from './store/themeStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import QueriesPage from './pages/queries/QueriesPage'
import StudentDetail from './pages/queries/StudentDetail'
import PublicForm from './pages/queries/PublicForm'
import TasksPage from './pages/tasks/TasksPage'
import FinancePage from './pages/finance/FinancePage'
import AdminPage from './pages/admin/AdminPage'

const ProtectedRoute = ({ children, segment, action }) => {
  const { token, can } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (segment && action && !can(segment, action)) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Access denied</div>
  }
  return children
}

export default function App() {
  const { init } = useThemeStore()

  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        className: 'dark:bg-slate-800 dark:text-white text-sm',
        duration: 3000,
        style: { borderRadius: '10px', fontFamily: 'Plus Jakarta Sans, sans-serif' }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public-form" element={<PublicForm />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="queries" element={<ProtectedRoute segment="queries" action="view"><QueriesPage /></ProtectedRoute>} />
          <Route path="queries/:id" element={<ProtectedRoute segment="queries" action="view"><StudentDetail /></ProtectedRoute>} />
          <Route path="tasks" element={<ProtectedRoute segment="tasks" action="view"><TasksPage /></ProtectedRoute>} />
          <Route path="finance" element={<ProtectedRoute segment="finance" action="view"><FinancePage /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
