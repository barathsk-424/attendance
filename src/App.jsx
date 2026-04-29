import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Chatbot from './components/Chatbot'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Performance from './pages/Performance'
import Predictions from './pages/Predictions'
import Alerts from './pages/Alerts'
import Teachers from './pages/Teachers'
import TeacherDashboard from './pages/TeacherDashboard'
import ClassView from './pages/ClassView'
import StudentDetail from './pages/StudentDetail'
import Mentorship from './pages/Mentorship'
import ManageData from './pages/ManageData'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading...</p></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/' : '/teacher-dashboard'} replace /> : <Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/manage-data" element={<ManageData />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/class-view/:classId" element={<ClassView />} />
          <Route path="/student/:studentId" element={<StudentDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
      {user && <Chatbot />}
    </>
  )
}
