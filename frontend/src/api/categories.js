import request from './request'

export function listCategories() {
  return request.get('/book-categories')
}

export function createCategory(data) {
  return request.post('/book-categories', data)
}

export function updateCategory(id, data) {
  return request.put(`/book-categories/${id}`, data)
}

export function deleteCategory(id) {
  return request.delete(`/book-categories/${id}`)
}
