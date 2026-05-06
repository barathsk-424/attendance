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

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading...</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/" replace />
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />
  }
  return children
}

const Home = () => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth()
  if (isStudent) return <StudentDetail isSelf />
  if (isTeacher) return <TeacherDashboard />
  if (isAdmin) return <Dashboard />
  return <div className="loading-state"><p>Redirecting...</p></div>
}

export default function App() {
  const { user } = useAuth()

  const getRedirectPath = (u) => {
    if (!u) return '/login'
    if (u.role === 'admin' || u.role === 'super_admin') return '/'
    if (u.role === 'teacher') return '/teacher-dashboard'
    if (u.role === 'student') return '/student-dashboard'
    return '/'
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={getRedirectPath(user)} replace /> : <Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<ProtectedRoute role="admin"><Students /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute role="admin"><Teachers /></ProtectedRoute>} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/manage-data" element={<ProtectedRoute role="admin"><ManageData /></ProtectedRoute>} />
          <Route path="/teacher-dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/student-dashboard" element={<ProtectedRoute role="student"><StudentDetail isSelf /></ProtectedRoute>} />
          <Route path="/class-view/:classId" element={<ClassView />} />
          <Route path="/student/:studentId" element={<StudentDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={getRedirectPath(user)} replace />} />
      </Routes>
      {user && <Chatbot />}
    </>
  )
}
