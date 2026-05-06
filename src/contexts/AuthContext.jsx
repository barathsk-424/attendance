import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session && mounted) {
          await fetchUserProfile(session.user.id)
        } else if (mounted) {
          // Check for mock user
          const mock = localStorage.getItem('growthiq_mock_user')
          if (mock) {
            setUser(JSON.parse(mock))
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, institution:institutions(name)')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile not found, maybe it hasn't been created yet
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId)
          return
        }
        throw error
      }

      let teacherData = null
      let studentData = null
      
      if (profile.role === 'teacher') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', profile.email)
          .maybeSingle()
        teacherData = teacher
      } else if (profile.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('*, student_enrollments(*, classes(*))')
          .eq('email', profile.email)
          .maybeSingle()
        studentData = student
      }

      setUser({
        ...profile,
        teacher: teacherData,
        student: studentData
      })
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data.user
  }

  async function signup(email, password, fullName, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })
    if (error) throw error
    
    // We try to create the profile manually just in case the trigger isn't set up
    // In most production apps, this is done via a Supabase trigger (on auth.users insert)
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            full_name: fullName, 
            email: email, 
            role: role 
          }
        ])
        // If it fails with 'already exists' (409/P2002), we ignore it as the trigger likely did its job
        if (profileError && !profileError.message.includes('already exists') && !profileError.code?.includes('23505')) {
          console.warn('Profile creation error (might be handled by trigger):', profileError)
        }
    }
    
    return data.user
  }

  async function mockLogin(email, role) {
    setLoading(true)
    try {
      let userData = null
      
      // 1. Try to find in profiles first
      let query = supabase.from('profiles').select('*').eq('role', role)
      if (email) query = query.eq('email', email)
      const { data: profiles } = await query.limit(1)
      
      if (profiles && profiles.length > 0) {
        userData = { ...profiles[0] }
      } else if (email) {
        // 2. If email provided but no profile, check role-specific tables
        if (role === 'teacher') {
          const { data: teacher } = await supabase.from('teachers').select('*').eq('email', email).maybeSingle()
          if (teacher) {
            userData = { id: `mock-t-${teacher.id}`, email: teacher.email, full_name: teacher.name, role: 'teacher' }
          }
        } else if (role === 'student') {
          const { data: student } = await supabase.from('students').select('*').eq('email', email).maybeSingle()
          if (student) {
            userData = { id: `mock-s-${student.id}`, email: student.email, full_name: student.name, role: 'student' }
          }
        }
      }

      // 3. Last resort: Find ANY user of that role if still no userData
      if (!userData) {
        if (role === 'admin') {
          const { data: adminProf } = await supabase.from('profiles').select('*').eq('role', 'admin').limit(1)
          if (adminProf?.[0]) userData = { ...adminProf[0] }
        } else if (role === 'teacher') {
          const { data: teacher } = await supabase.from('teachers').select('*').limit(1)
          if (teacher?.[0]) userData = { id: `mock-t-${teacher[0].id}`, email: teacher[0].email, full_name: teacher[0].name, role: 'teacher' }
        } else if (role === 'student') {
          const { data: student } = await supabase.from('students').select('*').limit(1)
          if (student?.[0]) userData = { id: `mock-s-${student[0].id}`, email: student[0].email, full_name: student[0].name, role: 'student' }
        }
      }

      if (!userData) throw new Error(`No ${role} records found in database for demo login`)

      // 4. Fetch associated teacher/student details for the final object
      let teacherData = null
      let studentData = null
      
      if (userData.role === 'teacher') {
        const { data: teacher } = await supabase.from('teachers').select('*').eq('email', userData.email).maybeSingle()
        teacherData = teacher
      } else if (userData.role === 'student') {
        const { data: student } = await supabase.from('students').select('*, student_enrollments(*, classes(*))').eq('email', userData.email).maybeSingle()
        studentData = student
      }
      
      const finalUser = { ...userData, teacher: teacherData, student: studentData, isMock: true }
      setUser(finalUser)
      localStorage.setItem('growthiq_mock_user', JSON.stringify(finalUser))
      return finalUser
    } catch (err) {
      console.error('Mock login failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('growthiq_mock_user')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      mockLogin,
      loading, 
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin', 
      isTeacher: user?.role === 'teacher',
      isStudent: user?.role === 'student'
    }}>
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
