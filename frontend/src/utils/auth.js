import { jwtDecode } from 'jwt-decode'

export const getTokenFromStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export const getUserTypeFromStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userType')
  }
  return null
}

export const removeTokenFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
  }
}

export const decodeToken = (token) => {
  try {
    if (!token) return null
    return jwtDecode(token)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

export const getCurrentUser = () => {
  const token = getTokenFromStorage()
  if (!token || isTokenExpired(token)) {
    removeTokenFromStorage()
    return null
  }
  
  const decoded = decodeToken(token)
  if (!decoded) return null
  
  // JWT claims can have different formats, try all possible claim names
  const studentId = decoded.nameid || 
                   decoded.sub || 
                   decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                   decoded['nameid'] ||
                   decoded['unique_name']
  
  const userType = decoded.role || 
                  decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                  decoded.UserType ||
                  getUserTypeFromStorage()
  
  const email = decoded.email || 
               decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
  
  console.log('Decoded JWT token:', decoded) // Debug log
  console.log('Extracted studentId:', studentId) // Debug log
  
  return {
    id: studentId,
    email: email,
    userType: userType,
    studentId: studentId
  }
}

export const isAuthenticated = () => {
  const token = getTokenFromStorage()
  return token && !isTokenExpired(token)
}

export const requireAuth = (userType = null) => {
  const currentUser = getCurrentUser()
  
  if (!currentUser) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return false
  }
  
  if (userType && currentUser.userType !== userType) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return false
  }
  
  return true
}

export const getAuthHeaders = () => {
  const token = getTokenFromStorage()
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  }
}
