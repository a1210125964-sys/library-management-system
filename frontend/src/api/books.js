import request from './request'

export function listBooks({ page = 0, size = 10, keyword = '', all = false } = {}) {
  return request.get('/books', { params: { page, size, keyword, all: all ? 'true' : undefined } })
}

export function createBook(data) {
  return request.post('/books', data)
}

export function updateBook(id, data) {
  return request.put(`/books/${id}`, data)
}

export function deleteBook(id) {
  return request.delete(`/books/${id}`)
}

export function shelveBook(id, active) {
  return request.put(`/books/${id}/shelve`, null, { params: { active } })
}

export function getBook(id) {
  return request.get(`/books/${id}`)
}
