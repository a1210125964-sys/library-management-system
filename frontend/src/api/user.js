import request from './request'

export function getDashboard() {
  return request.get('/user/dashboard')
}

export function getBorrowings() {
  return request.get('/user/borrowings')
}

export function getHistory({ page = 0, size = 10, status } = {}) {
  const params = { page, size }
  if (status) params.status = status
  return request.get('/user/history', { params })
}

export function getFines() {
  return request.get('/user/fines')
}

export function getProfile() {
  return request.get('/user/profile')
}

export function updateProfile(data) {
  return request.put('/user/profile', data)
}
