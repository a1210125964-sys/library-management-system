import request from './request'

export function getStats() {
  return request.get('/admin/stats')
}

export function listUsers({ page = 0, size = 10, role = '' } = {}) {
  return request.get('/admin/users', { params: { page, size, role } })
}

export function resetPassword(userId, newPassword) {
  return request.post(`/admin/users/${userId}/reset-password`, { newPassword })
}

export function listLogs({ page = 0, size = 10, operation = '', startTime = '', endTime = '' } = {}) {
  return request.get('/admin/logs', { params: { page, size, operation, startTime, endTime } })
}

export function listNotices({ page = 0, size = 10 } = {}) {
  return request.get('/admin/notices', { params: { page, size } })
}

export function createNotice(data) {
  return request.post('/admin/notices', data)
}

export function updateNotice(id, data) {
  return request.put(`/admin/notices/${id}`, data)
}

export function deleteNotice(id) {
  return request.delete(`/admin/notices/${id}`)
}

export function publishNotice(id) {
  return request.post(`/admin/notices/${id}/publish`)
}

export function getConfigs() {
  return request.get('/admin/configs')
}

export function updateConfigs(data) {
  return request.put('/admin/configs', data)
}

export function listRecords({ page = 0, size = 10, status = '', keyword = '' } = {}) {
  return request.get('/admin/records', { params: { page, size, status, keyword } })
}

export function scanOverdue() {
  return request.post('/borrow/scan-overdue')
}

export function updateUserRole(userId, role) {
  return request.put(`/admin/users/${userId}/role`, { role })
}

export function listOverdueRecords({ page = 0, size = 10 } = {}) {
  return request.get('/admin/overdue-records', { params: { page, size } })
}

export function getOverdueStats() {
  return request.get('/admin/overdue-stats')
}
