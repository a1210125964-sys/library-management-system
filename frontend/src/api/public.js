import request from './request'

export function getPublicStats() {
  return request.get('/public/stats')
}

export function listPublicNotices({ page = 0, size = 10 } = {}) {
  return request.get('/public/notices', { params: { page, size } })
}

export function getPublicNoticeDetail(id) {
  return request.get(`/public/notices/${id}`)
}

export function listPublicBooks({ page = 0, size = 10, keyword = '' } = {}) {
  return request.get('/public/books', { params: { page, size, keyword } })
}
