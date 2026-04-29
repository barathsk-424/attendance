import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const AuthContext = createContext(null)

// Demo credentials for hackathon
const DEMO_ACCOUNTS = {
  'admin@growthiq.edu': { password: 'admin123', role: 'admin', name: 'System Administrator' },
  'ramesh@greenfield.edu': { password: 'teacher123', role: 'teacher', name: 'Dr. Ramesh Kumar', teacher_id: 'd1a00001-0000-4000-c000-000000000001' },
  'priya@greenfield.edu': { password: 'teacher123', role: 'teacher', name: 'Ms. Priya Sharma', teacher_id: 'd1a00001-0000-4000-c000-000000000002' },
  'arjun@greenfield.edu': { password: 'teacher123', role: 'teacher', name: 'Mr. Arjun Mehta', teacher_id: 'd1a00001-0000-4000-c000-000000000003' },
  'lakshmi@greenfield.edu': { password: 'teacher123', role: 'teacher', name: 'Mrs. Lakshmi Iyer', teacher_id: 'd1a00001-0000-4000-c000-000000000004' },
  'vikram@greenfield.edu': { password: 'teacher123', role: 'teacher', name: 'Mr. Vikram Singh', teacher_id: 'd1a00001-0000-4000-c000-000000000005' },
  'sunita@greenfield.edu': { password: 'teacher123', role: 'teacher', name: 'Dr. Sunita Patel', teacher_id: 'd1a00001-0000-4000-c000-000000000006' },
  'rajesh@sunrise.edu': { password: 'teacher123', role: 'teacher', name: 'Mr. Rajesh Verma', teacher_id: 'd1a00001-0000-4000-c000-000000000007' },
  'anita@sunrise.edu': { password: 'teacher123', role: 'teacher', name: 'Ms. Anita Desai', teacher_id: 'd1a00001-0000-4000-c000-000000000008' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('growthiq_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('growthiq_user') }
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const account = DEMO_ACCOUNTS[email.toLowerCase()]
    if (!account) throw new Error('Account not found')
    if (account.password !== password) throw new Error('Invalid password')

    let teacherData = null
    if (account.role === 'teacher' && account.teacher_id) {
      const { data } = await supabase
        .from('teachers')
        .select('*, institution:institutions(name)')
        .eq('id', account.teacher_id)
        .single()
      teacherData = data
    }

    const userData = {
      email: email.toLowerCase(),
      name: account.name,
      role: account.role,
      teacher_id: account.teacher_id || null,
      teacher: teacherData,
    }
    setUser(userData)
    localStorage.setItem('growthiq_user', JSON.stringify(userData))
    return userData
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('growthiq_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin', isTeacher: user?.role === 'teacher' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
