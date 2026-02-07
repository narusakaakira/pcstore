import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize auth from localStorage
    try {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      const savedRoles = localStorage.getItem('roles')
      
      if (savedToken && savedUser && savedToken !== 'undefined' && savedUser !== 'undefined') {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        setRoles(savedRoles && savedRoles !== 'undefined' ? JSON.parse(savedRoles) : [])
      }
    } catch (err) {
      // Clear corrupted localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('roles')
    }
    
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        username,
        password,
      })
      const { access_token, user } = response.data
      const roles = user.roles
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('roles', JSON.stringify(roles))
      
      setToken(access_token)
      setUser(user)
      setRoles(roles)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        username,
        email,
        password,
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('roles')
    
    setToken(null)
    setUser(null)
    setRoles([])
  }

  const hasRole = (role) => {
    return roles.includes(role)
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{
      user,
      token,
      roles,
      loading,
      login,
      register,
      logout,
      hasRole,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
