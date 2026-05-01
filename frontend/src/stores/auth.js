import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const refreshToken = ref('')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function initFromStorage() {
    const savedToken = localStorage.getItem('token')
    const savedRefresh = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')
    if (savedToken) token.value = savedToken
    if (savedRefresh) refreshToken.value = savedRefresh
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        user.value = null
      }
    }
  }

  function persist() {
    localStorage.setItem('token', token.value)
    localStorage.setItem('refreshToken', refreshToken.value)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function login(credentials) {
    const res = await loginApi(credentials)
    const data = res.data
    token.value = data.accessToken || data.token
    refreshToken.value = data.refreshToken || ''
    user.value = {
      id: data.id,
      username: data.username,
      realName: data.realName,
      role: data.role,
      phone: data.phone,
      idCard: data.idCard,
    }
    persist()
    return user.value
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    initFromStorage,
    login,
    logout,
  }
})
