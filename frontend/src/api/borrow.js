import request from './request'

export function borrowBook(bookId, dueTime) {
  return request.post(`/borrow/${bookId}`, dueTime ? { dueTime } : {})
}

export function returnBook(recordId) {
  return request.post(`/borrow/return/${recordId}`)
}

export function renewBook(recordId, dueTime) {
  return request.post(`/borrow/renew/${recordId}`, dueTime ? { dueTime } : {})
}

export function getMyBorrowings() {
  return request.get('/borrow/my')
}

export function getMyOverdues() {
  return request.get('/borrow/my-overdue')
}
