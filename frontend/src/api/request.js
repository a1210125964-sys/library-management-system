import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach X-Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['X-Token'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: normalize response & handle 401
request.interceptors.response.use(
  (response) => {
    const data = response.data
    // Handle AdminController's raw Map format: { message, data, pagination }
    if (data && 'message' in data && !('code' in data)) {
      return {
        code: 'SUCCESS',
        message: data.message || '',
        data: data.data ?? data,
        pagination: data.pagination || null,
      }
    }
    // Handle ApiResponse format: { code, message, data, pagination }
    return data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        ElMessage.error('登录已失效，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error('权限不足')
      } else {
        const msg = data?.message || data?.msg || '请求失败'
        ElMessage.error(msg)
      }
    } else {
      ElMessage.error('网络异常，请检查连接')
    }
    return Promise.reject(error)
  }
)

export default request
