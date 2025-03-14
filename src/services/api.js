import axios from 'axios'

const api = axios.create({
  baseURL: 'http://your-api-url',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const authService = {
  login(credentials) {
    return api.post('/auth/login', credentials)
  },

  sendOtp(userId) {
    return api.post('/auth/send-otp', { userId })
  },

  verifyOtp(userId, otp) {
    return api.post('/auth/verify-otp', { userId, otp })
  }
} 