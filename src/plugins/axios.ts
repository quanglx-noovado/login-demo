import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // URL mặc định
  timeout: 10000, // timeout 10s
  headers: {
    'Accept': 'application/json'
  },
  withCredentials: true // Thêm option này nếu cần gửi cookies
})

// Add interceptor để xử lý token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add interceptor để xử lý response
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Xử lý khi token hết hạn
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance 